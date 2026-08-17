"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { Language } from "../lib/translations";
import { myBlacklineTranslations } from "../lib/myBlacklineTranslations";

type GuestBooking = {
  id: number;
  name: string | null;
  event_type: string | null;
  event_date: string | null;
  venue: string | null;
  budget: string | null;
  status: string | null;
  payment_status: string | null;
  agreed_amount: number | null;
  currency: string | null;
  created_at: string;
  djs:
    | { stage_name: string; stage_slug: string | null; profile_image: string | null }
    | { stage_name: string; stage_slug: string | null; profile_image: string | null }[]
    | null;
};

const languageOptions: { value: Language; label: string }[] = [
  { value: "en", label: "🇬🇧 English" }, { value: "zh", label: "🇨🇳 中文" },
  { value: "ja", label: "🇯🇵 日本語" }, { value: "ko", label: "🇰🇷 한국어" },
  { value: "id", label: "🇮🇩 Bahasa Indonesia" }, { value: "ms", label: "🇲🇾 Bahasa Melayu" },
  { value: "th", label: "🇹🇭 ไทย" }, { value: "hi", label: "🇮🇳 हिन्दी" },
  { value: "ar", label: "🇸🇦 العربية" }, { value: "vi", label: "🇻🇳 Tiếng Việt" },
  { value: "tl", label: "🇵🇭 Tagalog" }, { value: "pt", label: "🇵🇹 Português" },
  { value: "es", label: "🇪🇸 Español" }, { value: "fr", label: "🇫🇷 Français" },
  { value: "de", label: "🇩🇪 Deutsch" }, { value: "ru", label: "🇷🇺 Русский" },
  { value: "tr", label: "🇹🇷 Türkçe" }, { value: "it", label: "🇮🇹 Italiano" },
  { value: "nl", label: "🇳🇱 Nederlands" }, { value: "pl", label: "🇵🇱 Polski" },
  { value: "el", label: "🇬🇷 Ελληνικά" }, { value: "uk", label: "🇺🇦 Українська" },
];

function getDj(booking: GuestBooking) {
  return Array.isArray(booking.djs) ? booking.djs[0] : booking.djs;
}

const editableStatuses = new Set([
  "accepted",
  "awaiting_payment",
  "confirmed",
  "completed",
]);

export default function MyBlacklinePage() {
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookings, setBookings] = useState<GuestBooking[]>([]);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const text = myBlacklineTranslations[language];

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    setError("");

    const { error: claimError } = await supabase.rpc("claim_my_booking_requests");
    if (claimError) console.error("BOOKING CLAIM ERROR:", claimError);

    const { data, error: bookingError } = await supabase
      .from("booking_requests")
      .select("id,name,event_type,event_date,venue,budget,status,payment_status,agreed_amount,currency,created_at,djs(stage_name,stage_slug,profile_image)")
      .order("created_at", { ascending: false });

    if (bookingError) {
      setError(bookingError.message);
      setBookings([]);
    } else {
      setBookings((data || []) as unknown as GuestBooking[]);
    }
    setBookingsLoading(false);
  }, []);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("blackline-language") as Language | null;
    if (savedLanguage && myBlacklineTranslations[savedLanguage]) setLanguage(savedLanguage);

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null);
      setAuthLoading(false);
      if (data.user) void loadBookings();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) void loadBookings();
      else setBookings([]);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadBookings]);

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    if (mode === "login") {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(), password,
      });
      if (loginError) setError(loginError.message);
    } else {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim(), account_type: "guest" },
          emailRedirectTo: `${window.location.origin}/my-blackline`,
        },
      });
      if (signupError) setError(signupError.message);
      else if (!data.session) setMessage(text.checkEmail);
      else setUser(data.user);
    }
    setSubmitting(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setBookings([]);
  }

  function statusLabel(status: string | null) {
    const labels: Record<string, string> = {
      pending: text.pending, accepted: text.accepted, rejected: text.rejected,
      awaiting_payment: text.awaitingPayment, confirmed: text.confirmed,
      completed: text.completed, cancelled: text.cancelled,
    };
    return labels[String(status || "pending")] || String(status || text.pending).replaceAll("_", " ");
  }

  function statusStyle(status: string | null) {
    if (status === "confirmed" || status === "completed") return "border-green-500/40 bg-green-500/10 text-green-300";
    if (status === "accepted" || status === "awaiting_payment") return "border-purple-500/40 bg-purple-500/10 text-purple-300";
    if (status === "rejected" || status === "cancelled") return "border-red-500/40 bg-red-500/10 text-red-300";
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-8 md:py-10">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.20),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.08),transparent_30%)]" />
      <div className="relative mx-auto max-w-5xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-sm font-bold text-zinc-400 hover:text-white">← Blackline</Link>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{text.title}</h1>
            <p className="mt-2 text-zinc-400">{text.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              aria-label={text.language}
              value={language}
              onChange={(event) => {
                const nextLanguage = event.target.value as Language;
                setLanguage(nextLanguage);
                window.localStorage.setItem("blackline-language", nextLanguage);
              }}
              className="rounded-xl border border-purple-500/50 bg-zinc-950 px-4 py-3 font-bold"
            >
              {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {user && <button onClick={signOut} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-bold hover:border-red-500">{text.signOut}</button>}
          </div>
        </header>

        {authLoading ? (
          <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">{text.loading}</div>
        ) : !user ? (
          <section className="mx-auto mt-10 max-w-xl rounded-[2rem] border border-purple-500/30 bg-zinc-950/95 p-6 shadow-[0_0_60px_rgba(168,85,247,0.15)] md:p-8">
            <div className="grid grid-cols-2 rounded-xl bg-black p-1">
              <button onClick={() => { setMode("login"); setError(""); setMessage(""); }} className={`rounded-lg p-3 font-black ${mode === "login" ? "bg-purple-600" : "text-zinc-400"}`}>{text.signIn}</button>
              <button onClick={() => { setMode("signup"); setError(""); setMessage(""); }} className={`rounded-lg p-3 font-black ${mode === "signup" ? "bg-purple-600" : "text-zinc-400"}`}>{text.createAccount}</button>
            </div>
            <form onSubmit={submitAuth} className="mt-6 space-y-4">
              {mode === "signup" && <input value={name} onChange={(event) => setName(event.target.value)} placeholder={text.name} required className="w-full rounded-xl border border-zinc-700 bg-black p-4 outline-none focus:border-purple-500" />}
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={text.email} required className="w-full rounded-xl border border-zinc-700 bg-black p-4 outline-none focus:border-purple-500" />
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={text.password} minLength={6} required className="w-full rounded-xl border border-zinc-700 bg-black p-4 outline-none focus:border-purple-500" />
              {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-300">{error}</p>}
              {message && <p className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm font-bold text-green-300">{message}</p>}
              <button disabled={submitting} className="w-full rounded-xl bg-purple-600 p-4 text-lg font-black hover:bg-purple-700 disabled:opacity-50">
                {submitting ? (mode === "login" ? text.signingIn : text.creating) : (mode === "login" ? text.signIn : text.createAccount)}
              </button>
            </form>
          </section>
        ) : (
          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-sm font-bold text-purple-300">{user.email}</p><h2 className="mt-1 text-3xl font-black">{text.myBookings}</h2></div>
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 font-bold">{bookings.length}</span>
            </div>
            {error && <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</p>}
            {bookingsLoading ? (
              <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">{text.loading}</div>
            ) : bookings.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-10 text-center"><div className="text-5xl">📅</div><h3 className="mt-4 text-2xl font-black">{text.noBookings}</h3><p className="mt-2 text-zinc-400">{text.noBookingsHelp}</p></div>
            ) : (
              <div className="mt-6 grid gap-5">
                {bookings.map((booking) => {
                  const dj = getDj(booking);
                  const price = booking.agreed_amount != null ? `${booking.currency || "GHS"} ${Number(booking.agreed_amount).toLocaleString()}` : booking.budget || "—";
                  return (
                    <article key={booking.id} className="rounded-3xl border border-zinc-800 bg-zinc-950/95 p-5 md:p-7">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-4">
                          {dj?.profile_image ? <img src={dj.profile_image} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-2xl bg-purple-500/15 text-3xl">🎧</div>}
                          <div><h3 className="text-2xl font-black">{booking.event_type || "DJ booking"} with {dj?.stage_name || "Blackline DJ"}</h3><p className="mt-1 text-sm text-zinc-500">Booking #{booking.id}</p></div>
                        </div>
                        <span className={`w-fit rounded-full border px-4 py-2 text-sm font-black ${statusStyle(booking.status)}`}>{statusLabel(booking.status)}</span>
                      </div>
                      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl bg-black p-4"><p className="text-xs uppercase tracking-wider text-zinc-500">{text.eventDate}</p><p className="mt-2 font-bold">{booking.event_date ? new Intl.DateTimeFormat(language, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${booking.event_date}T00:00:00Z`)) : "—"}</p></div>
                        <div className="rounded-2xl bg-black p-4"><p className="text-xs uppercase tracking-wider text-zinc-500">{text.venue}</p><p className="mt-2 font-bold">{booking.venue || "—"}</p></div>
                        <div className="rounded-2xl bg-black p-4"><p className="text-xs uppercase tracking-wider text-zinc-500">{text.budget}</p><p className="mt-2 font-bold">{price}</p></div>
                        <div className="rounded-2xl bg-black p-4"><p className="text-xs uppercase tracking-wider text-zinc-500">{text.payment}</p><p className="mt-2 font-bold capitalize">{String(booking.payment_status || "unpaid").replaceAll("_", " ")}</p></div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        {editableStatuses.has(String(booking.status || "")) && (
                          <Link href={`/my-blackline/bookings/${booking.id}`} className="inline-flex rounded-xl bg-purple-600 px-4 py-3 font-black text-white hover:bg-purple-700">📋 Open event plan</Link>
                        )}
                        {dj?.stage_slug && <Link href={`/${dj.stage_slug}`} className="inline-flex rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-3 font-black text-purple-300 hover:bg-purple-500/20">{text.viewDj} →</Link>}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
