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
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete all linked goals first
    await prisma.goal.deleteMany({
      where: { sharedFromId: id },
    });

    // Delete the shared goal
    const deleted = await prisma.sharedGoal.delete({
      where: { id },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        entityType: "SharedGoal",
        entityId: id,
        changedById: (session.user as any).id,
        changeDescription: "Shared goal deleted",
        oldValue: `${deleted.title}`,
        newValue: "DELETED",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting shared goal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete shared goal" },
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

    const sharedGoal = await prisma.sharedGoal.findUnique({
      where: { id },
    });

    if (!sharedGoal) {
      return NextResponse.json(
        { error: "Shared goal not found" },
        { status: 404 }
      );
    }

    // Only creator or admin can edit
    if (
      sharedGoal.createdById !== (session.user as any).id &&
      (session.user as any).role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await request.json();

    // Sync updates to all linked goals if target or thrustArea changed
    if (data.target !== undefined || data.thrustArea !== undefined) {
      await prisma.goal.updateMany({
        where: { sharedFromId: id },
        data: {
          target: data.target ?? sharedGoal.target,
          thrustArea: data.thrustArea ?? sharedGoal.thrustArea,
        },
      });
    }

    const updated = await prisma.sharedGoal.update({
      where: { id },
      data: {
        title: data.title ?? sharedGoal.title,
        thrustArea: data.thrustArea ?? sharedGoal.thrustArea,
        target: data.target ?? sharedGoal.target,
        uom: data.uom ?? sharedGoal.uom,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating shared goal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update shared goal" },
      { status: 400 }
    );
  }
}
