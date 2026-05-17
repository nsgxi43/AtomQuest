import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/stats
 * Returns completion tracking stats from the real database.
 * Accessible by MANAGER and ADMIN.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!["MANAGER", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Scope: managers see only their direct reports; admins see all
    const employeeWhere: any =
      userRole === "MANAGER"
        ? { managerId: (session.user as any).id }
        : {};

    const currentYear = new Date().getFullYear();

    const totalEmployees = await prisma.user.count({
      where: { role: "EMPLOYEE", ...employeeWhere },
    });

    // Goal sheets by status (Active cycle only)
    const goalSheetStatusGroups = await prisma.goalSheet.groupBy({
      by: ["status"],
      where: {
        cycleYear: currentYear,
        employee: { role: "EMPLOYEE", ...employeeWhere },
      },
      _count: { id: true },
    });

    const statusMap: Record<string, number> = {};
    for (const g of goalSheetStatusGroups) {
      statusMap[g.status] = g._count.id;
    }

    const submitted =
      (statusMap["SUBMITTED"] ?? 0) +
      (statusMap["APPROVED"] ?? 0) +
      (statusMap["LOCKED"] ?? 0);
    const approved =
      (statusMap["APPROVED"] ?? 0) + (statusMap["LOCKED"] ?? 0);
    const locked = statusMap["LOCKED"] ?? 0;
    const draft = statusMap["DRAFT"] ?? 0;
    const returned = statusMap["RETURNED"] ?? 0;

    // Quarterly completion counts: how many employees have at least one COMPLETED update per quarter
    const quarters = ["Q1", "Q2", "Q3", "Q4"] as const;
    const quarterlyStats: Record<string, { completed: number; onTrack: number; notStarted: number }> = {};

    for (const q of quarters) {
      // Count goal sheets (locked) where at least one goal has a COMPLETED update for this quarter
      const completedSheets = await prisma.goalSheet.count({
        where: {
          cycleYear: currentYear,
          status: "LOCKED",
          employee: { role: "EMPLOYEE", ...employeeWhere },
          goals: {
            some: {
              updates: {
                some: { quarter: q, status: "COMPLETED" },
              },
            },
          },
        },
      });

      const onTrackSheets = await prisma.goalSheet.count({
        where: {
          cycleYear: currentYear,
          status: "LOCKED",
          employee: { role: "EMPLOYEE", ...employeeWhere },
          goals: {
            some: {
              updates: {
                some: { quarter: q, status: "ON_TRACK" },
              },
            },
          },
        },
      });

      quarterlyStats[q] = {
        completed: completedSheets,
        onTrack: onTrackSheets,
        notStarted: locked - completedSheets,
      };
    }

    // Average score across all locked goal sheets
    const scoreAgg = await prisma.quarterlyUpdate.aggregate({
      where: {
        goal: {
          goalSheet: {
            cycleYear: currentYear,
            status: "LOCKED",
            employee: { role: "EMPLOYEE", ...employeeWhere },
          },
        },
        computedScore: { not: null },
      },
      _avg: { computedScore: true },
    });

    const avgScore = scoreAgg._avg.computedScore ?? 0;

    // Fetch employees pending submission for the current cycle year
    const allEmployees = await prisma.user.findMany({
      where: { role: "EMPLOYEE", ...employeeWhere },
      select: {
        id: true,
        name: true,
        email: true,
        goalSheets: {
          where: { cycleYear: currentYear },
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { goals: true }
            }
          }
        }
      }
    });

    const pendingEmployees = allEmployees
      .map((emp) => {
        const sheet = emp.goalSheets[0];
        const status = sheet?.status || "NOT_STARTED";
        const goalCount = sheet?._count.goals || 0;
        return {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          status,
          goalCount,
        };
      })
      .filter((emp) => ["DRAFT", "RETURNED", "NOT_STARTED"].includes(emp.status))
      .sort((a, b) => {
        const order: Record<string, number> = { RETURNED: 1, DRAFT: 2, NOT_STARTED: 3 };
        return order[a.status] - order[b.status];
      });

    return NextResponse.json({
      totalEmployees,
      submitted,
      approved,
      locked,
      draft,
      returned,
      avgScore: Math.round(avgScore),
      quarterlyStats,
      pendingEmployees,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
