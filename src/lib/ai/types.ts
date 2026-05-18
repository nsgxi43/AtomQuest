import { z } from "zod";

// ─── Input Types ────────────────────────────────────────────────────────────
export interface GoalForAnalysis {
  title: string;
  description?: string | null;
  thrustArea: string;
  uom: "NUMERIC_MIN" | "NUMERIC_MAX" | "TIMELINE" | "ZERO";
  target: string;
  weightage: number;
}

export const AnalyzeGoalsRequestSchema = z.object({
  goals: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        thrustArea: z.string().min(1),
        uom: z.enum(["NUMERIC_MIN", "NUMERIC_MAX", "TIMELINE", "ZERO"]),
        target: z.string().min(1),
        weightage: z.number().min(10).max(100),
      })
    )
    .min(1, "At least one goal required")
    .max(8, "Maximum 8 goals"),
});

export type AnalyzeGoalsRequest = z.infer<typeof AnalyzeGoalsRequestSchema>;

// ─── Output Types ──────────────────────────────────────────────────────────
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export const GovernanceAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  grade: z.enum(["Excellent", "Good", "Fair", "Poor"]).optional(),
  riskLevel: z.enum(["Low", "Medium", "High", "Critical"]),
  strengths: z.array(z.string()).min(1).max(3),
  risks: z.array(z.string()).min(0).max(3),
  recommendations: z.array(z.string()).min(1).max(3),
});

export type GovernanceAnalysis = z.infer<typeof GovernanceAnalysisSchema>;

// ─── Error Handling ────────────────────────────────────────────────────────
export class AIServiceError extends Error {
  constructor(
    public message: string,
    public code: "VALIDATION_ERROR" | "API_ERROR" | "PARSE_ERROR" | "RATE_LIMIT" = "API_ERROR"
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}
