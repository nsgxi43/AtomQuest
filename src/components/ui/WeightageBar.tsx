"use client";

interface WeightageBarProps {
  currentWeightage: number;
  label?: string;
}

export function WeightageBar({
  currentWeightage,
  label = "Total Weightage",
}: WeightageBarProps) {
  const isComplete = currentWeightage === 100;
  const isOverflow = currentWeightage > 100;

  const barColor = isOverflow
    ? "bg-red-600"
    : isComplete
      ? "bg-green-600"
      : "bg-blue-600";

  const textColor = isOverflow ? "text-red-600" : isComplete ? "text-green-600" : "text-blue-600";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className={`text-sm font-semibold ${textColor}`}>
          {currentWeightage.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{
            width: `${Math.min(currentWeightage, 100)}%`,
          }}
        />
      </div>
      {isOverflow && (
        <p className="text-red-600 text-xs mt-1 font-medium">
          Allocation exceeds 100% by {(currentWeightage - 100).toFixed(1)}%
        </p>
      )}
      {!isComplete && !isOverflow && (
        <p className="text-amber-600 text-xs mt-1 font-medium">
          Remaining allocation: {(100 - currentWeightage).toFixed(1)}%
        </p>
      )}
    </div>
  );
}
