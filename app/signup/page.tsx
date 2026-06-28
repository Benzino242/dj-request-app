"use client";

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [slugAvailability, setSlugAvailability] =
    useState<SlugAvailability>("idle");

  const cleanStageName = stageName.trim();

  const cleanStageSlug = useMemo(() => cleanSlugForUrl(stageSlug), [stageSlug]);

  const slugIsReserved =
    cleanStageSlug.length > 0 && RESERVED_STAGE_SLUGS.has(cleanStageSlug);

  const slugTooShort = cleanStageSlug.length > 0 && cleanStageSlug.length < 3;

  const slugTooLong = cleanStageSlug.length > 30;

  const slugIsChecking = slugAvailability === "checking";
  const slugIsTaken = slugAvailability === "taken";

  const signupDisabled =
    loading ||
    !cleanStageName ||
    !cleanStageSlug ||
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

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!cleanStageName) {
      setMessage("Please enter your DJ display name.");
      setLoading(false);
      return;
    }

    if (!cleanStageSlug) {
      setMessage("Please enter a valid Blackline link.");
      setLoading(false);
      return;
    }

    if (cleanStageSlug.length < 3) {
      setMessage("Public URL name must be at least 3 characters.");
      setLoading(false);
      return;
    }

    if (cleanStageSlug.length > 30) {
      setMessage("Public URL name must be 30 characters or less.");
      setLoading(false);
      return;
    }

    if (RESERVED_STAGE_SLUGS.has(cleanStageSlug)) {
      setMessage("This public URL name is reserved. Please choose another one.");
      setLoading(false);
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
      setMessage("This public URL name is already taken. Please choose another one.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
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
          email: email.trim(),
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
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setSlugAvailability("idle");
    setLoading(false);

    setTimeout(() => {
      window.location.href = "/admin";
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md">
        <h1 className="text-4xl font-bold text-purple-500 text-center mb-3">
          Join Blackline
        </h1>

        <p className="text-zinc-400 text-center mb-8">
          Create your DJ profile and get your own request page.
        </p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="DJ name e.g. DJ Don Dada"
              value={stageName}
              onChange={(e) => {
                setStageName(e.target.value);
                setMessage("");
              }}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
              required
            />

            <p className="text-xs text-zinc-500 mt-2">
            Guests will see this name on your request page.
            </p>
          </div>

          <div>
            <input
              type="text"
              placeholder="Link name e.g. dj-don-dada"
              value={stageSlug}
              onChange={(e) => {
                setSlugWasEdited(true);
                setStageSlug(cleanSlugForUrl(e.target.value));
                setMessage("");
              }}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
              required
            />

            {cleanStageSlug && slugIsReserved ? (
              <p className="text-xs text-red-400 mt-2">
                This public URL name is reserved. Please choose another one.
              </p>
            ) : cleanStageSlug && slugTooShort ? (
              <p className="text-xs text-red-400 mt-2">
                Public URL name must be at least 3 characters.
              </p>
            ) : cleanStageSlug && slugTooLong ? (
              <p className="text-xs text-red-400 mt-2">
                Public URL name must be 30 characters or less.
              </p>
            ) : cleanStageSlug && slugIsChecking ? (
              <p className="text-xs text-zinc-500 mt-2">
                Checking public URL availability...
              </p>
            ) : cleanStageSlug && slugIsTaken ? (
              <p className="text-xs text-red-400 mt-2">
                This public URL name is already taken. Please choose another one.
              </p>
            ) : cleanStageSlug ? (
              <p className="text-xs text-zinc-500 mt-2">
                Guests will scan/open:{" "}
                <span className="text-purple-400">
                  blacklinedj.com/{cleanStageSlug}
                </span>
              </p>
            ) : (
              <p className="text-xs text-zinc-500 mt-2">
              This is your unique page link. You can change it if the suggested link is already taken.
              </p>
            )}
          </div>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage("");
            }}
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setMessage("");
              }}
              className="w-full p-4 pr-14 rounded-xl bg-black border border-zinc-700"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-white"
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
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
                  className="w-6 h-6"
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

          <button
            type="submit"
            disabled={signupDisabled}
            className="w-full bg-purple-600 hover:bg-purple-700 p-4 rounded-xl text-xl font-semibold disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create DJ Account"}
          </button>
        </form>

        {message && (
          <p className="text-center text-sm text-zinc-300 mt-5">{message}</p>
        )}
      </div>
    </main>
  );
}