"use client";

import React from "react";
import { GovernanceAnalysis, RiskLevel } from "@/lib/ai/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Risk Level Configuration ──────────────────────────────────────────────
const RISK_CONFIG: Record<
  RiskLevel,
  {
    bgColor: string;
    borderColor: string;
    textColor: string;
    dotColor: string;
    label: string;
  }
> = {
  Low: {
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    dotColor: "bg-green-500",
    label: "Low",
  },
  Medium: {
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    dotColor: "bg-amber-500",
    label: "Medium",
  },
  High: {
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    dotColor: "bg-orange-500",
    label: "High",
  },
  Critical: {
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    dotColor: "bg-red-500",
    label: "Critical",
  },
};

// ─── Score Grade Helper ────────────────────────────────────────────────────
function getScoreGrade(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  return "Poor";
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600";
  if (score >= 75) return "text-blue-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

// ─── Risk Level Badge ─────────────────────────────────────────────────────
function RiskLevelBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const config = RISK_CONFIG[riskLevel];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border",
        config.bgColor,
        config.borderColor,
        config.textColor
      )}
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          config.dotColor,
          riskLevel === "Critical" ? "animate-pulse" : ""
        )}
      />
      <span className="text-sm font-semibold">{config.label}</span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
interface GovernanceAnalysisPanelProps {
  analysis: GovernanceAnalysis;
  isLoading?: boolean;
  error?: string;
}

export function GovernanceAnalysisPanel({
  analysis,
  isLoading = false,
  error,
}: GovernanceAnalysisPanelProps) {
  if (error) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardBody className="space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">
                Analysis Unavailable
              </h3>
              <p className="text-sm text-amber-700 mt-1">{error}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  const scoreGrade = getScoreGrade(analysis.score);
  const scoreColor = getScoreColor(analysis.score);

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader className="border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Governance AI Review
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Enterprise KPI governance quality assessment
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Score Section */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-6">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Governance Score
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={cn("text-4xl font-bold", scoreColor)}>
                {analysis.score}
              </span>
              <span className="text-gray-500 text-lg">/100</span>
            </div>
            <p className={cn("text-sm font-semibold mt-1", scoreColor)}>
              {scoreGrade}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Risk Level</p>
            <RiskLevelBadge riskLevel={analysis.riskLevel} />
          </div>
        </div>

        {/* Strengths Section */}
        {analysis.strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 text-sm text-gray-700 bg-green-50/30 p-2 rounded border border-green-100"
                >
                  <span className="text-green-600 font-bold flex-shrink-0">
                    ✓
                  </span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks Section */}
        {analysis.risks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-gray-900">Governance Risks</h3>
            </div>
            <ul className="space-y-2">
              {analysis.risks.map((risk, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 text-sm text-gray-700 bg-amber-50/30 p-2 rounded border border-amber-100"
                >
                  <span className="text-amber-600 font-bold flex-shrink-0">
                    ⚠
                  </span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations Section */}
        {analysis.recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Recommendations</h3>
            </div>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 text-sm text-gray-700 bg-blue-50/30 p-2 rounded border border-blue-100"
                >
                  <span className="text-blue-600 font-bold flex-shrink-0">
                    →
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Analysis powered by enterprise AI governance engine</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Loading State Component ────────────────────────────────────────────────
export function GovernanceAnalysisLoading() {
  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader className="border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">
          Governance AI Review
        </h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-sm text-gray-600">
              Analyzing governance quality...
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Compact Badge Version (for dashboards) ────────────────────────────────
interface CompactGovernanceBadgeProps {
  score: number;
  riskLevel: RiskLevel;
  onClick?: () => void;
}

export function CompactGovernanceBadge({
  score,
  riskLevel,
  onClick,
}: CompactGovernanceBadgeProps) {
  const config = RISK_CONFIG[riskLevel];
  const scoreColor = getScoreColor(score);

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors hover:opacity-80 cursor-pointer",
        config.bgColor,
        config.borderColor
      )}
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          config.dotColor,
          riskLevel === "Critical" ? "animate-pulse" : ""
        )}
      />
      <span className={cn("text-sm font-semibold", scoreColor)}>
        {score}/100
      </span>
      <span className={cn("text-xs font-medium", config.textColor)}>
        {riskLevel}
      </span>
    </button>
  );
}
