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
  "Secure guest payment flow",
  "10% Blackline platform fee",
  "DJs can receive paid requests before verification",
  "Withdrawals unlock after Blackline approval",
];

const previewQueue = [
  {
    name: "Maya",
    song: "Afrobeats anthem",
    artist: "Guest request",
    amount: "+50 boost",
    badge: "VIP",
  },
  {
    name: "Chris",
    song: "Club classic",
    artist: "Guest request",
    amount: "+20 boost",
    badge: "Next",
  },
  {
    name: "Ari",
    song: "Late-night hit",
    artist: "Guest request",
    amount: "+10 boost",
    badge: "Queue",
  },
];

function ProductPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-6xl">
      <div className="absolute -left-10 top-20 hidden rounded-3xl border border-purple-500/30 bg-purple-500/10 px-5 py-4 text-left shadow-[0_0_35px_rgba(168,85,247,0.22)] backdrop-blur md:block">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-300">
          Live queue
        </p>
        <p className="mt-1 text-2xl font-black text-white">+3 requests</p>
      </div>

      <div className="absolute -right-8 top-8 hidden rotate-3 rounded-3xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-left shadow-[0_0_35px_rgba(34,197,94,0.18)] backdrop-blur md:block">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-green-300">
          Paid boost
        </p>
        <p className="mt-1 text-2xl font-black text-white">Queue moved 🔥</p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-purple-500/30 bg-zinc-950/90 p-4 shadow-[0_0_70px_rgba(168,85,247,0.18)] md:p-6">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[1.75rem] border border-zinc-800 bg-black p-4 md:p-5">
            <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] border border-zinc-700 bg-zinc-950 shadow-2xl">
              <div className="border-b border-zinc-800 bg-gradient-to-br from-purple-950 via-black to-black p-5 text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full border-4 border-purple-500 bg-zinc-800 shadow-[0_0_35px_rgba(168,85,247,0.55)]" />
                <p className="text-xs font-black uppercase tracking-[0.28em] text-green-400">
                  Live now
                </p>
                <h3 className="mt-2 text-3xl font-black text-white">DJ Nova</h3>
                <p className="mt-2 text-sm text-zinc-400">Request from your phone</p>
              </div>

              <div className="space-y-3 p-5">
                <div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-left">
                  <p className="text-xs text-zinc-500">Your name</p>
                  <p className="mt-1 font-bold text-white">Maya</p>
                </div>

                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-left">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-300">
                    Selected song
                  </p>
                  <p className="mt-2 text-xl font-black text-white">Afrobeats anthem</p>
                  <p className="text-sm text-zinc-400">Guest request</p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 50, 100].map((amount) => (
                    <div
                      key={amount}
                      className="rounded-xl bg-purple-600 px-2 py-3 text-center text-sm font-black text-white"
                    >
                      +{amount}
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-green-500 px-4 py-3 text-center font-black text-black">
                  Pay & request
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5 md:p-6">
            <div className="mb-5 flex flex-col gap-4 border-b border-zinc-800 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-400">
                  DJ dashboard preview
                </p>
                <h3 className="mt-2 text-3xl font-black text-white md:text-4xl">
                  Requests arrive live.
                </h3>
              </div>

              <div className="rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-black text-green-400">
                LIVE 🟢
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
              <div className="space-y-3">
                <div className="rounded-3xl border border-purple-500/40 bg-gradient-to-br from-purple-950 to-black p-5">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-200">
                    Now playing
                  </p>
                  <p className="mt-3 text-2xl font-black text-white">Dancefloor opener</p>
                  <p className="mt-1 text-sm text-zinc-400">Requested by Jay</p>
                </div>

                {previewQueue.map((request, index) => (
                  <div
                    key={request.name}
                    className="rounded-3xl border border-zinc-800 bg-black/55 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 font-black text-purple-300">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-black text-white">{request.song}</p>
                          <p className="text-sm text-zinc-500">
                            {request.artist} · {request.name}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                          {request.badge}
                        </p>
                        <p className="mt-2 text-sm font-bold text-green-400">
                          {request.amount}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-zinc-800 bg-black/55 p-5 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500">
                    Scan to request
                  </p>
                  <div className="mx-auto mt-4 grid h-32 w-32 grid-cols-5 gap-1 rounded-2xl bg-white p-3">
                    {Array.from({ length: 25 }).map((_, index) => (
                      <div
                        key={index}
                        className={`rounded-sm ${
                          [0, 1, 2, 5, 10, 12, 14, 16, 18, 20, 22, 23, 24].includes(index)
                            ? "bg-black"
                            : "bg-zinc-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-zinc-400">blacklinedj.com/djnova</p>
                </div>

                <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-green-300">
                    Earnings tracked
                  </p>
                  <p className="mt-2 text-3xl font-black text-green-400">90%</p>
                  <p className="mt-1 text-sm text-zinc-400">DJ share after platform fee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-700/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-fuchsia-700/10 blur-3xl" />
        <div className="absolute bottom-10 left-0 h-72 w-72 rounded-full bg-green-500/5 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-600/60 bg-purple-900/30 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-purple-200">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Live DJ Request Platform
          </div>

          <h1 className="mb-6 text-6xl font-black leading-none tracking-tight md:text-8xl lg:text-9xl">
            BLACKLINE
          </h1>

          <p className="mx-auto mb-5 max-w-4xl text-3xl font-black leading-tight text-purple-400 md:text-5xl">
            Turn song requests into paid crowd engagement.
          </p>

          <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-zinc-400 md:text-xl">
            Blackline gives DJs a premium request page, QR code, and live
            dashboard. Guests request songs from their phone, boost the queue,
            and keep the party connected without crowding the booth.
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
              Secure guest payments
            </span>
            <span className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2">
              Real-time requests
            </span>
            <span className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2">
              QR-ready for live events
            </span>
          </div>

          <ProductPreview />
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
                Platform fee
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
              and keep their payment reference for support. The experience is
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
