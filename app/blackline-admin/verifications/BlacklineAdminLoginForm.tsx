"use client";

import { useEffect, useState } from "react";

type BlacklineAdminLoginFormProps = {
  unlockAdminPanel: (formData: FormData) => void | Promise<void>;
  hasLoginError?: boolean;
};

export default function BlacklineAdminLoginForm({
  unlockAdminPanel,
  hasLoginError = false,
}: BlacklineAdminLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginError, setShowLoginError] = useState(hasLoginError);

  useEffect(() => {
    setShowLoginError(hasLoginError);
  }, [hasLoginError]);

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

        {showLoginError && (
          <div className="mb-4 rounded-2xl border border-red-500/50 bg-red-500/10 p-4">
            <p className="text-sm font-bold text-red-300">
              Incorrect admin password.
            </p>
            <p className="mt-1 text-xs text-red-200/80">
              Please try again or reset BLACKLINE_ADMIN_PASSWORD in Vercel.
            </p>
          </div>
        )}

        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Admin password"
            required
            onChange={() => setShowLoginError(false)}
            className={`w-full rounded-xl border bg-black px-4 py-3 pr-14 text-white outline-none focus:border-purple-500 ${
              showLoginError ? "border-red-500" : "border-zinc-700"
            }`}
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
