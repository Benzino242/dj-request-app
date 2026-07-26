"use client";

import type { Language } from "../lib/translations";
import { bookingTranslations } from "../lib/bookingTranslations";

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
          className="mb-3 w-full rounded-xl border border-zinc-700 bg-black p-3"
          value={bookingDate}
          onChange={(e) => setBookingDate(e.target.value)}
        />

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
          disabled={bookingSending}
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
