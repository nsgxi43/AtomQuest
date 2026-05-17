import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    let users;

    if (userRole === "MANAGER") {
      // Get all direct reports
      users = await prisma.user.findMany({
        where: {
          managerId: (session.user as any).id,
        },
        include: {
          goalSheets: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
    } else if (userRole === "ADMIN") {
      // Get all users
      users = await prisma.user.findMany({
        include: {
          goalSheets: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 400 }
    );
  }
}
