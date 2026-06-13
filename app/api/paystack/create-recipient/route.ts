import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

function getRecipientType(currency: string, payoutMethod: string) {
  if (payoutMethod === "Mobile Money") return "mobile_money";
  if (currency === "GHS") return "ghipss";
  if (currency === "NGN") return "nuban";
  if (currency === "KES") return "kepss";
  if (currency === "ZAR") return "basa";
  return "";
}

function normalizeMobileMoneyProvider(provider: string) {
  const value = provider.toLowerCase();

  if (value.includes("mtn")) return "MTN";
  if (value.includes("telecel")) return "VOD";
  if (value.includes("vodafone")) return "VOD";
  if (value.includes("airteltigo")) return "ATL";
  if (value.includes("airtel")) return "ATL";
  if (value.includes("tigo")) return "ATL";

  return provider;
}

function normalizeAccountNumber(accountNumber: string) {
  return accountNumber.replace(/\s+/g, "").trim();
}

async function readPaystackResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      status: false,
      message: text || "Paystack returned an unreadable response",
    };
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Missing PAYSTACK_SECRET_KEY environment variable." },
        { status: 500 }
      );
    }

    if (!paystackSecretKey.startsWith("sk_test_")) {
      return NextResponse.json(
        {
          error:
            "Paystack secret key is not a test key. Use sk_test_ while Blackline is still in test mode.",
        },
        { status: 400 }
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
      return NextResponse.json({ error: "Missing DJ ID." }, { status: 400 });
    }

    if (!country) {
      return NextResponse.json({ error: "Missing country." }, { status: 400 });
    }

    if (!currency) {
      return NextResponse.json({ error: "Missing currency." }, { status: 400 });
    }

    if (!payoutMethod) {
      return NextResponse.json(
        { error: "Missing payout method." },
        { status: 400 }
      );
    }

    if (!payoutAccountName || !String(payoutAccountName).trim()) {
      return NextResponse.json(
        { error: "Missing account name." },
        { status: 400 }
      );
    }

    if (!payoutAccountNumber || !String(payoutAccountNumber).trim()) {
      return NextResponse.json(
        { error: "Missing account number." },
        { status: 400 }
      );
    }

    const recipientType = getRecipientType(currency, payoutMethod);

    if (!recipientType) {
      return NextResponse.json(
        {
          error:
            "This payout country/currency is not supported by Paystack transfers yet. Use manual payout or Stripe later.",
        },
        { status: 400 }
      );
    }

    const accountNumber = normalizeAccountNumber(String(payoutAccountNumber));
    const accountName = String(payoutAccountName).trim();

    let bankCode = "";

    if (payoutMethod === "Mobile Money") {
      if (!payoutProvider) {
        return NextResponse.json(
          { error: "Missing mobile money provider." },
          { status: 400 }
        );
      }

      bankCode = normalizeMobileMoneyProvider(String(payoutProvider));
    }

    if (payoutMethod === "Bank Transfer") {
      if (!payoutBankCode) {
        return NextResponse.json(
          { error: "Missing bank code for bank transfer." },
          { status: 400 }
        );
      }

      bankCode = String(payoutBankCode);
    }

    if (!bankCode) {
      return NextResponse.json(
        { error: "Missing Paystack bank/provider code." },
        { status: 400 }
      );
    }

    const paystackPayload: Record<string, string> = {
      type: recipientType,
      name: accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency,
    };

    if (payoutEmail && String(payoutEmail).trim()) {
      paystackPayload.email = String(payoutEmail).trim();
    }

    console.log("PAYSTACK RECIPIENT PAYLOAD:", paystackPayload);

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

    const paystackResult = await readPaystackResponse(paystackResponse);

    console.log("PAYSTACK RECIPIENT RESPONSE:", paystackResult);

    if (!paystackResponse.ok || !paystackResult.status) {
      return NextResponse.json(
        {
          error:
            paystackResult.message ||
            "Paystack failed to create transfer recipient.",
          paystackStatus: paystackResponse.status,
          paystackResponse: paystackResult,
          payloadSent: {
            ...paystackPayload,
            account_number: accountNumber,
          },
        },
        { status: 400 }
      );
    }

    const recipientCode = paystackResult.data?.recipient_code;

    if (!recipientCode) {
      return NextResponse.json(
        {
          error: "Paystack did not return a recipient code.",
          paystackResponse: paystackResult,
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: updatedDj, error: updateError } = await supabaseAdmin
      .from("djs")
      .update({
        country,
        preferred_currency: currency,
        payout_email: payoutEmail || null,
        payout_method: payoutMethod,
        payout_provider: payoutProvider,
        payout_account_name: accountName,
        payout_account_number: accountNumber,
        payout_bank_code: payoutMethod === "Bank Transfer" ? bankCode : null,
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
            "Paystack created the recipient, but Blackline could not save it.",
          recipientCode,
          supabaseError: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recipientCode,
      dj: updatedDj,
    });
  } catch (error) {
    console.error("CREATE RECIPIENT ROUTE CRASH:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error while creating Paystack recipient.",
      },
      { status: 500 }
    );
  }
}