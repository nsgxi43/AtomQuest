import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id },
      include: {
        goals: true,
        employee: true,
        checkins: true,
      },
    });

    if (!goalSheet) {
      return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
    }

    return NextResponse.json(goalSheet);
  } catch (error: any) {
    console.error("Error fetching goal sheet:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch goal sheet" },
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

    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id },
    });

    if (!goalSheet) {
      return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
    }

    const data = await request.json();

    const updated = await prisma.goalSheet.update({
      where: { id },
      data: {
        cycleYear: data.cycleYear || goalSheet.cycleYear,
        status: data.status || goalSheet.status,
      },
      include: {
        goals: true,
        employee: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating goal sheet:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update goal sheet" },
      { status: 400 }
    );
  }
}
