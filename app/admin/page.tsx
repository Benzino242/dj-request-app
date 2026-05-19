"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import QRCodeBox from "../components/QRCodeBox";

export default function AdminPage() {
  const [requests, setRequests] = useState<any[]>([]);

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setRequests(data);
    }
  }

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel("admin-live")
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

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase
      .from("requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    fetchRequests();
  }

  async function deleteRequest(id: number) {
    const { error } = await supabase
      .from("requests")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    fetchRequests();
  }

  const pending = requests.filter(
    (r) => r.status === "pending"
  );

  const accepted = requests.filter(
    (r) => r.status === "accepted"
  );

  const rejected = requests.filter(
    (r) => r.status === "rejected"
  );

  const played = requests.filter(
    (r) => r.status === "played"
  );

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-5xl font-bold text-purple-500 mb-2">
          DJ Queue Dashboard
        </h1>

        <p className="text-zinc-400 mb-10">
          Manage your live DJ set in real time
        </p>

        {/* QR CODE */}
        <div className="mb-12">
          <QRCodeBox />
        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Pending */}
          <div>
            <h2 className="text-3xl font-bold mb-5 text-yellow-400">
              Pending Requests
            </h2>

            <div className="space-y-4">
              {pending.map((request) => (
                <div
                  key={request.id}
                  className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"
                >
                  <h3 className="text-xl font-bold">
                    {request.song}
                  </h3>

                  <p className="text-zinc-400">
                    {request.artist}
                  </p>

                  <p className="text-purple-400 mt-2">
                    Requested by {request.name}
                  </p>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "accepted"
                        )
                      }
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "rejected"
                        )
                      }
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accepted */}
          <div>
            <h2 className="text-3xl font-bold mb-5 text-green-400">
              Accepted Queue
            </h2>

            <div className="space-y-4">
              {accepted.map((request, index) => (
                <div
                  key={request.id}
                  className="bg-zinc-900 border border-green-700 p-5 rounded-2xl"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">
                      #{index + 1} — {request.song}
                    </h3>

                    {index === 0 && (
                      <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-bold">
                        NOW PLAYING
                      </span>
                    )}
                  </div>

                  <p className="text-zinc-400">
                    {request.artist}
                  </p>

                  <p className="text-purple-400 mt-2">
                    Requested by {request.name}
                  </p>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "played"
                        )
                      }
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl"
                    >
                      Mark Played
                    </button>

                    <button
                      onClick={() =>
                        deleteRequest(request.id)
                      }
                      className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rejected */}
          <div>
            <h2 className="text-3xl font-bold mb-5 text-red-400">
              Rejected
            </h2>

            <div className="space-y-4">
              {rejected.map((request) => (
                <div
                  key={request.id}
                  className="bg-zinc-900 border border-red-700 p-5 rounded-2xl"
                >
                  <h3 className="text-xl font-bold">
                    {request.song}
                  </h3>

                  <p className="text-zinc-400">
                    {request.artist}
                  </p>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "pending"
                        )
                      }
                      className="bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-2 rounded-xl"
                    >
                      Restore
                    </button>

                    <button
                      onClick={() =>
                        deleteRequest(request.id)
                      }
                      className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Played */}
          <div>
            <h2 className="text-3xl font-bold mb-5 text-blue-400">
              Played Songs
            </h2>

            <div className="space-y-4">
              {played.map((request) => (
                <div
                  key={request.id}
                  className="bg-zinc-900 border border-blue-700 p-5 rounded-2xl"
                >
                  <h3 className="text-xl font-bold">
                    {request.song}
                  </h3>

                  <p className="text-zinc-400">
                    {request.artist}
                  </p>

                  <button
                    onClick={() =>
                      deleteRequest(request.id)
                    }
                    className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl mt-4"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}