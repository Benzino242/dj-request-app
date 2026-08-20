import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const blacklineAlertFrom = process.env.BLACKLINE_ALERT_FROM;
const cronSecret = process.env.CRON_SECRET;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://blacklinedj.com").replace(/\/+$/, "");

type DjContact = {
  stage_name: string | null;
  booking_email: string | null;
  email: string | null;
};

type ReminderBooking = {
  id: number;
  name: string | null;
  email: string | null;
  event_type: string | null;
  event_date: string;
  venue: string | null;
  status: string | null;
  djs: DjContact | DjContact[] | null;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isoDateAfter(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!resendApiKey || !blacklineAlertFrom) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: blacklineAlertFrom,
        to: [to],
        subject,
        html,
        text,
      }),
    });
    if (!response.ok) {
      console.error("BOOKING REMINDER EMAIL FAILED:", await response.text());
    }
    return response.ok;
  } catch (error) {
    console.error("BOOKING REMINDER EMAIL ERROR:", error);
    return false;
  }
}

export async function GET(request: Request) {
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !blacklineAlertFrom) {
    return NextResponse.json({ error: "Reminder service is not configured." }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const targets = [7, 3, 1] as const;
  const results = { checked: 0, sent: 0, skipped: 0, failed: 0 };

  for (const reminderDays of targets) {
    const eventDate = isoDateAfter(reminderDays);
    const { data, error } = await admin
      .from("booking_requests")
      .select("id,name,email,event_type,event_date,venue,status,djs(stage_name,booking_email,email)")
      .eq("event_date", eventDate)
      .in("status", ["accepted", "awaiting_payment", "confirmed"]);

    if (error) {
      console.error(`BOOKING REMINDER QUERY FAILED (${reminderDays} days):`, error);
      results.failed += 1;
      continue;
    }

    for (const rawBooking of data || []) {
      const booking = rawBooking as unknown as ReminderBooking;
      const dj = Array.isArray(booking.djs) ? booking.djs[0] : booking.djs;
      const recipients = [
        { type: "client" as const, email: String(booking.email || "").trim(), name: booking.name || "there" },
        { type: "dj" as const, email: String(dj?.booking_email || dj?.email || "").trim(), name: dj?.stage_name || "DJ" },
      ];

      for (const recipient of recipients) {
        results.checked += 1;
        if (!recipient.email) {
          results.skipped += 1;
          continue;
        }

        const { data: claim, error: claimError } = await admin
          .from("booking_reminders")
          .insert({
            booking_id: booking.id,
            reminder_days: reminderDays,
            recipient_type: recipient.type,
            recipient_email: recipient.email,
          })
          .select("id")
          .maybeSingle();

        if (claimError || !claim) {
          if (claimError?.code !== "23505") {
            console.error("BOOKING REMINDER CLAIM FAILED:", claimError);
            results.failed += 1;
          } else {
            results.skipped += 1;
          }
          continue;
        }

        const eventLabel = booking.event_type || "event";
        const dateLabel = formatEventDate(booking.event_date);
        const workspaceUrl = `${siteUrl}/my-blackline/bookings/${booking.id}`;
        const subject = `${reminderDays}-day reminder: ${eventLabel} with ${dj?.stage_name || "Blackline DJ"}`;
        const text = `Hi ${recipient.name}, your ${eventLabel} is in ${reminderDays} day${reminderDays === 1 ? "" : "s"}. Date: ${dateLabel}. Venue: ${booking.venue || "Not set"}. Open the shared event plan: ${workspaceUrl}`;
        const html = `
          <div style="font-family:Arial,sans-serif;background:#111;color:#fff;padding:32px">
            <p style="color:#c084fc;font-weight:bold;text-transform:uppercase;letter-spacing:2px">Blackline event reminder</p>
            <h1>Your event is in ${reminderDays} day${reminderDays === 1 ? "" : "s"}</h1>
            <p>Hi ${escapeHtml(recipient.name)},</p>
            <div style="background:#222;border:1px solid #444;border-radius:16px;padding:20px;margin:22px 0">
              <p><strong>Event:</strong> ${escapeHtml(eventLabel)}</p>
              <p><strong>DJ:</strong> ${escapeHtml(dj?.stage_name || "Blackline DJ")}</p>
              <p><strong>Date:</strong> ${escapeHtml(dateLabel)}</p>
              <p><strong>Venue:</strong> ${escapeHtml(booking.venue || "Not set")}</p>
            </div>
            <a href="${escapeHtml(workspaceUrl)}" style="display:inline-block;background:#9333ea;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:bold">Open event plan</a>
            <p style="color:#888;margin-top:28px">Blackline DJ</p>
          </div>`;

        const sent = await sendEmail(recipient.email, subject, html, text);
        if (sent) {
          results.sent += 1;
        } else {
          results.failed += 1;
          await admin.from("booking_reminders").delete().eq("id", claim.id);
        }
      }
    }
  }

  return NextResponse.json({ success: results.failed === 0, ...results });
}
