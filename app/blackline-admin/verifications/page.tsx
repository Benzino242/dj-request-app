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
};

export default function VerificationAdminPage() {
  const [djs, setDjs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  async function fetchDJs() {
    const { data, error } = await supabase
      .from("djs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setDjs((data || []) as DJ[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchDJs();
  }, []);

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

    await fetchDJs();
    setActionLoadingId(null);
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
        Review DJ payout verification statuses.
      </p>

      <div className="space-y-5">
        {djs.map((dj) => (
          <div
            key={dj.id}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <h2 className="text-2xl font-bold">
                  {dj.stage_name}
                </h2>

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
    </main>
  );
}