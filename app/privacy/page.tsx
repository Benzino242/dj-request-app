import Link from "next/link";

const sections = [
  {
    title: "1. Information DJs provide",
    body: "DJs may provide details such as stage name, Blackline link, email address, country, preferred currency, profile image, event details, venue details, Instagram link, and payout information.",
  },
  {
    title: "2. Information guests provide",
    body: "Guests may provide a name, song request, artist, payment amount, currency, and payment reference when they send a paid request or boost.",
  },
  {
    title: "3. Payment information",
    body: "Blackline may use third-party payment providers to process payments. Blackline does not need to store full card details. Payment references and transaction details may be saved for support, audit, and payout tracking.",
  },
  {
    title: "4. How information is used",
    body: "Blackline uses information to run DJ request pages, process paid requests, show live queues, calculate DJ earnings, review withdrawals, improve support, prevent abuse, and maintain platform security.",
  },
  {
    title: "5. Public DJ pages",
    body: "Some DJ profile and event details may be visible publicly on a DJ’s Blackline request page, including stage name, event name, venue, profile image, and request status.",
  },
  {
    title: "6. Service providers",
    body: "Blackline may rely on trusted service providers for hosting, database, payments, email alerts, analytics, and security. These providers only support the operation of the platform.",
  },
  {
    title: "7. Data retention",
    body: "Blackline may keep request, payment, withdrawal, and audit records as needed for platform operation, support, fraud prevention, accounting, and legal or business record purposes.",
  },
  {
    title: "8. Account and support requests",
    body: "DJs can contact Blackline support to ask questions about account information, payout details, verification, or removal requests.",
  },
  {
    title: "9. Security",
    body: "Blackline uses reasonable technical and operational measures to protect account, request, payment, and payout information. No online service can guarantee perfect security.",
  },
  {
    title: "10. Updates to this policy",
    body: "Blackline may update this privacy policy as the platform grows or as features change. The latest version will be posted on this page.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden px-5 py-16 md:px-8 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.24),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.11),transparent_35%)]" />
        <div className="relative mx-auto max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-purple-500 hover:text-white"
          >
            ← Back to Blackline
          </Link>

          <div className="mt-10 rounded-[2rem] border border-purple-500/30 bg-zinc-950/80 p-6 shadow-[0_0_80px_rgba(168,85,247,0.18)] md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
              Blackline Privacy
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
              Privacy Policy
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">
              This policy explains the basic information Blackline may collect
              and how it is used to run DJ request pages, payments, support, and
              withdrawals.
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
              Questions about privacy can be sent to{" "}
              <a
                href="mailto:support@blacklinedj.com?subject=Blackline%20Privacy%20Question"
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
