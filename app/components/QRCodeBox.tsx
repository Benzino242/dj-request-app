"use client";

import { useState } from "react";
import QRCode from "react-qr-code";

type Props = {
  stageName: string;
  t: {
    yourDjQrCode: string;
    qrInstruction: string;
  };
};

export default function QRCodeBox({ stageName, t }: Props) {
  const [promoKitOpen, setPromoKitOpen] = useState(false);

  const cleanStageName = stageName.toLowerCase();
  const requestUrl = `https://dj-request-app-topaz.vercel.app/${cleanStageName}`;

  const promoKitUrl = (
    type:
      | "poster"
      | "table-tent"
      | "sticker"
      | "instagram-post"
      | "instagram-story"
      | "qr-png"
  ) =>
    `/api/promo-kit?stage=${encodeURIComponent(
      cleanStageName
    )}&type=${type}`;

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl text-center">
      <h2 className="text-3xl font-bold text-purple-500 mb-3">
        {t.yourDjQrCode}
      </h2>

      <p className="text-zinc-400 mb-6">{t.qrInstruction}</p>

      <div className="bg-white p-4 rounded-2xl inline-block">
        <QRCode value={requestUrl} size={220} />
      </div>

      <p className="mt-5 text-purple-400 break-all">{requestUrl}</p>

      <div className="mt-6 border-t border-zinc-800 pt-6">
        <button
          type="button"
          onClick={() => setPromoKitOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold text-white"
        >
          📥 Download Promo Kit
        </button>

        <p className="text-xs text-zinc-500 mt-3">
          Printable QR materials and social media assets.
        </p>
      </div>

      {promoKitOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 w-full max-w-md text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-2xl font-black text-white">
                  Download Promo Kit
                </h3>

                <p className="text-sm text-zinc-500 mt-1">
                  Choose a printable or digital format.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPromoKitOpen(false)}
                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-2 rounded-xl text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <a
                href={promoKitUrl("poster")}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-black/40 hover:bg-black border border-zinc-800 rounded-2xl p-4 transition"
              >
                <p className="text-white font-black">📄 A4 Poster</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Best for walls, DJ booths, entrances and venue posters.
                </p>
              </a>

              <a
                href={promoKitUrl("table-tent")}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-black/40 hover:bg-black border border-zinc-800 rounded-2xl p-4 transition"
              >
                <p className="text-white font-black">🎫 Table Tent</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Best for tables, VIP booths, bars and lounges.
                </p>
              </a>

              <a
                href={promoKitUrl("sticker")}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-black/40 hover:bg-black border border-zinc-800 rounded-2xl p-4 transition"
              >
                <p className="text-white font-black">💻 Laptop Sticker</p>
                <p className="text-sm text-zinc-500 mt-1">
                  120mm × 80mm landscape sticker for laptops and DJ gear.
                </p>
              </a>

              <a
                href={promoKitUrl("instagram-post")}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-black/40 hover:bg-black border border-zinc-800 rounded-2xl p-4 transition"
              >
                <p className="text-white font-black">🖼️ Instagram Post</p>
                <p className="text-sm text-zinc-500 mt-1">
                  1080 × 1080 square image for Instagram feed posts.
                </p>
              </a>

              <a
                href={promoKitUrl("instagram-story")}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-black/40 hover:bg-black border border-zinc-800 rounded-2xl p-4 transition"
              >
                <p className="text-white font-black">📱 Instagram Story</p>
                <p className="text-sm text-zinc-500 mt-1">
                  1080 × 1920 vertical story format.
                </p>
              </a>

              <a
                href={promoKitUrl("qr-png")}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-black/40 hover:bg-black border border-zinc-800 rounded-2xl p-4 transition"
              >
                <p className="text-white font-black">
                  🖨️ High Resolution QR PNG
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  Transparent PNG for flyers, banners and custom designs.
                </p>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}