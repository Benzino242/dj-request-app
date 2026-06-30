import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import VerificationDashboardClient from "./VerificationDashboardClient";
import BlacklineAdminLoginForm from "./BlacklineAdminLoginForm";

type VerificationAdminPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const ADMIN_UNLOCK_COOKIE = "blackline_admin_unlocked";
const ADMIN_FAILED_ATTEMPTS_COOKIE = "blackline_admin_failed_attempts";
const ADMIN_LOCKED_UNTIL_COOKIE = "blackline_admin_locked_until";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60;

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/blackline-admin/verifications",
    maxAge,
  };
}

export default async function VerificationAdminPage({
  searchParams,
}: VerificationAdminPageProps) {
  const cookieStore = await cookies();
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const isUnlocked = cookieStore.get(ADMIN_UNLOCK_COOKIE)?.value === "true";
  const lockedUntilValue = Number(
    cookieStore.get(ADMIN_LOCKED_UNTIL_COOKIE)?.value || 0,
  );
  const isLocked = lockedUntilValue > Date.now();
  const loginErrorType = isLocked
    ? "locked"
    : resolvedSearchParams.error === "1"
      ? "wrong"
      : resolvedSearchParams.error === "locked"
        ? "locked"
        : null;

  async function unlockAdminPanel(formData: FormData) {
    "use server";

    const password = String(formData.get("password") || "");
    const cookieStore = await cookies();

    const lockedUntilValue = Number(
      cookieStore.get(ADMIN_LOCKED_UNTIL_COOKIE)?.value || 0,
    );

    if (lockedUntilValue > Date.now()) {
      redirect("/blackline-admin/verifications?error=locked");
    }

    if (password !== process.env.BLACKLINE_ADMIN_PASSWORD) {
      const currentFailedAttempts = Number(
        cookieStore.get(ADMIN_FAILED_ATTEMPTS_COOKIE)?.value || 0,
      );
      const nextFailedAttempts = currentFailedAttempts + 1;

      if (nextFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCKOUT_SECONDS * 1000;

        cookieStore.set(
          ADMIN_LOCKED_UNTIL_COOKIE,
          String(lockedUntil),
          getCookieOptions(LOCKOUT_SECONDS),
        );

        cookieStore.set(
          ADMIN_FAILED_ATTEMPTS_COOKIE,
          "0",
          getCookieOptions(0),
        );

        redirect("/blackline-admin/verifications?error=locked");
      }

      cookieStore.set(
        ADMIN_FAILED_ATTEMPTS_COOKIE,
        String(nextFailedAttempts),
        getCookieOptions(LOCKOUT_SECONDS),
      );

      redirect("/blackline-admin/verifications?error=1");
    }

    cookieStore.set(ADMIN_UNLOCK_COOKIE, "true", getCookieOptions(60 * 60 * 8));
    cookieStore.set(ADMIN_FAILED_ATTEMPTS_COOKIE, "0", getCookieOptions(0));
    cookieStore.set(ADMIN_LOCKED_UNTIL_COOKIE, "0", getCookieOptions(0));

    redirect("/blackline-admin/verifications");
  }

  async function lockAdminPanel() {
    "use server";

    const cookieStore = await cookies();

    cookieStore.set(ADMIN_UNLOCK_COOKIE, "", getCookieOptions(0));

    redirect("/blackline-admin/verifications");
  }

  if (!isUnlocked) {
    return (
      <BlacklineAdminLoginForm
        unlockAdminPanel={unlockAdminPanel}
        loginErrorType={loginErrorType}
        lockedUntil={isLocked || loginErrorType === "locked" ? lockedUntilValue : null}
      />
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
