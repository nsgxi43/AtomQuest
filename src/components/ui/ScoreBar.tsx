"use client";

interface ScoreBarProps {
  score: number;
  label?: string;
}

export function ScoreBar({ score, label = "Score" }: ScoreBarProps) {
  const isLow = score < 50;
  const isMid = score >= 50 && score < 80;
  const isHigh = score >= 80;

  const barColor = isLow ? "bg-red-600" : isMid ? "bg-yellow-500" : "bg-green-600";
  const textColor = isLow ? "text-red-600" : isMid ? "text-yellow-600" : "text-green-600";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className={`text-sm font-semibold ${textColor}`}>
          {score.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}
