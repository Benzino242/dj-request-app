import Link from "next/link";

const sections = [
  {
    title: "1. What Blackline does",
    body: "Blackline provides tools that let DJs receive song requests from guests through a public request page, QR code, live queue, paid request flow, boost system, and DJ dashboard.",
  },
  {
    title: "2. Song requests and boosts",
    body: "Paid requests and boosts support the DJ and may improve queue priority, but they do not guarantee that a song will be played. DJs decide what to play based on the event, crowd, timing, venue rules, and their professional judgment.",
  },
  {
    title: "3. DJ responsibility",
    body: "DJs are responsible for managing their public page, request queue, event information, payout details, and music choices. DJs should only use Blackline in a lawful and professional way.",
  },
  {
    title: "4. Payments and platform fee",
    body: "Blackline may collect a platform fee from paid requests. The current Blackline platform fee is 10%. DJ earnings are shown in the dashboard after the Blackline platform fee.",
  },
  {
    title: "5. Verification and withdrawals",
    body: "DJs may receive paid requests before verification, but withdrawals require Blackline approval. Blackline may review payout details, verification status, and withdrawal activity before releasing funds.",
  },
  {
    title: "6. Rejected or removed accounts",
    body: "Blackline may reject, restrict, or remove DJ accounts that cannot be verified, appear suspicious, breach these terms, or create risk for guests, venues, DJs, or Blackline.",
  },
  {
    title: "7. Guest payment issues",
    body: "Guests should contact Blackline support with the payment reference, DJ name, requested song, and event date if they need help with a payment or request.",
  },
  {
    title: "8. Service availability",
    body: "Blackline is provided as an online service and may occasionally be unavailable because of maintenance, network issues, third-party provider downtime, or technical problems.",
  },
  {
    title: "9. Changes to these terms",
    body: "Blackline may update these terms as the platform grows. Continued use of Blackline after updates means you accept the updated terms.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden px-5 py-16 md:px-8 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.24),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.1),transparent_35%)]" />
        <div className="relative mx-auto max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-purple-500 hover:text-white"
          >
            ← Back to Blackline
          </Link>

          <div className="mt-10 rounded-[2rem] border border-purple-500/30 bg-zinc-950/80 p-6 shadow-[0_0_80px_rgba(168,85,247,0.18)] md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
              Blackline Terms
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
              Terms of Service
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">
              These terms explain the basic rules for using Blackline as a DJ,
              guest, venue, or visitor.
            </p>
            <p className="mt-4 text-sm text-zinc-600">
              Last updated: July 1, 2026
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {sections.map((section) => (
              <div
                key={section.title}
                className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
              >
                <h2 className="text-xl font-black text-white">{section.title}</h2>
                <p className="mt-3 leading-relaxed text-zinc-400">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6">
            <h2 className="text-2xl font-black">Contact</h2>
            <p className="mt-3 leading-relaxed text-zinc-400">
              Questions about these terms can be sent to{" "}
              <a
                href="mailto:support@blacklinedj.com?subject=Blackline%20Terms%20Question"
                className="font-bold text-white underline decoration-purple-500 underline-offset-4"
              >
                support@blacklinedj.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
