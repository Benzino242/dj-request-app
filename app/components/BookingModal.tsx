"use client";

import type { Language } from "../lib/translations";
import { bookingTranslations } from "../lib/bookingTranslations";
import { availabilityTranslations } from "../lib/availabilityTranslations";

type BookingAvailabilityStatus =
  | "available"
  | "booked"
  | "unavailable"
  | "not_set"
  | null;

type BookingModalProps = {
  open: boolean;
  onClose: () => void;
  language: Language;

  bookingName: string;
  setBookingName: (value: string) => void;

  bookingEmail: string;
  setBookingEmail: (value: string) => void;

  bookingPhone: string;
  setBookingPhone: (value: string) => void;

  bookingEventType: string;
  setBookingEventType: (value: string) => void;

  bookingDate: string;
  setBookingDate: (value: string) => void;
  bookingAvailability: BookingAvailabilityStatus;
  bookingAvailabilityLoading: boolean;
  bookingAvailabilityError: string;

  bookingVenue: string;
  setBookingVenue: (value: string) => void;

  bookingBudget: string;
  setBookingBudget: (value: string) => void;

  bookingMessage: string;
  setBookingMessage: (value: string) => void;

  bookingSending: boolean;
  bookingSuccess: string;
  bookingError: string;

  submitBookingRequest: () => void;
};

export default function BookingModal({
  open,
  onClose,
  language,
  bookingName,
  setBookingName,
  bookingEmail,
  setBookingEmail,
  bookingPhone,
  setBookingPhone,
  bookingEventType,
  setBookingEventType,
  bookingDate,
  setBookingDate,
  bookingAvailability,
  bookingAvailabilityLoading,
  bookingAvailabilityError,
  bookingVenue,
  setBookingVenue,
  bookingBudget,
  setBookingBudget,
  bookingMessage,
  setBookingMessage,
  bookingSending,
  bookingSuccess,
  bookingError,
  submitBookingRequest,
}: BookingModalProps) {
  if (!open) return null;

  const bookingText =
    bookingTranslations[language] || bookingTranslations.en;
  const availabilityText =
    availabilityTranslations[language] || availabilityTranslations.en;
  const today = new Date();
  const minimumDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const dateIsBlocked =
    bookingAvailability === "booked" ||
    bookingAvailability === "unavailable";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-lg rounded-3xl border border-zinc-700 bg-zinc-900 p-6">
        <h2 className="mb-5 text-2xl font-bold text-white">
          📅 {bookingText.modalTitle}
        </h2>

        <input
          className="mb-3 w-full rounded-xl border border-zinc-700 bg-black p-3"
          placeholder={bookingText.yourName}
          value={bookingName}
          onChange={(e) => setBookingName(e.target.value)}
        />

        <input
          type="email"
          className="mb-3 w-full rounded-xl border border-zinc-700 bg-black p-3"
          placeholder={bookingText.yourEmail}
          value={bookingEmail}
          onChange={(e) => setBookingEmail(e.target.value)}
        />

        <input
          type="tel"
          className="mb-3 w-full rounded-xl border border-zinc-700 bg-black p-3"
          placeholder={bookingText.yourPhone}
          value={bookingPhone}
          onChange={(e) => setBookingPhone(e.target.value)}
        />

        <input
          className="mb-3 w-full rounded-xl border border-zinc-700 bg-black p-3"
          placeholder={bookingText.eventType}
          value={bookingEventType}
          onChange={(e) => setBookingEventType(e.target.value)}
        />

        <label
          className="mb-2 block text-sm text-zinc-400"
          htmlFor="booking-date"
        >
          {bookingText.eventDate}
        </label>
        <input
          id="booking-date"
          type="date"
          min={minimumDate}
          className="mb-3 w-full rounded-xl border border-zinc-700 bg-black p-3"
          value={bookingDate}
          onChange={(e) => setBookingDate(e.target.value)}
        />

        <div className="mb-4 rounded-xl border border-zinc-700 bg-black/50 p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-300">
            📅 {availabilityText.checkAvailability}
          </p>

          <p
            className={`mt-2 text-sm font-bold ${
              bookingAvailability === "available"
                ? "text-green-400"
                : dateIsBlocked
                  ? "text-red-400"
                  : "text-amber-300"
            }`}
          >
            {!bookingDate
              ? availabilityText.selectDate
              : bookingAvailabilityLoading
                ? availabilityText.checking
                : bookingAvailabilityError
                  ? bookingAvailabilityError
                  : bookingAvailability === "available"
                    ? `✅ ${availabilityText.dateAvailable}`
                    : bookingAvailability === "booked"
                      ? `❌ ${availabilityText.dateBooked}`
                      : bookingAvailability === "unavailable"
                        ? `❌ ${availabilityText.dateUnavailable}`
                        : `⚠️ ${availabilityText.availabilityNotSet}`}
          </p>
        </div>

        <input
          className="mb-3 w-full rounded-xl border border-zinc-700 bg-black p-3"
          placeholder={bookingText.eventVenue}
          value={bookingVenue}
          onChange={(e) => setBookingVenue(e.target.value)}
        />

        <input
          className="mb-3 w-full rounded-xl border border-zinc-700 bg-black p-3"
          placeholder={bookingText.estimatedBudget}
          value={bookingBudget}
          onChange={(e) => setBookingBudget(e.target.value)}
        />

        <textarea
          className="mb-3 w-full rounded-xl border border-zinc-700 bg-black p-3"
          placeholder={bookingText.tellDj}
          rows={4}
          value={bookingMessage}
          onChange={(e) => setBookingMessage(e.target.value)}
        />

        {bookingError && (
          <p className="mb-3 text-sm text-red-400">{bookingError}</p>
        )}

        {bookingSuccess && (
          <p className="mb-3 text-sm text-green-400">{bookingSuccess}</p>
        )}

        <button
          type="button"
          onClick={submitBookingRequest}
          disabled={
            bookingSending || bookingAvailabilityLoading || dateIsBlocked
          }
          className="w-full rounded-xl bg-purple-600 p-3 font-bold hover:bg-purple-700 disabled:opacity-50"
        >
          {bookingSending ? bookingText.sending : bookingText.sendRequest}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl bg-zinc-800 p-3 hover:bg-zinc-700"
        >
          {bookingText.close}
        </button>
      </div>
    </div>
  );
}
