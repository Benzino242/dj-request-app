import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import * as QRCode from "qrcode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BLACK = rgb(0, 0, 0);
const WHITE = rgb(1, 1, 1);
const PURPLE = rgb(0.55, 0.12, 0.95);
const GREEN = rgb(0.18, 0.95, 0.35);
const GRAY = rgb(0.42, 0.42, 0.48);
const LIGHT_GRAY = rgb(0.94, 0.94, 0.94);

type PromoPdfLanguage =
  | "en"
  | "id"
  | "ms"
  | "tl"
  | "pt"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "nl";

type PromoPdfText = {
  requestASong: string;
  scanQrCode: string;
  scanHere: string;
  requestFavoriteSong: string;
  tipMoveHigher: string;
  inTheQueue: string;
  tipMoveHigherFull: string;
  noAppRequired: string;
  poweredByBlackline: string;
};

const promoPdfTranslations: Record<PromoPdfLanguage, PromoPdfText> = {
  en: {
    requestASong: "REQUEST A SONG",
    scanQrCode: "SCAN THE QR CODE",
    scanHere: "SCAN HERE",
    requestFavoriteSong: "Request your favorite song",
    tipMoveHigher: "Tip to move higher",
    inTheQueue: "in the queue",
    tipMoveHigherFull: "Tip to move higher in the queue",
    noAppRequired: "No app required",
    poweredByBlackline: "Powered by Blackline",
  },
  id: {
    requestASong: "MINTA LAGU",
    scanQrCode: "PINDAI KODE QR",
    scanHere: "PINDAI DI SINI",
    requestFavoriteSong: "Minta lagu favorit Anda",
    tipMoveHigher: "Tip agar naik",
    inTheQueue: "di antrean",
    tipMoveHigherFull: "Tip agar naik di antrean",
    noAppRequired: "Tanpa aplikasi",
    poweredByBlackline: "Didukung oleh Blackline",
  },
  ms: {
    requestASong: "MINTA LAGU",
    scanQrCode: "IMBAS KOD QR",
    scanHere: "IMBAS DI SINI",
    requestFavoriteSong: "Minta lagu kegemaran anda",
    tipMoveHigher: "Tip untuk naik",
    inTheQueue: "dalam barisan",
    tipMoveHigherFull: "Tip untuk naik dalam barisan",
    noAppRequired: "Tiada app diperlukan",
    poweredByBlackline: "Dikuasakan oleh Blackline",
  },
  tl: {
    requestASong: "MAG-REQUEST NG KANTA",
    scanQrCode: "I-SCAN ANG QR CODE",
    scanHere: "SCAN DITO",
    requestFavoriteSong: "I-request ang favorite song mo",
    tipMoveHigher: "Mag-tip para umangat",
    inTheQueue: "sa pila",
    tipMoveHigherFull: "Mag-tip para umangat sa pila",
    noAppRequired: "Walang app kailangan",
    poweredByBlackline: "Powered by Blackline",
  },
  pt: {
    requestASong: "PECA UMA MUSICA",
    scanQrCode: "ESCANEIE O QR CODE",
    scanHere: "ESCANEIE AQUI",
    requestFavoriteSong: "Peca sua musica favorita",
    tipMoveHigher: "De gorjeta para subir",
    inTheQueue: "na fila",
    tipMoveHigherFull: "De gorjeta para subir na fila",
    noAppRequired: "Sem app necessario",
    poweredByBlackline: "Desenvolvido por Blackline",
  },
  es: {
    requestASong: "PIDE UNA CANCION",
    scanQrCode: "ESCANEA EL CODIGO QR",
    scanHere: "ESCANEA AQUI",
    requestFavoriteSong: "Pide tu cancion favorita",
    tipMoveHigher: "Da propina para subir",
    inTheQueue: "en la cola",
    tipMoveHigherFull: "Da propina para subir en la cola",
    noAppRequired: "Sin app requerida",
    poweredByBlackline: "Desarrollado por Blackline",
  },
  fr: {
    requestASong: "DEMANDE UN SON",
    scanQrCode: "SCANNE LE QR CODE",
    scanHere: "SCANNE ICI",
    requestFavoriteSong: "Demande ton son prefere",
    tipMoveHigher: "Donne un pourboire",
    inTheQueue: "pour monter",
    tipMoveHigherFull: "Donne un pourboire pour monter",
    noAppRequired: "Aucune app requise",
    poweredByBlackline: "Propulse par Blackline",
  },
  de: {
    requestASong: "SONG WUENSCHEN",
    scanQrCode: "QR-CODE SCANNEN",
    scanHere: "HIER SCANNEN",
    requestFavoriteSong: "Wuensch dir deinen Lieblingssong",
    tipMoveHigher: "Trinkgeld bringt dich",
    inTheQueue: "nach oben",
    tipMoveHigherFull: "Trinkgeld bringt dich nach oben",
    noAppRequired: "Keine App noetig",
    poweredByBlackline: "Powered by Blackline",
  },
  it: {
    requestASong: "RICHIEDI UNA CANZONE",
    scanQrCode: "SCANSIONA IL QR CODE",
    scanHere: "SCANSIONA QUI",
    requestFavoriteSong: "Richiedi la tua canzone preferita",
    tipMoveHigher: "Lascia una mancia",
    inTheQueue: "per salire",
    tipMoveHigherFull: "Lascia una mancia per salire",
    noAppRequired: "Nessuna app richiesta",
    poweredByBlackline: "Powered by Blackline",
  },
  nl: {
    requestASong: "VRAAG EEN NUMMER AAN",
    scanQrCode: "SCAN DE QR-CODE",
    scanHere: "SCAN HIER",
    requestFavoriteSong: "Vraag je favoriete nummer aan",
    tipMoveHigher: "Geef fooi om hoger",
    inTheQueue: "te komen",
    tipMoveHigherFull: "Geef fooi om hoger te komen",
    noAppRequired: "Geen app nodig",
    poweredByBlackline: "Powered by Blackline",
  },
};

function getPromoPdfText(language: string | null) {
  if (language && language in promoPdfTranslations) {
    return promoPdfTranslations[language as PromoPdfLanguage];
  }

  return promoPdfTranslations.en;
}



type PromoKitType = "poster" | "table-tent" | "sticker" | "counter-card" | "qr-png";

function getRequestUrl(stageName: string) {
  return `https://dj-request-app-topaz.vercel.app/${stageName
    .toLowerCase()
    .trim()}`;
}


function getPromoTitleLines(texts: PromoPdfText) {
  const words = texts.requestASong.trim().split(/\s+/);

  if (words.length <= 1) {
    return {
      line1: texts.requestASong,
      line2: "",
    };
  }

  if (words.length === 2) {
    return {
      line1: words[0],
      line2: words[1],
    };
  }

  return {
    line1: words[0],
    line2: words.slice(1).join(" "),
  };
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


function getFittedFontSize(
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  font: PDFFont
) {
  let size = maxSize;

  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5;
  }

  return size;
}

function drawCenteredFitText(
  page: PDFPage,
  text: string,
  y: number,
  maxSize: number,
  minSize: number,
  font: PDFFont,
  color = WHITE,
  boxX = 0,
  boxWidth = page.getWidth()
) {
  const size = getFittedFontSize(text, boxWidth, maxSize, minSize, font);
  drawCenteredText(page, text, y, size, font, color, boxX, boxWidth);
}

function drawLeftFitText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  font: PDFFont,
  color = WHITE
) {
  const size = getFittedFontSize(text, maxWidth, maxSize, minSize, font);

  page.drawText(text, {
    x,
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

async function buildPosterPdf(requestUrl: string, texts: PromoPdfText) {
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

  drawCenteredFitText(page, texts.requestASong, 700, 44, 28, bold);
  drawCenteredFitText(page, texts.scanQrCode, 650, 20, 14, bold, PURPLE);

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

  drawCenteredFitText(page, texts.requestFavoriteSong, 210, 23, 14, bold);
  drawCenteredFitText(page, texts.tipMoveHigherFull, 174, 19, 12, regular, GREEN);
  drawCenteredFitText(page, texts.noAppRequired, 142, 17, 11, regular);
  drawCenteredText(page, texts.poweredByBlackline, 60, 13, bold, PURPLE);

  return pdfDoc.save();
}

async function buildStickerPdf(requestUrl: string, texts: PromoPdfText) {
  const pdfDoc = await PDFDocument.create();

  const pageW = 340.16;
  const pageH = 226.77;
  const page = pdfDoc.addPage([pageW, pageH]);

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const titleLines = getPromoTitleLines(texts);

  page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: BLACK });

  drawRoundedBorder(page, 9, 10, pageW - 18, pageH - 20, 20, 3.5, PURPLE, BLACK);

  drawHeadphonesIcon(page, 40, 160, 0.65);

  drawLeftFitText(page, titleLines.line1, 73, 165, 128, 28, 16, bold, WHITE);

  drawLeftFitText(page, titleLines.line2, 36, 116, 158, 40, 16, bold, WHITE);

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

  drawLeftFitText(page, texts.requestFavoriteSong, 56, 68, 135, 10.5, 7.5, bold, WHITE);

  drawArrowIcon(page, 46, 49, 10);

  drawLeftFitText(page, texts.tipMoveHigher, 63, 47, 130, 12.5, 8, bold, GREEN);

  drawLeftFitText(page, texts.inTheQueue, 63, 32, 130, 12.5, 8, bold, GREEN);

  drawRoundedFill(page, 35, 6, 88, 16, 4, PURPLE);

  drawCenteredFitText(page, texts.noAppRequired, 11, 8, 5.5, bold, WHITE, 35, 88);

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

  drawLeftFitText(
    page,
    texts.scanHere,
    qrCardX + 28,
    qrCardY + 19,
    qrCardW - 34,
    11,
    6.5,
    bold,
    WHITE
  );

  drawHeadphonesIcon(page, qrCardX + 9, 14, 0.22);
  drawLeftFitText(
    page,
    texts.poweredByBlackline,
    qrCardX + 25,
    18,
    qrCardW - 30,
    5.5,
    4,
    regular,
    GRAY
  );

  return pdfDoc.save();
}

async function buildTableTentPdf(requestUrl: string, texts: PromoPdfText) {
  const pdfDoc = await PDFDocument.create();

  const pageW = 595.28;
  const pageH = 841.89;
  const page = pdfDoc.addPage([pageW, pageH]);

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const titleLines = getPromoTitleLines(texts);

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

  drawCenteredFitText(page, titleLines.line1, cardY + 555, 45, 30, bold, WHITE, cardX + 20, cardW - 40);
  drawCenteredFitText(page, titleLines.line2, cardY + 503, 45, 28, bold, WHITE, cardX + 20, cardW - 40);

  page.drawRectangle({
    x: cardX + 104,
    y: cardY + 470,
    width: 152,
    height: 33,
    color: PURPLE,
  });

  drawCenteredFitText(page, texts.scanHere, cardY + 478, 19, 11, bold, WHITE, cardX + 104, 152);

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

  drawLeftFitText(page, texts.requestFavoriteSong, cardX + 126, cardY + 214, 155, 12, 8, bold, WHITE);

  drawArrowIcon(page, cardX + 110, cardY + 192, 9);

  drawLeftFitText(page, texts.tipMoveHigher, cardX + 126, cardY + 191, 155, 14, 8, bold, GREEN);

  drawLeftFitText(page, texts.inTheQueue, cardX + 126, cardY + 173, 155, 14, 8, bold, GREEN);

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

  drawCenteredFitText(page, texts.noAppRequired, cardY + 124, 10, 6.5, bold, WHITE, cardX + 128, 104);

  drawHeadphonesIcon(page, cardX + 112, cardY + 78, 0.32);

  drawLeftFitText(
    page,
    texts.poweredByBlackline,
    cardX + 132,
    cardY + 85,
    150,
    8,
    5.5,
    regular,
    GRAY
  );

  return pdfDoc.save();
}


async function buildCounterCardPdf(requestUrl: string, texts: PromoPdfText) {
  const pdfDoc = await PDFDocument.create();

  const pageW = 419.53;
  const pageH = 297.64;
  const page = pdfDoc.addPage([pageW, pageH]);

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const titleLines = getPromoTitleLines(texts);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageW,
    height: pageH,
    color: BLACK,
  });

  drawRoundedBorder(page, 16, 16, pageW - 32, pageH - 32, 22, 4, PURPLE, BLACK);

  drawHeadphonesIcon(page, 48, 218, 0.72);

  drawLeftFitText(page, titleLines.line1, 88, 230, 160, 30, 17, bold, WHITE);
  drawLeftFitText(page, titleLines.line2, 48, 176, 205, 48, 24, bold, WHITE);

  page.drawLine({
    start: { x: 52, y: 153 },
    end: { x: 128, y: 153 },
    thickness: 2.5,
    color: PURPLE,
  });

  page.drawLine({
    start: { x: 140, y: 153 },
    end: { x: 232, y: 153 },
    thickness: 2.5,
    color: PURPLE,
  });

  page.drawLine({
    start: { x: 128, y: 153 },
    end: { x: 134, y: 146 },
    thickness: 2.5,
    color: PURPLE,
  });

  page.drawLine({
    start: { x: 134, y: 146 },
    end: { x: 140, y: 153 },
    thickness: 2.5,
    color: PURPLE,
  });

  drawMusicIcon(page, 58, 115, 10);
  drawLeftFitText(page, texts.requestFavoriteSong, 76, 108, 170, 14, 8.5, bold, WHITE);

  drawArrowIcon(page, 58, 80, 10);
  drawLeftFitText(page, texts.tipMoveHigher, 76, 80, 170, 16, 9, bold, GREEN);
  drawLeftFitText(page, texts.inTheQueue, 76, 59, 170, 16, 9, bold, GREEN);

  drawRoundedFill(page, 52, 30, 128, 24, 6, PURPLE);
  drawCenteredFitText(page, texts.noAppRequired, 38, 11, 7, bold, WHITE, 52, 128);

  const qrBytes = await getQrPngBytes(requestUrl);
  const qrImage = await pdfDoc.embedPng(qrBytes);

  const qrCardX = 266;
  const qrCardY = 58;
  const qrCardW = 118;
  const qrCardH = 172;

  drawRoundedFill(page, qrCardX, qrCardY, qrCardW, qrCardH, 11, WHITE);

  page.drawImage(qrImage, {
    x: qrCardX + 8,
    y: qrCardY + 62,
    width: 102,
    height: 102,
  });

  drawRoundedFill(page, qrCardX, qrCardY, qrCardW, 50, 11, PURPLE);
  drawPhoneIcon(page, qrCardX + 13, qrCardY + 15, 0.82);

  drawLeftFitText(
    page,
    texts.scanHere,
    qrCardX + 36,
    qrCardY + 20,
    qrCardW - 44,
    12,
    7,
    bold,
    WHITE
  );

  drawHeadphonesIcon(page, 276, 31, 0.25);
  drawLeftFitText(page, texts.poweredByBlackline, 294, 37, 88, 7, 5, regular, GRAY);

  return pdfDoc.save();
}


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stageName = searchParams.get("stage") || "";
    const type = searchParams.get("type") || "";
    const language = searchParams.get("lang");

    if (!stageName.trim()) {
      return NextResponse.json({ error: "Missing DJ stage name" }, { status: 400 });
    }

    const validTypes: PromoKitType[] = [
      "poster",
      "table-tent",
      "sticker",
      "counter-card",
      "qr-png",
    ];

    if (!validTypes.includes(type as PromoKitType)) {
      return NextResponse.json({ error: "Invalid promo kit type" }, { status: 400 });
    }

    const requestUrl = getRequestUrl(stageName);
    const texts = getPromoPdfText(language);

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

    let pdfBytes: Uint8Array;
    let filename: string;

    if (type === "poster") {
      pdfBytes = await buildPosterPdf(requestUrl, texts);
      filename = `${stageName}-blackline-a4-poster.pdf`;
    } else if (type === "table-tent") {
      pdfBytes = await buildTableTentPdf(requestUrl, texts);
      filename = `${stageName}-blackline-table-tent.pdf`;
    } else if (type === "counter-card") {
      pdfBytes = await buildCounterCardPdf(requestUrl, texts);
      filename = `${stageName}-blackline-counter-card.pdf`;
    } else {
      pdfBytes = await buildStickerPdf(requestUrl, texts);
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
