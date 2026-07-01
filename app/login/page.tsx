"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loginDisabled = loading || !email.trim() || !password;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-5 py-8 text-white md:px-8 md:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.25),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.1),transparent_34%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center justify-center">
        <section className="w-full">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-purple-500 hover:text-white"
            >
              ← Back
            </Link>

            <Link
              href="/signup"
              className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-purple-500 hover:text-white"
            >
              Join Blackline
            </Link>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/95 p-6 shadow-[0_0_80px_rgba(168,85,247,0.18)] md:p-8">
            <div className="text-center">
              <h1 className="text-5xl font-black tracking-tight text-purple-500 md:text-6xl">
                BLACKLINE
              </h1>

              <p className="mt-3 text-xl font-bold text-white">
                DJ Dashboard Login
              </p>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
                Access your live request queue, QR code, earnings, withdrawals,
                and DJ profile.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage("");
                  }}
                  className="w-full rounded-2xl border border-zinc-700 bg-black p-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage("");
                    }}
                    className="w-full rounded-2xl border border-zinc-700 bg-black p-4 pr-14 text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-zinc-400 transition hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7 1.028-2.31 2.83-4.25 5.11-5.5M9.88 9.88A3 3 0 0114.12 14.12M6.1 6.1L17.9 17.9M3 3l18 18"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm font-bold text-red-300">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={loginDisabled}
                className="w-full rounded-2xl bg-purple-600 p-4 text-xl font-black text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Enter DJ Dashboard"}
              </button>

              <div className="text-center">
                <Link
                  href="/reset-password"
                  className="text-sm font-bold text-zinc-400 transition hover:text-purple-300"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>

            <div className="mt-7 rounded-2xl border border-zinc-800 bg-black/50 p-4 text-center">
              <p className="text-sm text-zinc-500">New DJ?</p>

              <Link
                href="/signup"
                className="mt-1 inline-block font-black text-purple-300 transition hover:text-purple-200"
              >
                Create a Blackline account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
