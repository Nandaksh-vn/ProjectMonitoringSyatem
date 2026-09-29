<#
.SYNOPSIS
    One-shot, repeatable deploy for InfraWatch AI.

.DESCRIPTION
    Idempotent: safe to run many times. Handles every step that used to fail
    on a clean machine, then verifies the stack actually works before exiting.

.PARAMETER Fresh
    Destroys the database volume and re-seeds from scratch. DELETES ALL DATA.
    Only use when you want the demo seed data back. Requires -Yes, or an
    interactive confirmation.

.PARAMETER Yes
    Skips the interactive confirmation for -Fresh (for unattended/CI runs).

.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -Fresh
    .\deploy.ps1 -Fresh -Yes
#>
[CmdletBinding()]
param(
    [switch]$Fresh,
    [switch]$Yes
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Set-Location $root

$FrontendPort = 3000
$BackendPort  = 8080
$MlPort       = 8000
$DbPort       = 3307

function Step  ($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok    ($m) { Write-Host "    [ok]   $m" -ForegroundColor Green }
function Warn  ($m) { Write-Host "    [warn] $m" -ForegroundColor Yellow }
function Fail  ($m) { Write-Host "    [FAIL] $m" -ForegroundColor Red }

function Wait-For {
    param([string]$Name, [scriptblock]$Probe, [int]$TimeoutSec = 180)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try { if (& $Probe) { Ok "$Name is up"; return $true } } catch { }
        Start-Sleep -Seconds 3
    }
    Fail "$Name did not become healthy within ${TimeoutSec}s"
    return $false
}

# ── 1. Preflight ──────────────────────────────────────────────────────────────
Step "Preflight"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Fail "docker not found on PATH"; exit 1
}
try { docker info *> $null } catch { Fail "Docker daemon is not running. Start Docker Desktop."; exit 1 }
Ok "Docker is running"

# .env is gitignored, so it is missing on every fresh clone. Compose now has
# fallbacks, but the JWT secret would silently be the public dev default.
if (-not (Test-Path .env)) {
    Warn ".env not found - generating one"
    $hex = '0123456789abcdef'
    $secret = -join ((1..64) | ForEach-Object { $hex[(Get-Random -Max 16)] })
    @(
        "DB_USERNAME=root"
        "DB_PASSWORD=root"
        "JWT_SECRET=$secret"
        "FRONTEND_PORT=$FrontendPort"
        "BACKEND_PORT=$BackendPort"
        "ML_PORT=$MlPort"
        "MAIL_HOST=smtp.gmail.com"
        "MAIL_PORT=587"
        "MAIL_USERNAME="
        "MAIL_PASSWORD="
    ) | Set-Content .env
    Ok ".env created with a random JWT_SECRET"
} else {
    Ok ".env present"
}

# A changed DB_PASSWORD does NOT re-init an existing MySQL volume: the password
# is only applied on first initialisation. Changing it here breaks the backend
# with an opaque "Access denied" on every subsequent deploy.
$envPw = ((Get-Content .env | Where-Object { $_ -match '^DB_PASSWORD=' }) -replace '^DB_PASSWORD=', '')
# MYSQL_PWD is passed via the container env rather than -p on the command line,
# which avoids the "password on the command line" warning polluting stderr.
$livePw = $null
$probe = { docker exec -e "MYSQL_PWD=$envPw" infrawatch-db mysql -uroot -N -B -e "SELECT 1;" 2>$null }
$prev = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try { $livePw = & $probe } finally { $ErrorActionPreference = $prev }
if ($livePw -match '^\s*1\s*$') {
    Ok "Database password matches .env"
} elseif ($livePw) {
    Fail "DB password in .env does NOT match the existing 'db_data' volume."
    Fail "MySQL only applies MYSQL_ROOT_PASSWORD on first init, so editing it now breaks the backend."
    Warn "Either restore the previous DB_PASSWORD in .env, or run:  .\deploy.ps1 -Fresh   (DELETES ALL DATA)"
    exit 1
} else {
    Ok "No pre-existing database volume"
}

# ── 2. Build ─────────────────────────────────────────────────────────────────
Step "Build (cached layers make this a few seconds)"
if ($Fresh) {
    Warn "-Fresh : the db_data volume will be DESTROYED and re-seeded."
    $users = $null
    $prev0 = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        # The database name is required; without it MySQL errors with
        # "No database selected" and $users ends up null.
        $users = docker exec -e "MYSQL_PWD=$envPw" infrawatch-db mysql -uroot -N -B `
            infrawatchdb -e "SELECT COUNT(*) FROM users;" 2>$null
    } finally { $ErrorActionPreference = $prev0 }

    # Fail safe: if the row count cannot be determined, assume data exists and
    # still demand confirmation. A guard that silently skips is worse than none.
    $userCount = $null
    if ($users -match '^\s*(\d+)\s*$') { $userCount = [int]$Matches[1] }

    if ($null -eq $userCount) {
        Warn "Could not determine the current row count (database may not be up yet)."
        Warn "Treating this as 'data present' and requiring confirmation."
    }

    if ($null -eq $userCount -or $userCount -gt 0) {
        Write-Host ""
        Write-Host "    This will permanently delete ALL current data" -ForegroundColor Red
        if ($null -ne $userCount) {
            Write-Host "    (currently $userCount users, plus all projects, alerts and predictions)." -ForegroundColor Red
        }
        Write-Host ""
        if (-not $Yes) {
            $reply = Read-Host "    Type 'yes' to wipe the database and continue"
            if ($reply -ne 'yes') { Fail "Aborted. Nothing was changed."; exit 1 }
        } else {
            Warn "-Yes supplied, proceeding without confirmation"
        }
    } else {
        Ok "Database is already empty, no data to lose"
    }
}

docker compose build
if ($LASTEXITCODE -ne 0) { Fail "Build failed"; exit 1 }
Ok "Images built"

# ── 3. Start ─────────────────────────────────────────────────────────────────
Step "Start containers"
if ($Fresh) {
    docker compose down -v
    Ok "Old containers and database volume removed"
}
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Fail "docker compose up failed. If this is a port conflict, run:"
    Warn "  Get-NetTCPConnection -LocalPort $FrontendPort,$BackendPort,$MlPort,$DbPort -State Listen"
    exit 1
}
Ok "Containers started"

# ── 4. Verify (poll real endpoints, not just container status) ───────────────
Step "Verify"

$healthy = Wait-For "mysql" {
    (docker inspect infrawatch-db --format '{{.State.Health.Status}}' 2>$null) -eq 'healthy'
} 120
if (-not $healthy) { Fail "Database never became healthy"; docker compose logs --tail 40 db; exit 1 }

$healthy = Wait-For "backend" {
    $r = Invoke-RestMethod "http://localhost:$BackendPort/api/health" -TimeoutSec 5
    $r.status -eq 'UP'
} 180
if (-not $healthy) { Fail "Backend never reported UP"; docker compose logs --tail 60 backend; exit 1 }

$healthy = Wait-For "ml-service" {
    $r = Invoke-RestMethod "http://localhost:$MlPort/health" -TimeoutSec 5
    $r.status -eq 'ok'
} 180
if (-not $healthy) { Fail "ML service never reported ok"; docker compose logs --tail 40 ml-service; exit 1 }

$healthy = Wait-For "frontend" {
    (Invoke-WebRequest "http://localhost:$FrontendPort/" -UseBasicParsing -TimeoutSec 5).StatusCode -eq 200
} 120
if (-not $healthy) { Fail "Frontend never served HTTP 200"; docker compose logs --tail 40 frontend; exit 1 }

# The seeded admin account only exists with the known password on a fresh seed.
# On a long-lived volume the password may have been changed, so warn only.
try {
    $body = @{ username = 'admin'; password = 'Admin@123' } | ConvertTo-Json
    $login = Invoke-RestMethod "http://localhost:$BackendPort/api/v1/auth/login" `
        -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 15
    Ok "Seeded admin login works (Admin@123)"
} catch {
    Warn "admin/Admin@123 did not log in."
    Warn "Fine on an existing volume if the password was changed; a symptom on a fresh one."
}

# ── 5. Summary ───────────────────────────────────────────────────────────────
Step "Deploy complete"
Write-Host ""
Write-Host "    Frontend   http://localhost:$FrontendPort" -ForegroundColor Green
Write-Host "    Backend    http://localhost:$BackendPort/api" -ForegroundColor Green
Write-Host "    ML service http://localhost:$MlPort/docs" -ForegroundColor Green
Write-Host "    MySQL      localhost:$DbPort  (db: infrawatchdb)" -ForegroundColor Green
Write-Host ""
docker compose ps --format '{{.Name}}  {{.Status}}'
Write-Host ""
