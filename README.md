# AtomQuest

**Enterprise Goal Governance & Performance Intelligence Platform**

> Operational Governance · KPI Intelligence · Enterprise Performance Architecture

AtomQuest is a production-grade enterprise governance platform designed to simulate how modern organizations manage goals, quarterly reviews, KPI ownership, compliance tracking, escalation workflows, and organizational accountability across hierarchical teams.

**Production URL:** https://atom-quest-lake.vercel.app

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-00E5BF?style=for-the-badge&logo=postgresql&logoColor=black)
![NextAuth](https://img.shields.io/badge/NextAuth-000000?style=for-the-badge&logo=auth0&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## Table of Contents

- [What is AtomQuest?](#what-is-atomquest)
- [The Enterprise Problem](#the-enterprise-problem)
- [Core Philosophy](#core-philosophy)
- [Key Features](#key-features)
- [Enterprise Governance Architecture](#enterprise-governance-architecture)
- [Role-Based System](#role-based-system)
- [Quarterly Governance Lifecycle](#quarterly-governance-lifecycle)
- [Governance Mathematics](#governance-mathematics)
- [Shared Goals Engine](#shared-goals-engine)
- [Demo Navigation Widget](#demo-navigation-widget)
- [Analytics & Intelligence Layer](#analytics--intelligence-layer)
- [Executive Reporting System](#executive-reporting-system)
- [Audit & Compliance Layer](#audit--compliance-layer)
- [Bonus Enterprise Implementations](#bonus-enterprise-implementations)
- [System Architecture](#system-architecture)
- [Database Design](#database-design)
- [Production Infrastructure](#production-infrastructure)
- [Demo Credentials](#demo-credentials)
- [Recommended Demo Flow](#recommended-demo-flow)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [Technology Stack](#technology-stack)

---

## What is AtomQuest?

AtomQuest is an enterprise-grade governance and performance intelligence platform built to simulate how modern organizations manage:

- Organizational goals
- KPI ownership
- Quarterly evaluations
- Compliance tracking
- Shared accountability
- Cross-team execution
- Governance escalation
- Enterprise reporting
- Audit visibility
- Role-based operational control

Unlike traditional task managers or HR dashboards, AtomQuest focuses on operational governance at enterprise scale. The platform models how managers, employees, and leadership interact across quarterly performance cycles while maintaining transparency, accountability, auditability, and measurable KPI progression.

---

## The Enterprise Problem

Large organizations suffer from fragmented KPI ownership, no centralized governance visibility, weak quarterly accountability, lack of escalation systems, poor compliance tracking, inconsistent review structures, missing operational analytics, unclear shared ownership models, and invisible performance bottlenecks.

Most tools manage tasks, tickets, or employee records. Very few simulate enterprise governance workflows, KPI intelligence, cross-functional accountability, and operational compliance.

AtomQuest solves this through a fully integrated governance simulation architecture.

---

## Core Philosophy

AtomQuest was engineered around five enterprise principles:

| Principle | Description |
|---|---|
| Governance First | Every action is traceable and measurable |
| Accountability | Ownership is explicit and hierarchical |
| KPI Intelligence | Goals are mathematically evaluated |
| Transparency | Managers and employees share visibility |
| Operational Simulation | Mimics real enterprise governance systems |

---

## Key Features

### Role-Based Enterprise Architecture

Three roles — `ADMIN`, `MANAGER`, and `EMPLOYEE` — each with isolated dashboards, permissions, analytics visibility, workflow control, and governance authority.

### Goal Management System

Managers can create KPI goals, assign them to employees, define thrust areas, specify units of measure, monitor quarterly progression, and track completion health. Goal structure includes KPI title, measurable targets, governance quarter, operational category, ownership mapping, completion state, and escalation awareness.

### Quarterly Update Engine

Employees submit Q1 through Q4 updates. Each quarterly update includes actual achievement, progress percentage, operational notes, status classification, and governance scoring.

### Real-Time Analytics

Dynamic analytics dashboards provide completion rates, delayed KPIs, quarterly trends, operational health, governance distribution, manager insights, and employee performance tracking.

### Enterprise Reporting Layer

Includes quarterly summaries, operational snapshots, KPI completion reports, governance compliance reports, delayed objective analysis, and department-wise tracking.

### Shared Goals System

Managers can assign one KPI to multiple employees, designate primary KPI owners, and create collaborative operational goals — simulating real enterprise cross-functional ownership.

### Audit Logging System

Every governance action is tracked: updates, approvals, submissions, assignments, and workflow modifications. This creates enterprise audit visibility, operational accountability, and traceable governance history.

### Enterprise Authentication

Powered by NextAuth with credential-based enterprise login, RBAC middleware, protected routes, and secure session architecture.

---

## Enterprise Governance Architecture

```
ADMIN
   |
   +-- MANAGERS
   |      |
   |      +-- EMPLOYEES
   |      |      +-- Goals
   |      |      +-- Quarterly Updates
   |      |      +-- KPI Progression
   |      |
   |      +-- Shared Goals
   |
   +-- Enterprise Analytics
```

---

## Role-Based System

### ADMIN

The admin oversees organization-wide governance, analytics visibility, audit monitoring, compliance tracking, and operational summaries. Admins can access all dashboards, monitor all users, observe KPI progression, and view enterprise-wide intelligence.

### MANAGER

Managers create goals, assign employees, monitor KPI progression, review quarterly updates, create shared goals, and evaluate organizational performance. Managers have governance ownership, approval authority, analytics access, and cross-team KPI tracking.

### EMPLOYEE

Employees view assigned goals, submit quarterly updates, track progress, and manage personal KPI execution. Capabilities include quarterly submissions, operational status updates, and performance visibility.

---

## Quarterly Governance Lifecycle

```
Goal Creation
      |
      v
Q1 Submission
      |
      v
Q2 Submission
      |
      v
Q3 Submission
      |
      v
Q4 Submission
      |
      v
Manager Review
      |
      v
Governance Evaluation
      |
      v
Analytics Aggregation
      |
      v
Executive Reporting
```

---

## Governance Mathematics

### KPI Completion Formula

```
Completion % = (Actual Achievement / Target) x 100
```

### Status Classification Logic

| Percentage | Status |
|---|---|
| >= 90% | COMPLETED |
| 70% – 89% | ON_TRACK |
| 50% – 69% | DELAYED |
| < 50% | AT_RISK |

### Quarterly Aggregation Model

```
Annual KPI Score = (Q1 + Q2 + Q3 + Q4) / 4
```

### Weighted Governance Health

The analytics layer aggregates completed goals, delayed goals, at-risk goals, and governance compliance to generate operational intelligence dashboards.

---

## Shared Goals Engine

Managers can assign one KPI to multiple employees, create collaborative execution models, define primary KPI owners, and track distributed accountability.

**Example:**

```
Goal: Reduce Customer Complaints
Target: 95

Assigned To:
- Priya Sharma
- Rahul Verma
- Ananya Iyer

Primary KPI Owner: Rahul Verma
```

This simulates enterprise coordination, department collaboration, and distributed ownership models.

---

## Demo Navigation Widget

A floating evaluator-assistance utility located at the bottom-right of the interface, designed to improve exploration of the quarterly governance lifecycle during demos and evaluations.

**Purpose:** Enterprise governance systems involve multiple stages — Q1 planning, Q2 progress tracking, Q3 governance review, and Q4 completion analysis. Manually navigating across lifecycle stages during evaluations becomes slow and repetitive.

**Capabilities:**
- Navigate between Q1 through Q4 views
- Explore lifecycle progression faster
- Reduce repetitive navigation during demos
- Improve evaluator onboarding experience
- Provide smoother governance-flow traversal

---

## Analytics & Intelligence Layer

The analytics engine provides governance health metrics, KPI distribution, completion ratios, delayed KPI detection, operational bottleneck identification, quarterly trends, and employee performance mapping.

---

## Executive Reporting System

Enterprise dashboards summarize organizational performance, department execution, delayed initiatives, operational risk, and quarterly completion. Designed to resemble executive governance tools, enterprise KPI systems, and operational review dashboards.

---

## Audit & Compliance Layer

Every governance operation is traceable. Tracked actions include goal creation, update submissions, manager approvals, workflow modifications, and governance escalations. This supports enterprise accountability, compliance visibility, and operational traceability.

---

## Bonus Enterprise Implementations

| Feature | Description |
|---|---|
| Enterprise RBAC Architecture | Granular role isolation using middleware protection, session-aware routing, and role-scoped dashboards |
| Governance Simulation Engine | Simulates enterprise operational structures, quarterly review systems, and KPI accountability models |
| Shared KPI Ownership | Advanced multi-employee KPI propagation; rarely implemented at this level |
| Executive Analytics Dashboard | High-level operational visibility for governance evaluation |
| Production Cloud Deployment | Fully deployed using Vercel, Neon PostgreSQL, and Prisma ORM |
| Persistent Cloud Database | Real production database — not local mock storage, not static JSON, not in-memory state |
| Enterprise Authentication Layer | Production-grade auth flow using NextAuth, encrypted credentials, and session management |
| Audit Logging Infrastructure | Operational traceability for enterprise governance simulation |
| Real-Time Governance Traversal | Demo widget enables frictionless evaluator testing and instant workflow exploration |

---

## System Architecture

```
Frontend
|
+-- Next.js 16
+-- TypeScript
+-- React
+-- Tailwind UI

Backend
|
+-- Next.js API Routes
+-- Prisma ORM
+-- NextAuth

Database
|
+-- Neon PostgreSQL
     +-- Users
     +-- Goals
     +-- Quarterly Updates
     +-- Shared Goals
     +-- Audit Logs
```

---

## Database Design

| Entity | Purpose |
|---|---|
| users | Enterprise identity system |
| goals | KPI governance objects |
| goal_sheets | Quarterly ownership grouping |
| quarterly_updates | KPI progression engine |
| shared_goals | Collaborative KPI system |
| audit_logs | Governance traceability |
| checkin_comments | Review discussions |

---

## Production Infrastructure

| Layer | Technology |
|---|---|
| Frontend Hosting | Vercel |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| Authentication | NextAuth |
| Runtime | Next.js 16 |
| Language | TypeScript |

---

## Demo Credentials

**Admin**

| Field | Value |
|---|---|
| Email | admin@demo.com |
| Password | password123 |

**Manager 1**

| Field | Value |
|---|---|
| Email | manager@demo.com |
| Password | password123 |

**Manager 2**

| Field | Value |
|---|---|
| Email | manager2@demo.com |
| Password | password123 |

**Employees** (all use password `password123`)

- priya@demo.com
- rahul@demo.com
- ananya@demo.com
- arjun@demo.com
- sneha@demo.com
- vikram@demo.com

---

## Recommended Demo Flow

**Step 1 — Login as Manager**

Explore the team dashboard, goal creation interface, shared goals, and analytics.

**Step 2 — Create a Shared KPI**

Create a goal titled "Reduce Customer Complaints" with a target of 95, assigned to Priya, Rahul, and Ananya.

**Step 3 — Login as Employee**

Explore employee dashboards and submit quarterly updates.
Use the Demo Navigation Widget to quickly traverse quarterly lifecycle views (Q1 → Q4) during evaluation.

**Step 4 — Observe Analytics**

Return to the manager or admin view to review KPI updates, inspect governance trends, and analyze completion states.

**Step 5 — Explore Reports**

Inspect operational summaries, delayed KPIs, quarterly analytics, and governance health.

---

## Local Development Setup

**Clone the repository**

```bash
git clone https://github.com/nsgxi43/AtomQuest.git
cd AtomQuest
```

**Install dependencies**

```bash
npm install
```

**Configure environment variables**

Create a `.env.local` file:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

**Generate Prisma client**

```bash
npx prisma generate
```

**Push database schema**

```bash
npx prisma db push
```

**Seed demo data**

```bash
npx prisma db seed
```

**Start development server**

```bash
npm run dev
```

---

## Production Deployment

The platform is production-deployed using GitHub, Vercel, Neon PostgreSQL, and Prisma ORM via an automatic GitHub integration pipeline with cloud database synchronization and serverless deployment architecture.

---

## Technology Stack

**Frontend**

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Backend**

![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![NextAuth](https://img.shields.io/badge/NextAuth-000000?style=for-the-badge&logo=auth0&logoColor=white)
![API Routes](https://img.shields.io/badge/API_Routes-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)

**Database**

![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-00E5BF?style=for-the-badge&logo=postgresql&logoColor=black)

**Deployment**

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
