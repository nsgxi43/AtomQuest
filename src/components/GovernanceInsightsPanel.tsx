"use client";

import React, { useEffect, useState } from "react";
import { GovernanceAnalysis, RiskLevel } from "@/lib/ai/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  FileText
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
    gradientFrom: string;
    gradientTo: string;
  }
> = {
  Low: {
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    dotColor: "bg-green-500",
    label: "Low Risk",
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-600",
  },
  Medium: {
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    dotColor: "bg-amber-500",
    label: "Medium Risk",
    gradientFrom: "from-amber-500",
    gradientTo: "to-orange-600",
  },
  High: {
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    dotColor: "bg-orange-500",
    label: "High Risk",
    gradientFrom: "from-orange-500",
    gradientTo: "to-red-600",
  },
  Critical: {
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    dotColor: "bg-red-500",
    label: "Critical Risk",
    gradientFrom: "from-red-500",
    gradientTo: "to-rose-600",
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

// ─── Governance Score Indicator ────────────────────────────────────────────
function GovernanceScoreIndicator({
  score,
  riskLevel,
}: {
  score: number;
  riskLevel: RiskLevel;
}) {
  const config = RISK_CONFIG[riskLevel];
  const scorePercentage = (score / 100) * 100;

  return (
    <div className="flex items-center gap-4">
      {/* Circular Score Display */}
      <div className="relative flex-shrink-0">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={config.dotColor.replace("bg-", "").split("-")[0] === "green" ? "#22c55e" : 
                    config.dotColor.replace("bg-", "").split("-")[0] === "amber" ? "#f59e0b" :
                    config.dotColor.replace("bg-", "").split("-")[0] === "orange" ? "#f97316" : "#ef4444"}
            strokeWidth="8"
            strokeDasharray={`${(scorePercentage / 100) * 282.7} 282.7`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold", getScoreColor(score))}>
            {score}
          </span>
          <span className="text-xs text-gray-600">/100</span>
        </div>
      </div>

      {/* Score Details */}
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-gray-600">Grade</p>
          <p className={cn("text-2xl font-bold", getScoreColor(score))}>
            {getScoreGrade(score)}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Risk Level</p>
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mt-1",
              config.bgColor,
              config.borderColor
            )}
          >
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full",
                config.dotColor,
                riskLevel === "Critical" ? "animate-pulse" : ""
              )}
            />
            <span className={cn("text-sm font-semibold", config.textColor)}>
              {config.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Insight Item ─────────────────────────────────────────────────────────
interface InsightItemProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
  bgClass: string;
  borderClass: string;
  dotColor: string;
}

function InsightItem({
  icon,
  title,
  items,
  bgClass,
  borderClass,
  dotColor,
}: InsightItemProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        bgClass,
        borderClass
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-gray-900">{title}</span>
          <span className="text-xs font-medium text-gray-600 ml-auto">
            {items.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {expanded && items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-gray-700">
              <span className={cn("font-bold flex-shrink-0", dotColor)}>
                {title.includes("Strength") ? "✓" : title.includes("Risk") ? "⚠" : "→"}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main Drawer Governance Insights Panel ─────────────────────────────────
interface GovernanceInsightsPanelProps {
  analysis: GovernanceAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onAnalyze: () => Promise<void>;
  isAnalyzing?: boolean;
  showButton?: boolean;
  isFallback?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function GovernanceInsightsPanel({
  analysis,
  isLoading,
  error,
  onAnalyze,
  isAnalyzing = false,
  showButton = false,
  isFallback = false,
  isOpen = false,
  onClose,
}: GovernanceInsightsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Keep it always expanded in drawer mode
    setExpanded(true);
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-[480px] bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex bg-slate-900 items-center justify-between px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">AI Governance Insights</h2>
              <p className="text-xs text-blue-200">Enterprise Blueprint Quality</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 bg-gray-50/50">
          <div className="w-full space-y-6">
            
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 px-4 space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold text-gray-900">
                    Analyzing governance patterns
                  </p>
                  <p className="text-sm text-gray-500 max-w-[280px]">
                    Evaluating KPI clarity, measurability, and structural risk...
                  </p>
                </div>
                
                {/* Simulated progress indicators */}
                <div className="w-full max-w-[300px] mt-4 space-y-3">
                  {[
                    "Validating SMART criteria",
                    "Checking enterprise alignment",
                    "Calculating risk score",
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-500 animate-pulse" style={{ animationDelay: `${i * 200}ms`}}>
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                      {step}...
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Analysis Failed</h3>
                <p className="text-sm text-gray-500 mb-6">{error}</p>
                <button
                  onClick={onAnalyze}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Analysis Results */}
            {analysis && !isLoading && !error && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {/* Fallback Analysis Badge */}
                {isFallback && (
                  <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3 shadow-sm">
                     <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900">Pattern-based Analysis</h4>
                      <p className="text-xs text-blue-700 mt-1">
                        AI service is currently rate limited. We've provided a standard governance review based on your goal structure.
                      </p>
                    </div>
                  </div>
                )}

                {/* Score Panel */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Governance Score</h3>
                  </div>
                  <GovernanceScoreIndicator
                    score={analysis.score}
                    riskLevel={analysis.riskLevel}
                  />
                </div>

                {/* Divider Line */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-gray-50 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                      Detailed Findings
                    </span>
                  </div>
                </div>

                {/* Insights Listing */}
                <div className="space-y-4">
                  {/* Strengths */}
                  {analysis.strengths.length > 0 && (
                    <InsightItem
                      icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
                      title="Strengths"
                      items={analysis.strengths}
                      bgClass="bg-green-50/50"
                      borderClass="border-green-200/60"
                      dotColor="text-green-600"
                    />
                  )}

                  {/* Risks */}
                  {analysis.risks.length > 0 && (
                    <InsightItem
                      icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
                      title="Risks identified"
                      items={analysis.risks}
                      bgClass="bg-amber-50/50"
                      borderClass="border-amber-200/60"
                      dotColor="text-amber-600"
                    />
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations.length > 0 && (
                    <InsightItem
                      icon={<Zap className="w-5 h-5 text-blue-600" />}
                      title="Actionable Recommendations"
                      items={analysis.recommendations}
                      bgClass="bg-blue-50/50"
                      borderClass="border-blue-200/60"
                      dotColor="text-blue-600"
                    />
                  )}
                </div>
                
                {/* Footer Credits */}
                <div className="mt-8 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Real-time governance intelligence</span>
                  </div>
                  <span>Powered by Gemini AI</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white mt-auto flex-shrink-0 flex justify-end shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </>
  );
}
