import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import * as QRCode from "qrcode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BLACK = rgb(0, 0, 0);
const WHITE = rgb(1, 1, 1);
const PURPLE = rgb(0.65, 0.12, 1);
const GREEN = rgb(0.15, 0.9, 0.35);
const GRAY = rgb(0.45, 0.45, 0.5);
const LIGHT_GRAY = rgb(0.94, 0.94, 0.94);

function getRequestUrl(stageName: string) {
  return `https://dj-request-app-topaz.vercel.app/${stageName
    .toLowerCase()
    .trim()}`;
}

async function getQrPngBytes(requestUrl: string) {
  const dataUrl = await QRCode.toDataURL(requestUrl, {
    width: 1600,
    margin: 2,
    errorCorrectionLevel: "H",
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  return Buffer.from(dataUrl.split(",")[1], "base64");
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  y: number,
  size: number,
  font: PDFFont,
  color = WHITE,
  boxX = 0,
  boxWidth = page.getWidth()
) {
  const textWidth = font.widthOfTextAtSize(text, size);

  page.drawText(text, {
    x: boxX + (boxWidth - textWidth) / 2,
    y,
    size,
    font,
    color,
  });
}

function drawPill(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  color = PURPLE
) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
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

  drawCenteredText(page, "REQUEST A SONG", 700, 44, bold);
  drawCenteredText(page, "SCAN THE QR CODE", 650, 20, bold, PURPLE);

  const qrBytes = await getQrPngBytes(requestUrl);
  const qrImage = await pdfDoc.embedPng(qrBytes);

  const qrSize = 370;
  const qrX = (595.28 - qrSize) / 2;
  const qrY = 278;

  page.drawRectangle({
    x: qrX - 18,
    y: qrY - 18,
    width: qrSize + 36,
    height: qrSize + 36,
    color: WHITE,
  });

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  drawCenteredText(page, "Scan to request a song", 210, 25, bold);
  drawCenteredText(page, "Tip to move higher in the queue", 174, 19, regular, GREEN);
  drawCenteredText(page, "No app required", 142, 17, regular);
  drawCenteredText(page, "Powered by Blackline", 60, 13, bold, PURPLE);

  return pdfDoc.save();
}

async function buildStickerPdf(requestUrl: string) {
  const pdfDoc = await PDFDocument.create();

  // 120mm x 80mm landscape
  const pageW = 340.16;
  const pageH = 226.77;
  const page = pdfDoc.addPage([pageW, pageH]);

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageW,
    height: pageH,
    color: BLACK,
  });

  page.drawRectangle({
    x: 11,
    y: 11,
    width: pageW - 22,
    height: pageH - 22,
    borderColor: PURPLE,
    borderWidth: 4,
  });

  // Left headline
  page.drawText("REQUEST", {
    x: 34,
    y: 148,
    size: 31,
    font: bold,
    color: WHITE,
  });

  page.drawText("A SONG", {
    x: 34,
    y: 106,
    size: 39,
    font: bold,
    color: WHITE,
  });

  page.drawLine({
    start: { x: 34, y: 90 },
    end: { x: 160, y: 90 },
    thickness: 2.5,
    color: PURPLE,
  });

  // Left benefits
  page.drawCircle({
    x: 42,
    y: 67,
    size: 8,
    color: PURPLE,
  });

  page.drawText("Scan to request music", {
    x: 58,
    y: 62,
    size: 12.5,
    font: bold,
    color: WHITE,
  });

  page.drawCircle({
    x: 42,
    y: 43,
    size: 8,
    color: GREEN,
  });

  page.drawText("Tip to move higher", {
    x: 58,
    y: 43,
    size: 12,
    font: bold,
    color: GREEN,
  });

  page.drawText("in the queue", {
    x: 58,
    y: 28,
    size: 12,
    font: bold,
    color: GREEN,
  });

  drawPill(page, 34, 13, 90, 18, PURPLE);

  page.drawText("No app required", {
    x: 43,
    y: 18,
    size: 8.5,
    font: bold,
    color: WHITE,
  });

  // Right QR block
  const qrBytes = await getQrPngBytes(requestUrl);
  const qrImage = await pdfDoc.embedPng(qrBytes);

  const qrBoxX = 198;
  const qrBoxY = 65;
  const qrBoxW = 112;
  const qrBoxH = 122;

  page.drawRectangle({
    x: qrBoxX,
    y: qrBoxY,
    width: qrBoxW,
    height: qrBoxH,
    color: WHITE,
  });

  page.drawImage(qrImage, {
    x: qrBoxX + 8,
    y: qrBoxY + 18,
    width: 96,
    height: 96,
  });

  page.drawRectangle({
    x: qrBoxX,
    y: 36,
    width: qrBoxW,
    height: 29,
    color: PURPLE,
  });

  page.drawText("SCAN HERE", {
    x: qrBoxX + 14,
    y: 46,
    size: 15,
    font: bold,
    color: WHITE,
  });

  return pdfDoc.save();
}

async function buildTableTentPdf(requestUrl: string) {
  const pdfDoc = await PDFDocument.create();

  // A4 sheet with one large printable front panel.
  const pageW = 595.28;
  const pageH = 841.89;
  const page = pdfDoc.addPage([pageW, pageH]);

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageW,
    height: pageH,
    color: LIGHT_GRAY,
  });

  const cardW = 360;
  const cardH = 700;
  const cardX = (pageW - cardW) / 2;
  const cardY = 70;

  page.drawRectangle({
    x: cardX,
    y: cardY,
    width: cardW,
    height: cardH,
    color: BLACK,
    borderColor: PURPLE,
    borderWidth: 4,
  });

  // Decorative top
  page.drawLine({
    start: { x: cardX + 95, y: cardY + 650 },
    end: { x: cardX + 150, y: cardY + 650 },
    thickness: 2,
    color: PURPLE,
  });

  page.drawLine({
    start: { x: cardX + 210, y: cardY + 650 },
    end: { x: cardX + 265, y: cardY + 650 },
    thickness: 2,
    color: PURPLE,
  });

  page.drawText("HEADPHONES", {
    x: cardX + 132,
    y: cardY + 633,
    size: 10,
    font: bold,
    color: PURPLE,
  });

  drawCenteredText(page, "REQUEST", cardY + 560, 43, bold, WHITE, cardX, cardW);
  drawCenteredText(page, "A SONG", cardY + 508, 43, bold, WHITE, cardX, cardW);

  page.drawRectangle({
    x: cardX + 95,
    y: cardY + 455,
    width: 170,
    height: 34,
    color: PURPLE,
  });

  drawCenteredText(page, "SCAN HERE", cardY + 464, 18, bold, WHITE, cardX + 95, 170);

  const qrBytes = await getQrPngBytes(requestUrl);
  const qrImage = await pdfDoc.embedPng(qrBytes);

  const qrBoxSize = 215;
  const qrBoxX = cardX + (cardW - qrBoxSize) / 2;
  const qrBoxY = cardY + 230;

  page.drawRectangle({
    x: qrBoxX,
    y: qrBoxY,
    width: qrBoxSize,
    height: qrBoxSize,
    color: WHITE,
  });

  page.drawImage(qrImage, {
    x: qrBoxX + 13,
    y: qrBoxY + 13,
    width: qrBoxSize - 26,
    height: qrBoxSize - 26,
  });

  page.drawCircle({
    x: cardX + 100,
    y: cardY + 188,
    size: 8,
    color: PURPLE,
  });

  page.drawText("Scan to request music", {
    x: cardX + 116,
    y: cardY + 183,
    size: 16,
    font: bold,
    color: WHITE,
  });

  page.drawCircle({
    x: cardX + 100,
    y: cardY + 158,
    size: 8,
    color: GREEN,
  });

  page.drawText("Tip to move higher", {
    x: cardX + 116,
    y: cardY + 160,
    size: 15,
    font: bold,
    color: GREEN,
  });

  page.drawText("in the queue", {
    x: cardX + 116,
    y: cardY + 142,
    size: 15,
    font: bold,
    color: GREEN,
  });

  page.drawLine({
    start: { x: cardX + 100, y: cardY + 125 },
    end: { x: cardX + 260, y: cardY + 125 },
    thickness: 2,
    color: PURPLE,
  });

  page.drawRectangle({
    x: cardX + 115,
    y: cardY + 82,
    width: 130,
    height: 28,
    color: PURPLE,
  });

  drawCenteredText(page, "No app required", cardY + 91, 11, bold, WHITE, cardX + 115, 130);

  drawCenteredText(page, "Powered by Blackline", cardY + 38, 11, regular, GRAY, cardX, cardW);

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