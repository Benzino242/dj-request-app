"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
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
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md">
        <h1 className="text-5xl font-black text-center text-purple-500 mb-3">
          BLACKLINE
        </h1>

        <p className="text-zinc-400 text-center mb-8">
          DJ Dashboard Login
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
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

          {errorMessage && (
            <p className="text-red-400 text-center text-sm">
              {errorMessage}
            </p>
          )}

<button
  type="submit"
  disabled={loading}
  className="w-full bg-purple-600 hover:bg-purple-700 transition p-4 rounded-xl text-xl font-bold disabled:opacity-50"
>
  {loading ? "Signing In..." : "Login"}
</button>

<div className="text-center">
  <Link
    href="/reset-password"
    className="text-sm text-zinc-400 hover:text-purple-400 font-semibold"
  >
    Forgot your password?
  </Link>
</div>
</form>

        <div className="mt-6 text-center">
          <p className="text-zinc-500">
            New DJ?
          </p>

          <Link
            href="/signup"
            className="text-purple-400 hover:text-purple-300 font-semibold"
          >
            Create a Blackline account
          </Link>
        </div>
      </div>
    </main>
  );
}