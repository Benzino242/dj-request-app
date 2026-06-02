"use client";
import { translations, Language } from "../lib/translations";
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
  event_name: string | null;
  venue: string | null;
};

export default function StageRequestPage() {
  const params = useParams();
  const stage = String(params.stage || "").toLowerCase();

  const [dj, setDj] = useState<DJ | null>(null);
  const [djLoading, setDjLoading] = useState(true);

  const [name, setName] = useState("");
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");

  type AppleTrack = {
    id: number;
    song: string;
    artist: string;
    album?: string;
    image?: string;
    appleUrl?: string;
    previewUrl?: string;
  };

  const [songSearch, setSongSearch] = useState("");
  const [songResults, setSongResults] = useState<AppleTrack[]>([]);
  const [songSearchLoading, setSongSearchLoading] = useState(false);

  const [tipAmount, setTipAmount] = useState(10);
  const [tipCurrency, setTipCurrency] = useState("GHS");
  const [requests, setRequests] = useState<Request[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [submitting, setSubmitting] = useState(false);

  const t = translations[language];

  const [nowPlaying, setNowPlaying] = useState<Request | null>(null);
  const [upNext, setUpNext] = useState<Request | null>(null);
  const [flashAlert, setFlashAlert] = useState(false);
  const previousNowPlayingId = useRef<number | null>(null);
  function isVIPRequest(tip: number) {
    return tip >= 50;
  }
  function getEstimatedWait(index: number) {
    const minutesPerSong = 4;
    return (index + 1) * minutesPerSong;
  }

  async function fetchDJ() {
    if (!stage) return;

    const { data, error } = await supabase
  .from("djs")
  .select("*")
  .ilike("stage_name", stage)
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

    const latestPlayed = allRequests.find((request) => request.status === "played");
    const nextAccepted = allRequests.find(
      (request) => request.status === "accepted"
    );
    
    setUpNext(nextAccepted || null);

    if (latestPlayed) {
      setNowPlaying(latestPlayed);
    
      if (latestPlayed.id !== previousNowPlayingId.current) {
        previousNowPlayingId.current = latestPlayed.id;
    
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.([300, 150, 300, 150, 500]);
        }
    
        setFlashAlert(true);
        setTimeout(() => setFlashAlert(false), 1800);
      }
    } else {
      setNowPlaying(null);
      previousNowPlayingId.current = null;
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
    
    if (duplicateWarning) {
      alert("This song is already in the queue. Please choose another song.");
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
    <main
      className={`min-h-screen bg-black text-white flex flex-col items-center p-10 ${
        flashAlert ? "animate-pulse" : ""
      }`}
    >
      {flashAlert && (
        <div className="fixed inset-0 bg-purple-600/30 z-50 pointer-events-none animate-pulse" />
      )}

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
            {t.requestedBy} {nowPlaying.name}
            </p>
          </div>
        </div>
      )}


      <div className="bg-zinc-900 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-800">
      <div className="flex justify-end mb-6">
  <select
    value={language}
    onChange={(e) => setLanguage(e.target.value as Language)}
    className="bg-black border border-zinc-700 rounded-xl px-4 py-2 text-sm"
  >
      <option value="en">🇺🇸 English</option>
    <option value="zh">🇨🇳 中文</option>
    <option value="ja">🇯🇵 日本語</option>
    <option value="ko">🇰🇷 한국어</option>
    <option value="id">🇮🇩 Bahasa Indonesia</option>
    <option value="ms">🇲🇾 Bahasa Melayu</option>
    <option value="th">🇹🇭 ไทย</option>
    <option value="hi">🇮🇳 हिन्दी</option>
    <option value="ar">🇦🇪 العربية</option>
    <option value="vi">🇻🇳 Tiếng Việt</option>
    <option value="tl">🇵🇭 Tagalog</option>
    <option value="pt">🇧🇷 Português</option>
    <option value="es">🇪🇸 Español</option>
    <option value="fr">🇫🇷 Français</option>
    <option value="de">🇩🇪 Deutsch</option>
    <option value="ru">🇷🇺 Русский</option>
    <option value="tr">🇹🇷 Türkçe</option>
    <option value="it">🇮🇹 Italiano</option>
    <option value="nl">🇳🇱 Nederlands</option>
    <option value="pl">🇵🇱 Polski</option>
    <option value="el">🇬🇷 Ελληνικά</option>
    <option value="uk">🇺🇦 Українська</option>
   </select>
    </div>
        <div className="text-center mb-6">
          {dj.profile_image && (
            <img
              src={dj.profile_image}
              alt={dj.stage_name}
              className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 border-purple-600"
            />
          )}

<p className="text-zinc-500 text-sm mb-2">
  {t.requestingFromDj}
</p>

          <h1 className="text-5xl font-bold mb-3 text-purple-500 uppercase">
            {dj.stage_name}
          </h1>

          <div
            className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${
              dj.is_live ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {dj.is_live ? t.liveNow : t.offline}
          </div>

          {dj.event_name && (
         <div className="mb-3">
      <p className="text-purple-400 font-bold text-lg">
      {dj.event_name}
    </p>

    {dj.venue && (
      <p className="text-white text-sm mt-1">
        📍 {dj.venue}
      </p>
    )}
  </div>
)}

          {dj.city && (
            <p className="text-zinc-400 text-sm mb-2">📍 {dj.city}</p>
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
        {t.requestInstruction}
        </p>

        <div className="bg-purple-950 border border-purple-700 p-4 rounded-2xl mb-6">
          <p className="text-sm text-purple-200">
          {t.higherTips}
          </p>
        </div>

        <div className="space-y-4">
          <input
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            placeholder={t.yourName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!dj.is_live}
          />

<div className="relative">
  <input
    className="w-full p-4 rounded-xl bg-black border border-zinc-700"
    placeholder={t.songName}
    value={song}
    onChange={async (e) => {
      const value = e.target.value;

      setSong(value);
      setSongSearch(value);

      const existingRequest = requests.find(
        (request) =>
          request.song.toLowerCase().trim() ===
          value.toLowerCase().trim()
      );

      if (existingRequest) {
        setDuplicateWarning(
          `⚠️ "${value}" is already in the queue`
        );
      } else {
        setDuplicateWarning("");
      }

      if (value.length < 3) {
        setSongResults([]);
        return;
      }

      try {
        setSongSearchLoading(true);

        const response = await fetch(
          `/api/apple-search?q=${encodeURIComponent(value)}`
        );

        const data = await response.json();

        setSongResults(data.tracks || []);
      } catch (error) {
        console.error(error);
      } finally {
        setSongSearchLoading(false);
      }
    }}
    disabled={!dj.is_live}
  />

{songResults.length > 0 && (
  <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-xl max-h-96 overflow-y-auto">
    {songResults.map((track) => (
      <button
        key={track.id}
        type="button"
        className="w-full text-left p-3 hover:bg-zinc-800 transition border-b border-zinc-800"
        onClick={() => {
          setSong(track.song);
          setArtist(track.artist);
          setSongResults([]);
        }}
      >
        <div className="font-semibold text-white">
          {track.song}
        </div>

        <div className="text-sm text-zinc-400">
          {track.artist}
        </div>
      </button>
    ))}

    <button
      type="button"
      className="w-full text-left p-3 bg-black hover:bg-zinc-800 transition text-purple-300 font-semibold"
      onClick={() => {
        setSongResults([]);
      }}
    >
      Use "{song}" and enter artist manually
    </button>
  </div>
)}
</div>

{duplicateWarning && (
  <div className="bg-yellow-950 border border-yellow-600 text-yellow-300 p-3 rounded-xl text-sm">
    {duplicateWarning}
  </div>
)}

          <input
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            placeholder={t.artist}
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
              disabled={!dj.is_live}
            />
          </div>

          <div className="bg-black border border-purple-800 rounded-2xl p-4 mt-4">
            <p className="text-sm text-zinc-400 mb-3">
              {t.boostYourRequest}
            </p>

            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 50, 100].map((boost) => (
                <button
                  key={boost}
                  type="button"
                  onClick={() =>
                    setTipAmount((current) => Number(current || 0) + boost)
                  }
                  disabled={!dj.is_live}
                  className="bg-purple-700 hover:bg-purple-600 px-3 py-3 rounded-xl font-bold text-sm disabled:opacity-40"
                >
                  +{tipCurrency} {boost}
                </button>
              ))}
            </div>
          </div>
                
          <button
              onClick={handlePayment}
              disabled={submitting || !dj.is_live || tipCurrency !== "GHS"}
              className="w-full bg-purple-600 hover:bg-purple-700 transition p-4 rounded-xl text-xl font-semibold disabled:opacity-50"
            >
              {!dj.is_live
                ? t.requestsClosed
                : tipCurrency !== "GHS"
                ? `${tipCurrency} payments are coming soon. Please use GHS for now.`
                : submitting
                ? t.processingPayment
                : `${t.pay} ${tipCurrency} ${tipAmount || 0} ${t.andRequest}`}
            </button>
                
                          <p className="text-xs text-zinc-500 text-center mt-4 leading-relaxed">
                            {t.boostingDisclaimer}
                          </p>
                        </div>
                      </div>
                
                      {requests.find((request) => request.status === "accepted") && (
                        <div className="mt-10 w-full max-w-md">
                          <div className="bg-zinc-900 border border-cyan-500 p-5 rounded-3xl text-center shadow-[0_0_25px_rgba(34,211,238,0.3)] mb-6">
                            <p className="text-xs tracking-[0.3em] text-cyan-400 font-bold mb-2">
                              {t.upNext}
                            </p>
                
                            <h2 className="text-2xl font-black text-white">
                              {requests.find((request) => request.status === "accepted")?.song}
                            </h2>
                
                            <p className="text-zinc-300 mt-2">
                              {requests.find((request) => request.status === "accepted")?.artist}
                            </p>
                
                            <p className="text-cyan-400 text-sm mt-3">
                              {t.requestedBy}{" "}
                              {requests.find((request) => request.status === "accepted")?.name}
                            </p>
                          </div>
                        </div>
                      )}
                
                      <div className="mt-10 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-3xl font-bold">{t.liveRequests}</h2>
                
                          <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-bold">
                            {t.vipPriorityFull}
                          </span>
                        </div>
                
                        <div className="space-y-4">
                          {requests
                            .filter((request) => request.status !== "finished")
                            .map((request, index) => (
                              <div
                                key={request.id}
                                className={`rounded-xl p-4 transition-all duration-300 ${
                                  isVIPRequest(request.tip_amount)
                                    ? "bg-zinc-900 border-2 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.45)] scale-[1.02]"
                                    : index === 0
                                    ? "bg-zinc-900 border border-yellow-500"
                                    : "bg-zinc-900 border border-zinc-800"
                                }`}
                              >
                                {isVIPRequest(request.tip_amount) && (
                                  <div className="mb-2 inline-block bg-yellow-500 text-black text-xs font-black px-3 py-1 rounded-full">
                                    {t.vipRequest}
                                  </div>
                                )}
                
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-bold text-lg">{request.song}</p>
                
                                  <div className="flex gap-2 items-center">
                                    {index === 0 && (
                                      <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                                        {t.topTip}
                                      </span>
                                    )}
                
                                    <span
                                      className={`text-xs px-3 py-1 rounded-full font-bold ${
                                        request.status === "accepted"
                                          ? "bg-green-600 text-white"
                                          : request.status === "rejected"
                                          ? "bg-red-600 text-white"
                                          : request.status === "played"
                                          ? "bg-blue-600 text-white"
                                          : "bg-yellow-500 text-black"
                                      }`}
                                    >
                                      {request.status === "accepted"
                                        ? t.accepted
                                        : request.status === "rejected"
                                        ? t.rejected
                                        : request.status === "played"
                                        ? t.played
                                        : t.pending}
                                    </span>
                
                                    <span className="bg-green-600 text-xs px-3 py-1 rounded-full font-bold">
                                      {request.tip_currency} {request.tip_amount}
                                    </span>
                                  </div>
                                </div>
                
                                <p className="text-zinc-400">{request.artist}</p>
                
                                <p className="text-sm text-purple-400 mt-2">
                                  {t.requestedBy} {request.name}
                                </p>
                
                                {request.status !== "played" &&
                                  request.status !== "finished" && (
                                    <p className="text-xs text-cyan-400 mt-2">
                                      {t.estimatedWait}: ~{getEstimatedWait(index)} mins
                                    </p>
                                  )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </main>
                  );
                }