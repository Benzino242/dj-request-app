"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../../lib/supabase";
import type { Language } from "../../../lib/translations";
import { eventWorkspaceTranslations } from "../../../lib/eventWorkspaceTranslations";

type TimelineItem = { id: string; time: string; title: string; notes: string };
type MusicItem = { id: string; category: "must_play" | "do_not_play" | "special_moment"; title: string; artist: string; notes: string };
type MusicCategory = MusicItem["category"];
type MusicDraft = { title: string; artist: string; notes: string };
type Dj = { stage_name: string; stage_slug: string | null; profile_image: string | null; user_id: string };
type Booking = { id: number; guest_user_id: string | null; name: string | null; email: string | null; event_type: string | null; event_date: string | null; venue: string | null; status: string | null; djs: Dj | Dj[] | null };
type Plan = { timeline: TimelineItem[]; music_requests: MusicItem[]; event_notes: string; announcements: string; dress_code: string; important_contacts: string; updated_at?: string; updated_by_role?: "client" | "dj" | null; version: number; completion_percent: number };

const emptyPlan: Plan = { timeline: [], music_requests: [], event_notes: "", announcements: "", dress_code: "", important_contacts: "", version: 0, completion_percent: 0 };
const editableStatuses = new Set(["accepted", "awaiting_payment", "confirmed", "completed"]);
const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "🇬🇧 English" }, { code: "zh", label: "🇨🇳 中文" }, { code: "ja", label: "🇯🇵 日本語" },
  { code: "ko", label: "🇰🇷 한국어" }, { code: "id", label: "🇮🇩 Bahasa Indonesia" }, { code: "ms", label: "🇲🇾 Bahasa Melayu" },
  { code: "th", label: "🇹🇭 ไทย" }, { code: "hi", label: "🇮🇳 हिन्दी" }, { code: "ar", label: "🇸🇦 العربية" },
  { code: "vi", label: "🇻🇳 Tiếng Việt" }, { code: "tl", label: "🇵🇭 Tagalog" }, { code: "pt", label: "🇵🇹 Português" },
  { code: "es", label: "🇪🇸 Español" }, { code: "fr", label: "🇫🇷 Français" }, { code: "de", label: "🇩🇪 Deutsch" },
  { code: "ru", label: "🇷🇺 Русский" }, { code: "tr", label: "🇹🇷 Türkçe" }, { code: "it", label: "🇮🇹 Italiano" },
  { code: "nl", label: "🇳🇱 Nederlands" }, { code: "pl", label: "🇵🇱 Polski" }, { code: "el", label: "🇬🇷 Ελληνικά" },
  { code: "uk", label: "🇺🇦 Українська" },
];

function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function getDj(booking: Booking | null) { return booking?.djs ? (Array.isArray(booking.djs) ? booking.djs[0] : booking.djs) : null; }
function calculateCompletion(plan: Plan) {
  let total = 0;
  if (plan.timeline.length) total += 20;
  if (plan.music_requests.length) total += 20;
  if (plan.event_notes.trim()) total += 20;
  if (plan.announcements.trim()) total += 15;
  if (plan.important_contacts.trim()) total += 15;
  if (plan.dress_code.trim()) total += 10;
  return total;
}

export default function BookingEventWorkspacePage() {
  const params = useParams<{ id: string }>();
  const bookingId = Number(params.id);
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<User | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [plan, setPlan] = useState<Plan>(emptyPlan);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState("");
  const [newTimeline, setNewTimeline] = useState({ time: "", title: "", notes: "" });
  const [musicDrafts, setMusicDrafts] = useState<Record<MusicCategory, MusicDraft>>({
    must_play: { title: "", artist: "", notes: "" },
    do_not_play: { title: "", artist: "", notes: "" },
    special_moment: { title: "", artist: "", notes: "" },
  });
  const text = eventWorkspaceTranslations[language] || eventWorkspaceTranslations.en;
  const dj = getDj(booking);
  const isDj = Boolean(user && dj?.user_id === user.id);
  const canEdit = Boolean(booking && editableStatuses.has(String(booking.status || "")));
  const liveCompletion = useMemo(() => calculateCompletion(plan), [plan]);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("blackline-language") as Language | null;
    if (savedLanguage && languageOptions.some((item) => item.code === savedLanguage)) setLanguage(savedLanguage);
  }, []);
  function changeLanguage(value: Language) { setLanguage(value); window.localStorage.setItem("blackline-language", value); }

  const loadWorkspace = useCallback(async () => {
    if (!Number.isFinite(bookingId) || bookingId <= 0) { setError("This booking link is invalid."); setLoading(false); return; }
    setLoading(true); setError(""); setConflict(false);
    const { data: userData } = await supabase.auth.getUser();
    const activeUser = userData.user || null;
    setUser(activeUser);
    if (!activeUser) { setError("Please sign in to open this booking workspace."); setLoading(false); return; }
    const { data: bookingData, error: bookingError } = await supabase.from("booking_requests").select("id,guest_user_id,name,email,event_type,event_date,venue,status,djs(stage_name,stage_slug,profile_image,user_id)").eq("id", bookingId).single();
    if (bookingError || !bookingData) { setError("This workspace could not be opened. Make sure you are signed into the account connected to this booking."); setLoading(false); return; }
    setBooking(bookingData as unknown as Booking);
    const { data: planData, error: planError } = await supabase.from("booking_event_plans").select("timeline,music_requests,event_notes,announcements,dress_code,important_contacts,updated_at,updated_by_role,version,completion_percent").eq("booking_id", bookingId).maybeSingle();
    if (planError) setError(planError.message);
    else if (planData) setPlan({
      timeline: Array.isArray(planData.timeline) ? planData.timeline as TimelineItem[] : [],
      music_requests: Array.isArray(planData.music_requests) ? planData.music_requests as MusicItem[] : [],
      event_notes: planData.event_notes || "", announcements: planData.announcements || "", dress_code: planData.dress_code || "", important_contacts: planData.important_contacts || "",
      updated_at: planData.updated_at, updated_by_role: planData.updated_by_role as Plan["updated_by_role"], version: Number(planData.version || 0), completion_percent: Number(planData.completion_percent || 0),
    }); else setPlan(emptyPlan);
    setLoading(false);
  }, [bookingId]);
  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  async function savePlan() {
    if (!user || !booking || !canEdit) return;
    setSaving(true); setSaved(false); setError(""); setConflict(false);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { setError("Please sign in again."); setSaving(false); return; }
    try {
      const response = await fetch("/api/bookings/event-plan", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ bookingId: booking.id, expectedVersion: plan.version, plan }) });
      const result = await response.json();
      if (!response.ok) { setConflict(Boolean(result.conflict)); setError(result.conflict ? text.conflict : (result.error || "The event plan could not be saved.")); return; }
      const savedPlan = result.plan;
      setPlan({ timeline: Array.isArray(savedPlan.timeline) ? savedPlan.timeline : [], music_requests: Array.isArray(savedPlan.music_requests) ? savedPlan.music_requests : [], event_notes: savedPlan.event_notes || "", announcements: savedPlan.announcements || "", dress_code: savedPlan.dress_code || "", important_contacts: savedPlan.important_contacts || "", updated_at: savedPlan.updated_at, updated_by_role: savedPlan.updated_by_role, version: Number(savedPlan.version || 0), completion_percent: Number(savedPlan.completion_percent || 0) });
      setSaved(true); window.setTimeout(() => setSaved(false), 3000);
    } catch { setError("The event plan could not be saved. Please try again."); }
    finally { setSaving(false); }
  }

  function addTimelineItem() { if (!newTimeline.title.trim()) return; setPlan((current) => ({ ...current, timeline: [...current.timeline, { id: makeId(), time: newTimeline.time, title: newTimeline.title.trim(), notes: newTimeline.notes.trim() }].sort((a, b) => a.time.localeCompare(b.time)) })); setNewTimeline({ time: "", title: "", notes: "" }); }
  function updateMusicDraft(category: MusicCategory, field: keyof MusicDraft, value: string) {
    setMusicDrafts((current) => ({ ...current, [category]: { ...current[category], [field]: value } }));
  }
  function addMusicItem(category: MusicCategory) {
    const draft = musicDrafts[category];
    if (!draft.title.trim()) return;
    setPlan((current) => ({ ...current, music_requests: [...current.music_requests, { id: makeId(), category, title: draft.title.trim(), artist: draft.artist.trim(), notes: draft.notes.trim() }] }));
    setMusicDrafts((current) => ({ ...current, [category]: { title: "", artist: "", notes: "" } }));
  }
  const musicGroups = useMemo(() => ({ must_play: plan.music_requests.filter((item) => item.category === "must_play"), do_not_play: plan.music_requests.filter((item) => item.category === "do_not_play"), special_moment: plan.music_requests.filter((item) => item.category === "special_moment") }), [plan.music_requests]);

  if (loading) return <main className="grid min-h-screen place-items-center bg-black text-zinc-400">{text.opening}</main>;
  if (!booking) return <main className="grid min-h-screen place-items-center bg-black p-6 text-white"><div className="max-w-lg rounded-3xl border border-red-500/30 bg-zinc-950 p-8 text-center"><div className="text-5xl">🔒</div><h1 className="mt-4 text-2xl font-black">{text.unavailable}</h1><p className="mt-3 text-zinc-400">{error}</p><Link href="/my-blackline" className="mt-6 inline-flex rounded-xl bg-purple-600 px-5 py-3 font-black">{text.openMyBlackline}</Link></div></main>;

  const fieldClass = "w-full rounded-xl border border-zinc-700 bg-black p-3 text-white outline-none focus:border-purple-500 disabled:opacity-60";
  const categories = { must_play: { title: text.mustPlay, icon: "✅", color: "border-green-500/30" }, do_not_play: { title: text.doNotPlay, icon: "🚫", color: "border-red-500/30" }, special_moment: { title: text.specialMoments, icon: "✨", color: "border-purple-500/30" } } as const;
  return <main dir={language === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-black px-4 py-6 text-white md:px-8 md:py-10">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.08),transparent_30%)]" />
    <div className="relative mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3"><Link href={isDj ? "/admin" : "/my-blackline"} className="text-sm font-bold text-zinc-400 hover:text-white">← {isDj ? text.backDj : text.backClient}</Link><select value={language} onChange={(event) => changeLanguage(event.target.value as Language)} className="rounded-xl border border-purple-500/50 bg-zinc-950 px-4 py-2 font-bold">{languageOptions.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></div>
      <header className="mt-5 rounded-[2rem] border border-purple-500/30 bg-zinc-950/95 p-6 md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-300">{text.sharedWorkspace}</p>
        <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><h1 className="text-3xl font-black md:text-5xl">{booking.event_type || text.event} {text.with} {dj?.stage_name || "Blackline DJ"}</h1><p className="mt-2 text-zinc-400">{text.booking} #{booking.id} · {booking.name || booking.email || text.client}</p></div><span className="w-fit rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-black capitalize text-purple-300">{String(booking.status || "pending").replaceAll("_", " ")}</span></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-black p-4"><p className="text-xs uppercase text-zinc-500">{text.date}</p><p className="mt-2 font-bold">{booking.event_date || text.notSet}</p></div><div className="rounded-2xl bg-black p-4"><p className="text-xs uppercase text-zinc-500">{text.venue}</p><p className="mt-2 font-bold">{booking.venue || text.notSet}</p></div><div className="rounded-2xl bg-black p-4"><p className="text-xs uppercase text-zinc-500">{text.editingAs}</p><p className="mt-2 font-bold">{isDj ? text.dj : text.client}</p></div></div>
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-black p-4"><div className="flex items-center justify-between gap-3"><p className="font-black text-purple-300">{text.eventProgress}</p><p className="text-2xl font-black">{liveCompletion}%</p></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-cyan-400 transition-all" style={{ width: `${liveCompletion}%` }} /></div>{plan.updated_at && <p className="mt-3 text-xs text-zinc-500">{text.lastUpdated} {new Date(plan.updated_at).toLocaleString()} {plan.updated_by_role === "dj" ? text.byDj : plan.updated_by_role === "client" ? text.byClient : ""}</p>}</div>
      </header>
      {!canEdit && <p className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 font-bold text-amber-300">{text.planningOpens}</p>}
      {error && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"><p>{error}</p>{conflict && <button onClick={() => void loadWorkspace()} className="rounded-xl bg-white px-4 py-2 font-black text-black">{text.reload}</button>}</div>}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 md:p-7"><h2 className="text-2xl font-black">🕒 {text.timeline}</h2><div className="mt-5 space-y-3">{!plan.timeline.length && <p className="rounded-2xl border border-dashed border-zinc-800 p-5 text-center text-zinc-500">{text.noTimeline}</p>}{plan.timeline.map((item) => <div key={item.id} className="flex gap-3 rounded-2xl border border-zinc-800 bg-black p-4"><div className="min-w-16 font-black text-cyan-300">{item.time || "—"}</div><div className="flex-1"><p className="font-black">{item.title}</p>{item.notes && <p className="mt-1 text-sm text-zinc-400">{item.notes}</p>}</div>{canEdit && <button onClick={() => setPlan((current) => ({ ...current, timeline: current.timeline.filter((entry) => entry.id !== item.id) }))}>✕</button>}</div>)}</div>{canEdit && <div className="mt-5 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:grid-cols-[120px_1fr]"><input type="time" value={newTimeline.time} onChange={(event) => setNewTimeline((current) => ({ ...current, time: event.target.value }))} className={fieldClass}/><input value={newTimeline.title} onChange={(event) => setNewTimeline((current) => ({ ...current, title: event.target.value }))} placeholder={text.moment} className={fieldClass}/><textarea value={newTimeline.notes} onChange={(event) => setNewTimeline((current) => ({ ...current, notes: event.target.value }))} placeholder={text.notes} rows={2} className={`${fieldClass} sm:col-span-2`}/><button onClick={addTimelineItem} className="rounded-xl bg-cyan-600 p-3 font-black sm:col-span-2">{text.addTimeline}</button></div>}</section>
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 md:p-7"><h2 className="text-2xl font-black">🎵 {text.musicPlan}</h2><div className="mt-5 space-y-4">{(Object.keys(categories) as MusicCategory[]).map((category) => <div key={category} className={`rounded-2xl border bg-black p-4 ${categories[category].color}`}><h3 className="font-black">{categories[category].icon} {categories[category].title}</h3><div className="mt-3 space-y-2">{!musicGroups[category].length && <p className="text-sm text-zinc-600">{text.nothingAdded}</p>}{musicGroups[category].map((item) => <div key={item.id} className="flex gap-2 rounded-xl bg-zinc-950 p-3"><div className="flex-1"><p className="font-bold">{item.title}{item.artist ? ` — ${item.artist}` : ""}</p>{item.notes && <p className="mt-1 text-xs text-zinc-500">{item.notes}</p>}</div>{canEdit && <button onClick={() => setPlan((current) => ({ ...current, music_requests: current.music_requests.filter((entry) => entry.id !== item.id) }))}>✕</button>}</div>)}</div>{canEdit && <div className="mt-4 grid gap-2 border-t border-zinc-800 pt-4"><div className="grid gap-2 sm:grid-cols-2"><input value={musicDrafts[category].title} onChange={(event) => updateMusicDraft(category, "title", event.target.value)} placeholder={text.songTitle} className={fieldClass}/><input value={musicDrafts[category].artist} onChange={(event) => updateMusicDraft(category, "artist", event.target.value)} placeholder={text.artist} className={fieldClass}/></div><input value={musicDrafts[category].notes} onChange={(event) => updateMusicDraft(category, "notes", event.target.value)} placeholder={text.optionalNotes} className={fieldClass}/><button type="button" onClick={() => addMusicItem(category)} disabled={!musicDrafts[category].title.trim()} className="rounded-xl bg-purple-600 p-3 font-black disabled:opacity-40">{text.addSong}</button></div>}</div>)}</div></section>
      </div>
      <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 md:p-7"><h2 className="text-2xl font-black">📋 {text.eventBrief}</h2><div className="mt-5 grid gap-4 md:grid-cols-2">{([["event_notes",text.generalNotes],["announcements",text.announcements],["dress_code",text.dressCode],["important_contacts",text.contacts]] as const).map(([key,label]) => <label key={key} className="font-bold">{label}<textarea disabled={!canEdit} value={plan[key]} onChange={(event) => setPlan((current) => ({ ...current, [key]: event.target.value }))} rows={key === "event_notes" || key === "announcements" ? 5 : 3} placeholder={text.notes} className={`${fieldClass} mt-2 font-normal`}/></label>)}</div></section>
      {canEdit && <div className="sticky bottom-4 z-20 mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-purple-500/40 bg-zinc-950/95 p-4 shadow-[0_0_40px_rgba(168,85,247,0.2)] backdrop-blur sm:flex-row"><p className="text-sm text-zinc-400">{saved ? <span className="font-bold text-green-300">✓ {text.saved}</span> : text.saveToShare}</p><button onClick={savePlan} disabled={saving || conflict} className="w-full rounded-xl bg-purple-600 px-7 py-3 font-black disabled:opacity-50 sm:w-auto">{saving ? text.saving : text.savePlan}</button></div>}
    </div>
  </main>;
}
