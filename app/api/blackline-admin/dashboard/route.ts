import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const resendApiKey = process.env.RESEND_API_KEY;
const blacklineAlertEmail = process.env.BLACKLINE_ALERT_EMAIL;
const blacklineAlertFrom = process.env.BLACKLINE_ALERT_FROM;

const PLATFORM_FEE_PERCENT = 10;
const ADMIN_URL = "https://blacklinedj.com/blackline-admin/verifications";

type AlertEntityType = "dj" | "withdrawal";

type ResendEmailPayload = {
  subject: string;
  html: string;
  text: string;
};

type AlertPayload = {
  type?: AlertEntityType;
  entityType?: AlertEntityType;
  id?: number | string;
};
type SupabaseAdminClient = any;

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatAmount(currency: unknown, amount: unknown) {
  return `${String(currency || "GHS")} ${Number(amount || 0).toFixed(2)}`;
}

function cleanSlugForUrl(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isAlertEmailReady() {
  return Boolean(resendApiKey && blacklineAlertEmail && blacklineAlertFrom);
}

async function sendBlacklineAlertEmail(payload: ResendEmailPayload) {
  if (!isAlertEmailReady()) {
    console.error("BLACKLINE ALERT EMAIL SKIPPED: Missing Resend env vars");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: blacklineAlertFrom,
        to: [blacklineAlertEmail],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BLACKLINE ALERT EMAIL FAILED:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("BLACKLINE ALERT EMAIL ERROR:", error);
    return false;
  }
}

async function hasAlertAlreadyBeenSent({
  supabaseAdmin,
  actionType,
  entityType,
  entityId,
}: {
  supabaseAdmin: SupabaseAdminClient;
  actionType: string;
  entityType: AlertEntityType;
  entityId: number | string;
}) {
  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select("id")
    .eq("action_type", actionType)
    .eq("entity_type", entityType)
    .eq("entity_id", Number(entityId))
    .limit(1);

  if (error) {
    console.error("BLACKLINE ALERT DEDUPE CHECK ERROR:", error.message);
    return false;
  }

  return Boolean(data && data.length > 0);
}

async function markAlertAsSent({
  supabaseAdmin,
  actionType,
  entityType,
  entityId,
  description,
  metadata,
}: {
  supabaseAdmin: SupabaseAdminClient;
  actionType: string;
  entityType: AlertEntityType;
  entityId: number | string;
  description: string;
  metadata: Record<string, unknown>;
}) {
  const auditLogPayload = {
    action_type: actionType,
    entity_type: entityType,
    entity_id: Number(entityId),
    description,
    metadata,
  };

  const { error } = await (supabaseAdmin as any)
    .from("audit_logs")
    .insert([auditLogPayload]);

  if (error) {
    console.error("BLACKLINE ALERT AUDIT LOG ERROR:", error.message);
  }
}

async function sendDjVerificationAlert({
  supabaseAdmin,
  dj,
}: {
  supabaseAdmin: SupabaseAdminClient;
  dj: Record<string, unknown>;
}) {
  const djId = dj.id as number | string | undefined;

  if (!djId) return false;

  const status = String(dj.verification_status || "not_started");

  if (!["pending", "not_started"].includes(status)) {
    return false;
  }

  const actionType = "email_alert_new_dj_pending";

  const alreadySent = await hasAlertAlreadyBeenSent({
    supabaseAdmin,
    actionType,
    entityType: "dj",
    entityId: djId,
  });

  if (alreadySent) return false;

  const stageName = String(dj.stage_name || "Unknown DJ");
  const stageSlug = cleanSlugForUrl(dj.stage_slug || dj.stage_name);
  const publicRequestUrl = stageSlug
    ? `https://blacklinedj.com/${stageSlug}`
    : "Not available";
  const email = String(dj.email || "No email");
  const country = String(dj.country || "Not set");
  const currency = String(dj.preferred_currency || "Not set");

  const subject = `🎧 New DJ needs verification: ${stageName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2>🎧 New DJ needs verification</h2>
      <p>A DJ account needs review in the Blackline admin dashboard.</p>

      <div style="padding: 16px; border: 1px solid #ddd; border-radius: 12px; background: #f7f7f7;">
        <p><strong>DJ name:</strong> ${escapeHtml(stageName)}</p>
        <p><strong>Blackline link:</strong> ${escapeHtml(publicRequestUrl)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Country:</strong> ${escapeHtml(country)}</p>
        <p><strong>Preferred currency:</strong> ${escapeHtml(currency)}</p>
        <p><strong>Status:</strong> ${escapeHtml(status)}</p>
      </div>

      <p>
        <a href="${ADMIN_URL}" style="display:inline-block;padding:12px 18px;background:#8b5cf6;color:white;text-decoration:none;border-radius:10px;font-weight:bold;">
          Open Blackline Admin
        </a>
      </p>
    </div>
  `;

  const text = `
New DJ needs verification

DJ name: ${stageName}
Blackline link: ${publicRequestUrl}
Email: ${email}
Country: ${country}
Preferred currency: ${currency}
Status: ${status}

Open Blackline Admin:
${ADMIN_URL}
`;

  const sent = await sendBlacklineAlertEmail({ subject, html, text });

  if (sent) {
    await markAlertAsSent({
      supabaseAdmin,
      actionType,
      entityType: "dj",
      entityId: djId,
      description: `Email alert sent for DJ verification: ${stageName}`,
      metadata: {
        dj_id: djId,
        stage_name: stageName,
        stage_slug: stageSlug,
        public_request_url: publicRequestUrl,
        email,
        status,
      },
    });
  }

  return sent;
}

async function sendWithdrawalAlert({
  supabaseAdmin,
  withdrawal,
}: {
  supabaseAdmin: SupabaseAdminClient;
  withdrawal: Record<string, unknown>;
}) {
  const withdrawalId = withdrawal.id as number | string | undefined;

  if (!withdrawalId) return false;

  const status = String(withdrawal.status || "pending");

  if (!["pending", "approved"].includes(status)) {
    return false;
  }

  const actionType =
    status === "approved"
      ? "email_alert_withdrawal_approved"
      : "email_alert_withdrawal_pending";

  const alreadySent = await hasAlertAlreadyBeenSent({
    supabaseAdmin,
    actionType,
    entityType: "withdrawal",
    entityId: withdrawalId,
  });

  if (alreadySent) return false;

  const djName = String(withdrawal.dj_name || "Unknown DJ");
  const amount = formatAmount(withdrawal.currency, withdrawal.amount);
  const payoutMethod = String(withdrawal.payout_method || "Not set");
  const provider = String(withdrawal.provider || "Not set");
  const accountName = String(withdrawal.account_name || "Not set");
  const accountNumber = String(withdrawal.account_number || "Not set");

  const subject =
    status === "approved"
      ? `💸 Withdrawal approved: ${djName} - ${amount}`
      : `💸 New withdrawal request: ${djName} - ${amount}`;

  const heading =
    status === "approved"
      ? "Withdrawal approved — payment action needed"
      : "New withdrawal request needs review";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2>💸 ${escapeHtml(heading)}</h2>
      <p>A withdrawal needs attention in the Blackline admin dashboard.</p>

      <div style="padding: 16px; border: 1px solid #ddd; border-radius: 12px; background: #f7f7f7;">
        <p><strong>DJ:</strong> ${escapeHtml(djName)}</p>
        <p><strong>Amount:</strong> ${escapeHtml(amount)}</p>
        <p><strong>Status:</strong> ${escapeHtml(status)}</p>
        <p><strong>Payout method:</strong> ${escapeHtml(payoutMethod)}</p>
        <p><strong>Provider:</strong> ${escapeHtml(provider)}</p>
        <p><strong>Account name:</strong> ${escapeHtml(accountName)}</p>
        <p><strong>Account number:</strong> ${escapeHtml(accountNumber)}</p>
      </div>

      <p>
        <a href="${ADMIN_URL}" style="display:inline-block;padding:12px 18px;background:#8b5cf6;color:white;text-decoration:none;border-radius:10px;font-weight:bold;">
          Open Blackline Admin
        </a>
      </p>
    </div>
  `;

  const text = `
${heading}

DJ: ${djName}
Amount: ${amount}
Status: ${status}
Payout method: ${payoutMethod}
Provider: ${provider}
Account name: ${accountName}
Account number: ${accountNumber}

Open Blackline Admin:
${ADMIN_URL}
`;

  const sent = await sendBlacklineAlertEmail({ subject, html, text });

  if (sent) {
    await markAlertAsSent({
      supabaseAdmin,
      actionType,
      entityType: "withdrawal",
      entityId: withdrawalId,
      description: `Email alert sent for withdrawal: ${djName} - ${amount} (${status})`,
      metadata: {
        withdrawal_id: withdrawalId,
        dj_id: withdrawal.dj_id,
        dj_name: djName,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        status,
      },
    });
  }

  return sent;
}

async function sendOutstandingActionAlerts({
  supabaseAdmin,
  djs,
  withdrawals,
}: {
  supabaseAdmin: SupabaseAdminClient;
  djs: Record<string, unknown>[];
  withdrawals: Record<string, unknown>[];
}) {
  try {
    const pendingDjs = djs.filter((dj) =>
      ["pending", "not_started"].includes(
        String(dj.verification_status || "not_started")
      )
    );

    const actionableWithdrawals = withdrawals.filter((withdrawal) =>
      ["pending", "approved"].includes(String(withdrawal.status || ""))
    );

    for (const dj of pendingDjs) {
      await sendDjVerificationAlert({ supabaseAdmin, dj });
    }

    for (const withdrawal of actionableWithdrawals) {
      await sendWithdrawalAlert({ supabaseAdmin, withdrawal });
    }
  } catch (error) {
    console.error("BLACKLINE OUTSTANDING ALERT ERROR:", error);
  }
}

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

  const { data: bookingRequests, error: bookingRequestError } =
    await supabaseAdmin
      .from("booking_requests")
      .select("*")
      .order("created_at", { ascending: false });

  const { data: auditLogs, error: auditLogError } = await supabaseAdmin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (
    djError ||
    withdrawalError ||
    requestError ||
    bookingRequestError ||
    auditLogError
  ) {
    return NextResponse.json(
      {
        error:
          djError?.message ||
          withdrawalError?.message ||
          requestError?.message ||
          bookingRequestError?.message ||
          auditLogError?.message,
      },
      { status: 500 }
    );
  }

  await sendOutstandingActionAlerts({
    supabaseAdmin,
    djs: (allDjs || []) as Record<string, unknown>[],
    withdrawals: (withdrawals || []) as Record<string, unknown>[],
  });

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
    bookingRequests: bookingRequests || [],
    djEarnings,
    auditLogs: auditLogs || [],
  });
}

export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase admin environment variables" },
      { status: 500 }
    );
  }

  const body = (await request.json()) as AlertPayload;
  const type = body.entityType || body.type;
  const id = body.id;

  if (!type || !id) {
    return NextResponse.json(
      { error: "Missing alert type or id" },
      { status: 400 }
    );
  }

  if (!["dj", "withdrawal"].includes(type)) {
    return NextResponse.json({ error: "Invalid alert type" }, { status: 400 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  if (type === "dj") {
    const { data: dj, error } = await supabaseAdmin
      .from("djs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !dj) {
      return NextResponse.json(
        { error: error?.message || "DJ not found" },
        { status: 404 }
      );
    }

    const sent = await sendDjVerificationAlert({
      supabaseAdmin,
      dj: dj as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, sent });
  }

  if (type === "withdrawal") {
    const { data: withdrawal, error } = await supabaseAdmin
      .from("withdrawals")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !withdrawal) {
      return NextResponse.json(
        { error: error?.message || "Withdrawal not found" },
        { status: 404 }
      );
    }

    const sent = await sendWithdrawalAlert({
      supabaseAdmin,
      withdrawal: withdrawal as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, sent });
  }

  return NextResponse.json({ error: "Invalid alert type" }, { status: 400 });
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

    if (["pending", "approved"].includes(status)) {
      const { data: withdrawalAfterUpdate, error: withdrawalAfterFetchError } =
        await supabaseAdmin
          .from("withdrawals")
          .select("*")
          .eq("id", id)
          .single();

      if (!withdrawalAfterFetchError && withdrawalAfterUpdate) {
        await sendWithdrawalAlert({
          supabaseAdmin,
          withdrawal: withdrawalAfterUpdate as Record<string, unknown>,
        });
      }
    }

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

    const shouldForceOffline = ["removed", "rejected"].includes(status);

    const updatePayload = shouldForceOffline
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
            ? `DJ ${
                djBeforeUpdate.stage_name || "Unknown DJ"
              } was removed from Blackline and forced offline. Public page now shows DJ Not Found.`
            : status === "rejected"
            ? `DJ ${
                djBeforeUpdate.stage_name || "Unknown DJ"
              } was rejected and forced offline. Paid requests are now closed.`
            : `DJ ${
                djBeforeUpdate.stage_name || "Unknown DJ"
              } verification changed from ${
                djBeforeUpdate.verification_status || "not_started"
              } to ${status}`,
        metadata: {
          dj_id: djBeforeUpdate.id,
          stage_name: djBeforeUpdate.stage_name,
          email: djBeforeUpdate.email,
          previous_status: djBeforeUpdate.verification_status,
          new_status: status,
          previous_is_live: djBeforeUpdate.is_live,
          forced_offline: shouldForceOffline,
        },
      },
    ]);

    if (["pending", "not_started"].includes(status)) {
      const { data: djAfterUpdate, error: djAfterFetchError } =
        await supabaseAdmin.from("djs").select("*").eq("id", id).single();

      if (!djAfterFetchError && djAfterUpdate) {
        await sendDjVerificationAlert({
          supabaseAdmin,
          dj: djAfterUpdate as Record<string, unknown>,
        });
      }
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid update type" }, { status: 400 });
}
