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

export async function PATCH(request: Request) {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase admin environment variables" },
        { status: 500 }
      );
    }
  
    const body = await request.json();
    const { type, id, status } = body;
  
    if (!type || !id || !status) {
      return NextResponse.json(
        { error: "Missing type, id, or status" },
        { status: 400 }
      );
    }
  
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  
    if (type === "withdrawal") {
      const { error } = await supabaseAdmin
        .from("withdrawals")
        .update({ status })
        .eq("id", id);
  
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
  
      return NextResponse.json({ success: true });
    }
  
    if (type === "dj") {
      const { error } = await supabaseAdmin
        .from("djs")
        .update({ verification_status: status })
        .eq("id", id);
  
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
  
      return NextResponse.json({ success: true });
    }
  
    return NextResponse.json({ error: "Invalid update type" }, { status: 400 });
  }