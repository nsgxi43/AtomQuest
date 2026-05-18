import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — used by registration form to populate manager dropdown
export async function GET() {
  try {
    const managers = await prisma.user.findMany({
      where:   { role: "MANAGER" },
      select:  { id: true, name: true, email: true, department: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(managers);
  } catch (error: any) {
    console.error("[managers API]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
