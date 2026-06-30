import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import VerificationDashboardClient from "./VerificationDashboardClient";
import BlacklineAdminLoginForm from "./BlacklineAdminLoginForm";

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
    return <BlacklineAdminLoginForm unlockAdminPanel={unlockAdminPanel} />;
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
