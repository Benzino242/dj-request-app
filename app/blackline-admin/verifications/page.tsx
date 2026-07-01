import { cookies, headers } from "next/headers";
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
const ADMIN_URL = "https://blacklinedj.com/blackline-admin/verifications";

const resendApiKey = process.env.RESEND_API_KEY;
const blacklineAlertEmail = process.env.BLACKLINE_ALERT_EMAIL;
const blacklineAlertFrom = process.env.BLACKLINE_ALERT_FROM;

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/blackline-admin/verifications",
    maxAge,
  };
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatLockoutTime(lockedUntil: number) {
  const lockoutDate = new Date(lockedUntil);

  if (Number.isNaN(lockoutDate.getTime())) {
    return "15 minutes";
  }

  return lockoutDate.toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function sendAdminLockoutAlert(lockedUntil: number) {
  if (!resendApiKey || !blacklineAlertEmail || !blacklineAlertFrom) {
    console.error("BLACKLINE ADMIN LOCKOUT EMAIL SKIPPED: Missing Resend env vars");
    return false;
  }

  try {
    const requestHeaders = await headers();
    const userAgent = requestHeaders.get("user-agent") || "Unknown browser";
    const forwardedFor = requestHeaders.get("x-forwarded-for") || "Unknown IP";
    const realIp = requestHeaders.get("x-real-ip") || "Unknown IP";
    const lockedUntilText = formatLockoutTime(lockedUntil);

    const subject = "🔒 Blackline admin login temporarily locked";

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2>🔒 Blackline admin login temporarily locked</h2>
        <p>Someone entered the wrong Blackline admin password ${MAX_FAILED_ATTEMPTS} times.</p>

        <div style="padding: 16px; border: 1px solid #ddd; border-radius: 12px; background: #f7f7f7;">
          <p><strong>Page:</strong> ${escapeHtml(ADMIN_URL)}</p>
          <p><strong>Failed attempts:</strong> ${MAX_FAILED_ATTEMPTS}</p>
          <p><strong>Lockout length:</strong> 15 minutes</p>
          <p><strong>Locked until:</strong> ${escapeHtml(lockedUntilText)}</p>
          <p><strong>Forwarded IP:</strong> ${escapeHtml(forwardedFor)}</p>
          <p><strong>Real IP:</strong> ${escapeHtml(realIp)}</p>
          <p><strong>Browser:</strong> ${escapeHtml(userAgent)}</p>
        </div>

        <p style="margin-top: 18px; color: #555;">
          If this was not you, consider changing BLACKLINE_ADMIN_PASSWORD in Vercel.
        </p>
      </div>
    `;

    const text = `
Blackline admin login temporarily locked

Someone entered the wrong Blackline admin password ${MAX_FAILED_ATTEMPTS} times.

Page: ${ADMIN_URL}
Failed attempts: ${MAX_FAILED_ATTEMPTS}
Lockout length: 15 minutes
Locked until: ${lockedUntilText}
Forwarded IP: ${forwardedFor}
Real IP: ${realIp}
Browser: ${userAgent}

If this was not you, consider changing BLACKLINE_ADMIN_PASSWORD in Vercel.
`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: blacklineAlertFrom,
        to: [blacklineAlertEmail],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BLACKLINE ADMIN LOCKOUT EMAIL FAILED:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("BLACKLINE ADMIN LOCKOUT EMAIL ERROR:", error);
    return false;
  }
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

        await sendAdminLockoutAlert(lockedUntil);

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

  return <VerificationDashboardClient signOutAction={lockAdminPanel} />;
}
