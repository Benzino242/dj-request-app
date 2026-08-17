"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../../lib/supabase";

type TimelineItem = { id: string; time: string; title: string; notes: string };
type MusicItem = {
  id: string;
  category: "must_play" | "do_not_play" | "special_moment";
  title: string;
  artist: string;
  notes: string;
};

type Booking = {
  id: number;
  guest_user_id: string | null;
  name: string | null;
  email: string | null;
  event_type: string | null;
  event_date: string | null;
  venue: string | null;
  status: string | null;
  djs:
    | { stage_name: string; stage_slug: string | null; profile_image: string | null; user_id: string }
    | { stage_name: string; stage_slug: string | null; profile_image: string | null; user_id: string }[]
    | null;
};

type Plan = {
  timeline: TimelineItem[];
  music_requests: MusicItem[];
  event_notes: string;
  announcements: string;
  dress_code: string;
  important_contacts: string;
  updated_at?: string;
};

const emptyPlan: Plan = {
  timeline: [],
  music_requests: [],
  event_notes: "",
  announcements: "",
  dress_code: "",
  important_contacts: "",
};

const editableStatuses = new Set(["accepted", "awaiting_payment", "confirmed", "completed"]);

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getDj(booking: Booking | null) {
  if (!booking?.djs) return null;
  return Array.isArray(booking.djs) ? booking.djs[0] : booking.djs;
}

export default function BookingEventWorkspacePage() {
  const params = useParams<{ id: string }>();
  const bookingId = Number(params.id);
  const [user, setUser] = useState<User | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [plan, setPlan] = useState<Plan>(emptyPlan);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [newTimeline, setNewTimeline] = useState({ time: "", title: "", notes: "" });
  const [newMusic, setNewMusic] = useState<Omit<MusicItem, "id">>({
    category: "must_play", title: "", artist: "", notes: "",
  });

  const dj = getDj(booking);
  const isDj = Boolean(user && dj?.user_id === user.id);
  const canEdit = Boolean(booking && editableStatuses.has(String(booking.status || "")));

  const loadWorkspace = useCallback(async () => {
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      setError("This booking link is invalid.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    const activeUser = userData.user || null;
    setUser(activeUser);
    if (!activeUser) {
      setError("Please sign in to open this booking workspace.");
      setLoading(false);
      return;
    }

    const { data: bookingData, error: bookingError } = await supabase
      .from("booking_requests")
      .select("id,guest_user_id,name,email,event_type,event_date,venue,status,djs(stage_name,stage_slug,profile_image,user_id)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !bookingData) {
      setError("This workspace could not be opened. Make sure you are signed into the account connected to this booking.");
      setLoading(false);
      return;
    }

    setBooking(bookingData as unknown as Booking);
    const { data: planData, error: planError } = await supabase
      .from("booking_event_plans")
      .select("timeline,music_requests,event_notes,announcements,dress_code,important_contacts,updated_at")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (planError) setError(planError.message);
    else if (planData) {
      setPlan({
        timeline: Array.isArray(planData.timeline) ? (planData.timeline as TimelineItem[]) : [],
        music_requests: Array.isArray(planData.music_requests) ? (planData.music_requests as MusicItem[]) : [],
        event_notes: planData.event_notes || "",
        announcements: planData.announcements || "",
        dress_code: planData.dress_code || "",
        important_contacts: planData.important_contacts || "",
        updated_at: planData.updated_at,
      });
    }
    setLoading(false);
  }, [bookingId]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  async function savePlan() {
    if (!user || !booking || !canEdit) return;
    setSaving(true);
    setSaved(false);
    setError("");
    const { data, error: saveError } = await supabase
      .from("booking_event_plans")
      .upsert({
        booking_id: booking.id,
        timeline: plan.timeline,
        music_requests: plan.music_requests,
        event_notes: plan.event_notes,
        announcements: plan.announcements,
        dress_code: plan.dress_code,
        important_contacts: plan.important_contacts,
        updated_by: user.id,
      }, { onConflict: "booking_id" })
      .select("updated_at")
      .single();
    if (saveError) setError(saveError.message);
    else {
      setPlan((current) => ({ ...current, updated_at: data?.updated_at }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  function addTimelineItem() {
    if (!newTimeline.title.trim()) return;
    setPlan((current) => ({
      ...current,
      timeline: [...current.timeline, { id: makeId(), time: newTimeline.time, title: newTimeline.title.trim(), notes: newTimeline.notes.trim() }]
        .sort((a, b) => a.time.localeCompare(b.time)),
    }));
    setNewTimeline({ time: "", title: "", notes: "" });
  }

  function addMusicItem() {
    if (!newMusic.title.trim()) return;
    setPlan((current) => ({
      ...current,
      music_requests: [...current.music_requests, { ...newMusic, id: makeId(), title: newMusic.title.trim(), artist: newMusic.artist.trim(), notes: newMusic.notes.trim() }],
    }));
    setNewMusic({ category: "must_play", title: "", artist: "", notes: "" });
  }

  const musicGroups = useMemo(() => ({
    must_play: plan.music_requests.filter((item) => item.category === "must_play"),
    do_not_play: plan.music_requests.filter((item) => item.category === "do_not_play"),
    special_moment: plan.music_requests.filter((item) => item.category === "special_moment"),
  }), [plan.music_requests]);

  if (loading) return <main className="grid min-h-screen place-items-center bg-black text-zinc-400">Opening event workspace…</main>;

  if (!booking) return (
    <main className="grid min-h-screen place-items-center bg-black p-6 text-white">
      <div className="max-w-lg rounded-3xl border border-red-500/30 bg-zinc-950 p-8 text-center">
        <div className="text-5xl">🔒</div><h1 className="mt-4 text-2xl font-black">Workspace unavailable</h1>
        <p className="mt-3 text-zinc-400">{error}</p>
        <Link href="/my-blackline" className="mt-6 inline-flex rounded-xl bg-purple-600 px-5 py-3 font-black">Open My Blackline</Link>
      </div>
    </main>
  );

  const fieldClass = "w-full rounded-xl border border-zinc-700 bg-black p-3 text-white outline-none focus:border-purple-500 disabled:opacity-60";
  const categoryMeta = {
    must_play: { title: "Must play", icon: "✅", color: "border-green-500/30" },
    do_not_play: { title: "Do not play", icon: "🚫", color: "border-red-500/30" },
    special_moment: { title: "Special moments", icon: "✨", color: "border-purple-500/30" },
  } as const;

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-8 md:py-10">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.08),transparent_30%)]" />
      <div className="relative mx-auto max-w-6xl">
        <Link href={isDj ? "/admin" : "/my-blackline"} className="text-sm font-bold text-zinc-400 hover:text-white">← {isDj ? "DJ Dashboard" : "My Blackline"}</Link>
        <header className="mt-5 rounded-[2rem] border border-purple-500/30 bg-zinc-950/95 p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-300">Shared event workspace</p>
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div><h1 className="text-3xl font-black md:text-5xl">{booking.event_type || "Event"} with {dj?.stage_name || "Blackline DJ"}</h1><p className="mt-2 text-zinc-400">Booking #{booking.id} · {booking.name || booking.email || "Client"}</p></div>
            <span className="w-fit rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-black capitalize text-purple-300">{String(booking.status || "pending").replaceAll("_", " ")}</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-black p-4"><p className="text-xs uppercase text-zinc-500">Date</p><p className="mt-2 font-bold">{booking.event_date || "Not set"}</p></div>
            <div className="rounded-2xl bg-black p-4"><p className="text-xs uppercase text-zinc-500">Venue</p><p className="mt-2 font-bold">{booking.venue || "Not set"}</p></div>
            <div className="rounded-2xl bg-black p-4"><p className="text-xs uppercase text-zinc-500">Editing as</p><p className="mt-2 font-bold">{isDj ? "DJ" : "Client"}</p></div>
          </div>
        </header>

        {!canEdit && <p className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 font-bold text-amber-300">Planning opens after the DJ accepts this booking.</p>}
        {error && <p className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 md:p-7">
            <h2 className="text-2xl font-black">🕒 Event timeline</h2><p className="mt-2 text-sm text-zinc-400">Build the run of show so everyone knows what happens and when.</p>
            <div className="mt-5 space-y-3">
              {plan.timeline.length === 0 && <p className="rounded-2xl border border-dashed border-zinc-800 p-5 text-center text-zinc-500">No timeline items yet.</p>}
              {plan.timeline.map((item) => <div key={item.id} className="flex gap-3 rounded-2xl border border-zinc-800 bg-black p-4"><div className="min-w-16 font-black text-cyan-300">{item.time || "—"}</div><div className="flex-1"><p className="font-black">{item.title}</p>{item.notes && <p className="mt-1 text-sm text-zinc-400">{item.notes}</p>}</div>{canEdit && <button onClick={() => setPlan((current) => ({ ...current, timeline: current.timeline.filter((entry) => entry.id !== item.id) }))} className="text-zinc-500 hover:text-red-400" aria-label="Remove timeline item">✕</button>}</div>)}
            </div>
            {canEdit && <div className="mt-5 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:grid-cols-[120px_1fr]"><input type="time" value={newTimeline.time} onChange={(event) => setNewTimeline((current) => ({ ...current, time: event.target.value }))} className={fieldClass} /><input value={newTimeline.title} onChange={(event) => setNewTimeline((current) => ({ ...current, title: event.target.value }))} placeholder="Moment e.g. First dance" className={fieldClass} /><textarea value={newTimeline.notes} onChange={(event) => setNewTimeline((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" rows={2} className={`${fieldClass} sm:col-span-2`} /><button onClick={addTimelineItem} className="rounded-xl bg-cyan-600 p-3 font-black hover:bg-cyan-700 sm:col-span-2">Add to timeline</button></div>}
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 md:p-7">
            <h2 className="text-2xl font-black">🎵 Music plan</h2><p className="mt-2 text-sm text-zinc-400">Keep essential songs and restrictions clear for the DJ.</p>
            <div className="mt-5 space-y-4">{(Object.keys(categoryMeta) as (keyof typeof categoryMeta)[]).map((category) => <div key={category} className={`rounded-2xl border bg-black p-4 ${categoryMeta[category].color}`}><h3 className="font-black">{categoryMeta[category].icon} {categoryMeta[category].title}</h3><div className="mt-3 space-y-2">{musicGroups[category].length === 0 && <p className="text-sm text-zinc-600">Nothing added.</p>}{musicGroups[category].map((item) => <div key={item.id} className="flex items-start gap-2 rounded-xl bg-zinc-950 p-3"><div className="flex-1"><p className="font-bold">{item.title}{item.artist ? ` — ${item.artist}` : ""}</p>{item.notes && <p className="mt-1 text-xs text-zinc-500">{item.notes}</p>}</div>{canEdit && <button onClick={() => setPlan((current) => ({ ...current, music_requests: current.music_requests.filter((entry) => entry.id !== item.id) }))} className="text-zinc-500 hover:text-red-400" aria-label="Remove song">✕</button>}</div>)}</div></div>)}</div>
            {canEdit && <div className="mt-5 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"><select value={newMusic.category} onChange={(event) => setNewMusic((current) => ({ ...current, category: event.target.value as MusicItem["category"] }))} className={fieldClass}><option value="must_play">Must play</option><option value="do_not_play">Do not play</option><option value="special_moment">Special moment</option></select><div className="grid gap-3 sm:grid-cols-2"><input value={newMusic.title} onChange={(event) => setNewMusic((current) => ({ ...current, title: event.target.value }))} placeholder="Song title" className={fieldClass} /><input value={newMusic.artist} onChange={(event) => setNewMusic((current) => ({ ...current, artist: event.target.value }))} placeholder="Artist" className={fieldClass} /></div><input value={newMusic.notes} onChange={(event) => setNewMusic((current) => ({ ...current, notes: event.target.value }))} placeholder="Moment or notes (optional)" className={fieldClass} /><button onClick={addMusicItem} className="rounded-xl bg-purple-600 p-3 font-black hover:bg-purple-700">Add song</button></div>}
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 md:p-7"><h2 className="text-2xl font-black">📋 Event brief</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="font-bold">General notes<textarea disabled={!canEdit} value={plan.event_notes} onChange={(event) => setPlan((current) => ({ ...current, event_notes: event.target.value }))} rows={5} placeholder="Theme, guest count, setup instructions…" className={`${fieldClass} mt-2 font-normal`} /></label><label className="font-bold">Announcements & pronunciations<textarea disabled={!canEdit} value={plan.announcements} onChange={(event) => setPlan((current) => ({ ...current, announcements: event.target.value }))} rows={5} placeholder="Names, announcements, introductions…" className={`${fieldClass} mt-2 font-normal`} /></label><label className="font-bold">Dress code<textarea disabled={!canEdit} value={plan.dress_code} onChange={(event) => setPlan((current) => ({ ...current, dress_code: event.target.value }))} rows={3} placeholder="Formal, colours, venue rules…" className={`${fieldClass} mt-2 font-normal`} /></label><label className="font-bold">Important contacts<textarea disabled={!canEdit} value={plan.important_contacts} onChange={(event) => setPlan((current) => ({ ...current, important_contacts: event.target.value }))} rows={3} placeholder="Planner, venue manager, backup contact…" className={`${fieldClass} mt-2 font-normal`} /></label></div></section>

        {canEdit && <div className="sticky bottom-4 z-20 mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-purple-500/40 bg-zinc-950/95 p-4 shadow-[0_0_40px_rgba(168,85,247,0.2)] backdrop-blur sm:flex-row"><p className="text-sm text-zinc-400">{saved ? <span className="font-bold text-green-300">✓ Event plan saved</span> : plan.updated_at ? `Last saved ${new Date(plan.updated_at).toLocaleString()}` : "Save to share these details"}</p><button onClick={savePlan} disabled={saving} className="w-full rounded-xl bg-purple-600 px-7 py-3 font-black hover:bg-purple-700 disabled:opacity-50 sm:w-auto">{saving ? "Saving…" : "Save event plan"}</button></div>}
      </div>
    </main>
  );
}
