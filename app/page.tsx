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
  tip_amount: number;
  tip_currency: string;
};

export default function Home() {
  const [name, setName] = useState("");
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [tipAmount, setTipAmount] = useState(10);
  const [tipCurrency, setTipCurrency] = useState("GHS");
  const [requests, setRequests] = useState<Request[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("tip_amount", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setRequests((data || []) as Request[]);
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

  async function handlePayment() {
    if (!name.trim() || !song.trim() || !artist.trim()) {
      alert("Please fill all fields");
      return;
    }

    if (!tipAmount || tipAmount < 1) {
      alert("Please enter a valid tip amount");
      return;
    }

    setSubmitting(true);

    const PaystackPop =
      (await import("@paystack/inline-js")).default;

    const paystack = new PaystackPop();

    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: `${name.replace(/\s/g, "")}@blackline.app`,
      amount: tipAmount * 100,
      currency: tipCurrency,

      metadata: {
        custom_fields: [
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

          await supabase.from("payments").insert([
            {
              request_id: requestData.id,
              guest_name: name.trim(),
              song: song.trim(),
              artist: artist.trim(),
              amount: tipAmount,
              currency: tipCurrency,
              status: "paid",
              provider: "paystack",
              provider_reference: transaction.reference,
              dj_amount: tipAmount * 0.9,
              platform_fee: tipAmount * 0.1,
            },
          ]);

          await fetchRequests();

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

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-10">
      <div className="bg-zinc-900 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-800">
        <h1 className="text-5xl font-bold text-center mb-3 text-purple-500">
          BLACKLINE
        </h1>

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

          <div className="grid grid-cols-2 gap-4">
            <select
              value={tipCurrency}
              onChange={(e) => setTipCurrency(e.target.value)}
              className="p-4 rounded-xl bg-black border border-zinc-700"
            >
              <option value="GHS">🇬🇭 GHS</option>
              <option value="USD">🇺🇸 USD</option>
              <option value="EUR">🇪🇺 EUR</option>
              <option value="GBP">🇬🇧 GBP</option>
              <option value="CAD">🇨🇦 CAD</option>
              <option value="AUD">🇦🇺 AUD</option>
              <option value="NGN">🇳🇬 NGN</option>
              <option value="KES">🇰🇪 KES</option>
              <option value="ZAR">🇿🇦 ZAR</option>
              <option value="SGD">🇸🇬 SGD</option>
              <option value="MYR">🇲🇾 MYR</option>
              <option value="IDR">🇮🇩 IDR</option>
              <option value="THB">🇹🇭 THB</option>
              <option value="PHP">🇵🇭 PHP</option>
              <option value="VND">🇻🇳 VND</option>
              <option value="CNY">🇨🇳 CNY</option>
              <option value="JPY">🇯🇵 JPY</option>
              <option value="KRW">🇰🇷 KRW</option>
              <option value="INR">🇮🇳 INR</option>
              <option value="AED">🇦🇪 AED</option>
              <option value="SAR">🇸🇦 SAR</option>
              <option value="QAR">🇶🇦 QAR</option>
              <option value="BRL">🇧🇷 BRL</option>
              <option value="MXN">🇲🇽 MXN</option>
            </select>

            <input
              type="number"
              min="1"
              value={tipAmount === 0 ? "" : tipAmount}
              onChange={(e) => setTipAmount(Number(e.target.value))}
              className="p-4 rounded-xl bg-black border border-zinc-700"
              placeholder="Tip Amount"
            />
          </div>
          <div className="bg-black border border-purple-800 rounded-2xl p-4 mt-4">
  <p className="text-sm text-zinc-400 mb-3">
    Boost Your Request 🔥
  </p>

  <div className="grid grid-cols-4 gap-2">
    {[10, 20, 50, 100].map((boost) => (
      <button
        key={boost}
        type="button"
        onClick={() =>
          setTipAmount((current) => Number(current || 0) + boost)
        }
        className="bg-purple-700 hover:bg-purple-600 px-3 py-3 rounded-xl font-bold text-sm"
      >
        +{tipCurrency} {boost}
      </button>
    ))}
  </div>
</div>
          <button
            onClick={handlePayment}
            disabled={submitting}
            className="w-full bg-purple-600 hover:bg-purple-700 transition p-4 rounded-xl text-xl font-semibold disabled:opacity-50"
          >
            {submitting
              ? "Processing Payment..."
              : `Pay ${tipCurrency} ${tipAmount || 0} & Request`}
          </button>
        </div>
      </div>

      <div className="mt-10 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold">Live Requests</h2>

          <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-bold">
            VIP Priority
          </span>
        </div>

        <div className="space-y-4">
          {requests.map((request, index) => (
            <div
              key={request.id}
              className={`bg-zinc-900 p-4 rounded-xl border ${
                index === 0 ? "border-yellow-500" : "border-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-lg">{request.song}</p>

                <div className="flex gap-2 items-center">
                  {index === 0 && (
                    <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                      TOP TIP
                    </span>
                  )}

                  <span className="bg-green-600 text-xs px-3 py-1 rounded-full font-bold">
                    {request.tip_currency} {request.tip_amount}
                  </span>
                </div>
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