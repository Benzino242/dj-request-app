"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Request = {
  id: number;
  dj_id: number;
  name: string;
  song: string;
  artist: string;
  status: string;
  created_at: string;
  tip_amount: number;
  tip_currency: string;
};

type DJ = {
  id: number;
  stage_name: string;
  email: string | null;
  profile_image: string | null;
  bio: string | null;
  city: string | null;
  instagram: string | null;
  is_live: boolean | null;
};

export default function StageRequestPage() {
  const params = useParams();
  const stage = String(params.stage || "").toLowerCase();

  const [dj, setDj] = useState<DJ | null>(null);
  const [djLoading, setDjLoading] = useState(true);

  const [name, setName] = useState("");
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [tipAmount, setTipAmount] = useState(10);
  const [tipCurrency, setTipCurrency] = useState("GHS");
  const [requests, setRequests] = useState<Request[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [nowPlaying, setNowPlaying] = useState<Request | null>(null);

  const previousNowPlayingId = useRef<number | null>(null);

  async function fetchDJ() {
    if (!stage) return;

    const { data, error } = await supabase
      .from("djs")
      .select("*")
      .eq("stage_name", stage)
      .single();

    if (error || !data) {
      console.error("DJ not found:", error);
      setDj(null);
      setDjLoading(false);
      return;
    }

    setDj(data as DJ);
    setDjLoading(false);
    fetchRequests(data.id);
  }

  async function fetchRequests(djId: number) {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("dj_id", djId)
      .order("tip_amount", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const allRequests = (data || []) as Request[];

    setRequests(allRequests);

    const currentlyPlaying = allRequests.find(
      (request) => request.status === "played"
    );

    if (
      currentlyPlaying &&
      currentlyPlaying.id !== previousNowPlayingId.current
    ) {
      previousNowPlayingId.current = currentlyPlaying.id;

      setNowPlaying(currentlyPlaying);

      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200, 100, 300]);
      }
    }
  }

  useEffect(() => {
    fetchDJ();
  }, [stage]);

  useEffect(() => {
    if (!dj) return;

    fetchRequests(dj.id);

    const refreshInterval = setInterval(() => {
      fetchRequests(dj.id);
      fetchDJ();
    }, 3000);

    const requestsChannel = supabase
      .channel(`requests-channel-${dj.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
          filter: `dj_id=eq.${dj.id}`,
        },
        () => {
          fetchRequests(dj.id);
        }
      )
      .subscribe();

    const djChannel = supabase
      .channel(`dj-live-channel-${dj.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "djs",
          filter: `id=eq.${dj.id}`,
        },
        () => {
          fetchDJ();
        }
      )
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(djChannel);
    };
  }, [dj?.id]);

  async function handlePayment() {
    if (!dj) {
      alert("DJ profile not found");
      return;
    }

    if (!dj.is_live) {
      alert("This DJ is currently offline. Please try again when they are live.");
      return;
    }

    if (!name.trim() || !song.trim() || !artist.trim()) {
      alert("Please fill all fields");
      return;
    }

    if (!tipAmount || tipAmount < 1) {
      alert("Please enter a valid tip amount");
      return;
    }

    setSubmitting(true);

    const PaystackPop = (await import("@paystack/inline-js")).default;
    const paystack = new PaystackPop();

    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: `${name.replace(/\s/g, "")}@blackline.app`,
      amount: tipAmount * 100,
      currency: tipCurrency,

      metadata: {
        custom_fields: [
          {
            display_name: "DJ",
            variable_name: "dj_stage_name",
            value: dj.stage_name,
          },
          {
            display_name: "Guest Name",
            variable_name: "guest_name",
            value: name,
          },
          {
            display_name: "Song",
            variable_name: "song",
            value: song,
          },
        ],
      },

      onSuccess: async (transaction: any) => {
        try {
          const { data: requestData, error } = await supabase
            .from("requests")
            .insert([
              {
                dj_id: dj.id,
                name: name.trim(),
                song: song.trim(),
                artist: artist.trim(),
                status: "pending",
                tip_amount: tipAmount,
                tip_currency: tipCurrency,
              },
            ])
            .select()
            .single();

          if (error) {
            console.error(error);
            alert("Failed to save request");
            return;
          }

          const { error: paymentError } = await supabase.from("payments").insert([
            {
              dj_id: dj.id,
              request_id: requestData.id,
              guest_name: name.trim(),
              song: song.trim(),
              artist: artist.trim(),
              amount: tipAmount,
              currency: tipCurrency,
              status: "paid",
              provider: "paystack",
              provider_reference: transaction.reference,
              dj_amount: Number((tipAmount * 0.9).toFixed(2)),
              platform_fee: Number((tipAmount * 0.1).toFixed(2)),
              payout_status: "pending",
            },
          ]);

          if (paymentError) {
            console.error("PAYMENT INSERT ERROR:", paymentError);
          }

          await fetchRequests(dj.id);

          setName("");
          setSong("");
          setArtist("");
          setTipAmount(10);

          alert("Payment successful & request submitted!");
        } catch (err) {
          console.error(err);
          alert("Something went wrong");
        } finally {
          setSubmitting(false);
        }
      },

      onCancel: () => {
        setSubmitting(false);
        alert("Payment cancelled");
      },
    });
  }

  if (djLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading DJ page...
      </main>
    );
  }

  if (!dj) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md text-center">
          <h1 className="text-4xl font-bold text-red-400 mb-3">
            DJ Not Found
          </h1>

          <p className="text-zinc-400">
            No Blackline DJ profile exists for /{stage}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-10">

      {nowPlaying && (
        <div className="w-full max-w-md mb-8 animate-pulse">
          <div className="bg-gradient-to-r from-purple-700 to-pink-600 p-6 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.7)] border border-purple-300 text-center">
            <p className="text-sm font-bold tracking-[0.3em] text-white mb-2">
              NOW PLAYING 🎵
            </p>

            <h1 className="text-3xl font-black text-white">
              {nowPlaying.song}
            </h1>

            <p className="text-white/80 text-lg mt-2">
              {nowPlaying.artist}
            </p>

            <p className="text-xs text-white/70 mt-4">
              Requested by {nowPlaying.name}
            </p>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-800">

        <div className="text-center mb-6">
          {dj.profile_image && (
            <img
              src={dj.profile_image}
              alt={dj.stage_name}
              className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 border-purple-600"
            />
          )}

          <p className="text-zinc-500 text-sm mb-2">
            Requesting from DJ
          </p>

          <h1 className="text-5xl font-bold mb-3 text-purple-500 uppercase">
            {dj.stage_name}
          </h1>

          <div
            className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${
              dj.is_live
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {dj.is_live ? "LIVE NOW 🟢" : "OFFLINE 🔴"}
          </div>

          {dj.city && (
            <p className="text-zinc-400 text-sm mb-2">
              📍 {dj.city}
            </p>
          )}

          {dj.bio && (
            <p className="text-zinc-300 text-sm leading-relaxed mb-3">
              {dj.bio}
            </p>
          )}

          {dj.instagram && (
            <p className="text-purple-400 text-sm font-semibold">
              Instagram: {dj.instagram}
            </p>
          )}
        </div>

        {!dj.is_live && (
          <div className="bg-red-950 border border-red-700 p-4 rounded-2xl mb-6 text-center">
            <p className="text-red-200 font-semibold">
              This DJ is currently offline. Requests are closed.
            </p>
          </div>
        )}

        <p className="text-center text-zinc-400 mb-8">
          Request songs. Skip the queue. Tip the DJ.
        </p>

        <div className="bg-purple-950 border border-purple-700 p-4 rounded-2xl mb-6">
          <p className="text-sm text-purple-200">
            Higher tips move your request closer to the top 🔥
          </p>
        </div>

        <div className="space-y-4">
          <input
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!dj.is_live}
          />

          <input
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            placeholder="Song Name"
            value={song}
            onChange={(e) => setSong(e.target.value)}
            disabled={!dj.is_live}
          />

          <input
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            placeholder="Artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            disabled={!dj.is_live}
          />

          <div className="grid grid-cols-2 gap-4">
            <select
              value={tipCurrency}
              onChange={(e) => setTipCurrency(e.target.value)}
              className="p-4 rounded-xl bg-black border border-zinc-700"
              disabled={!dj.is_live}
            >
              <option value="GHS">🇬🇭 GHS</option>
              <option value="USD">🇺🇸 USD</option>
            </select>

            <input
              type="number"
              min="1"
              value={tipAmount === 0 ? "" : tipAmount}
              onChange={(e) => setTipAmount(Number(e.target.value))}
              className="p-4 rounded-xl bg-black border border-zinc-700"
              placeholder="Tip Amount"
              disabled={!dj.is_live}
            />
          </div>

          <button
            onClick={handlePayment}
            disabled={submitting || !dj.is_live}
            className="w-full bg-purple-600 hover:bg-purple-700 transition p-4 rounded-xl text-xl font-semibold disabled:opacity-50"
          >
            {!dj.is_live
              ? "Requests Closed"
              : submitting
              ? "Processing Payment..."
              : `Pay ${tipCurrency} ${tipAmount || 0} & Request`}
          </button>
        </div>
      </div>
    </main>
  );
}