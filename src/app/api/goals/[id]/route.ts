import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { goalSheet: true },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Check if user owns this goal
    if (goal.goalSheet.employeeId !== (session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if goal sheet is in editable state
    if (!["DRAFT", "RETURNED"].includes(goal.goalSheet.status)) {
      return NextResponse.json(
        { error: "Cannot delete goals in this state" },
        { status: 403 }
      );
    }

    await prisma.goal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete goal" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { goalSheet: true },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Check if user owns this goal
    if (goal.goalSheet.employeeId !== (session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if goal sheet is in editable state
    if (!goal.goalSheet || !["DRAFT", "RETURNED"].includes(goal.goalSheet.status)) {
      // Log blocked modification attempt
      await prisma.auditLog.create({
        data: {
          entityType: "Goal",
          entityId: id,
          changedById: (session.user as any).id,
          changeDescription: "Blocked attempt to edit locked goal",
          oldValue: goal.goalSheet?.status || "UNKNOWN",
          newValue: "BLOCKED",
        },
      });
      return NextResponse.json(
        { error: "Cannot edit goals in this state" },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Shared goal restriction: employees can ONLY update weightage
    if (goal.isShared) {
      if (
        data.title !== undefined ||
        data.description !== undefined ||
        data.thrustArea !== undefined ||
        data.uom !== undefined ||
        data.target !== undefined
      ) {
        return NextResponse.json(
          {
            error:
              "Shared goal: only weightage can be modified by the employee",
          },
          { status: 403 }
        );
      }

      // Validate weightage
      if (data.weightage !== undefined) {
        const w = parseFloat(data.weightage);
        if (isNaN(w) || w < 10 || w > 100) {
          return NextResponse.json(
            { error: "Weightage must be between 10 and 100" },
            { status: 400 }
          );
        }
      }

      const updated = await prisma.goal.update({
        where: { id },
        data: { weightage: data.weightage ?? goal.weightage },
      });
      return NextResponse.json(updated);
    }

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        title: data.title ?? goal.title,
        description: data.description ?? goal.description,
        thrustArea: data.thrustArea ?? goal.thrustArea,
        uom: data.uom ?? goal.uom,
        target: data.target ?? goal.target,
        weightage: data.weightage ?? goal.weightage,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update goal" },
      { status: 400 }
    );
  }
}
