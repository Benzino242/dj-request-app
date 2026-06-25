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

  artwork?: string | null;
  album?: string | null;

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

  const [selectedArtwork, setSelectedArtwork] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState("");

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
  const [duplicateRequest, setDuplicateRequest] = useState<Request | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [submitting, setSubmitting] = useState(false);

  const t = translations[language];

  const [nowPlaying, setNowPlaying] = useState<Request | null>(null);
  const [upNext, setUpNext] = useState<Request | null>(null);
  const [flashAlert, setFlashAlert] = useState(false);

  const previousNowPlayingId = useRef<number | null>(null);
  const songSearchBoxRef = useRef<HTMLDivElement | null>(null);

  function isVIPRequest(tip: number) {
    return tip >= 50;
  }
  function getEstimatedWait(index: number) {
    const minutesPerSong = 4;
    return (index + 1) * minutesPerSong;
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        songSearchBoxRef.current &&
        !songSearchBoxRef.current.contains(event.target as Node)
      ) {
        setSongResults([]);
      }
    }
  
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

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
    if (submitting) {
      return;
    }

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

    let finalArtwork = selectedArtwork;
    let finalAlbum = selectedAlbum;

    if (!finalArtwork || !finalAlbum) {
      try {
        const response = await fetch(
          `/api/apple-search?q=${encodeURIComponent(`${song} ${artist}`)}`
        );

        const data = await response.json();
        const firstTrack = data.tracks?.[0];

        finalArtwork = firstTrack?.image || "";
        finalAlbum = firstTrack?.album || "";
      } catch (error) {
        console.error("Artwork lookup failed:", error);
      }
    }

    setSubmitting(true);

    const PaystackPop = (await import("@paystack/inline-js")).default;
    const paystack = new PaystackPop();

    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: `${name.replace(/\s/g, "").toLowerCase()}@blackline.app`,
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
        const paymentReference = transaction?.reference;

        if (!paymentReference) {
          console.error("PAYSTACK SUCCESS WITHOUT REFERENCE:", transaction);
          alert(
            "Payment succeeded, but no payment reference was returned. Please contact Blackline support."
          );
          setSubmitting(false);
          return;
        }

        try {
          const verifyResponse = await fetch("/api/paystack/verify-transaction", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reference: paymentReference,
              expectedAmount: tipAmount,
              expectedCurrency: tipCurrency,
            }),
          });

          const verifyResult = await verifyResponse.json();

          if (!verifyResponse.ok || !verifyResult.verified) {
            console.error("PAYSTACK VERIFY ERROR:", verifyResult);
            alert(
              `Payment could not be verified yet. Please contact Blackline support with this reference: ${paymentReference}`
            );
            return;
          }

          const { data: existingPayment, error: existingPaymentError } =
            await supabase
              .from("payments")
              .select("id, request_id, provider_reference")
              .eq("provider_reference", paymentReference)
              .maybeSingle();

          if (existingPaymentError) {
            console.error("PAYMENT REFERENCE CHECK ERROR:", existingPaymentError);
          }

          if (existingPayment) {
            console.warn("DUPLICATE PAYMENT CALLBACK IGNORED:", existingPayment);

            await fetchRequests(dj.id);

            alert(
              `Payment already recorded. Reference: ${paymentReference}`
            );

            setName("");
            setSong("");
            setArtist("");
            setSongSearch("");
            setSongResults([]);
            setSelectedArtwork("");
            setSelectedAlbum("");
            setTipAmount(10);
            setDuplicateRequest(null);
            setSubmitting(false);
            return;
          }

          let requestData;
          let error;

          if (duplicateRequest) {
            const newTipTotal =
              Number(duplicateRequest.tip_amount || 0) +
              Number(tipAmount || 0);

            const result = await supabase
              .from("requests")
              .update({
                tip_amount: newTipTotal,
                artwork: duplicateRequest.artwork || finalArtwork,
                album: duplicateRequest.album || finalAlbum,
              })
              .eq("id", duplicateRequest.id)
              .select()
              .single();

            requestData = result.data;
            error = result.error;
          } else {
            const result = await supabase
              .from("requests")
              .insert([
                {
                  dj_id: dj.id,
                  name: name.trim(),
                  song: song.trim(),
                  artist: artist.trim(),

                  artwork: finalArtwork,
                  album: finalAlbum,

                  status: "pending",
                  tip_amount: tipAmount,
                  tip_currency: tipCurrency,
                },
              ])
              .select()
              .single();

            requestData = result.data;
            error = result.error;
          }

          if (error || !requestData) {
            console.error("REQUEST SAVE ERROR:", error);
            alert(
              `Payment succeeded, but the request could not be saved. Please contact Blackline support with this reference: ${paymentReference}`
            );
            return;
          }

          const paidAmount = Number(tipAmount || 0);
          const platformFee = Number((paidAmount * 0.1).toFixed(2));
          const djAmount = Number((paidAmount - platformFee).toFixed(2));

          const { error: paymentError } = await supabase.from("payments").insert([
            {
              dj_id: dj.id,
              request_id: requestData.id,
              guest_name: name.trim(),
              song: song.trim(),
              artist: artist.trim(),
              amount: paidAmount,
              currency: tipCurrency,
              status: "paid",
              provider: "paystack",
              provider_reference: paymentReference,
              dj_amount: djAmount,
              platform_fee: platformFee,
            },
          ]);

          if (paymentError) {
            console.error("PAYMENT INSERT ERROR:", paymentError);
            alert(
              `Your request was saved, but the payment record could not be stored. Please contact Blackline support with this reference: ${paymentReference}`
            );
            return;
          }

          await fetchRequests(dj.id);

          setName("");
          setSong("");
          setArtist("");
          setSongSearch("");
          setSongResults([]);
          setSelectedArtwork("");
          setSelectedAlbum("");
          setTipAmount(10);
          setDuplicateRequest(null);

          alert(
            `Payment successful & request submitted! Reference: ${paymentReference}`
          );
        } catch (err) {
          console.error("PAYMENT SUCCESS HANDLER ERROR:", err);
          alert(
            `Payment succeeded, but something went wrong after payment. Please contact Blackline support with this reference: ${paymentReference}`
          );
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
    <div
      className="relative overflow-hidden p-6 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.7)] border border-purple-300 text-center"
      style={{
        backgroundImage: nowPlaying.artwork
          ? `url(${nowPlaying.artwork})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />
      <div className="relative z-10">
        {nowPlaying.artwork && (
          <img
            src={nowPlaying.artwork}
            alt={nowPlaying.song}
            className="w-32 h-32 mx-auto rounded-2xl object-cover mb-4 shadow-lg"
          />
        )}

            <p className="text-sm font-bold tracking-[0.3em] text-white mb-2">
              NOW PLAYING 🎵
            </p>

            <div className="flex justify-center items-end gap-1 mb-4">
              <div className="w-1 h-3 bg-white/80 rounded animate-pulse"></div>
              <div
                className="w-1 h-5 bg-white/80 rounded animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-1 h-7 bg-white/80 rounded animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
              <div
                className="w-1 h-4 bg-white/80 rounded animate-pulse"
                style={{ animationDelay: "0.6s" }}
              ></div>
              <div
                className="w-1 h-6 bg-white/80 rounded animate-pulse"
                style={{ animationDelay: "0.8s" }}
              ></div>
            </div>

            <h1
          className="text-2xl md:text-3xl font-black text-white leading-tight"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {nowPlaying.song}
        </h1>

        <p className="text-white/80 text-lg mt-2">
          {nowPlaying.artist}
        </p>

        {nowPlaying.album && (
          <p className="text-xs text-white/60 mt-2">
            {nowPlaying.album}
          </p>
        )}

        <p className="text-xs text-white/70 mt-4">
          {t.requestedBy} {nowPlaying.name}
        </p>
      </div>
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
    className={`w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 ${
      dj.is_live
        ? "border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.55)]"
        : "border-purple-600"
    }`}
  />
)}
            

<h1 className="text-5xl font-black mb-3 text-purple-400 uppercase tracking-wide drop-shadow-[0_0_18px_rgba(168,85,247,0.45)]">
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
  </div>
)}

<div className="flex flex-wrap justify-center gap-2 mt-3 mb-3">
{dj.venue && (
  <a
    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      dj.venue
    )}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm hover:border-purple-500/50 hover:text-purple-300 transition"
  >
    📍 {dj.venue}
  </a>
)}
</div>

          

{dj.instagram && (
  <div className="mt-4">
    <a
      href={`https://instagram.com/${dj.instagram.replace("@", "")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block bg-purple-500/15 border border-purple-500/30 text-purple-300 text-sm font-bold px-4 py-2 rounded-full hover:bg-purple-500/25 transition"
    >
      📸 {dj.instagram}
    </a>
  </div>
)}
        </div>

        {!dj.is_live && (
          <div className="bg-red-950 border border-red-700 p-4 rounded-2xl mb-6 text-center">
            <p className="text-red-200 font-semibold">
              This DJ is currently offline. Requests are closed.
            </p>
          </div>
        )}

<div className="text-center mb-8">
  <p className="text-zinc-400 text-sm uppercase tracking-[0.2em]">
    {t.requestInstruction}
  </p>
</div>

        <div className="relative overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-black border border-purple-500/60 p-5 rounded-3xl mb-6 shadow-[0_0_30px_rgba(168,85,247,0.22)]">
  <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-500/20 rounded-full blur-2xl" />

  <div className="relative z-10">
    <p className="text-purple-200 text-xs font-black uppercase tracking-[0.2em] mb-2">
    🔥 {t.skipTheQueue}
    </p>

    <p className="text-white text-base font-semibold leading-snug">
      {t.higherTips}
    </p>
  </div>
</div>

        <div className="space-y-4">
          <input
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            placeholder={t.yourName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!dj.is_live}
          />

<div
  ref={songSearchBoxRef}
  className="relative"
>
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
          ["pending", "accepted"].includes(request.status) &&
          request.song.toLowerCase().trim() === value.toLowerCase().trim() &&
          request.artist.toLowerCase().trim() === artist.toLowerCase().trim()
      );

      if (existingRequest) {
        setDuplicateRequest(existingRequest);
      } else {
        setDuplicateRequest(null);
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
  <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-xl max-h-80 overflow-y-auto">

    {songResults.map((track) => (
      <button
        key={track.id}
        type="button"
        className="w-full text-left p-3 hover:bg-zinc-800 transition border-b border-zinc-800"
        onClick={() => {
          setSong(track.song);
          setArtist(track.artist);
        
          setSelectedArtwork(track.image || "");
          setSelectedAlbum(track.album || "");
        
          setSongResults([]);
        
          const existingRequest = requests.find(
            (request) =>
              ["pending", "accepted"].includes(request.status) &&
              request.song.toLowerCase().trim() ===
                track.song.toLowerCase().trim() &&
              request.artist.toLowerCase().trim() ===
                track.artist.toLowerCase().trim()
          );
        
          if (existingRequest) {
            setDuplicateRequest(existingRequest);
          } else {
            setDuplicateRequest(null);
          }
        }}
      >
      <div className="flex items-center gap-3">
  {track.image && (
    <img
      src={track.image}
      alt={track.song}
      className="w-14 h-14 rounded-lg object-cover"
    />
  )}
          <div className="flex-1">
            <div className="font-semibold text-white">
              {track.song}
            </div>
      
            <div className="text-sm text-zinc-400">
              {track.artist}
            </div>
      
            {track.album && (
              <div className="text-xs text-zinc-500 mt-1">
                {track.album}
              </div>
            )}
          </div>
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

{duplicateRequest && (
  <div className="relative overflow-hidden bg-gradient-to-br from-yellow-950 via-orange-950 to-black border border-yellow-500/70 p-4 rounded-3xl mt-4 shadow-[0_0_35px_rgba(234,179,8,0.18)]">
    <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl" />

    <div className="relative z-10">
      <div className="text-yellow-300 font-black text-xl mb-4">
        {t.songAlreadyRequested}
      </div>

      <div className="flex gap-4">
        {duplicateRequest.artwork && (
          <img
            src={duplicateRequest.artwork}
            alt={duplicateRequest.song}
            className="w-16 h-16 rounded-xl object-cover shadow-lg border border-yellow-500/30"
          />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-xl leading-tight truncate">
            {duplicateRequest.song}
          </p>

          {duplicateRequest.artist && (
            <p className="text-zinc-300 text-sm mt-1 truncate">
              {duplicateRequest.artist}
            </p>
          )}

          {duplicateRequest.album && (
            <p className="text-zinc-500 text-xs mt-1 truncate">
              Album: {duplicateRequest.album}
            </p>
          )}

          <p className="text-yellow-200 text-sm mt-2 font-semibold">
            {t.requestedBy} {duplicateRequest.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-black/30 border border-yellow-500/10 rounded-2xl p-3">
          <p className="text-yellow-300 text-xs font-black uppercase tracking-wide">
            {t.currentPosition}
          </p>

          <p className="text-3xl font-black text-white mt-1">
            #
            {requests
              .filter((request) => request.status !== "finished")
              .findIndex(
                (request) => request.id === duplicateRequest.id
              ) + 1}
          </p>
        </div>

        <div className="bg-black/30 border border-yellow-500/10 rounded-2xl p-3">
          <p className="text-yellow-300 text-xs font-black uppercase tracking-wide">
            {t.currentBoost}
          </p>

          <p className="text-4xl font-black text-white mt-1">
            {tipCurrency} {duplicateRequest.tip_amount}
          </p>
        </div>
      </div>

      <p className="text-zinc-300 text-sm mt-4 leading-relaxed">
        {t.songAlreadyInQueue}
        <br />
        {t.boostToMoveHigher}
      </p>

      <div className="grid grid-cols-4 gap-2 mt-4">
        {[10, 20, 50, 100].map((amount) => (
          <button
            key={amount}
            type="button"
            className="bg-purple-600 hover:bg-purple-700 rounded-xl py-3 font-bold flex flex-col items-center justify-center transition-all hover:scale-105"
            onClick={() => {
              setTipAmount(amount);
            }}
          >
            <span className="text-xs opacity-80">
              +{tipCurrency}
            </span>

            <span className="text-lg font-black">
              {amount}
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
)}

<div className="relative">
<input
  className="w-full p-4 rounded-xl bg-black border border-zinc-700"
  placeholder={t.artist}
  value={artist}
  onChange={async (e) => {
    const value = e.target.value;

    setArtist(value);

    if (!song.trim() && value.length >= 3) {
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
    }
  }}
  disabled={!dj.is_live}
/>

  {!song.trim() && artist.trim() && songResults.length > 0 && (
    <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-xl max-h-96 overflow-y-auto">
      <div className="p-3 text-xs text-purple-300 font-bold bg-black border-b border-zinc-800">
        Popular songs by {artist}
      </div>

      {songResults.map((track) => (
        <button
          key={track.id}
          type="button"
          className="w-full text-left p-3 hover:bg-zinc-800 transition border-b border-zinc-800"
          onClick={() => {
            setSong(track.song);
            setArtist(track.artist);
          
            setSelectedArtwork(track.image || "");
            setSelectedAlbum(track.album || "");
          
            setSongResults([]);
          
            const existingRequest = requests.find(
              (request) =>
                ["pending", "accepted"].includes(request.status) &&
                request.song.toLowerCase().trim() ===
                  track.song.toLowerCase().trim() &&
                request.artist.toLowerCase().trim() ===
                  track.artist.toLowerCase().trim()
            );
          
            if (existingRequest) {
              setDuplicateRequest(existingRequest);
            } else {
              setDuplicateRequest(null);
            }
          }}
        >
          <div className="flex items-center gap-3">
            {track.image && (
              <img
                src={track.image}
                alt={track.song}
                className="w-14 h-14 rounded-lg object-cover"
              />
            )}

            <div className="flex-1">
              <div className="font-semibold text-white">
                {track.song}
              </div>

              <div className="text-sm text-zinc-400">
                {track.artist}
              </div>

              {track.album && (
                <div className="text-xs text-zinc-500 mt-1">
                  {track.album}
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )}
</div>

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

          <div className="bg-black border border-purple-800 rounded-2xl p-5 mt-4 relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent pointer-events-none" />

  <div className="relative z-10">
  <p className="text-purple-200 text-xs font-black uppercase tracking-[0.2em] mb-2">
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
          className="bg-purple-700 hover:bg-purple-600 px-3 py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-all hover:scale-105"
        >
          +{tipCurrency}
          <div className="text-lg font-black">
            {boost}
          </div>
        </button>
      ))}
    </div>
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
                
                      {upNext && (
                      <div className="mt-10 w-full max-w-md">
                        <div className="bg-zinc-900 border border-cyan-500 p-5 rounded-3xl text-center shadow-[0_0_25px_rgba(34,211,238,0.3)] mb-6">

                          {upNext.artwork && (
                            <img
                              src={upNext.artwork}
                              alt={upNext.song}
                              className="w-24 h-24 mx-auto rounded-2xl object-cover mb-4 shadow-lg"
                            />
                          )}

                          <p className="text-xs tracking-[0.3em] text-cyan-400 font-bold mb-2">
                            {t.upNext}
                          </p>

                          <h2 className="text-2xl font-black text-white">
                            {upNext.song}
                          </h2>

                          <p className="text-zinc-300 mt-2">
                            {upNext.artist}
                          </p>

                          {upNext.album && (
                            <p className="text-xs text-zinc-500 mt-2">
                              {upNext.album}
                            </p>
                          )}

                          <p className="text-cyan-400 text-sm mt-3">
                            {t.requestedBy} {upNext.name}
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
                
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                      {request.artwork && (
                                        <img
                                          src={request.artwork}
                                          alt={request.song}
                                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                        />
                                      )}

                                      <div className="min-w-0">
                                        <p className="font-bold text-lg leading-tight break-words">
                                          {request.song}
                                        </p>

                                        <p className="text-zinc-400 text-sm">
                                          {request.artist}
                                        </p>

                                        {request.album && (
                                          <p className="text-xs text-zinc-500 mt-1">
                                            {request.album}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
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