"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type RequestStatus = "pending" | "accepted" | "rejected" | "played";

type Request = {
  id: number;
  name: string;
  song: string;
  artist: string;
  status: RequestStatus;
  created_at: string;
};

export default function Home() {
  const [name, setName] = useState("");
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [requests, setRequests] = useState<Request[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error.message);
      return;
    }

    setRequests((data || []) as Request[]);
  }

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel("guest-live-requests")
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !song.trim() || !artist.trim()) {
      setMessage("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const { data, error } = await supabase
      .from("requests")
      .insert([
        {
          name: name.trim(),
          song: song.trim(),
          artist: artist.trim(),
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Submit error:", error.message);
      setMessage("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    if (data) {
      setRequests((currentRequests) => [
        data as Request,
        ...currentRequests,
      ]);
    }

    setName("");
setSong("");
setArtist("");

setMessage("✅ Request submitted successfully!");

// keep loading state visible briefly
setTimeout(() => {
  setSubmitting(false);
}, 800);

// clear success message later
setTimeout(() => {
  setMessage("");
}, 4000);
  }

  function getStatusColor(status: RequestStatus) {
    if (status === "accepted") return "bg-green-600";
    if (status === "rejected") return "bg-red-600";
    if (status === "played") return "bg-blue-600";
    return "bg-yellow-600";
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <div className="bg-zinc-900 p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h1 className="text-5xl font-bold text-center mb-3">
          DJ Request App
        </h1>

        <p className="text-center text-zinc-400 mb-8">
          Request your favorite song
        </p>

        {message && (
          <div className="mb-4 bg-purple-900 border border-purple-600 text-white p-4 rounded-xl text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            placeholder="Song Name"
            value={song}
            onChange={(e) => setSong(e.target.value)}
          />

          <input
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            placeholder="Artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:cursor-not-allowed transition p-4 rounded-xl text-xl font-semibold"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>

      <div className="mt-10 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-4">
          Live Requests
        </h2>

        <div className="space-y-4">
          {requests.length === 0 && (
            <p className="text-zinc-500">No requests yet.</p>
          )}

          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-zinc-900 p-4 rounded-xl border border-zinc-800"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="font-bold text-lg">
                  {request.song}
                </p>

                <span
                  className={`text-xs px-3 py-1 rounded-full ${getStatusColor(
                    request.status
                  )}`}
                >
                  {request.status}
                </span>
              </div>

              <p className="text-zinc-400">{request.artist}</p>

              <p className="text-sm text-purple-400 mt-2">
                Requested by {request.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}