"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SignupPage() {
  const [stageName, setStageName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const cleanStageName = stageName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

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
      setMessage("Account created. Please check your email to confirm signup.");
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

    setMessage(
      `Account created! Your DJ page is /${cleanStageName}. You can now log in at /admin.`
    );

    setStageName("");
    setEmail("");
    setPassword("");
    setLoading(false);
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

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl bg-black border border-zinc-700"
            required
          />

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