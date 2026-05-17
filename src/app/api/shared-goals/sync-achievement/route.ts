import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/utils";

/**
 * POST /api/shared-goals/sync-achievement
 * When primary owner updates achievement for a shared goal,
 * sync it to all other linked employee goals
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sharedGoalId, quarter, actualAchievement, status } =
      await request.json();

    // Get the shared goal
    const sharedGoal = await prisma.sharedGoal.findUnique({
      where: { id: sharedGoalId },
    });

    if (!sharedGoal) {
      return NextResponse.json(
        { error: "Shared goal not found" },
        { status: 404 }
      );
    }

    // Find all goals linked to this shared goal
    const linkedGoals = await prisma.goal.findMany({
      where: { sharedFromId: sharedGoalId },
      include: { goalSheet: true },
    });

    // Compute score once
    const score = actualAchievement
      ? computeScore(sharedGoal.uom, sharedGoal.target, actualAchievement)
      : 0;

    // Update or create quarterly update for each linked goal
    const updates = await Promise.all(
      linkedGoals.map((goal) =>
        prisma.quarterlyUpdate.upsert({
          where: {
            goalId_quarter: {
              goalId: goal.id,
              quarter,
            },
          },
          create: {
            goalId: goal.id,
            quarter,
            actualAchievement,
            status,
            computedScore: score,
          },
          update: {
            actualAchievement,
            status,
            computedScore: score,
          },
        })
      )
    );

    // Log sync action
    await prisma.auditLog.create({
      data: {
        entityType: "SharedGoal",
        entityId: sharedGoalId,
        changedById: (session.user as any).id,
        changeDescription: `Achievement synced to ${linkedGoals.length} linked goals`,
        oldValue: quarter,
        newValue: `${actualAchievement} (${status})`,
      },
    });

    return NextResponse.json({
      synced: updates.length,
      updates,
    });
  } catch (error: any) {
    console.error("Error syncing achievement:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync achievement" },
      { status: 400 }
    );
  }
}
