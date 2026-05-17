import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type EscalationType =
  | "GOAL_SUBMISSION_DELAY"
  | "APPROVAL_PENDING"
  | "CHECKIN_MISSED"
  | "WEIGHTAGE_MISMATCH";

export type EscalationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type EscalationStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export interface TimelineEvent {
  stage: string;
  label: string;
  timestamp: string;
  completed: boolean;
}

export interface EscalationRecord {
  id: string;
  type: EscalationType;
  severity: EscalationSeverity;
  status: EscalationStatus;
  issueSummary: string;
  detailText: string;
  daysPending: number;
  chainStage: string;
  escalatedTo: string;
  createdAt: string;
  employee: { id: string; name: string; email: string };
  manager: { id: string; name: string; email: string } | null;
  timeline: TimelineEvent[];
  complianceMeta: {
    ruleId: string;
    threshold: number;
    riskScore: number;
    category: string;
  };
}

export interface EscalationApiResponse {
  escalations: EscalationRecord[];
  kpis: {
    totalActive: number;
    critical: number;
    pendingManagerActions: number;
    complianceScore: number;
  };
  complianceMeta: {
    totalEmployees: number;
    submittedSheets: number;
    approvedSheets: number;
    lockedSheets: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SUBMISSION_THRESHOLD_DAYS = 14;
const APPROVAL_THRESHOLD_DAYS = 7;

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

function buildTimeline(
  type: EscalationType,
  createdAt: Date,
  severity: EscalationSeverity
): TimelineEvent[] {
  const base = createdAt.toISOString();
  const d1 = new Date(createdAt.getTime() + 86_400_000).toISOString();
  const d2 = new Date(createdAt.getTime() + 2 * 86_400_000).toISOString();
  const d3 = new Date(createdAt.getTime() + 3 * 86_400_000).toISOString();
  const d4 = new Date(createdAt.getTime() + 5 * 86_400_000).toISOString();
  const isCritical = severity === "CRITICAL" || severity === "HIGH";

  const common: TimelineEvent[] = [
    { stage: "CREATED", label: "Escalation Detected", timestamp: base, completed: true },
    { stage: "NOTIFIED", label: "Employee Notified", timestamp: d1, completed: true },
  ];

  if (type === "GOAL_SUBMISSION_DELAY") {
    return [
      ...common,
      { stage: "MANAGER_ALERTED", label: "Manager Alerted", timestamp: d2, completed: isCritical },
      { stage: "HR_REVIEW", label: "HR Review Queued", timestamp: d3, completed: false },
      { stage: "GOVERNANCE", label: "Governance Review Pending", timestamp: d4, completed: false },
    ];
  }
  if (type === "APPROVAL_PENDING") {
    return [
      ...common,
      { stage: "MANAGER_ESCALATED", label: "Manager Escalated", timestamp: d2, completed: true },
      { stage: "HR_ESCALATED", label: "HR Leadership Notified", timestamp: d3, completed: isCritical },
      { stage: "GOVERNANCE", label: "Governance Review Pending", timestamp: d4, completed: false },
    ];
  }
  if (type === "CHECKIN_MISSED") {
    return [
      ...common,
      { stage: "MANAGER_ESCALATED", label: "Manager Escalated", timestamp: d2, completed: true },
      { stage: "HR_ESCALATED", label: "HR Escalated — Compliance Risk", timestamp: d3, completed: true },
      { stage: "GOVERNANCE", label: "Governance Board Review", timestamp: d4, completed: isCritical },
    ];
  }
  return [
    ...common,
    { stage: "SYSTEM_BLOCK", label: "Submission Blocked by System", timestamp: d2, completed: true },
    { stage: "HR_REVIEW", label: "HR Notified", timestamp: d3, completed: false },
    { stage: "GOVERNANCE", label: "Compliance Cleared", timestamp: d4, completed: false },
  ];
}

// ---------------------------------------------------------------------------
// GET Handler
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userRole = (session.user as any).role as string;
    const userId = (session.user as any).id as string;

    // Allow ADMIN (global) and MANAGER (team-scoped via query param)
    if (!["ADMIN", "MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For managers, scope to their direct reports automatically
    // For admins, they can pass ?managerId= to scope, or get everything
    const { searchParams } = new URL(request.url);
    const managerId = userRole === "MANAGER"
      ? userId
      : (searchParams.get("managerId") ?? null);

    // -----------------------------------------------------------------------
    // Build employee where clause (scope by manager if needed)
    // -----------------------------------------------------------------------
    const employeeWhere: any = { role: "EMPLOYEE" };
    if (managerId) employeeWhere.managerId = managerId;

    const goalSheetWhere: any = { status: { in: ["DRAFT", "SUBMITTED"] } };
    if (managerId) goalSheetWhere.employee = { managerId };

    const lockedSheetWhere: any = { status: "LOCKED" };
    if (managerId) lockedSheetWhere.employee = { managerId };

    // -----------------------------------------------------------------------
    // Fetch all necessary data
    // -----------------------------------------------------------------------
    const [allEmployees, goalSheets, lockedSheetsCount] = await Promise.all([
      prisma.user.findMany({
        where: employeeWhere,
        select: { id: true },
      }),
      prisma.goalSheet.findMany({
        where: goalSheetWhere,
        include: {
          employee: {
            select: {
              id: true, name: true, email: true,
              manager: { select: { id: true, name: true, email: true } },
            },
          },
          goals: { include: { updates: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.goalSheet.count({ where: lockedSheetWhere }),
    ]);

    const submittedCountWhere: any = { status: { in: ["SUBMITTED", "APPROVED", "LOCKED"] } };
    const approvedCountWhere: any = { status: { in: ["APPROVED", "LOCKED"] } };
    if (managerId) {
      submittedCountWhere.employee = { managerId };
      approvedCountWhere.employee = { managerId };
    }

    const [submittedCount, approvedCount] = await Promise.all([
      prisma.goalSheet.count({ where: submittedCountWhere }),
      prisma.goalSheet.count({ where: approvedCountWhere }),
    ]);

    const totalEmployees = allEmployees.length;
    const escalations: EscalationRecord[] = [];
    let idCounter = 1;

    // -----------------------------------------------------------------------
    // Rule 1: GOAL_SUBMISSION_DELAY
    // -----------------------------------------------------------------------
    for (const sheet of goalSheets) {
      if (sheet.status !== "DRAFT") continue;
      const days = daysSince(sheet.createdAt);
      if (days < SUBMISSION_THRESHOLD_DAYS) continue;

      const emp = sheet.employee;
      const mgr = (emp as any).manager ?? null;
      const createdAt = new Date(
        sheet.createdAt.getTime() - days * 86_400_000 + SUBMISSION_THRESHOLD_DAYS * 86_400_000
      );

      escalations.push({
        id: `esc-${idCounter++}`,
        type: "GOAL_SUBMISSION_DELAY",
        severity: days > 30 ? "HIGH" : "MEDIUM",
        status: "OPEN",
        issueSummary: "Goal sheet still in draft state",
        detailText: `Employee has not submitted their goal sheet after ${days} days. Submission required within ${SUBMISSION_THRESHOLD_DAYS} days of cycle open.`,
        daysPending: days - SUBMISSION_THRESHOLD_DAYS,
        chainStage: "EMPLOYEE",
        escalatedTo: emp.name,
        createdAt: createdAt.toISOString(),
        employee: { id: emp.id, name: emp.name, email: emp.email },
        manager: mgr ? { id: mgr.id, name: mgr.name, email: mgr.email } : null,
        timeline: buildTimeline("GOAL_SUBMISSION_DELAY", createdAt, days > 30 ? "HIGH" : "MEDIUM"),
        complianceMeta: {
          ruleId: "ESC-RULE-001",
          threshold: SUBMISSION_THRESHOLD_DAYS,
          riskScore: Math.min(100, 40 + days),
          category: "Submission Compliance",
        },
      });
    }

    // -----------------------------------------------------------------------
    // Rule 2: APPROVAL_PENDING
    // -----------------------------------------------------------------------
    for (const sheet of goalSheets) {
      if (sheet.status !== "SUBMITTED") continue;
      const submittedAt = sheet.submittedAt ?? sheet.updatedAt;
      const days = daysSince(submittedAt);
      if (days < APPROVAL_THRESHOLD_DAYS) continue;

      const emp = sheet.employee;
      const mgr = (emp as any).manager ?? null;
      const createdAt = new Date(submittedAt.getTime() + APPROVAL_THRESHOLD_DAYS * 86_400_000);

      escalations.push({
        id: `esc-${idCounter++}`,
        type: "APPROVAL_PENDING",
        severity: days > 14 ? "CRITICAL" : "HIGH",
        status: days > 21 ? "ACKNOWLEDGED" : "OPEN",
        issueSummary: "Manager approval overdue",
        detailText: `Goal sheet submitted ${days} days ago with no managerial action. Approval SLA is ${APPROVAL_THRESHOLD_DAYS} days.`,
        daysPending: days - APPROVAL_THRESHOLD_DAYS,
        chainStage: "MANAGER",
        escalatedTo: mgr ? mgr.name : "Unassigned Manager",
        createdAt: createdAt.toISOString(),
        employee: { id: emp.id, name: emp.name, email: emp.email },
        manager: mgr ? { id: mgr.id, name: mgr.name, email: mgr.email } : null,
        timeline: buildTimeline("APPROVAL_PENDING", createdAt, days > 14 ? "CRITICAL" : "HIGH"),
        complianceMeta: {
          ruleId: "ESC-RULE-002",
          threshold: APPROVAL_THRESHOLD_DAYS,
          riskScore: Math.min(100, 60 + days),
          category: "Approval Governance",
        },
      });
    }

    // -----------------------------------------------------------------------
    // Rule 3: CHECKIN_MISSED
    // -----------------------------------------------------------------------
    const activeQuarters: ("Q1" | "Q2" | "Q3" | "Q4")[] = ["Q1", "Q2", "Q3", "Q4"];
    const lockedGoalSheets = await prisma.goalSheet.findMany({
      where: lockedSheetWhere,
      include: {
        employee: {
          select: {
            id: true, name: true, email: true,
            manager: { select: { id: true, name: true, email: true } },
          },
        },
        goals: { include: { updates: true } },
      },
    });

    for (const sheet of lockedGoalSheets) {
      const emp = sheet.employee;
      const mgr = (emp as any).manager ?? null;
      const lockedAt = sheet.lockedAt ?? sheet.updatedAt;
      const daysSinceLocked = daysSince(lockedAt);
      const quartersExpected = Math.min(4, Math.floor(daysSinceLocked / 90));
      if (quartersExpected === 0) continue;

      const allUpdates = sheet.goals.flatMap((g) => g.updates);
      const quartersWithData = new Set(allUpdates.map((u) => u.quarter));

      for (let q = 0; q < quartersExpected; q++) {
        const quarter = activeQuarters[q];
        if (!quartersWithData.has(quarter)) {
          const createdAt = new Date(lockedAt.getTime() + (q * 90 + 91) * 86_400_000);
          escalations.push({
            id: `esc-${idCounter++}`,
            type: "CHECKIN_MISSED",
            severity: "CRITICAL",
            status: "OPEN",
            issueSummary: `Quarterly check-in window missed — ${quarter}`,
            detailText: `No quarterly update recorded for ${quarter}. Goal sheet has been locked for ${daysSinceLocked} days.`,
            daysPending: Math.max(0, daysSinceLocked - (q + 1) * 90),
            chainStage: "HR",
            escalatedTo: mgr ? `${mgr.name} → HR Leadership` : "HR Leadership",
            createdAt: createdAt.toISOString(),
            employee: { id: emp.id, name: emp.name, email: emp.email },
            manager: mgr ? { id: mgr.id, name: mgr.name, email: mgr.email } : null,
            timeline: buildTimeline("CHECKIN_MISSED", createdAt, "CRITICAL"),
            complianceMeta: {
              ruleId: "ESC-RULE-003",
              threshold: 90,
              riskScore: 90,
              category: "Quarterly Compliance",
            },
          });
          break;
        }
      }
    }

    // -----------------------------------------------------------------------
    // Rule 4: WEIGHTAGE_MISMATCH
    // -----------------------------------------------------------------------
    const weightageSheets = await prisma.goalSheet.findMany({
      where: goalSheetWhere,
      include: {
        employee: {
          select: {
            id: true, name: true, email: true,
            manager: { select: { id: true, name: true, email: true } },
          },
        },
        goals: { select: { weightage: true } },
      },
    });

    for (const sheet of weightageSheets) {
      if (sheet.goals.length === 0) continue;
      const total = sheet.goals.reduce((s, g) => s + g.weightage, 0);
      if (Math.abs(total - 100) < 0.01) continue;

      const emp = sheet.employee;
      const mgr = (emp as any).manager ?? null;

      escalations.push({
        id: `esc-${idCounter++}`,
        type: "WEIGHTAGE_MISMATCH",
        severity: "LOW",
        status: "OPEN",
        issueSummary: "Goal weightage distribution invalid",
        detailText: `Total weightage is ${total.toFixed(1)}% (must equal 100%). Submission is blocked until corrected.`,
        daysPending: daysSince(sheet.updatedAt),
        chainStage: "EMPLOYEE",
        escalatedTo: emp.name,
        createdAt: sheet.updatedAt.toISOString(),
        employee: { id: emp.id, name: emp.name, email: emp.email },
        manager: mgr ? { id: mgr.id, name: mgr.name, email: mgr.email } : null,
        timeline: buildTimeline("WEIGHTAGE_MISMATCH", sheet.updatedAt, "LOW"),
        complianceMeta: {
          ruleId: "ESC-RULE-004",
          threshold: 100,
          riskScore: 20,
          category: "Data Integrity",
        },
      });
    }

    // -----------------------------------------------------------------------
    // KPI aggregation
    // -----------------------------------------------------------------------
    const totalActive = escalations.filter((e) => e.status !== "RESOLVED").length;
    const critical = escalations.filter((e) => e.severity === "CRITICAL").length;
    const pendingManagerActions = escalations.filter(
      (e) => e.type === "APPROVAL_PENDING" && e.status !== "RESOLVED"
    ).length;

    const submissionScore = totalEmployees > 0 ? (submittedCount / totalEmployees) * 100 : 100;
    const approvalScore = submittedCount > 0 ? (approvedCount / submittedCount) * 100 : 100;
    const escalationPenalty = Math.min(30, totalActive * 3);
    const complianceScore = Math.round(
      Math.max(0, submissionScore * 0.4 + approvalScore * 0.6 - escalationPenalty)
    );

    const response: EscalationApiResponse = {
      escalations,
      kpis: { totalActive, critical, pendingManagerActions, complianceScore },
      complianceMeta: {
        totalEmployees,
        submittedSheets: submittedCount,
        approvedSheets: approvedCount,
        lockedSheets: lockedSheetsCount,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Escalation engine error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compute escalations" },
      { status: 500 }
    );
  }
}
