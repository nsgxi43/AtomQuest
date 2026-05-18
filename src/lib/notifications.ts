import { transporter } from "./mail";
import { prisma } from "./prisma";

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotificationEvent =
  | "GOAL_SUBMITTED"
  | "GOAL_APPROVED"
  | "GOAL_RETURNED"
  | "QUARTERLY_REMINDER"
  | "ESCALATION_TRIGGERED"
  | "SHARED_GOAL_UPDATED"
  | "CHECKIN_REQUESTED"
  | "SYSTEM_ALERT";

interface NotificationPayload {
  toUserId: string;
  type: NotificationEvent;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  extraLines?: string[];
}

// ─── HTML Template Builder ────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  GOAL_SUBMITTED:       "#6366f1",
  GOAL_APPROVED:        "#10b981",
  GOAL_RETURNED:        "#f59e0b",
  QUARTERLY_REMINDER:   "#3b82f6",
  ESCALATION_TRIGGERED: "#ef4444",
  SHARED_GOAL_UPDATED:  "#8b5cf6",
  CHECKIN_REQUESTED:    "#06b6d4",
  SYSTEM_ALERT:         "#64748b",
};

const STATUS_LABELS: Record<string, string> = {
  GOAL_SUBMITTED:       "Goal Submitted",
  GOAL_APPROVED:        "Goal Approved",
  GOAL_RETURNED:        "Returned for Revision",
  QUARTERLY_REMINDER:   "Quarterly Reminder",
  ESCALATION_TRIGGERED: "Escalation Triggered",
  SHARED_GOAL_UPDATED:  "Shared Goal Updated",
  CHECKIN_REQUESTED:    "Check-in Requested",
  SYSTEM_ALERT:         "System Alert",
};

function buildEmailHTML(opts: {
  title: string;
  message: string;
  eventType: NotificationEvent;
  ctaLabel?: string;
  ctaUrl?: string;
  extraLines?: string[];
  timestamp: string;
}): string {
  const color = STATUS_COLORS[opts.eventType] ?? "#6366f1";
  const badge = STATUS_LABELS[opts.eventType] ?? opts.eventType;
  const cta = opts.ctaLabel && opts.ctaUrl
    ? `<a href="${opts.ctaUrl}" style="display:inline-block;margin-top:20px;padding:10px 24px;background:${color};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${opts.ctaLabel}</a>`
    : "";
  const extras = opts.extraLines?.map(l => `<p style="color:#64748b;font-size:13px;margin:4px 0;">${l}</p>`).join("") ?? "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">AtomQuest</span>
                  <span style="color:#64748b;font-size:12px;margin-left:8px;">Enterprise Governance</span>
                </td>
                <td align="right">
                  <span style="background:${color};color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${badge}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <div style="width:40px;height:4px;background:${color};border-radius:2px;margin-bottom:20px;"></div>
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;">${opts.title}</h1>
            <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">${opts.message}</p>
            ${extras}
            ${cta}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #f1f5f9;background:#f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#94a3b8;font-size:11px;">AtomQuest Enterprise · Governance Notification</td>
                <td align="right" style="color:#94a3b8;font-size:11px;">${opts.timestamp}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────
export async function dispatchNotification(payload: NotificationPayload): Promise<void> {
  const timestamp = new Date().toISOString();

  console.log(`[NotificationService] ▶ Dispatching: ${payload.type}`);
  console.log(`[NotificationService]   → Recipient userId: ${payload.toUserId}`);
  console.log(`[NotificationService]   → Title: ${payload.title}`);
  console.log(`[NotificationService]   → SMTP sender configured: ${!!process.env.SMTP_EMAIL}`);

  try {
    // 1. Persist in-app notification
    await prisma.notification.create({
      data: {
        userId:     payload.toUserId,
        type:       payload.type as any,
        title:      payload.title,
        message:    payload.message,
        entityType: payload.entityType,
        entityId:   payload.entityId,
      },
    });
    console.log(`[NotificationService]   ✓ In-app notification persisted`);

    // 2. Resolve notification email
    const user = await prisma.user.findUnique({
      where:  { id: payload.toUserId },
      select: { notificationEmail: true, email: true, name: true },
    });

    const notifEmail = user?.notificationEmail;

    if (!notifEmail) {
      console.warn(`[NotificationService]   ⚠ No notificationEmail configured for user ${payload.toUserId} (${user?.email ?? "unknown"}). Email skipped.`);
      return;
    }
    if (!process.env.SMTP_EMAIL) {
      console.warn(`[NotificationService]   ⚠ SMTP_EMAIL env var not set. Email delivery disabled.`);
      return;
    }

    console.log(`[NotificationService]   → Delivering to: ${notifEmail}`);

    // 3. Build and send HTML email
    const html = buildEmailHTML({
      title:      payload.title,
      message:    payload.message,
      eventType:  payload.type,
      ctaLabel:   payload.ctaLabel,
      ctaUrl:     payload.ctaUrl
        ? `${process.env.NEXTAUTH_URL ?? "https://atom-quest-lake.vercel.app"}${payload.ctaUrl}`
        : undefined,
      extraLines: payload.extraLines,
      timestamp,
    });

    await transporter.sendMail({
      from:    `"AtomQuest Governance" <${process.env.SMTP_EMAIL}>`,
      to:      notifEmail,
      subject: `[AtomQuest] ${payload.title}`,
      html,
    });

    console.log(`[NotificationService]   ✓ Email delivered → ${notifEmail}`);

    // 4. Mark email sent + log success
    await prisma.notification.updateMany({
      where: { userId: payload.toUserId, title: payload.title, emailSent: false },
      data:  { emailSent: true, emailTo: notifEmail },
    });

    await prisma.notificationLog.create({
      data: {
        toEmail:   notifEmail,
        subject:   `[AtomQuest] ${payload.title}`,
        eventType: payload.type,
        entityId:  payload.entityId,
        status:    "SENT",
      },
    });
  } catch (err: any) {
    const errMsg = err?.message ?? String(err);
    console.error(`[NotificationService] ✗ SMTP FAILED for type=${payload.type} userId=${payload.toUserId}`);
    console.error(`[NotificationService]   Error: ${errMsg}`);

    // Log failure to DB — never throw; notifications are fire-and-forget
    try {
      await prisma.notificationLog.create({
        data: {
          toEmail:   "delivery-failed",
          subject:   payload.title,
          eventType: payload.type,
          entityId:  payload.entityId,
          status:    "FAILED",
          error:     errMsg,
        },
      });
    } catch (logErr) {
      console.error(`[NotificationService]   Could not persist failure log:`, logErr);
    }
  }
}
