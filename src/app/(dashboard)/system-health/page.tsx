"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Shield, Mail, Database, Zap, CheckCircle2, XCircle,
  AlertTriangle, Loader2, RefreshCw, Users, FileText,
  ClipboardList, Lock,
} from "lucide-react";

interface HealthData {
  auth: {
    seededAccountsActive: boolean;
    rbacEnabled: boolean;
    jwtStrategy: string;
    authProvider: string;
  };
  smtp: {
    connected: boolean;
    configured: boolean;
    error: string | null;
    recentLogs: Array<{ id: string; toEmail: string; eventType: string; status: string; sentAt: string; error?: string }>;
  };
  governance: {
    escalationEngineActive: boolean;
    notificationEngineActive: boolean;
    auditLoggingActive: boolean;
    auditLogCount: number;
    totalGoalSheets: number;
  };
  database: {
    totalUsers: number;
    orphanEmployees: number;
    managersWithoutNotifEmail: number;
    pendingGoalSheets: number;
  };
}

function StatusIcon({ ok, warn }: { ok: boolean; warn?: boolean }) {
  if (ok) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (warn) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
}

function Row({ label, value, ok, warn, mono }: { label: string; value: string; ok?: boolean; warn?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        {ok !== undefined && <StatusIcon ok={ok} warn={warn} />}
        <span className={`text-sm font-semibold ${mono ? "font-mono" : ""} ${ok === false ? "text-red-600" : ok === true ? "text-emerald-700" : warn ? "text-amber-700" : "text-gray-900"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className={`flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 ${color}`}>
        <Icon className="w-4 h-4" />
        <h2 className="text-sm font-bold tracking-wide">{title}</h2>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

export default function SystemHealthPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [data, setData]     = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const fetchHealth = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/system-health");
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error((await res.json()).error);
      setData(await res.json());
    } catch (e: any) { setError(e.message ?? "Failed to load health data"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (sessionStatus === "unauthenticated") { router.push("/login"); return; }
    if (sessionStatus === "authenticated") {
      if ((session?.user as any)?.role !== "ADMIN") { router.push("/"); return; }
      fetchHealth();
    }
  }, [sessionStatus]);

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        <span className="text-gray-600 text-sm">Running governance health checks…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold">{error}</p>
          <button onClick={fetchHealth} className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const overallOk = data.smtp.connected && data.database.orphanEmployees === 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-500 text-sm mt-0.5">Enterprise governance platform operational status</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${overallOk ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${overallOk ? "bg-emerald-500" : "bg-amber-500"}`} />
            {overallOk ? "Operational" : "Attention Required"}
          </div>
          <button onClick={fetchHealth} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Auth Status */}
        <Section icon={Shield} title="AUTH STATUS" color="text-indigo-700 bg-indigo-50">
          <Row label="Seeded demo accounts" value="Active" ok={data.auth.seededAccountsActive} />
          <Row label="RBAC enforcement" value="Enabled" ok={data.auth.rbacEnabled} />
          <Row label="Session strategy" value={data.auth.jwtStrategy} mono />
          <Row label="Auth provider" value={data.auth.authProvider} />
        </Section>

        {/* SMTP Status */}
        <Section icon={Mail} title="SMTP STATUS" color={data.smtp.connected ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"}>
          <Row label="SMTP credentials" value={data.smtp.configured ? "Configured" : "Missing"} ok={data.smtp.configured} />
          <Row label="SMTP connectivity" value={data.smtp.connected ? "Connected" : "Disconnected"} ok={data.smtp.connected} />
          {data.smtp.error && (
            <Row label="Error" value={data.smtp.error} ok={false} mono />
          )}
          <div className="py-2">
            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Recent delivery log</p>
            {data.smtp.recentLogs.length === 0 ? (
              <p className="text-xs text-gray-400">No emails sent yet</p>
            ) : data.smtp.recentLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-600 truncate max-w-[180px]">{log.eventType}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.status === "SENT" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Governance Status */}
        <Section icon={Zap} title="GOVERNANCE STATUS" color="text-violet-700 bg-violet-50">
          <Row label="Escalation engine" value="Active" ok={data.governance.escalationEngineActive} />
          <Row label="Notification engine" value="Active" ok={data.governance.notificationEngineActive} />
          <Row label="Audit logging" value="Active" ok={data.governance.auditLoggingActive} />
          <Row label="Total audit events" value={data.governance.auditLogCount.toString()} mono />
          <Row label="Total goal sheets" value={data.governance.totalGoalSheets.toString()} mono />
        </Section>

        {/* Database / Hierarchy Status */}
        <Section icon={Database} title="DATABASE STATUS" color={data.database.orphanEmployees > 0 ? "text-amber-700 bg-amber-50" : "text-blue-700 bg-blue-50"}>
          <Row label="Total users" value={data.database.totalUsers.toString()} mono />
          <Row
            label="Employees without manager"
            value={data.database.orphanEmployees.toString()}
            ok={data.database.orphanEmployees === 0}
            warn={data.database.orphanEmployees > 0}
          />
          <Row
            label="Managers without notification email"
            value={data.database.managersWithoutNotifEmail.toString()}
            ok={data.database.managersWithoutNotifEmail === 0}
            warn={data.database.managersWithoutNotifEmail > 0}
          />
          <Row
            label="Pending governance items"
            value={data.database.pendingGoalSheets.toString()}
            ok={data.database.pendingGoalSheets === 0}
            warn={data.database.pendingGoalSheets > 0}
          />
        </Section>
      </div>

      {/* Warnings */}
      {(data.database.orphanEmployees > 0 || !data.smtp.connected) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Governance Integrity Warnings
          </p>
          {data.database.orphanEmployees > 0 && (
            <p className="text-xs text-amber-700">
              ⚠ <strong>{data.database.orphanEmployees}</strong> employee(s) have no reporting manager assigned.
              These users will not receive proper notification routing or escalation coverage.
              Ask them to re-register or manually assign a manager.
            </p>
          )}
          {!data.smtp.connected && (
            <p className="text-xs text-amber-700">
              ⚠ SMTP is not connected: <code className="bg-amber-100 px-1 rounded">{data.smtp.error}</code>.
              Governance email notifications are paused. Configure <code className="bg-amber-100 px-1 rounded">SMTP_EMAIL</code> and{" "}
              <code className="bg-amber-100 px-1 rounded">SMTP_PASSWORD</code> in your environment.
            </p>
          )}
        </div>
      )}

      <p className="text-center text-[11px] text-gray-400 pb-2">
        AtomQuest · Enterprise Governance · System Health · Admin Only
      </p>
    </div>
  );
}
