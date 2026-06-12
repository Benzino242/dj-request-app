"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password reset link sent. Please check your email.");
    setEmail("");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md">
        <h1 className="text-4xl font-black text-center text-purple-500 mb-3">
          Reset Password
        </h1>

        <p className="text-zinc-400 text-center mb-8">
          Enter your DJ account email and we’ll send you a reset link.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 transition p-4 rounded-xl text-xl font-bold disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <p className="text-center text-sm text-zinc-300 mt-5">{message}</p>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-purple-400 hover:text-purple-300 font-semibold"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}