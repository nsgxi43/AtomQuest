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
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id },
    });

    if (!goalSheet) {
      return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
    }

    const updated = await prisma.goalSheet.update({
      where: { id },
      data: {
        status: "APPROVED",
        lockedAt: null,
      },
      include: { goals: true, employee: true },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        entityType: "GoalSheet",
        entityId: id,
        changedById: (session.user as any).id,
        changeDescription: "Goal sheet unlocked by admin",
        oldValue: goalSheet.status,
        newValue: "APPROVED",
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error unlocking goal sheet:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unlock goal sheet" },
      { status: 400 }
    );
  }
}
