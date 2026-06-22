import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as QRCode from "qrcode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PURPLE = rgb(0.65, 0.12, 1);
const GREEN = rgb(0.1, 0.9, 0.35);
const WHITE = rgb(1, 1, 1);
const BLACK = rgb(0, 0, 0);
const DARK = rgb(0.04, 0.04, 0.05);
const GRAY = rgb(0.55, 0.55, 0.6);

function getRequestUrl(stageName: string) {
  return `https://dj-request-app-topaz.vercel.app/${stageName
    .toLowerCase()
    .trim()}`;
}

async function getQrPngBytes(requestUrl: string) {
  const dataUrl = await QRCode.toDataURL(requestUrl, {
    width: 1400,
    margin: 2,
    errorCorrectionLevel: "H",
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  return Buffer.from(dataUrl.split(",")[1], "base64");
}

function drawCenteredText({
  page,
  text,
  y,
  size,
  font,
  color,
}: {
  page: any;
  text: string;
  y: number;
  size: number;
  font: any;
  color: any;
}) {
  const width = page.getWidth();
  const textWidth = font.widthOfTextAtSize(text, size);

  page.drawText(text, {
    x: (width - textWidth) / 2,
    y,
    size,
    font,
    color,
  });
}

async function buildPosterPdf(requestUrl: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
    color: BLACK,
  });

  drawCenteredText({
    page,
    text: "REQUEST A SONG",
    y: 700,
    size: 44,
    font: bold,
    color: WHITE,
  });

  drawCenteredText({
    page,
    text: "SCAN THE QR CODE",
    y: 650,
    size: 20,
    font: bold,
    color: PURPLE,
  });

  const qrBytes = await getQrPngBytes(requestUrl);
  const qrImage = await pdfDoc.embedPng(qrBytes);

  const qrSize = 350;
  page.drawRectangle({
    x: (595.28 - qrSize) / 2 - 18,
    y: 280 - 18,
    width: qrSize + 36,
    height: qrSize + 36,
    color: WHITE,
  });

  page.drawImage(qrImage, {
    x: (595.28 - qrSize) / 2,
    y: 280,
    width: qrSize,
    height: qrSize,
  });

  drawCenteredText({
    page,
    text: "Scan to request a song",
    y: 220,
    size: 24,
    font: bold,
    color: WHITE,
  });

  drawCenteredText({
    page,
    text: "Tip to move higher in the queue",
    y: 184,
    size: 19,
    font: regular,
    color: GREEN,
  });

  drawCenteredText({
    page,
    text: "No app required",
    y: 150,
    size: 18,
    font: regular,
    color: WHITE,
  });

  drawCenteredText({
    page,
    text: "Powered by Blackline",
    y: 60,
    size: 14,
    font: bold,
    color: PURPLE,
  });

  return pdfDoc.save();
}

async function buildStickerPdf(requestUrl: string) {
  const pdfDoc = await PDFDocument.create();

  // 120mm x 80mm in PDF points
  const page = pdfDoc.addPage([340.16, 226.77]);

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: 340.16,
    height: 226.77,
    color: BLACK,
  });

  page.drawRectangle({
    x: 10,
    y: 10,
    width: 320.16,
    height: 206.77,
    borderColor: PURPLE,
    borderWidth: 4,
  });

  page.drawText("REQUEST", {
    x: 28,
    y: 146,
    size: 31,
    font: bold,
    color: WHITE,
  });

  page.drawText("A SONG", {
    x: 28,
    y: 103,
    size: 40,
    font: bold,
    color: WHITE,
  });

  page.drawLine({
    start: { x: 28, y: 86 },
    end: { x: 145, y: 86 },
    thickness: 2,
    color: PURPLE,
  });

  page.drawText("Scan to request music", {
    x: 28,
    y: 58,
    size: 14,
    font: bold,
    color: WHITE,
  });

  page.drawText("Tip to move higher", {
    x: 28,
    y: 36,
    size: 13,
    font: bold,
    color: GREEN,
  });

  page.drawText("in the queue", {
    x: 28,
    y: 20,
    size: 13,
    font: bold,
    color: GREEN,
  });

  const qrBytes = await getQrPngBytes(requestUrl);
  const qrImage = await pdfDoc.embedPng(qrBytes);

  page.drawRectangle({
    x: 178,
    y: 67,
    width: 126,
    height: 126,
    color: WHITE,
  });

  page.drawImage(qrImage, {
    x: 185,
    y: 74,
    width: 112,
    height: 112,
  });

  page.drawRectangle({
    x: 178,
    y: 38,
    width: 126,
    height: 30,
    color: PURPLE,
  });

  page.drawText("SCAN HERE", {
    x: 197,
    y: 48,
    size: 16,
    font: bold,
    color: WHITE,
  });

  return pdfDoc.save();
}

async function buildTableTentPdf(requestUrl: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
    color: rgb(0.96, 0.96, 0.96),
  });

  const cardX = 110;
  const cardY = 70;
  const cardW = 375;
  const cardH = 700;

  page.drawRectangle({
    x: cardX,
    y: cardY,
    width: cardW,
    height: cardH,
    color: BLACK,
    borderColor: PURPLE,
    borderWidth: 4,
  });

  page.drawText("REQUEST", {
    x: cardX + 72,
    y: cardY + 560,
    size: 45,
    font: bold,
    color: WHITE,
  });

  page.drawText("A SONG", {
    x: cardX + 85,
    y: cardY + 505,
    size: 45,
    font: bold,
    color: WHITE,
  });

  page.drawRectangle({
    x: cardX + 98,
    y: cardY + 455,
    width: 180,
    height: 34,
    color: PURPLE,
  });

  page.drawText("SCAN HERE", {
    x: cardX + 130,
    y: cardY + 464,
    size: 18,
    font: bold,
    color: WHITE,
  });

  const qrBytes = await getQrPngBytes(requestUrl);
  const qrImage = await pdfDoc.embedPng(qrBytes);

  page.drawRectangle({
    x: cardX + 88,
    y: cardY + 235,
    width: 200,
    height: 200,
    color: WHITE,
  });

  page.drawImage(qrImage, {
    x: cardX + 98,
    y: cardY + 245,
    width: 180,
    height: 180,
  });

  page.drawText("Scan to request music", {
    x: cardX + 95,
    y: cardY + 185,
    size: 18,
    font: bold,
    color: WHITE,
  });

  page.drawText("Tip to move higher", {
    x: cardX + 105,
    y: cardY + 155,
    size: 17,
    font: bold,
    color: GREEN,
  });

  page.drawText("in the queue", {
    x: cardX + 135,
    y: cardY + 132,
    size: 17,
    font: bold,
    color: GREEN,
  });

  page.drawRectangle({
    x: cardX + 120,
    y: cardY + 87,
    width: 135,
    height: 30,
    color: PURPLE,
  });

  page.drawText("No app required", {
    x: cardX + 138,
    y: cardY + 96,
    size: 12,
    font: bold,
    color: WHITE,
  });

  page.drawText("Powered by Blackline", {
    x: cardX + 127,
    y: cardY + 35,
    size: 13,
    font: regular,
    color: GRAY,
  });

  return pdfDoc.save();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const stageName = searchParams.get("stage") || "";
  const type = searchParams.get("type") || "";

  if (!stageName.trim()) {
    return NextResponse.json(
      { error: "Missing DJ stage name" },
      { status: 400 }
    );
  }

  if (!["poster", "table-tent", "sticker"].includes(type)) {
    return NextResponse.json(
      { error: "Invalid promo kit type" },
      { status: 400 }
    );
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