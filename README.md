<div align="center">

# ⚛️ AtomQuest

### Enterprise KPI Governance & Performance Intelligence Platform

*Quarterly performance lifecycle · Goal sheet management · RBAC governance · Escalation intelligence · Audit traceability*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-atom--quest--lake.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://atom-quest-lake.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00e599?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)

</div>

---

## 🏛️ What Is AtomQuest?

AtomQuest is a **production-deployed enterprise governance platform** that simulates how modern organizations manage KPI performance, quarterly review cycles, organizational accountability, and governance compliance — all through a structured, role-governed system.

It is not a CRUD demonstration. AtomQuest models the actual operational mechanics of **enterprise performance management**: goal submission lifecycles, manager approval workflows, quarterly check-in tracking, shared KPI ownership, escalation SLA enforcement, audit tracing, and organization-wide compliance scoring.

> **The core thesis:** Performance accountability without governance infrastructure degrades into noise. AtomQuest operationalizes the governance layer — making KPI ownership, review cadence, and accountability visible, auditable, and enforceable.

---

## 🎯 The Enterprise Problem

Most organizations struggle with a predictable set of performance governance failures:

| Failure Mode | Business Impact |
|---|---|
| Goal sheets submitted late or not at all | Cycle integrity collapses; no baseline for review |
| Managers fail to approve within SLA | Downstream quarterly tracking blocked |
| No visibility into cross-team shared KPIs | Accountability gaps in collaborative goals |
| Quarterly check-ins missed silently | Annual reviews are reconstructed, not measured |
| Weightage errors in goal distribution | Scoring becomes mathematically invalid |
| No escalation chain for governance violations | HR and leadership are reactive, never proactive |
| Audit trails missing or incomplete | Compliance and regulatory exposure |

AtomQuest addresses each of these with a purpose-built system: structured data models, enforced workflows, rule-based escalation detection, and complete audit traceability.

---

## 🏗️ Architecture Philosophy

AtomQuest is built on three architectural principles:

**1. Governance as a First-Class Concern**
Every data state transition — draft → submitted → approved → locked — is intentional, enforced, and recorded. The system never silently ignores a lifecycle violation.

**2. Role Isolation Without Complexity**
Three distinct roles (Employee, Manager, Admin) each operate within a bounded governance surface. Dashboards, API routes, and data access patterns are scoped per role at the server level.

**3. Simulation Fidelity**
The platform is seeded with realistic organizational data — two managers, six employees across departments, full quarterly update histories — so evaluators experience a genuine governance system, not an empty shell.

---

## 🧱 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AtomQuest Platform                       │
│                                                                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │  Employee    │   │   Manager    │   │       Admin           │ │
│  │  Dashboard   │   │  Dashboard   │   │     Dashboard         │ │
│  │              │   │              │   │                       │ │
│  │ • Goal Sheet │   │ • Approval   │   │ • Org Overview        │ │
│  │ • Q Updates  │   │   Queue      │   │ • Escalation Engine   │ │
│  │ • Progress   │   │ • Team KPIs  │   │ • Audit Logs          │ │
│  │ • Shared     │   │ • Escalations│   │ • User Directory      │ │
│  │   Goals      │   │ • Check-ins  │   │ • Compliance Score    │ │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬────────── ┘ │
│         │                  │                        │             │
│  ┌──────▼──────────────────▼────────────────────── ▼───────────┐ │
│  │                  Next.js App Router (v16)                    │ │
│  │              Server Components · API Routes                  │ │
│  │              NextAuth Session · RBAC Middleware              │ │
│  └────────────────────────┬────────────────────────────────────┘ │
│                           │                                       │
│  ┌────────────────────────▼────────────────────────────────────┐ │
│  │                    Prisma ORM Layer                          │ │
│  │         Type-safe queries · Migration management            │ │
│  └────────────────────────┬────────────────────────────────────┘ │
│                           │                                       │
│  ┌────────────────────────▼────────────────────────────────────┐ │
│  │               Neon PostgreSQL (Serverless)                   │ │
│  │    Users · GoalSheets · Goals · QuarterlyUpdates           │ │
│  │    SharedGoals · CheckinComments · AuditLogs               │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗃️ Database Schema Design

The data model reflects genuine performance governance structure:

```
User (EMPLOYEE | MANAGER | ADMIN)
 └── GoalSheet  [DRAFT | SUBMITTED | APPROVED | RETURNED | LOCKED]
      └── Goal  [thrustArea, title, weightage, uom, target, isShared]
           └── QuarterlyUpdate  [Q1 | Q2 | Q3 | Q4]
                                [NOT_STARTED | ON_TRACK | COMPLETED | DELAYED | AT_RISK]

SharedGoal  ←→  Goal  (many-to-many via sharedFromId)
             └── primaryOwner (User)

CheckinComment  (Manager → GoalSheet, per Quarter)
AuditLog        (changedBy → entityType + entityId + oldValue + newValue)
```

**Key design decisions:**

- `@@unique([goalId, quarter])` on `QuarterlyUpdate` prevents duplicate check-ins
- `GoalSheet` timestamps (`submittedAt`, `approvedAt`, `lockedAt`) power escalation SLA computation
- `SharedGoal` separates the shared KPI definition from individual goal sheet entries, enabling true collaborative tracking with a designated primary owner
- `AuditLog` stores old/new values as strings for schema-agnostic traceability across any entity type

---

## 📦 Repository Structure

```
atomquest/
├── prisma/
│   ├── schema.prisma          # Full data model
│   ├── seed.ts                # Enterprise-grade seed with org hierarchy
│   └── migrations/            # Full migration history
│
├── src/
│   ├── middleware.ts           # Route protection via session cookie check
│   ├── app/
│   │   ├── (auth)/            # Login page, auth layout
│   │   ├── (dashboard)/
│   │   │   ├── employee/      # Employee goal sheet & quarterly views
│   │   │   ├── manager/       # Approval queue, team KPI views
│   │   │   ├── admin/         # Org-wide governance, audit, escalations
│   │   │   ├── analytics/     # Cross-role analytics dashboard
│   │   │   ├── reports/       # Quarter-wise KPI reporting
│   │   │   └── shared-goals/  # Collaborative KPI management
│   │   └── api/
│   │       ├── auth/          # NextAuth credentials handler
│   │       ├── goal-sheets/   # CRUD + status transitions
│   │       ├── goals/         # Goal management endpoints
│   │       ├── quarterly-updates/ # Q1–Q4 check-in endpoints
│   │       ├── shared-goals/  # Shared KPI creation & assignment
│   │       ├── escalations/   # Rule-based escalation engine
│   │       ├── audit-logs/    # Audit trail retrieval
│   │       ├── analytics/     # Aggregated KPI analytics
│   │       ├── reports/       # Reporting endpoints
│   │       ├── checkins/      # Manager check-in comments
│   │       ├── dashboard/     # Dashboard summary endpoints
│   │       └── users/         # User directory
│   │
│   ├── components/
│   │   ├── DemoSwitcher.tsx   # Floating quarter navigation widget
│   │   ├── SessionWrapper.tsx # Client-side session provider
│   │   ├── admin/             # Admin-specific UI components
│   │   ├── goals/             # Goal form, goal card components
│   │   ├── manager/           # Approval queue, team view components
│   │   ├── reports/           # Report rendering components
│   │   ├── layout/            # Sidebar, nav, shell components
│   │   └── ui/                # Radix UI primitive wrappers
│   │
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   └── prisma.ts          # Prisma singleton client
│   └── types/                 # Shared TypeScript type definitions
```

---

## 🔐 Authentication & RBAC

### Authentication
NextAuth credentials provider with `bcryptjs` password hashing. Sessions are JWT-based and validated server-side on every protected API route and server component.

### Route Protection
`src/middleware.ts` intercepts requests to `/employee/*`, `/manager/*`, `/admin/*`, `/reports/*`, and `/shared-goals/*`. Any request without a valid `next-auth.session-token` or `__Secure-next-auth.session-token` cookie is redirected to `/login`.

### Role-Based Access Control

```
EMPLOYEE  →  Own goal sheet only. Cannot view other employees' data.
             Can submit, view quarterly updates, view shared goals assigned to them.

MANAGER   →  Scoped to direct reports (managerId relationship).
             Approves / returns goal sheets. Views team KPIs.
             Sees team-scoped escalations. Posts check-in comments.

ADMIN     →  Organization-wide visibility.
             Full escalation dashboard. Audit log access.
             User directory management. Global analytics.
```

Role enforcement is applied at the API layer, not just UI. Every API route validates `session.user.role` before returning data, and manager-scoped routes automatically filter by `managerId` from the session — not from query parameters.

---

## 📋 Goal Sheet Lifecycle

Every employee operates within a structured goal sheet workflow:

```
DRAFT ──► SUBMITTED ──► APPROVED ──► LOCKED
                │
                └──► RETURNED (revision required)
                          │
                          └──► SUBMITTED (resubmission)
```

**State semantics:**

| State | Description |
|---|---|
| `DRAFT` | Employee building their goal sheet. Not yet visible to manager. |
| `SUBMITTED` | Submitted for manager review. Employee cannot edit. |
| `RETURNED` | Manager returned for revision with a comment. Employee can edit. |
| `APPROVED` | Manager approved. Quarterly updates can now be tracked. |
| `LOCKED` | Admin-locked post-cycle. Immutable. Quarterly tracking continues. |

Each transition is timestamped (`submittedAt`, `approvedAt`, `lockedAt`) and logged to the audit system.

---

## 🎯 Goal Mathematics

### Unit of Measure (UoM) Types

| UoM | Interpretation |
|---|---|
| `NUMERIC_MAX` | Higher is better (e.g., revenue, throughput) |
| `NUMERIC_MIN` | Lower is better (e.g., defect count, latency) |
| `TIMELINE` | Deadline-based achievement |
| `ZERO` | Binary — achieved or not |

### KPI Completion Formula

```
Completion % = (Actual Achievement / Target) × 100
```

### Quarterly Status Classification

```
≥ 90%        →  COMPLETED
70% – 89%    →  ON_TRACK
50% – 69%    →  DELAYED
< 50%        →  AT_RISK
```

### Annual KPI Score Aggregation

```
Annual Score = (Q1_score + Q2_score + Q3_score + Q4_score) / 4
```

Each quarter's score is stored as `computedScore` on the `QuarterlyUpdate` record, enabling both per-quarter and full-year aggregation without recomputation.

### Weightage Constraint

All goals within a single goal sheet must satisfy:

```
Σ weightage(goal_i) = 100.0
```

Any deviation is detected by the escalation engine (Rule ESC-RULE-004) and surfaced as a data integrity violation that blocks submission.

---

## 🔗 Shared Goals & Collaborative KPIs

AtomQuest supports the enterprise pattern of **shared KPI ownership** — where a single organizational target spans multiple employees or teams.

### Data Architecture

```
SharedGoal (created by manager/admin)
 ├── title, thrustArea, target, uom
 ├── primaryOwnerId  →  User (primary accountable owner)
 └── goals[]         →  Goal entries across multiple GoalSheets
```

Each participating employee has a `Goal` record in their own `GoalSheet` that references the parent `SharedGoal` via `sharedFromId`. The `isPrimaryOwner` flag identifies which participant carries primary accountability.

### Governance Implications
- All participants track quarterly updates independently
- The primary owner's score is considered authoritative for organizational rollups
- Managers can view shared KPI progress across their direct reports in aggregate

---

## ⚡ Escalation Engine

The escalation engine (`/api/escalations`) is a **rule-based governance processor** that evaluates live database state against configurable SLA thresholds and emits structured escalation records with severity classification, timeline stages, risk scores, and compliance metadata.

### Escalation Rules

#### ESC-RULE-001 — Goal Submission Delay
```
Trigger:   GoalSheet.status = DRAFT  AND  daysSince(createdAt) ≥ 14
Severity:  MEDIUM (14–30 days)  |  HIGH (> 30 days)
Chain:     Employee → Manager → HR → Governance
RiskScore: min(100, 40 + daysPending)
```

#### ESC-RULE-002 — Approval Pending (SLA Breach)
```
Trigger:   GoalSheet.status = SUBMITTED  AND  daysSince(submittedAt) ≥ 7
Severity:  HIGH (7–14 days)  |  CRITICAL (> 14 days)
Chain:     Manager → HR Leadership → Governance Board
RiskScore: min(100, 60 + daysPending)
```

#### ESC-RULE-003 — Quarterly Check-in Missed
```
Trigger:   GoalSheet.status = LOCKED  AND
           expected quarters based on daysSince(lockedAt) / 90
           AND no QuarterlyUpdate exists for that quarter
Severity:  CRITICAL
Chain:     Employee → Manager → HR Escalated → Governance Board
RiskScore: 90
```

#### ESC-RULE-004 — Weightage Mismatch
```
Trigger:   Σ goal.weightage ≠ 100.0  (tolerance: 0.01)
Severity:  LOW
Chain:     Employee (submission blocked by system)
RiskScore: 20
```

### Compliance Score Formula

```
submissionScore  = (submittedSheets / totalEmployees) × 100
approvalScore    = (approvedSheets / submittedSheets) × 100
escalationPenalty = min(30, totalActiveEscalations × 3)

complianceScore = max(0,
  submissionScore × 0.4 + approvalScore × 0.6 − escalationPenalty
)
```

This single score gives leadership an at-a-glance organizational governance health metric.

### Escalation Response Shape

Each escalation record includes:
- `type`, `severity`, `status` — classification fields
- `issueSummary`, `detailText` — human-readable governance narrative
- `daysPending`, `chainStage`, `escalatedTo` — accountability routing
- `timeline[]` — ordered governance stages with completion states
- `complianceMeta` — `ruleId`, `threshold`, `riskScore`, `category`
- `employee` + `manager` — full identity context

---

## 📊 Analytics Architecture

The analytics layer aggregates cross-entity governance data into dashboard metrics:

- **Completion rate distribution** — percentage of goals in each status (COMPLETED / ON_TRACK / DELAYED / AT_RISK) across the organization or team scope
- **Quarterly trend analysis** — Q1 through Q4 score progression per employee or aggregate
- **KPI weightage distribution** — visual breakdown of how goal weight is distributed across thrust areas
- **Governance pipeline** — goal sheet funnel: DRAFT → SUBMITTED → APPROVED → LOCKED counts

Analytics endpoints respect role scoping: managers see only their direct reports; admins see organization-wide data.

---

## 📑 Audit System

Every significant state change is persisted to the `AuditLog` table:

```typescript
model AuditLog {
  entityType        String   // "GoalSheet" | "Goal" | "QuarterlyUpdate" | ...
  entityId          String   // CUID of the affected record
  changedById       String   // User who performed the action
  changeDescription String   // Human-readable event label
  oldValue          String?  // Previous state (JSON serialized)
  newValue          String?  // New state (JSON serialized)
  changedAt         DateTime
}
```

**Audit coverage includes:**
- Goal sheet status transitions (DRAFT → SUBMITTED, APPROVED, RETURNED, LOCKED)
- Goal creation and modification
- Quarterly update submissions
- Shared goal assignments

Admin dashboard surfaces audit logs with filtering by entity type, user, and time range — providing full governance traceability without external tooling.

---

## 🎛️ Demo Navigation Widget

The floating `DemoSwitcher` widget is an **evaluator assistance utility** — not a role switcher, not an authentication bypass.

**What it does:**
- Renders as a draggable, pointer-capture–enabled floating panel (bottom-right, z-index 50)
- Allows selection of `Real Time | Simulate Q1 | Q2 | Q3 | Q4`
- Writes a `demo_quarter` cookie that instructs server components and API routes to present data as if the selected quarter is active
- Triggers a full page reload to apply the state consistently across server and client components

**What it does not do:**
- It does not switch the authenticated user's role
- It does not bypass RBAC or session validation
- It does not modify any database records
- Role-specific data access restrictions remain fully enforced regardless of widget state

This design means an evaluator logged in as `manager@demo.com` can traverse Q1 through Q4 lifecycle states while remaining under the Manager RBAC scope throughout.

---

## 🚀 Production Deployment

| Layer | Technology | Notes |
|---|---|---|
| Frontend + API | Next.js 16 on Vercel | Serverless edge deployment |
| Database | Neon PostgreSQL | Serverless, connection-pooled |
| ORM | Prisma 6.19 | Type-safe schema + migrations |
| Auth | NextAuth v4 | Credentials provider, JWT sessions |
| Styling | TailwindCSS v4 | PostCSS pipeline |
| Forms | React Hook Form + Zod | Runtime schema validation |
| Charts | Recharts | Quarterly analytics visualization |
| UI Primitives | Radix UI | Dialog, Select, Tabs, Toast, Dropdown |

---

## 🔑 Demo Access Credentials

All accounts share the password: **`password123`**

### Admin
| Email | Role | Access Scope |
|---|---|---|
| `admin@demo.com` | ADMIN | Organization-wide governance, audit logs, escalation engine, user directory |

### Managers
| Email | Name | Team |
|---|---|---|
| `manager@demo.com` | Alice Johnson | Priya, Rahul, Ananya |
| `manager2@demo.com` | Bob Smith | Arjun, Sneha, Vikram |

### Employees
| Email | Name | Department |
|---|---|---|
| `priya@demo.com` | Priya Sharma | Product Engineering |
| `rahul@demo.com` | Rahul Verma | Operations |
| `ananya@demo.com` | Ananya Iyer | QA Automation |
| `arjun@demo.com` | Arjun Nair | Sales |
| `sneha@demo.com` | Sneha Reddy | HR |
| `vikram@demo.com` | Vikram Singh | Marketing |

> **Seeded state:** Priya, Ananya, Arjun, and Sneha have fully locked goal sheets with complete Q1–Q4 quarterly update histories. Rahul and Vikram have draft sheets, which will surface in the escalation engine.

---

## 🧭 Recommended Evaluator Walkthrough

### Pass 1 — Admin Governance Overview (5 min)

1. Log in as `admin@demo.com`
2. Review the admin dashboard — goal sheet pipeline counts, compliance score
3. Navigate to **Escalations** — observe rule-based escalation records with severity, timeline stages, and SLA breach details
4. Navigate to **Audit Logs** — review governance traceability records
5. Navigate to **User Directory** — view org hierarchy

### Pass 2 — Manager Approval Workflow (5 min)

1. Log in as `manager@demo.com`
2. Review the approval queue — Rahul's draft sheet will show as pending submission
3. Navigate to **Team KPIs** — view aggregate quarterly performance for direct reports
4. Navigate to **Escalations** — observe manager-scoped escalation view (only own team)

### Pass 3 — Employee Goal Lifecycle (5 min)

1. Log in as `priya@demo.com`
2. View goal sheet with locked status and complete Q1–Q4 update history
3. Navigate to **Shared Goals** — observe any assigned collaborative KPIs
4. Switch to `rahul@demo.com` — observe draft state, incomplete submission

### Pass 4 — Quarterly Lifecycle Simulation (5 min)

1. Log in as any role
2. Use the **Demo Mode** floating widget (bottom-right) to switch between Q1, Q2, Q3, Q4
3. Observe how dashboards, progress indicators, and KPI states respond to the active quarter context
4. Return widget to **Real Time** to restore live state

---

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL connection string (or Neon project)

### Setup

```bash
git clone <repository-url>
cd atomquest

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set DATABASE_URL and NEXTAUTH_SECRET in .env.local

# Apply migrations
npx prisma migrate deploy

# Seed enterprise demo data
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with any demo credential.

---

## 🗺️ Future Roadmap

| Capability | Description |
|---|---|
| **Notification Engine** | Real-time in-app notifications for goal approvals, returns, and escalation triggers |
| **Goal Revision History** | Full diff-based version history for goal edits, surfaced in audit UI |
| **Bulk Operations** | Admin batch approval, bulk goal sheet locking for cycle close |
| **Export & Reporting** | PDF/CSV export of quarterly performance reports per employee |
| **Real SSO Integration** | OIDC/SAML integration replacing simulated Entra ID experience |
| **Performance Calibration** | Bell-curve calibration layer for cross-team normalization |
| **Mobile-Responsive Shell** | Fully adapted mobile experience for employee self-service |
| **Webhook Outbound** | Governance event webhooks for HRMS integration |

---

## 🏆 Why AtomQuest Stands Apart

Most portfolio projects demonstrate the ability to build forms and query a database. AtomQuest demonstrates something harder: the ability to **model organizational systems**.

- **Real governance mechanics** — not simulated with fake dropdowns, but enforced through state machines, SLA computation, and rule engines operating on live data
- **Role isolation at the data layer** — RBAC is not a UI concern; it is enforced in every API route via server-side session validation and Prisma query scoping
- **Escalation intelligence** — four distinct compliance rules with configurable thresholds, multi-stage timeline construction, risk scoring, and a composite organizational compliance metric
- **Audit-first design** — every significant state transition is persisted with old/new value tracking for forensic governance traceability
- **Production deployment** — live on Vercel with Neon serverless PostgreSQL; not a localhost demo
- **Enterprise data fidelity** — seeded with a realistic org hierarchy, multi-department employee distribution, and complete quarterly update histories

AtomQuest is built for the evaluator who asks: *"Can this engineer design systems, not just write code?"*

---

<div align="center">

**Built with precision. Deployed with intent.**

[Live Platform →](https://atom-quest-lake.vercel.app)

</div>
