import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://blacklinedj.com";
const siteTitle = "Blackline DJ | Paid Song Requests for DJs";
const siteDescription =
  "Blackline lets DJs receive paid song requests and boosts through QR codes, a live request queue, and a premium DJ dashboard.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Blackline DJ",
  title: {
    default: siteTitle,
    template: "%s | Blackline DJ",
  },
  description: siteDescription,
  keywords: [
    "Blackline DJ",
    "DJ song requests",
    "paid song requests",
    "DJ request app",
    "QR code song requests",
    "DJ dashboard",
    "nightlife DJ app",
    "club song requests",
  ],
  authors: [{ name: "Blackline DJ" }],
  creator: "Blackline DJ",
  publisher: "Blackline DJ",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "Blackline DJ",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/images/blackline-demo-thumbnail.png",
        width: 720,
        height: 1280,
        alt: "Blackline DJ demo video preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/images/blackline-demo-thumbnail.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
