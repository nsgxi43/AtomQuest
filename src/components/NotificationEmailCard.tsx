"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell, BellOff, CheckCircle2, AlertTriangle, Loader2, X, Mail } from "lucide-react";
import toast from "react-hot-toast";

interface NotificationEmailCardProps {
  /** Called when user enables/disables notifications — optional for parent refresh */
  onUpdate?: (email: string | null) => void;
}

export function NotificationEmailCard({ onUpdate }: NotificationEmailCardProps) {
  const { data: session } = useSession();
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [inputEmail, setInputEmail]     = useState("");
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [editing, setEditing]           = useState(false);
  const [dismissed, setDismissed]       = useState(false);

  // Fetch current notification email on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/notifications?limit=0");
        if (res.ok) {
          // Hit a lightweight user-profile endpoint instead
          const profileRes = await fetch("/api/profile");
          if (profileRes.ok) {
            const data = await profileRes.json();
            setCurrentEmail(data.notificationEmail ?? null);
            setInputEmail(data.notificationEmail ?? "");
          }
        }
      } catch { /* silent */ } finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    if (!inputEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/notifications", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ notificationEmail: inputEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentEmail(data.notificationEmail);
        setEditing(false);
        toast.success("Governance notifications enabled!");
        onUpdate?.(data.notificationEmail);
      } else {
        toast.error(data.error ?? "Failed to save email.");
      }
    } finally { setSaving(false); }
  };

  const handleDisable = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ notificationEmail: "" }),
      });
      if (res.ok) {
        setCurrentEmail(null);
        setInputEmail("");
        setEditing(false);
        toast.success("Notifications disabled.");
        onUpdate?.(null);
      }
    } finally { setSaving(false); }
  };

  if (loading || dismissed) return null;

  // Already configured — show compact status pill
  if (currentEmail && !editing) {
    return (
      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-800">Notifications active</p>
            <p className="text-[11px] text-emerald-600 font-mono">{currentEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(true)} className="text-[11px] text-emerald-700 font-semibold hover:text-emerald-900 transition-colors">
            Change
          </button>
          <button onClick={handleDisable} disabled={saving} className="text-[11px] text-red-500 hover:text-red-700 transition-colors font-medium">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Disable"}
          </button>
        </div>
      </div>
    );
  }

  // Onboarding card
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 relative">
      <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 text-indigo-300 hover:text-indigo-500 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Bell className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-900">Enable Live Governance Notifications</p>
          <p className="text-[11px] text-indigo-600 mt-0.5 leading-relaxed">
            Receive goal approvals, escalation alerts, quarterly reminders, and workflow updates via email.
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-1 mb-3">
        {["Goal approvals", "Escalation alerts", "Quarterly reminders", "Workflow updates"].map(item => (
          <li key={item} className="flex items-center gap-1.5 text-[11px] text-indigo-700">
            <CheckCircle2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>

      {editing ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              value={inputEmail}
              onChange={e => setInputEmail(e.target.value)}
              placeholder="your@gmail.com"
              autoFocus
              className="flex-1 bg-white border border-indigo-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Save
            </button>
            <button onClick={() => setEditing(false)} className="px-2 text-indigo-500 hover:text-indigo-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-indigo-500">
            <Mail className="w-3 h-3 inline mr-1" />
            This is separate from your login email (<span className="font-mono">{(session?.user as any)?.email}</span>)
          </p>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Enable Notifications
        </button>
      )}
    </div>
  );
}
