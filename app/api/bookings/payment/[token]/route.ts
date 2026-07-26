import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Booking payment service is not configured." },
      { status: 500 },
    );
  }

  const { token } = await context.params;

  if (!token) {
    return NextResponse.json(
      { error: "Invalid booking payment link." },
      { status: 400 },
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: booking, error } = await supabaseAdmin
    .from("booking_requests")
    .select(
      "id, dj_id, name, email, event_type, event_date, venue, status, payment_status, currency, agreed_amount, payment_expires_at, paid_at",
    )
    .eq("payment_token", token)
    .single();

  if (error || !booking) {
    return NextResponse.json(
      { error: "Booking payment link not found." },
      { status: 404 },
    );
  }

  const { data: dj } = await supabaseAdmin
    .from("djs")
    .select("stage_name, profile_image")
    .eq("id", booking.dj_id)
    .single();

  const isExpired =
    Boolean(booking.payment_expires_at) &&
    new Date(booking.payment_expires_at).getTime() < Date.now();

  return NextResponse.json({
    booking: {
      id: booking.id,
      clientName: booking.name,
      clientEmail: booking.email,
      eventType: booking.event_type,
      eventDate: booking.event_date,
      venue: booking.venue,
      status: booking.status,
      paymentStatus: booking.payment_status,
      currency: booking.currency || "GHS",
      agreedAmount: Number(booking.agreed_amount || 0),
      paymentExpiresAt: booking.payment_expires_at,
      paidAt: booking.paid_at,
      isExpired,
      djName: dj?.stage_name || "Blackline DJ",
      djProfileImage: dj?.profile_image || null,
    },
  });
}
