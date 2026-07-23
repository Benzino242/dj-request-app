import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const blacklineAlertEmail = process.env.BLACKLINE_ALERT_EMAIL;
const blacklineAlertFrom = process.env.BLACKLINE_ALERT_FROM;

type BookingResponseStatus = "accepted" | "rejected";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatEventDate(value: unknown) {
  if (!value) return "Not provided";

  const parsedDate = new Date(`${String(value)}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate.toLocaleDateString("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (!resendApiKey || !blacklineAlertFrom) {
    console.error(
      "BOOKING EMAIL SKIPPED: RESEND_API_KEY or BLACKLINE_ALERT_FROM is missing",
    );
    return false;
  }

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
      console.error("BOOKING EMAIL FAILED:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("BOOKING EMAIL ERROR:", error);
    return false;
  }
}

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Booking response service is not configured." },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!accessToken) {
    return NextResponse.json(
      { error: "You must be logged in to respond to a booking." },
      { status: 401 },
    );
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabaseAuth.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json(
      { error: "Your login session has expired. Please log in again." },
      { status: 401 },
    );
  }

  let body: {
    bookingId?: number;
    status?: BookingResponseStatus;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid booking response." },
      { status: 400 },
    );
  }

  const bookingId = Number(body.bookingId);
  const status = body.status;

  if (
    !Number.isInteger(bookingId) ||
    bookingId <= 0 ||
    !status ||
    !["accepted", "rejected"].includes(status)
  ) {
    return NextResponse.json(
      { error: "A valid booking and response are required." },
      { status: 400 },
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: dj, error: djError } = await supabaseAdmin
    .from("djs")
    .select("id, stage_name, email, booking_email, user_id")
    .eq("user_id", user.id)
    .single();

  if (djError || !dj) {
    return NextResponse.json(
      { error: "DJ account not found." },
      { status: 404 },
    );
  }

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("booking_requests")
    .select("*")
    .eq("id", bookingId)
    .eq("dj_id", dj.id)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: "Booking request not found." },
      { status: 404 },
    );
  }

  if (booking.status !== "pending") {
    return NextResponse.json(
      {
        error: `This booking has already been marked ${String(
          booking.status || "updated",
        ).replaceAll("_", " ")}.`,
      },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const updatePayload =
    status === "accepted"
      ? {
          status,
          accepted_at: now,
          rejected_at: null,
          dj_read_at: now,
        }
      : {
          status,
          rejected_at: now,
          accepted_at: null,
          dj_read_at: now,
        };

  const { data: updatedBooking, error: updateError } = await supabaseAdmin
    .from("booking_requests")
    .update(updatePayload)
    .eq("id", booking.id)
    .eq("dj_id", dj.id)
    .select("*")
    .single();

  if (updateError || !updatedBooking) {
    return NextResponse.json(
      { error: updateError?.message || "Booking response could not be saved." },
      { status: 500 },
    );
  }

  const djName = String(dj.stage_name || "Your DJ");
  const clientName = String(booking.name || "there");
  const clientEmail = String(booking.email || "").trim();
  const eventType = String(booking.event_type || "your event");
  const eventDate = formatEventDate(booking.event_date);
  const venue = String(booking.venue || "Not provided");
  const budget = String(booking.budget || "Not provided");
  const isAccepted = status === "accepted";

  let clientEmailSent = false;

  if (clientEmail) {
    const clientSubject = isAccepted
      ? `Your booking request was accepted by ${djName}`
      : `Update on your booking request for ${djName}`;

    const clientHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:640px;margin:auto;">
        <h2>${isAccepted ? "Your booking request was accepted" : "Booking request update"}</h2>
        <p>Hi ${escapeHtml(clientName)},</p>
        <p>
          ${isAccepted
            ? `<strong>${escapeHtml(djName)}</strong> has accepted your booking request.`
            : `<strong>${escapeHtml(djName)}</strong> is unable to accept this booking request.`}
        </p>
        <div style="padding:16px;border:1px solid #ddd;border-radius:12px;background:#f7f7f7;">
          <p><strong>Event:</strong> ${escapeHtml(eventType)}</p>
          <p><strong>Date:</strong> ${escapeHtml(eventDate)}</p>
          <p><strong>Venue:</strong> ${escapeHtml(venue)}</p>
          <p><strong>Estimated budget:</strong> ${escapeHtml(budget)}</p>
        </div>
        <p>
          ${isAccepted
            ? "The DJ or Blackline will contact you to confirm the final price and secure payment."
            : "No payment has been taken. You can contact Blackline if you need help finding another DJ."}
        </p>
        <p>Blackline DJ</p>
      </div>
    `;

    const clientText = `
Hi ${clientName},

${
  isAccepted
    ? `${djName} has accepted your booking request.`
    : `${djName} is unable to accept this booking request.`
}

Event: ${eventType}
Date: ${eventDate}
Venue: ${venue}
Estimated budget: ${budget}

${
  isAccepted
    ? "The DJ or Blackline will contact you to confirm the final price and secure payment."
    : "No payment has been taken. You can contact Blackline if you need help finding another DJ."
}

Blackline DJ
`;

    clientEmailSent = await sendEmail({
      to: clientEmail,
      subject: clientSubject,
      html: clientHtml,
      text: clientText,
    });
  }

  let blacklineEmailSent = false;

  if (blacklineAlertEmail) {
    const blacklineSubject = `📅 ${djName} ${status} a booking request`;
    const blacklineHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
        <h2>Booking request ${escapeHtml(status)}</h2>
        <p><strong>${escapeHtml(djName)}</strong> ${escapeHtml(status)} a client booking request.</p>
        <div style="padding:16px;border:1px solid #ddd;border-radius:12px;background:#f7f7f7;">
          <p><strong>Client:</strong> ${escapeHtml(clientName)}</p>
          <p><strong>Client email:</strong> ${escapeHtml(clientEmail || "Not provided")}</p>
          <p><strong>Event:</strong> ${escapeHtml(eventType)}</p>
          <p><strong>Date:</strong> ${escapeHtml(eventDate)}</p>
          <p><strong>Venue:</strong> ${escapeHtml(venue)}</p>
          <p><strong>Budget:</strong> ${escapeHtml(budget)}</p>
          <p><strong>Status:</strong> ${escapeHtml(status)}</p>
        </div>
        <p>
          <a href="https://blacklinedj.com/blackline-admin/verifications" style="display:inline-block;padding:12px 18px;background:#8b5cf6;color:white;text-decoration:none;border-radius:10px;font-weight:bold;">
            Open Blackline Admin
          </a>
        </p>
      </div>
    `;

    const blacklineText = `
${djName} ${status} a booking request.

Client: ${clientName}
Client email: ${clientEmail || "Not provided"}
Event: ${eventType}
Date: ${eventDate}
Venue: ${venue}
Budget: ${budget}
Status: ${status}

Open Blackline Admin:
https://blacklinedj.com/blackline-admin/verifications
`;

    blacklineEmailSent = await sendEmail({
      to: blacklineAlertEmail,
      subject: blacklineSubject,
      html: blacklineHtml,
      text: blacklineText,
    });
  }

  const { error: auditError } = await supabaseAdmin
    .from("audit_logs")
    .insert([
      {
        action_type: `booking_${status}`,
        entity_type: "booking_request",
        entity_id: booking.id,
        description: `${djName} ${status} booking request ${booking.id} from ${clientName}`,
        metadata: {
          booking_id: booking.id,
          dj_id: dj.id,
          dj_name: djName,
          client_name: clientName,
          client_email: clientEmail || null,
          event_type: eventType,
          event_date: booking.event_date || null,
          venue,
          budget,
          previous_status: booking.status,
          new_status: status,
          client_email_sent: clientEmailSent,
          blackline_email_sent: blacklineEmailSent,
        },
      },
    ]);

  if (auditError) {
    console.error("BOOKING RESPONSE AUDIT ERROR:", auditError);
  }

  return NextResponse.json({
    success: true,
    booking: updatedBooking,
    clientEmailSent,
    blacklineEmailSent,
    warning:
      clientEmail && !clientEmailSent
        ? "The booking was updated, but the client email could not be sent."
        : !clientEmail
          ? "The booking was updated, but this client did not provide an email."
          : null,
  });
}
