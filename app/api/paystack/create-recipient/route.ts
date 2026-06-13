import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

function getPaystackRecipientType(currency: string, payoutMethod: string) {
  if (payoutMethod === "Mobile Money") return "mobile_money";

  if (currency === "GHS") return "ghipss";
  if (currency === "NGN") return "nuban";
  if (currency === "KES") return "kepss";
  if (currency === "ZAR") return "basa";

  return "";
}

export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey || !paystackSecretKey) {
    return NextResponse.json(
      { error: "Missing Supabase or Paystack environment variables" },
      { status: 500 }
    );
  }

  const body = await request.json();

  const {
    djId,
    country,
    currency,
    payoutMethod,
    payoutProvider,
    payoutAccountName,
    payoutAccountNumber,
    payoutBankCode,
    payoutEmail,
  } = body;

  if (!djId) {
    return NextResponse.json({ error: "Missing DJ ID" }, { status: 400 });
  }

  if (!currency || !payoutMethod || !payoutAccountName || !payoutAccountNumber) {
    return NextResponse.json(
      { error: "Missing payout account details" },
      { status: 400 }
    );
  }

  const recipientType = getPaystackRecipientType(currency, payoutMethod);

  if (!recipientType) {
    return NextResponse.json(
      {
        error:
          "This currency is not supported by Paystack transfers yet. Use manual payout or Stripe later.",
      },
      { status: 400 }
    );
  }

  if (payoutMethod === "Bank Transfer" && !payoutBankCode) {
    return NextResponse.json(
      { error: "Missing bank code for bank transfer" },
      { status: 400 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const paystackPayload: Record<string, string> = {
    type: recipientType,
    name: payoutAccountName,
    account_number: payoutAccountNumber,
    currency,
  };

  if (payoutMethod === "Bank Transfer") {
    paystackPayload.bank_code = payoutBankCode;
  }

  if (payoutMethod === "Mobile Money") {
    paystackPayload.bank_code = payoutProvider;
  }

  if (payoutEmail) {
    paystackPayload.email = payoutEmail;
  }

  const paystackResponse = await fetch(
    "https://api.paystack.co/transferrecipient",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    }
  );

  const paystackResult = await paystackResponse.json();

  if (!paystackResponse.ok || !paystackResult.status) {
    console.error("PAYSTACK CREATE RECIPIENT ERROR:", paystackResult);

    return NextResponse.json(
      {
        error:
          paystackResult.message ||
          "Paystack failed to create transfer recipient",
        details: paystackResult,
      },
      { status: 400 }
    );
  }

  const recipientCode = paystackResult.data?.recipient_code;

  if (!recipientCode) {
    return NextResponse.json(
      { error: "Paystack did not return a recipient code" },
      { status: 400 }
    );
  }

  const { data: updatedDj, error: updateError } = await supabaseAdmin
    .from("djs")
    .update({
      country,
      preferred_currency: currency,
      payout_email: payoutEmail,
      payout_method: payoutMethod,
      payout_provider: payoutProvider,
      payout_account_name: payoutAccountName,
      payout_account_number: payoutAccountNumber,
      payout_bank_code: payoutBankCode || null,
      payout_status: "Active",
      paystack_recipient_code: recipientCode,
      paystack_recipient_response: paystackResult,
    })
    .eq("id", djId)
    .select()
    .single();

  if (updateError) {
    console.error("SUPABASE RECIPIENT SAVE ERROR:", updateError);

    return NextResponse.json(
      {
        error:
          "Paystack recipient was created, but saving it to Blackline failed.",
        details: updateError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    recipientCode,
    dj: updatedDj,
  });
}