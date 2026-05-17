import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type GoalProgress = {
  score: number;
  status: "NOT_STARTED" | "DELAYED" | "AT_RISK" | "ON_TRACK" | "COMPLETED";
  lateCompletion?: boolean;
};

export function calculateGoalProgress(
  uom: "NUMERIC_MIN" | "NUMERIC_MAX" | "TIMELINE" | "ZERO" | string,
  target: string,
  actual: string | null | undefined
): GoalProgress {
  if (!actual || actual.trim() === "") {
    if (uom === "TIMELINE") {
      const targetDate = new Date(target);
      const today = new Date();
      if (isNaN(targetDate.getTime())) return { score: 0, status: "NOT_STARTED" };
      
      const diffMs = targetDate.getTime() - today.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      if (diffDays < 0) {
        return { score: 0, status: "DELAYED" };
      }
      if (diffDays <= 14) {
        return { score: 0, status: "AT_RISK" };
      }
      return { score: 0, status: "ON_TRACK" };
    }
    return { score: 0, status: "NOT_STARTED" };
  }

  switch (uom) {
    case "NUMERIC_MAX": {
      const actualNum = parseFloat(actual);
      const targetNum = parseFloat(target);
      if (isNaN(actualNum) || isNaN(targetNum) || targetNum === 0) return { score: 0, status: "NOT_STARTED" };
      const score = Math.max(0, Math.min((actualNum / targetNum) * 100, 100));
      return { score, status: getNumericStatus(score) };
    }
    case "NUMERIC_MIN": {
      const actualNum = parseFloat(actual);
      const targetNum = parseFloat(target);
      if (isNaN(actualNum) || isNaN(targetNum) || actualNum === 0) return { score: 0, status: "NOT_STARTED" };
      const score = Math.max(0, Math.min((targetNum / actualNum) * 100, 100));
      return { score, status: getNumericStatus(score) };
    }
    case "TIMELINE": {
      const actualDate = new Date(actual);
      const targetDate = new Date(target);
      if (isNaN(actualDate.getTime()) || isNaN(targetDate.getTime())) return { score: 0, status: "NOT_STARTED" };
      if (actualDate <= targetDate) {
        return { score: 100, status: "COMPLETED" };
      } else {
        return { score: 100, status: "COMPLETED", lateCompletion: true };
      }
    }
    case "ZERO": {
      const actualNum = parseFloat(actual);
      if (!isNaN(actualNum)) {
        if (actualNum === 0) {
          return { score: 100, status: "COMPLETED" };
        } else {
          return { score: 0, status: "DELAYED" };
        }
      }
      return { score: 0, status: "NOT_STARTED" };
    }
    default:
      return { score: 0, status: "NOT_STARTED" };
  }
}

function getNumericStatus(score: number): "DELAYED" | "AT_RISK" | "ON_TRACK" | "COMPLETED" {
  if (score >= 100) return "COMPLETED";
  if (score >= 80) return "ON_TRACK";
  if (score >= 40) return "AT_RISK";
  return "DELAYED";
}

export function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    return format(new Date(date), "dd MMM yyyy");
  }
  return format(date, "dd MMM yyyy");
}

export function deriveStatusFromScore(
  score: number,
  uom: "NUMERIC_MIN" | "NUMERIC_MAX" | "TIMELINE" | "ZERO",
  actual: string | null | undefined
): "NOT_STARTED" | "DELAYED" | "AT_RISK" | "ON_TRACK" | "COMPLETED" {
  if (!actual || actual.trim() === "") return "NOT_STARTED";

  if (uom === "ZERO") {
    return score === 100 ? "COMPLETED" : "DELAYED";
  }

  if (score === 100) return "COMPLETED";
  if (score >= 80) return "ON_TRACK";
  if (score >= 40) return "AT_RISK";
  return "DELAYED";
}
