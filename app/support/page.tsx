import Link from "next/link";

const supportTopics = [
  {
    title: "DJ account help",
    body: "Need help with signup, your Blackline link, profile details, QR code, or going live? Send us your DJ name and account email.",
  },
  {
    title: "Payments and requests",
    body: "For guest payment questions, include the payment reference, song request details, DJ name, and the date of the event.",
  },
  {
    title: "Verification and withdrawals",
    body: "For payout or withdrawal support, include your DJ name, payout method, account email, and any withdrawal request details.",
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden px-5 py-16 md:px-8 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.28),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_35%)]" />
        <div className="relative mx-auto max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-purple-500 hover:text-white"
          >
            ← Back to Blackline
          </Link>

          <div className="mt-10 rounded-[2rem] border border-purple-500/30 bg-zinc-950/80 p-6 shadow-[0_0_80px_rgba(168,85,247,0.18)] md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
              Blackline Support
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
              Need help with Blackline?
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">
              Contact Blackline support for DJ accounts, song requests, payment
              references, verification, and withdrawal questions.
            </p>

            <div className="mt-8 rounded-3xl border border-purple-500/30 bg-purple-500/10 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-purple-300">
                Email support
              </p>
              <a
                href="mailto:support@blacklinedj.com?subject=Blackline%20Support%20Request"
                className="mt-2 block break-all text-2xl font-black text-white underline decoration-purple-500 underline-offset-8 hover:text-purple-200"
              >
                support@blacklinedj.com
              </a>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {supportTopics.map((topic) => (
              <div
                key={topic.title}
                className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
              >
                <h2 className="text-xl font-black">{topic.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {topic.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-2xl font-black">Helpful details to include</h2>
            <div className="mt-4 grid gap-3 text-sm leading-relaxed text-zinc-400 md:grid-cols-2">
              <p>• Your DJ name or Blackline link</p>
              <p>• Your account email</p>
              <p>• Payment reference, if payment related</p>
              <p>• Screenshot or clear description of the issue</p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-zinc-600">
            © {new Date().getFullYear()} Blackline. Live requests, paid boosts,
            cleaner DJ nights.
          </p>
        </div>
      </section>
    </main>
  );
}
