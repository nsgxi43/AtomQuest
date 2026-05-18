"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema, RegisterInput } from "@/lib/validations";
import { AlertCircle, CheckCircle2, Loader2, Shield, Lock, Users, Building2, ChevronDown } from "lucide-react";
import Link from "next/link";

const DEPARTMENTS = [
  "Product Engineering", "Operations", "QA Automation",
  "Sales", "Human Resources", "Marketing", "Finance",
  "Customer Success", "Legal & Compliance", "IT Infrastructure",
];

interface Manager { id: string; name: string; email: string; department: string | null; }

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [managers, setManagers]       = useState<Manager[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } =
    useForm<RegisterInput>({ resolver: zodResolver(RegisterSchema), defaultValues: { role: "EMPLOYEE" } });

  const selectedRole = useWatch({ control, name: "role" });

  // Fetch managers when role = EMPLOYEE
  useEffect(() => {
    if (selectedRole !== "EMPLOYEE") return;
    setManagersLoading(true);
    fetch("/api/managers")
      .then(r => r.json())
      .then(data => setManagers(Array.isArray(data) ? data : []))
      .catch(() => setManagers([]))
      .finally(() => setManagersLoading(false));
  }, [selectedRole]);

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true); setServerError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setServerError(json.error ?? "Registration failed."); return; }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch { setServerError("An unexpected error occurred."); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Created</h2>
          <p className="text-slate-400 text-sm">Your enterprise account has been registered. Redirecting to sign in…</p>
          <div className="flex items-center justify-center gap-2 mt-5 text-slate-500 text-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirecting…
          </div>
        </div>
      </div>
    );
  }

  const inputCls = "w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-[960px] flex flex-col lg:flex-row lg:rounded-2xl overflow-hidden shadow-2xl shadow-black/60">

        {/* LEFT — branding */}
        <div className="hidden lg:flex lg:w-[40%] flex-shrink-0 bg-slate-950 border-r border-slate-800/80 flex-col justify-center px-10 py-12">
          <div className="mb-8">
            <p className="text-white text-3xl font-extrabold tracking-tight mb-2">AtomQuest</p>
            <p className="text-slate-400 text-sm font-medium">Enterprise Performance Governance</p>
          </div>
          <div className="space-y-4">
            {[
              { icon: Shield,    text: "RBAC-governed workspace" },
              { icon: Lock,      text: "bcrypt-secured credentials" },
              { icon: Users,     text: "Manager hierarchy wiring" },
              { icon: Building2, text: "Multi-department organization" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-slate-400 text-sm">
                <Icon className="w-4 h-4 text-slate-600 flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
          <div className="mt-10 pt-8 border-t border-slate-800">
            <p className="text-slate-600 text-xs">Already have an account?</p>
            <Link href="/login" className="text-indigo-400 text-sm font-semibold hover:text-indigo-300 transition-colors mt-1 inline-block">
              Sign in to existing workspace →
            </Link>
          </div>
        </div>

        {/* RIGHT — form */}
        <div className="flex-1 bg-zinc-50 flex flex-col items-center justify-center px-6 py-10 lg:px-10">
          <div className="w-full max-w-[400px]">

            {/* Mobile brand */}
            <div className="lg:hidden text-center mb-8">
              <p className="text-xl font-bold text-gray-900">AtomQuest</p>
              <p className="text-gray-500 text-sm mt-0.5">Enterprise Governance Platform</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg shadow-gray-200/60 px-8 py-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
                <p className="text-gray-500 text-sm mt-1.5">Register your enterprise identity.</p>
              </div>

              {serverError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                  <input {...register("name")} placeholder="Priya Sharma" className={inputCls} />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Work Email</label>
                  <input {...register("email")} type="email" placeholder="you@corp.io" className={inputCls} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                {/* Employee ID + Role */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Employee ID</label>
                    <input {...register("employeeId")} placeholder="EMP-001" className={inputCls} />
                    {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
                    <select {...register("role")} className={inputCls}>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                    {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
                  </div>
                </div>

                {/* Reporting Manager (employees only) */}
                {selectedRole === "EMPLOYEE" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Reporting Manager <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    {managersLoading ? (
                      <div className="flex items-center gap-2 py-2.5 text-gray-400 text-sm">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading managers…
                      </div>
                    ) : (
                      <div className="relative">
                        <select {...register("managerId")} className={inputCls + " pr-8 appearance-none"}>
                          <option value="">— No manager assigned —</option>
                          {managers.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name}{m.department ? ` — ${m.department}` : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    )}
                    {managers.length === 0 && !managersLoading && (
                      <p className="text-amber-600 text-[11px] mt-1">No managers found. Register a manager first, or assign later.</p>
                    )}
                  </div>
                )}

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Department</label>
                  <select {...register("department")} className={inputCls}>
                    <option value="">Select department…</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
                </div>

                {/* Organization (optional) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Organization <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input {...register("organization")} placeholder="Acme Corp" className={inputCls} />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                  <input {...register("password")} type="password" placeholder="Min. 8 characters" className={inputCls} />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                {/* Notification Email */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3.5">
                  <p className="text-xs font-semibold text-indigo-700 mb-1">
                    Live Governance Notifications <span className="text-indigo-400 font-normal">(optional)</span>
                  </p>
                  <p className="text-[11px] text-indigo-500 mb-2.5">
                    Separate from login email. Receive goal approvals, escalation alerts, and quarterly reminders.
                  </p>
                  <input {...register("notificationEmail")} type="email" placeholder="personal@gmail.com"
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3.5 py-2 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" />
                  {errors.notificationEmail && <p className="text-red-500 text-xs mt-1">{errors.notificationEmail.message}</p>}
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all duration-150 text-sm hover:shadow-md hover:shadow-indigo-500/25 mt-1">
                  {loading
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Creating account…</span>
                    : "Create Enterprise Account"
                  }
                </button>
              </form>
            </div>

            {/* Trust chips */}
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              {[
                { icon: Shield,    label: "RBAC Protected" },
                { icon: Lock,      label: "bcrypt Hashed"  },
                { icon: CheckCircle2, label: "SOC2 Ready"  },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-full shadow-sm">
                  <Icon className="w-3 h-3 text-gray-400" />{label}
                </span>
              ))}
            </div>

            <div className="lg:hidden text-center mt-4">
              <Link href="/login" className="text-indigo-500 text-sm hover:text-indigo-700 transition-colors">
                Already have an account? Sign in →
              </Link>
            </div>

            <p className="text-center text-gray-400 text-[11px] mt-4">
              AtomQuest · Enterprise Edition · FY {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
