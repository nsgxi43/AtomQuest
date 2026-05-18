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
    if (!session?.user || (session.user as any).role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { comment, quarter } = await request.json();

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
        status: "RETURNED",
      },
      include: { goals: true, employee: true },
    });

    // Create check-in comment if provided
    if (comment && quarter) {
      await prisma.checkinComment.create({
        data: {
          goalSheetId: id,
          managerId: (session.user as any).id,
          quarter,
          comment,
        },
      });
    }

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        entityType: "GoalSheet",
        entityId: id,
        changedById: (session.user as any).id,
        changeDescription: "Goal sheet returned for revision",
        oldValue: goalSheet.status,
        newValue: "RETURNED",
      },
    });

    // Fire governance notification
    dispatchNotification({
      toUserId:   updated.employee.id,
      type:       "GOAL_RETURNED",
      title:      "Your goal sheet has been returned for revision",
      message:    `Your manager has returned your goal sheet for revision.${comment ? ` Comment: "${comment}"` : ""} Please review and resubmit.`,
      entityType: "GoalSheet",
      entityId:   id,
      ctaLabel:   "Review & Resubmit",
      ctaUrl:     "/employee",
    }).catch(() => {});

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error returning goal sheet:", error);
    return NextResponse.json(
      { error: error.message || "Failed to return goal sheet" },
      { status: 400 }
    );
  }
}
