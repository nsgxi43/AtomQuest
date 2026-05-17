# AtomQuest Platform Documentation
**Enterprise Performance Governance & Goal Management System**

---

## 1. Project Overview

**AtomQuest** is a production-grade, enterprise performance governance platform designed to facilitate goal management, quarterly reviews, manager approvals, and compliance tracking across large organizations. 

Unlike traditional HR goal-setting tools, AtomQuest focuses heavily on **Governance and Escalations**. In large enterprises, the primary challenge is not just setting goals, but ensuring that goals are submitted on time, weightages add up to 100%, check-ins are not missed, and managers process approvals within Service Level Agreements (SLAs).

**Business Problem Solved:**
Enterprises often lose track of performance compliance due to fragmented systems. AtomQuest centralizes the workflow with an automated escalation engine that enforces rule-based compliance, providing HR Admins and Executive Leadership with real-time visibility into governance violations.

**Target Users:**
- **Employees**: Set goals, track quarterly progress, manage shared responsibilities.
- **L1 Managers**: Approve goal sheets, review team check-ins, manage team-level escalations.
- **HR Admins**: Oversee organization-wide compliance, audit logs, user provisioning, and executive reporting.

---

## 2. Core Features Overview

| Feature | Description | Roles | Backend Support |
|---------|-------------|-------|-----------------|
| **Goal Management** | Create, edit, and track individual performance goals with defined weightages. | Employee, Manager | `/api/goals`, `/api/goal-sheets` |
| **Shared Goals** | Distribute goals across multiple employees with a primary KPI owner and weightage splits. | All Roles | `/api/shared-goals` |
| **Quarterly Check-ins** | Submit progress updates and achievement percentages on a quarterly basis (Q1-Q4). | Employee, Manager | `/api/checkins`, `/api/quarterly-updates` |
| **Manager Approvals** | Workflow for managers to review, approve, or return goal sheets for revision. | Manager | `/api/goal-sheets/[id]/approve`, `.../return` |
| **Escalation Engine** | Automated detection of SLA breaches (late submissions, missed check-ins, weightage errors). | Admin, Manager | `/api/escalations` |
| **Governance Dashboard** | Real-time KPIs, compliance scores, and escalation monitoring for executives. | Admin | `/api/escalations`, `/api/dashboard/stats` |
| **Team Governance Monitor** | Scoped escalation view allowing managers to see violations only for their direct reports. | Manager | `/api/escalations` (scoped by session) |
| **Analytics & Reports** | Organization-wide and team-specific performance data visualization and exportable reports. | Admin, Manager | `/api/analytics`, `/api/reports` |
| **Entra ID Simulator** | High-fidelity Microsoft Entra ID (Azure AD) SSO simulation for enterprise identity demonstration. | All Roles | `/api/sso-directory`, `next-auth` credentials |
| **Demo Mode Widget** | Draggable UI widget allowing judges to instantly switch between pre-configured enterprise roles. | All Roles | Local State + NextAuth `signIn` |
| **Compliance Scoring** | Mathematical computation of organizational health based on active vs. violated policies. | Admin | Computed in `/api/escalations` |
| **Audit Logging** | Immutable system of record tracking critical status changes and approvals. | Admin | `/api/audit-logs` |

---

## 3. Tech Stack

AtomQuest is built on a modern, type-safe, full-stack JavaScript ecosystem.

- **Next.js (App Router)**: The core React framework providing server-side rendering (SSR), API routes, and optimized routing. Chosen for its enterprise scalability and seamless frontend/backend integration.
- **React**: UI library for building responsive, component-driven interfaces.
- **TypeScript**: Strict static typing across the entire stack, eliminating runtime errors and ensuring API contract integrity between the database and the client.
- **Prisma ORM**: Type-safe database schema management and querying. Chosen for its developer ergonomics and relational modeling capabilities.
- **SQLite / PostgreSQL**: Relational database (currently SQLite for demo portability, easily swappable to Postgres via Prisma configuration).
- **TailwindCSS**: Utility-first CSS framework for rapid, consistent styling without leaving the component context.
- **NextAuth.js**: Secure authentication, session management, and Role-Based Access Control (RBAC).
- **Shadcn UI & Lucide Icons**: Accessible, unstyled component primitives and clean enterprise iconography.
- **React Hook Form & Zod**: Schema-based form validation ensuring data integrity before it reaches the backend.

---

## 4. System Architecture

AtomQuest employs a **Monolithic Serverless Architecture** using Next.js.

1. **Frontend Layer (Client Components)**: React components manage local state (e.g., modals, form inputs) and use `fetch` to communicate with Next.js API routes.
2. **Proxy / Middleware Layer**: Next.js middleware intercepts requests, validating JWT sessions and enforcing RBAC route protection (e.g., blocking an Employee from accessing `/admin`).
3. **API Layer (Server Components & Route Handlers)**: Secure endpoints that execute business logic. They extract the user ID and role from the secure HTTP-only session token to prevent unauthorized data access.
4. **Data Access Layer (Prisma)**: API routes use Prisma Client to safely interact with the database.
5. **Database Layer**: Relational data storage enforcing foreign key constraints and schema integrity.

**Example Architecture Flow (Employee Submitting a Goal Sheet):**
`Client Form` → `POST /api/goal-sheets/[id]/submit` → `NextAuth Validation` → `Prisma Update (status: PENDING_APPROVAL)` → `Prisma Create (Audit Log)` → `Client UI Updates`.

---

## 5. Folder / File Structure

```text
atomquest/
├── prisma/
│   ├── schema.prisma             # Database schema & entity relationships
│   ├── seed.ts                   # Demo data population script
│   └── migrations/               # Database version control
├── src/
│   ├── app/
│   │   ├── (auth)/login/         # Enterprise split-layout login portal
│   │   ├── (dashboard)/          # Protected application routes
│   │   │   ├── admin/            # HR/Admin specific routes (Audit, Users, Escalations)
│   │   │   ├── employee/         # Employee routes (Goal creation, tracking)
│   │   │   ├── manager/          # Manager routes (Approvals, Team check-ins)
│   │   │   ├── analytics/        # Global analytics dashboard
│   │   │   ├── reports/          # Tabular achievement reporting
│   │   │   ├── shared-goals/     # Shared KPI management
│   │   │   └── layout.tsx        # Common dashboard shell (Sidebar, TopBar)
│   │   └── api/                  # Backend API Route Handlers
│   │       ├── admin/            # Admin-only mutations
│   │       ├── auth/             # NextAuth endpoints
│   │       ├── checkins/         # Quarterly update logic
│   │       ├── escalations/      # Rule-based governance engine
│   │       ├── goal-sheets/      # Goal sheet lifecycle (Submit, Approve, Return)
│   │       ├── goals/            # Individual goal CRUD
│   │       ├── reports/          # Data aggregation for reports
│   │       ├── shared-goals/     # Shared goal synchronization
│   │       └── sso-directory/    # Simulated Azure AD payload
│   ├── components/
│   │   ├── layout/               # Sidebar, TopBar, DashboardLayout
│   │   ├── ui/                   # Reusable atomic components (Button, Modal, ScoreBar)
│   │   └── DemoSwitcher.tsx      # Draggable role-switching widget
│   ├── lib/
│   │   ├── auth.ts               # NextAuth configuration & callbacks
│   │   ├── prisma.ts             # Global Prisma singleton
│   │   ├── utils.ts              # Tailwind merge & formatting helpers
│   │   └── validations.ts        # Zod schema definitions
│   ├── middleware.ts             # Edge route protection & RBAC
│   └── types/                    # Global TypeScript interfaces
```

---

## 6. Authentication System

AtomQuest uses **NextAuth.js** with a customized Credentials provider that supports two visual flows: Standard Email/Password and a Simulated Microsoft Entra ID SSO.

**Microsoft Entra ID (Azure AD) Simulator:**
To demonstrate enterprise readiness without requiring a live Azure tenant, the platform includes an SSO simulator.
1. The user clicks "Continue with Microsoft Entra ID".
2. The UI fetches `/api/sso-directory`, which maps the application's database users to a simulated corporate directory, assigning fake Azure AD group claims (`AAD-GRP-ADMIN`, etc.).
3. An Account Picker modal displays the corporate hierarchy.
4. Selecting an account triggers the `signIn` function, bypassing manual password entry for the demo, but utilizing the exact same secure JWT generation as a real login.

**Session & RBAC:**
Upon successful login, NextAuth generates a JWT containing the user's `id` and `role`. 
The `middleware.ts` intercepts navigation:
- `/admin/*` requires `role === "ADMIN"`
- `/manager/*` requires `role === "MANAGER" || role === "ADMIN"`
- Failure to meet role requirements results in an immediate redirect to `/login` or an unauthorized page.

---

## 7. Database Design

The schema is heavily relational, designed to support hierarchical reporting and cyclical performance management.

**Core Models:**
- **`User`**: Represents employees. Includes `role` (ADMIN, MANAGER, EMPLOYEE) and a self-referencing relationship: `managerId` points to another User, creating the org chart.
- **`GoalSheet`**: A container for a specific user's goals within a specific cycle (e.g., FY2025). Tracks lifecycle status (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`).
- **`Goal`**: Individual performance targets inside a GoalSheet. Includes `title`, `description`, and `weightage` (must sum to 100% per sheet).
- **`SharedGoal`**: Connects multiple `Goal` records across different users. Identifies a `primaryOwnerId`.
- **`CheckIn`**: Quarterly updates associated with a specific `Goal`. Stores qualitative feedback and quantitative completion percentages for Q1, Q2, Q3, Q4.
- **`AuditLog`**: Immutable records created automatically by the API when critical actions occur (e.g., a manager approves a sheet).

**Relationships:**
`User` (1) ─── (M) `GoalSheet` (1) ─── (M) `Goal` (1) ─── (M) `CheckIn`
`User` (Manager) (1) ─── (M) `User` (Direct Reports)

---

## 8. User Roles & Permissions

**1. Employee (`EMPLOYEE`)**
- **Access**: Employee Dashboard, Shared Goals, Employee Reports.
- **Capabilities**: Draft goals, distribute weightages, submit sheets for approval, log quarterly check-ins.
- **Restrictions**: Cannot approve goals, cannot view other users' data (unless shared), no access to global escalations.

**2. L1 Manager (`MANAGER`)**
- **Access**: Employee capabilities + Manager Dashboard, Team Check-ins, Team Reports.
- **Capabilities**: View direct reports' goal sheets, approve/return sheets, view "Team Governance Monitor" (escalations specifically for their direct reports).
- **Restrictions**: Cannot view data outside their immediate reporting hierarchy, cannot access global admin settings.

**3. HR / Administrator (`ADMIN`)**
- **Access**: Global access (Analytics, Global Reports, Admin Governance Dashboard, Audit Logs, User Management).
- **Capabilities**: View all company metrics, monitor all global escalations, track compliance health, view system audit logs.
- **Restrictions**: Generally does not participate in the direct goal approval workflow (unless acting as a manager to specific reports).

---

## 9. Goal Lifecycle Workflow

1. **Drafting**: An Employee creates a `GoalSheet`. Status is `DRAFT`. They add goals and assign weightages. The system validates that total weightage cannot exceed 100%.
2. **Submission**: Once weightage equals exactly 100%, the Employee clicks Submit. The API updates the status to `PENDING_APPROVAL` and locks the sheet from further edits.
3. **Manager Review**: The assigned Manager sees the pending sheet in their dashboard. They can:
   - **Approve**: Status becomes `APPROVED`. Audit log is generated.
   - **Return**: Status reverts to `DRAFT` with feedback. Employee must revise and resubmit.
4. **Quarterly Tracking**: During active quarters, the Employee creates `CheckIn` records, updating their achievement percentage (0-100%).
5. **Governance**: Throughout this lifecycle, the Escalation Engine monitors the timestamps and statuses.

---

## 10. Shared Goals System

In enterprise environments, KPIs are rarely isolated. The Shared Goals module allows cross-functional collaboration.
- An Administrator or Manager creates a `SharedGoal` entity.
- They assign a **Primary Owner** (accountable for the overall KPI) and **Contributors**.
- The API automatically creates linked `Goal` records in the respective users' active `GoalSheet`s.
- When the Primary Owner updates the achievement percentage, a synchronization API (`/api/shared-goals/sync-achievement`) automatically mirrors that progress to all contributors, ensuring data consistency across the organization.

---

## 11. Quarterly Tracking System

Performance is measured progressively via the `/api/checkins` API.
- Each `Goal` can have check-ins specifically flagged for `Q1`, `Q2`, `Q3`, and `Q4`.
- A check-in contains an `achievementPercentage` (e.g., 50%).
- The platform aggregates these percentages, multiplied by the goal's `weightage`, to calculate the overall Goal Sheet completion score.
- The `ScoreBar` UI component visualizes this progress dynamically.

---

## 12. Escalation & Governance Engine

This is the flagship enterprise feature of AtomQuest. Instead of relying on passive reporting, the system actively computes compliance violations on-the-fly.

**The Engine (`/api/escalations`) calculates violations in real-time based on the following rules:**

1. **Submission Delayed (SLA Breach)**
   - **Trigger**: GoalSheet is still in `DRAFT` status AND the current date is past the organizational deadline.
   - **Severity**: HIGH.
2. **Approval Delayed (SLA Breach)**
   - **Trigger**: GoalSheet is `PENDING_APPROVAL` for more than 7 days.
   - **Severity**: MEDIUM. (Flags the Manager, not the Employee).
3. **Weightage Mismatch**
   - **Trigger**: An active GoalSheet has total weightage != 100%.
   - **Severity**: CRITICAL. (Indicates data corruption or incomplete planning).
4. **Missed Check-in**
   - **Trigger**: An `APPROVED` goal has no check-in logged for the current active quarter.
   - **Severity**: LOW / MEDIUM.

**Manager Scoping:**
The Escalation API intelligently filters results based on the session role. If an Admin calls it, it returns organizational violations. If a Manager calls it, Prisma retrieves only the violations belonging to users where `managerId === session.user.id`.

**Compliance Score:**
Calculated mathematically: `(Total Employees - Active Escalations) / Total Employees * 100`. Visualized prominently on the Admin Dashboard.

---

## 13. Analytics & Reporting

- **Analytics Dashboard**: Utilizes Recharts to render visual line graphs (e.g., Completion Trends) and bar charts (Departmental KPI Scores).
- **Reports Module**: A highly functional data grid allowing users to filter goal achievement data by Quarter (Q1-Q4) and export capabilities.
- **Data Aggregation**: The `/api/reports` and `/api/dashboard/stats` routes utilize complex Prisma queries (using `include` and relation traversals) to aggregate average completion scores across the entire company hierarchy.

---

## 14. UI/UX Design Philosophy

AtomQuest utilizes a premium, dark-mode dominant **Native Enterprise SaaS** aesthetic.
- **Login Portal**: A 60/40 split layout. The left side serves as a high-fidelity "Governance Product Showcase" featuring live SVG charts and compliance KPIs on a `slate-950` background. The right side is a clean, `zinc-50` authentication card optimized for trust (featuring SOC2/SSO trust chips).
- **Dashboards**: Designed for information density. Uses Shadcn UI primitives for clean typography, muted borders, and specific semantic color coding (Emerald for Compliance, Red/Orange for Escalations, Indigo for Primary Actions).
- **Accessibility**: High contrast text, proper focus states, and aria-labels implemented throughout the Shadcn UI components.

---

## 15. API Documentation (Key Routes)

| Endpoint | Method | Role | Purpose |
|----------|--------|------|---------|
| `/api/escalations` | GET | Admin/Manager | Computes and returns real-time governance violations. Scoped by role. |
| `/api/goal-sheets` | POST | Employee | Creates a new draft Goal Sheet for the active cycle. |
| `/api/goal-sheets/[id]/submit` | PATCH | Employee | Validates weightage (must be 100) and moves sheet to `PENDING_APPROVAL`. |
| `/api/goal-sheets/[id]/approve`| PATCH | Manager | Approves sheet, generates Audit Log, locks editing. |
| `/api/sso-directory` | GET | Public | Returns simulated Azure AD user directory for the login picker. |
| `/api/shared-goals/sync...` | POST | System/Admin | Synchronizes achievement percentages from primary owner to contributors. |

---

## 16. Demo & Simulation Systems

To facilitate seamless hackathon judging and product demonstrations, AtomQuest includes built-in simulators:
1. **Demo Access Panel (Login Page)**: One-click autofill buttons for Admin, Manager, and Employee credentials.
2. **SSO Simulator**: Discussed in Section 6.
3. **Demo Switcher Widget**: A floating, draggable UI component present on all protected routes. Allows the evaluator to instantly swap their session between Employee, Manager, and Admin without logging out, demonstrating RBAC and UI changes in real-time.

*Note: These systems use hardcoded demo accounts seeded via `prisma/seed.ts` and are isolated from core business logic.*

---

## 17. Security & Governance Concepts

- **Immutable Audit Trails**: The `AuditLog` table cannot be modified or deleted via the UI.
- **Route Protection**: Next.js Middleware acts as a firewall, intercepting requests before they hit the server.
- **API Authorization**: Every API route performs a server-side session check. A user cannot execute a `PATCH` request to approve a goal sheet if they are not logged in as a Manager/Admin.
- **Data Sanitization**: Zod schemas validate all incoming POST/PATCH payloads, preventing injection attacks or corrupted data states (e.g., negative weightages).

---

## 18. Current Limitations

- **Simulated Identity**: The Microsoft Entra ID integration is a UI/UX simulation layer built over standard credentials. It does not perform actual OAuth2 handshakes with Microsoft Graph.
- **Local Persistence**: The application is currently configured to use SQLite for easy local setup. For production, this must be switched to PostgreSQL.
- **In-Memory Escalations**: Escalations are currently computed dynamically on page load. At massive scale (10,000+ employees), this should be transitioned to a cron-based materialized view or background worker.

---

## 19. Future Enhancements

- **Real Microsoft Graph Integration**: Syncing real Azure AD groups and manager hierarchies.
- **Teams / Slack Bot**: Sending automated escalation warnings via Adaptive Cards directly to manager chat clients.
- **Email Notifications**: Integrating Resend or SendGrid to notify employees when a sheet is returned.
- **AI Predictive Governance**: Using historical data to flag goal sheets that are statistically likely to miss their Q4 targets early in the year.

---

## 20. Local Development Setup

To run AtomQuest locally for evaluation:

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Environment Variables:**
   Create a `.env` file in the root:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your-super-secret-string-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```
3. **Database Setup & Seeding:**
   This command applies the schema and generates the demo hierarchy (Admin, L1 Managers, Employees).
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
4. **Run Development Server:**
   ```bash
   npm run dev
   ```
5. **Access the Application:**
   Navigate to `http://localhost:3000/login`. Use the Demo Access buttons to explore different roles.

---

## SYSTEM SUMMARY APPENDICES

### A. Feature Completion Status
| Module | Status | Notes |
|--------|--------|-------|
| Core Auth & RBAC | ✅ Complete | NextAuth + Middleware implemented. |
| Goal Lifecycle | ✅ Complete | Draft → Submit → Approve working. |
| Governance Escalations | ✅ Complete | Real-time rule engine implemented. |
| Shared Goals | ✅ Complete | Cross-user sync functioning. |
| Premium Enterprise UI | ✅ Complete | Redesigned login and dashboards. |

### B. Role Capability Matrix
| Action | Employee | Manager | Admin |
|--------|:---:|:---:|:---:|
| Create Goals | ✅ | ✅ | ✅ |
| Submit Sheet | ✅ | ✅ | ❌ |
| Approve Sheet | ❌ | ✅ | ✅ |
| View Team Escalations | ❌ | ✅ | ✅ |
| View Global Audit Logs | ❌ | ❌ | ✅ |

### C. Database Relationship Summary
- `User` has many `GoalSheets`.
- `User` has one `Manager` (User) and many `DirectReports` (Users).
- `GoalSheet` has many `Goals`.
- `Goal` has many `CheckIns`.
- `SharedGoal` links many `Goals` across different `GoalSheets`.
