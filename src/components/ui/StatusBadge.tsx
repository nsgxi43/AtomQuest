"use client";

import { Badge } from "./Badge";

interface StatusBadgeProps {
  status: string;
  type?: "goal-sheet" | "update";
}

export function StatusBadge({ status, type = "goal-sheet" }: StatusBadgeProps) {
  const goalSheetStatusMap = {
    DRAFT: { label: "Draft", variant: "draft" as const },
    SUBMITTED: { label: "Submitted", variant: "submitted" as const },
    APPROVED: { label: "Approved", variant: "approved" as const },
    RETURNED: { label: "Returned", variant: "returned" as const },
    LOCKED: { label: "Locked", variant: "locked" as const },
  };

  const updateStatusMap = {
    NOT_STARTED: { label: "Not Started", variant: "not-started" as const },
    ON_TRACK: { label: "On Track", variant: "on-track" as const },
    COMPLETED: { label: "Completed", variant: "completed" as const },
  };

  const statusMap =
    type === "goal-sheet"
      ? goalSheetStatusMap
      : updateStatusMap;

  const mappedStatus =
    statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: "draft" as const,
    };

  return <Badge variant={mappedStatus.variant}>{mappedStatus.label}</Badge>;
}
