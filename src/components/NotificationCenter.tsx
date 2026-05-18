"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  emailSent: boolean;
  emailTo: string | null;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  GOAL_SUBMITTED:       "bg-indigo-100 text-indigo-700",
  GOAL_APPROVED:        "bg-emerald-100 text-emerald-700",
  GOAL_RETURNED:        "bg-amber-100 text-amber-700",
  QUARTERLY_REMINDER:   "bg-blue-100 text-blue-700",
  ESCALATION_TRIGGERED: "bg-red-100 text-red-700",
  SHARED_GOAL_UPDATED:  "bg-violet-100 text-violet-700",
  CHECKIN_REQUESTED:    "bg-cyan-100 text-cyan-700",
  SYSTEM_ALERT:         "bg-slate-100 text-slate-700",
};

const TYPE_LABELS: Record<string, string> = {
  GOAL_SUBMITTED:       "Submitted",
  GOAL_APPROVED:        "Approved",
  GOAL_RETURNED:        "Returned",
  QUARTERLY_REMINDER:   "Reminder",
  ESCALATION_TRIGGERED: "Escalation",
  SHARED_GOAL_UPDATED:  "Shared Goal",
  CHECKIN_REQUESTED:    "Check-in",
  SYSTEM_ALERT:         "System",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=30");
      if (res.ok) {
        const d = await res.json();
        setNotifications(d.notifications ?? []);
        setUnread(d.unreadCount ?? 0);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetch_(); }}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4.5 h-4.5 text-gray-500" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
              {unread > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{unread} new</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100 transition-colors">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-300 mt-1">Governance events will appear here</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} className={`px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors ${!n.isRead ? "bg-indigo-50/30" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${TYPE_COLORS[n.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {TYPE_LABELS[n.type] ?? n.type}
                      </span>
                      {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                      {n.emailSent && n.emailTo && (
                        <span className="text-[10px] text-emerald-600 font-medium">✓ Email sent</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/60">
              <p className="text-[10px] text-gray-400 text-center">
                AtomQuest Governance Notifications · {notifications.length} event{notifications.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
