import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

    redirect("/blackline-admin/verifications");
  }

  async function lockAdminPanel() {
    "use server";

    const cookieStore = await cookies();

    cookieStore.set("blackline_admin_unlocked", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/blackline-admin/verifications",
      maxAge: 0,
    });

    redirect("/blackline-admin/verifications");
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

          <div className="relative">
            <input
              id="blackline-admin-password-input"
              name="password"
              type="password"
              placeholder="Admin password"
              required
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 pr-14 text-white outline-none focus:border-purple-500"
            />

            <button
              id="blackline-admin-password-toggle"
              type="button"
              aria-label="Show password"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              👁️
            </button>
          </div>

          <button
            type="submit"
            className="w-full mt-5 bg-purple-600 hover:bg-purple-700 font-bold py-3 rounded-xl"
          >
            Unlock
          </button>
        </form>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var input = document.getElementById("blackline-admin-password-input");
                var button = document.getElementById("blackline-admin-password-toggle");

                if (!input || !button) return;

                button.addEventListener("click", function () {
                  var isPassword = input.getAttribute("type") === "password";

                  input.setAttribute("type", isPassword ? "text" : "password");
                  button.textContent = isPassword ? "🙈" : "👁️";
                  button.setAttribute(
                    "aria-label",
                    isPassword ? "Hide password" : "Show password"
                  );
                });
              })();
            `,
          }}
        />
      </main>
    );
  }

  return (
    <>
      <form action={lockAdminPanel} className="fixed top-4 right-4 z-50">
        <button
          type="submit"
          className="bg-zinc-900/95 hover:bg-red-950 border border-zinc-700 hover:border-red-500 text-zinc-200 hover:text-red-200 px-4 py-2 rounded-xl text-sm font-bold shadow-xl transition"
        >
          Sign out
        </button>
      </form>

      <VerificationDashboardClient />
    </>
  );
}