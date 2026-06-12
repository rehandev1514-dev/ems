# VertexEMS Missing Features Report

## Executive Summary

The current VertexEMS application is a polished Vite + React single-page application, but it is not production-ready because it has no real backend, no database, and no server-side security boundary. Most data is either imported directly from `src/lib/mock-data.ts` or persisted in browser `localStorage` through `src/lib/api/*`. This means authentication, authorization, persistence, validation, audit logging, file handling, notifications, and all critical business rules can be bypassed by any browser user.

This report documents the gaps discovered during the codebase review and defines the target production implementation.

## Critical Backend Gaps

### 1. Database and Persistence

- No PostgreSQL database exists.
- No migrations, schema constraints, foreign keys, indexes, or seed workflow exist.
- Browser `localStorage` key `vertex_ems_db` is used as the application database.
- Static mock arrays are imported directly by several pages.
- No transactional guarantees exist for multi-step operations such as leave approval, asset assignment, or employee creation.

### 2. Authentication and Sessions

- Authentication is implemented entirely in the browser via `localStorage` key `vertex_ems_session`.
- Password hashing uses an insecure demo hash and must be replaced with bcrypt/argon2.
- No JWT access tokens, refresh tokens, token rotation, refresh-token revocation, logout invalidation, password reset, email verification, or session management exists.
- The forgot-password screen only toggles UI state and does not send or validate reset tokens.

### 3. Authorization and RBAC

- Role checks are mostly frontend-only or localStorage-only.
- The server does not enforce RBAC because there is no server.
- Sensitive fields such as salary, role, employment status, and audit logs can be modified by manipulating browser data.
- Navigation hiding in `Sidebar` is cosmetic and not a security control.

### 4. API Layer

- No REST API exists.
- No standard response envelope, typed errors, pagination, filtering, sorting, or search exists.
- Frontend functions in `src/lib/api/app.functions.ts` mutate local data instead of calling HTTP endpoints.
- Some screens bypass this local API layer and import mock data directly.

### 5. Domain Functionality Gaps

#### Employees

- Missing production CRUD endpoints.
- Missing unique constraints for email, employee code, and CNIC.
- Delete currently physically removes records; production should support termination/soft-delete semantics.
- Missing approval workflow for pending signups.
- Missing employee profile image/file handling.

#### Departments

- Department page is read-only and uses mock data.
- `New department` button is not wired.
- Missing create/update/delete endpoints and manager validation.

#### Attendance

- Check-in/check-out are local-only.
- Missing unique employee/date constraint.
- Missing timezone-aware work policy, late/absent rules, manual adjustments, and audit trail.

#### Leaves

- Leave balances are hardcoded in UI.
- Missing leave policies, yearly balances, overlap validation, approval metadata, and notifications.

#### Projects and Tasks

- Projects and tasks pages use static mock data.
- `New project`, `New task`, and task-card interactions are not wired.
- Missing project member join table, task CRUD, task status transitions, and assignment notifications.

#### Assets

- Assets page uses static mock data.
- `Add asset` is not wired.
- Missing asset assignment/unassignment history and CRUD APIs.

#### Documents

- Documents page uses static mock data.
- Upload/download actions are missing or simulated.
- Missing secure file storage, metadata table, authorization, download streaming, and deletion.

#### Notifications

- Notifications are static and not user-targeted.
- `Mark all as read` is not wired.
- Missing WebSocket/SSE real-time delivery and notification-recipient state.

#### Audit Logs

- Audit logs are static/local only.
- Missing immutable server-side audit logging and filtering/pagination.

#### Reports

- Reports are generated client-side from local/mock data.
- Missing secured report APIs and export endpoints.

#### Settings

- Settings forms only show toast messages.
- Missing company settings, notification preferences, password change, session revocation, and optional 2FA groundwork.

### 6. Security Gaps

- No Helmet/security headers.
- No CORS policy tied to environment configuration.
- No rate limiting.
- No input validation or sanitization at server boundary.
- No password policy enforcement.
- No secure refresh-token storage strategy.
- No centralized error handling.
- No audit logging for privileged actions.

### 7. Testing and Deployment Gaps

- No backend tests exist.
- No API integration tests exist.
- No Docker Compose for PostgreSQL/backend/frontend exists.
- No production deployment guide or CI/CD recommendations exist.

## Required Production Remediation

1. Add a separated backend package under `server/` using Express, Prisma, PostgreSQL, JWT auth, RBAC, Zod validation, and Socket.IO.
2. Add a normalized Prisma schema with migrations/seeding.
3. Replace localStorage/mock frontend APIs with HTTP calls.
4. Replace direct `mock-data.ts` page imports with query-driven backend data.
5. Add file upload/download, notifications, reporting, settings, audit logs, and security middleware.
6. Add environment examples, Docker Compose, and deployment documentation.
