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
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
