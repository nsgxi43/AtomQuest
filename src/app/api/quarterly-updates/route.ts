import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateGoalProgress } from "@/lib/utils";
import { canEditQuarter } from "@/lib/cycle";
import { getEffectiveDateFromQuarter } from "@/lib/cycle-client";
import { syncSharedGoalUpdates } from "@/lib/sync";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { goalId, quarter, actualAchievement } = data;

    const demoCookie = request.cookies.get("demo_quarter")?.value;
    const effectiveDate = getEffectiveDateFromQuarter(demoCookie);

    if (!canEditQuarter(quarter, (session.user as any).role, effectiveDate)) {
      return NextResponse.json(
        { error: `The check-in window for ${quarter} is currently closed.` },
        { status: 403 }
      );
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { sharedGoal: true, goalSheet: true },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    if (goal.isShared && !goal.isPrimaryOwner) {
      // Audit log the violation attempt
      await prisma.auditLog.create({
        data: {
          entityType: "QuarterlyUpdate_Violation",
          entityId: goalId,
          changedById: (session.user as any).id,
          changeDescription: `Recipient attempted restricted shared KPI modification for quarter ${quarter}`,
          newValue: actualAchievement,
        },
      });

      return NextResponse.json(
        { error: "Recipients cannot modify shared KPI achievements. Managed by Primary Owner." },
        { status: 403 }
      );
    }

    // Verify ownership
    if (goal.goalSheet.employeeId !== (session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate integrated score & status
    const { score, status: normalizedStatus } = calculateGoalProgress(goal.uom, goal.target, actualAchievement);

    const update = await prisma.quarterlyUpdate.upsert({
      where: {
        goalId_quarter: {
          goalId,
          quarter,
        },
      },
      create: {
        goalId,
        quarter,
        actualAchievement,
        status: normalizedStatus as any,
        computedScore: score,
      },
      update: {
        actualAchievement,
        status: normalizedStatus as any,
        computedScore: score,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: "QuarterlyUpdate",
        entityId: update.id,
        changedById: (session.user as any).id,
        changeDescription: `Quarterly progress updated for ${quarter}`,
        oldValue: null,
        newValue: `actual: ${actualAchievement}, status: ${normalizedStatus}, score: ${score.toFixed(1)}${calculateGoalProgress(goal.uom, goal.target, actualAchievement).lateCompletion ? ", lateCompletion: true" : ""}`,
      },
    });

    await syncSharedGoalUpdates(goalId, quarter, actualAchievement, (session.user as any).id);

    return NextResponse.json(update);
  } catch (error: any) {
    console.error("Error creating/updating quarterly update:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process quarterly update" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const goalSheetId = searchParams.get("goalSheetId");
    const userRole = (session.user as any).role;

    // Build the where clause
    let where: any = {};

    if (goalSheetId) {
      // Manager fetching updates for a specific employee's goal sheet
      if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      where = { goal: { goalSheetId } };
    } else {
      // Employee fetching their own updates
      where = {
        goal: {
          goalSheet: {
            employeeId: (session.user as any).id,
          },
        },
      };
    }

    const updates = await prisma.quarterlyUpdate.findMany({
      where,
      include: { goal: true },
    });

    return NextResponse.json(updates);
  } catch (error: any) {
    console.error("Error fetching quarterly updates:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch quarterly updates" },
      { status: 400 }
    );
  }
}
