import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const blacklineAlertEmail = process.env.BLACKLINE_ALERT_EMAIL;
const blacklineAlertFrom = process.env.BLACKLINE_ALERT_FROM;
const COMMISSION_RATE = 10;

async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!resendApiKey || !blacklineAlertFrom || !to) return false;

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

    return response.ok;
  } catch (error) {
    console.error("BOOKING PAYMENT CONFIRMATION EMAIL ERROR:", error);
    return false;
  }
}

export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey || !paystackSecretKey) {
    return NextResponse.json(
      { error: "Booking verification service is not configured." },
      { status: 500 },
    );
  }

  let body: { token?: string; reference?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid verification request." },
      { status: 400 },
    );
  }

  const token = String(body.token || "").trim();
  const reference = String(body.reference || "").trim();

  if (!token || !reference) {
    return NextResponse.json(
      { error: "Payment token and reference are required." },
      { status: 400 },
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("booking_requests")
    .select("*")
    .eq("payment_token", token)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: "Booking payment link not found." },
      { status: 404 },
    );
  }

  if (booking.payment_status === "paid") {
    if (booking.payment_reference === reference) {
      return NextResponse.json({ success: true, booking });
    }

    return NextResponse.json(
      { error: "This booking has already been paid." },
      { status: 409 },
    );
  }

  if (
    booking.payment_expires_at &&
    new Date(booking.payment_expires_at).getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "This booking payment link has expired." },
      { status: 410 },
    );
  }

  const expectedAmount = Number(booking.agreed_amount || 0);

  if (!expectedAmount || expectedAmount < 1) {
    return NextResponse.json(
      { error: "This booking does not have a valid agreed amount." },
      { status: 400 },
    );
  }

  const existingReference = await supabaseAdmin
    .from("booking_requests")
    .select("id")
    .eq("payment_reference", reference)
    .neq("id", booking.id)
    .maybeSingle();

  if (existingReference.data) {
    return NextResponse.json(
      { error: "This payment reference has already been used." },
      { status: 409 },
    );
  }

  const verifyResponse = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
      cache: "no-store",
    },
  );

  const verifyResult = await verifyResponse.json();
  const transaction = verifyResult?.data;

  if (
    !verifyResponse.ok ||
    !verifyResult?.status ||
    transaction?.status !== "success"
  ) {
    return NextResponse.json(
      { error: "Paystack could not verify this payment." },
      { status: 400 },
    );
  }

  const paidAmount = Number(transaction.amount || 0) / 100;
  const paidCurrency = String(transaction.currency || "").toUpperCase();

  if (
    Math.abs(paidAmount - expectedAmount) > 0.001 ||
    paidCurrency !== "GHS"
  ) {
    return NextResponse.json(
      { error: "The verified payment does not match this booking." },
      { status: 400 },
    );
  }

  const commissionAmount =
    Math.round(expectedAmount * (COMMISSION_RATE / 100) * 100) / 100;
  const djNetAmount =
    Math.round((expectedAmount - commissionAmount) * 100) / 100;
  const paidAt = new Date().toISOString();

  const { data: updatedBooking, error: updateError } = await supabaseAdmin
    .from("booking_requests")
    .update({
      status: "confirmed",
      payment_status: "paid",
      payment_reference: reference,
      currency: "GHS",
      commission_rate: COMMISSION_RATE,
      commission_amount: commissionAmount,
      dj_net_amount: djNetAmount,
      paid_at: paidAt,
    })
    .eq("id", booking.id)
    .eq("payment_token", token)
    .neq("payment_status", "paid")
    .select("*")
    .single();

  if (updateError || !updatedBooking) {
    return NextResponse.json(
      { error: updateError?.message || "Paid booking could not be saved." },
      { status: 500 },
    );
  }

  const { data: dj } = await supabaseAdmin
    .from("djs")
    .select("stage_name, booking_email, email")
    .eq("id", booking.dj_id)
    .single();

  const djName = dj?.stage_name || "Blackline DJ";
  const formattedAmount = `GHS ${expectedAmount.toFixed(2)}`;

  await Promise.all([
    sendEmail(
      String(booking.email || ""),
      `Payment confirmed for your ${djName} booking`,
      `<h2>Booking payment confirmed</h2><p>Hi ${booking.name || "there"},</p><p>Your ${formattedAmount} payment for ${djName} was verified successfully.</p><p>Payment reference: <strong>${reference}</strong></p><p>Blackline DJ</p>`,
      `Booking payment confirmed\n\nYour ${formattedAmount} payment for ${djName} was verified successfully.\nReference: ${reference}`,
    ),
    sendEmail(
      String(dj?.booking_email || dj?.email || ""),
      `Booking paid: ${booking.name || "Client"} - ${formattedAmount}`,
      `<h2>Your booking has been paid</h2><p>${booking.name || "The client"} paid ${formattedAmount}.</p><p>Your net amount after Blackline commission: <strong>GHS ${djNetAmount.toFixed(2)}</strong></p><p>Reference: ${reference}</p>`,
      `Booking paid\n\nClient: ${booking.name || "Client"}\nPaid: ${formattedAmount}\nDJ net: GHS ${djNetAmount.toFixed(2)}\nReference: ${reference}`,
    ),
    sendEmail(
      String(blacklineAlertEmail || ""),
      `Booking payment verified: ${djName} - ${formattedAmount}`,
      `<h2>Booking payment verified</h2><p>DJ: ${djName}</p><p>Gross: ${formattedAmount}</p><p>Blackline commission: GHS ${commissionAmount.toFixed(2)}</p><p>DJ net: GHS ${djNetAmount.toFixed(2)}</p><p>Reference: ${reference}</p>`,
      `Booking payment verified\n\nDJ: ${djName}\nGross: ${formattedAmount}\nBlackline commission: GHS ${commissionAmount.toFixed(2)}\nDJ net: GHS ${djNetAmount.toFixed(2)}\nReference: ${reference}`,
    ),
  ]);

  await supabaseAdmin.from("audit_logs").insert([
    {
      action_type: "booking_payment_verified",
      entity_type: "booking_request",
      entity_id: booking.id,
      description: `Booking ${booking.id} payment verified for ${djName}: ${formattedAmount}`,
      metadata: {
        booking_id: booking.id,
        dj_id: booking.dj_id,
        dj_name: djName,
        client_name: booking.name,
        amount: expectedAmount,
        currency: "GHS",
        commission_rate: COMMISSION_RATE,
        commission_amount: commissionAmount,
        dj_net_amount: djNetAmount,
        payment_reference: reference,
        previous_status: booking.status,
        new_status: "confirmed",
      },
    },
  ]);

  return NextResponse.json({
    success: true,
    booking: updatedBooking,
    amount: expectedAmount,
    currency: "GHS",
    commissionAmount,
    djNetAmount,
    reference,
  });
}
