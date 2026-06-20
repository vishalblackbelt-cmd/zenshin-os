# ZENSHIN OS v1.3 RC-1 — MASTER SPECIFICATION

## ROLE

You are a **Principal Software Architect, Senior Full Stack Engineer, DevOps Engineer, QA Engineer and Technical Lead**.

Work autonomously.

Do not ask questions.

Do not stop.

Do not leave TODOs.

Do not write placeholders.

Do not write comments such as:

```ts
// implement later
// TODO
```

Continue until the repository builds successfully.

---

# PROJECT NAME

```text
ZENSHIN OS v1.3 RC-1
```

---

# PURPOSE

ERP software for

### Branch 1

The Shotokan Karate Academy – Zenshin Dojo

DDA Sirifort Sports Complex

New Delhi

### Branch 2

Asiad Karate Academy

Asiad Village

New Delhi

---

# STACK

Backend

```text
Node.js 22

Express

TypeScript

Prisma

PostgreSQL 16

JWT

bcrypt

node-cron

Axios
```

Frontend

```text
React 19

Vite

TailwindCSS

ShadCN UI

Lucide Icons

Tanstack Table
```

Infrastructure

```text
Docker

Docker Compose

Nginx

GitHub Actions

Ubuntu 24.04
```

---

# DO NOT IMPLEMENT

```text
AI Assistant

Certificates

Parent Portal

Student Portal

PWA

Mobile App

Google Sheets

Google Forms
```

---

# ROLES

```text
OWNER

MANAGER

INSTRUCTOR

PARENT

STUDENT
```

---

# BRANCHES

```text
Sirifort

Asiad
```

OWNER

can access

```text
All Branches
```

Managers

Only their own branch

---

# MODULES TO BUILD

## Authentication

JWT

Refresh Token

bcrypt

RBAC Middleware

---

## Dashboard

Cards

```text
Total Students

Active Students

Inactive Students

Paid Trials

Trial Revenue

Monthly Fees

Pending Fees

Attendance %

Exam Eligible

Fees Due This Week

Suspended Students

Overdue Students
```

---

## Trial Leads

Mandatory Trial Fee

₹500

Status

```text
NEW

PAID

TRIAL_COMPLETED

JOINED

LOST
```

Can convert only when

```text
Payment Status == PAID
```

---

## Students

Fields

```text
Student ID

Name

Age

Category

Parent Name

Mobile

Branch

Joining Date

Current Belt

Attendance %

Fee Status

Status

Exam Eligible
```

Student IDs

```text
ZD0001
```

---

## Attendance

Present

Absent

Late

Batch Support

Monthly Attendance %

---

# FINANCIAL DISCIPLINE ENGINE

Owner Settings

Editable

```text
max_grace_period


default


10




reactivation_charge


default


1000
```

---

Friendly Reminder

Trigger

```text
5 days BEFORE due date
```

WhatsApp Message

---

Overdue Reminder

Trigger

```text
5 days AFTER due date
```

WhatsApp Message

---

Suspension

Trigger

```text
10 days AFTER due date
```

Student Status

```text
INACTIVE
```

Hide Student From

```text
Attendance Register


Belt Exams


Parent Portal


Student Portal


Certificates


WhatsApp Broadcasts
```

---

Reactivation

Allowed only after

```text
Outstanding Fees


+


₹1000 Reactivation Charge
```

Partial Payment

Allowed

Status remains

```text
INACTIVE
```

Only when ledger balance becomes zero

Restore

```text
Attendance


Exams


Portals


Broadcast Lists
```

---

# ACCOUNTING RULES

Never mutate ledger amounts.

Use

```text
Ledger


Charges
```

and

```text
Payments
```

Balance

```text
SUM(Charges)


-


SUM(Payments)
```

---

# WHATSAPP

Meta Cloud API

Send

Friendly Reminder

Overdue Reminder

Suspension Message

Restore Message

---

# AUDIT LOGS

Track

```text
LOGIN


LOGOUT


PAYMENT_RECEIVED


PAYMENT_FAILED


FRIENDLY_REMINDER_SENT


OVERDUE_REMINDER_SENT


STUDENT_SUSPENDED


STUDENT_REACTIVATED


WHATSAPP_REMOVED


WHATSAPP_RESTORED


SETTINGS_CHANGED


ATTENDANCE_MARKED
```

---

# STUDENT TIMELINE

Example

```text
20 Jun 2026


FRIENDLY_REMINDER_SENT



25 Jun 2026


OVERDUE_REMINDER_SENT



30 Jun 2026


STUDENT_SUSPENDED



03 Jul 2026


₹3600 RECEIVED



03 Jul 2026


STUDENT_REACTIVATED
```

---

# RBAC

OWNER

Everything

MANAGER

Own Branch

Can Suspend

INSTRUCTOR

Attendance Only

PARENT

Read Only

STUDENT

Read Only

---

# DATABASE

Prisma

PostgreSQL

Generate all models.

Generate migrations.

Run

```bash
npx prisma validate
```

Must pass.

---

# TESTS

Create Jest tests for

```text
Friendly Reminder


Overdue Reminder


Suspension


Partial Payment


Full Payment


Reactivation


Duplicate Webhook


RBAC


JWT


Audit Logs
```

---

# DEVOPS

Create

```text
Dockerfile


docker-compose.yml


.env.example


GitHub Actions


Nginx Config
```

---

# COMPLETION REQUIREMENTS

Continue editing until

```bash
npm run build
```

passes

Continue until

```bash
npx prisma validate
```

passes

Continue until

```bash
npm run test
```

passes

Continue until there are

```text
0 TypeScript errors


0 Prisma errors


0 ESLint errors
```

---

# FINAL OUTPUT REQUIRED

Produce

```text
zenshin-os-v1.3-RC1.zip
```

Include

```text
Backend


Frontend


Prisma


Docker


Tests


Documentation


README.md
```
