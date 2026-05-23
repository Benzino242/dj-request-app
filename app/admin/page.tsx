"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import QRCodeBox from "../components/QRCodeBox";

type RequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "played"
  | "finished";

  type SongRequest = {
    id: number;
    dj_id: number;
    name: string;
    song: string;
    artist: string;
    status: RequestStatus;
    tip_amount: number;
    tip_currency: string;
    queue_position?: number | null;
    created_at?: string;
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

type DJ = {
  id: number;
  stage_name: string;
  email: string | null;
  user_id: string;
  bio?: string | null;
  city?: string | null;
  instagram?: string | null;
  profile_image?: string | null;
  is_live?: boolean | null;
};

export default function AdminPage() {
  const [dj, setDj] = useState<DJ | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [instagram, setInstagram] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [provider, setProvider] = useState("MTN");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  async function loadLoggedInDJ() {
    setAuthLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDj(null);
      setAuthLoading(false);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("djs")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      console.error(error);
      setDj(null);
      setAuthLoading(false);
      setLoading(false);
      return;
    }

    setDj(data as DJ);
    setBio(data.bio || "");
    setCity(data.city || "");
    setInstagram(data.instagram || "");
    setProfileImage(data.profile_image || "");
    setAuthLoading(false);
  }

  useEffect(() => {
    loadLoggedInDJ();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadLoggedInDJ();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setDj(null);
  }

  async function toggleLiveStatus() {
    if (!dj) return;

    const nextLiveStatus = !dj.is_live;

    const { error } = await supabase
      .from("djs")
      .update({ is_live: nextLiveStatus })
      .eq("id", dj.id);

    if (error) {
      console.error(error);
      alert("Failed to update live status");
      return;
    }

    setDj({
      ...dj,
      is_live: nextLiveStatus,
    });
  }

  async function endDJSet() {
    if (!dj) return;
  
    const confirmEnd = window.confirm(
      "End DJ set and clear active queue?"
    );
  
    if (!confirmEnd) return;
  
    setLoading(true);
  
    await supabase
      .from("djs")
      .update({ is_live: false })
      .eq("id", dj.id);
  
    await supabase
      .from("requests")
      .update({ status: "finished" })
      .eq("dj_id", dj.id)
      .in("status", ["accepted", "played"]);
  
    await fetchDashboardData();
  
    setDj({
      ...dj,
      is_live: false,
    });
  
    setLoading(false);
  
    alert("DJ set ended successfully");
  }

  async function saveProfile() {
    if (!dj) return;

    setSavingProfile(true);
    setProfileMessage("");

    const { error } = await supabase
      .from("djs")
      .update({
        bio,
        city,
        instagram,
        profile_image: profileImage,
      })
      .eq("id", dj.id);

    if (error) {
      console.error(error);
      setProfileMessage("Profile update failed.");
      setSavingProfile(false);
      return;
    }

    setDj({
      ...dj,
      bio,
      city,
      instagram,
      profile_image: profileImage,
    });

    setProfileMessage("Profile updated successfully.");
    setSavingProfile(false);
  }

  async function handleProfileImageUpload(file: File) {
    if (!dj) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${dj.stage_name}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("dj-profile-images")
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      alert("Failed to upload image");
      return;
    }

    const { data } = supabase.storage
      .from("dj-profile-images")
      .getPublicUrl(fileName);

    setProfileImage(data.publicUrl);
  }

  async function fetchDashboardData() {
    if (!dj) return;

    const { data: requestsData } = await supabase
  .from("requests")
  .select("*")
  .eq("dj_id", dj.id)
  .order("queue_position", { ascending: true })
  .order("tip_amount", { ascending: false });
      

    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*")
      .eq("dj_id", dj.id)
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
    if (!dj) return;

    fetchDashboardData();

    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 3000);

    const requestsChannel = supabase
      .channel(`admin-live-requests-${dj.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
          filter: `dj_id=eq.${dj.id}`,
        },
        () => fetchDashboardData()
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel(`admin-live-payments-${dj.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
          filter: `dj_id=eq.${dj.id}`,
        },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [dj]);

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
  async function moveRequest(requestId: number, direction: "up" | "down") {
    const currentIndex = grouped.accepted.findIndex(
      (request) => request.id === requestId
    );
  
    if (currentIndex === -1) return;
  
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  
    if (targetIndex < 0 || targetIndex >= grouped.accepted.length) return;
  
    const reordered = [...grouped.accepted];
  
    const [movedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);
  
    setActionLoadingId(requestId);
  
    for (let index = 0; index < reordered.length; index++) {
      await supabase
        .from("requests")
        .update({ queue_position: index + 1 })
        .eq("id", reordered[index].id);
    }
  
    await fetchDashboardData();
  
    setActionLoadingId(null);
  }

  async function requestWithdrawal() {
    if (!dj) return;

    const amount = Number(withdrawAmount);

    if (!amount || amount <= 0) {
      alert("Enter a valid withdrawal amount");
      return;
    }

    if (!accountName.trim()) {
      alert("Enter account name");
      return;
    }

    if (!accountNumber.trim()) {
      alert("Enter account number");
      return;
    }

    const availableBalance = netEarnings - totalWithdrawals;

    if (amount > availableBalance) {
      alert("Insufficient available balance");
      return;
    }

    setWithdrawLoading(true);

    const { error } = await supabase.from("withdrawals").insert([
      {
        dj_id: dj.id,
        dj_name: dj.stage_name,
        amount,
        currency,
        payout_method: "Mobile Money",
        account_name: accountName,
        account_number: accountNumber,
        provider,
        status: "pending",
      },
    ]);

    if (error) {
      console.error("WITHDRAWAL ERROR:", error);
      alert(error.message || JSON.stringify(error));
      setWithdrawLoading(false);
      return;
    }

    alert("Withdrawal request submitted");

    setWithdrawAmount("");
    setAccountName("");
    setAccountNumber("");
    setProvider("MTN");

    await fetchDashboardData();

    setWithdrawLoading(false);
  }

  const grouped = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === "pending"),
      accepted: requests.filter((r) => r.status === "accepted"),
      rejected: requests.filter((r) => r.status === "rejected"),
      played: requests.filter((r) => r.status === "played"),
      finished: requests.filter((r) => r.status === "finished"),
    };
  }, [requests]);

  const currency = payments[0]?.currency || requests[0]?.tip_currency || "GHS";

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

  if (authLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Checking login...
      </main>
    );
  }

  if (!dj) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        Redirecting...
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
              {dj.stage_name.toUpperCase()} Dashboard
            </h1>
            <p className="text-zinc-400">Live premium request management</p>
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

        <div
          className={`border rounded-3xl p-6 mb-10 ${
            dj.is_live
              ? "bg-green-950 border-green-700"
              : "bg-zinc-900 border-zinc-800"
          }`}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2
                className={`text-3xl font-bold ${
                  dj.is_live ? "text-green-400" : "text-zinc-300"
                }`}
              >
                {dj.is_live ? "LIVE NOW 🟢" : "OFFLINE 🔴"}
              </h2>

              <p className="text-zinc-400 mt-2">
                {dj.is_live
                  ? "Guests can currently submit paid song requests."
                  : "Requests are currently closed for this DJ page."}
              </p>
            </div>

            <button
              onClick={toggleLiveStatus}
              className={`px-6 py-4 rounded-xl font-bold text-lg ${
                dj.is_live
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {dj.is_live ? "Go Offline" : "Go Live"}
            </button>
            <button
              onClick={endDJSet}
              className="bg-red-600 hover:bg-red-700 px-6 py-4 rounded-xl font-bold text-lg ml-4"
            >
              End DJ Set
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-10">
          <h2 className="text-4xl font-bold text-purple-400 mb-8">
            DJ Profile Settings
          </h2>

          <div className="space-y-6">
            <div className="flex flex-col items-center">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="DJ Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-purple-600 mb-4"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center text-zinc-500 mb-4">
                  No Image
                </div>
              )}

              <label className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl cursor-pointer font-semibold">
                Upload Profile Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProfileImageUpload(file);
                  }}
                />
              </label>

              {profileImage && (
                <button
                  type="button"
                  onClick={() => setProfileImage("")}
                  className="mt-3 bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-semibold"
                >
                  Remove Photo
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="City e.g. Accra, Ghana"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-4 rounded-xl bg-black border border-zinc-700"
              />

              <input
                type="text"
                placeholder="Instagram handle e.g. @djbenzino"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full p-4 rounded-xl bg-black border border-zinc-700"
              />
            </div>

            <input
              type="text"
              placeholder="Profile image URL"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            />

            <textarea
              placeholder="Short DJ bio / music style"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            />

            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl font-bold text-lg disabled:opacity-50"
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>

            {profileMessage && (
              <p className="text-green-400 font-semibold">{profileMessage}</p>
            )}
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-4 text-green-400">
            Earnings Overview
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            <StatCard title="Gross Revenue" value={`${currency} ${grossRevenue.toFixed(2)}`} color="text-green-400" />
            <StatCard title="DJ Earnings" value={`${currency} ${netEarnings.toFixed(2)}`} color="text-cyan-400" />
            <StatCard title="Platform Revenue" value={`${currency} ${serviceFees.toFixed(2)}`} color="text-zinc-300" />
            <StatCard title="Pending Payouts" value={pendingPayouts} color="text-yellow-400" />
          </div>

          <p className="text-xs text-zinc-500 mt-3">
            Platform revenue is shown here for accounting and reconciliation.
          </p>
        </div>

        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-4 text-cyan-400">
            Withdrawal Activity
          </h2>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
            <h3 className="text-2xl font-bold text-white mb-5">
              Request Withdrawal
            </h3>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="number"
                placeholder="Withdrawal Amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full p-4 rounded-xl bg-black border border-zinc-700"
              />

              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full p-4 rounded-xl bg-black border border-zinc-700"
              >
                <option value="MTN">MTN Mobile Money</option>
                <option value="Telecel">Telecel Cash</option>
                <option value="AirtelTigo">AirtelTigo Money</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Account Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full p-4 rounded-xl bg-black border border-zinc-700"
              />

              <input
                type="text"
                placeholder="Mobile Money Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full p-4 rounded-xl bg-black border border-zinc-700"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-zinc-400 text-sm">Available Balance</p>

                <h4 className="text-3xl font-bold text-green-400">
                  {currency} {(netEarnings - totalWithdrawals).toFixed(2)}
                </h4>
              </div>

              <button
                onClick={requestWithdrawal}
                disabled={withdrawLoading}
                className="bg-cyan-600 hover:bg-cyan-700 px-8 py-4 rounded-xl font-bold text-lg disabled:opacity-50"
              >
                {withdrawLoading ? "Submitting..." : "Request Payout"}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <StatCard title="Withdrawal Requests" value={withdrawals.length} color="text-cyan-400" />
            <StatCard title="Total Withdrawals" value={`${currency} ${totalWithdrawals.toFixed(2)}`} color="text-green-400" />
            <StatCard
              title="Pending Withdrawals"
              value={withdrawals.filter((w) => w.status === "pending").length}
              color="text-yellow-400"
            />
          </div>

          <div className="space-y-4">
            {withdrawals.length === 0 && (
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                <p className="text-zinc-500">No withdrawal requests yet.</p>
              </div>
            )}

            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">{withdrawal.dj_name}</h3>
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
          <QRCodeBox stageName={dj.stage_name} />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <RequestColumn
            title={`Pending Requests (${grouped.pending.length})`}
            titleColor="text-yellow-400"
            requests={grouped.pending}
            borderColor="border-zinc-800"
            actionLoadingId={actionLoadingId}
            buttons={(request) => (
              <>
                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => updateStatus(request.id, "accepted")}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl disabled:bg-zinc-700"
                >
                  Accept
                </button>

                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => updateStatus(request.id, "rejected")}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl disabled:bg-zinc-700"
                >
                  Reject
                </button>
              </>
            )}
          />

          <RequestColumn
            title={`Accepted Queue (${grouped.accepted.length})`}
            titleColor="text-green-400"
            requests={grouped.accepted}
            borderColor="border-green-700"
            showQueueNumber
            actionLoadingId={actionLoadingId}
            buttons={(request) => (
              <>
                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => moveRequest(request.id, "up")}
                  className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl"
                >
                  ⬆️ Up
                </button>
            
                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => moveRequest(request.id, "down")}
                  className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl"
                >
                  ⬇️ Down
                </button>
            
                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => updateStatus(request.id, "played")}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl disabled:bg-zinc-700"
                >
                  Mark Played
                </button>
            
                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => deleteRequest(request.id)}
                  className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl disabled:bg-zinc-800"
                >
                  Delete
                </button>
              </>
            )}
          />

          <RequestColumn
            title={`Rejected (${grouped.rejected.length})`}
            titleColor="text-red-400"
            requests={grouped.rejected}
            borderColor="border-red-700"
            actionLoadingId={actionLoadingId}
            buttons={(request) => (
              <>
                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => updateStatus(request.id, "pending")}
                  className="bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-2 rounded-xl disabled:bg-zinc-700 disabled:text-white"
                >
                  Restore
                </button>

                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => deleteRequest(request.id)}
                  className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl disabled:bg-zinc-800"
                >
                  Delete
                </button>
              </>
            )}
          />

          <RequestColumn
            title={`Now Playing (${grouped.played.length})`}
            titleColor="text-purple-400"
            requests={grouped.played}
            borderColor="border-purple-700"
            actionLoadingId={actionLoadingId}
            buttons={(request) => (
              <>
                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => updateStatus(request.id, "finished")}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl disabled:bg-zinc-800"
                >
                  Clear Now Playing
                </button>

                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => deleteRequest(request.id)}
                  className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl disabled:bg-zinc-800"
                >
                  Delete
                </button>
              </>
            )}
          />

          <RequestColumn
            title={`Played History (${grouped.finished.length})`}
            titleColor="text-blue-400"
            requests={grouped.finished}
            borderColor="border-blue-700"
            actionLoadingId={actionLoadingId}
            buttons={(request) => (
              <button
                disabled={actionLoadingId === request.id}
                onClick={() => deleteRequest(request.id)}
                className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl disabled:bg-zinc-800"
              >
                Delete
              </button>
            )}
          />
        </div>
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

function RequestColumn({
  title,
  titleColor,
  requests,
  borderColor,
  buttons,
  showQueueNumber = false,
  actionLoadingId,
}: {
  title: string;
  titleColor: string;
  requests: SongRequest[];
  borderColor: string;
  buttons: (request: SongRequest) => React.ReactNode;
  showQueueNumber?: boolean;
  actionLoadingId: number | null;
}) {
  return (
    <section>
      <h2 className={`text-3xl font-bold mb-5 ${titleColor}`}>{title}</h2>

      <div className="space-y-4">
        {requests.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-zinc-500">No requests yet.</p>
          </div>
        )}

        {requests.map((request, index) => (
          <div
            key={request.id}
            className={`bg-zinc-900 border ${borderColor} p-5 rounded-2xl`}
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="text-2xl font-bold">
                  {showQueueNumber
                    ? `#${index + 1} — ${request.song}`
                    : request.song}
                </h3>

                <p className="text-zinc-400 mt-1">{request.artist}</p>

                <p className="text-purple-400 mt-2">
                  Requested by {request.name}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                {showQueueNumber && index === 0 && (
                  <span className="bg-purple-600 px-3 py-1 rounded-full text-xs font-bold">
                    NEXT UP
                  </span>
                )}

                {request.tip_amount >= 50 && (
                  <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                    VIP
                  </span>
                )}

                <div className="bg-green-700 px-4 py-2 rounded-xl font-bold">
                  {request.tip_currency} {request.tip_amount}
                </div>
              </div>
            </div>

            {actionLoadingId === request.id && (
              <p className="text-zinc-500 text-sm mt-3">Updating...</p>
            )}

            <div className="flex flex-wrap gap-3 mt-5">{buttons(request)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}