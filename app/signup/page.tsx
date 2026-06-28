"use client";

import { type FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

async function triggerDjSignupAlert(userId: string) {
  try {
    const { data: createdDj, error: lookupError } = await supabase
      .from("djs")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (lookupError) {
      console.error("DJ SIGNUP ALERT LOOKUP ERROR:", lookupError.message);
      return;
    }

    if (!createdDj?.id) {
      console.error("DJ SIGNUP ALERT SKIPPED: Missing DJ id");
      return;
    }

    const response = await fetch("/api/blackline-admin/dashboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entityType: "dj",
        id: createdDj.id,
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

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const cleanStageName = stageName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

    if (!cleanStageName) {
      setMessage("Please enter a valid stage name.");
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

    const { error: profileError } = await supabase.from("djs").insert([
      {
        stage_name: cleanStageName,
        email: email.trim(),
        user_id: userId,
      },
    ]);

    if (profileError) {
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    await triggerDjSignupAlert(userId);

    setMessage("Account created! Redirecting to dashboard...");

    setStageName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
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
          <input
            type="text"
            placeholder="Stage name e.g. djbenzino"
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            disabled={loading}
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