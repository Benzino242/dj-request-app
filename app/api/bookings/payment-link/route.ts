import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const blacklineAlertEmail = process.env.BLACKLINE_ALERT_EMAIL;
const blacklineAlertFrom = process.env.BLACKLINE_ALERT_FROM;
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://blacklinedj.com"
).replace(/\/+$/, "");

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
      console.error("BOOKING PAYMENT LINK EMAIL FAILED:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("BOOKING PAYMENT LINK EMAIL ERROR:", error);
    return false;
  }
}

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Booking payment service is not configured." },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!accessToken) {
    return NextResponse.json(
      { error: "You must be logged in to create a payment link." },
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
    agreedAmount?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid payment-link request." },
      { status: 400 },
    );
  }

  const bookingId = Number(body.bookingId);
  const agreedAmount = Number(body.agreedAmount);

  if (
    !Number.isInteger(bookingId) ||
    bookingId <= 0 ||
    !Number.isFinite(agreedAmount) ||
    agreedAmount < 1
  ) {
    return NextResponse.json(
      { error: "Enter a valid final price of at least GHS 1." },
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
    .select("id, stage_name, user_id")
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

  if (!["accepted", "awaiting_payment"].includes(booking.status)) {
    return NextResponse.json(
      { error: "Accept this booking before creating its payment link." },
      { status: 409 },
    );
  }

  if (booking.payment_status === "paid") {
    return NextResponse.json(
      { error: "This booking has already been paid." },
      { status: 409 },
    );
  }

  const clientEmail = String(booking.email || "").trim();

  if (!clientEmail) {
    return NextResponse.json(
      { error: "This client did not provide an email address." },
      { status: 400 },
    );
  }

  const paymentToken = booking.payment_token || crypto.randomUUID();
  const paymentExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const paymentLinkSentAt = new Date().toISOString();
  const paymentUrl = `${siteUrl}/booking/pay/${paymentToken}`;

  const { data: updatedBooking, error: updateError } = await supabaseAdmin
    .from("booking_requests")
    .update({
      status: "awaiting_payment",
      payment_status: "pending",
      currency: "GHS",
      agreed_amount: agreedAmount,
      payment_token: paymentToken,
      payment_expires_at: paymentExpiresAt,
      payment_link_sent_at: paymentLinkSentAt,
    })
    .eq("id", booking.id)
    .eq("dj_id", dj.id)
    .select("*")
    .single();

  if (updateError || !updatedBooking) {
    return NextResponse.json(
      { error: updateError?.message || "Payment link could not be created." },
      { status: 500 },
    );
  }

  const djName = String(dj.stage_name || "Your DJ");
  const clientName = String(booking.name || "there");
  const formattedAmount = `GHS ${agreedAmount.toFixed(2)}`;

  const clientEmailSent = await sendEmail({
    to: clientEmail,
    subject: `Complete your booking payment for ${djName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:640px;margin:auto;">
        <h2>Your Blackline booking is ready for payment</h2>
        <p>Hi ${escapeHtml(clientName)},</p>
        <p><strong>${escapeHtml(djName)}</strong> has confirmed the final price for your booking.</p>
        <div style="padding:16px;border:1px solid #ddd;border-radius:12px;background:#f7f7f7;">
          <p><strong>Event:</strong> ${escapeHtml(booking.event_type || "Not provided")}</p>
          <p><strong>Date:</strong> ${escapeHtml(booking.event_date || "Not provided")}</p>
          <p><strong>Venue:</strong> ${escapeHtml(booking.venue || "Not provided")}</p>
          <p><strong>Final price:</strong> ${escapeHtml(formattedAmount)}</p>
        </div>
        <p>
          <a href="${escapeHtml(paymentUrl)}" style="display:inline-block;padding:14px 22px;background:#8b5cf6;color:white;text-decoration:none;border-radius:10px;font-weight:bold;">
            Pay securely with Paystack
          </a>
        </p>
        <p>This secure payment link expires in 7 days.</p>
        <p>
          <a href="${escapeHtml(`${siteUrl}/my-blackline`)}" style="display:inline-block;padding:12px 18px;background:#18181b;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;">
            View My Bookings
          </a>
        </p>
        <p>Blackline DJ</p>
      </div>
    `,
    text: `
Hi ${clientName},

${djName} has confirmed the final price for your booking.

Event: ${booking.event_type || "Not provided"}
Date: ${booking.event_date || "Not provided"}
Venue: ${booking.venue || "Not provided"}
Final price: ${formattedAmount}

Pay securely:
${paymentUrl}

This payment link expires in 7 days.

View and track your bookings:
${siteUrl}/my-blackline

Blackline DJ
`,
  });

  let blacklineEmailSent = false;

  if (blacklineAlertEmail) {
    blacklineEmailSent = await sendEmail({
      to: blacklineAlertEmail,
      subject: `💳 Booking payment link sent: ${djName} - ${formattedAmount}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
          <h2>Booking awaiting payment</h2>
          <p><strong>${escapeHtml(djName)}</strong> set a final price and sent the client a payment link.</p>
          <p><strong>Client:</strong> ${escapeHtml(clientName)}</p>
          <p><strong>Amount:</strong> ${escapeHtml(formattedAmount)}</p>
          <p><strong>Booking ID:</strong> ${escapeHtml(booking.id)}</p>
          <p><a href="https://blacklinedj.com/blackline-admin/verifications">Open Blackline Admin</a></p>
        </div>
      `,
      text: `
Booking awaiting payment

DJ: ${djName}
Client: ${clientName}
Amount: ${formattedAmount}
Booking ID: ${booking.id}

Open Blackline Admin:
https://blacklinedj.com/blackline-admin/verifications
`,
    });
  }

  await supabaseAdmin.from("audit_logs").insert([
    {
      action_type: "booking_payment_link_sent",
      entity_type: "booking_request",
      entity_id: booking.id,
      description: `${djName} set booking ${booking.id} to ${formattedAmount} and sent a payment link`,
      metadata: {
        booking_id: booking.id,
        dj_id: dj.id,
        dj_name: djName,
        client_name: clientName,
        client_email: clientEmail,
        amount: agreedAmount,
        currency: "GHS",
        payment_expires_at: paymentExpiresAt,
        client_email_sent: clientEmailSent,
        blackline_email_sent: blacklineEmailSent,
      },
    },
  ]);

  return NextResponse.json({
    success: true,
    booking: updatedBooking,
    paymentUrl,
    clientEmailSent,
    blacklineEmailSent,
    warning: !clientEmailSent
      ? "The payment link was created, but the client email could not be sent."
      : null,
  });
}
