"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password updated successfully. You can now log in.");
    setPassword("");
    setShowPassword(false);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md">
        <h1 className="text-4xl font-black text-center text-purple-500 mb-3">
          Update Password
        </h1>

        <p className="text-zinc-400 text-center mb-8">
          Enter your new Blackline password.
        </p>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
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
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 transition p-4 rounded-xl text-xl font-bold disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
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