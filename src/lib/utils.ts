import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function computeScore(
  uom: "NUMERIC_MIN" | "NUMERIC_MAX" | "TIMELINE" | "ZERO",
  target: string,
  actual: string | null | undefined
): number {
  if (!actual) return 0;

  switch (uom) {
    case "NUMERIC_MIN": {
      const actualNum = parseFloat(actual);
      const targetNum = parseFloat(target);
      if (targetNum === 0) return 0;
      const score = (actualNum / targetNum) * 100;
      return Math.min(score, 100);
    }

    case "NUMERIC_MAX": {
      const actualNum = parseFloat(actual);
      const targetNum = parseFloat(target);
      if (actualNum === 0) return 0;
      const score = (targetNum / actualNum) * 100;
      return Math.min(score, 100);
    }

    case "TIMELINE": {
      // Assuming target and actual are dates in ISO format
      const targetDate = new Date(target);
      const actualDate = new Date(actual);
      return actualDate <= targetDate ? 100 : 0;
    }

    case "ZERO": {
      return actual === "0" ? 100 : 0;
    }

    default:
      return 0;
  }
}

export function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    return format(new Date(date), "dd MMM yyyy");
  }
  return format(date, "dd MMM yyyy");
}
