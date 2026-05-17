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
    if (!session?.user || (session.user as any).role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!goalSheet) {
      return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
    }

    // Verify that the current user is the manager
    if (goalSheet.employee.managerId !== (session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await prisma.goalSheet.update({
      where: { id },
      data: {
        status: "LOCKED",
        approvedAt: new Date(),
        lockedAt: new Date(),
      },
      include: { goals: true, employee: true },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        entityType: "GoalSheet",
        entityId: id,
        changedById: (session.user as any).id,
        changeDescription: "Goal sheet approved and locked",
        newValue: "LOCKED",
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error approving goal sheet:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve goal sheet" },
      { status: 400 }
    );
  }
}
