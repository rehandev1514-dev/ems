# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22-bookworm-slim

# -----------------------------
# Stage 1: Install dependencies
# -----------------------------
FROM node:${NODE_VERSION} AS backend-deps
WORKDIR /app/server

COPY package.json package-lock.json ./
RUN npm ci

# -----------------------------------
# Stage 2: Generate Prisma and build
# -----------------------------------
FROM backend-deps AS backend-build

# Prisma generate needs a DATABASE_URL. Since it's only generating the client,
# the connection string itself just needs to be a valid format.
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy?schema=public

COPY prisma ./prisma
RUN npm run prisma:generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Remove devDependencies to keep the final image clean
RUN npm prune --omit=dev

# ------------------------------------------
# Stage 3: Backend runtime with Prisma
# ------------------------------------------
FROM node:${NODE_VERSION} AS backend

# Install OpenSSL (required for Prisma)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server

# Add entrypoint script
COPY --chown=node:node docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Copy built app and production modules
COPY --from=backend-build --chown=node:node /app/server/package.json ./package.json
COPY --from=backend-build --chown=node:node /app/server/node_modules ./node_modules
COPY --from=backend-build --chown=node:node /app/server/prisma ./prisma
COPY --from=backend-build --chown=node:node /app/server/dist ./dist

# Create uploads directory with correct permissions
RUN mkdir -p uploads && chown -R node:node uploads

USER node
EXPOSE 4000

# Healthcheck to ensure API is responsive
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health').then((r)=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
