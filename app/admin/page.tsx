"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import QRCodeBox from "../components/QRCodeBox";

type RequestStatus = "pending" | "accepted" | "rejected" | "played";

type SongRequest = {
  id: number;
  name: string;
  song: string;
  artist: string;
  status: RequestStatus;
  tip_amount: number;
  tip_currency: string;
  created_at?: string;
};

type Payment = {
  id: number;
  amount: number;
  currency: string;
  status: string;
  dj_amount: number;
  platform_fee: number;
  payout_status: string;
};

type Withdrawal = {
  id: number;
  dj_name: string;
  amount: number;
  currency: string;
  status: string;
  payout_method?: string;
  created_at?: string;
};

const ADMIN_PASSWORD = "blackline123";

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    if (localStorage.getItem("dj-admin-access") === "true") {
      setIsUnlocked(true);
    }
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("dj-admin-access", "true");
      setIsUnlocked(true);
      setLoginError("");
      return;
    }

    setLoginError("Wrong password");
  }

  function handleLogout() {
    localStorage.removeItem("dj-admin-access");
    setIsUnlocked(false);
    setPassword("");
  }

  async function fetchDashboardData() {
    const { data: requestsData } = await supabase
      .from("requests")
      .select("*")
      .order("tip_amount", { ascending: false });

    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: withdrawalsData } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false });

    setRequests((requestsData || []) as SongRequest[]);
    setPayments((paymentsData || []) as Payment[]);
    setWithdrawals((withdrawalsData || []) as Withdrawal[]);

    setLoading(false);
  }

  useEffect(() => {
    if (!isUnlocked) return;

    fetchDashboardData();

    const requestsChannel = supabase
      .channel("admin-live-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        () => fetchDashboardData()
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel("admin-live-payments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
        },
        () => fetchDashboardData()
      )
      .subscribe();

    const withdrawalsChannel = supabase
      .channel("admin-live-withdrawals")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "withdrawals",
        },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(withdrawalsChannel);
    };
  }, [isUnlocked]);

  async function updateStatus(id: number, status: RequestStatus) {
    setActionLoadingId(id);

    await supabase.from("requests").update({ status }).eq("id", id);

    await fetchDashboardData();
    setActionLoadingId(null);
  }

  async function deleteRequest(id: number) {
    if (!window.confirm("Delete this request?")) return;

    setActionLoadingId(id);

    await supabase.from("requests").delete().eq("id", id);

    await fetchDashboardData();
    setActionLoadingId(null);
  }

  const grouped = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === "pending"),
      accepted: requests.filter((r) => r.status === "accepted"),
      rejected: requests.filter((r) => r.status === "rejected"),
      played: requests.filter((r) => r.status === "played"),
    };
  }, [requests]);

  const currency =
    payments[0]?.currency || requests[0]?.tip_currency || "GHS";

  const grossRevenue = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const netEarnings = payments.reduce(
    (sum, payment) => sum + Number(payment.dj_amount || 0),
    0
  );

  const serviceFees = payments.reduce(
    (sum, payment) => sum + Number(payment.platform_fee || 0),
    0
  );

  const pendingPayouts = payments.filter(
    (payment) => payment.payout_status === "pending"
  ).length;

  const vipRequests = requests.filter((r) => r.tip_amount >= 50).length;

  const totalWithdrawals = withdrawals.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md">
          <h1 className="text-4xl font-bold text-purple-500 text-center mb-3">
            Blackline Admin
          </h1>

          <p className="text-zinc-400 text-center mb-8">
            DJ dashboard access
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            />

            {loginError && (
              <p className="text-red-400 text-center text-sm">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 p-4 rounded-xl text-xl font-semibold"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-10">
          <div>
            <h1 className="text-5xl font-bold text-purple-500 mb-2">
              Blackline DJ Dashboard
            </h1>

            <p className="text-zinc-400">
              Live premium request management
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl"
          >
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-10">
          <StatCard title="Total Requests" value={requests.length} />
          <StatCard title="VIP Requests" value={vipRequests} color="text-purple-400" />
          <StatCard title="Pending Queue" value={grouped.pending.length} color="text-yellow-400" />
          <StatCard title="Paid Transactions" value={payments.length} color="text-green-400" />
        </div>

        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-4 text-green-400">
            Earnings Overview
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            <StatCard
              title="Gross Revenue"
              value={`${currency} ${grossRevenue.toFixed(2)}`}
              color="text-green-400"
            />

            <StatCard
              title="DJ Earnings"
              value={`${currency} ${netEarnings.toFixed(2)}`}
              color="text-cyan-400"
            />

            <StatCard
              title="Platform Revenue"
              value={`${currency} ${serviceFees.toFixed(2)}`}
              color="text-zinc-300"
            />

            <StatCard
              title="Pending Payouts"
              value={pendingPayouts}
              color="text-yellow-400"
            />
          </div>

          <p className="text-xs text-zinc-500 mt-3">
            Platform revenue is hidden from DJs publicly but visible here for accounting.
          </p>
        </div>

        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-4 text-cyan-400">
            Withdrawal Activity
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <StatCard
              title="Withdrawal Requests"
              value={withdrawals.length}
              color="text-cyan-400"
            />

            <StatCard
              title="Total Withdrawals"
              value={`${currency} ${totalWithdrawals.toFixed(2)}`}
              color="text-green-400"
            />

            <StatCard
              title="Pending Withdrawals"
              value={
                withdrawals.filter((w) => w.status === "pending").length
              }
              color="text-yellow-400"
            />
          </div>

          <div className="space-y-4">
            {withdrawals.length === 0 && (
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <p className="text-zinc-500">
                  No withdrawal requests yet.
                </p>
              </div>
            )}

            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">
                      {withdrawal.dj_name}
                    </h3>

                    <p className="text-zinc-400 mt-1">
                      {withdrawal.payout_method || "Bank Transfer"}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="bg-cyan-700 px-4 py-2 rounded-xl font-bold">
                      {withdrawal.currency} {withdrawal.amount}
                    </div>

                    <p className="text-sm text-yellow-400 mt-2 uppercase">
                      {withdrawal.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <QRCodeBox />
        </div>

        {/* KEEP YOUR EXISTING REQUEST COLUMNS BELOW */}

      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  color = "text-white",
}: {
  title: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
      <p className="text-zinc-500 text-sm">{title}</p>
      <h2 className={`text-3xl font-bold mt-2 ${color}`}>{value}</h2>
    </div>
  );
}