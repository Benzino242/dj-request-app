"use client";

type BookingModalProps = {
  open: boolean;
  onClose: () => void;

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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-white mb-5">
          📅 Book This DJ
        </h2>

        <input
          className="w-full mb-3 p-3 rounded-xl bg-black border border-zinc-700"
          placeholder="Your name"
          value={bookingName}
          onChange={(e) => setBookingName(e.target.value)}
        />

        <input
          type="email"
          className="w-full mb-3 p-3 rounded-xl bg-black border border-zinc-700"
          placeholder="Your email"
          value={bookingEmail}
          onChange={(e) => setBookingEmail(e.target.value)}
        />

        <input
          type="tel"
          className="w-full mb-3 p-3 rounded-xl bg-black border border-zinc-700"
          placeholder="Your phone number"
          value={bookingPhone}
          onChange={(e) => setBookingPhone(e.target.value)}
        />

        <input
          className="w-full mb-3 p-3 rounded-xl bg-black border border-zinc-700"
          placeholder="Event type"
          value={bookingEventType}
          onChange={(e) => setBookingEventType(e.target.value)}
        />

        <label className="block text-sm text-zinc-400 mb-2" htmlFor="booking-date">
          Event date
        </label>
        <input
          id="booking-date"
          type="date"
          className="w-full mb-3 p-3 rounded-xl bg-black border border-zinc-700"
          value={bookingDate}
          onChange={(e) => setBookingDate(e.target.value)}
        />

        <input
          className="w-full mb-3 p-3 rounded-xl bg-black border border-zinc-700"
          placeholder="Event venue"
          value={bookingVenue}
          onChange={(e) => setBookingVenue(e.target.value)}
        />

        <input
          className="w-full mb-3 p-3 rounded-xl bg-black border border-zinc-700"
          placeholder="Estimated budget"
          value={bookingBudget}
          onChange={(e) => setBookingBudget(e.target.value)}
        />

        <textarea
          className="w-full mb-3 p-3 rounded-xl bg-black border border-zinc-700"
          placeholder="Tell the DJ about your event"
          rows={4}
          value={bookingMessage}
          onChange={(e) => setBookingMessage(e.target.value)}
        />

        {bookingError && (
          <p className="text-red-400 text-sm mb-3">{bookingError}</p>
        )}

        {bookingSuccess && (
          <p className="text-green-400 text-sm mb-3">{bookingSuccess}</p>
        )}

        <button
          type="button"
          onClick={submitBookingRequest}
          disabled={bookingSending}
          className="w-full bg-purple-600 hover:bg-purple-700 p-3 rounded-xl font-bold disabled:opacity-50"
        >
          {bookingSending ? "Sending..." : "Send Booking Request"}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 bg-zinc-800 hover:bg-zinc-700 p-3 rounded-xl"
        >
          Close
        </button>
      </div>
    </div>
  );
}
