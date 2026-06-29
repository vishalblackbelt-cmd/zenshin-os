# ZENSHIN OS v1.3 RC-1

ZENSHIN OS is a multi-tenant Enterprise Resource Planning (ERP) platform designed for **Shotokan Karate Academy – Zenshin Dojo (Sirifort)** and **Asiad Karate Academy (Asiad Village)** in New Delhi.

It implements a unified membership directory, class attendance registers, a trial lead conversion funnel, accounting ledgers, and an automated Financial Discipline Engine.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js 22, Express, TypeScript, Prisma ORM, node-cron
- **Database**: PostgreSQL 16
- **DevOps**: Docker, Docker Compose, GitHub Actions, Nginx

---

## Getting Started

### 1. Prerequisites
- Node.js 22+
- npm 10+
- PostgreSQL 16 (or Docker installed)

### 2. Installation
Install all dependencies in the monorepo root:
```bash
npm install --legacy-peer-deps
```

### 3. Environment Configuration
Create a `.env` file in the root directory (single source of truth for local development):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zenshin?schema=public"
JWT_SECRET="your_jwt_secret"
JWT_REFRESH_SECRET="your_jwt_refresh_secret"
PORT=4000
NODE_ENV=development
```

Do not create separate `.env` files in workspace folders. Keep all local runtime values in the root `.env`.

### 4. Database Setup & Seeding
Verify and generate the Prisma Client:
```bash
npm run generate -w packages/db
```

### 5. Running the Application Locally
To run both backend API and React frontend simultaneously:
```bash
npm run dev
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000

---

## Running with Docker Compose (Production-style)
To build and launch the entire stack (Postgres database, API server, and web frontend):
```bash
docker-compose up --build
```
The application will be accessible at:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:4000

This mode is production-style: the web app is served by Nginx and the API runs compiled output. It does **not** provide frontend HMR or backend watch reload.

---

## Running with Docker Compose (Development + Hot Reload)
Use the dev override file when you want live code reload in containers:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The application will be accessible at:
- **Frontend (Vite HMR)**: http://localhost:3000
- **Backend API**: http://localhost:4000

The `docker-compose.dev.yml` override is optional, but necessary if you want containerized development behavior (watch mode + HMR). If you do not need Docker for development, use `npm run dev` locally.

The dev override uses dedicated development images for API and Web plus separate `node_modules` volumes per service to avoid dependency corruption/race conditions during startup.

If you previously built old images/volumes and still see Prisma/OpenSSL errors, reset and rebuild:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

---

## Running Automated Tests
The integration test suite tests authentication, RBAC access controls, billing ledger calculations, and the Financial Discipline Engine cron triggers:
```bash
# Run tests inside the api workspace
npm run test -w apps/api
```

---

## Financial Discipline Engine Rules
1. **Friendly Reminder**: Sent 5 days BEFORE the fee due date.
2. **Overdue Warning**: Sent 5 days AFTER the fee due date.
3. **Suspension**: Triggered 10 days AFTER the fee due date.
   - Updates student status to `INACTIVE`.
   - Adds a ₹1000 reactivation fee charge to the student's ledger.
   - Automatically excludes the student from Attendance registers, Belt exams, Broadcasts, and Portals.
4. **Reactivation**:
   - Manually or automatically unlocked ONLY when the student's outstanding balance becomes exactly ₹0.
   - Partial payments are accepted, but status remains `INACTIVE` until the ledger is completely cleared.
