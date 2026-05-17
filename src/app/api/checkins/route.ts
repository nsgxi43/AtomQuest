import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalSheetId, quarter, comment } = await request.json();

    if (!comment || comment.length < 10) {
      return NextResponse.json(
        { error: "Comment must be at least 10 characters" },
        { status: 400 }
      );
    }

    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id: goalSheetId },
      include: { employee: true },
    });

    if (!goalSheet) {
      return NextResponse.json(
        { error: "Goal sheet not found" },
        { status: 404 }
      );
    }

    // Verify the manager owns this employee
    if (goalSheet.employee.managerId !== (session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const checkin = await prisma.checkinComment.create({
      data: {
        goalSheetId,
        managerId: (session.user as any).id,
        quarter,
        comment,
      },
    });

    return NextResponse.json(checkin, { status: 201 });
  } catch (error: any) {
    console.error("Error creating check-in:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create check-in" },
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

    let checkins: any[] = [];
    const userRole = (session.user as any).role;

    if (userRole === "MANAGER") {
      checkins = await prisma.checkinComment.findMany({
        where: {
          manager: {
            id: (session.user as any).id,
          },
        },
        include: {
          goalSheet: {
            include: { employee: true },
          },
          manager: true,
        },
      });
    } else if (userRole === "EMPLOYEE") {
      checkins = await prisma.checkinComment.findMany({
        where: {
          goalSheet: {
            employeeId: (session.user as any).id,
          },
        },
        include: {
          goalSheet: true,
          manager: true,
        },
      });
    } else {
      checkins = [];
    }

    return NextResponse.json(checkins);
  } catch (error: any) {
    console.error("Error fetching check-ins:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch check-ins" },
      { status: 400 }
    );
  }
}
