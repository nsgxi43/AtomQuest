"use client";

import { Badge } from "./Badge";

type BadgeVariant =
  | "draft"
  | "submitted"
  | "approved"
  | "returned"
  | "locked"
  | "not-started"
  | "on-track"
  | "completed";

interface StatusEntry {
  label: string;
  variant: BadgeVariant;
}

interface StatusBadgeProps {
  status: string;
  type?: "goal-sheet" | "update";
}

const goalSheetStatusMap: Record<string, StatusEntry> = {
  DRAFT: { label: "Draft", variant: "draft" },
  SUBMITTED: { label: "Submitted", variant: "submitted" },
  APPROVED: { label: "Approved", variant: "approved" },
  RETURNED: { label: "Returned", variant: "returned" },
  LOCKED: { label: "Locked", variant: "locked" },
};

const updateStatusMap: Record<string, StatusEntry> = {
  NOT_STARTED: { label: "Not Started", variant: "not-started" },
  ON_TRACK: { label: "On Track", variant: "on-track" },
  COMPLETED: { label: "Completed", variant: "completed" },
};

export function StatusBadge({ status, type = "goal-sheet" }: StatusBadgeProps) {
  const statusMap = type === "goal-sheet" ? goalSheetStatusMap : updateStatusMap;

  const mappedStatus: StatusEntry = statusMap[status] ?? {
    label: status,
    variant: "draft",
  };

  return <Badge variant={mappedStatus.variant}>{mappedStatus.label}</Badge>;
}
