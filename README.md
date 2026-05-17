# AtomQuest - Goal Management System

A comprehensive goal management system designed for organizations to set, track, and manage employee goals with manager oversight and admin controls.

## Quick Start

```bash
npm install && npx prisma migrate dev && npx prisma db seed && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### For Employees
- Create and manage goal sheets for the current cycle
- Define goals with descriptions, weightage, and units of measurement
- Track quarterly actuals against goals
- View progress and performance metrics
- Submit goal sheets for manager approval

### For Managers
- Review employee goal sheets
- Approve or request modifications to goals
- Add check-in comments for employee feedback
- Track team performance metrics

### For Admins
- Manage system users (create, edit, delete)
- Configure cycle settings (active year)
- View comprehensive audit logs
- Generate reports and export data

## Technology Stack

- **Frontend**: Next.js 16.2.6 with React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes with NextAuth v4 for authentication
- **Database**: PostgreSQL 15 with Prisma v6 ORM
- **Authentication**: NextAuth v4 with JWT strategy and Credentials provider
- **Validation**: React Hook Form + Zod v4.4.3
- **UI**: Custom Radix UI component library + Tailwind CSS

## Prerequisites

- Node.js v24.10.0 or higher
- npm v10.5 or higher
- PostgreSQL 15.18 (running locally)

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file:
```bash
cp .env.example .env.local
```

Update with your PostgreSQL credentials:
```
DATABASE_URL="postgresql://nishanthsgowda@localhost:5432/atomquest"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Setup Database

```bash
# Run migrations
npx prisma migrate dev

# Seed demo data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server will be available at `http://localhost:3000`

## Demo Credentials

```
Admin:    admin@demo.com / password123
Manager:  manager@demo.com / password123
Employee: employee@demo.com / password123
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/login              # Login page
│   ├── (dashboard)/              # Dashboard layout
│   │   ├── admin/                # Admin settings & users
│   │   ├── employee/             # Goal management
│   │   ├── manager/              # Team management
│   │   └── reports/              # Reports & exports
│   ├── api/
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── goals/                # Goal CRUD
│   │   ├── goal-sheets/          # Sheet management
│   │   ├── quarterly-updates/    # Tracking
│   │   ├── checkins/             # Comments
│   │   └── audit-logs/           # Audit trail
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/                       # Button, Input, Card, etc.
│   ├── DashboardLayout.tsx       # Sidebar + topbar
│   └── SessionWrapper.tsx        # Auth provider
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── auth.config.ts            # Middleware config
│   ├── prisma.ts                 # Prisma singleton
│   ├── validations.ts            # Zod schemas
│   └── utils.ts                  # Helper functions
└── middleware.ts                 # Route protection
```

## Available Scripts

```bash
npm run dev              # Start dev server (port 3000)
npx prisma migrate dev  # Run migrations
npx prisma db seed     # Seed demo data
npx prisma studio     # Visual DB browser
npx tsc --noEmit      # Type check
npm run build         # Production build
npm start            # Production server
```

## Database Schema

### Core Models
- **User**: System users (roles: ADMIN, MANAGER, EMPLOYEE)
- **GoalSheet**: Annual goal container per employee
- **Goal**: Individual goals with weightage and metrics
- **QuarterlyUpdate**: Quarterly actual performance
- **CheckinComment**: Manager feedback
- **AuditLog**: System activity tracking

### Status Enums
- **GoalSheetStatus**: DRAFT, SUBMITTED, APPROVED, LOCKED
- **Quarter**: Q1, Q2, Q3, Q4
- **UoM**: Percentage, Number, Currency, Binary
- **UpdateStatus**: PENDING, COMPLETED

## Environment Variables

See `.env.example` for all required variables:

```
DATABASE_URL          # PostgreSQL connection
NEXTAUTH_SECRET       # JWT key (generate: openssl rand -base64 32)
NEXTAUTH_URL          # Auth callback URL
```

## Troubleshooting

### Database Connection Error
```bash
# Verify PostgreSQL is running
psql -U nishanthsgowda -d atomquest

# Create database if missing
createdb atomquest
```

### Port 3000 Already In Use
```bash
lsof -i :3000
kill -9 <PID>
```

### Prisma Issues
```bash
npx prisma generate    # Regenerate client
rm -rf .next           # Clear build cache
npm install            # Reinstall dependencies
```

## Security Notes

- Change NEXTAUTH_SECRET for production
- Use strong passwords for database
- Never commit .env.local
- Enable HTTPS in production
- Implement rate limiting on APIs

## Learn More

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com/docs)
