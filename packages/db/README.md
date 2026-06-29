# Database Operations Runbook

This document defines the standard database workflow for development and production.

## 1. Source of Truth
1. Prisma data model: [prisma/schema.prisma](prisma/schema.prisma)
2. Migration history: [prisma/migrations](prisma/migrations)
3. Prisma client wrapper used by API: [src/index.ts](src/index.ts)

Rules:
1. Do not use schema sync (`db push`) for team or production flow.
2. Always create and commit migrations for schema changes.
3. Never edit an already applied migration. Create a new migration instead.

## 2. Command Behavior
1. `npm run generate -w packages/db`
   - Reads Prisma schema and generates client code.
   - Does not require a live database connection.
2. `npm run db:migrate:dev -w apps/api -- --name <name>`
   - Creates and applies a new migration in development.
   - Requires a reachable database from `DATABASE_URL`.
3. `npm run db:migrate:deploy -w apps/api`
   - Applies committed migrations only.
   - Requires a reachable database from `DATABASE_URL`.
4. `npm run db:migrate:status -w apps/api`
   - Shows migration status.
   - Requires a reachable database from `DATABASE_URL`.

## 3. Development Workflow (Step by Step)
1. Start PostgreSQL (local service or Docker DB service).
2. Ensure root `.env` has the correct development `DATABASE_URL`.
3. Apply committed migrations:
   - `npm run db:migrate:deploy -w apps/api`
4. Start app development servers:
   - `npm run dev`
5. Run API tests when needed:
   - `npm run test -w apps/api`

Notes:
1. API dev startup currently runs `migrate deploy` before the watcher.
2. If DB is down, API startup fails early by design.

## 4. Schema Change Workflow (Step by Step)
1. Edit [prisma/schema.prisma](prisma/schema.prisma).
2. Create a named migration:
   - `npm run db:migrate:dev -w apps/api -- --name add_xxx`
3. Confirm migration files were created in [prisma/migrations](prisma/migrations).
4. Regenerate Prisma client if required:
   - `npm run generate -w packages/db`
5. Run tests:
   - `npm run test -w apps/api`
6. Commit all of the following together:
   - schema changes
   - new migration files
   - related code changes

## 5. Production Release Workflow (Step by Step)
1. Take a DB backup/snapshot.
2. Deploy the new application version.
3. Apply committed migrations before traffic cutover.
4. Start API with production environment variables.
5. Validate API health and logs.

In this repository:
1. The API production container runs migration deploy at startup from [apps/api/Dockerfile](../../apps/api/Dockerfile).
2. The web production container is served by Nginx from [apps/web/Dockerfile](../../apps/web/Dockerfile).
3. The production-style stack is orchestrated in [docker-compose.yml](../../docker-compose.yml).

## 6. Troubleshooting Quick Checks
1. Migration fails with connection errors:
   - Check DB service health and `DATABASE_URL`.
2. API starts but schema mismatch errors appear:
   - Run `npm run db:migrate:status -w apps/api` and apply pending migrations.
3. Prisma client type mismatch after schema updates:
   - Run `npm run generate -w packages/db` and rebuild.
