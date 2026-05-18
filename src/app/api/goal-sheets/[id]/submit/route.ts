import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id },
      include: { goals: true, employee: { include: { manager: true } } },
    });

    if (!goalSheet) {
      return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
    }

    // Verify ownership
    if (goalSheet.employeeId !== (session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate: max 8 goals and total weightage = 100
    if (goalSheet.goals.length > 8) {
      return NextResponse.json(
        { error: "You have reached the maximum limit of 8 goals. Please redistribute existing goal weightages to achieve the required 100% allocation." },
        { status: 400 }
      );
    }

    const totalWeightage = goalSheet.goals.reduce(
      (sum, g) => sum + g.weightage,
      0
    );

    if (Math.abs(totalWeightage - 100) > 0.01) {
      return NextResponse.json(
        { error: "Total weightage must equal 100%" },
        { status: 400 }
      );
    }

    const updated = await prisma.goalSheet.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      include: { goals: true, employee: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: "GoalSheet",
        entityId: id,
        changedById: (session.user as any).id,
        changeDescription: "Goal sheet submitted for review",
        oldValue: goalSheet.status,
        newValue: "SUBMITTED",
      },
    });

    // Notify manager if exists
    const manager = (goalSheet.employee as any).manager;
    if (manager?.id) {
      dispatchNotification({
        toUserId:   manager.id,
        type:       "GOAL_SUBMITTED",
        title:      `${goalSheet.employee.name} submitted their goal sheet`,
        message:    `${goalSheet.employee.name} has submitted their FY ${goalSheet.cycleYear} goal sheet for your review and approval.`,
        entityType: "GoalSheet",
        entityId:   id,
        ctaLabel:   "Review Goal Sheet",
        ctaUrl:     "/manager",
      }).catch(() => {});
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error submitting goal sheet:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit goal sheet" },
      { status: 400 }
    );
  }
}
