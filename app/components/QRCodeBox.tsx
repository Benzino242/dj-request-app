"use client";

import QRCode from "react-qr-code";

export default function QRCodeBox() {
    const requestUrl =
    "https://dj-request-app-topaz.vercel.app/djbenzino99";
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-center">
      <h2 className="text-2xl font-bold mb-4">
        Scan to Request Songs
      </h2>

      <div className="bg-white p-4 rounded-xl inline-block">
        <QRCode value={requestUrl} size={220} />
      </div>

      <p className="text-zinc-400 mt-4 text-sm break-all">
        {requestUrl}
      </p>
    </div>
  );
}