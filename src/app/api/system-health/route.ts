import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/mail";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized — Admin only" }, { status: 401 });
    }

    // Parallel DB health queries
    const [
      totalUsers,
      orphanEmployees,
      managersWithoutNotifEmail,
      recentNotifLogs,
      pendingEscalations,
      totalGoalSheets,
      auditLogCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "EMPLOYEE", managerId: null } }),
      prisma.user.count({ where: { role: "MANAGER", notificationEmail: null } }),
      prisma.notificationLog.findMany({ orderBy: { sentAt: "desc" }, take: 5 }),
      prisma.goalSheet.count({ where: { status: { in: ["DRAFT", "SUBMITTED"] } } }),
      prisma.goalSheet.count(),
      prisma.auditLog.count(),
    ]);

    // SMTP connectivity check
    let smtpConnected = false;
    let smtpError: string | null = null;
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      try {
        await transporter.verify();
        smtpConnected = true;
      } catch (err: any) {
        smtpError = err?.message ?? "SMTP verification failed";
      }
    } else {
      smtpError = "SMTP credentials not configured";
    }

    return NextResponse.json({
      auth: {
        seededAccountsActive: true,
        rbacEnabled: true,
        jwtStrategy: "jwt",
        authProvider: "NextAuth Credentials + Entra Simulation",
      },
      smtp: {
        connected: smtpConnected,
        configured: !!process.env.SMTP_EMAIL,
        error: smtpError,
        recentLogs: recentNotifLogs,
      },
      governance: {
        escalationEngineActive: true,
        notificationEngineActive: true,
        auditLoggingActive: true,
        auditLogCount,
        totalGoalSheets,
      },
      database: {
        totalUsers,
        orphanEmployees,
        managersWithoutNotifEmail,
        pendingGoalSheets: pendingEscalations,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
