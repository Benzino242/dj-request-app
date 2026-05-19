"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Request = {
  id: number;
  name: string;
  song: string;
  artist: string;
  status: string;
  created_at: string;
};

export default function Home() {
  const [name, setName] = useState("");
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [requests, setRequests] = useState<Request[]>([]);

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

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
      .channel("requests-channel")
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

    if (!name || !song || !artist) return;

    const { error } = await supabase.from("requests").insert([
      {
        name,
        song,
        artist,
        status: "pending",
      },
    ]);

    if (error) {
      console.error(error);
      return;
    }

    setName("");
    setSong("");
    setArtist("");
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-10">
      <div className="bg-zinc-900 p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h1 className="text-5xl font-bold text-center mb-3">
          DJ Request App
        </h1>

        <p className="text-center text-zinc-400 mb-8">
          Request your favorite song
        </p>

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
            className="w-full bg-purple-600 hover:bg-purple-700 transition p-4 rounded-xl text-xl font-semibold"
          >
            Submit Request
          </button>
        </form>
      </div>

      <div className="mt-10 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-4">
          Live Requests
        </h2>

        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-zinc-900 p-4 rounded-xl border border-zinc-800"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-lg">
                  {request.song}
                </p>

                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    request.status === "playing"
                      ? "bg-green-600"
                      : request.status === "completed"
                      ? "bg-blue-600"
                      : "bg-yellow-600"
                  }`}
                >
                  {request.status}
                </span>
              </div>

              <p className="text-zinc-400">
                {request.artist}
              </p>

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