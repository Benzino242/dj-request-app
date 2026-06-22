import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import * as QRCode from "qrcode";
import { Resvg } from "@resvg/resvg-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BLACK = rgb(0, 0, 0);
const WHITE = rgb(1, 1, 1);
const PURPLE = rgb(0.55, 0.12, 0.95);
const GREEN = rgb(0.18, 0.95, 0.35);
const GRAY = rgb(0.42, 0.42, 0.48);
const LIGHT_GRAY = rgb(0.94, 0.94, 0.94);

const PURPLE_HEX = "#8c1ef2";
const GREEN_HEX = "#2ef25c";
const GRAY_HEX = "#777780";

type PromoKitType =
  | "poster"
  | "table-tent"
  | "sticker"
  | "qr-png"
  | "instagram-story"
  | "instagram-post";

function getRequestUrl(stageName: string) {
  return `https://dj-request-app-topaz.vercel.app/${stageName
    .toLowerCase()
    .trim()}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function getQrPngBytes(requestUrl: string, width = 1600) {
  const dataUrl = await QRCode.toDataURL(requestUrl, {
    width,
    margin: 1,
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

function drawRoundedFill(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: any
) {
  page.drawRectangle({
    x: x + radius,
    y,
    width: width - radius * 2,
    height,
    color,
  });

  page.drawRectangle({
    x,
    y: y + radius,
    width,
    height: height - radius * 2,
    color,
  });

  page.drawCircle({ x: x + radius, y: y + radius, size: radius, color });
  page.drawCircle({ x: x + width - radius, y: y + radius, size: radius, color });
  page.drawCircle({ x: x + radius, y: y + height - radius, size: radius, color });
  page.drawCircle({
    x: x + width - radius,
    y: y + height - radius,
    size: radius,
    color,
  });
}

function drawRoundedBorder(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  borderWidth: number,
  borderColor: any,
  fillColor: any
) {
  drawRoundedFill(page, x, y, width, height, radius, borderColor);
  drawRoundedFill(
    page,
    x + borderWidth,
    y + borderWidth,
    width - borderWidth * 2,
    height - borderWidth * 2,
    radius - borderWidth,
    fillColor
  );
}

function drawHeadphonesIcon(page: PDFPage, x: number, y: number, scale = 1) {
  const s = scale;

  page.drawCircle({
    x: x + 22 * s,
    y: y + 22 * s,
    size: 20 * s,
    borderColor: PURPLE,
    borderWidth: 4 * s,
  });

  page.drawRectangle({
    x: x + 1 * s,
    y: y + 6 * s,
    width: 9 * s,
    height: 20 * s,
    color: PURPLE,
  });

  page.drawRectangle({
    x: x + 34 * s,
    y: y + 6 * s,
    width: 9 * s,
    height: 20 * s,
    color: PURPLE,
  });

  page.drawLine({
    start: { x: x + 17 * s, y: y + 8 * s },
    end: { x: x + 17 * s, y: y + 20 * s },
    thickness: 2 * s,
    color: PURPLE,
  });

  page.drawLine({
    start: { x: x + 22 * s, y: y + 5 * s },
    end: { x: x + 22 * s, y: y + 23 * s },
    thickness: 2 * s,
    color: PURPLE,
  });

  page.drawLine({
    start: { x: x + 27 * s, y: y + 8 * s },
    end: { x: x + 27 * s, y: y + 20 * s },
    thickness: 2 * s,
    color: PURPLE,
  });
}

function drawMusicIcon(page: PDFPage, x: number, y: number, size = 10) {
  page.drawCircle({ x, y, size, color: PURPLE });
  page.drawCircle({ x: x - 3, y: y - 4, size: 2.5, color: BLACK });

  page.drawLine({
    start: { x: x - 1, y: y - 4 },
    end: { x: x - 1, y: y + 6 },
    thickness: 2,
    color: BLACK,
  });

  page.drawLine({
    start: { x: x - 1, y: y + 6 },
    end: { x: x + 6, y: y + 8 },
    thickness: 2,
    color: BLACK,
  });
}

function drawArrowIcon(page: PDFPage, x: number, y: number, size = 10) {
  page.drawCircle({ x, y, size, color: GREEN });

  page.drawLine({
    start: { x, y: y - 5 },
    end: { x, y: y + 5 },
    thickness: 3,
    color: BLACK,
  });

  page.drawLine({
    start: { x: x - 4, y: y + 1 },
    end: { x, y: y + 6 },
    thickness: 3,
    color: BLACK,
  });

  page.drawLine({
    start: { x: x + 4, y: y + 1 },
    end: { x, y: y + 6 },
    thickness: 3,
    color: BLACK,
  });
}

function drawPhoneIcon(page: PDFPage, x: number, y: number, scale = 1) {
  const s = scale;

  page.drawRectangle({
    x,
    y,
    width: 10 * s,
    height: 20 * s,
    borderColor: WHITE,
    borderWidth: 1.5 * s,
  });

  page.drawCircle({
    x: x + 5 * s,
    y: y + 2.5 * s,
    size: 1.2 * s,
    color: WHITE,
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

  drawCenteredText(page, "Request your favorite song", 210, 23, bold);
  drawCenteredText(page, "Tip to move higher in the queue", 174, 19, regular, GREEN);
  drawCenteredText(page, "No app required", 142, 17, regular);
  drawCenteredText(page, "Powered by Blackline", 60, 13, bold, PURPLE);

  return pdfDoc.save();
}

async function buildStickerPdf(requestUrl: string) {
  const pdfDoc = await PDFDocument.create();

  const pageW = 340.16;
  const pageH = 226.77;
  const page = pdfDoc.addPage([pageW, pageH]);

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: BLACK });

  drawRoundedBorder(page, 9, 10, pageW - 18, pageH - 20, 20, 3.5, PURPLE, BLACK);

  drawHeadphonesIcon(page, 40, 160, 0.65);

  page.drawText("REQUEST", {
    x: 73,
    y: 165,
    size: 28,
    font: bold,
    color: WHITE,
  });

  page.drawText("A SONG", {
    x: 36,
    y: 116,
    size: 42,
    font: bold,
    color: WHITE,
  });

  page.drawLine({
    start: { x: 34, y: 100 },
    end: { x: 99, y: 100 },
    thickness: 2,
    color: PURPLE,
  });

  page.drawLine({
    start: { x: 111, y: 100 },
    end: { x: 162, y: 100 },
    thickness: 2,
    color: PURPLE,
  });

  page.drawLine({
    start: { x: 99, y: 100 },
    end: { x: 105, y: 94 },
    thickness: 2,
    color: PURPLE,
  });

  page.drawLine({
    start: { x: 105, y: 94 },
    end: { x: 111, y: 100 },
    thickness: 2,
    color: PURPLE,
  });

  drawMusicIcon(page, 46, 76, 10);

  page.drawText("Request your favorite song", {
    x: 56,
    y: 68,
    size: 10.5,
    font: bold,
    color: WHITE,
  });

  drawArrowIcon(page, 46, 49, 10);

  page.drawText("Tip to move higher", {
    x: 63,
    y: 47,
    size: 12.5,
    font: bold,
    color: GREEN,
  });

  page.drawText("in the queue", {
    x: 63,
    y: 32,
    size: 12.5,
    font: bold,
    color: GREEN,
  });

  drawRoundedFill(page, 35, 6, 88, 16, 4, PURPLE);

  page.drawText("No app required", {
    x: 43,
    y: 11,
    size: 8,
    font: bold,
    color: WHITE,
  });

  const qrBytes = await getQrPngBytes(requestUrl);
  const qrImage = await pdfDoc.embedPng(qrBytes);

  const qrCardX = 223;
  const qrCardY = 38;
  const qrCardW = 98;
  const qrCardH = 138;

  drawRoundedFill(page, qrCardX, qrCardY, qrCardW, qrCardH, 8, WHITE);

  page.drawImage(qrImage, {
    x: qrCardX + 4,
    y: qrCardY + 56,
    width: 90,
    height: 78,
  });

  drawRoundedFill(page, qrCardX, qrCardY, qrCardW, 46, 8, PURPLE);

  drawPhoneIcon(page, qrCardX + 12, qrCardY + 13, 0.75);

  page.drawText("SCAN HERE", {
    x: qrCardX + 28,
    y: qrCardY + 19,
    size: 11,
    font: bold,
    color: WHITE,
  });

  return pdfDoc.save();
}

async function buildTableTentPdf(requestUrl: string) {
  const pdfDoc = await PDFDocument.create();

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
  const cardY = 72;

  page.drawRectangle({
    x: cardX,
    y: cardY,
    width: cardW,
    height: cardH,
    color: BLACK,
  });

  page.drawRectangle({
    x: cardX + 12,
    y: cardY + 12,
    width: cardW - 24,
    height: cardH - 24,
    borderColor: PURPLE,
    borderWidth: 2,
  });

  drawHeadphonesIcon(page, cardX + 164, cardY + 613, 0.75);

  page.drawLine({
    start: { x: cardX + 93, y: cardY + 640 },
    end: { x: cardX + 145, y: cardY + 640 },
    thickness: 2,
    color: PURPLE,
  });

  page.drawLine({
    start: { x: cardX + 214, y: cardY + 640 },
    end: { x: cardX + 267, y: cardY + 640 },
    thickness: 2,
    color: PURPLE,
  });

  drawCenteredText(page, "REQUEST", cardY + 555, 45, bold, WHITE, cardX, cardW);
  drawCenteredText(page, "A SONG", cardY + 503, 45, bold, WHITE, cardX, cardW);

  page.drawRectangle({
    x: cardX + 104,
    y: cardY + 470,
    width: 152,
    height: 33,
    color: PURPLE,
  });

  page.drawText("SCAN HERE", {
    x: cardX + 127,
    y: cardY + 478,
    size: 19,
    font: bold,
    color: WHITE,
  });

  const qrBytes = await getQrPngBytes(requestUrl);
  const qrImage = await pdfDoc.embedPng(qrBytes);

  const qrBoxSize = 190;
  const qrBoxX = cardX + (cardW - qrBoxSize) / 2;
  const qrBoxY = cardY + 245;

  drawRoundedFill(page, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 7, WHITE);

  page.drawImage(qrImage, {
    x: qrBoxX + 11,
    y: qrBoxY + 11,
    width: qrBoxSize - 22,
    height: qrBoxSize - 22,
  });

  drawMusicIcon(page, cardX + 110, cardY + 220, 9);

  page.drawText("Request your favorite song", {
    x: cardX + 126,
    y: cardY + 214,
    size: 12,
    font: bold,
    color: WHITE,
  });

  drawArrowIcon(page, cardX + 110, cardY + 192, 9);

  page.drawText("Tip to move higher", {
    x: cardX + 126,
    y: cardY + 191,
    size: 14,
    font: bold,
    color: GREEN,
  });

  page.drawText("in the queue", {
    x: cardX + 126,
    y: cardY + 173,
    size: 14,
    font: bold,
    color: GREEN,
  });

  page.drawLine({
    start: { x: cardX + 105, y: cardY + 154 },
    end: { x: cardX + 168, y: cardY + 154 },
    thickness: 2,
    color: PURPLE,
  });

  page.drawLine({
    start: { x: cardX + 180, y: cardY + 154 },
    end: { x: cardX + 255, y: cardY + 154 },
    thickness: 2,
    color: PURPLE,
  });

  page.drawLine({
    start: { x: cardX + 168, y: cardY + 154 },
    end: { x: cardX + 174, y: cardY + 148 },
    thickness: 2,
    color: PURPLE,
  });

  page.drawLine({
    start: { x: cardX + 174, y: cardY + 148 },
    end: { x: cardX + 180, y: cardY + 154 },
    thickness: 2,
    color: PURPLE,
  });

  drawRoundedFill(page, cardX + 128, cardY + 116, 104, 24, 5, PURPLE);

  drawCenteredText(page, "No app required", cardY + 124, 10, bold, WHITE, cardX + 128, 104);

  drawHeadphonesIcon(page, cardX + 112, cardY + 78, 0.32);

  page.drawText("Powered by Blackline", {
    x: cardX + 132,
    y: cardY + 85,
    size: 8,
    font: regular,
    color: GRAY,
  });

  return pdfDoc.save();
}

function buildInstagramStorySvg(requestUrl: string) {
  const safeUrl = escapeXml(requestUrl);

  return `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1920" fill="#000000"/>
  <rect x="60" y="80" width="960" height="1760" rx="70" fill="none" stroke="${PURPLE_HEX}" stroke-width="10"/>

  <g transform="translate(470 175)">
    <circle cx="70" cy="70" r="55" fill="none" stroke="${PURPLE_HEX}" stroke-width="14"/>
    <rect x="18" y="70" width="24" height="70" fill="${PURPLE_HEX}"/>
    <rect x="98" y="70" width="24" height="70" fill="${PURPLE_HEX}"/>
    <line x1="55" y1="78" x2="55" y2="122" stroke="${PURPLE_HEX}" stroke-width="10"/>
    <line x1="70" y1="72" x2="70" y2="128" stroke="${PURPLE_HEX}" stroke-width="10"/>
    <line x1="85" y1="78" x2="85" y2="122" stroke="${PURPLE_HEX}" stroke-width="10"/>
  </g>

  <text x="540" y="520" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="132" font-weight="900" fill="#ffffff">REQUEST</text>
  <text x="540" y="675" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="132" font-weight="900" fill="#ffffff">A SONG</text>

  <rect x="195" y="790" width="690" height="105" rx="24" fill="${PURPLE_HEX}"/>
  <text x="540" y="860" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="900" fill="#ffffff">TAP LINK TO REQUEST</text>

  <text x="540" y="990" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="${GRAY_HEX}">Add this as your Instagram link sticker</text>

  <rect x="125" y="1065" width="830" height="118" rx="30" fill="#ffffff"/>
  <text x="540" y="1138" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="900" fill="#000000">${safeUrl}</text>

  <circle cx="225" cy="1348" r="38" fill="${PURPLE_HEX}"/>
  <path d="M220 1370 C205 1370 200 1358 207 1348 C212 1341 222 1340 229 1345 L229 1317 L258 1308 L258 1320 L239 1325 L239 1358 C238 1366 231 1370 220 1370 Z" fill="#000000"/>
  <text x="290" y="1362" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="900" fill="#ffffff">Request your favorite song</text>

  <circle cx="225" cy="1465" r="38" fill="${GREEN_HEX}"/>
  <path d="M225 1432 L260 1470 H240 V1505 H210 V1470 H190 Z" fill="#000000"/>
  <text x="290" y="1467" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="900" fill="${GREEN_HEX}">Tip to move higher</text>
  <text x="290" y="1525" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="900" fill="${GREEN_HEX}">in the queue</text>

  <rect x="325" y="1625" width="430" height="82" rx="22" fill="${PURPLE_HEX}"/>
  <text x="540" y="1678" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="900" fill="#ffffff">No app required</text>

  <text x="540" y="1785" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="${GRAY_HEX}">Powered by Blackline</text>
</svg>`;
}

function buildInstagramPostSvg(requestUrl: string) {
  const safeUrl = escapeXml(requestUrl);

  return `
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1080" fill="#000000"/>
  <rect x="45" y="45" width="990" height="990" rx="60" fill="none" stroke="${PURPLE_HEX}" stroke-width="10"/>

  <g transform="translate(105 145)">
    <circle cx="60" cy="60" r="48" fill="none" stroke="${PURPLE_HEX}" stroke-width="12"/>
    <rect x="14" y="60" width="22" height="62" fill="${PURPLE_HEX}"/>
    <rect x="84" y="60" width="22" height="62" fill="${PURPLE_HEX}"/>
    <line x1="48" y1="68" x2="48" y2="108" stroke="${PURPLE_HEX}" stroke-width="8"/>
    <line x1="60" y1="62" x2="60" y2="114" stroke="${PURPLE_HEX}" stroke-width="8"/>
    <line x1="72" y1="68" x2="72" y2="108" stroke="${PURPLE_HEX}" stroke-width="8"/>
  </g>

  <text x="285" y="250" font-family="Arial, Helvetica, sans-serif" font-size="95" font-weight="900" fill="#ffffff">REQUEST</text>
  <text x="140" y="400" font-family="Arial, Helvetica, sans-serif" font-size="120" font-weight="900" fill="#ffffff">A SONG</text>

  <line x1="140" y1="465" x2="800" y2="465" stroke="${PURPLE_HEX}" stroke-width="9"/>

  <rect x="205" y="525" width="670" height="90" rx="22" fill="${PURPLE_HEX}"/>
  <text x="540" y="585" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="900" fill="#ffffff">TAP LINK TO REQUEST</text>

  <rect x="140" y="645" width="800" height="85" rx="20" fill="#ffffff"/>
  <text x="540" y="698" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="900" fill="#000000">${safeUrl}</text>

  <circle cx="150" cy="815" r="32" fill="${PURPLE_HEX}"/>
  <path d="M146 835 C134 835 130 825 135 817 C140 811 148 810 154 814 L154 792 L178 785 L178 795 L162 799 L162 826 C161 832 155 835 146 835 Z" fill="#000000"/>
  <text x="210" y="829" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="900" fill="#ffffff">Request your favorite song</text>

  <circle cx="150" cy="900" r="32" fill="${GREEN_HEX}"/>
  <path d="M150 872 L180 904 H163 V934 H137 V904 H120 Z" fill="#000000"/>
  <text x="210" y="913" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="900" fill="${GREEN_HEX}">Tip to move higher in the queue</text>

  <rect x="345" y="960" width="390" height="62" rx="18" fill="${PURPLE_HEX}"/>
  <text x="540" y="1002" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="900" fill="#ffffff">No app required</text>
</svg>`;
}

async function buildInstagramStoryPng(requestUrl: string) {
  const svg = buildInstagramStorySvg(requestUrl);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 1080,
    },
    font: {
      loadSystemFonts: true,
    },
  });

  return resvg.render().asPng();
}

async function buildInstagramPostPng(requestUrl: string) {
  const svg = buildInstagramPostSvg(requestUrl);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 1080,
    },
    font: {
      loadSystemFonts: true,
    },
  });

  return resvg.render().asPng();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stageName = searchParams.get("stage") || "";
    const type = searchParams.get("type") || "";

    if (!stageName.trim()) {
      return NextResponse.json({ error: "Missing DJ stage name" }, { status: 400 });
    }

    const validTypes: PromoKitType[] = [
      "poster",
      "table-tent",
      "sticker",
      "qr-png",
      "instagram-story",
      "instagram-post",
    ];

    if (!validTypes.includes(type as PromoKitType)) {
      return NextResponse.json({ error: "Invalid promo kit type" }, { status: 400 });
    }

    const requestUrl = getRequestUrl(stageName);

    if (type === "qr-png") {
      const qrBytes = await getQrPngBytes(requestUrl, 2400);

      return new NextResponse(qrBytes, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${stageName}-blackline-qr-code.png"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (type === "instagram-story") {
      const pngBytes = await buildInstagramStoryPng(requestUrl);

      return new NextResponse(Buffer.from(pngBytes), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${stageName}-blackline-instagram-story.png"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (type === "instagram-post") {
      const pngBytes = await buildInstagramPostPng(requestUrl);

      return new NextResponse(Buffer.from(pngBytes), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${stageName}-blackline-instagram-post.png"`,
          "Cache-Control": "no-store",
        },
      });
    }

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
  } catch (error) {
    console.error("PROMO KIT PDF ERROR:", error);

    return NextResponse.json(
      { error: "Failed to generate promo kit" },
      { status: 500 }
    );
  }
}
