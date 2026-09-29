# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies from the lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_ML_API_URL is read at BUILD time by src/services/api.js. It must be an
# address the browser can reach, not a Compose-internal hostname.
ARG VITE_ML_API_URL=http://localhost:8000
ENV VITE_ML_API_URL=$VITE_ML_API_URL
RUN npm run build

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# nginx.conf is a *template*. The official nginx image runs envsubst over
# /etc/nginx/templates/*.template on startup, substituting only the variables
# that are actually present in the environment, so nginx's own $host/$uri are
# preserved. These defaults keep docker-compose working; Render overrides both.
ENV PORT=3000
ENV BACKEND_URL=http://backend:8080
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider "http://localhost:${PORT}/" || exit 1

CMD ["nginx", "-g", "daemon off;"]
