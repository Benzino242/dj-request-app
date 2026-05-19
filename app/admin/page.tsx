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
  created_at?: string;
};

const ADMIN_PASSWORD = "blackline123";

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedAccess = localStorage.getItem("dj-admin-access");

    if (savedAccess === "true") {
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

    setLoginError("Wrong password. Try again.");
  }

  function handleLogout() {
    localStorage.removeItem("dj-admin-access");
    setIsUnlocked(false);
    setPassword("");
  }

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("tip_amount", { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error.message);
      setErrorMessage("Could not load requests. Please refresh.");
      setLoading(false);
      return;
    }

    setRequests((data || []) as SongRequest[]);
    setErrorMessage("");
    setLoading(false);
  }

  useEffect(() => {
    if (!isUnlocked) return;

    fetchRequests();

    const channel = supabase
      .channel("admin-live-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isUnlocked]);

  async function updateStatus(id: number, status: RequestStatus) {
    setActionLoadingId(id);

    const { error } = await supabase
      .from("requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating status:", error.message);
      setErrorMessage("Could not update request.");
      setActionLoadingId(null);
      return;
    }

    await fetchRequests();
    setActionLoadingId(null);
  }

  async function deleteRequest(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this request?"
    );

    if (!confirmed) return;

    setActionLoadingId(id);

    const { error } = await supabase
      .from("requests")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting request:", error.message);
      setErrorMessage("Could not delete request.");
      setActionLoadingId(null);
      return;
    }

    await fetchRequests();
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

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
          <h1 className="text-4xl font-bold text-purple-500 mb-3 text-center">
            Admin Login
          </h1>

          <p className="text-zinc-400 text-center mb-8">
            Enter password to manage the DJ queue.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            />

            {loginError && (
              <p className="text-red-400 text-sm text-center">
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
        <p className="text-zinc-400 text-xl">Loading DJ dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-purple-500 mb-2">
              DJ Queue Dashboard
            </h1>

            <p className="text-zinc-400">
              Manage your live DJ set in real time
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl text-sm"
          >
            Logout
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 bg-red-950 border border-red-700 text-red-200 p-4 rounded-xl">
            {errorMessage}
          </div>
        )}

        <div className="mb-12">
          <QRCodeBox />
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
                  className="bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 px-4 py-2 rounded-xl"
                >
                  Accept
                </button>

                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => updateStatus(request.id, "rejected")}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 px-4 py-2 rounded-xl"
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
                  onClick={() => updateStatus(request.id, "played")}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 px-4 py-2 rounded-xl"
                >
                  Mark Played
                </button>

                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => deleteRequest(request.id)}
                  className="bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 px-4 py-2 rounded-xl"
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
                  className="bg-yellow-500 text-black hover:bg-yellow-600 disabled:bg-zinc-700 disabled:text-white px-4 py-2 rounded-xl"
                >
                  Restore
                </button>

                <button
                  disabled={actionLoadingId === request.id}
                  onClick={() => deleteRequest(request.id)}
                  className="bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 px-4 py-2 rounded-xl"
                >
                  Delete
                </button>
              </>
            )}
          />

          <RequestColumn
            title={`Played Songs (${grouped.played.length})`}
            titleColor="text-blue-400"
            requests={grouped.played}
            borderColor="border-blue-700"
            actionLoadingId={actionLoadingId}
            buttons={(request) => (
              <button
                disabled={actionLoadingId === request.id}
                onClick={() => deleteRequest(request.id)}
                className="bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 px-4 py-2 rounded-xl"
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
      <h2 className={`text-2xl md:text-3xl font-bold mb-5 ${titleColor}`}>
        {title}
      </h2>

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
              <h3 className="text-xl font-bold leading-snug">
                {showQueueNumber
                  ? `#${index + 1} — ${request.song}`
                  : request.song}
              </h3>

              {showQueueNumber && index === 0 && (
                <span className="bg-purple-600 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                  NEXT UP
                </span>
              )}
            </div>

            <p className="text-zinc-400 mt-1">{request.artist}</p>

            <p className="text-purple-400 mt-2">
              Requested by {request.name}
            </p>

            {actionLoadingId === request.id && (
              <p className="text-xs text-zinc-500 mt-3">Updating...</p>
            )}

            <div className="flex flex-wrap gap-3 mt-4">
              {buttons(request)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}