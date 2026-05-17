import { prisma } from "./prisma";
import { calculateGoalProgress } from "./utils";
import { Quarter } from "./cycle";

export async function syncSharedGoalUpdates(
  primaryGoalId: string,
  quarter: string,
  actualAchievement: string | null,
  userId: string
) {
  // 1. Verify this is the primary goal
  const primaryGoal = await prisma.goal.findUnique({
    where: { id: primaryGoalId },
    include: { sharedGoal: true },
  });

  if (!primaryGoal || !primaryGoal.isPrimaryOwner || !primaryGoal.sharedFromId) {
    return; // Not a primary shared goal, do nothing
  }

  // 2. Find all linked goals (recipients)
  const linkedGoals = await prisma.goal.findMany({
    where: {
      sharedFromId: primaryGoal.sharedFromId,
      id: { not: primaryGoalId },
    },
  });

  if (linkedGoals.length === 0) return;

  // 3. Compute common score/status based on target and uom
  const { status, score, lateCompletion } = calculateGoalProgress(
    primaryGoal.uom,
    primaryGoal.target,
    actualAchievement || ""
  );

  // 4. Update or create quarterly updates for all linked goals
  for (const linkedGoal of linkedGoals) {
    const update = await prisma.quarterlyUpdate.upsert({
      where: {
        goalId_quarter: {
          goalId: linkedGoal.id,
          quarter: quarter as Quarter,
        },
      },
      update: {
        actualAchievement,
        status,
        computedScore: score,
      },
      create: {
        goalId: linkedGoal.id,
        quarter: quarter as Quarter,
        actualAchievement,
        status,
        computedScore: score,
      },
    });

    // 5. Log audit
    await prisma.auditLog.create({
      data: {
        entityType: "QuarterlyUpdate_Sync",
        entityId: update.id,
        changedById: userId,
        changeDescription: `Synchronized from primary owner for ${quarter}`,
        newValue: actualAchievement || "empty",
      },
    });
  }
}
