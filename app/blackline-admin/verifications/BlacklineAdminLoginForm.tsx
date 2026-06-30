"use client";

import { useState } from "react";

type BlacklineAdminLoginFormProps = {
  unlockAdminPanel: (formData: FormData) => void | Promise<void>;
};

export default function BlacklineAdminLoginForm({
  unlockAdminPanel,
}: BlacklineAdminLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <form
        action={unlockAdminPanel}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
      >
        <h1 className="text-3xl font-black text-purple-500 mb-3">
          Blackline Admin Access
        </h1>

        <p className="text-zinc-400 mb-6">
          Enter the admin password to continue.
        </p>

        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Admin password"
            required
            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 pr-14 text-white outline-none focus:border-purple-500"
          />

          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((currentValue) => !currentValue)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button
          type="submit"
          className="w-full mt-5 bg-purple-600 hover:bg-purple-700 font-bold py-3 rounded-xl"
        >
          Unlock
        </button>
      </form>
    </main>
  );
}
