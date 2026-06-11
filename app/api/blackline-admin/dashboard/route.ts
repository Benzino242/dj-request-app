import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase admin environment variables" },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data: djs, error: djError } = await supabaseAdmin
    .from("djs")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: withdrawals, error: withdrawalError } = await supabaseAdmin
    .from("withdrawals")
    .select("*")
    .order("created_at", { ascending: false });

  if (djError || withdrawalError) {
    return NextResponse.json(
      { error: djError?.message || withdrawalError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    djs: djs || [],
    withdrawals: withdrawals || [],
  });
}