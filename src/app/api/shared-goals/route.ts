import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can create shared goals
    const userRole = (session.user as any).role;
    if (!["ADMIN", "MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { title, thrustArea, target, uom, assignToEmployeeIds } =
      await request.json();

    // Validate inputs
    if (!title || !thrustArea || !target || !uom) {
      return NextResponse.json(
        { error: "Missing required fields: title, thrustArea, target, uom" },
        { status: 400 }
      );
    }

    // Create shared goal
    const sharedGoal = await prisma.sharedGoal.create({
      data: {
        title,
        thrustArea,
        target,
        uom,
        createdById: (session.user as any).id,
      },
    });

    // Assign to employees if provided
    if (assignToEmployeeIds && assignToEmployeeIds.length > 0) {
      // Get all active goal sheets for these employees in current year
      const currentYear = new Date().getFullYear();
      const goalSheets = await prisma.goalSheet.findMany({
        where: {
          employeeId: { in: assignToEmployeeIds },
          cycleYear: currentYear,
        },
      });

      // Create goals for each goal sheet
      for (const goalSheet of goalSheets) {
        await prisma.goal.create({
          data: {
            goalSheetId: goalSheet.id,
            title,
            thrustArea,
            target,
            uom,
            weightage: 0, // Employees must set this
            sharedFromId: sharedGoal.id,
            isShared: true,
          },
        });
      }
    }

    return NextResponse.json(sharedGoal);
  } catch (error: any) {
    console.error("Error creating shared goal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create shared goal" },
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

    const userRole = (session.user as any).role;

    // Admins see all shared goals
    if (userRole === "ADMIN") {
      const sharedGoals = await prisma.sharedGoal.findMany({
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          goals: {
            include: {
              goalSheet: {
                include: { employee: { select: { id: true, name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(sharedGoals);
    }

    // Managers see their own shared goals
    if (userRole === "MANAGER") {
      const sharedGoals = await prisma.sharedGoal.findMany({
        where: { createdById: (session.user as any).id },
        include: {
          createdBy: { select: { id: true, name: true } },
          goals: {
            include: {
              goalSheet: {
                include: { employee: { select: { id: true, name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(sharedGoals);
    }

    // Employees see shared goals assigned to them
    const employeeGoals = await prisma.goal.findMany({
      where: {
        isShared: true,
        goalSheet: { employeeId: (session.user as any).id },
      },
      include: { sharedGoal: true },
    });

    return NextResponse.json(employeeGoals);
  } catch (error: any) {
    console.error("Error fetching shared goals:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch shared goals" },
      { status: 400 }
    );
  }
}
