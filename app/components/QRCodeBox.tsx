"use client";

import QRCode from "react-qr-code";

type Props = {
  stageName: string;
};

export default function QRCodeBox({ stageName }: Props) {
  const requestUrl = `https://dj-request-app-topaz.vercel.app/${stageName.toLowerCase()}`;

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl text-center">
      <h2 className="text-3xl font-bold text-purple-500 mb-3">
        Your DJ QR Code
      </h2>

      <p className="text-zinc-400 mb-6">
        Guests can scan this to request songs
      </p>

      <div className="bg-white p-4 rounded-2xl inline-block">
        <QRCode value={requestUrl} size={220} />
      </div>

      <p className="mt-5 text-purple-400 break-all">
        {requestUrl}
      </p>
    </div>
  );
}