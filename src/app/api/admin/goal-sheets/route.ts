import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/goal-sheets
 * Admin-only: returns all goal sheets with employee info.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goalSheets = await prisma.goalSheet.findMany({
      include: {
        employee: { select: { id: true, name: true, email: true } },
        goals: { select: { id: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(goalSheets);
  } catch (error: any) {
    console.error("Error fetching admin goal sheets:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch goal sheets" },
      { status: 500 }
    );
  }
}
