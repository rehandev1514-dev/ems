# VertexEMS Database Schema

The production database is PostgreSQL managed by Prisma. The canonical schema lives in `server/prisma/schema.prisma`.

## Core Tables

### employees

- `id` UUID primary key
- `employeeCode` unique
- `fullName`
- `email` unique
- `phone`
- `cnic` unique nullable
- `address`
- `gender`
- `dob`
- `departmentId` foreign key to departments
- `designation`
- `joiningDate`
- `status` enum: active, on_leave, probation, terminated, pending
- `salary`
- `avatar`
- `role` enum: admin, employee, manager, supervisor, accountant
- timestamps

### departments

- `id` UUID primary key
- `name` unique
- `code` unique
- `managerId` optional foreign key to employees
- timestamps

### user_credentials

- `id` UUID primary key
- `employeeId` unique foreign key to employees
- `passwordHash`
- `emailVerifiedAt`
- `lastLoginAt`
- `disabledAt`
- timestamps

### refresh_tokens

- `id` UUID primary key
- `employeeId` foreign key
- `tokenHash` unique
- `expiresAt`
- `revokedAt`
- `replacedByTokenId`
- request metadata: `ip`, `userAgent`

### auth_tokens

- Handles password reset and email verification tokens.
- `type` enum: password_reset, email_verification
- `tokenHash`, `expiresAt`, `consumedAt`

## HR Tables

### attendance_records

- Unique compound index on `(employeeId, date)`.
- Stores check-in/out, status, and decimal hours.

### leave_requests

- Stores employee, type, dates, days, reason, status, applied/decided metadata.

### leave_balances

- Unique compound index on `(employeeId, type, year)`.
- Tracks yearly entitlement, used, pending, and carry-forward balances.

## Work Management Tables

### projects

- Project metadata, status, progress, dates, budget.

### project_members

- Many-to-many join between projects and employees.

### tasks

- Task metadata, project, assignee, priority, status, deadline.

## Assets and Documents

### assets

- Asset tag unique, serial unique nullable, assignment to employee, value, status.

### documents

- Secure file metadata: name, type, storage key/path, MIME type, size, employee owner, uploader.

## Notifications and Audit

### notifications

- Notification content and kind.

### notification_recipients

- Per-user read/unread state.

### audit_logs

- Immutable log of actor, action, target, metadata, IP, and timestamp.

## Settings

### company_settings

- Singleton company configuration record.

### notification_preferences

- Per-employee preferences for email, push/in-app, and leave/task/report/security categories.
