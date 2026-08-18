import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const blacklineAlertFrom = process.env.BLACKLINE_ALERT_FROM;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://blacklinedj.com").replace(/\/+$/, "");

type TimelineItem = { id: string; time: string; title: string; notes: string };
type MusicItem = {
  id: string;
  category: "must_play" | "do_not_play" | "special_moment";
  title: string;
  artist: string;
  notes: string;
};

type PlanInput = {
  timeline?: TimelineItem[];
  music_requests?: MusicItem[];
  event_notes?: string;
  announcements?: string;
  dress_code?: string;
  important_contacts?: string;
};

type BookingRecord = {
  id: number;
  name: string | null;
  email: string | null;
  event_type: string | null;
  event_date: string | null;
  venue: string | null;
  status: string | null;
  guest_user_id: string | null;
  dj_id: number | null;
  djs:
    | { stage_name: string | null; email: string | null; booking_email: string | null; user_id: string | null }
    | { stage_name: string | null; email: string | null; booking_email: string | null; user_id: string | null }[]
    | null;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function cleanTimeline(value: unknown): TimelineItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).map((item, index) => ({
    id: cleanText(item?.id, 100) || `timeline-${index}`,
    time: cleanText(item?.time, 10),
    title: cleanText(item?.title, 200),
    notes: cleanText(item?.notes, 1000),
  })).filter((item) => item.title);
}

function cleanMusic(value: unknown): MusicItem[] {
  if (!Array.isArray(value)) return [];
  const categories = new Set(["must_play", "do_not_play", "special_moment"]);
  return value.slice(0, 300).map((item, index) => ({
    id: cleanText(item?.id, 100) || `music-${index}`,
    category: (categories.has(String(item?.category)) ? item.category : "must_play") as MusicItem["category"],
    title: cleanText(item?.title, 300),
    artist: cleanText(item?.artist, 300),
    notes: cleanText(item?.notes, 1000),
  })).filter((item) => item.title);
}

function calculateCompletion(plan: Required<PlanInput>) {
  let total = 0;
  if (plan.timeline.length > 0) total += 20;
  if (plan.music_requests.length > 0) total += 20;
  if (plan.event_notes) total += 20;
  if (plan.announcements) total += 15;
  if (plan.important_contacts) total += 15;
  if (plan.dress_code) total += 10;
  return total;
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!resendApiKey || !blacklineAlertFrom || !to) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: blacklineAlertFrom, to: [to], subject, html, text }),
    });
    if (!response.ok) console.error("EVENT PLAN EMAIL FAILED:", await response.text());
    return response.ok;
  } catch (error) {
    console.error("EVENT PLAN EMAIL ERROR:", error);
    return false;
  }
}

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json({ error: "Event planning service is not configured." }, { status: 500 });
  }

  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!accessToken) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const authClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user }, error: userError } = await authClient.auth.getUser(accessToken);
  if (userError || !user) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });

  let body: { bookingId?: number; expectedVersion?: number; plan?: PlanInput };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid event plan." }, { status: 400 }); }

  const bookingId = Number(body.bookingId);
  const expectedVersion = Math.max(0, Number(body.expectedVersion || 0));
  if (!Number.isInteger(bookingId) || bookingId <= 0 || !body.plan) {
    return NextResponse.json({ error: "A valid booking and event plan are required." }, { status: 400 });
  }

  const plan: Required<PlanInput> = {
    timeline: cleanTimeline(body.plan.timeline),
    music_requests: cleanMusic(body.plan.music_requests),
    event_notes: cleanText(body.plan.event_notes, 10000),
    announcements: cleanText(body.plan.announcements, 10000),
    dress_code: cleanText(body.plan.dress_code, 3000),
    important_contacts: cleanText(body.plan.important_contacts, 5000),
  };
  const completionPercent = calculateCompletion(plan);
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: booking, error: bookingError } = await admin
    .from("booking_requests")
    .select("id,name,email,event_type,event_date,venue,status,guest_user_id,dj_id,djs(stage_name,email,booking_email,user_id)")
    .eq("id", bookingId)
    .single();
  if (bookingError || !booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const bookingRecord = booking as unknown as BookingRecord;
  const dj = Array.isArray(bookingRecord.djs) ? bookingRecord.djs[0] : bookingRecord.djs;
  const role = dj?.user_id === user.id ? "dj" : bookingRecord.guest_user_id === user.id ? "client" : null;
  if (!role) return NextResponse.json({ error: "You do not have access to this event plan." }, { status: 403 });
  if (!["accepted", "awaiting_payment", "confirmed", "completed"].includes(String(bookingRecord.status))) {
    return NextResponse.json({ error: "Event planning opens after the DJ accepts the booking." }, { status: 409 });
  }

  const { data: currentPlan } = await admin.from("booking_event_plans").select("version").eq("booking_id", bookingId).maybeSingle();
  const currentVersion = Number(currentPlan?.version || 0);
  if (currentVersion !== expectedVersion) {
    return NextResponse.json({ error: "This plan was updated by someone else. Reload it before saving.", conflict: true }, { status: 409 });
  }

  const nextVersion = currentVersion + 1;
  const payload = {
    booking_id: bookingId,
    ...plan,
    updated_by: user.id,
    updated_by_role: role,
    completion_percent: completionPercent,
    version: nextVersion,
  };

  let savedPlan;
  if (currentVersion === 0) {
    const { data, error } = await admin.from("booking_event_plans").insert(payload).select("*").single();
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "This plan was updated by someone else. Reload it before saving.", conflict: true }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    savedPlan = data;
  } else {
    const { data, error } = await admin.from("booking_event_plans").update(payload).eq("booking_id", bookingId).eq("version", currentVersion).select("*").maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "This plan was updated by someone else. Reload it before saving.", conflict: true }, { status: 409 });
    savedPlan = data;
  }

  const editorName = role === "dj" ? (dj?.stage_name || "Your DJ") : (bookingRecord.name || user.email || "Your client");
  const recipient = role === "dj" ? String(bookingRecord.email || "") : String(dj?.booking_email || dj?.email || "");
  const workspaceUrl = `${siteUrl}/my-blackline/bookings/${bookingId}`;
  const subject = `Event plan updated: ${bookingRecord.event_type || "Booking"} #${bookingId}`;
  const emailText = `${editorName} updated the shared event plan for booking #${bookingId}. The plan is ${completionPercent}% complete. Open it here: ${workspaceUrl}`;
  const emailHtml = `<div style="font-family:Arial,sans-serif;background:#111;color:#fff;padding:32px"><h1 style="color:#c084fc">Event plan updated</h1><p><strong>${escapeHtml(editorName)}</strong> updated the shared plan for ${escapeHtml(bookingRecord.event_type || "your booking")}.</p><p>Planning progress: <strong>${completionPercent}%</strong></p><a href="${escapeHtml(workspaceUrl)}" style="display:inline-block;background:#9333ea;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:bold">Open event plan</a><p style="color:#888;margin-top:24px">Blackline DJ</p></div>`;
  const emailSent = recipient ? await sendEmail(recipient, subject, emailHtml, emailText) : false;

  return NextResponse.json({ success: true, plan: savedPlan, emailSent });
}
