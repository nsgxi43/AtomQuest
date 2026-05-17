"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput } from "@/lib/validations";
import {
  AlertCircle, X, ChevronRight, Loader2,
  Shield, Users, CheckCircle2, Lock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SSOUser {
  id: string; name: string; email: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  initials: string; avatarColor: string;
  reportsTo: { name: string; email: string } | null;
}
const ROLE_ROUTE: Record<string, string> = {
  ADMIN: "/admin", MANAGER: "/manager", EMPLOYEE: "/employee",
};

// ─── SVG Area Chart ───────────────────────────────────────────────────────────
function AreaChart() {
  const pts = [28, 42, 35, 58, 50, 65, 60, 74, 70, 78, 76, 82];
  const W = 360; const H = 60;
  const toX = (i: number) => (i / (pts.length - 1)) * W;
  const toY = (v: number) => H - (v / 100) * H;
  const line = pts.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#cg)" />
      <path d={line} fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={toX(pts.length - 1)} cy={toY(pts[pts.length - 1])} r="3.5" fill="#818cf8" stroke="#1e1b4b" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Left Governance Showcase ─────────────────────────────────────────────────
function LeftPanel() {
  const team = [
    { name: "Engineering", pct: 88, color: "#818cf8" },
    { name: "Product",     pct: 74, color: "#38bdf8" },
    { name: "Operations",  pct: 62, color: "#34d399" },
  ];

  return (
    <div className="flex flex-col justify-center h-full px-8 xl:px-12 py-10">
      <div className="w-full max-w-[520px]">
        {/* Brand */}
        <div className="mb-8">
          <h1 className="text-5xl font-extrabold text-white tracking-tight leading-none mb-3">
            AtomQuest
          </h1>
          <p className="text-slate-300 text-base font-semibold mb-3 tracking-wide">
            Enterprise Performance Governance
          </p>
          <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
            Unified goal management, compliance tracking, manager approvals, quarterly reviews, and escalation workflows.
          </p>
        </div>

        {/* Hero Panel */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {/* Panel chrome */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8 bg-white/3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            <span className="text-slate-500 text-[11px] ml-2">Governance Dashboard · FY 2025</span>
            <div className="ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-600 text-[10px]">Live</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Top stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Compliance", value: "84%",  sub: "Good standing",   bar: 84,   barColor: "bg-emerald-500" },
                { label: "Approvals",  value: "8/11",  sub: "73% complete",    bar: 73,   barColor: "bg-indigo-400" },
                { label: "Escalations",value: "3",     sub: "Open",            bar: null, tag: "orange" },
              ].map(s => (
                <div key={s.label} className="bg-slate-800/60 rounded-xl p-3.5">
                  <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider mb-1.5">{s.label}</p>
                  <p className="text-white text-xl font-bold leading-none">{s.value}</p>
                  {s.bar !== null && (
                    <div className="h-1 bg-slate-700 rounded-full mt-2.5 overflow-hidden">
                      <div className={`h-full ${s.barColor} rounded-full`} style={{ width: `${s.bar}%` }} />
                    </div>
                  )}
                  {s.tag === "orange" && (
                    <div className="mt-2.5">
                      <span className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded font-medium">
                        Pending review
                      </span>
                    </div>
                  )}
                  <p className="text-slate-600 text-[10px] mt-1.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Trend chart */}
            <div className="bg-slate-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-[11px] font-medium">Performance Trend</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-indigo-400 text-[11px] font-semibold">82%</span>
                  <span className="text-emerald-400 text-[10px]">↑ +6pp</span>
                </div>
              </div>
              <div className="h-[60px]">
                <AreaChart />
              </div>
              <div className="flex justify-between mt-2">
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => (
                  <span key={m} className="text-[9px] text-slate-700">{m}</span>
                ))}
              </div>
            </div>

            {/* Team bars */}
            <div className="bg-slate-800/60 rounded-xl p-4">
              <p className="text-slate-400 text-[11px] font-medium mb-3">Team Completion</p>
              <div className="space-y-2.5">
                {team.map(t => (
                  <div key={t.name} className="flex items-center gap-3">
                    <span className="text-slate-500 text-[11px] w-[76px] flex-shrink-0">{t.name}</span>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${t.pct}%`, backgroundColor: t.color }} />
                    </div>
                    <span className="text-slate-400 text-[11px] w-7 text-right tabular-nums font-medium">{t.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom pills */}
        <div className="flex items-center gap-2 mt-5 flex-wrap">
          {["9 Employees", "84% Compliant", "3 Escalations"].map(l => (
            <span key={l} className="text-[11px] text-slate-500 px-2.5 py-1 rounded-md border border-slate-700/60 bg-slate-800/30">
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Account Picker Modal ─────────────────────────────────────────────────────
function AccountPicker({ onClose, onPick }: {
  onClose: () => void; onPick: (u: SSOUser) => void;
}) {
  const [users, setUsers] = useState<SSOUser[]>([]);
  const [busy, setBusy] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/sso-directory").then(r => r.json())
      .then(d => { setUsers(Array.isArray(d) ? d : []); setBusy(false); })
      .catch(() => setBusy(false));
  }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const roleBadge: Record<string, string> = {
    ADMIN: "bg-violet-100 text-violet-700",
    MANAGER: "bg-blue-100 text-blue-700",
    EMPLOYEE: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div ref={ref} onClick={e => { if (e.target === ref.current) onClose(); }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="grid grid-cols-2 gap-0.5 w-5 h-5 flex-shrink-0">
              <div className="bg-[#f25022] rounded-[1px]" /><div className="bg-[#7fba00] rounded-[1px]" />
              <div className="bg-[#00a4ef] rounded-[1px]" /><div className="bg-[#ffb900] rounded-[1px]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Microsoft Entra ID</p>
              <p className="text-xs text-gray-500">Choose an account to continue</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "380px" }}>
          {busy
            ? <div className="flex items-center justify-center py-10 gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading directory…</span>
              </div>
            : users.map(u => (
              <button key={u.id} onClick={() => onPick(u)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left group border-b border-gray-100 last:border-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                  style={{ backgroundColor: u.avatarColor }}>{u.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{u.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${roleBadge[u.role] ?? "bg-gray-100 text-gray-700"}`}>
                      {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  {u.reportsTo && <p className="text-[10px] text-gray-400 mt-0.5">Reports to {u.reportsTo.name}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
              </button>
            ))
          }
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-mono">
            {users[0]?.email.split("@")[1] ?? "corp.atomquest.io"} · Microsoft Entra ID
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoUser, setSsoUser] = useState<SSOUser | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } =
    useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  const autofill = (email: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", "password123", { shouldValidate: true });
  };

  const onSubmit = async (data: LoginInput) => {
    setFormLoading(true); setError("");
    try {
      const res = await signIn("credentials", { email: data.email, password: data.password, redirect: false });
      if (res?.error) { setError("Invalid email or password."); return; }
      if (res?.ok) {
        const s = await fetch("/api/auth/session").then(r => r.json());
        router.push(ROLE_ROUTE[(s?.user as any)?.role] ?? "/employee");
      }
    } catch { setError("An error occurred. Please try again."); }
    finally { setFormLoading(false); }
  };

  const handlePickUser = async (user: SSOUser) => {
    setShowPicker(false); setSsoUser(user); setSsoLoading(true);
    try {
      const res = await signIn("credentials", { email: user.email, password: "password123", redirect: false });
      if (res?.error) { setError("SSO sign-in failed."); setSsoLoading(false); setSsoUser(null); return; }
      await new Promise(r => setTimeout(r, 700));
      router.push(ROLE_ROUTE[user.role] ?? "/employee");
    } catch { setError("An unexpected error occurred."); setSsoLoading(false); setSsoUser(null); }
  };

  // SSO loading
  if (ssoLoading && ssoUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-base font-bold text-white"
            style={{ backgroundColor: ssoUser.avatarColor }}>{ssoUser.initials}</div>
          <p className="text-gray-200 font-semibold">{ssoUser.name}</p>
          <p className="text-gray-500 text-sm mt-0.5">{ssoUser.email}</p>
          <div className="flex items-center justify-center gap-2 mt-5 text-gray-500 text-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Signing in…
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/*
        Composition: full-page bg-slate-950, then a centered max-w shell.
        The shell itself is split dark-left / light-right via bg classes on each col.
        This eliminates the full-bleed stretch and dead space on wide monitors.
      */}
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 lg:p-6 xl:p-10">

        {/* ── Centered shell ── */}
        <div className="w-full max-w-[1320px] min-h-screen lg:min-h-0 flex flex-col lg:flex-row lg:rounded-2xl overflow-hidden shadow-2xl shadow-black/60">

          {/* LEFT — dark showcase */}
          <div className="hidden lg:flex lg:w-[58%] flex-shrink-0 bg-slate-950 border-r border-slate-800/80">
            <LeftPanel />
          </div>

          {/* RIGHT — light auth panel */}
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 px-6 py-10 lg:px-10 xl:px-14 min-h-screen lg:min-h-0">
            <div className="w-full max-w-[380px]">

              {/* Mobile brand (hidden on desktop) */}
              <div className="lg:hidden text-center mb-8">
                <p className="text-xl font-bold text-gray-900">AtomQuest</p>
                <p className="text-gray-500 text-sm mt-0.5">Enterprise Performance Governance</p>
              </div>

              {/* Login card */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-lg shadow-gray-200/60 px-8 py-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                  <p className="text-gray-500 text-sm mt-1.5">Sign in to your enterprise workspace.</p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
                  </div>
                )}

                {/* Microsoft Entra ID SSO */}
                <button onClick={() => setShowPicker(true)}
                  className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition-all duration-150 hover:shadow-sm text-sm mb-4">
                  <div className="grid grid-cols-2 gap-[2px] w-4 h-4 flex-shrink-0">
                    <div className="bg-[#f25022] rounded-[1px]" /><div className="bg-[#7fba00] rounded-[1px]" />
                    <div className="bg-[#00a4ef] rounded-[1px]" /><div className="bg-[#ffb900] rounded-[1px]" />
                  </div>
                  Continue with Microsoft Entra ID
                </button>

                <div className="relative flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Credentials form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                    <input type="email" placeholder="you@corp.io" {...register("email")}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                    <input type="password" placeholder="••••••••" {...register("password")}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                  </div>
                  <button type="submit" disabled={formLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all duration-150 text-sm hover:shadow-md hover:shadow-indigo-500/25 mt-1">
                    {formLoading
                      ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Signing in…</span>
                      : "Sign in"
                    }
                  </button>
                </form>
              </div>

              {/* Trust chips */}
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                {[
                  { icon: Shield,       label: "SSO Enabled"    },
                  { icon: Lock,         label: "RBAC Protected" },
                  { icon: CheckCircle2, label: "SOC2 Ready"     },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-full shadow-sm">
                    <Icon className="w-3 h-3 text-gray-400" />{label}
                  </span>
                ))}
              </div>

              {/* Demo access */}
              <div className="mt-4 bg-white border border-gray-200 rounded-xl px-4 py-3.5 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Demo Access</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: "Admin",    email: "admin@demo.com",   color: "text-violet-700 bg-violet-50 border-violet-200 hover:bg-violet-100"     },
                    { role: "Manager",  email: "manager@demo.com", color: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"              },
                    { role: "Employee", email: "priya@demo.com",   color: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"  },
                  ].map(({ role, email, color }) => (
                    <button key={role} onClick={() => autofill(email)}
                      className={`text-[11px] font-semibold py-2 rounded-lg border transition-all ${color}`}>
                      {role}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2.5 text-center">
                  Click to autofill · password: <span className="font-mono font-bold text-gray-500">password123</span>
                </p>
              </div>

              <p className="text-center text-gray-400 text-[11px] mt-4">
                AtomQuest · Enterprise Edition · FY 2025
              </p>
            </div>
          </div>
        </div>
      </div>

      {showPicker && (
        <AccountPicker onClose={() => setShowPicker(false)} onPick={handlePickUser} />
      )}
    </>
  );
}
