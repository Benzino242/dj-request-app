import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

function isRealBank(bank: { name?: string; type?: string }) {
  const name = (bank.name || "").toLowerCase();
  const type = (bank.type || "").toLowerCase();

  const excludedNames = [
    "mtn",
    "airteltigo",
    "telecel",
    "vodafone",
    "mpesa",
    "m-pesa",
    "paystack",
    "bank of ghana",
  ];

  if (type.includes("mobile")) return false;

  return !excludedNames.some((item) => name.includes(item));
}

export async function GET(request: Request) {
  if (!paystackSecretKey) {
    return NextResponse.json(
      { error: "Missing Paystack secret key" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const currency = searchParams.get("currency") || "GHS";

  const response = await fetch(
    `https://api.paystack.co/bank?currency=${currency}`,
    {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (!response.ok || !result.status) {
    return NextResponse.json(
      {
        error: result.message || "Failed to load Paystack banks",
        details: result,
      },
      { status: 400 }
    );
  }

  const banks = (result.data || []).filter(isRealBank);

  return NextResponse.json({
    banks,
  });
}