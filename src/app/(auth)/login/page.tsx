"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AlertCircle, X, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SSOUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  aadGroup: string;
  department: string;
  initials: string;
  avatarColor: string;
  reportsTo: { name: string; email: string } | null;
  directReports: number;
}

const ROLE_ROUTE: Record<string, string> = {
  ADMIN: "/admin",
  MANAGER: "/manager",
  EMPLOYEE: "/employee",
};

const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ADMIN:    { bg: "bg-violet-100", text: "text-violet-700", label: "Admin" },
  MANAGER:  { bg: "bg-blue-100",   text: "text-blue-700",   label: "Manager" },
  EMPLOYEE: { bg: "bg-emerald-100",text: "text-emerald-700",label: "Employee" },
};

// ─── Account Picker Modal ─────────────────────────────────────────────────────
function AccountPicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (user: SSOUser) => void;
}) {
  const [users, setUsers] = useState<SSOUser[]>([]);
  const [loading, setLoading] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/sso-directory")
      .then((r) => r.json())
      .then((d) => { setUsers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            {/* Microsoft logo */}
            <div className="grid grid-cols-2 gap-0.5 w-5 h-5 flex-shrink-0">
              <div className="bg-[#f25022] rounded-[1px]" />
              <div className="bg-[#7fba00] rounded-[1px]" />
              <div className="bg-[#00a4ef] rounded-[1px]" />
              <div className="bg-[#ffb900] rounded-[1px]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Microsoft Entra ID</p>
              <p className="text-xs text-gray-500">Choose an account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Directory listing */}
        <div className="overflow-y-auto" style={{ maxHeight: "420px" }}>
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading directory…</span>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">No accounts found.</p>
          ) : (
            <div className="py-1">
              {users.map((u) => {
                const rs = ROLE_STYLES[u.role] ?? ROLE_STYLES.EMPLOYEE;
                return (
                  <button
                    key={u.id}
                    onClick={() => onPick(u)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left group"
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                      style={{ backgroundColor: u.avatarColor }}
                    >
                      {u.initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{u.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rs.bg} ${rs.text}`}>
                          {rs.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      {u.reportsTo && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Reports to {u.reportsTo.name}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-center">
          <p className="text-[10px] text-gray-400 font-mono">{users[0]?.email.split("@")[1] ?? "corp.atomquest.io"} directory</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoUser, setSsoUser] = useState<SSOUser | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) { setError("Invalid email or password."); return; }
      if (result?.ok) {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const role = (session?.user as any)?.role;
        router.push(ROLE_ROUTE[role] ?? "/employee");
      }
    } catch { setError("An error occurred. Please try again."); }
    finally { setLoading(false); }
  };

  const handlePickUser = async (user: SSOUser) => {
    setShowPicker(false);
    setSsoUser(user);
    setSsoLoading(true);
    try {
      const result = await signIn("credentials", {
        email: user.email,
        password: "password123",
        redirect: false,
      });
      if (result?.error) {
        setError("SSO sign-in failed. Ensure demo accounts are seeded with password123.");
        setSsoLoading(false);
        setSsoUser(null);
        return;
      }
      // Brief pause for UX realism, then redirect
      await new Promise((r) => setTimeout(r, 800));
      router.push(ROLE_ROUTE[user.role] ?? "/employee");
    } catch {
      setError("An unexpected error occurred during SSO sign-in.");
      setSsoLoading(false);
      setSsoUser(null);
    }
  };

  // Full-page SSO loading state
  if (ssoLoading && ssoUser) {
    const rs = ROLE_STYLES[ssoUser.role] ?? ROLE_STYLES.EMPLOYEE;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold text-white"
            style={{ backgroundColor: ssoUser.avatarColor }}
          >
            {ssoUser.initials}
          </div>
          <p className="text-gray-900 font-semibold">{ssoUser.name}</p>
          <p className="text-gray-500 text-sm mt-0.5">{ssoUser.email}</p>
          <span className={`inline-block mt-2 text-xs font-bold px-2 py-1 rounded ${rs.bg} ${rs.text}`}>
            {rs.label}
          </span>
          <div className="flex items-center justify-center gap-2 mt-6 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in…
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AtomQuest</h1>
            <p className="text-gray-500 mt-1 text-sm">Enterprise Goal Management Portal</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign in</h2>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Microsoft Entra SSO */}
            <button
              onClick={() => setShowPicker(true)}
              className="w-full flex items-center justify-center gap-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition-all duration-150 hover:border-gray-400 hover:shadow-sm text-sm mb-5"
            >
              <div className="grid grid-cols-2 gap-[2px] w-4 h-4 flex-shrink-0">
                <div className="bg-[#f25022] rounded-[1px]" />
                <div className="bg-[#7fba00] rounded-[1px]" />
                <div className="bg-[#00a4ef] rounded-[1px]" />
                <div className="bg-[#ffb900] rounded-[1px]" />
              </div>
              Continue with Microsoft Entra ID
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Email/Password form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@corp.io"
                {...register("email")}
                error={errors.email?.message}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                error={errors.password?.message}
              />
              <Button
                variant="primary"
                type="submit"
                loading={loading}
                className="w-full mt-1"
              >
                Sign in
              </Button>
            </form>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            AtomQuest · Enterprise Edition
          </p>
        </div>
      </div>

      {showPicker && (
        <AccountPicker
          onClose={() => setShowPicker(false)}
          onPick={handlePickUser}
        />
      )}
    </>
  );
}
