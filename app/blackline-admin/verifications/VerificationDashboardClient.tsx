"use client";

import { useEffect, useState } from "react";
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
  status?: string | null;
  created_at?: string | null;
};

export default function VerificationAdminPage() {
  const [djs, setDjs] = useState<DJ[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [withdrawalActionLoadingId, setWithdrawalActionLoadingId] =
    useState<number | null>(null);

  async function fetchDashboardData() {
    setLoading(true);

    const { data: djData, error: djError } = await supabase
      .from("djs")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: withdrawalData, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false });

    if (djError) {
      console.error(djError);
    }

    if (withdrawalError) {
      console.error(withdrawalError);
    }

    setDjs((djData || []) as DJ[]);
    setWithdrawals((withdrawalData || []) as Withdrawal[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchDashboardData();
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

  const sortedDjs = [...djs].sort((a, b) => {
    const priority: Record<string, number> = {
      pending: 1,
      rejected: 2,
      verified: 3,
      not_started: 4,
    };

    return (
      (priority[a.verification_status || "not_started"] || 5) -
      (priority[b.verification_status || "not_started"] || 5)
    );
  });

  const sortedWithdrawals = [...withdrawals].sort((a, b) => {
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

    const { error } = await supabase
      .from("djs")
      .update({ verification_status: status })
      .eq("id", djId);

    if (error) {
      console.error(error);
      alert("Failed to update verification status");
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

    const { error } = await supabase
      .from("withdrawals")
      .update({ status })
      .eq("id", withdrawalId);

    if (error) {
      console.error(error);
      alert("Failed to update withdrawal status");
      setWithdrawalActionLoadingId(null);
      return;
    }

    await fetchDashboardData();
    setWithdrawalActionLoadingId(null);
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
        Blackline Verification Panel
      </h1>

      <p className="text-zinc-400 mb-10">
        Review DJ payout verification statuses and withdrawal requests.
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

      <section className="mb-14">
        <h2 className="text-3xl font-black mb-5">DJ Verification Requests</h2>

        <div className="space-y-5">
          {sortedDjs.map((dj) => (
            <div
              key={dj.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
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
                  <button
                    disabled={actionLoadingId === dj.id}
                    onClick={() => updateVerificationStatus(dj.id, "verified")}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    Verify
                  </button>

                  <button
                    disabled={actionLoadingId === dj.id}
                    onClick={() => updateVerificationStatus(dj.id, "rejected")}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    Reject
                  </button>

                  <button
                    disabled={actionLoadingId === dj.id}
                    onClick={() => updateVerificationStatus(dj.id, "pending")}
                    className="bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    Mark Pending
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-black mb-5">Withdrawal Requests</h2>

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

        <div className="space-y-5">
          {sortedWithdrawals.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-zinc-500">No withdrawal requests yet.</p>
            </div>
          )}

          {sortedWithdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div>
                  <h3 className="text-2xl font-bold">
                    {withdrawal.dj_name || "Unknown DJ"}
                  </h3>

                  <p className="text-zinc-400 mt-1">
                    {withdrawal.currency || "GHS"} {withdrawal.amount}
                  </p>

                  <p className="text-sm text-zinc-500 mt-2">
                    Method: {withdrawal.payout_method || "Not provided"}
                  </p>

                  <p className="text-sm text-zinc-500 mt-1">
                    Account name: {withdrawal.account_name || "Not provided"}
                  </p>

                  <p className="text-sm text-zinc-500 mt-1">
                    Account number:{" "}
                    {withdrawal.account_number || "Not provided"}
                  </p>

                  <p
                    className={`mt-3 font-bold ${withdrawalStatusColor(
                      withdrawal.status
                    )}`}
                  >
                    {withdrawalStatusLabel(withdrawal.status)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    disabled={withdrawalActionLoadingId === withdrawal.id}
                    onClick={() =>
                      updateWithdrawalStatus(withdrawal.id, "approved")
                    }
                    className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    Approve
                  </button>

                  <button
                    disabled={withdrawalActionLoadingId === withdrawal.id}
                    onClick={() =>
                      updateWithdrawalStatus(withdrawal.id, "rejected")
                    }
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    Reject
                  </button>

                  <button
                    disabled={withdrawalActionLoadingId === withdrawal.id}
                    onClick={() =>
                      updateWithdrawalStatus(withdrawal.id, "paid")
                    }
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    Mark Paid
                  </button>

                  <button
                    disabled={withdrawalActionLoadingId === withdrawal.id}
                    onClick={() =>
                      updateWithdrawalStatus(withdrawal.id, "pending")
                    }
                    className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    Mark Pending
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}