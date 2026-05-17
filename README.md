# AtomQuest
### Enterprise Performance Governance & Goal Management Platform

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Authentication-NextAuth-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Production_Ready-22c55e?style=for-the-badge" />
</p>

---

# Overview

AtomQuest is a production-grade enterprise governance platform designed to manage:

- Organizational goals
- Quarterly KPI tracking
- Goal sheet approvals
- Shared ownership KPIs
- SLA governance
- Escalation workflows
- Executive analytics
- Audit logging
- Compliance monitoring

Unlike traditional HR systems that stop at goal creation, AtomQuest focuses heavily on **governance enforcement**, ensuring organizations maintain operational compliance throughout the entire performance lifecycle.

The platform simulates real enterprise-grade workflows used inside large organizations where:
- employees submit quarterly objectives,
- managers approve performance plans,
- leadership tracks governance health,
- and automated systems detect compliance violations in real-time.

---

# Enterprise Problem Statement

Large organizations face several recurring governance issues:

- Employees delay goal submissions
- Managers fail to approve within SLA timelines
- Weightage distributions become invalid
- Quarterly check-ins are skipped
- Shared KPIs lose synchronization
- Leadership lacks real-time visibility

Traditional systems become passive record keepers.

AtomQuest transforms performance management into an **active governance system**.

---

# Core Features

| Feature | Description |
|---|---|
| Goal Management | Create and manage weighted performance goals |
| Shared Goals | Cross-functional KPI ownership system |
| Quarterly Check-ins | Q1-Q4 performance tracking |
| Governance Engine | Automated SLA breach detection |
| Escalation Monitoring | Real-time compliance violations |
| Analytics Dashboard | Executive-level performance visibility |
| Reports System | Quarter-wise reporting & KPI aggregation |
| Role Based Access | Employee / Manager / Admin hierarchy |
| Audit Logging | Immutable governance audit trail |
| Entra ID Simulation | Enterprise SSO demonstration |
| Demo Mode Widget | Instant role switching for evaluators |

---

# System Workflow

---

## 1. Goal Creation Phase

Employees create a Goal Sheet for the active performance cycle.

Each Goal Sheet:
- belongs to one employee
- contains multiple goals
- contains weighted KPI allocations
- must total exactly 100%

Example:

| Goal | Weightage |
|---|---|
| Improve SLA Resolution | 40% |
| Automation Improvements | 35% |
| Customer Satisfaction | 25% |

---

## 2. Submission Workflow

Once weightages equal 100%:
- Employee submits the sheet
- Sheet becomes locked
- Status changes from:

```txt
DRAFT → PENDING_APPROVAL
```

Managers are then notified through the governance dashboard.

---

## 3. Manager Approval Lifecycle

Managers can:
- Approve
- Return for Revision

Approval Flow:

```txt
DRAFT
   ↓
PENDING_APPROVAL
   ↓
APPROVED
```

Returned Flow:

```txt
PENDING_APPROVAL
   ↓
RETURNED
   ↓
DRAFT
```

Every action automatically creates immutable audit logs.

---

# Quarterly Performance Lifecycle

The platform tracks performance progressively across:

- Q1
- Q2
- Q3
- Q4

Each quarter introduces:
- new achievement updates
- governance checks
- escalation monitoring
- executive analytics refreshes

---

## Q1 — Goal Initialization

Activities:
- Goal sheet creation
- KPI distribution
- Ownership assignment
- Governance validation

System Checks:
- Weightage validation
- Goal completeness
- Approval timelines

---

## Q2 — Mid-Cycle Tracking

Activities:
- Progress submissions
- KPI achievement updates
- Shared goal synchronization

System Checks:
- Missing check-ins
- Delayed submissions
- SLA monitoring

---

## Q3 — Governance Monitoring

Activities:
- Performance stabilization
- Risk detection
- Escalation review

System Checks:
- Delayed approvals
- Low achievement trends
- Governance deterioration

---

## Q4 — Final Evaluation

Activities:
- Final achievement scoring
- Compliance aggregation
- Executive reporting

Outputs:
- Final KPI score
- Governance health score
- Audit records
- Organizational analytics

---

# Goal Mathematics & KPI Computation

AtomQuest computes performance mathematically using weighted aggregation.

## Overall Goal Sheet Formula

\[
\text{Overall Goal Sheet Score} =
\sum_{i=1}^{n}
\left(
\frac{\text{Goal Weightage}_i}{100}
\times
\text{Achievement Percentage}_i
\right)
\]

### Example

| Goal | Weightage | Achievement |
|---|---|---|
| SLA Resolution | 40 | 90 |
| Automation | 35 | 80 |
| Customer Satisfaction | 25 | 95 |

Final Score:

\[
(0.40 \times 90)
+
(0.35 \times 80)
+
(0.25 \times 95)
=
87.75
\]

---

# Governance & Compliance Engine

The Governance Engine is the flagship enterprise feature of AtomQuest.

Instead of passive reporting, the system continuously computes compliance violations in real-time.

---

# Escalation Rules

---

## 1. Submission Delayed

### Trigger
Goal Sheet remains in `DRAFT` beyond organizational deadline.

### Severity
HIGH

---

## 2. Approval Delayed

### Trigger
Manager fails to approve within SLA duration.

### Severity
MEDIUM

---

## 3. Weightage Mismatch

### Trigger
Total weightage ≠ 100%

### Severity
CRITICAL

---

## 4. Missed Quarterly Check-in

### Trigger
Approved goal has no quarterly update.

### Severity
LOW / MEDIUM

---

# Compliance Score Formula

Organizational governance health is mathematically computed using:

\[
\text{Compliance Score}
=
\left(
\frac{
\text{Total Employees}
-
\text{Active Escalations}
}{
\text{Total Employees}
}
\right)
\times 100
\]

---

# Shared Goals System

Enterprise KPIs are rarely isolated.

AtomQuest introduces a Shared Goals architecture where:
- multiple employees contribute toward one KPI
- one user acts as the Primary KPI Owner
- achievement synchronization happens automatically

---

## Shared Goal Workflow

### Step 1
Manager/Admin creates Shared Goal

### Step 2
Contributors are assigned

### Step 3
Primary Owner selected

### Step 4
Goal automatically propagates into:
- contributor goal sheets
- analytics pipelines
- governance tracking

### Step 5
Achievement updates synchronize across all linked entities

---

# Demo Mode Widget

To optimize hackathon demonstrations and evaluator onboarding, AtomQuest includes a floating Demo Mode Widget.

The widget allows:
- instant role switching
- no repeated logins
- live RBAC demonstrations
- real-time dashboard transitions

Roles:
- Admin
- Manager
- Employee

This allows evaluators to explore:
- analytics
- governance dashboards
- escalation systems
- reports
- shared goals
- approvals

within seconds.

---

# Authentication & RBAC

AtomQuest uses:
- NextAuth.js
- JWT Sessions
- Middleware Route Protection
- Role-Based Access Control

---

# Supported Roles

| Role | Permissions |
|---|---|
| EMPLOYEE | Goal creation, check-ins |
| MANAGER | Team approvals, governance monitoring |
| ADMIN | Full organizational visibility |

---

# Microsoft Entra ID Simulation

The platform includes a high-fidelity Microsoft Entra ID simulation layer.

Purpose:
- demonstrate enterprise SSO readiness
- simulate Azure AD organizational flows
- avoid dependency on external tenants during evaluation

Features:
- corporate account picker
- role-mapped directory simulation
- JWT-backed sessions
- SSO UX replication

---

# System Architecture

```txt
┌──────────────────────────┐
│      Client Layer        │
│ React + Next.js UI       │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Next.js Middleware Layer │
│ RBAC + Session Security  │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│     API Route Layer      │
│ Business Logic Engine    │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│       Prisma ORM         │
│ Type-safe DB Access      │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ PostgreSQL (Neon DB)     │
│ Enterprise Data Storage  │
└──────────────────────────┘
```

---

# Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Full-stack framework |
| React 19 | Frontend UI |
| TypeScript | Strict typing |
| Prisma ORM | Database ORM |
| PostgreSQL (Neon) | Cloud relational database |
| NextAuth.js | Authentication |
| TailwindCSS | Styling |
| Shadcn UI | Component system |
| Zod | Validation |
| React Hook Form | Form management |
| Recharts | Analytics visualization |

---

# Database Design

## Core Models

| Model | Purpose |
|---|---|
| User | Employee hierarchy |
| GoalSheet | Performance cycle container |
| Goal | Individual KPI |
| CheckIn | Quarterly tracking |
| SharedGoal | Cross-functional KPI mapping |
| AuditLog | Immutable governance history |

---

# Relationship Architecture

```txt
User
 ├── GoalSheets
 │     ├── Goals
 │           ├── CheckIns
 │
 ├── Manager
 └── DirectReports
```

---

# Analytics System

The Analytics Dashboard provides:
- KPI trend visualization
- compliance monitoring
- escalation tracking
- departmental scoring
- quarterly progress analysis

Visualization includes:
- Line Charts
- Bar Graphs
- Score Aggregations
- Trend Monitoring

---

# Reports System

The Reports Module supports:
- Quarter filtering (Q1-Q4)
- Goal achievement tracking
- Team performance visibility
- Executive exports

---

# Audit Logging System

Every critical governance event creates immutable audit records.

Examples:
- Goal approvals
- Goal returns
- Shared goal creation
- Status transitions
- KPI synchronization

This ensures:
- traceability
- compliance visibility
- governance integrity

---

# API Highlights

| Endpoint | Purpose |
|---|---|
| `/api/goals` | Goal CRUD |
| `/api/goal-sheets` | Goal Sheet lifecycle |
| `/api/checkins` | Quarterly updates |
| `/api/escalations` | Governance computation |
| `/api/reports` | Reporting aggregation |
| `/api/shared-goals` | Shared KPI synchronization |
| `/api/sso-directory` | Enterprise SSO simulation |

---

# Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@demo.com | demo123 |
| Manager | manager@demo.com | demo123 |
| Manager | manager2@demo.com | demo123 |
| Employee | priya@demo.com | demo123 |

---

# Local Development Setup

## 1. Clone Repository

```bash
git clone https://github.com/yourusername/AtomQuest.git
cd AtomQuest
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create:

```env
.env
```

Add:

```env
DATABASE_URL="your-neon-postgres-url"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 4. Database Setup

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

---

## 5. Run Development Server

```bash
npm run dev
```

---

# Production Deployment

AtomQuest is deployed using:

- Vercel
- Neon PostgreSQL
- Prisma ORM

Production features:
- serverless deployment
- cloud database persistence
- automatic CI/CD
- scalable architecture

---

# Security Features

- Middleware route protection
- JWT session validation
- Role-based authorization
- Zod schema validation
- Immutable audit trails
- Protected API handlers

---

# Current Limitations

- Entra ID is simulated (not real OAuth2)
- Escalations are dynamically computed
- Notifications not yet integrated

---

# Future Roadmap

- Microsoft Graph Integration
- Slack / Teams Governance Bots
- AI Risk Prediction
- Email Notification Pipelines
- Predictive KPI Analytics
- Background Governance Workers

---

# Production Readiness

## Completed

- Authentication & RBAC
- Goal Lifecycle
- Shared Goals
- Governance Engine
- Quarterly Tracking
- Reports & Analytics
- Enterprise UI
- Cloud Deployment
- PostgreSQL Migration

---

# Repository Structure

```txt
AtomQuest/
├── prisma/
├── public/
├── src/
├── docs/
├── .env.example
├── package.json
├── README.md
└── tsconfig.json
```

---

# Why AtomQuest Matters

AtomQuest demonstrates how enterprise systems are not simply CRUD dashboards.

They require:
- governance enforcement
- hierarchical access control
- SLA monitoring
- auditability
- mathematical KPI aggregation
- organizational visibility
- compliance computation

The platform was architected to simulate real-world enterprise performance governance systems used at organizational scale.

---

# Author

### Nishanth S Gowda

Built as a production-grade enterprise governance platform demonstrating:
- full-stack architecture
- scalable system design
- enterprise workflow engineering
- governance automation
- secure RBAC implementation
- KPI computation systems

---

# License

MIT License
