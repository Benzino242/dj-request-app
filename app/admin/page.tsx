"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import QRCodeBox from "../components/QRCodeBox";

type RequestStatus = "pending" | "accepted" | "rejected" | "played";

type SongRequest = {
  id: number;
  name: string;
  song: string;
  artist: string;
  status: RequestStatus;
};

export default function AdminPage() {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching requests:", error.message);
      setLoading(false);
      return;
    }

    setRequests((data || []) as SongRequest[]);
    setLoading(false);
  }

  useEffect(() => {
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
  }, []);

  async function updateStatus(id: number, status: RequestStatus) {
    const { error } = await supabase
      .from("requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating status:", error.message);
      return;
    }

    await fetchRequests();
  }

  async function deleteRequest(id: number) {
    const { error } = await supabase
      .from("requests")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting request:", error.message);
      return;
    }

    await fetchRequests();
  }

  const pending = requests.filter((r) => r.status === "pending");
  const accepted = requests.filter((r) => r.status === "accepted");
  const rejected = requests.filter((r) => r.status === "rejected");
  const played = requests.filter((r) => r.status === "played");

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-400 text-xl">Loading DJ dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-purple-500 mb-2">
          DJ Queue Dashboard
        </h1>

        <p className="text-zinc-400 mb-10">
          Manage your live DJ set in real time
        </p>

        <div className="mb-12">
          <QRCodeBox />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <RequestColumn
            title="Pending Requests"
            titleColor="text-yellow-400"
            requests={pending}
            borderColor="border-zinc-800"
            buttons={(request) => (
              <>
                <button
                  onClick={() => updateStatus(request.id, "accepted")}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl"
                >
                  Accept
                </button>

                <button
                  onClick={() => updateStatus(request.id, "rejected")}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl"
                >
                  Reject
                </button>
              </>
            )}
          />

          <RequestColumn
            title="Accepted Queue"
            titleColor="text-green-400"
            requests={accepted}
            borderColor="border-green-700"
            showQueueNumber
            buttons={(request) => (
              <>
                <button
                  onClick={() => updateStatus(request.id, "played")}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl"
                >
                  Mark Played
                </button>

                <button
                  onClick={() => deleteRequest(request.id)}
                  className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl"
                >
                  Delete
                </button>
              </>
            )}
          />

          <RequestColumn
            title="Rejected"
            titleColor="text-red-400"
            requests={rejected}
            borderColor="border-red-700"
            buttons={(request) => (
              <>
                <button
                  onClick={() => updateStatus(request.id, "pending")}
                  className="bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-2 rounded-xl"
                >
                  Restore
                </button>

                <button
                  onClick={() => deleteRequest(request.id)}
                  className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl"
                >
                  Delete
                </button>
              </>
            )}
          />

          <RequestColumn
            title="Played Songs"
            titleColor="text-blue-400"
            requests={played}
            borderColor="border-blue-700"
            buttons={(request) => (
              <button
                onClick={() => deleteRequest(request.id)}
                className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl"
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
}: {
  title: string;
  titleColor: string;
  requests: SongRequest[];
  borderColor: string;
  buttons: (request: SongRequest) => React.ReactNode;
  showQueueNumber?: boolean;
}) {
  return (
    <div>
      <h2 className={`text-3xl font-bold mb-5 ${titleColor}`}>
        {title}
      </h2>

      <div className="space-y-4">
        {requests.length === 0 && (
          <p className="text-zinc-500">No requests yet.</p>
        )}

        {requests.map((request, index) => (
          <div
            key={request.id}
            className={`bg-zinc-900 border ${borderColor} p-5 rounded-2xl`}
          >
            <div className="flex justify-between items-center gap-3">
              <h3 className="text-xl font-bold">
                {showQueueNumber
                  ? `#${index + 1} — ${request.song}`
                  : request.song}
              </h3>

              {showQueueNumber && index === 0 && (
                <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                  NOW PLAYING
                </span>
              )}
            </div>

            <p className="text-zinc-400">{request.artist}</p>

            <p className="text-purple-400 mt-2">
              Requested by {request.name}
            </p>

            <div className="flex flex-wrap gap-3 mt-4">
              {buttons(request)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}