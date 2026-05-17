export interface User {
  id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "MANAGER" | "ADMIN";
  managerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  goalSheetId: string;
  thrustArea: string;
  title: string;
  description?: string | null;
  uom: "NUMERIC_MIN" | "NUMERIC_MAX" | "TIMELINE" | "ZERO";
  target: string;
  weightage: number;
  isShared: boolean;
  sharedFromId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalSheet {
  id: string;
  employeeId: string;
  cycleYear: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "RETURNED" | "LOCKED";
  submittedAt?: Date | null;
  approvedAt?: Date | null;
  lockedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuarterlyUpdate {
  id: string;
  goalId: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  actualAchievement?: string | null;
  status: "NOT_STARTED" | "ON_TRACK" | "COMPLETED";
  computedScore?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckinComment {
  id: string;
  goalSheetId: string;
  managerId: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  comment: string;
  createdAt: Date;
}

export interface SharedGoal {
  id: string;
  createdById: string;
  title: string;
  thrustArea: string;
  target: string;
  uom: "NUMERIC_MIN" | "NUMERIC_MAX" | "TIMELINE" | "ZERO";
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  changedById: string;
  changeDescription: string;
  oldValue?: string | null;
  newValue?: string | null;
  changedAt: Date;
}
