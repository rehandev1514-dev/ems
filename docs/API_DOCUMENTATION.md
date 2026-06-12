# VertexEMS API Documentation

Base URL: `http://localhost:4000/api`

All protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

Standard success response:

```json
{
  "data": {},
  "meta": {}
}
```

Standard error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": []
  }
}
```

## Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register an employee account in pending status. |
| POST | `/auth/login` | Public | Login with email/password. Returns user, access token, refresh token. |
| POST | `/auth/refresh` | Public | Rotate refresh token and return a new access token. |
| POST | `/auth/logout` | User | Revoke current refresh token. |
| GET | `/auth/me` | User | Return current authenticated user. |
| POST | `/auth/email/verify/request` | User | Create email verification token. |
| POST | `/auth/email/verify` | Public | Verify email token. |
| POST | `/auth/password/forgot` | Public | Create password reset token. |
| POST | `/auth/password/reset` | Public | Reset password using token. |
| POST | `/auth/password/change` | User | Change current password. |
| POST | `/auth/sessions/revoke-all` | User | Revoke all refresh tokens for current user. |

## Employees

| Method | Path | Roles | Description |
| --- | --- | --- | --- |
| GET | `/employees` | admin, manager, accountant | Paginated list with search/status/department filters. |
| POST | `/employees` | admin, manager | Create employee and credentials. |
| GET | `/employees/:id` | admin, manager, accountant, self | Get employee profile. |
| PATCH | `/employees/:id` | admin, manager, self-limited | Update employee. |
| DELETE | `/employees/:id` | admin | Terminate employee. |
| POST | `/employees/:id/approve` | admin | Approve pending signup. |

## Departments

| Method | Path | Roles | Description |
| --- | --- | --- | --- |
| GET | `/departments` | user | List departments. |
| POST | `/departments` | admin | Create department. |
| PATCH | `/departments/:id` | admin | Update department. |
| DELETE | `/departments/:id` | admin | Delete department if unused. |

## Attendance

| Method | Path | Roles | Description |
| --- | --- | --- | --- |
| GET | `/attendance` | user | Role-scoped attendance list. |
| POST | `/attendance/check-in` | user | Check in for current day. |
| POST | `/attendance/check-out` | user | Check out for current day. |
| PATCH | `/attendance/:id` | admin, manager | Adjust attendance record. |

## Leaves

| Method | Path | Roles | Description |
| --- | --- | --- | --- |
| GET | `/leaves` | user | Role-scoped leave list. |
| POST | `/leaves` | user | Apply for leave. |
| PATCH | `/leaves/:id/status` | admin, manager, supervisor | Approve/reject leave. |
| GET | `/leaves/balances` | user | Current user's leave balances. |

## Projects and Tasks

| Method | Path | Roles | Description |
| --- | --- | --- | --- |
| GET/POST | `/projects` | user / admin, manager | List/create projects. |
| GET/PATCH/DELETE | `/projects/:id` | member/admin, manager | Read/update/delete project. |
| POST | `/projects/:id/members` | admin, manager | Add members. |
| DELETE | `/projects/:id/members/:employeeId` | admin, manager | Remove member. |
| GET/POST | `/tasks` | user / admin, manager, supervisor | List/create tasks. |
| GET/PATCH/DELETE | `/tasks/:id` | assignee/member/admin/manager | Read/update/delete task. |

## Assets

| Method | Path | Roles | Description |
| --- | --- | --- | --- |
| GET/POST | `/assets` | admin, accountant | List/create assets. |
| PATCH/DELETE | `/assets/:id` | admin, accountant | Update/delete assets. |
| POST | `/assets/:id/assign` | admin, accountant | Assign asset. |
| POST | `/assets/:id/unassign` | admin, accountant | Unassign asset. |

## Documents

| Method | Path | Roles | Description |
| --- | --- | --- | --- |
| GET | `/documents` | user | Role-scoped document list. |
| POST | `/documents` | user | Upload document via multipart form-data. |
| GET | `/documents/:id/download` | owner/admin | Download file. |
| DELETE | `/documents/:id` | owner/admin | Delete file metadata and object. |

## Notifications

| Method | Path | Roles | Description |
| --- | --- | --- | --- |
| GET | `/notifications` | user | Current user's notifications. |
| PATCH | `/notifications/:id/read` | user | Mark one notification read. |
| PATCH | `/notifications/read-all` | user | Mark all read. |

WebSocket namespace: `/socket.io`. Clients authenticate with access token and receive `notification:new`, `task:updated`, and `leave:updated` events.

## Audit Logs, Reports, Settings

| Method | Path | Roles | Description |
| --- | --- | --- | --- |
| GET | `/audit-logs` | admin, accountant | Paginated audit logs. |
| GET | `/reports/summary` | admin, manager, accountant | Dashboard/report summary. |
| GET | `/reports/export/:type` | admin, manager, accountant | CSV export. |
| GET/PATCH | `/settings/company` | admin | Company settings. |
| GET/PATCH | `/settings/notifications` | user | Notification preferences. |
