"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?:
    | "draft"
    | "submitted"
    | "approved"
    | "returned"
    | "locked"
    | "not-started"
    | "on-track"
    | "completed";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "draft", children, className }: BadgeProps) {
  const variantStyles = {
    draft: "bg-gray-100 text-gray-800",
    submitted: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    returned: "bg-yellow-100 text-yellow-800",
    locked: "bg-purple-100 text-purple-800",
    "not-started": "bg-gray-100 text-gray-800",
    "on-track": "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full text-sm font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
