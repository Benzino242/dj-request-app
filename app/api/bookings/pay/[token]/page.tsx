"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type PublicBooking = {
  id: number;
  clientName: string;
  clientEmail: string;
  eventType?: string | null;
  eventDate?: string | null;
  venue?: string | null;
  status: string;
  paymentStatus: string;
  currency: string;
  agreedAmount: number;
  paymentExpiresAt?: string | null;
  paidAt?: string | null;
  isExpired: boolean;
  djName: string;
  djProfileImage?: string | null;
};

export default function BookingPaymentPage() {
  const params = useParams();
  const token = String(params.token || "");
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [successReference, setSuccessReference] = useState("");

  useEffect(() => {
    if (!token) return;

    async function loadBooking() {
      try {
        const response = await fetch(
          `/api/bookings/payment/${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "Booking payment link could not be loaded.");
          setLoading(false);
          return;
        }

        setBooking(result.booking as PublicBooking);
      } catch {
        setError("Booking payment link could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [token]);

  async function handlePayment() {
    if (!booking || paying) return;

    setPaying(true);
    setError("");

    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const paystack = new PaystackPop();

      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: booking.clientEmail,
        amount: Math.round(booking.agreedAmount * 100),
        currency: "GHS",
        metadata: {
          custom_fields: [
            {
              display_name: "Booking ID",
              variable_name: "booking_id",
              value: String(booking.id),
            },
            {
              display_name: "DJ",
              variable_name: "dj_name",
              value: booking.djName,
            },
          ],
        },
        onSuccess: async (transaction: any) => {
          const reference = transaction?.reference;

          if (!reference) {
            setError(
              "Payment completed without a reference. Please contact Blackline Support.",
            );
            setPaying(false);
            return;
          }

          const response = await fetch("/api/bookings/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token,
              reference,
            }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            setError(
              result.error ||
                `Payment could not be verified. Keep this reference: ${reference}`,
            );
            setPaying(false);
            return;
          }

          setSuccessReference(reference);
          setBooking((currentBooking) =>
            currentBooking
              ? { ...currentBooking, paymentStatus: "paid", status: "confirmed" }
              : currentBooking,
          );
          setPaying(false);
        },
        onCancel: () => {
          setPaying(false);
        },
      });
    } catch {
      setError("Payment could not be started. Please try again.");
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading secure booking...
      </main>
    );
  }

  if (error && !booking) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-5">
        <div className="max-w-md bg-zinc-900 border border-red-500/30 rounded-3xl p-7 text-center">
          <h1 className="text-2xl font-black text-red-400">
            Payment link unavailable
          </h1>
          <p className="text-zinc-300 mt-3">{error}</p>
        </div>
      </main>
    );
  }

  if (!booking) return null;

  const alreadyPaid = booking.paymentStatus === "paid";

  return (
    <main className="min-h-screen bg-black text-white p-4 flex items-center justify-center">
      <div className="w-full max-w-lg bg-zinc-900 border border-purple-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_45px_rgba(168,85,247,0.2)]">
        <div className="text-center">
          {booking.djProfileImage && (
            <img
              src={booking.djProfileImage}
              alt={booking.djName}
              className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-purple-500 mb-4"
            />
          )}
          <p className="text-xs uppercase tracking-[0.25em] text-purple-400 font-black">
            Secure Blackline Booking
          </p>
          <h1 className="text-3xl font-black mt-2">{booking.djName}</h1>
        </div>

        <div className="bg-black/40 border border-zinc-800 rounded-2xl p-5 mt-6 space-y-3">
          <p>
            <span className="text-zinc-500">Client:</span>{" "}
            <strong>{booking.clientName}</strong>
          </p>
          <p>
            <span className="text-zinc-500">Event:</span>{" "}
            <strong>{booking.eventType || "Not provided"}</strong>
          </p>
          <p>
            <span className="text-zinc-500">Date:</span>{" "}
            <strong>
              {booking.eventDate
                ? new Date(`${booking.eventDate}T00:00:00`).toLocaleDateString()
                : "Not provided"}
            </strong>
          </p>
          <p>
            <span className="text-zinc-500">Venue:</span>{" "}
            <strong>{booking.venue || "Not provided"}</strong>
          </p>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-5 mt-4 text-center">
          <p className="text-xs uppercase tracking-widest text-purple-300 font-black">
            Final booking price
          </p>
          <p className="text-4xl font-black text-white mt-2">
            GHS {booking.agreedAmount.toFixed(2)}
          </p>
        </div>

        {successReference || alreadyPaid ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 mt-5 text-center">
            <div className="text-4xl">✅</div>
            <h2 className="text-2xl font-black text-green-300 mt-2">
              Booking confirmed
            </h2>
            <p className="text-zinc-300 mt-2">
              Your payment was verified successfully.
            </p>
            {successReference && (
              <p className="text-xs font-mono break-all text-zinc-500 mt-3">
                {successReference}
              </p>
            )}
          </div>
        ) : booking.isExpired ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mt-5 text-center text-red-300">
            This payment link has expired. Contact the DJ or Blackline for a new
            link.
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePayment}
            disabled={paying}
            className="w-full mt-5 bg-purple-600 hover:bg-purple-700 rounded-xl p-4 text-xl font-black disabled:opacity-50"
          >
            {paying
              ? "Opening secure payment..."
              : `Pay GHS ${booking.agreedAmount.toFixed(2)}`}
          </button>
        )}

        {error && booking && (
          <p className="text-red-400 text-sm text-center mt-4">{error}</p>
        )}

        <p className="text-xs text-zinc-500 text-center mt-5">
          Payments are securely processed by Paystack. Blackline verifies every
          transaction before confirming the booking.
        </p>
      </div>
    </main>
  );
}
