"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const RESERVED_STAGE_NAMES = new Set([
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

type StageNameAvailability = "idle" | "checking" | "available" | "taken";

function cleanStageNameForUrl(value: string) {
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [stageNameAvailability, setStageNameAvailability] =
    useState<StageNameAvailability>("idle");

  const cleanStageName = useMemo(
    () => cleanStageNameForUrl(stageName),
    [stageName],
  );

  const stageNameIsReserved =
    cleanStageName.length > 0 && RESERVED_STAGE_NAMES.has(cleanStageName);

  const stageNameTooShort =
    cleanStageName.length > 0 && cleanStageName.length < 3;

  const stageNameTooLong = cleanStageName.length > 30;

  const stageNameIsChecking = stageNameAvailability === "checking";
  const stageNameIsTaken = stageNameAvailability === "taken";

  const signupDisabled =
    loading ||
    stageNameIsReserved ||
    stageNameTooShort ||
    stageNameTooLong ||
    stageNameIsChecking ||
    stageNameIsTaken;

  useEffect(() => {
    let cancelled = false;

    if (
      !cleanStageName ||
      stageNameIsReserved ||
      stageNameTooShort ||
      stageNameTooLong
    ) {
      setStageNameAvailability("idle");
      return;
    }

    setStageNameAvailability("checking");

    const timeoutId = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from("djs")
        .select("id")
        .eq("stage_name", cleanStageName)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("STAGE NAME CHECK ERROR:", error.message);
        setStageNameAvailability("idle");
        return;
      }

      setStageNameAvailability(data ? "taken" : "available");
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [cleanStageName, stageNameIsReserved, stageNameTooShort, stageNameTooLong]);

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!cleanStageName) {
      setMessage("Please enter a valid stage name.");
      setLoading(false);
      return;
    }

    if (cleanStageName.length < 3) {
      setMessage("Stage name must be at least 3 characters.");
      setLoading(false);
      return;
    }

    if (cleanStageName.length > 30) {
      setMessage("Stage name must be 30 characters or less.");
      setLoading(false);
      return;
    }

    if (RESERVED_STAGE_NAMES.has(cleanStageName)) {
      setMessage("This stage name is reserved. Please choose another one.");
      setLoading(false);
      return;
    }

    const { data: existingDj, error: stageNameCheckError } = await supabase
      .from("djs")
      .select("id")
      .eq("stage_name", cleanStageName)
      .maybeSingle();

    if (stageNameCheckError) {
      setMessage(stageNameCheckError.message);
      setLoading(false);
      return;
    }

    if (existingDj) {
      setMessage("This stage name is already taken. Please choose another one.");
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
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setStageNameAvailability("idle");
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
              placeholder="Stage name e.g. djbenzino"
              value={stageName}
              onChange={(e) => {
                setStageName(e.target.value);
                setMessage("");
              }}
              className="w-full p-4 rounded-xl bg-black border border-zinc-700"
              required
            />

            {cleanStageName && stageNameIsReserved ? (
              <p className="text-xs text-red-400 mt-2">
                This stage name is reserved. Please choose another one.
              </p>
            ) : cleanStageName && stageNameTooShort ? (
              <p className="text-xs text-red-400 mt-2">
                Stage name must be at least 3 characters.
              </p>
            ) : cleanStageName && stageNameTooLong ? (
              <p className="text-xs text-red-400 mt-2">
                Stage name must be 30 characters or less.
              </p>
            ) : cleanStageName && stageNameIsChecking ? (
              <p className="text-xs text-zinc-500 mt-2">
                Checking stage name availability...
              </p>
            ) : cleanStageName && stageNameIsTaken ? (
              <p className="text-xs text-red-400 mt-2">
                This stage name is already taken. Please choose another one.
              </p>
            ) : cleanStageName ? (
              <p className="text-xs text-zinc-500 mt-2">
                Your public request page will be:{" "}
                <span className="text-purple-400">
                  blacklinedj.com/{cleanStageName}
                </span>
              </p>
            ) : null}
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