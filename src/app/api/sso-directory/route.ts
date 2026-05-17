import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — no auth required (this is the SSO "identity provider" directory)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        manager: { select: { id: true, name: true, email: true, role: true } },
        subordinates: { select: { id: true, name: true } },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    // Map database roles to simulated Azure AD groups and metadata
    const mapped = users.map((u) => {
      const aadGroup =
        u.role === "ADMIN" ? "AAD-GRP-HR-ADMIN" :
        u.role === "MANAGER" ? "AAD-GRP-L1-MANAGER" :
        "AAD-GRP-EMPLOYEE";

      const department =
        u.role === "ADMIN" ? "Human Resources & Administration" :
        u.role === "MANAGER" ? "Engineering Operations" :
        "Individual Contributor";

      const accessScope =
        u.role === "ADMIN" ? ["global.read", "global.write", "users.manage", "reports.all", "audit.read"] :
        u.role === "MANAGER" ? ["team.read", "team.write", "approvals.manage", "checkins.manage"] :
        ["self.read", "self.write", "goals.manage", "tracking.update"];

      const initials = u.name.split(" ").map((p: string) => p[0]).join("").toUpperCase().slice(0, 2);
      const avatarColor =
        u.role === "ADMIN" ? "#7c3aed" :
        u.role === "MANAGER" ? "#1d4ed8" :
        "#047857";

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        aadGroup,
        department,
        accessScope,
        initials,
        avatarColor,
        reportsTo: u.manager ? { name: u.manager.name, email: u.manager.email } : null,
        directReports: u.subordinates.length,
        upn: u.email, // User Principal Name
        tenantDomain: u.email.split("@")[1] ?? "corp.atomquest.io",
      };
    });

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
