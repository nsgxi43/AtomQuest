-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "GoalSheetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'RETURNED', 'LOCKED');

-- CreateEnum
CREATE TYPE "UoM" AS ENUM ('NUMERIC_MIN', 'NUMERIC_MAX', 'TIMELINE', 'ZERO');

-- CreateEnum
CREATE TYPE "Quarter" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');

-- CreateEnum
CREATE TYPE "UpdateStatus" AS ENUM ('NOT_STARTED', 'ON_TRACK', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_sheets" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "cycleYear" INTEGER NOT NULL DEFAULT 2025,
    "status" "GoalSheetStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "goalSheetId" TEXT NOT NULL,
    "thrustArea" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "uom" "UoM" NOT NULL,
    "target" TEXT NOT NULL,
    "weightage" DOUBLE PRECISION NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "sharedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_goals" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thrustArea" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "uom" "UoM" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quarterly_updates" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "quarter" "Quarter" NOT NULL,
    "actualAchievement" TEXT,
    "status" "UpdateStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "computedScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quarterly_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkin_comments" (
    "id" TEXT NOT NULL,
    "goalSheetId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "quarter" "Quarter" NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkin_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changeDescription" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "quarterly_updates_goalId_quarter_key" ON "quarterly_updates"("goalId", "quarter");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_sheets" ADD CONSTRAINT "goal_sheets_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_goalSheetId_fkey" FOREIGN KEY ("goalSheetId") REFERENCES "goal_sheets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_sharedFromId_fkey" FOREIGN KEY ("sharedFromId") REFERENCES "shared_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_goals" ADD CONSTRAINT "shared_goals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarterly_updates" ADD CONSTRAINT "quarterly_updates_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_comments" ADD CONSTRAINT "checkin_comments_goalSheetId_fkey" FOREIGN KEY ("goalSheetId") REFERENCES "goal_sheets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_comments" ADD CONSTRAINT "checkin_comments_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
