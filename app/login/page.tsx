"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            required
          />

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