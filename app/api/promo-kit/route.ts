import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PromoKitType = "poster" | "table-tent" | "sticker";

const BRAND_PURPLE = rgb(0.55, 0.25, 0.95);
const BLACK = rgb(0, 0, 0);
const WHITE = rgb(1, 1, 1);
const ZINC = rgb(0.18, 0.18, 0.2);
const GREEN = rgb(0.05, 0.72, 0.34);

function sanitizeStageName(stageName: string) {
  return stageName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
}

function getRequestUrl(stageName: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://dj-request-app-topaz.vercel.app";

  return `${baseUrl.replace(/\/$/, "")}/${stageName}`;
}

function drawCenteredText({
  page,
  text,
  y,
  size,
  font,
  color = BLACK,
}: {
  page: any;
  text: string;
  y: number;
  size: number;
  font: any;
  color?: ReturnType<typeof rgb>;
}) {
  const pageWidth = page.getWidth();
  const textWidth = font.widthOfTextAtSize(text, size);

  page.drawText(text, {
    x: (pageWidth - textWidth) / 2,
    y,
    size,
    font,
    color,
  });
}

function drawRoundedPanel(page: any, x: number, y: number, width: number, height: number) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: WHITE,
    borderColor: BRAND_PURPLE,
    borderWidth: 3,
  });
}

async function createQrImage(pdfDoc: PDFDocument, requestUrl: string) {
  const qrDataUrl = await QRCode.toDataURL(requestUrl, {
    errorCorrectionLevel: "H",
    margin: 2,
    scale: 12,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  const qrBase64 = qrDataUrl.split(",")[1];
  const qrBytes = Buffer.from(qrBase64, "base64");

  return pdfDoc.embedPng(qrBytes);
}

async function buildPosterPdf(requestUrl: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const qrImage = await createQrImage(pdfDoc, requestUrl);

  page.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: BLACK });

  drawCenteredText({
    page,
    text: "REQUEST A SONG",
    y: 715,
    size: 48,
    font: boldFont,
    color: WHITE,
  });

  drawCenteredText({
    page,
    text: "SCAN THE QR CODE",
    y: 665,
    size: 22,
    font: boldFont,
    color: BRAND_PURPLE,
  });

  const qrSize = 310;
  const qrX = (595.28 - qrSize) / 2;
  page.drawRectangle({
    x: qrX - 18,
    y: 315 - 18,
    width: qrSize + 36,
    height: qrSize + 36,
    color: WHITE,
  });
  page.drawImage(qrImage, { x: qrX, y: 315, width: qrSize, height: qrSize });

  drawCenteredText({
    page,
    text: "Scan to request music instantly",
    y: 255,
    size: 24,
    font: boldFont,
    color: WHITE,
  });

  drawCenteredText({
    page,
    text: "Tip to move higher in the queue",
    y: 215,
    size: 20,
    font,
    color: GREEN,
  });

  drawCenteredText({
    page,
    text: "No app required",
    y: 180,
    size: 18,
    font,
    color: WHITE,
  });

  drawCenteredText({
    page,
    text: requestUrl,
    y: 115,
    size: 12,
    font,
    color: rgb(0.7, 0.7, 0.75),
  });

  drawCenteredText({
    page,
    text: "Powered by Blackline",
    y: 55,
    size: 16,
    font: boldFont,
    color: BRAND_PURPLE,
  });

  return pdfDoc.save();
}

async function buildTableTentPdf(requestUrl: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([841.89, 595.28]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const qrImage = await createQrImage(pdfDoc, requestUrl);

  page.drawRectangle({ x: 0, y: 0, width: 841.89, height: 595.28, color: BLACK });

  const panelWidth = 380;
  const panelHeight = 470;
  const panelY = 65;
  const leftX = 35;
  const rightX = 426;

  [leftX, rightX].forEach((panelX) => {
    drawRoundedPanel(page, panelX, panelY, panelWidth, panelHeight);

    const centerX = panelX + panelWidth / 2;

    page.drawText("REQUEST A SONG", {
      x: centerX - boldFont.widthOfTextAtSize("REQUEST A SONG", 28) / 2,
      y: panelY + 390,
      size: 28,
      font: boldFont,
      color: BLACK,
    });

    page.drawText("SCAN HERE", {
      x: centerX - boldFont.widthOfTextAtSize("SCAN HERE", 16) / 2,
      y: panelY + 355,
      size: 16,
      font: boldFont,
      color: BRAND_PURPLE,
    });

    const qrSize = 210;
    page.drawImage(qrImage, {
      x: centerX - qrSize / 2,
      y: panelY + 130,
      width: qrSize,
      height: qrSize,
    });

    page.drawText("Higher tips move you up the queue", {
      x: centerX - font.widthOfTextAtSize("Higher tips move you up the queue", 15) / 2,
      y: panelY + 85,
      size: 15,
      font,
      color: GREEN,
    });

    page.drawText("No app required", {
      x: centerX - font.widthOfTextAtSize("No app required", 14) / 2,
      y: panelY + 55,
      size: 14,
      font,
      color: ZINC,
    });

    page.drawText("Powered by Blackline", {
      x: centerX - boldFont.widthOfTextAtSize("Powered by Blackline", 13) / 2,
      y: panelY + 25,
      size: 13,
      font: boldFont,
      color: BRAND_PURPLE,
    });
  });

  page.drawText("Cut along the middle line. Fold each card into a table tent.", {
    x: 270,
    y: 25,
    size: 12,
    font,
    color: rgb(0.75, 0.75, 0.78),
  });

  page.drawLine({
    start: { x: 420.95, y: 50 },
    end: { x: 420.95, y: 545 },
    thickness: 1,
    color: rgb(0.55, 0.55, 0.58),
  });

  return pdfDoc.save();
}

async function buildStickerPdf(requestUrl: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([340.16, 226.77]); // 120mm x 80mm
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const qrImage = await createQrImage(pdfDoc, requestUrl);

  page.drawRectangle({ x: 0, y: 0, width: 340.16, height: 226.77, color: BLACK });
  page.drawRectangle({
    x: 8,
    y: 8,
    width: 324.16,
    height: 210.77,
    borderColor: BRAND_PURPLE,
    borderWidth: 3,
    color: BLACK,
  });

  page.drawText("REQUEST A SONG", {
    x: 22,
    y: 166,
    size: 24,
    font: boldFont,
    color: WHITE,
  });

  page.drawText("SCAN HERE", {
    x: 22,
    y: 132,
    size: 16,
    font: boldFont,
    color: BRAND_PURPLE,
  });

  page.drawText("Tip to move higher", {
    x: 22,
    y: 92,
    size: 13,
    font,
    color: GREEN,
  });

  page.drawText("in the queue", {
    x: 22,
    y: 72,
    size: 13,
    font,
    color: GREEN,
  });

  page.drawText("No app required", {
    x: 22,
    y: 40,
    size: 11,
    font,
    color: rgb(0.75, 0.75, 0.78),
  });

  const qrSize = 150;
  page.drawRectangle({ x: 174, y: 38, width: qrSize + 18, height: qrSize + 18, color: WHITE });
  page.drawImage(qrImage, { x: 183, y: 47, width: qrSize, height: qrSize });

  return pdfDoc.save();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawStage = searchParams.get("stage") || "";
  const type = searchParams.get("type") as PromoKitType | null;

  const stageName = sanitizeStageName(rawStage);

  if (!stageName) {
    return NextResponse.json({ error: "Missing stage name" }, { status: 400 });
  }

  if (!type || !["poster", "table-tent", "sticker"].includes(type)) {
    return NextResponse.json({ error: "Invalid promo kit type" }, { status: 400 });
  }

  const requestUrl = getRequestUrl(stageName);

  let pdfBytes: Uint8Array;
  let filename: string;

  if (type === "poster") {
    pdfBytes = await buildPosterPdf(requestUrl);
    filename = `${stageName}-blackline-a4-poster.pdf`;
  } else if (type === "table-tent") {
    pdfBytes = await buildTableTentPdf(requestUrl);
    filename = `${stageName}-blackline-table-tent.pdf`;
  } else {
    pdfBytes = await buildStickerPdf(requestUrl);
    filename = `${stageName}-blackline-laptop-sticker.pdf`;
  }

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
