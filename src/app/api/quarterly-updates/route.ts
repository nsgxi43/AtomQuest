import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { goalId, quarter, actualAchievement, status } = data;

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { goalSheet: true },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Verify ownership
    if (goal.goalSheet.employeeId !== (session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Compute score
    const score = actualAchievement
      ? computeScore(goal.uom, goal.target, actualAchievement)
      : 0;

    const update = await prisma.quarterlyUpdate.upsert({
      where: {
        goalId_quarter: {
          goalId,
          quarter,
        },
      },
      create: {
        goalId,
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
    });

    return NextResponse.json(update);
  } catch (error: any) {
    console.error("Error creating/updating quarterly update:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process quarterly update" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await prisma.quarterlyUpdate.findMany({
      where: {
        goal: {
          goalSheet: {
            employeeId: (session.user as any).id,
          },
        },
      },
      include: {
        goal: true,
      },
    });

    return NextResponse.json(updates);
  } catch (error: any) {
    console.error("Error fetching quarterly updates:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch quarterly updates" },
      { status: 400 }
    );
  }
}
