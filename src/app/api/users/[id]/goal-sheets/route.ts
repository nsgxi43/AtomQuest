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
    if (!session?.user || (session.user as any).role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify manager relationship
    const employee = await prisma.user.findUnique({
      where: { id },
    });

    if (!employee || employee.managerId !== (session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goalSheets = await prisma.goalSheet.findMany({
      where: { employeeId: id },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    return NextResponse.json(goalSheets);
  } catch (error: any) {
    console.error("Error fetching goal sheets:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch goal sheets" },
      { status: 400 }
    );
  }
}
