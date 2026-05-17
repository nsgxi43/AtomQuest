"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";
import { GoalSheet } from "@/types";
import {
  ShieldAlert, AlertTriangle, Clock, CheckCircle2, XCircle,
  ChevronRight, X, Activity,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmployeeWithGoalSheet {
  id: string;
  name: string;
  email: string;
  goalSheets: GoalSheet[];
}

type EscalationType = "GOAL_SUBMISSION_DELAY" | "APPROVAL_PENDING" | "CHECKIN_MISSED" | "WEIGHTAGE_MISMATCH";
type EscalationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type EscalationStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

interface TimelineEvent { stage: string; label: string; timestamp: string; completed: boolean; }
interface EscalationRecord {
  id: string;
  type: EscalationType;
  severity: EscalationSeverity;
  status: EscalationStatus;
  issueSummary: string;
  detailText: string;
  daysPending: number;
  chainStage: string;
  escalatedTo: string;
  createdAt: string;
  employee: { id: string; name: string; email: string };
  manager: { id: string; name: string; email: string } | null;
  timeline: TimelineEvent[];
  complianceMeta: { ruleId: string; threshold: number; riskScore: number; category: string };
}

// ─── Escalation Helpers ───────────────────────────────────────────────────────
const SEVERITY_CFG: Record<EscalationSeverity, { label: string; classes: string; dot: string; row: string }> = {
  LOW:      { label: "LOW",      classes: "bg-gray-100 text-gray-700 border border-gray-200",        dot: "bg-gray-400",   row: "" },
  MEDIUM:   { label: "MEDIUM",   classes: "bg-amber-100 text-amber-800 border border-amber-200",     dot: "bg-amber-500",  row: "" },
  HIGH:     { label: "HIGH",     classes: "bg-orange-100 text-orange-800 border border-orange-200",  dot: "bg-orange-500", row: "bg-orange-50/30" },
  CRITICAL: { label: "CRITICAL", classes: "bg-red-100 text-red-800 border border-red-200 font-bold", dot: "bg-red-500",    row: "bg-red-50/30" },
};
const STATUS_CFG: Record<EscalationStatus, { label: string; classes: string; icon: React.ReactNode }> = {
  OPEN:         { label: "Open",         classes: "bg-red-50 text-red-700 border border-red-200",        icon: <XCircle className="w-3 h-3" /> },
  ACKNOWLEDGED: { label: "Acknowledged", classes: "bg-amber-50 text-amber-700 border border-amber-200",  icon: <Clock className="w-3 h-3" /> },
  RESOLVED:     { label: "Resolved",     classes: "bg-green-50 text-green-700 border border-green-200",  icon: <CheckCircle2 className="w-3 h-3" /> },
};
const TYPE_LABELS: Record<EscalationType, string> = {
  GOAL_SUBMISSION_DELAY: "Submission Delay",
  APPROVAL_PENDING:      "Approval Pending",
  CHECKIN_MISSED:        "Check-in Missed",
  WEIGHTAGE_MISMATCH:    "Weightage Mismatch",
};

function SeverityBadge({ severity }: { severity: EscalationSeverity }) {
  const cfg = SEVERITY_CFG[severity];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${severity === "CRITICAL" ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}
function EscStatusBadge({ status }: { status: EscalationStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Timeline Modal ───────────────────────────────────────────────────────────
function EscalationModal({ esc, onClose }: { esc: EscalationRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SeverityBadge severity={esc.severity} />
              <EscStatusBadge status={esc.status} />
            </div>
            <h2 className="text-base font-bold text-gray-900 mt-2">{esc.issueSummary}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{esc.employee.name} · {esc.complianceMeta.ruleId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5 bg-gray-50 border-b border-gray-100 text-sm">
          {[
            { label: "Category",     value: esc.complianceMeta.category },
            { label: "Risk Score",   value: `${esc.complianceMeta.riskScore}/100` },
            { label: "Days Pending", value: `${esc.daysPending}d` },
            { label: "Chain Stage",  value: esc.chainStage },
            { label: "Escalated To", value: esc.escalatedTo },
            { label: "Manager",      value: esc.manager?.name ?? "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
              <p className="font-semibold text-gray-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        <div className="px-5 pt-4 pb-2">
          <p className="text-sm text-gray-700 leading-relaxed">{esc.detailText}</p>
        </div>

        <div className="px-5 pt-3 pb-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Escalation Timeline</h3>
          <div className="space-y-0">
            {esc.timeline.map((ev, idx) => (
              <div key={ev.stage} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${ev.completed ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`}>
                    {ev.completed
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      : <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    }
                  </div>
                  {idx < esc.timeline.length - 1 && (
                    <div className={`w-0.5 h-6 ${ev.completed ? "bg-blue-200" : "bg-gray-200"}`} />
                  )}
                </div>
                <div className="pb-3">
                  <p className={`text-sm font-semibold ${ev.completed ? "text-gray-900" : "text-gray-400"}`}>{ev.label}</p>
                  <p className="text-xs text-gray-400">{new Date(ev.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManagerPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<EmployeeWithGoalSheet[]>([]);
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalationsLoading, setEscalationsLoading] = useState(true);
  const [selectedEsc, setSelectedEsc] = useState<EscalationRecord | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => { setEmployees(d); setLoading(false); })
      .catch(() => setLoading(false));

    fetch("/api/escalations")
      .then((r) => r.json())
      .then((d) => {
        setEscalations(Array.isArray(d.escalations) ? d.escalations : []);
        setEscalationsLoading(false);
      })
      .catch(() => setEscalationsLoading(false));
  }, []);

  const activeEsc = escalations.filter((e) => e.status !== "RESOLVED");
  const criticalEsc = escalations.filter((e) => e.severity === "CRITICAL");
  const slaBreaches = escalations.filter((e) => e.daysPending > 7);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Overview</h1>
          <p className="text-gray-600 mt-1">
            Manage goals for {employees.length} direct report(s)
          </p>
        </div>

        {/* Team Escalations — Governance KPI Row */}
        <Card className="border border-red-100 bg-red-50/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                Team Governance Monitor
              </h2>
              <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <Activity className="w-3 h-3" /> Live
              </span>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* KPI Mini Row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Active Violations", value: activeEsc.length, color: "text-red-600", bg: "bg-red-50 border-red-200" },
                { label: "Critical Issues",   value: criticalEsc.length, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
                { label: "SLA Breaches",      value: slaBreaches.length, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`rounded-xl border p-3 text-center ${bg}`}>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-600 mt-0.5 font-medium">{label}</p>
                </div>
              ))}
            </div>

            {/* Escalations Table */}
            {escalationsLoading ? (
              <div className="animate-pulse h-24 bg-gray-200 rounded-lg" />
            ) : activeEsc.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-700">No active governance violations in your team.</p>
                <p className="text-sm text-gray-500 mt-1">All workflows are within compliance thresholds.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["Employee", "Issue", "Type", "Severity", "Pending", "Stage", "Status", ""].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeEsc.map((esc) => {
                      const cfg = SEVERITY_CFG[esc.severity];
                      return (
                        <tr
                          key={esc.id}
                          onClick={() => setSelectedEsc(esc)}
                          className={`hover:bg-gray-50 cursor-pointer transition-colors ${cfg.row}`}
                        >
                          <td className="px-3 py-2.5">
                            <p className="font-semibold text-gray-900">{esc.employee.name}</p>
                            <p className="text-xs text-gray-400">{esc.employee.email}</p>
                          </td>
                          <td className="px-3 py-2.5 max-w-[180px]">
                            <p className="font-medium text-gray-800 truncate">{esc.issueSummary}</p>
                            <p className="text-xs text-gray-400">{esc.complianceMeta.ruleId}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                              {TYPE_LABELS[esc.type]}
                            </span>
                          </td>
                          <td className="px-3 py-2.5"><SeverityBadge severity={esc.severity} /></td>
                          <td className="px-3 py-2.5">
                            <span className={`font-bold ${esc.daysPending > 14 ? "text-red-600" : esc.daysPending > 7 ? "text-amber-600" : "text-gray-700"}`}>
                              {esc.daysPending}d
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-medium">{esc.chainStage}</span>
                          </td>
                          <td className="px-3 py-2.5"><EscStatusBadge status={esc.status} /></td>
                          <td className="px-3 py-2.5">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Direct Reports Table */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Direct Reports</h2>
          </CardHeader>
          <CardBody>
            <Table>
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Goal Sheet Status</Th>
                  <Th>Submitted Date</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {employees.map((emp) => {
                  const latestGoalSheet = emp.goalSheets?.[0];
                  return (
                    <Tr key={emp.id}>
                      <Td>{emp.name}</Td>
                      <Td>{emp.email}</Td>
                      <Td>
                        {latestGoalSheet ? (
                          <StatusBadge status={latestGoalSheet.status} type="goal-sheet" />
                        ) : (
                          <span className="text-gray-500">No goal sheet</span>
                        )}
                      </Td>
                      <Td>
                        {latestGoalSheet?.submittedAt
                          ? formatDate(latestGoalSheet.submittedAt)
                          : "-"}
                      </Td>
                      <Td>
                        {latestGoalSheet && (
                          <Link
                            href={`/manager/approve/${latestGoalSheet.id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Review
                          </Link>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {selectedEsc && (
        <EscalationModal esc={selectedEsc} onClose={() => setSelectedEsc(null)} />
      )}
    </>
  );
}
