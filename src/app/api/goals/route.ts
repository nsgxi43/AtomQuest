import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateGoalSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const validated = CreateGoalSchema.parse(data);

    const currentYear = new Date().getFullYear();
    // Get or create goal sheet for the current user
    let goalSheet = await prisma.goalSheet.findFirst({
      where: {
        employeeId: (session.user as any).id,
        cycleYear: currentYear,
        status: { in: ["DRAFT", "RETURNED"] },
      },
    });

    if (!goalSheet) {
      goalSheet = await prisma.goalSheet.create({
        data: {
          employeeId: (session.user as any).id,
          cycleYear: new Date().getFullYear(),
        },
      });
    }

    // Check maximum goals limit
    const existingGoals = await prisma.goal.count({
      where: { goalSheetId: goalSheet.id },
    });

    if (existingGoals >= 8) {
      return NextResponse.json(
        { error: "Maximum 8 goals allowed per goal sheet" },
        { status: 400 }
      );
    }

    // Check total weightage
    const currentWeightage = await prisma.goal.aggregate({
      where: { goalSheetId: goalSheet.id },
      _sum: { weightage: true },
    });

    const totalWithNew =
      (currentWeightage._sum.weightage || 0) + validated.weightage;
    if (totalWithNew > 100) {
      return NextResponse.json(
        { error: "Total weightage cannot exceed 100%" },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        goalSheetId: goalSheet.id,
        ...validated,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: "Goal",
        entityId: goal.id,
        changedById: (session.user as any).id,
        changeDescription: "Goal created",
        newValue: `${goal.title} (${goal.weightage}%)`,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error: any) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create goal" },
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

    // Only locked goal sheets are trackable
    const goalSheet = await prisma.goalSheet.findFirst({
      where: {
        employeeId: (session.user as any).id,
        status: "LOCKED",
      },
      include: {
        goals: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!goalSheet) {
      return NextResponse.json(
        { goalSheet: null, goals: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({
      goalSheet,
      goals: goalSheet.goals,
    });
  } catch (error: any) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch goals" },
      { status: 400 }
    );
  }
}
