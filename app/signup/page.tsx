"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const RESERVED_STAGE_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "signup",
  "reset-password",
  "update-password",
  "blackline-admin",
  "blackline",
  "support",
  "terms",
  "privacy",
  "videos",
  "images",
  "www",
]);

type SlugAvailability = "idle" | "checking" | "available" | "taken";

function cleanSlugForUrl(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function triggerDjSignupAlert(djId: number) {
  try {
    const response = await fetch("/api/blackline-admin/dashboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entityType: "dj",
        id: djId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DJ SIGNUP ALERT FAILED:", errorText);
    }
  } catch (error) {
    console.error("DJ SIGNUP ALERT ERROR:", error);
  }
}

export default function SignupPage() {
  const [stageName, setStageName] = useState("");
  const [stageSlug, setStageSlug] = useState("");
  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const [showLinkEditor, setShowLinkEditor] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [slugAvailability, setSlugAvailability] =
    useState<SlugAvailability>("idle");

  const cleanStageName = stageName.trim();
  const cleanEmail = email.trim();

  const cleanStageSlug = useMemo(() => cleanSlugForUrl(stageSlug), [stageSlug]);

  const slugIsReserved =
    cleanStageSlug.length > 0 && RESERVED_STAGE_SLUGS.has(cleanStageSlug);

  const slugTooShort = cleanStageSlug.length > 0 && cleanStageSlug.length < 3;

  const slugTooLong = cleanStageSlug.length > 30;

  const slugIsChecking = slugAvailability === "checking";
  const slugIsAvailable = slugAvailability === "available";
  const slugIsTaken = slugAvailability === "taken";

  const needsLinkAttention =
    cleanStageSlug.length > 0 &&
    (slugIsReserved || slugTooShort || slugTooLong || slugIsTaken);

  const signupDisabled =
    loading ||
    !cleanStageName ||
    !cleanStageSlug ||
    !cleanEmail ||
    !password ||
    slugIsReserved ||
    slugTooShort ||
    slugTooLong ||
    slugIsChecking ||
    slugIsTaken;

  useEffect(() => {
    if (slugWasEdited) return;

    const suggestedSlug = cleanSlugForUrl(stageName);
    setStageSlug(suggestedSlug);
  }, [stageName, slugWasEdited]);

  useEffect(() => {
    let cancelled = false;

    if (!cleanStageSlug || slugIsReserved || slugTooShort || slugTooLong) {
      setSlugAvailability("idle");
      return;
    }

    setSlugAvailability("checking");

    const timeoutId = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from("djs")
        .select("id")
        .eq("stage_slug", cleanStageSlug)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("STAGE SLUG CHECK ERROR:", error.message);
        setSlugAvailability("idle");
        return;
      }

      setSlugAvailability(data ? "taken" : "available");
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [cleanStageSlug, slugIsReserved, slugTooShort, slugTooLong]);

  useEffect(() => {
    if (needsLinkAttention) {
      setShowLinkEditor(true);
    }
  }, [needsLinkAttention]);

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!cleanStageName) {
      setMessage("Please enter your DJ name.");
      setLoading(false);
      return;
    }

    if (!cleanStageSlug) {
      setMessage("Please enter a valid Blackline link.");
      setLoading(false);
      return;
    }

    if (cleanStageSlug.length < 3) {
      setMessage("Your Blackline link must be at least 3 characters.");
      setLoading(false);
      setShowLinkEditor(true);
      return;
    }

    if (cleanStageSlug.length > 30) {
      setMessage("Your Blackline link must be 30 characters or less.");
      setLoading(false);
      setShowLinkEditor(true);
      return;
    }

    if (RESERVED_STAGE_SLUGS.has(cleanStageSlug)) {
      setMessage("That Blackline link is reserved. Please choose another one.");
      setLoading(false);
      setShowLinkEditor(true);
      return;
    }

    const { data: existingDj, error: slugCheckError } = await supabase
      .from("djs")
      .select("id")
      .eq("stage_slug", cleanStageSlug)
      .maybeSingle();

    if (slugCheckError) {
      setMessage(slugCheckError.message);
      setLoading(false);
      return;
    }

    if (existingDj) {
      setMessage("That Blackline link is already taken. Please choose another one.");
      setLoading(false);
      setShowLinkEditor(true);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setMessage("Account created. Redirecting to login...");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);

      setLoading(false);
      return;
    }

    const { data: createdDj, error: profileError } = await supabase
      .from("djs")
      .insert([
        {
          stage_name: cleanStageName,
          stage_slug: cleanStageSlug,
          email: cleanEmail,
          user_id: userId,
          verification_status: "not_started",
        },
      ])
      .select("id")
      .single();

    if (profileError) {
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    if (createdDj?.id) {
      await triggerDjSignupAlert(createdDj.id);
    } else {
      console.error("DJ SIGNUP ALERT SKIPPED: Missing DJ id");
    }

    setMessage("Account created! Redirecting to dashboard...");

    setStageName("");
    setStageSlug("");
    setSlugWasEdited(false);
    setShowLinkEditor(false);
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setSlugAvailability("idle");
    setLoading(false);

    setTimeout(() => {
      window.location.href = "/admin";
    }, 1500);
  }

  function getLinkStatusText() {
    if (!cleanStageSlug) {
      return "Your Blackline link will be created from your DJ name.";
    }

    if (slugIsReserved) {
      return "That Blackline link is reserved. Please choose another one.";
    }

    if (slugTooShort) {
      return "Your Blackline link must be at least 3 characters.";
    }

    if (slugTooLong) {
      return "Your Blackline link must be 30 characters or less.";
    }

    if (slugIsChecking) {
      return "Checking link availability...";
    }

    if (slugIsTaken) {
      return "That link is already taken. Choose another one below.";
    }

    return `Your link: blacklinedj.com/${cleanStageSlug}`;
  }

  function getLinkStatusClassName() {
    if (slugIsReserved || slugTooShort || slugTooLong || slugIsTaken) {
      return "text-red-300";
    }

    if (slugIsAvailable) {
      return "text-green-300";
    }

    if (cleanStageSlug) {
      return "text-purple-300";
    }

    return "text-zinc-500";
  }

  function resetSuggestedLink() {
    setStageSlug(cleanSlugForUrl(stageName));
    setSlugWasEdited(false);
    setShowLinkEditor(false);
    setMessage("");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-5 py-8 text-white md:px-8 md:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.28),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_34%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <section className="w-full max-w-xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-purple-500 hover:text-white"
            >
              ← Back
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-purple-500 hover:text-white"
            >
              DJ Login
            </Link>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/95 p-6 shadow-[0_0_80px_rgba(168,85,247,0.18)] md:p-8">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
                Join Blackline
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight text-white md:text-5xl">
                Create your DJ page
              </h1>

              <p className="mx-auto mt-4 max-w-md text-zinc-400">
                Get a QR-ready request page and live DJ dashboard for paid song
                requests.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] font-black uppercase tracking-[0.12em] text-zinc-300">
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 px-2 py-3">
                QR page
              </div>
              <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-2 py-3">
                Live queue
              </div>
              <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-2 py-3">
                Paid requests
              </div>
            </div>

            <form onSubmit={handleSignup} className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                  DJ name
                </label>

                <input
                  type="text"
                  placeholder="e.g. DJ Don Dada"
                  value={stageName}
                  onChange={(e) => {
                    setStageName(e.target.value);
                    setMessage("");
                  }}
                  className="w-full rounded-2xl border border-zinc-700 bg-black p-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                  required
                />

                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  This is the name guests will see on your request page.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                      Blackline link
                    </p>
                    <p className={`mt-1 text-sm font-bold ${getLinkStatusClassName()}`}>
                      {getLinkStatusText()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkEditor((current) => !current);
                      setSlugWasEdited(true);
                    }}
                    className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-purple-500 hover:text-white"
                  >
                    {showLinkEditor ? "Hide" : "Customize"}
                  </button>
                </div>

                {showLinkEditor && (
                  <div className="mt-4">
                    <div className="overflow-hidden rounded-2xl border border-zinc-700 bg-black transition focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/30">
                      <div className="border-b border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-500">
                        blacklinedj.com/
                      </div>

                      <input
                        type="text"
                        placeholder="dj-don-dada"
                        value={stageSlug}
                        onChange={(e) => {
                          setSlugWasEdited(true);
                          setStageSlug(cleanSlugForUrl(e.target.value));
                          setMessage("");
                        }}
                        className="w-full bg-black p-4 text-white outline-none placeholder:text-zinc-600"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={resetSuggestedLink}
                      className="mt-3 text-xs font-bold text-purple-300 hover:text-purple-200"
                    >
                      Use automatic link from DJ name
                    </button>
                  </div>
                )}
              </div>

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
                    setMessage("");
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
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setMessage("");
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

              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
                <p className="text-sm font-black text-white">Good to know</p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  You can receive paid requests before verification. Withdrawals
                  unlock after Blackline approval.
                </p>
              </div>

              <button
                type="submit"
                disabled={signupDisabled}
                className="w-full rounded-2xl bg-purple-600 p-4 text-xl font-black text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create DJ Account"}
              </button>
            </form>

            {message && (
              <p className="mt-5 rounded-2xl border border-zinc-800 bg-black/60 p-4 text-center text-sm text-zinc-300">
                {message}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 text-center text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-center">
              <Link href="/login" className="font-bold text-purple-300 hover:text-purple-200">
                Already have an account?
              </Link>
              <span className="hidden text-zinc-700 sm:block">•</span>
              <a
                href="mailto:support@blacklinedj.com?subject=Blackline%20DJ%20Signup%20Help"
                className="font-bold text-zinc-400 hover:text-white"
              >
                Need help?
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
