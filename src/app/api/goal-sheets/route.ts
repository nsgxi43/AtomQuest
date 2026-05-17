import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentYear = new Date().getFullYear();
    const goalSheets = await prisma.goalSheet.findMany({
      where: {
        employeeId: (session.user as any).id,
        cycleYear: currentYear,
      },
      include: {
        goals: true,
        employee: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Return the first goal sheet (current cycle) or the latest one
    let goalSheet = goalSheets[0] || null;

    if (!goalSheet) {
      // Auto-create for the current year if it doesn't exist
      goalSheet = await prisma.goalSheet.create({
        data: {
          employeeId: (session.user as any).id,
          cycleYear: currentYear,
          status: "DRAFT",
        },
        include: {
          goals: true,
          employee: true,
        },
      });
    }

    const goals = goalSheet?.goals || [];

    return NextResponse.json({ goalSheet, goals });
  } catch (error: any) {
    console.error("Error fetching goal sheets:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch goal sheets" },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a new goal sheet
    const goalSheet = await prisma.goalSheet.create({
      data: {
        employeeId: (session.user as any).id,
        cycleYear: new Date().getFullYear(),
      },
    });

    return NextResponse.json(goalSheet, { status: 201 });
  } catch (error: any) {
    console.error("Error creating goal sheet:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create goal sheet" },
      { status: 400 }
    );
  }
}
