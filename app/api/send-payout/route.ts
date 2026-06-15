import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

function createTransferReference(withdrawalId: number) {
  return `blackline_withdrawal_${withdrawalId}_${Date.now()}`;
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
    const { withdrawalId } = body;

    if (!withdrawalId) {
      return NextResponse.json(
        { error: "Missing withdrawal ID." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (withdrawalError || !withdrawal) {
      return NextResponse.json(
        {
          error: withdrawalError?.message || "Withdrawal request not found.",
        },
        { status: 404 }
      );
    }

    if (withdrawal.status !== "approved") {
      return NextResponse.json(
        {
          error:
            "Only approved withdrawals can be paid automatically. Approve this withdrawal first.",
        },
        { status: 400 }
      );
    }

    if (withdrawal.paystack_transfer_code) {
      return NextResponse.json(
        {
          error: "This withdrawal already has a Paystack transfer code.",
        },
        { status: 400 }
      );
    }

    const { data: dj, error: djError } = await supabaseAdmin
      .from("djs")
      .select("*")
      .eq("id", withdrawal.dj_id)
      .single();

    if (djError || !dj) {
      return NextResponse.json(
        {
          error: djError?.message || "DJ account not found.",
        },
        { status: 404 }
      );
    }

    if (!dj.paystack_recipient_code) {
      return NextResponse.json(
        {
          error:
            "This DJ does not have a Paystack recipient code. Ask the DJ to connect their payout account first.",
        },
        { status: 400 }
      );
    }

    const amount = Number(withdrawal.amount || 0);

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid withdrawal amount." },
        { status: 400 }
      );
    }

    const transferReference = createTransferReference(withdrawal.id);

    const paystackPayload = {
      source: "balance",
      amount: Math.round(amount * 100),
      recipient: dj.paystack_recipient_code,
      reason: `Blackline withdrawal payout for ${
        withdrawal.dj_name || dj.stage_name || "DJ"
      }`,
      reference: transferReference,
    };

    console.log("PAYSTACK TRANSFER PAYLOAD:", paystackPayload);

    const paystackResponse = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });

    const paystackResult = await readPaystackResponse(paystackResponse);

    console.log("PAYSTACK TRANSFER RESPONSE:", paystackResult);

    if (!paystackResponse.ok || !paystackResult.status) {
      await supabaseAdmin
        .from("withdrawals")
        .update({
          paystack_transfer_reference: transferReference,
          paystack_transfer_status: "failed",
          paystack_transfer_response: paystackResult,
        })
        .eq("id", withdrawal.id);

      return NextResponse.json(
        {
          error:
            paystackResult.message || "Paystack failed to send the payout.",
          paystackStatus: paystackResponse.status,
          paystackResponse: paystackResult,
          payloadSent: paystackPayload,
        },
        { status: 400 }
      );
    }

    const transferData = paystackResult.data || {};
    const transferCode = transferData.transfer_code || null;
    const transferStatus = transferData.status || "pending";

    const shouldMarkPaid =
      transferStatus === "success" ||
      transferStatus === "successful" ||
      transferStatus === "pending" ||
      transferStatus === "otp";

    const { error: updateError } = await supabaseAdmin
      .from("withdrawals")
      .update({
        status: shouldMarkPaid ? "paid" : withdrawal.status,
        paystack_transfer_code: transferCode,
        paystack_transfer_reference: transferReference,
        paystack_transfer_status: transferStatus,
        paystack_transfer_response: paystackResult,
        paid_at: shouldMarkPaid ? new Date().toISOString() : null,
      })
      .eq("id", withdrawal.id);

    if (updateError) {
      return NextResponse.json(
        {
          error:
            "Paystack transfer was created, but Blackline could not update the withdrawal.",
          transferCode,
          supabaseError: updateError.message,
        },
        { status: 500 }
      );
    }

    await supabaseAdmin.from("audit_logs").insert([
      {
        action_type: "paystack_payout",
        entity_type: "withdrawal",
        entity_id: withdrawal.id,
        description: `Paystack test payout sent for ${
          withdrawal.dj_name || dj.stage_name || "Unknown DJ"
        } — ${withdrawal.currency || "GHS"} ${Number(
          withdrawal.amount || 0
        ).toFixed(2)}`,
        metadata: {
          dj_id: withdrawal.dj_id,
          dj_name: withdrawal.dj_name || dj.stage_name,
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          previous_status: withdrawal.status,
          new_status: shouldMarkPaid ? "paid" : withdrawal.status,
          transfer_code: transferCode,
          transfer_reference: transferReference,
          transfer_status: transferStatus,
          paystack_response: paystackResult,
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      transferCode,
      transferReference,
      transferStatus,
      paystackResponse: paystackResult,
    });
  } catch (error) {
    console.error("SEND PAYOUT ROUTE CRASH:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error while sending Paystack payout.",
      },
      { status: 500 }
    );
  }
}