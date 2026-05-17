"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import {
  ShieldAlert, AlertTriangle, Clock, CheckCircle2, XCircle,
  ChevronRight, X, TrendingDown, Users, Activity,
} from "lucide-react";

// ─── Types (mirrored from API) ────────────────────────────────────────────────
type EscalationType = "GOAL_SUBMISSION_DELAY" | "APPROVAL_PENDING" | "CHECKIN_MISSED" | "WEIGHTAGE_MISMATCH";
type EscalationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type EscalationStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

interface TimelineEvent {
  stage: string;
  label: string;
  timestamp: string;
  completed: boolean;
}
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
interface EscalationApiResponse {
  escalations: EscalationRecord[];
  kpis: { totalActive: number; critical: number; pendingManagerActions: number; complianceScore: number };
  complianceMeta: { totalEmployees: number; submittedSheets: number; approvedSheets: number; lockedSheets: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<EscalationSeverity, { label: string; classes: string; dot: string }> = {
  LOW:      { label: "LOW",      classes: "bg-gray-100 text-gray-700 border border-gray-300",          dot: "bg-gray-400" },
  MEDIUM:   { label: "MEDIUM",   classes: "bg-amber-100 text-amber-800 border border-amber-300",        dot: "bg-amber-500" },
  HIGH:     { label: "HIGH",     classes: "bg-orange-100 text-orange-800 border border-orange-300",     dot: "bg-orange-500" },
  CRITICAL: { label: "CRITICAL", classes: "bg-red-100 text-red-800 border border-red-300 font-bold",   dot: "bg-red-500" },
};
const STATUS_CONFIG: Record<EscalationStatus, { label: string; classes: string; icon: React.ReactNode }> = {
  OPEN:         { label: "Open",         classes: "bg-red-50 text-red-700 border border-red-200",         icon: <XCircle className="w-3 h-3" /> },
  ACKNOWLEDGED: { label: "Acknowledged", classes: "bg-amber-50 text-amber-700 border border-amber-200",   icon: <Clock className="w-3 h-3" /> },
  RESOLVED:     { label: "Resolved",     classes: "bg-green-50 text-green-700 border border-green-200",   icon: <CheckCircle2 className="w-3 h-3" /> },
};
const TYPE_LABELS: Record<EscalationType, string> = {
  GOAL_SUBMISSION_DELAY: "Submission Delay",
  APPROVAL_PENDING:      "Approval Pending",
  CHECKIN_MISSED:        "Check-in Missed",
  WEIGHTAGE_MISMATCH:    "Weightage Mismatch",
};

function SeverityBadge({ severity }: { severity: EscalationSeverity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${severity === "CRITICAL" ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}
function StatusBadge({ status }: { status: EscalationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.classes}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Timeline Panel ───────────────────────────────────────────────────────────
function TimelinePanel({ esc, onClose }: { esc: EscalationRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SeverityBadge severity={esc.severity} />
              <StatusBadge status={esc.status} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-2">{esc.issueSummary}</h2>
            <p className="text-sm text-gray-500 mt-1">{esc.employee.name} · {esc.employee.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 p-6 bg-gray-50 border-b border-gray-100">
          {[
            { label: "Rule ID",       value: esc.complianceMeta.ruleId },
            { label: "Category",      value: esc.complianceMeta.category },
            { label: "Risk Score",    value: `${esc.complianceMeta.riskScore}/100` },
            { label: "Days Pending",  value: `${esc.daysPending} day${esc.daysPending !== 1 ? "s" : ""}` },
            { label: "Escalated To",  value: esc.escalatedTo },
            { label: "Chain Stage",   value: esc.chainStage },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Detail text */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-sm text-gray-700 leading-relaxed">{esc.detailText}</p>
        </div>

        {/* Timeline */}
        <div className="px-6 pt-4 pb-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Escalation Timeline</h3>
          <div className="space-y-0">
            {esc.timeline.map((event, idx) => (
              <div key={event.stage} className="flex gap-3">
                {/* Dot + line */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${event.completed ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`}>
                    {event.completed
                      ? <CheckCircle2 className="w-4 h-4 text-white" />
                      : <span className="w-2 h-2 rounded-full bg-gray-300" />
                    }
                  </div>
                  {idx < esc.timeline.length - 1 && (
                    <div className={`w-0.5 h-8 ${event.completed ? "bg-blue-200" : "bg-gray-200"}`} />
                  )}
                </div>
                {/* Content */}
                <div className="pb-4 min-w-0">
                  <p className={`text-sm font-semibold ${event.completed ? "text-gray-900" : "text-gray-400"}`}>
                    {event.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(event.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
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
export default function EscalationsPage() {
  const [data, setData] = useState<EscalationApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEsc, setSelectedEsc] = useState<EscalationRecord | null>(null);
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetch("/api/escalations")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-600" /> Governance &amp; Escalations
        </h1>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-gray-500">
        Failed to load escalation data. Please refresh the page.
      </div>
    );
  }

  const { escalations, kpis, complianceMeta } = data;

  const filtered = escalations.filter((e) => {
    if (filterSeverity && e.severity !== filterSeverity) return false;
    if (filterType && e.type !== filterType) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    return true;
  });

  const scoreColor =
    kpis.complianceScore >= 80 ? "text-emerald-600" :
    kpis.complianceScore >= 60 ? "text-amber-600" : "text-red-600";

  const scoreBarColor =
    kpis.complianceScore >= 80 ? "bg-emerald-500" :
    kpis.complianceScore >= 60 ? "bg-amber-500" : "bg-red-500";

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-red-600" />
              Governance &amp; Escalations
            </h1>
            <p className="text-gray-500 mt-1">
              Real-time rule-based compliance monitoring and escalation tracking for active cycles.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 bg-red-50 text-red-800 border border-red-200 px-3 py-1.5 rounded-md text-sm font-medium">
              <Activity className="w-4 h-4" />
              Live Governance Engine — {escalations.length} violation{escalations.length !== 1 ? "s" : ""} detected
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200">
            <CardBody className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-red-100 text-sm font-medium">Active Escalations</p>
                  <p className="text-4xl font-bold mt-1">{kpis.totalActive}</p>
                </div>
                <div className="bg-red-400/30 p-2 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-100" />
                </div>
              </div>
              <div className="mt-3 text-xs text-red-200">{complianceMeta.totalEmployees} employees monitored</div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-200">
            <CardBody className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Critical Issues</p>
                  <p className="text-4xl font-bold mt-1">{kpis.critical}</p>
                </div>
                <div className="bg-orange-400/30 p-2 rounded-lg">
                  <ShieldAlert className="w-6 h-6 text-orange-100" />
                </div>
              </div>
              <div className="mt-3 text-xs text-orange-200">Require immediate HR review</div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-200">
            <CardBody className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Pending Manager Actions</p>
                  <p className="text-4xl font-bold mt-1">{kpis.pendingManagerActions}</p>
                </div>
                <div className="bg-amber-400/30 p-2 rounded-lg">
                  <Users className="w-6 h-6 text-amber-100" />
                </div>
              </div>
              <div className="mt-3 text-xs text-amber-200">Approvals past SLA threshold</div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200">
            <CardBody className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Compliance Score</p>
                  <p className="text-4xl font-bold mt-1">{kpis.complianceScore}%</p>
                </div>
                <div className="bg-indigo-400/30 p-2 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-indigo-100" />
                </div>
              </div>
              <div className="mt-3">
                <div className="h-1.5 bg-indigo-400/40 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all" style={{ width: `${kpis.complianceScore}%` }} />
                </div>
                <div className="mt-1 text-xs text-indigo-200">Governance Health Index</div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Compliance Overview */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Compliance Overview
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Total Employees", value: complianceMeta.totalEmployees, color: "text-gray-900" },
                { label: "Sheets Submitted", value: complianceMeta.submittedSheets, color: "text-blue-600" },
                { label: "Sheets Approved", value: complianceMeta.approvedSheets, color: "text-green-600" },
                { label: "Sheets Locked", value: complianceMeta.lockedSheets, color: "text-indigo-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  <p className="text-sm text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Governance Compliance Score</span>
                <span className={`text-sm font-bold ${scoreColor}`}>{kpis.complianceScore}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${scoreBarColor}`} style={{ width: `${kpis.complianceScore}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Calculated from submission rate, approval rate, and active violation penalties.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Escalation Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Active Violations
                {filtered.length > 0 && (
                  <span className="ml-1 text-sm font-normal text-gray-500">({filtered.length})</span>
                )}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="text-sm py-1.5"
                >
                  <option value="">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </Select>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-sm py-1.5"
                >
                  <option value="">All Types</option>
                  <option value="GOAL_SUBMISSION_DELAY">Submission Delay</option>
                  <option value="APPROVAL_PENDING">Approval Pending</option>
                  <option value="CHECKIN_MISSED">Check-in Missed</option>
                  <option value="WEIGHTAGE_MISMATCH">Weightage Mismatch</option>
                </Select>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm py-1.5"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="ACKNOWLEDGED">Acknowledged</option>
                  <option value="RESOLVED">Resolved</option>
                </Select>
                {(filterSeverity || filterType || filterStatus) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setFilterSeverity(""); setFilterType(""); setFilterStatus(""); }}
                  >
                    <X className="w-3 h-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0 overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-700">No escalations found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {escalations.length > 0
                    ? "No escalations match the current filters."
                    : "All workflows are compliant. No governance violations detected."}
                </p>
              </div>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Employee</Th>
                    <Th>Issue</Th>
                    <Th>Type</Th>
                    <Th>Severity</Th>
                    <Th>Escalated To</Th>
                    <Th>Days Pending</Th>
                    <Th>Status</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filtered.map((esc) => (
                    <Tr
                      key={esc.id}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${esc.severity === "CRITICAL" ? "bg-red-50/30" : ""}`}
                      onClick={() => setSelectedEsc(esc)}
                    >
                      <Td>
                        <div>
                          <p className="font-semibold text-gray-900">{esc.employee.name}</p>
                          <p className="text-xs text-gray-500">{esc.employee.email}</p>
                        </div>
                      </Td>
                      <Td>
                        <p className="font-medium text-gray-900 max-w-xs">{esc.issueSummary}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{esc.complianceMeta.ruleId}</p>
                      </Td>
                      <Td>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                          {TYPE_LABELS[esc.type]}
                        </span>
                      </Td>
                      <Td><SeverityBadge severity={esc.severity} /></Td>
                      <Td>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{esc.escalatedTo}</p>
                          <p className="text-xs text-gray-400">{esc.chainStage} stage</p>
                        </div>
                      </Td>
                      <Td>
                        <span className={`font-bold text-sm ${esc.daysPending > 14 ? "text-red-600" : esc.daysPending > 7 ? "text-amber-600" : "text-gray-700"}`}>
                          {esc.daysPending}d
                        </span>
                      </Td>
                      <Td><StatusBadge status={esc.status} /></Td>
                      <Td>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Timeline Slide-over */}
      {selectedEsc && (
        <TimelinePanel esc={selectedEsc} onClose={() => setSelectedEsc(null)} />
      )}
    </>
  );
}
