import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      include: { goals: true, employee: true },
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
        { error: "Maximum 8 goals allowed" },
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

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error submitting goal sheet:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit goal sheet" },
      { status: 400 }
    );
  }
}
