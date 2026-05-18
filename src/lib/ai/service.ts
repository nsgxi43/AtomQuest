import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import {
  GovernanceAnalysis,
  GovernanceAnalysisSchema,
  AIServiceError,
  GoalForAnalysis,
} from "./types";

// ─── Types for Gemini Response ─────────────────────────────────────────────
interface RawGeminiResponse {
  score: number;
  grade?: string;
  riskLevel: string;
  strengths: string[];
  risks: string[];
  recommendations: string[];
}

// ─── Initialize Gemini Client ──────────────────────────────────────────────
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AIServiceError(
      "GEMINI_API_KEY not configured in environment",
      "VALIDATION_ERROR"
    );
  }
  return new GoogleGenerativeAI(apiKey);
};

// ─── Robust JSON Extraction and Sanitization ──────────────────────────────
function sanitizeAndExtractJSON(responseText: string): string {
  if (!responseText || typeof responseText !== "string") {
    throw new Error("Response is not a string");
  }

  let cleaned = responseText.trim();

  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  cleaned = cleaned.trim();

  // Remove any leading/trailing text that isn't JSON
  // Find the first { and last } and extract what's between them
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    throw new Error("No valid JSON object found in response");
  }

  cleaned = cleaned.substring(firstBrace, lastBrace + 1);

  return cleaned;
}

// ─── Validate Extracted JSON ───────────────────────────────────────────────
function validateJSONStructure(obj: any): obj is RawGeminiResponse {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  // Check required fields
  if (typeof obj.score !== "number" || obj.score < 0 || obj.score > 100) {
    return false;
  }

  if (!Array.isArray(obj.strengths) || obj.strengths.length === 0) {
    return false;
  }

  if (!Array.isArray(obj.risks)) {
    return false;
  }

  if (!Array.isArray(obj.recommendations) || obj.recommendations.length === 0) {
    return false;
  }

  if (
    typeof obj.riskLevel !== "string" ||
    !["Low", "Medium", "High", "Critical"].includes(obj.riskLevel)
  ) {
    return false;
  }

  // Grade is optional but if present must be valid
  if (
    obj.grade &&
    !["Excellent", "Good", "Fair", "Poor"].includes(obj.grade)
  ) {
    return false;
  }

  return true;
}

// ─── Comprehensive Governance Analysis Prompt ──────────────────────────────
function getGovernanceAnalysisPrompt(goals: GoalForAnalysis[]): string {
  const goalsContext = goals
    .map((g, i) => {
      const desc = g.description ? ` - ${g.description}` : "";
      return `Goal ${i + 1}: "${g.title}"${desc}
  Area: ${g.thrustArea}
  Target: ${g.target} (${g.uom})
  Weight: ${g.weightage}%`;
    })
    .join("\n");

  return `You are an enterprise governance analyst. Analyze the following goals for quality and risk.

GOALS TO ANALYZE:
${goalsContext}

ANALYSIS CRITERIA:
1. KPI Clarity: How well-defined and specific is each goal?
2. Measurability: Are targets and success metrics clearly defined?
3. Realism: Are targets achievable within the timeframe?
4. Enterprise Readiness: Does the goal align with organizational standards?

You MUST return ONLY a valid JSON object with no additional text, markdown, code blocks, or explanations.

RETURN THIS EXACT JSON STRUCTURE:
{
  "score": <0-100 integer based on overall quality>,
  "grade": "<Excellent|Good|Fair|Poor>",
  "riskLevel": "<Low|Medium|High|Critical>",
  "strengths": ["<insight1>", "<insight2>"],
  "risks": ["<concern>"],
  "recommendations": ["<action>"]
}

Requirements:
- Arrays: 1-3 items each
- Score: 0-100
- No prose, explanations, or text outside JSON
- Valid JSON only`;
}

// ─── Main Analysis Function (Production-Grade) ─────────────────────────────
export async function analyzeGovernanceQuality(
  goals: GoalForAnalysis[]
): Promise<GovernanceAnalysis> {
  try {
    // ─── 1. Input Validation ──────────────────────────────────────────────
    if (!goals || goals.length === 0) {
      throw new AIServiceError(
        "At least one goal is required for analysis",
        "VALIDATION_ERROR"
      );
    }

    if (goals.length > 8) {
      throw new AIServiceError(
        "Maximum 8 goals can be analyzed at once",
        "VALIDATION_ERROR"
      );
    }

    console.log(`[AIService] ★ Starting analysis for ${goals.length} goal(s)`);

    // ─── 2. Initialize Gemini Client ──────────────────────────────────────
    let client: GoogleGenerativeAI;
    try {
      client = getGeminiClient();
    } catch (err) {
      console.error(`[AIService] ✗ Failed to initialize Gemini client:`, err);
      throw err;
    }

    // Use latest stable Gemini model with JSON support
    const model = client.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 400,
        topP: 0.95,
      },
    });

    // ─── 3. Build Analysis Prompt ─────────────────────────────────────────
    const prompt = getGovernanceAnalysisPrompt(goals);
    console.log(
      `[AIService] ✓ Prompt prepared (${prompt.length} chars, ${Math.ceil(prompt.length / 4)} tokens)`
    );

    // ─── 4. Call Gemini API ───────────────────────────────────────────────
    console.log(`[AIService] ⟳ Calling Gemini 2.0 Flash API...`);
    let response;
    try {
      response = await model.generateContent(prompt);
      console.log(`[AIService] ✓ Gemini responded`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[AIService] ✗ Gemini API error:`, errMsg);

      // Check for specific error types
      if (errMsg.includes("429") || errMsg.includes("quota")) {
        throw new AIServiceError(
          "Rate limited - too many requests",
          "RATE_LIMIT"
        );
      }
      if (errMsg.includes("RESOURCE_EXHAUSTED")) {
        throw new AIServiceError(
          "Gemini service temporarily exhausted",
          "RATE_LIMIT"
        );
      }
      if (errMsg.includes("401") || errMsg.includes("403")) {
        throw new AIServiceError(
          "Invalid or expired Gemini API key",
          "API_ERROR"
        );
      }

      throw new AIServiceError(`Gemini API failed: ${errMsg}`, "API_ERROR");
    }

    // ─── 5. Extract Response Text ─────────────────────────────────────────
    let responseText: string;
    try {
      responseText = response.response.text();
      if (!responseText || responseText.trim().length === 0) {
        throw new Error("Empty response - Gemini returned nothing");
      }
      console.log(
        `[AIService] ✓ Response extracted (${responseText.length} chars)`
      );
    } catch (err) {
      console.error(
        `[AIService] ✗ Failed to extract response text:`,
        err instanceof Error ? err.message : err
      );
      throw new AIServiceError(
        "Could not extract response text from Gemini",
        "PARSE_ERROR"
      );
    }

    // ─── 6. Log Raw Response ──────────────────────────────────────────────
    const preview = responseText.substring(0, 200);
    console.log(`[AIService] 📝 Raw response: ${preview}...`);

    // ─── 7. Sanitize and Extract JSON ─────────────────────────────────────
    let cleanedJSON: string;
    try {
      cleanedJSON = sanitizeAndExtractJSON(responseText);
      console.log(`[AIService] ✓ JSON extracted (${cleanedJSON.length} chars)`);
    } catch (sanitizeErr) {
      console.error(
        `[AIService] ✗ Failed to sanitize JSON:`,
        sanitizeErr instanceof Error ? sanitizeErr.message : sanitizeErr
      );
      console.error(`[AIService] 📝 Problematic response: ${responseText}`);
      throw new AIServiceError(
        "Failed to extract JSON from response",
        "PARSE_ERROR"
      );
    }

    // ─── 8. Parse JSON ────────────────────────────────────────────────────
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedJSON);
      console.log(`[AIService] ✓ JSON parsed successfully`);
    } catch (parseErr) {
      console.error(
        `[AIService] ✗ JSON.parse failed:`,
        parseErr instanceof Error ? parseErr.message : parseErr
      );
      console.error(`[AIService] 📝 Invalid JSON: ${cleanedJSON}`);
      throw new AIServiceError(
        "Gemini response is not valid JSON",
        "PARSE_ERROR"
      );
    }

    // ─── 9. Validate JSON Structure ────────────────────────────────────────
    if (!validateJSONStructure(parsed)) {
      console.error(
        `[AIService] ✗ JSON structure validation failed`
      );
      console.error(`[AIService] 📝 Parsed object:`, JSON.stringify(parsed, null, 2));
      throw new AIServiceError(
        "Response JSON missing required fields",
        "PARSE_ERROR"
      );
    }

    console.log(`[AIService] ✓ JSON structure validated`);

    // ─── 10. Convert to Zod Schema ────────────────────────────────────────
    let analysis: GovernanceAnalysis;
    try {
      // Ensure arrays are proper strings
      const cleanedAnalysis = {
        score: Math.round(parsed.score),
        grade: parsed.grade,
        riskLevel: parsed.riskLevel,
        strengths: Array.isArray(parsed.strengths)
          ? parsed.strengths.filter((s: any) => typeof s === "string").slice(0, 3)
          : ["Goals are structured"],
        risks: Array.isArray(parsed.risks)
          ? parsed.risks.filter((r: any) => typeof r === "string").slice(0, 3)
          : [],
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
              .filter((r: any) => typeof r === "string")
              .slice(0, 3)
          : ["Verify goal quality"],
      };

      analysis = GovernanceAnalysisSchema.parse(cleanedAnalysis);
      console.log(
        `[AIService] ✓ Analysis ready: Score=${analysis.score} Risk=${analysis.riskLevel} Grade=${analysis.grade}`
      );
    } catch (schemaErr: any) {
      console.error(
        `[AIService] ✗ Zod validation failed:`,
        schemaErr?.errors ? JSON.stringify(schemaErr.errors) : schemaErr
      );
      throw new AIServiceError(
        `Analysis schema validation failed: ${schemaErr?.message}`,
        "PARSE_ERROR"
      );
    }

    // ─── 11. Success ──────────────────────────────────────────────────────
    console.log(
      `[AIService] ✅ Analysis completed successfully (${goals.length} goals, score=${analysis.score})`
    );
    return analysis;
  } catch (err) {
    // ─── Error Handling ───────────────────────────────────────────────────

    if (err instanceof AIServiceError) {
      console.error(
        `[AIService] ⚠️  AIServiceError [${err.code}]: ${err.message}`
      );

      // Only throw VALIDATION_ERROR (input problem), fallback on all others
      if (err.code === "VALIDATION_ERROR") {
        throw err;
      }

      console.log(`[AIService] → Returning intelligent fallback analysis`);
      return buildIntelligentFallback(goals);
    }

    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[AIService] ✗ Unexpected error: ${errMsg}`);
    console.log(`[AIService] → Returning intelligent fallback analysis`);
    return buildIntelligentFallback(goals);
  }
}

// ─── Intelligent Fallback Analysis ────────────────────────────────────────
function buildIntelligentFallback(goals: GoalForAnalysis[]): GovernanceAnalysis {
  // Analyze goal structure for intelligent fallback
  const hasDescriptions = goals.filter((g) => g.description?.length).length;
  const hasCompleteInfo = goals.filter(
    (g) => g.title && g.target && g.thrustArea
  ).length;
  const avgWeightage = goals.reduce((sum, g) => sum + g.weightage, 0) / goals.length;

  // Build intelligent insights based on actual goals
  const strengths: string[] = [];
  const risks: string[] = [];
  const recommendations: string[] = [];

  // Strengths
  if (hasCompleteInfo === goals.length) {
    strengths.push("All goals have complete required information");
  }
  if (hasDescriptions >= goals.length * 0.8) {
    strengths.push("Goals are well-documented with descriptions");
  }
  if (avgWeightage >= 15 && avgWeightage <= 35) {
    strengths.push("Weightage distribution appears balanced");
  }

  if (strengths.length === 0) {
    strengths.push("Goal structure is defined");
  }

  // Risks
  if (hasCompleteInfo < goals.length * 0.8) {
    risks.push("Some goals are missing key information");
  }
  if (Math.abs(avgWeightage - 25) > 15) {
    risks.push("Weightage distribution may be imbalanced");
  }
  risks.push("AI analysis unavailable - fallback used");

  // Recommendations
  if (hasDescriptions < goals.length) {
    recommendations.push("Add descriptions to all goals for clarity");
  }
  recommendations.push("Review goal definitions for measurability");

  // Determine risk level based on completeness
  let riskLevel: "Low" | "Medium" | "High" | "Critical" = "Medium";
  const completeness = hasCompleteInfo / goals.length;
  if (completeness < 0.6) riskLevel = "High";
  else if (completeness >= 0.95) riskLevel = "Low";

  // Base score on information completeness
  let score = 70 + Math.round(completeness * 20);
  if (hasDescriptions > goals.length * 0.7) score += 5;
  score = Math.min(score, 85); // Cap fallback at 85

  console.log(
    `[AIService] 🔄 Fallback Analysis: score=${score}, risk=${riskLevel}, completeness=${(completeness * 100).toFixed(0)}%`
  );

  return {
    score,
    grade: score >= 80 ? "Good" : score >= 70 ? "Fair" : "Poor",
    riskLevel,
    strengths: strengths.slice(0, 2),
    risks: risks.slice(0, 2),
    recommendations: recommendations.slice(0, 2),
  };
}

// ─── Generic Fallback (if goals are malformed) ────────────────────────────
export function getDefaultFallbackAnalysis(): GovernanceAnalysis {
  return {
    score: 70,
    grade: "Fair",
    riskLevel: "Medium",
    strengths: [
      "Goals structure is defined",
      "Enterprise baseline maintained",
    ],
    risks: ["AI analysis not available"],
    recommendations: [
      "Verify goal clarity and measurability",
      "Review KPI definitions",
    ],
  };
}
