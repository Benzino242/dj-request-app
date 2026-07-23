





"use client";

import { translations, Language } from "../lib/translations";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import BookingModal from "../components/BookingModal";

type PaymentSuccessTranslation = {

  paymentReceived: string;
  requestSent: string;
  boostAdded: string;
  requestAdded: string;
  song: string;
  amount: string;
  paystackReference: string;
  done: string;
  savedSupport: string;
  beforePaymentReference: string;
};


const paymentSuccessTranslations: Record<Language, PaymentSuccessTranslation> = {

  en: {
    paymentReceived: "Payment received",
    requestSent: "Request sent to the DJ",
    boostAdded: "Your boost was added to the existing request.",
    requestAdded: "Your song request has been added to the live queue.",
    song: "Song",
    amount: "Amount",
    paystackReference: "Paystack reference",
    done: "Done",
    savedSupport: "Your request is saved. Keep this reference if you need support.",
    beforePaymentReference: "After payment, you’ll receive a Paystack reference for support.",
  },
  zh: {
    paymentReceived: "",
    requestSent: "DJ",
    boostAdded: "",
    requestAdded: "",
    song: "",
    amount: "",
    paystackReference: "Paystack",
    done: "",
    savedSupport: "",
    beforePaymentReference: "Paystack",
  },
  ja: {
    paymentReceived: "",
    requestSent: "DJ",
    boostAdded: "",
    requestAdded: "",
    song: "",
    amount: "",
    paystackReference: "Paystack",
    done: "",
    savedSupport: "",
    beforePaymentReference: "Paystack",
  },
  ko: {
    paymentReceived: " ",
    requestSent: " DJ ",
    boostAdded: "   .",
    requestAdded: "    .",
    song: "",
    amount: "",
    paystackReference: "Paystack ",
    done: "",
    savedSupport: " .     .",
    beforePaymentReference: "   Paystack   .",
  },
  id: {
    paymentReceived: "Pembayaran diterima",
    requestSent: "Request dikirim ke DJ",
    boostAdded: "Boost Anda ditambahkan ke request yang sudah ada.",
    requestAdded: "Request lagu Anda sudah masuk ke antrean live.",
    song: "Lagu",
    amount: "Jumlah",
    paystackReference: "Referensi Paystack",
    done: "Selesai",
    savedSupport: "Request Anda tersimpan. Simpan referensi ini jika perlu bantuan.",
    beforePaymentReference: "Setelah pembayaran, Anda akan menerima referensi Paystack untuk bantuan.",
  },
  ms: {
    paymentReceived: "Bayaran diterima",
    requestSent: "Permintaan dihantar kepada DJ",
    boostAdded: "Boost anda telah ditambah pada permintaan sedia ada.",
    requestAdded: "Permintaan lagu anda telah masuk ke barisan live.",
    song: "Lagu",
    amount: "Jumlah",
    paystackReference: "Rujukan Paystack",
    done: "Selesai",
    savedSupport: "Permintaan anda telah disimpan. Simpan rujukan ini jika perlukan bantuan.",
    beforePaymentReference: "Selepas bayaran, anda akan menerima rujukan Paystack untuk bantuan.",
  },
  th: {
    paymentReceived: "",
    requestSent: " DJ ",
    boostAdded: "",
    requestAdded: "",
    song: "",
    amount: "",
    paystackReference: " Paystack",
    done: "",
    savedSupport: " ",
    beforePaymentReference: "  Paystack ",
  },
  hi: {
    paymentReceived: "  ",
    requestSent: " DJ    ",
    boostAdded: " boost  request     .",
    requestAdded: " song request live queue     .",
    song: "Song",
    amount: "Amount",
    paystackReference: "Paystack reference",
    done: "Done",
    savedSupport: " request saved . Support    reference .",
    beforePaymentReference: "Payment    support   Paystack reference .",
  },
  ar: {
    paymentReceived: "  ",
    requestSent: "    DJ",
    boostAdded: "     .",
    requestAdded: "       .",
    song: "",
    amount: "",
    paystackReference: " Paystack",
    done: "",
    savedSupport: "  .       .",
    beforePaymentReference: "     Paystack .",
  },
  vi: {
    paymentReceived: "e3 nhn thanh toe1n",
    requestSent: "Yeau cu e3 gi n DJ",
    boostAdded: "Boost ca bn e3 c theam ve0o yeau cu hin cf3.",
    requestAdded: "Yeau cu be0i he1t ca bn e3 c theam ve0o he0ng i live.",
    song: "Be0i he1t",
    amount: "S tin",
    paystackReference: "Me3 tham chiu Paystack",
    done: "Xong",
    savedSupport: "Yeau cu ca bn e3 c lu. He3y gi me3 ne0y nu cn h tr.",
    beforePaymentReference: "Sau khi thanh toe1n, bn s nhn me3 Paystack  c h tr.",
  },
  tl: {
    paymentReceived: "Natanggap ang bayad",
    requestSent: "Naipadala ang request sa DJ",
    boostAdded: "Naidagdag ang boost mo sa existing request.",
    requestAdded: "Naidagdag ang song request mo sa live queue.",
    song: "Kanta",
    amount: "Halaga",
    paystackReference: "Paystack reference",
    done: "Done",
    savedSupport: "Naka-save na ang request mo. Itago ang reference na ito kung kailangan ng support.",
    beforePaymentReference: "Pagkatapos magbayad, makakatanggap ka ng Paystack reference para sa support.",
  },
  pt: {
    paymentReceived: "Pagamento recebido",
    requestSent: "Pedido enviado ao DJ",
    boostAdded: "O seu boost foi adicionado ao pedido existente.",
    requestAdded: "O seu pedido de mfasica foi adicionado e0 fila ao vivo.",
    song: "Mfasica",
    amount: "Valor",
    paystackReference: "Refereancia Paystack",
    done: "Conclueddo",
    savedSupport: "O seu pedido foi guardado. Guarde esta refereancia se precisar de suporte.",
    beforePaymentReference: "Apf3s o pagamento, recebere1 uma refereancia Paystack para suporte.",
  },
  es: {
    paymentReceived: "Pago recibido",
    requestSent: "Solicitud enviada al DJ",
    boostAdded: "Tu boost se agregf3 a la solicitud existente.",
    requestAdded: "Tu solicitud de cancif3n se agregf3 a la cola en vivo.",
    song: "Cancif3n",
    amount: "Monto",
    paystackReference: "Referencia de Paystack",
    done: "Listo",
    savedSupport: "Tu solicitud este1 guardada. Conserva esta referencia si necesitas soporte.",
    beforePaymentReference: "Despue9s del pago, recibire1s una referencia de Paystack para soporte.",
  },
  fr: {
    paymentReceived: "Paiement ree7u",
    requestSent: "Demande envoye9e au DJ",
    boostAdded: "Votre boost a e9te9 ajoute9 e0 la demande existante.",
    requestAdded: "Votre demande de chanson a e9te9 ajoute9e e0 la file en direct.",
    song: "Chanson",
    amount: "Montant",
    paystackReference: "Re9fe9rence Paystack",
    done: "Termine9",
    savedSupport: "Votre demande est enregistre9e. Gardez cette re9fe9rence si vous avez besoin d92aide.",
    beforePaymentReference: "Apre8s le paiement, vous recevrez une re9fe9rence Paystack pour le support.",
  },
  de: {
    paymentReceived: "Zahlung erhalten",
    requestSent: "Anfrage an den DJ gesendet",
    boostAdded: "Dein Boost wurde zur bestehenden Anfrage hinzugeffcgt.",
    requestAdded: "Dein Songwunsch wurde zur Live-Warteschlange hinzugeffcgt.",
    song: "Song",
    amount: "Betrag",
    paystackReference: "Paystack-Referenz",
    done: "Fertig",
    savedSupport: "Deine Anfrage wurde gespeichert. Bewahre diese Referenz ffcr den Support auf.",
    beforePaymentReference: "Nach der Zahlung erhe4ltst du eine Paystack-Referenz ffcr den Support.",
  },
  ru: {
    paymentReceived: " ",
    requestSent: "  DJ",
    boostAdded: "     .",
    requestAdded: "     live-.",
    song: "",
    amount: "",
    paystackReference: " Paystack",
    done: "",
    savedSupport: "  .     .",
    beforePaymentReference: "     Paystack  .",
  },
  tr: {
    paymentReceived: "d6deme alnd",
    requestSent: "stek DJ92ye gf6nderildi",
    boostAdded: "Boost mevcut istee eklendi.",
    requestAdded: "ark istein canl kuyrua eklendi.",
    song: "ark",
    amount: "Tutar",
    paystackReference: "Paystack referans",
    done: "Tamam",
    savedSupport: "stein kaydedildi. Destek gerekirse bu referans sakla.",
    beforePaymentReference: "d6demeden sonra destek ie7in bir Paystack referans alacaksn.",
  },
  it: {
    paymentReceived: "Pagamento ricevuto",
    requestSent: "Richiesta inviata al DJ",
    boostAdded: "Il tuo boost e8 stato aggiunto alla richiesta esistente.",
    requestAdded: "La tua richiesta e8 stata aggiunta alla coda live.",
    song: "Brano",
    amount: "Importo",
    paystackReference: "Riferimento Paystack",
    done: "Fatto",
    savedSupport: "La tua richiesta e8 salvata. Conserva questo riferimento per il supporto.",
    beforePaymentReference: "Dopo il pagamento riceverai un riferimento Paystack per il supporto.",
  },
  nl: {
    paymentReceived: "Betaling ontvangen",
    requestSent: "Verzoek naar de DJ gestuurd",
    boostAdded: "Je boost is toegevoegd aan het bestaande verzoek.",
    requestAdded: "Je songverzoek is toegevoegd aan de live wachtrij.",
    song: "Nummer",
    amount: "Bedrag",
    paystackReference: "Paystack-referentie",
    done: "Klaar",
    savedSupport: "Je verzoek is opgeslagen. Bewaar deze referentie voor support.",
    beforePaymentReference: "Na betaling ontvang je een Paystack-referentie voor support.",
  },
  pl: {
    paymentReceived: "Patno otrzymana",
    requestSent: "Proba wysana do DJ-a",
    boostAdded: "Twf3j boost zosta dodany do istniejcej proby.",
    requestAdded: "Twoja proba o piosenk zostaa dodana do kolejki live.",
    song: "Piosenka",
    amount: "Kwota",
    paystackReference: "Referencja Paystack",
    done: "Gotowe",
    savedSupport: "Twoja proba zostaa zapisana. Zachowaj t referencj w razie potrzeby wsparcia.",
    beforePaymentReference: "Po patnoci otrzymasz referencj Paystack do wsparcia.",
  },
  el: {
    paymentReceived: "  ",
    requestSent: "    DJ",
    boostAdded: " boost    .",
    requestAdded: "     live .",
    song: "",
    amount: "",
    paystackReference: " Paystack",
    done: "",
    savedSupport: "   .      .",
    beforePaymentReference: "  ,    Paystack  .",
  },
  uk: {
    paymentReceived: " ",
    requestSent: "  DJ",
    boostAdded: " boost    .",
    requestAdded: "     live-.",
    song: "",
    amount: "",
    paystackReference: " Paystack",
    done: "",
    savedSupport: "  .     .",
    beforePaymentReference: "     Paystack  .",
  },
};


const NOW_PLAYING_DURATION_MS = 5 * 60 * 1000;

type NowPlayingCountdownTranslation = {

  expiresIn: string;
};


const nowPlayingCountdownTranslations: Record<Language, NowPlayingCountdownTranslation> = {

  en: { expiresIn: "Expires in" },
  zh: { expiresIn: "" },
  ja: { expiresIn: "" },
  ko: { expiresIn: " " },
  id: { expiresIn: "Berakhir dalam" },
  ms: { expiresIn: "Tamat dalam" },
  th: { expiresIn: "" },
  hi: { expiresIn: "  " },
  ar: { expiresIn: " " },
  vi: { expiresIn: "Ht sau" },
  tl: { expiresIn: "Mag-e-expire sa" },
  pt: { expiresIn: "Expira em" },
  es: { expiresIn: "Expira en" },
  fr: { expiresIn: "Expire dans" },
  de: { expiresIn: "Le4uft ab in" },
  ru: { expiresIn: " " },
  tr: { expiresIn: "Kalan sfcre" },
  it: { expiresIn: "Scade tra" },
  nl: { expiresIn: "Verloopt over" },
  pl: { expiresIn: "Wygasa za" },
  el: { expiresIn: " " },
  uk: { expiresIn: " " },
};


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
  played_at?: string | null;
  tip_amount: number;
  tip_currency: string;
};


type DJ = {

  id: number;
  stage_name: string;
  stage_slug?: string | null;
  email: string | null;

  profile_image: string | null;

  
// DJ profile

  bio: string | null;
  profile_tagline: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;

  
// Social links

  instagram: string | null;
  tiktok: string | null;

  
// Event details

  event_name: string | null;
  venue: string | null;

  
// Guest interaction settings

  tip_enabled: boolean | null;
  request_enabled: boolean | null;
  booking_enabled: boolean | null;
  booking_email: string | null;

  
// Status

  is_live: boolean | null;
  verification_status?: string | null;
};


export default function 
StageRequestPage
() {

  const params = useParams();
  const stage = String(params.stage || "").trim().toLowerCase();

  const [dj, 
setDj
] = useState<DJ | null>(null);
  const [djLoading, 
setDjLoading
] = useState(true);

  const [name, 
setName
] = useState("");
  const [song, 
setSong
] = useState("");
  const [artist, 
setArtist
] = useState("");

  const [selectedArtwork, 
setSelectedArtwork
] = useState("");
  const [selectedAlbum, 
setSelectedAlbum
] = useState("");

  
// BOOKING REQUEST STATES

  const [showBookingModal, 
setShowBookingModal
] = useState(false);

  const [bookingName, 
setBookingName
] = useState("");
  const [bookingEmail, 
setBookingEmail
] = useState("");
  const [bookingPhone, 
setBookingPhone
] = useState("");
  const [bookingEventType, 
setBookingEventType
] = useState("");
  const [bookingDate, 
setBookingDate
] = useState("");
  const [bookingVenue, 
setBookingVenue
] = useState("");
  const [bookingBudget, 
setBookingBudget
] = useState("");
  const [bookingMessage, 
setBookingMessage
] = useState("");

  const [bookingSending, 
setBookingSending
] = useState(false);
  const [bookingSuccess, 
setBookingSuccess
] = useState("");
  const [bookingError, 
setBookingError
] = useState("");

  type AppleTrack = {
    id: number;
    song: string;
    artist: string;
    album?: string;
    image?: string;
    appleUrl?: string;
    previewUrl?: string;
  };

  const [songSearch, 
setSongSearch
] = useState("");
  const [songResults, 
setSongResults
] = useState<AppleTrack[]>([]);
  const [songSearchLoading, 
setSongSearchLoading
] = useState(false);

  const [tipAmount, 
setTipAmount
] = useState(10);
  const [tipCurrency, 
setTipCurrency
] = useState("GHS");
  const [requests, 
setRequests
] = useState<Request[]>([]);
  const [duplicateRequest, 
setDuplicateRequest
] = useState<Request | null>(null);
  const [language, 
setLanguage
] = useState<Language>("en");
  const [submitting, 
setSubmitting
] = useState(false);
  const [paymentSuccess, 
setPaymentSuccess
] = useState<{
    song: string;
    artist: string;
    amount: number;
    currency: string;
    reference: string;
    isBoost: boolean;
  } | null>(null);

  const t = translations[language];
  const paymentText =
    paymentSuccessTranslations[language] || paymentSuccessTranslations.en;
  const nowPlayingCountdownText =
    nowPlayingCountdownTranslations[language] || nowPlayingCountdownTranslations.en;

  const djVerificationStatus = String(
    dj?.verification_status || "not_started"
  ).toLowerCase();
  const isRejectedDJ = djVerificationStatus === "rejected";
  const canAcceptRequests = Boolean(dj?.is_live) && !isRejectedDJ;
  const requestsClosedTitle = isRejectedDJ ? "Requests locked" : t.requestsClosed;
  const requestsClosedMessage = isRejectedDJ
    ? "This DJ is not accepting song requests right now. Please check back later."
    : "This DJ is currently offline. Please check back when they go live.";
  const requestsClosedAlert = isRejectedDJ
    ? "Requests are currently locked for this DJ. Please check back later."
    : "This DJ is currently offline. Please try again when they are live.";

  const [nowPlaying, 
setNowPlaying
] = useState<Request | null>(null);
  const [upNext, 
setUpNext
] = useState<Request | null>(null);
  const [flashAlert, 
setFlashAlert
] = useState(false);
  const [nowPlayingClockTick, 
setNowPlayingClockTick
] = useState(0);

  const previousNowPlayingId = useRef<number | null>(null);
  const songSearchBoxRef = useRef<HTMLDivElement | null>(null);

  function 
isVIPRequest
(
tip
: number) {
    return 
tip
 >= 50;
  }
  function 
getEstimatedWait
(
index
: number) {
    const minutesPerSong = 4;
    return (
index
 + 1) * minutesPerSong;
  }

  function 
isNowPlayingStillActive
(
request
: Request) {
    if (
request
.status !== "played" || !
request
.played_at) return false;

    const playedAtTime = new Date(
request
.played_at).getTime();

    if (Number.isNaN(playedAtTime)) return false;

    return Date.now() - playedAtTime < NOW_PLAYING_DURATION_MS;
  }

  function 
getNowPlayingRemainingMs
(
request
: Request) {
    if (
request
.status !== "played" || !
request
.played_at) return 0;

    const playedAtTime = new Date(
request
.played_at).getTime();

    if (Number.isNaN(playedAtTime)) return 0;

    return Math.max(0, NOW_PLAYING_DURATION_MS - (Date.now() - playedAtTime));
  }

  function 
formatNowPlayingRemaining
(
request
: Request) {
    const totalSeconds = Math.ceil(getNowPlayingRemainingMs(
request
) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  useEffect(() => {
    function 
handleClickOutside
(
event
: MouseEvent | TouchEvent) {
      if (
        songSearchBoxRef.current &&
        !songSearchBoxRef.current.contains(
event
.target as Node)
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

  async function 
fetchDJ
() {
    if (!stage) return;

    const { data, error } = await supabase
  .from("djs")
  .select("*")
  .eq("stage_slug", stage)
  .maybeSingle();

    if (error || !data) {
      console.error("DJ not found:", error);
      setDj(null);
      setDjLoading(false);
      return;
    }

    if (String(data.verification_status || "") === "removed") {
      console.warn("DJ removed from Blackline:", stage);
      setDj(null);
      setRequests([]);
      setNowPlaying(null);
      setUpNext(null);
      previousNowPlayingId.current = null;
      setDjLoading(false);
      return;
    }

    setDj(data as DJ);
    setDjLoading(false);
    fetchRequests(data.id);
  }

  async function 
fetchRequests
(
djId
: number) {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("dj_id", 
djId
)
      .order("tip_amount", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const allRequests = (data || []) as Request[];
    setRequests(allRequests);

    const latestPlayed = allRequests.find(isNowPlayingStillActive);
    const nextAccepted = allRequests.find(
      (
request
) => 
request
.status === "accepted"
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
    if (!nowPlaying) return;

    const nowPlayingClockInterval = setInterval(() => {
      setNowPlayingClockTick((
currentTick
) => 
currentTick
 + 1);
    }, 1000);

    return () => clearInterval(nowPlayingClockInterval);
  }, [nowPlaying?.id]);

  useEffect(() => {
    if (!nowPlaying) return;

    if (!isNowPlayingStillActive(nowPlaying)) {
      setNowPlaying(null);
      previousNowPlayingId.current = null;
    }
  }, [nowPlaying, nowPlayingClockTick]);

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

  async function 
handlePayment
() {
    if (submitting) {
      return;
    }

    if (!dj) {
      alert("DJ profile not found");
      return;
    }

    if (!canAcceptRequests) {
      alert(requestsClosedAlert);
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

    setPaymentSuccess(null);

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

      
onSuccess
: async (
transaction
: any) => {
        const paymentReference = 
transaction
?.reference;

        if (!paymentReference) {
          console.error("PAYSTACK SUCCESS WITHOUT REFERENCE:", 
transaction
);
          alert(
            "Payment succeeded, but no payment reference was returned. Please contact Blackline support."
          );
          setSubmitting(false);
          return;
        }

        try {
          const processResponse = await fetch("/api/paystack/verify-request", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reference: paymentReference,
              expectedAmount: tipAmount,
              expectedCurrency: tipCurrency,
              djId: dj.id,
              guestName: name.trim(),
              song: song.trim(),
              artist: artist.trim(),
              artwork: finalArtwork,
              album: finalAlbum,
              duplicateRequestId: duplicateRequest?.id ?? null,
            }),
          });

          const processResult = await processResponse.json();

          if (!processResponse.ok || !processResult.verified) {
            console.error("PAYSTACK REQUEST VERIFY ERROR:", processResult);
            alert(
              `Payment could not be verified and saved yet. Please contact Blackline support with this reference: ${paymentReference}`
            );
            return;
          }

          await fetchRequests(dj.id);

          const savedRequest = processResult.request || {};
          const paidAmount = Number(processResult.amount || tipAmount || 0);
          const paidCurrency = processResult.currency || tipCurrency;
          const savedReference = processResult.reference || paymentReference;

          setName("");
          setSong("");
          setArtist("");
          setSongSearch("");
          setSongResults([]);
          setSelectedArtwork("");
          setSelectedAlbum("");
          setTipAmount(10);
          setDuplicateRequest(null);

          setPaymentSuccess({
            song: savedRequest.song || song.trim(),
            artist: savedRequest.artist || artist.trim(),
            amount: paidAmount,
            currency: paidCurrency,
            reference: savedReference,
            isBoost: Boolean(processResult.isBoost),
          });

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        } catch (err) {
          console.error("PAYMENT SUCCESS HANDLER ERROR:", err);
          alert(
            `Payment succeeded, but something went wrong while verifying and saving your request. Please contact Blackline support with this reference: ${paymentReference}`
          );
        } finally {
          setSubmitting(false);
        }
      },

      
onCancel
: () => {
        setSubmitting(false);
        alert("Payment cancelled");
      },
      });
      }
      
// BOOKING REQUEST FUNCTION

      const 
submitBookingRequest
 = async () => {
        if (!dj) return;
      
        setBookingSending(true);
        setBookingError("");
        setBookingSuccess("");
      
        const { error } = await supabase
          .from("booking_requests")
          .insert({
            dj_id: dj.id,
            name: bookingName,
            email: bookingEmail,
            phone: bookingPhone,
            event_type: bookingEventType,
            event_date: bookingDate || null,
            venue: bookingVenue,
            budget: bookingBudget,
            message: bookingMessage,
          });
      
        if (error) {
          console.error("BOOKING REQUEST ERROR:", error);
          setBookingError(error.message);
          setBookingSending(false);
          return;
        }
      
        setBookingSuccess("Booking request sent successfully!");
      
        setBookingName("");
        setBookingEmail("");
        setBookingPhone("");
        setBookingEventType("");
        setBookingDate("");
        setBookingVenue("");
        setBookingBudget("");
        setBookingMessage("");
      
        setBookingSending(false);
      };

  if (djLoading) {
    return (
      <main 
className
="min-h-screen bg-black text-white flex items-center justify-center">

        Loading DJ page...
      </main>

    );
  }

  if (!dj) {
    return (
      <main 
className
="min-h-screen bg-black text-white flex items-center justify-center p-6">

        <div 
className
="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md text-center">
          <h1 
className
="text-4xl font-bold text-red-400 mb-3">
            DJ Not Found
          </h1>
          <p 
className
="text-zinc-400">
            No Blackline DJ profile exists for /{stage}
          </p>
        </div>
      </main>

    );
  }

  return (
    <main

      
className
={`min-h-screen bg-black text-white flex flex-col items-center p-10 ${

        flashAlert ? "animate-pulse" : ""
      }`}

    >
      {flashAlert && (
        <div 
className
="fixed inset-0 bg-purple-600/30 z-50 pointer-events-none animate-pulse" />
      )}


{nowPlaying && (

  <div 
className
="w-full max-w-md mb-8 animate-pulse">
    <div
      
className
="relative overflow-hidden p-6 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.7)] border border-purple-300 text-center"
      
style
={{
        backgroundImage: nowPlaying.artwork
          ? `url(${nowPlaying.artwork})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div 
className
="absolute inset-0 bg-black/40 backdrop-blur-xl" />
      <div 
className
="relative z-10">
        {nowPlaying.artwork && (
          <img
            
src
={nowPlaying.artwork}
            
alt
={nowPlaying.song}
            
className
="w-32 h-32 mx-auto rounded-2xl object-cover mb-4 shadow-lg"
          />
        )}

            <p 
className
="text-sm font-bold tracking-[0.3em] text-white mb-2">
              NOW PLAYING 
            </p>

            <div 
className
="flex justify-center items-end gap-1 mb-4">
              <div 
className
="w-1 h-3 bg-white/80 rounded animate-pulse"></div>
              <div
                
className
="w-1 h-5 bg-white/80 rounded animate-pulse"
                
style
={{ animationDelay: "0.2s" }}
              ></div>
              <div
                
className
="w-1 h-7 bg-white/80 rounded animate-pulse"
                
style
={{ animationDelay: "0.4s" }}
              ></div>
              <div
                
className
="w-1 h-4 bg-white/80 rounded animate-pulse"
                
style
={{ animationDelay: "0.6s" }}
              ></div>
              <div
                
className
="w-1 h-6 bg-white/80 rounded animate-pulse"
                
style
={{ animationDelay: "0.8s" }}
              ></div>
            </div>

            <h1
          
className
="text-2xl md:text-3xl font-black text-white leading-tight"
          
style
={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {nowPlaying.song}
        </h1>

        <p 
className
="text-white/80 text-lg mt-2">
          {nowPlaying.artist}
        </p>

        {nowPlaying.album && (
          <p 
className
="text-xs text-white/60 mt-2">
            {nowPlaying.album}
          </p>
        )}

        <p 
className
="text-xs text-white/70 mt-4">
          {t.requestedBy} {nowPlaying.name}
        </p>

        <div 
className
="inline-flex items-center gap-2 mt-4 bg-black/40 border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold">
          <span></span>
          <span>{nowPlayingCountdownText.expiresIn} {formatNowPlayingRemaining(nowPlaying)}</span>
        </div>
      </div>
    </div>
  </div>
)}


      {paymentSuccess && (
        <div 
className
="w-full max-w-md mb-8">
          <div 
className
="relative overflow-hidden bg-gradient-to-br from-green-950 via-zinc-900 to-black border border-green-500/60 rounded-3xl p-6 text-center shadow-[0_0_35px_rgba(34,197,94,0.25)]">
            <div 
className
="absolute -top-12 -right-12 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
            <div 
className
="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />

            <div 
className
="relative z-10">
              <div 
className
="w-16 h-16 mx-auto rounded-full bg-green-500/20 border border-green-400/40 flex items-center justify-center text-3xl mb-4">
                
              </div>

              <p 
className
="text-xs uppercase tracking-[0.25em] text-green-300 font-black mb-2">
                {paymentText.paymentReceived}
              </p>

              <h2 
className
="text-3xl font-black text-white">
                {paymentText.requestSent}
              </h2>

              <p 
className
="text-zinc-400 text-sm mt-3 leading-relaxed">
                {paymentSuccess.isBoost
                  ? paymentText.boostAdded
                  : paymentText.requestAdded}
              </p>

              <div 
className
="bg-black/40 border border-zinc-800 rounded-2xl p-4 mt-5 text-left">
                <p 
className
="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                  {paymentText.song}
                </p>
                <p 
className
="text-white font-black text-lg mt-1">
                  {paymentSuccess.song}
                </p>
                <p 
className
="text-zinc-400 text-sm mt-1">
                  {paymentSuccess.artist}
                </p>
              </div>

              <div 
className
="grid grid-cols-1 gap-3 mt-3">
                <div 
className
="bg-black/40 border border-zinc-800 rounded-2xl p-4">
                  <p 
className
="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    {paymentText.amount}
                  </p>
                  <p 
className
="text-green-400 font-black text-2xl mt-1">
                    {paymentSuccess.currency} {paymentSuccess.amount.toFixed(2)}
                  </p>
                </div>

                <div 
className
="bg-black/40 border border-zinc-800 rounded-2xl p-4">
                  <p 
className
="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    {paymentText.paystackReference}
                  </p>
                  <p 
className
="text-white font-mono text-sm break-all mt-1">
                    {paymentSuccess.reference}
                  </p>
                </div>
              </div>

              <button
                
type
="button"
                
onClick
={() => setPaymentSuccess(null)}
                
className
="mt-5 w-full bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl font-bold transition"
              >
                {paymentText.done}
              </button>

              <p 
className
="text-xs text-zinc-500 mt-4 leading-relaxed">
                {paymentText.savedSupport}
              </p>
            </div>
          </div>
        </div>
      )}

      <div 
className
="bg-zinc-900 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-800">
      <div 
className
="flex justify-end mb-6">
  <select
    
value
={language}
    
onChange
={(
e
) => setLanguage(
e
.target.value as Language)}
    
className
="bg-black border border-zinc-700 rounded-xl px-4 py-2 text-sm"
  >
      <option 
value
="en"> English</option>
    <option 
value
="zh"> </option>
    <option 
value
="ja"> </option>
    <option 
value
="ko"> </option>
    <option 
value
="id"> Bahasa Indonesia</option>
    <option 
value
="ms"> Bahasa Melayu</option>
    <option 
value
="th"> </option>
    <option 
value
="hi"> </option>
    <option 
value
="ar"> </option>
    <option 
value
="vi"> Ting Vit</option>
    <option 
value
="tl"> Tagalog</option>
    <option 
value
="pt"> Portugueas</option>
    <option 
value
="es"> Espaf1ol</option>
    <option 
value
="fr"> Frane7ais</option>
    <option 
value
="de"> Deutsch</option>
    <option 
value
="ru"> </option>
    <option 
value
="tr"> Tfcrke7e</option>
    <option 
value
="it"> Italiano</option>
    <option 
value
="nl"> Nederlands</option>
    <option 
value
="pl"> Polski</option>
    <option 
value
="el"> </option>
    <option 
value
="uk"> </option>
   </select>
    </div>
    <div 
className
="text-center mb-6">
    {dj.profile_image && (
  <img
    
src
={dj.profile_image}
    
alt
={dj.stage_name}
    
className
={`w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 ${

      canAcceptRequests
        ? "border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.55)]"
        : "border-purple-600"
    }`}

  />
)}
            


<h1 
className
="mx-auto mb-3 max-w-full px-2 text-center text-[clamp(2.25rem,10vw,4.5rem)] font-black uppercase leading-[0.95] tracking-wide text-purple-400 drop-shadow-[0_0_18px_rgba(168,85,247,0.45)] break-words [overflow-wrap:anywhere]">

  {dj.stage_name}

</h1>


          <div
            
className
={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${

              canAcceptRequests ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}

          >
            {canAcceptRequests ? t.liveNow : t.offline}
          </div>

          {dj.event_name && (
  <div 
className
="mb-3">
    <p 
className
="text-purple-400 font-bold text-lg">
      {dj.event_name}
    </p>
  </div>
)}


<div 
className
="flex flex-wrap justify-center gap-2 mt-3 mb-3">

{dj.venue && (

  <a
    
href
={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(

      dj.venue
    )}`}

    
target
="_blank"
    
rel
="noopener noreferrer"
    
className
="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm hover:border-purple-500/50 hover:text-purple-300 transition"
  >
     {dj.venue}
  </a>
)}

</div>


          


{dj.instagram && (

  <div 
className
="mt-4">
    <a
      
href
={`https://instagram.com/${dj.instagram.replace("@", "")}`}
      
target
="_blank"
      
rel
="noopener noreferrer"
      
className
="inline-block bg-purple-500/15 border border-purple-500/30 text-purple-300 text-sm font-bold px-4 py-2 rounded-full hover:bg-purple-500/25 transition"
    >
       {dj.instagram}
    </a>
  </div>
)}
        </div>

        {!canAcceptRequests && (
          <div 
className
="relative overflow-hidden bg-red-950 border border-red-700 p-5 rounded-3xl mb-6 text-center shadow-[0_0_25px_rgba(239,68,68,0.18)]">
            <div 
className
="absolute -top-10 -right-10 w-28 h-28 bg-red-500/20 rounded-full blur-2xl" />

            <div 
className
="relative z-10">
              <div 
className
="w-14 h-14 mx-auto rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center text-2xl mb-4">
                
              </div>

              <p 
className
="text-red-200 text-xs font-black uppercase tracking-[0.2em] mb-2">
                {requestsClosedTitle}
              </p>

              <h2 
className
="text-2xl font-black text-white">
                Requests are closed
              </h2>

              <p 
className
="text-red-100/80 text-sm mt-3 leading-relaxed">
                {requestsClosedMessage}
              </p>
            </div>
          </div>
        )}


<div 
className
="text-center mb-8">

  <p 
className
="text-zinc-400 text-sm uppercase tracking-[0.2em]">
    {t.requestInstruction}
  </p>

</div>


        <div 
className
="relative overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-black border border-purple-500/60 p-5 rounded-3xl mb-6 shadow-[0_0_30px_rgba(168,85,247,0.22)]">
  <div 
className
="absolute -top-10 -right-10 w-28 h-28 bg-purple-500/20 rounded-full blur-2xl" />

  <div 
className
="relative z-10">
    <p 
className
="text-purple-200 text-xs font-black uppercase tracking-[0.2em] mb-2">
     {t.skipTheQueue}
    </p>

    <p 
className
="text-white text-base font-semibold leading-snug">
      {t.higherTips}
    </p>
  </div>

</div>


        <div 
className
="space-y-4">
          <input
            
className
="w-full p-4 rounded-xl bg-black border border-zinc-700"
            
placeholder
={t.yourName}
            
value
={name}
            
onChange
={(
e
) => setName(
e
.target.value)}
            
disabled
={!canAcceptRequests}
          />


<div

  
ref
={songSearchBoxRef}
  
className
="relative"

>

  <input
    
className
="w-full p-4 rounded-xl bg-black border border-zinc-700"
    
placeholder
={t.songName}
    
value
={song}
    
onChange
={async (
e
) => {
      const value = 
e
.target.value;

      setSong(value);
      setSongSearch(value);

      const existingRequest = requests.find(
        (
request
) =>
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
    
disabled
={!canAcceptRequests}
  />


{songResults.length > 0 && (

  <div 
className
="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-xl max-h-80 overflow-y-auto">

    {songResults.map((
track
) => (
      <button
        
key
={track.id}
        
type
="button"
        
className
="w-full text-left p-3 hover:bg-zinc-800 transition border-b border-zinc-800"
        
onClick
={() => {
          setSong(track.song);
          setArtist(track.artist);
        
          setSelectedArtwork(track.image || "");
          setSelectedAlbum(track.album || "");
        
          setSongResults([]);
        
          const existingRequest = requests.find(
            (
request
) =>
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
      <div 
className
="flex items-center gap-3">
  {track.image && (
    <img
      
src
={track.image}
      
alt
={track.song}
      
className
="w-14 h-14 rounded-lg object-cover"
    />
  )}
          <div 
className
="flex-1">
            <div 
className
="font-semibold text-white">
              {track.song}
            </div>
      
            <div 
className
="text-sm text-zinc-400">
              {track.artist}
            </div>
      
            {track.album && (
              <div 
className
="text-xs text-zinc-500 mt-1">
                {track.album}
              </div>
            )}
          </div>
        </div>
      </button>
    ))}

    <button
      
type
="button"
      
className
="w-full text-left p-3 bg-black hover:bg-zinc-800 transition text-purple-300 font-semibold"
      
onClick
={() => {
        setSongResults([]);
      }}
    >
      Use "{song}" and enter artist manually
    </button>
  </div>
)}

</div>


{duplicateRequest && (

  <div 
className
="relative overflow-hidden bg-gradient-to-br from-yellow-950 via-orange-950 to-black border border-yellow-500/70 p-4 rounded-3xl mt-4 shadow-[0_0_35px_rgba(234,179,8,0.18)]">
    <div 
className
="absolute -top-12 -right-12 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl" />

    <div 
className
="relative z-10">
      <div 
className
="text-yellow-300 font-black text-xl mb-4">
        {t.songAlreadyRequested}
      </div>

      <div 
className
="flex gap-4">
        {duplicateRequest.artwork && (
          <img
            
src
={duplicateRequest.artwork}
            
alt
={duplicateRequest.song}
            
className
="w-16 h-16 rounded-xl object-cover shadow-lg border border-yellow-500/30"
          />
        )}

        <div 
className
="flex-1 min-w-0">
          <p 
className
="text-white font-black text-xl leading-tight truncate">
            {duplicateRequest.song}
          </p>

          {duplicateRequest.artist && (
            <p 
className
="text-zinc-300 text-sm mt-1 truncate">
              {duplicateRequest.artist}
            </p>
          )}

          {duplicateRequest.album && (
            <p 
className
="text-zinc-500 text-xs mt-1 truncate">
              Album: {duplicateRequest.album}
            </p>
          )}

          <p 
className
="text-yellow-200 text-sm mt-2 font-semibold">
            {t.requestedBy} {duplicateRequest.name}
          </p>
        </div>
      </div>

      <div 
className
="grid grid-cols-2 gap-3 mt-4">
        <div 
className
="bg-black/30 border border-yellow-500/10 rounded-2xl p-3">
          <p 
className
="text-yellow-300 text-xs font-black uppercase tracking-wide">
            {t.currentPosition}
          </p>

          <p 
className
="text-3xl font-black text-white mt-1">
            #
            {requests
              .filter((
request
) => request.status !== "finished")
              .findIndex(
                (
request
) => request.id === duplicateRequest.id
              ) + 1}
          </p>
        </div>

        <div 
className
="bg-black/30 border border-yellow-500/10 rounded-2xl p-3">
          <p 
className
="text-yellow-300 text-xs font-black uppercase tracking-wide">
            {t.currentBoost}
          </p>

          <p 
className
="text-4xl font-black text-white mt-1">
            {tipCurrency} {duplicateRequest.tip_amount}
          </p>
        </div>
      </div>

      <p 
className
="text-zinc-300 text-sm mt-4 leading-relaxed">
        {t.songAlreadyInQueue}
        <br />
        {t.boostToMoveHigher}
      </p>

      <div 
className
="grid grid-cols-4 gap-2 mt-4">
        {[10, 20, 50, 100].map((
amount
) => (
          <button
            
key
={amount}
            
type
="button"
            
className
="bg-purple-600 hover:bg-purple-700 rounded-xl py-3 font-bold flex flex-col items-center justify-center transition-all hover:scale-105"
            
onClick
={() => {
              setTipAmount(amount);
            }}
          >
            <span 
className
="text-xs opacity-80">
              +{tipCurrency}
            </span>

            <span 
className
="text-lg font-black">
              {amount}
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
)}


<div 
className
="relative">
<input

  
className
="w-full p-4 rounded-xl bg-black border border-zinc-700"
  
placeholder
={t.artist}
  
value
={artist}
  
onChange
={async (
e
) => {
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
  
disabled
={!canAcceptRequests}

/>


  {!song.trim() && artist.trim() && songResults.length > 0 && (
    <div 
className
="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-xl max-h-96 overflow-y-auto">
      <div 
className
="p-3 text-xs text-purple-300 font-bold bg-black border-b border-zinc-800">
        Popular songs by {artist}
      </div>

      {songResults.map((
track
) => (
        <button
          
key
={
track
.id}
          
type
="button"
          
className
="w-full text-left p-3 hover:bg-zinc-800 transition border-b border-zinc-800"
          
onClick
={() => {
            setSong(
track
.song);
            setArtist(
track
.artist);
          
            setSelectedArtwork(
track
.image || "");
            setSelectedAlbum(
track
.album || "");
          
            setSongResults([]);
          
            const existingRequest = requests.find(
              (
request
) =>
                ["pending", "accepted"].includes(
request
.status) &&
                
request
.song.toLowerCase().trim() ===
                  
track
.song.toLowerCase().trim() &&
                
request
.artist.toLowerCase().trim() ===
                  
track
.artist.toLowerCase().trim()
            );
          
            if (existingRequest) {
              setDuplicateRequest(existingRequest);
            } else {
              setDuplicateRequest(null);
            }
          }}
        >
          <div 
className
="flex items-center gap-3">
            {
track
.image && (
              <img
                
src
={
track
.image}
                
alt
={
track
.song}
                
className
="w-14 h-14 rounded-lg object-cover"
              />
            )}

            <div 
className
="flex-1">
              <div 
className
="font-semibold text-white">
                {
track
.song}
              </div>

              <div 
className
="text-sm text-zinc-400">
                {
track
.artist}
              </div>

              {
track
.album && (
                <div 
className
="text-xs text-zinc-500 mt-1">
                  {
track
.album}
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )}

</div>


          <div 
className
="grid grid-cols-2 gap-4">
            <select
              
value
={tipCurrency}
              
onChange
={(
e
) => setTipCurrency(
e
.target.value)}
              
className
="p-4 rounded-xl bg-black border border-zinc-700"
              
disabled
={!canAcceptRequests}
            >
              <option 
value
="GHS"> GHS</option>
              <option 
value
="USD"> USD</option>
              <option 
value
="EUR"> EUR</option>
              <option 
value
="GBP"> GBP</option>
              <option 
value
="CAD"> CAD</option>
              <option 
value
="AUD"> AUD</option>
              <option 
value
="NGN"> NGN</option>
              <option 
value
="KES"> KES</option>
              <option 
value
="ZAR"> ZAR</option>
              <option 
value
="SGD"> SGD</option>
              <option 
value
="MYR"> MYR</option>
              <option 
value
="IDR"> IDR</option>
              <option 
value
="THB"> THB</option>
              <option 
value
="PHP"> PHP</option>
              <option 
value
="VND"> VND</option>
              <option 
value
="CNY"> CNY</option>
              <option 
value
="JPY"> JPY</option>
              <option 
value
="KRW"> KRW</option>
              <option 
value
="INR"> INR</option>
              <option 
value
="AED"> AED</option>
              <option 
value
="SAR"> SAR</option>
              <option 
value
="QAR"> QAR</option>
              <option 
value
="BRL"> BRL</option>
              <option 
value
="MXN"> MXN</option>
            </select>

            <input
              
type
="number"
              
min
="1"
              
value
={tipAmount === 0 ? "" : tipAmount}
              
onChange
={(
e
) => setTipAmount(Number(
e
.target.value))}
              
className
="p-4 rounded-xl bg-black border border-zinc-700"
              
placeholder
="Tip Amount"
              
disabled
={!canAcceptRequests}
            />
          </div>

          <div 
className
="bg-black border border-purple-800 rounded-2xl p-5 mt-4 relative overflow-hidden">
  <div 
className
="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent pointer-events-none" />

  <div 
className
="relative z-10">
  <p 
className
="text-purple-200 text-xs font-black uppercase tracking-[0.2em] mb-2">
  {t.boostYourRequest}

</p>


  

    <div 
className
="grid grid-cols-4 gap-2">
      {[10, 20, 50, 100].map((
boost
) => (
        <button
          
key
={
boost
}
          
type
="button"
          
onClick
={() =>
            setTipAmount((
current
) => Number(
current
 || 0) + 
boost
)
          }
          
disabled
={!canAcceptRequests}
          
className
="bg-purple-700 hover:bg-purple-600 px-3 py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-all hover:scale-105"
        >
          +{tipCurrency}
          <div 
className
="text-lg font-black">
            {
boost
}
          </div>
        </button>
      ))}
    </div>
  </div>

</div>

                

<button

  
onClick
={handlePayment}
  
disabled
={submitting || !canAcceptRequests || tipCurrency !== "GHS"}
  
className
="w-full bg-purple-600 hover:bg-purple-700 transition p-4 rounded-xl text-xl font-semibold disabled:opacity-50"

>

  {!canAcceptRequests
    ? t.requestsClosed
    : tipCurrency !== "GHS"
    ? `${tipCurrency} payments are coming soon. Please use GHS for now.`
    : submitting
    ? t.processingPayment
    : `${t.pay} ${tipCurrency} ${tipAmount || 0} ${t.andRequest}`}

</button>


{dj.booking_enabled && (

  <button
    
onClick
={() => setShowBookingModal(true)}
    
className
="w-full mt-3 bg-zinc-800 hover:bg-zinc-700 transition p-4 rounded-xl text-xl font-semibold border border-zinc-700"
  >
     Book DJ
  </button>
)}
                
                          <p 
className
="text-xs text-purple-300 text-center mt-4 leading-relaxed">
                            {paymentText.beforePaymentReference}
                          </p>

                          <p 
className
="text-xs text-zinc-500 text-center mt-3 leading-relaxed">
                            {t.boostingDisclaimer}
                          </p>
                        </div>
                      </div>
                
                      {upNext && (
                      <div 
className
="mt-10 w-full max-w-md">
                        <div 
className
="bg-zinc-900 border border-cyan-500 p-5 rounded-3xl text-center shadow-[0_0_25px_rgba(34,211,238,0.3)] mb-6">

                          {upNext.artwork && (
                            <img
                              
src
={upNext.artwork}
                              
alt
={upNext.song}
                              
className
="w-24 h-24 mx-auto rounded-2xl object-cover mb-4 shadow-lg"
                            />
                          )}

                          <p 
className
="text-xs tracking-[0.3em] text-cyan-400 font-bold mb-2">
                            {t.upNext}
                          </p>

                          <h2 
className
="text-2xl font-black text-white">
                            {upNext.song}
                          </h2>

                          <p 
className
="text-zinc-300 mt-2">
                            {upNext.artist}
                          </p>

                          {upNext.album && (
                            <p 
className
="text-xs text-zinc-500 mt-2">
                              {upNext.album}
                            </p>
                          )}

                          <p 
className
="text-cyan-400 text-sm mt-3">
                            {t.requestedBy} {upNext.name}
                          </p>

                        </div>
                      </div>
                    )}
                
                      <div 
className
="mt-10 w-full max-w-md">
                        <div 
className
="flex items-center justify-between mb-4">
                          <h2 
className
="text-3xl font-bold">{t.liveRequests}</h2>
                
                          <span 
className
="bg-purple-600 px-3 py-1 rounded-full text-sm font-bold">
                            {t.vipPriorityFull}
                          </span>
                        </div>
                
                        <div 
className
="space-y-4">
  {requests
    .filter((
request
) => request.status !== "finished")
    .map((
request
, 
index
) => (
      <div
        
key
={request.id}
        
className
={`rounded-xl p-4 transition-all duration-300 ${

          isVIPRequest(request.tip_amount)
            ? "bg-zinc-900 border-2 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.45)] scale-[1.02]"
            : index === 0
            ? "bg-zinc-900 border border-yellow-500"
            : "bg-zinc-900 border border-zinc-800"
        }`}

      >
        {isVIPRequest(request.tip_amount) && (
          <div 
className
="mb-2 inline-block bg-yellow-500 text-black text-xs font-black px-3 py-1 rounded-full">
            {t.vipRequest}
          </div>
        )}

        <div 
className
="flex items-start justify-between gap-3 mb-2">
          <div 
className
="flex items-center gap-3 min-w-0">
            {request.artwork && (
              <img
                
src
={request.artwork}
                
alt
={request.song}
                
className
="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
            )}

            <div 
className
="min-w-0">
              <p 
className
="font-bold text-lg leading-tight break-words">
                {request.song}
              </p>

              <p 
className
="text-zinc-400 text-sm">
                {request.artist}
              </p>

              {request.album && (
                <p 
className
="text-xs text-zinc-500 mt-1">
                  {request.album}
                </p>
              )}
            </div>
          </div>

          <div 
className
="flex flex-col gap-2 items-end flex-shrink-0">
            {index === 0 && (
              <span 
className
="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                {t.topTip}
              </span>
            )}

            <span
              
className
={`text-xs px-3 py-1 rounded-full font-bold ${

                request.status === "accepted"
                  ? "bg-green-600 text-white"
                  : request.status === "rejected"
                  ? "bg-red-600 text-white"
                  : 
request
.status === "played"
                  ? "bg-blue-600 text-white"
                  : "bg-yellow-500 text-black"
              }`}

            >
              {
request
.status === "accepted"
                ? t.accepted
                : 
request
.status === "rejected"
                ? t.rejected
                : 
request
.status === "played"
                ? t.played
                : t.pending}
            </span>

            <span 
className
="bg-green-600 text-xs px-3 py-1 rounded-full font-bold">
              {
request
.tip_currency} {
request
.tip_amount}
            </span>
          </div>
        </div>

        <p 
className
="text-sm text-purple-400 mt-2">
          {t.requestedBy} {
request
.name}
        </p>

        {
request
.status !== "played" &&
          
request
.status !== "finished" && (
            <p 
className
="text-xs text-cyan-400 mt-2">
              {t.estimatedWait}: ~{getEstimatedWait(
index
)} mins
            </p>
          )}
      </div>
    ))}

</div>

<BookingModal

  
open
={showBookingModal}
  
onClose
={() => setShowBookingModal(false)}

  
bookingName
={bookingName}
  
setBookingName
={setBookingName}

  
bookingEmail
={bookingEmail}
  
setBookingEmail
={setBookingEmail}

  
bookingPhone
={bookingPhone}
  
setBookingPhone
={setBookingPhone}

  
bookingEventType
={bookingEventType}
  
setBookingEventType
={setBookingEventType}

  
bookingDate
={bookingDate}
  
setBookingDate
={setBookingDate}

  
bookingVenue
={bookingVenue}
  
setBookingVenue
={setBookingVenue}

  
bookingBudget
={bookingBudget}
  
setBookingBudget
={setBookingBudget}

  
bookingMessage
={bookingMessage}
  
setBookingMessage
={setBookingMessage}

  
bookingSending
={bookingSending}
  
bookingSuccess
={bookingSuccess}
  
bookingError
={bookingError}

  
submitBookingRequest
={submitBookingRequest}
  />
  
  </main>
  );
  }
