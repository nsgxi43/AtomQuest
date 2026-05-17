import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/goals/[id]/edit-during-approval
 * Allow manager to edit goal target and weightage during approval
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { goalSheet: { include: { employee: true } } },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Verify manager is the employee's manager
    if (goal.goalSheet.employee.managerId !== (session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Can only edit during SUBMITTED or APPROVED state
    if (!["SUBMITTED", "APPROVED"].includes(goal.goalSheet.status)) {
      return NextResponse.json(
        { error: "Goal sheet not in editable state for approval" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { target, weightage } = data;

    // Validate weightage
    if (weightage !== undefined) {
      if (weightage < 10 || weightage > 100) {
        return NextResponse.json(
          { error: "Weightage must be between 10 and 100" },
          { status: 400 }
        );
      }
    }

    // If weightage changed, validate total for goal sheet
    if (weightage !== undefined && weightage !== goal.weightage) {
      const otherGoals = await prisma.goal.findMany({
        where: {
          goalSheetId: goal.goalSheetId,
          id: { not: id },
        },
      });

      const newTotal =
        otherGoals.reduce((sum, g) => sum + g.weightage, 0) + weightage;

      if (Math.abs(newTotal - 100) > 0.01) {
        return NextResponse.json(
          {
            error: `Total weightage would be ${newTotal}%. Must equal 100%`,
          },
          { status: 400 }
        );
      }
    }

    // Update goal
    const updated = await prisma.goal.update({
      where: { id },
      data: {
        target: target ?? goal.target,
        weightage: weightage ?? goal.weightage,
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        entityType: "Goal",
        entityId: id,
        changedById: (session.user as any).id,
        changeDescription: "Manager edited goal during approval",
        oldValue: `target: ${goal.target}, weightage: ${goal.weightage}`,
        newValue: `target: ${updated.target}, weightage: ${updated.weightage}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error editing goal during approval:", error);
    return NextResponse.json(
      { error: error.message || "Failed to edit goal" },
      { status: 400 }
    );
  }
}
