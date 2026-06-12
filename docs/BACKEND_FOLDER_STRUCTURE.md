# Backend Folder Structure

```text
server/
  package.json
  tsconfig.json
  vitest.config.ts
  .env.example
  prisma/
    schema.prisma
    seed.ts
  src/
    index.ts
    app.ts
    config.ts
    prisma.ts
    realtime.ts
    types.ts
    middleware/
      auth.ts
      error.ts
      validate.ts
    utils/
      api-response.ts
      async-handler.ts
      audit.ts
      crypto.ts
      pagination.ts
    routes/
      auth.routes.ts
      employees.routes.ts
      departments.routes.ts
      attendance.routes.ts
      leaves.routes.ts
      projects.routes.ts
      tasks.routes.ts
      assets.routes.ts
      documents.routes.ts
      notifications.routes.ts
      audit-logs.routes.ts
      reports.routes.ts
      settings.routes.ts
```

## Design Notes

- `routes/` modules own HTTP handlers for each domain.
- `middleware/auth.ts` verifies JWTs and enforces RBAC.
- `middleware/validate.ts` validates Zod schemas before handlers run.
- `utils/audit.ts` writes immutable audit entries for privileged/domain actions.
- `realtime.ts` configures Socket.IO and authenticated user rooms.
- Prisma is the persistence boundary and protects against SQL injection through parameterized queries.
