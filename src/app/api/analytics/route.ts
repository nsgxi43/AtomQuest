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
    if (!["MANAGER", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const currentYear = new Date().getFullYear();

    // Scope: managers see only their direct reports; admins see all
    const employeeWhere: any =
      userRole === "MANAGER"
        ? { managerId: (session.user as any).id }
        : {};

    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE", ...employeeWhere },
      include: {
        goalSheets: {
          where: { cycleYear: currentYear },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            goals: {
              include: {
                updates: true,
              },
            },
          },
        },
      },
    });

    const totalEmployees = employees.length;
    let activeGoalSheets = 0;
    let lockedSheetsCount = 0;
    let totalScore = 0;
    let scoreCount = 0;

    let statusCounts = { completed: 0, onTrack: 0, notStarted: 0 };
    let thrustAreaDistribution: Record<string, number> = {};
    
    // For heatmap
    let heatmap: any[] = [];
    
    // For Quarter Trend
    let qScores: Record<string, { total: number; count: number }> = {
      Q1: { total: 0, count: 0 },
      Q2: { total: 0, count: 0 },
      Q3: { total: 0, count: 0 },
      Q4: { total: 0, count: 0 },
    };

    employees.forEach((emp) => {
      const sheet = emp.goalSheets[0];
      if (sheet) {
        activeGoalSheets++;
        if (sheet.status === "LOCKED") {
          lockedSheetsCount++;
        }

        let empHeatmap = { employee: emp.name, Q1: "-", Q2: "-", Q3: "-", Q4: "-" };

        sheet.goals.forEach((goal) => {
          thrustAreaDistribution[goal.thrustArea] = (thrustAreaDistribution[goal.thrustArea] || 0) + 1;
          
          goal.updates.forEach((update) => {
            if (update.computedScore !== null && update.computedScore !== undefined) {
              totalScore += update.computedScore;
              scoreCount++;

              if (qScores[update.quarter]) {
                qScores[update.quarter].total += update.computedScore;
                qScores[update.quarter].count++;
              }
            }

            if (update.status === "COMPLETED") statusCounts.completed++;
            else if (update.status === "ON_TRACK") statusCounts.onTrack++;
            else statusCounts.notStarted++;
            
            empHeatmap[update.quarter as keyof typeof empHeatmap] = update.status;
          });
          
          if (goal.updates.length === 0) {
            statusCounts.notStarted++;
          }
        });
        
        heatmap.push(empHeatmap);
      } else {
        heatmap.push({ employee: emp.name, Q1: "-", Q2: "-", Q3: "-", Q4: "-" });
      }
    });

    const avgAchievementScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
    const approvalRate = totalEmployees > 0 ? Math.round((lockedSheetsCount / totalEmployees) * 100) : 0;
    const quarterlyCompletion = totalEmployees > 0 ? Math.round((statusCounts.completed / (statusCounts.completed + statusCounts.onTrack + statusCounts.notStarted || 1)) * 100) : 0;

    const quarterTrend = ["Q1", "Q2", "Q3", "Q4"].map((q) => ({
      name: q,
      score: qScores[q].count > 0 ? Math.round(qScores[q].total / qScores[q].count) : 0,
    }));

    const thrustAreaArr = Object.keys(thrustAreaDistribution).map((key) => ({
      name: key,
      value: thrustAreaDistribution[key],
    }));

    // Manager Effectiveness
    let managerEffectiveness: any[] = [];
    if (userRole === "ADMIN") {
      const managers = await prisma.user.findMany({
        where: { role: "MANAGER" },
        include: {
          subordinates: {
            include: {
              goalSheets: {
                where: { cycleYear: currentYear },
                orderBy: { createdAt: "desc" },
                take: 1,
                include: {
                  goals: {
                    include: { updates: true }
                  }
                }
              }
            }
          },
          checkins: {
            where: {
              goalSheet: { cycleYear: currentYear }
            }
          }
        }
      });

      managerEffectiveness = managers.map((mgr) => {
        const teamSize = mgr.subordinates.length;
        let approvedSheets = 0;
        let mgrTotalScore = 0;
        let mgrScoreCount = 0;

        mgr.subordinates.forEach(sub => {
          const sheet = sub.goalSheets[0];
          if (sheet) {
            if (sheet.status === "LOCKED") approvedSheets++;
            sheet.goals.forEach(g => {
              g.updates.forEach(u => {
                if (u.computedScore !== null && u.computedScore !== undefined) {
                  mgrTotalScore += u.computedScore;
                  mgrScoreCount++;
                }
              });
            });
          }
        });

        const completedCheckins = mgr.checkins.length;
        const avgTeamScore = mgrScoreCount > 0 ? Math.round(mgrTotalScore / mgrScoreCount) : 0;

        return {
          id: mgr.id,
          manager: mgr.name,
          teamSize,
          approvedSheets,
          completedCheckins,
          avgTeamScore,
        };
      });
    }

    return NextResponse.json({
      overview: {
        totalEmployees,
        activeGoalSheets,
        approvalRate,
        quarterlyCompletion,
        avgAchievementScore,
        lockedSheetsCount,
      },
      statusDistribution: [
        { name: "Completed", value: statusCounts.completed, fill: "#22c55e" },
        { name: "On Track", value: statusCounts.onTrack, fill: "#3b82f6" },
        { name: "Not Started", value: statusCounts.notStarted, fill: "#94a3b8" },
      ],
      quarterTrend,
      thrustAreaDistribution: thrustAreaArr,
      heatmap,
      managerEffectiveness,
    });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
