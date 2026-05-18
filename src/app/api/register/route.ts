import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { name, email, password, role, employeeId, department, organization, notificationEmail, managerId } = parsed.data;

    // Validate managerId if provided
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
        select: { id: true, role: true },
      });
      if (!manager) {
        return NextResponse.json({ error: "Selected manager does not exist." }, { status: 400 });
      }
      if (manager.role !== "MANAGER") {
        return NextResponse.json({ error: "Selected user is not a Manager." }, { status: 400 });
      }
    }

    // Check email uniqueness
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    // Check employeeId uniqueness
    const existingEmpId = await prisma.user.findUnique({ where: { employeeId } });
    if (existingEmpId) {
      return NextResponse.json({ error: "This Employee ID is already registered." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password:          hashedPassword,
        role:              role as any,
        employeeId,
        department,
        organization:      organization || null,
        notificationEmail: notificationEmail || null,
        managerId:         role === "EMPLOYEE" ? (managerId || null) : null,
      },
      select: { id: true, name: true, email: true, role: true, department: true, managerId: true },
    });

    // Auto-create goal sheet for new employees
    if (role === "EMPLOYEE") {
      await prisma.goalSheet.create({
        data: {
          employeeId: user.id,
          cycleYear:  new Date().getFullYear(),
          status:     "DRAFT",
        },
      });
    }

    console.log(`[Register] New ${role} registered: ${email}${managerId ? ` → Manager: ${managerId}` : ""}`);

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
