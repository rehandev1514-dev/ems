# VertexEMS Deployment Guide

## Local Prerequisites

- Node.js 20+
- npm 10+
- Docker and Docker Compose
- PostgreSQL 16 if not using Docker

## Environment Files

Frontend `.env`:

```env
VITE_APP_NAME=VertexEMS
VITE_APP_VERSION=1.0.0
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

Backend `server/.env`:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://vertex:vertex_password@localhost:5432/vertex_ems?schema=public
JWT_ACCESS_SECRET=replace-with-a-long-random-access-secret
JWT_REFRESH_SECRET=replace-with-a-long-random-refresh-secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
```

## Development Setup

```bash
npm install
cd server && npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

In another terminal:

```bash
npm run dev
```

## Docker Compose

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`
- PostgreSQL: `localhost:5432`

## Production Build

Backend:

```bash
cd server
npm ci
npm run prisma:generate
npm run build
npm run start
```

Frontend:

```bash
npm ci
npm run build
```

Serve `dist/` through a static host/CDN and configure `VITE_API_URL` to the deployed backend URL.

## Security Checklist

- Use strong random JWT secrets.
- Use HTTPS everywhere.
- Restrict `CORS_ORIGIN` to production frontend domain.
- Store uploaded files in durable storage such as S3, GCS, Azure Blob, or a mounted private volume.
- Run database migrations before release.
- Enable centralized logs and monitoring.
- Rotate secrets regularly.
