"use client";

import Link from "next/link";

const platformHighlights = [
  {
    icon: "📲",
    title: "Scan the QR code",
    body: "Guests open the DJ’s Blackline page instantly from a table tent, sticker, flyer, or phone screen.",
  },
  {
    icon: "🎵",
    title: "Request a song",
    body: "They search for a song, add their name, and send the request without crowding the DJ booth.",
  },
  {
    icon: "🔥",
    title: "Boost the queue",
    body: "Paid requests and boosts help DJs prioritize the crowd while keeping the queue organized live.",
  },
];

const djFeatures = [
  "Real-time song request queue",
  "Apple Music search with artwork",
  "VIP boost priority system",
  "QR code and promo kit tools",
  "Live, offline, and request-lock controls",
  "Earnings and withdrawal tracking",
];

const trustPoints = [
  "Paystack-powered guest payments",
  "10% Blackline platform fee",
  "DJs can receive paid requests before verification",
  "Withdrawals unlock after Blackline approval",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-700/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-fuchsia-700/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-600/60 bg-purple-900/30 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-purple-200">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Live DJ Request Platform
          </div>

          <h1 className="mb-6 text-6xl font-black leading-none tracking-tight md:text-8xl lg:text-9xl">
            BLACKLINE
          </h1>

          <p className="mx-auto mb-5 max-w-4xl text-3xl font-black leading-tight text-purple-400 md:text-5xl">
            Let guests request songs. DJs earn from every paid request.
          </p>

          <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-zinc-400 md:text-xl">
            Blackline gives every DJ a premium request page, QR code, and live
            dashboard. Guests request songs from their phone, boost their request
            with tips, and keep the party connected without crowding the booth.
          </p>

          <div className="flex flex-col justify-center gap-4 md:flex-row">
            <Link
              href="/signup"
              className="rounded-2xl bg-purple-600 px-8 py-5 text-xl font-black transition hover:bg-purple-700"
            >
              Become a Blackline DJ
            </Link>

            <Link
              href="/admin"
              className="rounded-2xl border border-zinc-700 bg-zinc-900 px-8 py-5 text-xl font-black transition hover:bg-zinc-800"
            >
              DJ Login
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-zinc-500">
            <span className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2">
              Paystack payments
            </span>
            <span className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2">
              Real-time requests
            </span>
            <span className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2">
              QR-ready for live events
            </span>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-zinc-900 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-purple-400">
              How it works
            </p>
            <h2 className="text-5xl font-black md:text-6xl">
              Built for the room, not the booth line.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {platformHighlights.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl"
              >
                <div className="mb-6 text-5xl">{item.icon}</div>
                <h3 className="mb-4 text-3xl font-black">{item.title}</h3>
                <p className="text-lg leading-relaxed text-zinc-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-900 px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-purple-700/70 bg-gradient-to-br from-purple-950 via-purple-900/70 to-black p-8 md:p-10">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-purple-200">
              For DJs
            </p>
            <h2 className="mb-6 text-4xl font-black md:text-5xl">
              Run the request queue from one live dashboard.
            </h2>
            <div className="grid gap-3">
              {djFeatures.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-zinc-100"
                >
                  ✅ {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 md:p-10">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-green-400">
              Monetization
            </p>
            <h2 className="mb-6 text-4xl font-black md:text-5xl">
              Simple platform fee. Clear DJ earnings.
            </h2>

            <div className="mb-6 rounded-3xl border border-green-500/30 bg-green-500/10 p-6">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-green-300">
                Current launch fee
              </p>
              <p className="mt-3 text-5xl font-black text-green-400">10%</p>
              <p className="mt-3 text-zinc-300">
                Blackline keeps 10% of paid song requests. DJ earnings are tracked
                in the dashboard after the Blackline platform fee.
              </p>
            </div>

            <div className="grid gap-3">
              {trustPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-zinc-800 bg-black/35 px-4 py-3 text-zinc-300"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-900 px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 md:col-span-2">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-purple-400">
              For guests
            </p>
            <h2 className="mb-4 text-4xl font-black">
              Requests feel fast, simple, and premium.
            </h2>
            <p className="text-lg leading-relaxed text-zinc-400">
              Guests can search songs, see queue energy, boost existing requests,
              and keep their Paystack reference for support. The experience is
              designed for mobile phones inside busy nightlife spaces.
            </p>
          </div>

          <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-8">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-yellow-300">
              Important
            </p>
            <p className="text-lg font-semibold leading-relaxed text-yellow-100">
              Song requests and boosts support the DJ and improve queue priority,
              but they do not guarantee that a song will be played.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-900 px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-purple-400">
            Launch your Blackline page
          </p>
          <h2 className="mb-6 text-5xl font-black md:text-6xl">
            Ready to upgrade your DJ experience?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-zinc-400">
            Create your DJ account, set your public link, share your QR code,
            and start accepting premium live song requests.
          </p>

          <div className="flex flex-col justify-center gap-4 md:flex-row">
            <Link
              href="/signup"
              className="rounded-2xl bg-purple-600 px-10 py-5 text-2xl font-black transition hover:bg-purple-700"
            >
              Create DJ Account
            </Link>

            <Link
              href="/admin"
              className="rounded-2xl border border-zinc-700 bg-zinc-900 px-10 py-5 text-2xl font-black transition hover:bg-zinc-800"
            >
              DJ Login
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Blackline DJ. Live DJ request platform.</p>

          <div className="flex flex-wrap gap-4">
            <a href="mailto:support@blacklinedj.com" className="hover:text-purple-300">
              Support
            </a>
            <Link href="/signup" className="hover:text-purple-300">
              DJ Signup
            </Link>
            <Link href="/admin" className="hover:text-purple-300">
              DJ Login
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
