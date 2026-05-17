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

    const { title, thrustArea, target, uom, assignToEmployeeIds, primaryOwnerId, employeeWeightages } =
      await request.json();

    // Validate inputs
    if (!title || !thrustArea || !target || !uom || !primaryOwnerId || !employeeWeightages) {
      return NextResponse.json(
        { error: "Missing required fields: title, thrustArea, target, uom, primaryOwnerId, employeeWeightages" },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    const createdById = (session.user as any).id;

    // Execute in a transaction for safety
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create shared goal
      const sharedGoal = await tx.sharedGoal.create({
        data: {
          title,
          thrustArea,
          target,
          uom,
          createdById,
          primaryOwnerId,
        },
      });

      // 2. Pre-flight check: block if any existing GoalSheet is SUBMITTED or APPROVED
      if (assignToEmployeeIds && assignToEmployeeIds.length > 0) {
        const existingSheets = await tx.goalSheet.findMany({
          where: {
            employeeId: { in: assignToEmployeeIds },
            cycleYear: currentYear,
          },
        });

        const blockedSheets = existingSheets.filter(
          (s) => s.status === "SUBMITTED" || s.status === "APPROVED"
        );
        if (blockedSheets.length > 0) {
          throw new Error("Cannot assign shared goals to employees with SUBMITTED or APPROVED goal sheets.");
        }
      }

      // 3. Process each assigned employee
      if (assignToEmployeeIds && assignToEmployeeIds.length > 0) {
        for (const empId of assignToEmployeeIds) {
          // Find or create GoalSheet
          let goalSheet = await tx.goalSheet.findFirst({
            where: {
              employeeId: empId,
              cycleYear: currentYear,
            },
          });

          if (!goalSheet) {
            goalSheet = await tx.goalSheet.create({
              data: {
                employeeId: empId,
                cycleYear: currentYear,
                status: "DRAFT",
              },
            });
          }

          // Create linked Goal
          await tx.goal.create({
            data: {
              goalSheetId: goalSheet.id,
              title,
              thrustArea,
              target,
              uom,
              weightage: employeeWeightages[empId] || 0,
              sharedFromId: sharedGoal.id,
              isShared: true,
              isPrimaryOwner: empId === primaryOwnerId,
            },
          });
        }
      }

      return sharedGoal;
    });

    return NextResponse.json(result);
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
