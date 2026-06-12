# VertexEMS Implementation Plan

## Goal

Transform VertexEMS from a frontend-only demo into a production-ready full-stack employee management system backed by PostgreSQL and protected by server-side authentication/authorization.

## Architecture Decision

The backend is implemented as a separate `server/` package instead of being mixed into the Vite frontend package. This avoids conflicts with the existing browser-oriented `tsconfig.json`, Vite build, and ESLint globals while allowing the backend to use Node-specific TypeScript, Prisma, and Express tooling.

## Deliverables

- `server/` Express + Prisma backend package.
- PostgreSQL schema via Prisma models and migrations workflow.
- Seed data equivalent to the existing demo data, with secure password hashing.
- JWT access-token and refresh-token authentication.
- RBAC middleware and route-level authorization.
- REST APIs for all frontend domains.
- Socket.IO notification/task event gateway.
- Frontend API layer wired to real backend endpoints.
- Documentation for missing features, schema, APIs, folder structure, implementation steps, and deployment.
- Docker Compose for PostgreSQL/backend/frontend local production-like execution.

## Implementation Phases

### Phase 1: Documentation and Target Architecture

- Capture all missing features and broken flows.
- Define database schema and relationships.
- Define REST API contract and standard response/error envelope.
- Define deployment/environment requirements.

### Phase 2: Backend Foundation

- Create `server/package.json`, TypeScript config, Prisma config, and environment example.
- Add Express app bootstrap, security middleware, CORS, JSON parsing, request logging, rate limiting, and centralized error handling.
- Add Prisma client and health endpoint.

### Phase 3: Auth, Users, and RBAC

- Add employee/user credential models.
- Implement registration, login, logout, refresh, current user, email verification, password reset, password change, and session revocation.
- Use bcrypt for passwords and JWT for access/refresh tokens.
- Enforce server-side RBAC on every protected route.

### Phase 4: Core Domain APIs

- Employees, departments, attendance, leaves, projects, tasks, assets, documents, notifications, audit logs, reports, and settings.
- Add pagination, search, sorting, filtering, validation, and audit logging.
- Add file upload/download for employee documents.

### Phase 5: Real-Time Features

- Add Socket.IO gateway authenticated by JWT.
- Emit notifications for leave approvals, task assignments, project updates, and document events.

### Phase 6: Frontend Integration

- Replace `src/lib/api/auth.ts` localStorage auth with HTTP auth.
- Replace `src/lib/api/app.functions.ts` localStorage business logic with HTTP calls.
- Replace direct `mock-data.ts` usage in app pages/topbar with real query functions.
- Wire inactive buttons/forms to backend mutations.

### Phase 7: Testing and Deployment

- Add backend unit/integration tests for auth, RBAC, validation, and core flows.
- Add Docker Compose and production deployment guide.
- Run frontend build and backend typecheck/test commands.

## Success Criteria

- No production feature depends on `localStorage` as a database.
- Auth/session state is validated by the backend.
- Every protected action is authorized server-side.
- All frontend screens load data from backend APIs.
- All create/update/delete buttons are wired to real mutations.
- Database schema contains constraints and relationships for the full domain.
- Backend supports seed data, validation, security middleware, audit logs, and deployment configuration.
