#!/usr/bin/env bash
# One-shot, repeatable deploy for InfraWatch AI.
# Idempotent: safe to run many times. See deploy.ps1 for the Windows version.
#
# Usage:
#   ./deploy.sh              build, start, verify (keeps data)
#   ./deploy.sh -f|--fresh   DELETE ALL DATA and re-seed (asks to confirm)
#   ./deploy.sh -f -y        same, without confirmation (CI)

set -euo pipefail

cd "$(dirname "$0")"

FRONTEND_PORT=3000
BACKEND_PORT=8080
ML_PORT=8000
DB_PORT=3307

FRESH=0
ASSUME_YES=0
for arg in "$@"; do
  case "$arg" in
    -f|--fresh) FRESH=1 ;;
    -y|--yes)   ASSUME_YES=1 ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

step() { printf '\n==> %s\n' "$1"; }
ok()   { printf '    [ok]   %s\n' "$1"; }
warn() { printf '    [warn] %s\n' "$1"; }
fail() { printf '    [FAIL] %s\n' "$1"; }

# Poll until a probe succeeds or the timeout expires.
wait_for() {
  local name="$1" timeout="$2"; shift 2
  local deadline=$(( $(date +%s) + timeout ))
  while [ "$(date +%s)" -lt "$deadline" ]; do
    if eval "$@" >/dev/null 2>&1; then ok "$name is up"; return 0; fi
    sleep 3
  done
  fail "$name did not become healthy within ${timeout}s"
  return 1
}

step "Preflight"

command -v docker >/dev/null 2>&1 || { fail "docker not found on PATH"; exit 1; }
docker info >/dev/null 2>&1 || { fail "Docker daemon is not running."; exit 1; }
ok "Docker is running"

if [ ! -f .env ]; then
  warn ".env not found - generating one"
  secret=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  cat > .env <<EOF
DB_USERNAME=root
DB_PASSWORD=root
JWT_SECRET=$secret
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT
ML_PORT=$ML_PORT
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
EOF
  ok ".env created with a random JWT_SECRET"
else
  ok ".env present"
fi

# MySQL only applies MYSQL_ROOT_PASSWORD when the volume is first created, so a
# changed DB_PASSWORD silently breaks every subsequent start.
env_pw=$(grep -E '^DB_PASSWORD=' .env | cut -d= -f2- || true)
if docker exec infrawatch-db mysql -uroot "-p${env_pw}" -N -B -e "SELECT 1;" >/dev/null 2>&1; then
  ok "Database password matches .env"
elif docker exec infrawatch-db mysql -uroot -N -B -e "SELECT 1;" >/dev/null 2>&1; then
  fail "DB password in .env does NOT match the existing 'db_data' volume."
  fail "MySQL only applies MYSQL_ROOT_PASSWORD on first init."
  warn "Restore the previous DB_PASSWORD, or run: ./deploy.sh --fresh   (DELETES ALL DATA)"
  exit 1
else
  ok "No pre-existing database volume"
fi

step "Build (cached layers make this a few seconds)"

if [ "$FRESH" -eq 1 ]; then
  warn "-Fresh : the db_data volume will be DESTROYED and re-seeded."
  users=$(docker exec infrawatch-db mysql -uroot "-p${env_pw}" -N -B infrawatchdb \
          -e "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d '[:space:]' || true)
  # Fail safe: an unknown count is treated as "data present".
  if [ -z "$users" ] || [ "$users" -gt 0 ] 2>/dev/null; then
    echo
    printf '    This will permanently delete ALL current data\n'
    [ -n "$users" ] && printf '    (currently %s users, plus all projects, alerts and predictions).\n' "$users"
    echo
    if [ "$ASSUME_YES" -ne 1 ]; then
      read -r -p "    Type 'yes' to wipe the database and continue: " reply
      if [ "$reply" != "yes" ]; then fail "Aborted. Nothing was changed."; exit 1; fi
    else
      warn "-y supplied, proceeding without confirmation"
    fi
  else
    ok "Database is already empty, no data to lose"
  fi
fi

docker compose build
ok "Images built"

step "Start containers"
if [ "$FRESH" -eq 1 ]; then
  docker compose down -v
  ok "Old containers and database volume removed"
fi
if ! docker compose up -d; then
  fail "docker compose up failed. If this is a port conflict, check ports"
  warn "${FRONTEND_PORT}, ${BACKEND_PORT}, ${ML_PORT}, ${DB_PORT}"
  exit 1
fi
ok "Containers started"

step "Verify"

wait_for "mysql" 120 \
  "[ \"\$(docker inspect infrawatch-db --format '{{.State.Health.Status}}' 2>/dev/null)\" = healthy ]" \
  || { docker compose logs --tail 40 db; exit 1; }

wait_for "backend" 180 \
  "curl -fsS http://localhost:${BACKEND_PORT}/api/health | grep -q '\"status\":\"UP\"'" \
  || { docker compose logs --tail 60 backend; exit 1; }

wait_for "ml-service" 180 \
  "curl -fsS http://localhost:${ML_PORT}/health | grep -q '\"status\":\"ok\"'" \
  || { docker compose logs --tail 40 ml-service; exit 1; }

wait_for "frontend" 120 \
  "curl -fsS -o /dev/null http://localhost:${FRONTEND_PORT}/" \
  || { docker compose logs --tail 40 frontend; exit 1; }

if curl -fsS -X POST http://localhost:${BACKEND_PORT}/api/v1/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"username":"admin","password":"Admin@123"}' >/dev/null 2>&1; then
  ok "Seeded admin login works (Admin@123)"
else
  warn "admin/Admin@123 did not log in."
  warn "Fine on an existing volume if the password was changed; a symptom on a fresh one."
fi

step "Deploy complete"
echo
printf '    Frontend   http://localhost:%s\n' "$FRONTEND_PORT"
printf '    Backend    http://localhost:%s/api\n' "$BACKEND_PORT"
printf '    ML service http://localhost:%s/docs\n' "$ML_PORT"
printf '    MySQL      localhost:%s  (db: infrawatchdb)\n' "$DB_PORT"
echo
docker compose ps
echo
