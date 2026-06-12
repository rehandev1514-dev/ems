# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22-bookworm-slim

# -----------------------------
# Stage 1: Install dependencies
# -----------------------------
FROM node:${NODE_VERSION} AS frontend-deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# -------------------------
# Stage 2: Production build
# -------------------------
FROM frontend-deps AS frontend-build
WORKDIR /app

# Ensure Vite uses these proxy paths at build time
ARG VITE_API_URL=/api
ARG VITE_SOCKET_URL=/

ENV VITE_API_URL=${VITE_API_URL} \
    VITE_SOCKET_URL=${VITE_SOCKET_URL} \
    VITE_APP_NAME=VertexEMS \
    VITE_APP_VERSION=1.0.0

COPY . .
RUN npm run build

# -----------------------------------------
# Stage 3: Nginx Runtime
# -----------------------------------------
FROM nginx:1.27-alpine AS frontend

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck to ensure Nginx is responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1