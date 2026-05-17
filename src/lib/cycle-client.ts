// src/lib/cycle-client.ts

export function getEffectiveDateFromQuarter(demoQuarter: string | null | undefined): Date {
  const d = new Date();
  if (demoQuarter === "Q1") d.setMonth(6); // July
  else if (demoQuarter === "Q2") d.setMonth(9); // October
  else if (demoQuarter === "Q3") d.setMonth(0); // January
  else if (demoQuarter === "Q4") d.setMonth(2); // March
  return d;
}

export function getEffectiveDateClient(): Date {
  if (typeof window === "undefined") return new Date();
  const match = document.cookie.match(/(?:^|; )demo_quarter=([^;]*)/);
  const demoQuarter = match ? decodeURIComponent(match[1]) : null;
  return getEffectiveDateFromQuarter(demoQuarter);
}
