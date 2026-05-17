import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/reports
 * Returns achievement report data from the real database.
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

    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get("quarter"); // e.g. Q1, Q2, Q3, Q4 or null for all
    const employeeId = searchParams.get("employeeId"); // optional filter

    // Build where clause for quarterly updates
    const updatesWhere: any = {};
    if (quarter) {
      updatesWhere.quarter = quarter;
    }

    // Build where clause for goals/goalSheets
    const goalSheetWhere: any = { status: "LOCKED" };
    if (employeeId) {
      goalSheetWhere.employeeId = employeeId;
    } else if (userRole === "MANAGER") {
      // Managers see only their direct reports
      goalSheetWhere.employee = {
        managerId: (session.user as any).id,
      };
    }

    const goalSheets = await prisma.goalSheet.findMany({
      where: goalSheetWhere,
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
        goals: {
          include: {
            updates: {
              where: quarter ? { quarter: quarter as any } : {},
              orderBy: { quarter: "asc" },
            },
          },
        },
      },
      orderBy: { employee: { name: "asc" } },
    });

    // Flatten into report rows
    const rows: any[] = [];
    for (const sheet of goalSheets) {
      for (const goal of sheet.goals) {
        if (goal.updates.length > 0) {
          for (const update of goal.updates) {
            rows.push({
              employeeId: sheet.employee.id,
              employee: sheet.employee.name,
              email: sheet.employee.email,
              goalId: goal.id,
              goal: goal.title,
              thrustArea: goal.thrustArea,
              uom: goal.uom,
              target: goal.target,
              weightage: goal.weightage,
              isShared: goal.isShared,
              quarter: update.quarter,
              actual: update.actualAchievement ?? "-",
              score: update.computedScore ?? 0,
              status: update.status,
              cycleYear: sheet.cycleYear,
            });
          }
        } else {
          // Goal exists but no update — show with no data
          rows.push({
            employeeId: sheet.employee.id,
            employee: sheet.employee.name,
            email: sheet.employee.email,
            goalId: goal.id,
            goal: goal.title,
            thrustArea: goal.thrustArea,
            uom: goal.uom,
            target: goal.target,
            weightage: goal.weightage,
            isShared: goal.isShared,
            quarter: quarter ?? "ALL",
            actual: "-",
            score: 0,
            status: "NOT_STARTED",
            cycleYear: sheet.cycleYear,
          });
        }
      }
    }

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch report" },
      { status: 500 }
    );
  }
}
