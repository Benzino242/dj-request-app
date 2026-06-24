import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PLATFORM_FEE_PERCENT = 10;

export async function GET() {
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase admin environment variables" },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data: allDjs, error: djError } = await supabaseAdmin
    .from("djs")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: withdrawals, error: withdrawalError } = await supabaseAdmin
    .from("withdrawals")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: requests, error: requestError } = await supabaseAdmin
    .from("requests")
    .select("id, dj_id, tip_amount, tip_currency, status");

  const { data: auditLogs, error: auditLogError } = await supabaseAdmin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (djError || withdrawalError || requestError || auditLogError) {
    return NextResponse.json(
      {
        error:
          djError?.message ||
          withdrawalError?.message ||
          requestError?.message ||
          auditLogError?.message,
      },
      { status: 500 }
    );
  }

  const djs = (allDjs || []).filter(
    (dj) => dj.verification_status !== "removed"
  );

  const djEarnings = (allDjs || []).map((dj) => {
    const djRequests = (requests || []).filter(
      (request) => request.dj_id === dj.id
    );

    const djWithdrawals = (withdrawals || []).filter(
      (withdrawal) => withdrawal.dj_id === dj.id
    );

    const grossRevenue = djRequests.reduce(
      (sum, request) => sum + Number(request.tip_amount || 0),
      0
    );

    const platformRevenue = grossRevenue * (PLATFORM_FEE_PERCENT / 100);
    const djRevenue = grossRevenue - platformRevenue;

    const activeWithdrawals = djWithdrawals.filter((withdrawal) =>
      ["pending", "approved", "paid"].includes(withdrawal.status || "")
    );

    const totalWithdrawals = activeWithdrawals.reduce(
      (sum, withdrawal) => sum + Number(withdrawal.amount || 0),
      0
    );

    const pendingWithdrawals = djWithdrawals
      .filter((withdrawal) => withdrawal.status === "pending")
      .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);

    const approvedWithdrawals = djWithdrawals
      .filter((withdrawal) => withdrawal.status === "approved")
      .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);

    const paidWithdrawals = djWithdrawals
      .filter((withdrawal) => withdrawal.status === "paid")
      .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);

    const rejectedWithdrawals = djWithdrawals
      .filter((withdrawal) => withdrawal.status === "rejected")
      .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);

    const availableBalance = djRevenue - totalWithdrawals;

    return {
      dj_id: dj.id,
      stage_name: dj.stage_name,
      currency: dj.preferred_currency || "GHS",
      grossRevenue,
      platformRevenue,
      djRevenue,
      totalWithdrawals,
      pendingWithdrawals,
      approvedWithdrawals,
      paidWithdrawals,
      rejectedWithdrawals,
      availableBalance,
    };
  });

  return NextResponse.json({
    djs: allDjs || [],
    withdrawals: withdrawals || [],
    djEarnings,
    auditLogs: auditLogs || [],
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
    const { data: withdrawalBeforeUpdate, error: withdrawalFetchError } =
      await supabaseAdmin
        .from("withdrawals")
        .select("*")
        .eq("id", id)
        .single();

    if (withdrawalFetchError || !withdrawalBeforeUpdate) {
      return NextResponse.json(
        {
          error:
            withdrawalFetchError?.message || "Withdrawal request not found",
        },
        { status: 404 }
      );
    }

    if (status === "approved") {
      const { data: requests, error: requestError } = await supabaseAdmin
        .from("requests")
        .select("id, dj_id, tip_amount, tip_currency, status")
        .eq("dj_id", withdrawalBeforeUpdate.dj_id);

      const { data: djWithdrawals, error: withdrawalError } =
        await supabaseAdmin
          .from("withdrawals")
          .select("*")
          .eq("dj_id", withdrawalBeforeUpdate.dj_id);

      if (requestError || withdrawalError) {
        return NextResponse.json(
          {
            error: requestError?.message || withdrawalError?.message,
          },
          { status: 500 }
        );
      }

      const grossRevenue = (requests || []).reduce(
        (sum, request) => sum + Number(request.tip_amount || 0),
        0
      );

      const platformRevenue = grossRevenue * (PLATFORM_FEE_PERCENT / 100);
      const djRevenue = grossRevenue - platformRevenue;

      const activeWithdrawals = (djWithdrawals || []).filter(
        (item) =>
          item.id !== withdrawalBeforeUpdate.id &&
          ["pending", "approved", "paid"].includes(item.status || "")
      );

      const totalWithdrawals = activeWithdrawals.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

      const availableBalance = djRevenue - totalWithdrawals;

      if (Number(withdrawalBeforeUpdate.amount || 0) > availableBalance) {
        return NextResponse.json(
          {
            error: `Insufficient DJ balance. Available balance is ${availableBalance.toFixed(
              2
            )}, but withdrawal request is ${Number(
              withdrawalBeforeUpdate.amount || 0
            ).toFixed(2)}.`,
          },
          { status: 400 }
        );
      }
    }

    const { error } = await supabaseAdmin
      .from("withdrawals")
      .update({ status })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabaseAdmin.from("audit_logs").insert([
      {
        action_type: status,
        entity_type: "withdrawal",
        entity_id: id,
        description: `Withdrawal for ${
          withdrawalBeforeUpdate.dj_name || "Unknown DJ"
        } changed from ${
          withdrawalBeforeUpdate.status || "unknown"
        } to ${status}`,
        metadata: {
          dj_id: withdrawalBeforeUpdate.dj_id,
          dj_name: withdrawalBeforeUpdate.dj_name,
          amount: withdrawalBeforeUpdate.amount,
          currency: withdrawalBeforeUpdate.currency,
          previous_status: withdrawalBeforeUpdate.status,
          new_status: status,
        },
      },
    ]);

    return NextResponse.json({ success: true });
  }

  if (type === "dj") {
    const { data: djBeforeUpdate, error: djFetchError } = await supabaseAdmin
      .from("djs")
      .select("*")
      .eq("id", id)
      .single();

    if (djFetchError || !djBeforeUpdate) {
      return NextResponse.json(
        { error: djFetchError?.message || "DJ not found" },
        { status: 404 }
      );
    }

    const updatePayload =
      status === "removed"
        ? { verification_status: status, is_live: false }
        : { verification_status: status };

    const { error } = await supabaseAdmin
      .from("djs")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabaseAdmin.from("audit_logs").insert([
      {
        action_type: status,
        entity_type: "dj",
        entity_id: id,
        description:
          status === "removed"
            ? `DJ ${djBeforeUpdate.stage_name || "Unknown DJ"} was removed from Blackline`
            : `DJ ${djBeforeUpdate.stage_name || "Unknown DJ"} verification changed from ${
                djBeforeUpdate.verification_status || "not_started"
              } to ${status}`,
        metadata: {
          dj_id: djBeforeUpdate.id,
          stage_name: djBeforeUpdate.stage_name,
          email: djBeforeUpdate.email,
          previous_status: djBeforeUpdate.verification_status,
          new_status: status,
        },
      },
    ]);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid update type" }, { status: 400 });
}
