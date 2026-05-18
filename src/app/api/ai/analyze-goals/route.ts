import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  analyzeGovernanceQuality,
  getDefaultFallbackAnalysis,
} from "@/lib/ai/service";
import {
  AnalyzeGoalsRequestSchema,
  AIServiceError,
} from "@/lib/ai/types";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/ai/analyze-goals
 *
 * Analyzes goals for governance quality using Gemini AI.
 * Only callable by authenticated users (EMPLOYEE, MANAGER, ADMIN).
 * Returns structured governance analysis or graceful fallback.
 */
export async function POST(request: NextRequest) {
  try {
    // ─── 1. Authentication ─────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user) {
      console.warn("[AnalyzeGoalsAPI] Unauthorized request");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    console.log(
      `[AnalyzeGoalsAPI] Request from user=${userId} role=${userRole}`
    );

    // ─── 2. Parse & Validate Request ───────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch (err) {
      console.error("[AnalyzeGoalsAPI] Invalid JSON body");
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    let request_data;
    try {
      request_data = AnalyzeGoalsRequestSchema.parse(body);
    } catch (err: any) {
      console.error("[AnalyzeGoalsAPI] Validation failed:", err.errors);
      return NextResponse.json(
        {
          error: "Invalid goals data",
          details: err.errors?.[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    console.log(
      `[AnalyzeGoalsAPI] Analyzing ${request_data.goals.length} goals`
    );

    // ─── 3. Audit Log: Analysis Requested ──────────────────────────────────
    await prisma.auditLog.create({
      data: {
        entityType: "GovernanceAnalysis",
        entityId: `analysis-${Date.now()}`,
        changedById: userId,
        changeDescription: `AI governance analysis requested for ${request_data.goals.length} goals`,
        newValue: JSON.stringify({
          goalCount: request_data.goals.length,
          timestamp: new Date().toISOString(),
        }),
      },
    }).catch((err) => {
      console.error("[AnalyzeGoalsAPI] Failed to create audit log:", err);
      // Don't fail the request if audit logging fails
    });

    // ─── 4. Call AI Service ────────────────────────────────────────────────
    let analysis;
    let isFallbackAnalysis = false;
    try {
      analysis = await analyzeGovernanceQuality(request_data.goals);
      console.log(
        `[AnalyzeGoalsAPI] ✓ Analysis successful: score=${analysis.score}`
      );
    } catch (err) {
      // Handle AI service errors gracefully
      if (err instanceof AIServiceError) {
        console.error(`[AnalyzeGoalsAPI] AI Service Error: ${err.code}`);

        // For rate limiting, return 429
        if (err.code === "RATE_LIMIT") {
          return NextResponse.json(
            {
              error: "AI analysis temporarily unavailable",
              code: "RATE_LIMIT",
              fallback: getDefaultFallbackAnalysis(),
              isFallback: true,
            },
            { status: 429 }
          );
        }

        // For validation errors, return 400
        if (err.code === "VALIDATION_ERROR") {
          return NextResponse.json(
            { error: err.message, code: "VALIDATION_ERROR" },
            { status: 400 }
          );
        }

        // For all other errors (parse, API), return 200 with fallback
        // This ensures the workflow is not blocked
        console.warn(
          `[AnalyzeGoalsAPI] Returning intelligent fallback analysis due to: ${err.message}`
        );
        analysis = getDefaultFallbackAnalysis();
        isFallbackAnalysis = true;
      } else {
        // Unexpected error
        console.error(`[AnalyzeGoalsAPI] Unexpected error:`, err);
        analysis = getDefaultFallbackAnalysis();
        isFallbackAnalysis = true;
      }
    }

    // ─── 5. Return Analysis ────────────────────────────────────────────────
    return NextResponse.json(
      {
        analysis,
        isFallback: isFallbackAnalysis,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    // Final catch-all for unexpected errors
    console.error("[AnalyzeGoalsAPI] Unhandled error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        analysis: getDefaultFallbackAnalysis(),
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json(
    {
      service: "AI Governance Analysis",
      status: "ok",
      method: "POST",
      endpoint: "/api/ai/analyze-goals",
    },
    { status: 200 }
  );
}
