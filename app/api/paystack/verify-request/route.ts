import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

const PLATFORM_FEE_PERCENT = 10;
const ACTIVE_REQUEST_STATUSES = ["pending", "accepted"];

type PaystackVerifyResponse = {
  status?: boolean;
  message?: string;
  data?: {
    id?: number;
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    gateway_response?: string;
    paid_at?: string | null;
    channel?: string;
  };
};

type RequestRecord = {
  id: number;
  dj_id: number;
  name: string;
  song: string;
  artist: string;
  artwork?: string | null;
  album?: string | null;
  status: string;
  tip_amount: number;
  tip_currency: string;
};

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeForMatch(value: unknown) {
  return cleanString(value).toLowerCase();
}

function toPaystackSubunit(amount: number) {
  return Math.round(amount * 100);
}

function getSafeAmount(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return amount;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error || "Unknown error");
}

export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey || !paystackSecretKey) {
    return NextResponse.json(
      {
        verified: false,
        error: "Missing payment verification environment variables",
      },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();

    const reference = cleanString(body.reference);
    const expectedAmount = getSafeAmount(body.expectedAmount);
    const expectedCurrency = cleanString(body.expectedCurrency).toUpperCase();
    const expectedSubunitAmount = toPaystackSubunit(expectedAmount);

    const djId = Number(body.djId);
    const guestName = cleanString(body.guestName);
    const song = cleanString(body.song);
    const artist = cleanString(body.artist);
    const artwork = cleanString(body.artwork) || null;
    const album = cleanString(body.album) || null;
    const duplicateRequestId = body.duplicateRequestId
      ? Number(body.duplicateRequestId)
      : null;

    if (!reference) {
      return NextResponse.json(
        { verified: false, error: "Missing payment reference" },
        { status: 400 },
      );
    }

    if (!expectedAmount || expectedAmount < 1 || !expectedSubunitAmount) {
      return NextResponse.json(
        { verified: false, error: "Invalid payment amount" },
        { status: 400 },
      );
    }

    if (!expectedCurrency) {
      return NextResponse.json(
        { verified: false, error: "Missing payment currency" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(djId) || djId <= 0) {
      return NextResponse.json(
        { verified: false, error: "Invalid DJ profile" },
        { status: 400 },
      );
    }

    if (!guestName || !song || !artist) {
      return NextResponse.json(
        { verified: false, error: "Missing request details" },
        { status: 400 },
      );
    }

    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
        cache: "no-store",
      },
    );

    const paystackResult =
      (await paystackResponse.json()) as PaystackVerifyResponse;

    if (!paystackResponse.ok || !paystackResult.status || !paystackResult.data) {
      return NextResponse.json(
        {
          verified: false,
          error: paystackResult.message || "Paystack verification failed",
        },
        { status: 400 },
      );
    }

    const transaction = paystackResult.data;
    const transactionStatus = cleanString(transaction.status).toLowerCase();
    const transactionCurrency = cleanString(transaction.currency).toUpperCase();
    const transactionAmount = Number(transaction.amount || 0);
    const transactionReference = cleanString(transaction.reference || reference);

    if (transactionStatus !== "success") {
      return NextResponse.json(
        {
          verified: false,
          error: `Paystack transaction status is ${transactionStatus || "unknown"}`,
          reference,
        },
        { status: 400 },
      );
    }

    if (transactionReference && transactionReference !== reference) {
      return NextResponse.json(
        {
          verified: false,
          error: "Payment reference mismatch",
          reference,
        },
        { status: 400 },
      );
    }

    if (transactionAmount !== expectedSubunitAmount) {
      return NextResponse.json(
        {
          verified: false,
          error: "Payment amount mismatch",
          reference,
        },
        { status: 400 },
      );
    }

    if (transactionCurrency !== expectedCurrency) {
      return NextResponse.json(
        {
          verified: false,
          error: "Payment currency mismatch",
          reference,
        },
        { status: 400 },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: existingPayment, error: existingPaymentError } =
      await supabaseAdmin
        .from("payments")
        .select("id, request_id, provider_reference, amount, currency")
        .eq("provider_reference", reference)
        .maybeSingle();

    if (existingPaymentError) {
      console.error("PAYMENT REFERENCE CHECK ERROR:", existingPaymentError);

      return NextResponse.json(
        {
          verified: false,
          error: "Could not check payment reference",
          reference,
        },
        { status: 500 },
      );
    }

    if (existingPayment) {
      const { data: existingRequest } = await supabaseAdmin
        .from("requests")
        .select("*")
        .eq("id", existingPayment.request_id)
        .maybeSingle();

      return NextResponse.json({
        verified: true,
        alreadyRecorded: true,
        reference,
        amount: Number(existingPayment.amount || expectedAmount),
        currency: existingPayment.currency || expectedCurrency,
        isBoost: false,
        request: existingRequest,
      });
    }

    const { data: dj, error: djError } = await supabaseAdmin
      .from("djs")
      .select("id, stage_name, verification_status")
      .eq("id", djId)
      .maybeSingle();

    if (djError || !dj) {
      console.error("PAYMENT DJ CHECK ERROR:", djError);

      return NextResponse.json(
        {
          verified: false,
          error: "DJ profile not found",
          reference,
        },
        { status: 404 },
      );
    }

    const verificationStatus = cleanString(dj.verification_status).toLowerCase();

    if (verificationStatus === "removed" || verificationStatus === "rejected") {
      return NextResponse.json(
        {
          verified: false,
          error: "This DJ cannot accept paid requests right now",
          reference,
        },
        { status: 403 },
      );
    }

    const { data: activeRequests, error: activeRequestsError } =
      await supabaseAdmin
        .from("requests")
        .select("*")
        .eq("dj_id", djId)
        .in("status", ACTIVE_REQUEST_STATUSES);

    if (activeRequestsError) {
      console.error("ACTIVE REQUEST LOOKUP ERROR:", activeRequestsError);

      return NextResponse.json(
        {
          verified: false,
          error: "Could not check current request queue",
          reference,
        },
        { status: 500 },
      );
    }

    const normalizedSong = normalizeForMatch(song);
    const normalizedArtist = normalizeForMatch(artist);
    const activeRequestList = (activeRequests || []) as RequestRecord[];

    const duplicateById =
      duplicateRequestId && Number.isFinite(duplicateRequestId)
        ? activeRequestList.find(
            (requestItem) =>
              requestItem.id === duplicateRequestId &&
              normalizeForMatch(requestItem.song) === normalizedSong &&
              normalizeForMatch(requestItem.artist) === normalizedArtist,
          )
        : null;

    const duplicateBySongAndArtist = activeRequestList.find(
      (requestItem) =>
        normalizeForMatch(requestItem.song) === normalizedSong &&
        normalizeForMatch(requestItem.artist) === normalizedArtist,
    );

    const duplicateRequest = duplicateById || duplicateBySongAndArtist || null;

    let requestData: RequestRecord | null = null;
    let requestError: unknown = null;

    if (duplicateRequest) {
      const newTipTotal =
        Number(duplicateRequest.tip_amount || 0) + Number(expectedAmount || 0);

      const result = await supabaseAdmin
        .from("requests")
        .update({
          tip_amount: newTipTotal,
          artwork: duplicateRequest.artwork || artwork,
          album: duplicateRequest.album || album,
        })
        .eq("id", duplicateRequest.id)
        .select()
        .single();

      requestData = result.data as RequestRecord | null;
      requestError = result.error;
    } else {
      const result = await supabaseAdmin
        .from("requests")
        .insert([
          {
            dj_id: djId,
            name: guestName,
            song,
            artist,
            artwork,
            album,
            status: "pending",
            tip_amount: expectedAmount,
            tip_currency: expectedCurrency,
          },
        ])
        .select()
        .single();

      requestData = result.data as RequestRecord | null;
      requestError = result.error;
    }

    if (requestError || !requestData) {
      console.error("REQUEST SAVE ERROR:", requestError);

      return NextResponse.json(
        {
          verified: false,
          error: "Payment verified, but the request could not be saved",
          reference,
        },
        { status: 500 },
      );
    }

    const paidAmount = Number(expectedAmount || 0);
    const platformFee = Number(
      ((paidAmount * PLATFORM_FEE_PERCENT) / 100).toFixed(2),
    );
    const djAmount = Number((paidAmount - platformFee).toFixed(2));

    const { error: paymentInsertError } = await supabaseAdmin
      .from("payments")
      .insert([
        {
          dj_id: djId,
          request_id: requestData.id,
          guest_name: guestName,
          song,
          artist,
          amount: paidAmount,
          currency: expectedCurrency,
          status: "paid",
          provider: "paystack",
          provider_reference: reference,
          dj_amount: djAmount,
          platform_fee: platformFee,
        },
      ]);

    if (paymentInsertError) {
      console.error("PAYMENT INSERT ERROR:", paymentInsertError);

      return NextResponse.json(
        {
          verified: false,
          error: "Request saved, but payment record could not be stored",
          reference,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      verified: true,
      alreadyRecorded: false,
      reference,
      amount: paidAmount,
      currency: expectedCurrency,
      isBoost: Boolean(duplicateRequest),
      request: requestData,
    });
  } catch (error) {
    console.error("PAYSTACK REQUEST VERIFY ERROR:", error);

    return NextResponse.json(
      {
        verified: false,
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
