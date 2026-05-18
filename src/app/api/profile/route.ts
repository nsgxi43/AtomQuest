import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where:  { id: (session.user as any).id },
      select: {
        id: true, name: true, email: true, role: true,
        department: true, organization: true, employeeId: true,
        notificationEmail: true,
        manager: { select: { id: true, name: true, email: true, department: true } },
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
