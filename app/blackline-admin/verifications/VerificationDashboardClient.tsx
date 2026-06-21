"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

type DJ = {
  id: number;
  stage_name: string;
  email: string | null;
  country?: string | null;
  preferred_currency?: string | null;
  payout_email?: string | null;
  payout_method?: string | null;
  payout_status?: string | null;
  payout_provider?: string | null;
  payout_account_name?: string | null;
  payout_account_number?: string | null;
  paystack_recipient_code?: string | null;
  verification_status?: string | null;
  profile_image?: string | null;
};

type Withdrawal = {
  id: number;
  dj_id?: number | null;
  dj_name?: string | null;
  amount: number;
  currency?: string | null;
  payout_method?: string | null;
  account_name?: string | null;
  account_number?: string | null;
  provider?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type DjEarning = {
  dj_id: number;
  stage_name: string;
  currency: string;
  grossRevenue: number;
  platformRevenue: number;
  djRevenue: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  paidWithdrawals: number;
  rejectedWithdrawals: number;
  availableBalance: number;
};

type AuditLog = {
  id: number;
  action_type: string;
  entity_type: string;
  entity_id: number;
  description: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

type ConfirmAction =
  | {
      kind: "dj";
      id: number;
      status: "verified" | "rejected" | "pending" | "not_started";
      title: string;
      message: string;
      confirmText: string;
      buttonClass: string;
    }
  | {
      kind: "withdrawal";
      id: number;
      status: "approved" | "rejected" | "paid" | "pending";
      title: string;
      message: string;
      confirmText: string;
      buttonClass: string;
    };

export default function VerificationDashboardClient() {
  const [djs, setDjs] = useState<DJ[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [djEarnings, setDjEarnings] = useState<DjEarning[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [withdrawalActionLoadingId, setWithdrawalActionLoadingId] =
    useState<number | null>(null);

  const [withdrawalSearch, setWithdrawalSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [expandedWithdrawalIds, setExpandedWithdrawalIds] = useState<number[]>([]);
  const isFetchingDashboardRef = useRef(false);

  async function fetchDashboardData(showLoader = false) {
    if (isFetchingDashboardRef.current) {
      return;
    }

    isFetchingDashboardRef.current = true;

    if (showLoader) {
      setLoading(true);
    }

    try {
      const response = await fetch(
        `/api/blackline-admin/dashboard?t=${Date.now()}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("BLACKLINE DASHBOARD API ERROR:", result);
        alert(result.error || "Failed to load Blackline dashboard data");
        return;
      }

      setDjs((result.djs || []) as DJ[]);
      setWithdrawals((result.withdrawals || []) as Withdrawal[]);
      setDjEarnings((result.djEarnings || []) as DjEarning[]);
      setAuditLogs((result.auditLogs || []) as AuditLog[]);
    } catch (error) {
      console.error("BLACKLINE DASHBOARD FETCH ERROR:", error);
      alert("Failed to connect to Blackline dashboard API");
    } finally {
      isFetchingDashboardRef.current = false;

      if (showLoader) {
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchDashboardData(true);
  
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 10000);
  
    const channel = supabase
      .channel("blackline-verification-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "withdrawals",
        },
        () => {
          fetchDashboardData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "djs",
        },
        () => {
          fetchDashboardData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        () => {
          fetchDashboardData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "audit_logs",
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();
  
    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const pendingCount = djs.filter(
    (dj) => dj.verification_status === "pending"
  ).length;

  const verifiedCount = djs.filter(
    (dj) => dj.verification_status === "verified"
  ).length;

  const rejectedCount = djs.filter(
    (dj) => dj.verification_status === "rejected"
  ).length;

  const totalCount = djs.length;

  const pendingWithdrawals = withdrawals.filter(
    (withdrawal) => withdrawal.status === "pending"
  ).length;

  const approvedWithdrawals = withdrawals.filter(
    (withdrawal) => withdrawal.status === "approved"
  ).length;

  const paidWithdrawals = withdrawals.filter(
    (withdrawal) => withdrawal.status === "paid"
  ).length;

  const rejectedWithdrawals = withdrawals.filter(
    (withdrawal) => withdrawal.status === "rejected"
  ).length;

  const totalGrossRevenue = djEarnings.reduce(
    (sum, item) => sum + Number(item.grossRevenue || 0),
    0
  );

  const totalPlatformRevenue = djEarnings.reduce(
    (sum, item) => sum + Number(item.platformRevenue || 0),
    0
  );

  const totalDjRevenue = djEarnings.reduce(
    (sum, item) => sum + Number(item.djRevenue || 0),
    0
  );

  const totalAvailableBalance = djEarnings.reduce(
    (sum, item) => sum + Number(item.availableBalance || 0),
    0
  );

  const dashboardCurrency = djEarnings[0]?.currency || "GHS";

  const sortedDjs = [...djs].sort((a, b) => {
    function getDjPriority(dj: DJ) {
      const djWithdrawals = withdrawals.filter(
        (withdrawal) => withdrawal.dj_id === dj.id
      );
  
      const hasApprovedWithdrawal = djWithdrawals.some(
        (withdrawal) => withdrawal.status === "approved"
      );
  
      const hasPendingWithdrawal = djWithdrawals.some(
        (withdrawal) => withdrawal.status === "pending"
      );
  
      if (dj.verification_status === "pending") return 1;
      if (hasApprovedWithdrawal) return 2;
      if (hasPendingWithdrawal) return 3;
      if (dj.verification_status === "verified") return 4;
      if (dj.verification_status === "not_started") return 5;
      if (dj.verification_status === "rejected") return 6;
  
      return 7;
    }
  
    return getDjPriority(a) - getDjPriority(b);
  });

  const sortedWithdrawals = withdrawals
    .filter((withdrawal) =>
      (withdrawal.dj_name || "")
        .toLowerCase()
        .includes(withdrawalSearch.toLowerCase())
    )
    .sort((a, b) => {
      const priority: Record<string, number> = {
        pending: 1,
        approved: 2,
        rejected: 3,
        paid: 4,
      };

      return (
        (priority[a.status || "pending"] || 5) -
        (priority[b.status || "pending"] || 5)
      );
    });

  async function updateVerificationStatus(
    djId: number,
    status: "verified" | "rejected" | "pending" | "not_started"
  ) {
    setActionLoadingId(djId);

    const response = await fetch("/api/blackline-admin/dashboard", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "dj",
        id: djId,
        status,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("DJ VERIFICATION UPDATE ERROR:", result);
      alert(result.error || "Failed to update verification status");
      setActionLoadingId(null);
      return;
    }

    await fetchDashboardData();
    setActionLoadingId(null);
  }

  async function updateWithdrawalStatus(
    withdrawalId: number,
    status: "approved" | "rejected" | "paid" | "pending"
  ) {
    setWithdrawalActionLoadingId(withdrawalId);

    const response = await fetch("/api/blackline-admin/dashboard", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "withdrawal",
        id: withdrawalId,
        status,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("WITHDRAWAL UPDATE ERROR:", result);
      alert(result.error || "Failed to update withdrawal status");
      setWithdrawalActionLoadingId(null);
      return;
    }

    await fetchDashboardData();
    setWithdrawalActionLoadingId(null);
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
  
    const currentScrollY =
      typeof window !== "undefined" ? window.scrollY : 0;
  
    setConfirmLoading(true);
  
    if (confirmAction.kind === "dj") {
      await updateVerificationStatus(confirmAction.id, confirmAction.status);
    }
  
    if (confirmAction.kind === "withdrawal") {
      await updateWithdrawalStatus(confirmAction.id, confirmAction.status);
    }
  
    setConfirmLoading(false);
    setConfirmAction(null);
  
    setTimeout(() => {
      window.scrollTo({
        top: currentScrollY,
        behavior: "instant",
      });
    }, 50);
  }

  function withdrawalStatusColor(status?: string | null) {
    if (status === "paid") return "text-green-400";
    if (status === "approved") return "text-cyan-400";
    if (status === "rejected") return "text-red-400";
    return "text-yellow-400";
  }

  function withdrawalStatusLabel(status?: string | null) {
    if (status === "paid") return "🟢 Paid";
    if (status === "approved") return "🔵 Approved";
    if (status === "rejected") return "🔴 Rejected";
    return "🟡 Pending";
  }

  function auditLogIcon(entityType?: string | null) {
    if (entityType === "withdrawal") return "💸";
    if (entityType === "dj") return "🎧";
    return "📝";
  }
  
  function getWithdrawalAuditLogs(withdrawalId: number) {
    return auditLogs
      .filter(
        (log) =>
          log.entity_type === "withdrawal" &&
          log.entity_id === withdrawalId
      )
      .slice(0, 10);
  }

  function toggleWithdrawalDetails(withdrawalId: number) {
    setExpandedWithdrawalIds((currentIds) =>
      currentIds.includes(withdrawalId)
        ? currentIds.filter((id) => id !== withdrawalId)
        : [...currentIds, withdrawalId]
    );
  }

  function shouldShowWithdrawalDetails(withdrawal: Withdrawal) {
    return (
      withdrawal.status === "pending" ||
      withdrawal.status === "approved" ||
      expandedWithdrawalIds.includes(withdrawal.id)
    );
  }

  function exportWithdrawalsCSV() {
    const headers = [
      "DJ Name",
      "Amount",
      "Currency",
      "Payout Method",
      "Provider",
      "Account Name",
      "Account Number",
      "Status",
      "Requested At",
    ];

    const rows = sortedWithdrawals.map((withdrawal) => [
      withdrawal.dj_name || "",
      withdrawal.amount,
      withdrawal.currency || "",
      withdrawal.payout_method || "",
      withdrawal.provider || "",
      withdrawal.account_name || "",
      withdrawal.account_number || "",
      withdrawal.status || "",
      withdrawal.created_at
        ? new Date(withdrawal.created_at).toLocaleString()
        : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `blackline-withdrawals-${new Date()
      .toISOString()
      .split("T")[0]}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading verification dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-5xl font-black text-purple-500 mb-3">
        Blackline Admin Dashboard
      </h1>

      <p className="text-zinc-400 mb-10">
        Manage DJ verification, earnings, payouts, and withdrawal activity.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-400 text-sm">Pending DJs</p>
          <p className="text-2xl font-black text-yellow-400">{pendingCount}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-400 text-sm">Verified DJs</p>
          <p className="text-2xl font-black text-green-400">{verifiedCount}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-400 text-sm">Rejected DJs</p>
          <p className="text-2xl font-black text-red-400">{rejectedCount}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-400 text-sm">Total DJs</p>
          <p className="text-2xl font-black text-white">{totalCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-400 text-sm">Total Gross Revenue</p>
          <p className="text-2xl font-black text-green-400">
            {dashboardCurrency} {totalGrossRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-400 text-sm">Platform Revenue</p>
          <p className="text-2xl font-black text-purple-400">
            {dashboardCurrency} {totalPlatformRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-400 text-sm">DJ Earnings</p>
          <p className="text-2xl font-black text-cyan-400">
            {dashboardCurrency} {totalDjRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-400 text-sm">Available Balances</p>
          <p className="text-2xl font-black text-yellow-400">
            {dashboardCurrency} {totalAvailableBalance.toFixed(2)}
          </p>
        </div>
      </div>

      <section className="mb-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-3xl font-black">Recent Activity</h2>
            <p className="text-zinc-500 text-sm mt-1">
              Latest DJ verification and withdrawal changes.
            </p>
          </div>

          <p className="text-sm text-zinc-500">
            Showing latest {auditLogs.length} entries
          </p>
        </div>

        <div className="bg-zinc-900 border border-purple-900/60 rounded-2xl overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="p-5">
              <p className="text-zinc-500">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-zinc-800">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-5 hover:bg-purple-950/20 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-600/40 flex items-center justify-center shrink-0">
                      {auditLogIcon(log.entity_type)}
                    </div>

                    <div className="flex-1">
                      <p className="text-white font-bold leading-relaxed">
                        {log.description}
                      </p>

                      <p className="text-sm text-zinc-500 mt-2">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString()
                          : "Unknown time"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-3xl font-black mb-5">DJ Verification Management</h2>

        <div className="space-y-5">
          {sortedDjs.map((dj) => {
            const earnings = djEarnings.find((item) => item.dj_id === dj.id);

            return (
              <div
                key={dj.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                    <div className="flex items-start gap-4">
                      {dj.profile_image ? (
                        <img
                          src={dj.profile_image}
                          alt={dj.stage_name}
                          className="w-20 h-20 rounded-full object-cover border-2 border-purple-600"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-500 text-xs text-center">
                          No Image
                        </div>
                      )}

                      <div>
                        <h2 className="text-2xl font-bold">{dj.stage_name}</h2>

                        <p className="text-zinc-400 mt-1">
                          {dj.email || "No email"}
                        </p>

                        <p className="text-sm text-zinc-500 mt-2">
                          {dj.country || "No country"} •{" "}
                          {dj.preferred_currency || "No currency"} •{" "}
                          {dj.payout_method || "No payout method"}
                        </p>

                        <p className="text-sm text-zinc-500 mt-1">
                          Payout email: {dj.payout_email || "Not provided"}
                        </p>

                        <div className="mt-4 grid md:grid-cols-2 gap-3">
  <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
    <p className="text-xs text-zinc-500">Payout Status</p>
    <p
      className={`font-bold ${
        dj.payout_status === "Active"
          ? "text-green-400"
          : "text-red-400"
      }`}
    >
      {dj.payout_status === "Active" ? "🟢 Active" : "🔴 Not Connected"}
    </p>
  </div>

  <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
    <p className="text-xs text-zinc-500">Provider</p>
    <p className="font-bold text-white">
      {dj.payout_provider || "Not provided"}
    </p>
  </div>

  <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
    <p className="text-xs text-zinc-500">Account Name</p>
    <p className="font-bold text-white">
      {dj.payout_account_name || "Not provided"}
    </p>
  </div>

  <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
    <p className="text-xs text-zinc-500">Account Number</p>
    <p className="font-bold text-white">
      {dj.payout_account_number || "Not provided"}
    </p>
  </div>

  <div className="bg-black/40 border border-zinc-800 rounded-xl p-3 md:col-span-2">
    <p className="text-xs text-zinc-500">Paystack Recipient Code</p>
    <p className="font-bold text-zinc-300">
      {dj.paystack_recipient_code || "Not created yet"}
    </p>
  </div>
</div>

                        <p className="mt-3 font-bold">
                          Status:{" "}
                          <span
                            className={
                              dj.verification_status === "verified"
                                ? "text-green-400"
                                : dj.verification_status === "pending"
                                ? "text-yellow-400"
                                : dj.verification_status === "rejected"
                                ? "text-red-400"
                                : "text-zinc-400"
                            }
                          >
                            {dj.verification_status === "verified"
                              ? "🟢 Verified"
                              : dj.verification_status === "pending"
                              ? "🟡 Pending Verification"
                              : dj.verification_status === "rejected"
                              ? "🔴 Rejected"
                              : "⚪ Not Started"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {dj.verification_status !== "verified" && (
                        <button
                          disabled={actionLoadingId === dj.id}
                          onClick={() =>
                            setConfirmAction({
                              kind: "dj",
                              id: dj.id,
                              status: "verified",
                              title: "Verify DJ",
                              message: `Are you sure you want to verify ${dj.stage_name}?`,
                              confirmText: "Verify DJ",
                              buttonClass: "bg-green-600 hover:bg-green-700",
                            })
                          }
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl disabled:opacity-50"
                        >
                          Verify
                        </button>
                      )}

                      {dj.verification_status !== "rejected" && (
                        <button
                          disabled={actionLoadingId === dj.id}
                          onClick={() =>
                            setConfirmAction({
                              kind: "dj",
                              id: dj.id,
                              status: "rejected",
                              title: "Reject DJ",
                              message: `Are you sure you want to reject ${dj.stage_name}?`,
                              confirmText: "Reject DJ",
                              buttonClass: "bg-red-600 hover:bg-red-700",
                            })
                          }
                          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}

                      {dj.verification_status !== "pending" &&
                        dj.verification_status !== "not_started" && (
                          <button
                            disabled={actionLoadingId === dj.id}
                            onClick={() =>
                              setConfirmAction({
                                kind: "dj",
                                id: dj.id,
                                status: "pending",
                                title: "Mark DJ as Pending",
                                message: `Are you sure you want to mark ${dj.stage_name} as pending verification?`,
                                confirmText: "Mark Pending",
                                buttonClass:
                                  "bg-yellow-500 hover:bg-yellow-600 text-black",
                              })
                            }
                            className="bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-2 rounded-xl disabled:opacity-50"
                          >
                            Mark Pending
                          </button>
                        )}
                    </div>
                  </div>

                  {earnings && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">Gross</p>
                        <p className="font-black text-green-400">
                          {earnings.currency} {earnings.grossRevenue.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">DJ Earnings</p>
                        <p className="font-black text-cyan-400">
                          {earnings.currency} {earnings.djRevenue.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">Platform Fee</p>
                        <p className="font-black text-zinc-300">
                          {earnings.currency}{" "}
                          {earnings.platformRevenue.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">Withdrawals</p>
                        <p className="font-black text-yellow-400">
                          {earnings.currency}{" "}
                          {earnings.totalWithdrawals.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">Available</p>
                        <p className="font-black text-purple-400">
                          {earnings.currency}{" "}
                          {earnings.availableBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <h2 className="text-3xl font-black">Withdrawal Requests</h2>

          <button
            onClick={exportWithdrawalsCSV}
            className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl font-bold"
          >
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-zinc-400 text-sm">Pending</p>
            <p className="text-2xl font-black text-yellow-400">
              {pendingWithdrawals}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-zinc-400 text-sm">Approved</p>
            <p className="text-2xl font-black text-cyan-400">
              {approvedWithdrawals}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-zinc-400 text-sm">Paid</p>
            <p className="text-2xl font-black text-green-400">
              {paidWithdrawals}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-zinc-400 text-sm">Rejected</p>
            <p className="text-2xl font-black text-red-400">
              {rejectedWithdrawals}
            </p>
          </div>
        </div>

        <input
          type="text"
          placeholder="🔍 Search DJ withdrawals..."
          value={withdrawalSearch}
          onChange={(e) => setWithdrawalSearch(e.target.value)}
          className="w-full p-4 rounded-2xl bg-zinc-800 border-2 border-purple-500 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-6"
        />

        <div className="max-h-[850px] overflow-y-auto space-y-4 pr-2">
          {sortedWithdrawals.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-zinc-500">No withdrawal requests yet.</p>
            </div>
          )}

          {sortedWithdrawals.map((withdrawal) => {
            const isDetailsOpen = shouldShowWithdrawalDetails(withdrawal);
            const auditTrail = getWithdrawalAuditLogs(withdrawal.id);

            return (
              <div
                key={withdrawal.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-bold">
                        {withdrawal.dj_name || "Unknown DJ"}
                      </h3>

                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                          withdrawal.status === "paid"
                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                            : withdrawal.status === "approved"
                            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                            : withdrawal.status === "rejected"
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                        }`}
                      >
                        {withdrawalStatusLabel(withdrawal.status)}
                      </span>
                    </div>

                    <p className="text-zinc-400 mt-2">
                      {withdrawal.currency || "GHS"} {withdrawal.amount}
                    </p>

                    <p className="text-xs text-zinc-500 mt-2">
                      Requested:{" "}
                      {withdrawal.created_at
                        ? new Date(withdrawal.created_at).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {(withdrawal.status === "paid" ||
                      withdrawal.status === "rejected") && (
                      <button
                        type="button"
                        onClick={() => toggleWithdrawalDetails(withdrawal.id)}
                        className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded-xl font-semibold"
                      >
                        {isDetailsOpen ? "Hide Details" : "View Details"}
                      </button>
                    )}

                    {withdrawal.status === "pending" && (
                      <span className="text-xs text-yellow-400 font-semibold">
                        Needs review
                      </span>
                    )}

                    {withdrawal.status === "approved" && (
                      <span className="text-xs text-cyan-400 font-semibold">
                        Ready for payout
                      </span>
                    )}
                  </div>
                </div>

                {isDetailsOpen && (
                  <div className="mt-5 border-t border-zinc-800 pt-5">
                    <div className="grid md:grid-cols-2 gap-3 mb-5">
                      <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">Method</p>
                        <p className="text-zinc-300 font-semibold">
                          {withdrawal.payout_method || "Not provided"}
                        </p>
                      </div>

                      <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">Provider</p>
                        <p className="text-zinc-300 font-semibold">
                          {withdrawal.provider || "Not provided"}
                        </p>
                      </div>

                      <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">Account Name</p>
                        <p className="text-zinc-300 font-semibold">
                          {withdrawal.account_name || "Not provided"}
                        </p>
                      </div>

                      <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">Account Number</p>
                        <p className="text-zinc-300 font-semibold">
                          {withdrawal.account_number || "Not provided"}
                        </p>
                      </div>
                    </div>

                    {auditTrail.length > 0 && (
                      <div className="mb-5 w-full max-w-xl bg-black/40 border border-zinc-800 rounded-xl p-3">
                        <p className="text-xs text-zinc-500 mb-2">
                          Withdrawal Audit Trail
                        </p>

                        <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                          {auditTrail.map((log) => (
                            <div key={log.id}>
                              <p className="text-sm text-zinc-300">
                                {log.description}
                              </p>

                              <p className="text-xs text-zinc-600">
                                {log.created_at
                                  ? new Date(log.created_at).toLocaleString()
                                  : "Unknown time"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      {withdrawal.status === "pending" && (
                        <>
                          <button
                            disabled={
                              withdrawalActionLoadingId === withdrawal.id
                            }
                            onClick={() =>
                              setConfirmAction({
                                kind: "withdrawal",
                                id: withdrawal.id,
                                status: "approved",
                                title: "Approve Withdrawal",
                                message: `Approve ${
                                  withdrawal.currency || "GHS"
                                } ${withdrawal.amount} withdrawal for ${
                                  withdrawal.dj_name || "this DJ"
                                }?`,
                                confirmText: "Approve Withdrawal",
                                buttonClass: "bg-cyan-600 hover:bg-cyan-700",
                              })
                            }
                            className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-xl disabled:opacity-50"
                          >
                            Approve
                          </button>

                          <button
                            disabled={
                              withdrawalActionLoadingId === withdrawal.id
                            }
                            onClick={() =>
                              setConfirmAction({
                                kind: "withdrawal",
                                id: withdrawal.id,
                                status: "rejected",
                                title: "Reject Withdrawal",
                                message: `Are you sure you want to reject this withdrawal request from ${
                                  withdrawal.dj_name || "this DJ"
                                }?`,
                                confirmText: "Reject Withdrawal",
                                buttonClass: "bg-red-600 hover:bg-red-700",
                              })
                            }
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {withdrawal.status === "approved" && (
                        <>
                          <button
                            disabled
                            title="Automatic Paystack payouts require a Registered Business account."
                            className="bg-zinc-700 text-zinc-400 px-4 py-2 rounded-xl opacity-60 cursor-not-allowed"
                          >
                            💸 Pay Now Coming Soon
                          </button>

                          <button
                            disabled={
                              withdrawalActionLoadingId === withdrawal.id
                            }
                            onClick={() =>
                              setConfirmAction({
                                kind: "withdrawal",
                                id: withdrawal.id,
                                status: "paid",
                                title: "Mark Withdrawal as Paid",
                                message: `Only mark this as paid after ${
                                  withdrawal.dj_name || "the DJ"
                                } has actually received ${
                                  withdrawal.currency || "GHS"
                                } ${withdrawal.amount} manually.`,
                                confirmText: "Mark Paid Manually",
                                buttonClass: "bg-green-600 hover:bg-green-700",
                              })
                            }
                            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl disabled:opacity-50"
                          >
                            Mark Paid Manually
                          </button>

                          <button
                            disabled={
                              withdrawalActionLoadingId === withdrawal.id
                            }
                            onClick={() =>
                              setConfirmAction({
                                kind: "withdrawal",
                                id: withdrawal.id,
                                status: "rejected",
                                title: "Reject Withdrawal",
                                message: `Are you sure you want to reject this withdrawal request from ${
                                  withdrawal.dj_name || "this DJ"
                                }?`,
                                confirmText: "Reject Withdrawal",
                                buttonClass: "bg-red-600 hover:bg-red-700",
                              })
                            }
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl disabled:opacity-50"
                          >
                            Reject
                          </button>

                          <button
                            disabled={
                              withdrawalActionLoadingId === withdrawal.id
                            }
                            onClick={() =>
                              setConfirmAction({
                                kind: "withdrawal",
                                id: withdrawal.id,
                                status: "pending",
                                title: "Mark Withdrawal as Pending",
                                message:
                                  "Are you sure you want to move this withdrawal request back to pending?",
                                confirmText: "Mark Pending",
                                buttonClass: "bg-zinc-700 hover:bg-zinc-600",
                              })
                            }
                            className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl disabled:opacity-50"
                          >
                            Mark Pending
                          </button>

                          <p className="w-full mt-1 text-xs text-yellow-400">
                            Automatic payouts require Paystack Registered
                            Business approval. Use "Mark Paid Manually" until
                            Paystack enables transfers.
                          </p>
                        </>
                      )}

                      {withdrawal.status === "paid" && (
                        <span className="bg-green-600/20 text-green-400 px-4 py-2 rounded-xl font-semibold">
                          ✅ Paid
                        </span>
                      )}

                      {withdrawal.status === "rejected" && (
                        <button
                          disabled={
                            withdrawalActionLoadingId === withdrawal.id
                          }
                          onClick={() =>
                            setConfirmAction({
                              kind: "withdrawal",
                              id: withdrawal.id,
                              status: "pending",
                              title: "Mark Withdrawal as Pending",
                              message:
                                "Are you sure you want to move this withdrawal request back to pending?",
                              confirmText: "Mark Pending",
                              buttonClass: "bg-zinc-700 hover:bg-zinc-600",
                            })
                          }
                          className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl disabled:opacity-50"
                        >
                          Mark Pending
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>      </section>

      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-black text-white mb-3">
              {confirmAction.title}
            </h2>

            <p className="text-zinc-400 mb-6 leading-relaxed">
              {confirmAction.message}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                disabled={confirmLoading}
                onClick={() => setConfirmAction(null)}
                className="px-5 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 font-bold disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={confirmLoading}
                onClick={handleConfirmAction}
                className={`px-5 py-3 rounded-xl font-bold disabled:opacity-50 ${confirmAction.buttonClass}`}
              >
                {confirmLoading ? "Processing..." : confirmAction.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}