export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export interface QuarterInfo {
  id: Quarter;
  name: string;
  openMonth: number; // 0-indexed month when it opens
}

export const QUARTERS_INFO: QuarterInfo[] = [
  { id: "Q1", name: "Q1", openMonth: 6 }, // July
  { id: "Q2", name: "Q2", openMonth: 9 }, // October
  { id: "Q3", name: "Q3", openMonth: 0 }, // January
  { id: "Q4", name: "Q4", openMonth: 2 }, // March
];

export interface CycleStatus {
  activeQuarter: Quarter | null;
  isGoalSettingOpen: boolean;
  message: string;
}

export function getQuarterInfo(q: Quarter) {
  return QUARTERS_INFO.find((info) => info.id === q)!;
}

export function getQuarterState(
  q: Quarter,
  currentDate = new Date()
): "LOCKED_FUTURE" | "ACTIVE" | "LOCKED_PAST" {
  const currentMonth = currentDate.getMonth();

  // Map months to a logical cycle starting from May (4) -> 0
  const getLogicalMonth = (m: number) => (m >= 4 ? m - 4 : m + 8);
  const currentLogical = getLogicalMonth(currentMonth);
  const targetLogical = getLogicalMonth(getQuarterInfo(q).openMonth);

  let activeQuarter: Quarter | null = null;
  if (currentLogical >= getLogicalMonth(6) && currentLogical < getLogicalMonth(9))
    activeQuarter = "Q1";
  else if (currentLogical >= getLogicalMonth(9) && currentLogical < getLogicalMonth(0))
    activeQuarter = "Q2";
  else if (currentLogical >= getLogicalMonth(0) && currentLogical < getLogicalMonth(2))
    activeQuarter = "Q3";
  else if (currentLogical >= getLogicalMonth(2) && currentLogical < getLogicalMonth(4))
    activeQuarter = "Q4";

  if (activeQuarter === q) return "ACTIVE";

  // Determine if it's past or future
  // If we have an active quarter, compare target to active's logical month
  // If there's no active quarter (e.g. May/June), compare target to current logical month
  const activeLogical = activeQuarter
    ? getLogicalMonth(getQuarterInfo(activeQuarter).openMonth)
    : currentLogical;

  if (targetLogical > activeLogical) return "LOCKED_FUTURE";
  return "LOCKED_PAST";
}

export function getCycleStatus(currentDate = new Date()): CycleStatus {
  const currentMonth = currentDate.getMonth();
  const getLogicalMonth = (m: number) => (m >= 4 ? m - 4 : m + 8);
  const currentLogical = getLogicalMonth(currentMonth);

  let activeQuarter: Quarter | null = null;
  if (currentLogical >= getLogicalMonth(6) && currentLogical < getLogicalMonth(9))
    activeQuarter = "Q1";
  else if (currentLogical >= getLogicalMonth(9) && currentLogical < getLogicalMonth(0))
    activeQuarter = "Q2";
  else if (currentLogical >= getLogicalMonth(0) && currentLogical < getLogicalMonth(2))
    activeQuarter = "Q3";
  else if (currentLogical >= getLogicalMonth(2) && currentLogical < getLogicalMonth(4))
    activeQuarter = "Q4";

  let message = "No active quarter.";
  if (activeQuarter) {
    message = `Current active window: ${activeQuarter}`;
  } else {
    message = "No active quarter. Q1 check-in opens in July.";
  }

  return { activeQuarter, isGoalSettingOpen: true, message };
}

export function getQuarterMessage(q: Quarter, currentDate = new Date()): string {
  const state = getQuarterState(q, currentDate);
  if (state === "ACTIVE") return `Current active window: ${q}`;
  if (state === "LOCKED_PAST") return `${q} is historical and read-only.`;

  const monthNames = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December",
  ];
  const openMonthName = monthNames[getQuarterInfo(q).openMonth];
  return `${q} editing opens in ${openMonthName}.`;
}

export function canOverrideQuarterLock(role?: string): boolean {
  return role === "ADMIN";
}

export function canEditQuarter(
  quarter: Quarter | string,
  role?: string,
  currentDate = new Date()
): boolean {
  if (canOverrideQuarterLock(role)) return true;
  return getQuarterState(quarter as Quarter, currentDate) === "ACTIVE";
}
