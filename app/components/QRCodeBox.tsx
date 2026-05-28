"use client";

import QRCode from "react-qr-code";

type Props = {
  stageName: string;
  t: {
    yourDjQrCode: string;
    qrInstruction: string;
  };
};

export default function QRCodeBox({ stageName, t }: Props) {
  const requestUrl = `https://dj-request-app-topaz.vercel.app/${stageName.toLowerCase()}`;

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl text-center">
      <h2 className="text-3xl font-bold text-purple-500 mb-3">
  {t.yourDjQrCode}
</h2>

      <p className="text-zinc-400 mb-6">
      {t.qrInstruction}
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