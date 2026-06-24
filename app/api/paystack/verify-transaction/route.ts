import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

type VerifyTransactionBody = {
  reference?: string;
  expectedAmount?: number;
  expectedCurrency?: string;
};

export async function POST(request: Request) {
  try {
    if (!paystackSecretKey) {
      return NextResponse.json(
        { verified: false, error: "Missing PAYSTACK_SECRET_KEY" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as VerifyTransactionBody;

    const reference = String(body.reference || "").trim();
    const expectedAmount = Number(body.expectedAmount || 0);
    const expectedCurrency = String(body.expectedCurrency || "").trim().toUpperCase();

    if (!reference) {
      return NextResponse.json(
        { verified: false, error: "Missing payment reference" },
        { status: 400 },
      );
    }

    if (!expectedAmount || expectedAmount < 1) {
      return NextResponse.json(
        { verified: false, error: "Invalid expected amount" },
        { status: 400 },
      );
    }

    if (!expectedCurrency) {
      return NextResponse.json(
        { verified: false, error: "Missing expected currency" },
        { status: 400 },
      );
    }

    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    const paystackResult = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackResult.status) {
      console.error("PAYSTACK VERIFY API ERROR:", paystackResult);

      return NextResponse.json(
        {
          verified: false,
          error: paystackResult.message || "Paystack verification failed",
        },
        { status: 400 },
      );
    }

    const transaction = paystackResult.data;
    const expectedAmountInSmallestUnit = Math.round(expectedAmount * 100);
    const paidAmount = Number(transaction?.amount || 0);
    const paidCurrency = String(transaction?.currency || "").toUpperCase();
    const paidStatus = String(transaction?.status || "").toLowerCase();

    if (paidStatus !== "success") {
      return NextResponse.json(
        {
          verified: false,
          error: "Payment was not successful",
          status: paidStatus,
        },
        { status: 400 },
      );
    }

    if (paidAmount !== expectedAmountInSmallestUnit) {
      return NextResponse.json(
        {
          verified: false,
          error: "Payment amount does not match request amount",
          expectedAmount: expectedAmountInSmallestUnit,
          paidAmount,
        },
        { status: 400 },
      );
    }

    if (paidCurrency !== expectedCurrency) {
      return NextResponse.json(
        {
          verified: false,
          error: "Payment currency does not match request currency",
          expectedCurrency,
          paidCurrency,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      verified: true,
      reference,
      amount: paidAmount,
      currency: paidCurrency,
      status: paidStatus,
      paidAt: transaction?.paid_at || null,
      channel: transaction?.channel || null,
    });
  } catch (error) {
    console.error("VERIFY PAYSTACK TRANSACTION ERROR:", error);

    return NextResponse.json(
      { verified: false, error: "Failed to verify Paystack transaction" },
      { status: 500 },
    );
  }
}
