import { cookies } from "next/headers";
import VerificationDashboardClient from "./VerificationDashboardClient";

export default async function VerificationAdminPage() {
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("blackline_admin_unlocked")?.value === "true";

  async function unlockAdminPanel(formData: FormData) {
    "use server";

    const password = String(formData.get("password") || "");

    if (password !== process.env.BLACKLINE_ADMIN_PASSWORD) {
      return;
    }

    const cookieStore = await cookies();

    cookieStore.set("blackline_admin_unlocked", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/blackline-admin/verifications",
        maxAge: 60 * 60 * 8,
      });
  }

  if (!isUnlocked) {
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

          <input
            name="password"
            type="password"
            placeholder="Admin password"
            required
            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
          />

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

  return <VerificationDashboardClient />;
}