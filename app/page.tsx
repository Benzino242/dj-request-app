"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section className="px-6 py-24 text-center max-w-6xl mx-auto">
        <div className="inline-block bg-purple-900/40 border border-purple-700 px-4 py-2 rounded-full text-sm mb-6">
          LIVE DJ REQUEST PLATFORM
        </div>

        <h1 className="text-6xl md:text-8xl font-black leading-tight mb-6">
          BLACKLINE
        </h1>

        <p className="text-2xl md:text-3xl text-purple-400 font-semibold mb-6">
          The premium song request experience for DJs & nightlife.
        </p>

        <p className="text-zinc-400 text-lg max-w-3xl mx-auto leading-relaxed mb-10">
          Guests scan a QR code, request songs instantly, and boost requests
          with tips. DJs manage everything live from a powerful real-time dashboard.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-purple-600 hover:bg-purple-700 px-8 py-5 rounded-2xl text-xl font-bold transition"
          >
            Become a Blackline DJ
          </Link>

          <Link
            href="/admin"
            className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 px-8 py-5 rounded-2xl text-xl font-bold transition"
          >
            DJ Login
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-20 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-16">
            HOW BLACKLINE WORKS
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
              <div className="text-5xl mb-5">📲</div>

              <h3 className="text-3xl font-bold mb-4">
                Scan QR Code
              </h3>

              <p className="text-zinc-400 leading-relaxed">
                Guests scan the DJ’s unique Blackline QR code using their phone.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
              <div className="text-5xl mb-5">🎵</div>

              <h3 className="text-3xl font-bold mb-4">
                Request Songs
              </h3>

              <p className="text-zinc-400 leading-relaxed">
                Guests submit song requests instantly without walking to the DJ booth.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
              <div className="text-5xl mb-5">🔥</div>

              <h3 className="text-3xl font-bold mb-4">
                Boost Requests
              </h3>

              <p className="text-zinc-400 leading-relaxed">
                Higher tips move requests closer to the top of the live DJ queue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DJ FEATURES */}
      <section className="px-6 py-20 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-16">
            BUILT FOR PROFESSIONAL DJs
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-purple-950 border border-purple-800 p-8 rounded-3xl">
              <h3 className="text-3xl font-bold mb-5">
                Live DJ Dashboard
              </h3>

              <ul className="space-y-4 text-zinc-300">
                <li>✅ Real-time song requests</li>
                <li>✅ VIP priority queue</li>
                <li>✅ Earnings tracking</li>
                <li>✅ QR identity system</li>
                <li>✅ DJ-specific request pages</li>
              </ul>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
              <h3 className="text-3xl font-bold mb-5">
                Monetize Every Set
              </h3>

              <ul className="space-y-4 text-zinc-300">
                <li>💸 Accept paid requests</li>
                <li>🔥 Boost request system</li>
                <li>📈 Increase audience engagement</li>
                <li>🌍 International currencies supported</li>
                <li>⚡ Instant live updates</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 border-t border-zinc-900 text-center">
        <h2 className="text-5xl font-black mb-6">
          Ready to upgrade your DJ experience?
        </h2>

        <p className="text-zinc-400 text-xl mb-10">
          Join Blackline and start accepting live premium song requests today.
        </p>

        <Link
          href="/signup"
          className="bg-purple-600 hover:bg-purple-700 px-10 py-5 rounded-2xl text-2xl font-bold transition"
        >
          Create DJ Account
        </Link>
      </section>
    </main>
  );
}