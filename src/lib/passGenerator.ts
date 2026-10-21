import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import sharp from 'sharp';

export interface PassRegistrationData {
  id: string;
  registrationCode: string;
  passToken?: string;
  qrPayload?: string;
  eventId: string;
  eventTitle: string;
  studentName: string;
  registerNumber?: string;
  department?: string;
  academicYear?: string;
  collegeName?: string;
  participationCategory?: string;
  status?: string;
  registeredAt?: string;
}

export interface PassEventData {
  id: string;
  title: string;
  category?: string;
  date?: string;
  time?: string;
  venue?: string;
  bannerImage?: string;
}

/**
 * Generates a clean QR code data payload for entry check-in.
 * Contains only non-sensitive verifiable identifiers:
 * IEDCPASS:{eventId}:{registrationCode}:{passToken}
 */
export function getPassQrPayload(reg: PassRegistrationData): string {
  if (reg.qrPayload) return reg.qrPayload;
  const token = reg.passToken || `pass_${Buffer.from(reg.id).toString('hex').slice(0, 24)}`;
  return `IEDCPASS:${reg.eventId}:${reg.registrationCode || reg.id}:${token}`;
}

/**
 * Generates a high-contrast QR code Data URL (PNG base64).
 */
export async function generatePassQrDataUrl(reg: PassRegistrationData): Promise<string> {
  const payload = getPassQrPayload(reg);
  return QRCode.toDataURL(payload, {
    width: 400,
    margin: 1,
    color: {
      dark: '#0B0B0D',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  });
}

/**
 * Generates an authentic, high-quality Event Entry Pass PDF.
 * Uses official IEDC & College branding, sharp vector typography,
 * and high-contrast scannable QR code.
 */
export async function generatePassPdf(
  reg: PassRegistrationData,
  event: PassEventData
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  // Standard vertical badge/pass dimensions: 400 x 620 pt (~5.5 x 8.6 inches)
  const width = 400;
  const height = 620;
  const page = pdfDoc.addPage([width, height]);

  // Load standard Helvetica fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Background Canvas: Deep Midnight Obsidian (#0B0B0E)
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(11 / 255, 11 / 255, 14 / 255)
  });

  // Top Decorative Gradient Banner / Header Area (#18181F)
  page.drawRectangle({
    x: 0,
    y: height - 110,
    width,
    height: 110,
    color: rgb(24 / 255, 24 / 255, 31 / 255)
  });

  // Orange Accent Stripe (IEDC Brand #F98A5B)
  page.drawRectangle({
    x: 0,
    y: height - 113,
    width,
    height: 3,
    color: rgb(249 / 255, 138 / 255, 91 / 255)
  });

  // Embed Official Logos
  const collegeLogoPath = path.join(process.cwd(), 'public', 'college-logo.png');
  const iedcLogoPath = path.join(process.cwd(), 'public', 'iedc-gptc-pmna-logo.png');

  if (fs.existsSync(collegeLogoPath)) {
    try {
      const collegeImg = await pdfDoc.embedPng(fs.readFileSync(collegeLogoPath));
      page.drawImage(collegeImg, {
        x: 20,
        y: height - 90,
        width: 48,
        height: 48
      });
    } catch (e) {
      // safe fallback
    }
  }

  if (fs.existsSync(iedcLogoPath)) {
    try {
      const iedcImg = await pdfDoc.embedPng(fs.readFileSync(iedcLogoPath));
      page.drawImage(iedcImg, {
        x: width - 72,
        y: height - 90,
        width: 52,
        height: 48
      });
    } catch (e) {
      // safe fallback
    }
  }

  // Institution & Header Titles
  page.drawText('GOVT POLYTECHNIC COLLEGE PERINTHALMANNA', {
    x: 75,
    y: height - 52,
    size: 9.5,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  page.drawText('INNOVATION & ENTREPRENEURSHIP DEVELOPMENT CENTRE', {
    x: 75,
    y: height - 66,
    size: 7.5,
    font: fontRegular,
    color: rgb(200 / 255, 205 / 255, 215 / 255)
  });

  page.drawText('OFFICIAL EVENT ENTRY PASS', {
    x: 75,
    y: height - 80,
    size: 8.5,
    font: fontBold,
    color: rgb(249 / 255, 138 / 255, 91 / 255)
  });

  // Event Title Section
  const eventTitle = (event.title || reg.eventTitle || 'Campus Innovation Event').toUpperCase();
  const truncatedTitle = eventTitle.length > 55 ? eventTitle.substring(0, 52) + '...' : eventTitle;

  page.drawText(truncatedTitle, {
    x: 25,
    y: height - 145,
    size: 15,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  // Event Meta: Date, Time & Venue
  const dateStr = event.date || 'Event Date TBA';
  const timeStr = event.time || '10:00 AM - 04:00 PM';
  const venueStr = event.venue || 'IEDC Innovation Hall / GPTC Campus';

  page.drawText(`Date: ${dateStr}   |   Time: ${timeStr}`, {
    x: 25,
    y: height - 165,
    size: 9,
    font: fontRegular,
    color: rgb(180 / 255, 185 / 255, 195 / 255)
  });

  page.drawText(`Venue: ${venueStr}`, {
    x: 25,
    y: height - 180,
    size: 9,
    font: fontRegular,
    color: rgb(249 / 255, 138 / 255, 91 / 255)
  });

  // Participant Card Frame (Dark Glassmorphic Box)
  page.drawRectangle({
    x: 20,
    y: height - 310,
    width: width - 40,
    height: 115,
    color: rgb(18 / 255, 18 / 255, 24 / 255),
    borderColor: rgb(40 / 255, 40 / 255, 50 / 255),
    borderWidth: 1
  });

  // Participant Name
  page.drawText('PARTICIPANT NAME', {
    x: 35,
    y: height - 222,
    size: 7.5,
    font: fontBold,
    color: rgb(140 / 255, 145 / 255, 160 / 255)
  });

  const studentName = (reg.studentName || 'Student Participant').toUpperCase();
  page.drawText(studentName, {
    x: 35,
    y: height - 240,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  // Registration ID & Department
  page.drawText('PASS ID / REGISTRATION NO', {
    x: 35,
    y: height - 262,
    size: 7.5,
    font: fontBold,
    color: rgb(140 / 255, 145 / 255, 160 / 255)
  });

  const regCode = reg.registrationCode || reg.id;
  page.drawText(regCode, {
    x: 35,
    y: height - 277,
    size: 11,
    font: fontBold,
    color: rgb(249 / 255, 138 / 255, 91 / 255)
  });

  // Department / Institution
  const deptInfo = `${reg.department || 'General'} - ${reg.academicYear || ''}`.trim().replace(/^ - | - $/g, '');
  page.drawText(deptInfo || (reg.collegeName || 'Govt Polytechnic College Perinthalmanna'), {
    x: 35,
    y: height - 297,
    size: 9,
    font: fontRegular,
    color: rgb(180 / 255, 185 / 255, 195 / 255)
  });

  // Status Badge in Participant Box
  const statusStr = (reg.status || 'Confirmed').toUpperCase();
  const isWaitlisted = statusStr.includes('WAIT');
  page.drawRectangle({
    x: width - 135,
    y: height - 242,
    width: 95,
    height: 22,
    color: isWaitlisted ? rgb(60 / 255, 45 / 255, 10 / 255) : rgb(10 / 255, 50 / 255, 30 / 255),
    borderColor: isWaitlisted ? rgb(245 / 255, 158 / 255, 11 / 255) : rgb(16 / 255, 185 / 255, 129 / 255),
    borderWidth: 1
  });

  page.drawText(statusStr, {
    x: width - 120,
    y: height - 235,
    size: 8.5,
    font: fontBold,
    color: isWaitlisted ? rgb(251 / 255, 191 / 255, 36 / 255) : rgb(52 / 255, 211 / 255, 153 / 255)
  });

  // QR Code Box (White background for instant camera decoding)
  const qrBoxSize = 170;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = height - 510;

  page.drawRectangle({
    x: qrBoxX,
    y: qrBoxY,
    width: qrBoxSize,
    height: qrBoxSize,
    color: rgb(1, 1, 1),
    borderColor: rgb(249 / 255, 138 / 255, 91 / 255),
    borderWidth: 1.5
  });

  // Embed High-Contrast QR Code
  const qrDataUrl = await generatePassQrDataUrl(reg);
  const qrBytes = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
  const qrImage = await pdfDoc.embedPng(qrBytes);

  page.drawImage(qrImage, {
    x: qrBoxX + 10,
    y: qrBoxY + 10,
    width: qrBoxSize - 20,
    height: qrBoxSize - 20
  });

  // Text below QR
  page.drawText('SCAN WITH ADMIN QR SCANNER AT RECEPTION', {
    x: (width - 230) / 2,
    y: qrBoxY - 18,
    size: 7.5,
    font: fontBold,
    color: rgb(200 / 255, 205 / 255, 215 / 255)
  });

  page.drawText('Please present this pass (digital or printed) at the entrance desk.', {
    x: (width - 260) / 2,
    y: qrBoxY - 32,
    size: 7,
    font: fontRegular,
    color: rgb(130 / 255, 135 / 255, 150 / 255)
  });

  // Footer Accent & Security Seal
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: 38,
    color: rgb(16 / 255, 16 / 255, 22 / 255)
  });

  page.drawRectangle({
    x: 0,
    y: 37,
    width,
    height: 1,
    color: rgb(35 / 255, 35 / 255, 45 / 255)
  });

  page.drawText('IEDC GPTC PMNA • INNOVATION CELL VERIFIED PASS', {
    x: 25,
    y: 15,
    size: 7.5,
    font: fontBold,
    color: rgb(140 / 255, 145 / 255, 160 / 255)
  });

  page.drawText(`Issued: ${new Date().toISOString().split('T')[0]}`, {
    x: width - 95,
    y: 15,
    size: 7,
    font: fontRegular,
    color: rgb(110 / 255, 115 / 255, 130 / 255)
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generates an authentic companion PNG entry pass image (1200 x 1860 px).
 */
export async function generatePassPng(
  reg: PassRegistrationData,
  event: PassEventData
): Promise<Buffer> {
  const qrDataUrl = await generatePassQrDataUrl(reg);
  const qrPngBytes = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');

  const width = 1200;
  const height = 1860;

  const eventTitle = (event.title || reg.eventTitle || 'Campus Innovation Event').toUpperCase();
  const dateStr = event.date || 'Event Date TBA';
  const timeStr = event.time || '10:00 AM - 04:00 PM';
  const venueStr = event.venue || 'IEDC Innovation Hall / GPTC Campus';
  const studentName = (reg.studentName || 'Student Participant').toUpperCase();
  const regCode = reg.registrationCode || reg.id;
  const deptInfo = `${reg.department || 'General'} - ${reg.academicYear || ''}`.trim().replace(/^ - | - $/g, '');
  const statusStr = (reg.status || 'Confirmed').toUpperCase();

  // Escape XML characters for SVG
  const escapeXml = (str: string) =>
    str.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });

  const svgTemplate = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#181822"/>
          <stop offset="100%" stop-color="#101017"/>
        </linearGradient>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#14141C"/>
          <stop offset="100%" stop-color="#0E0E14"/>
        </linearGradient>
      </defs>

      <!-- Background Canvas -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="#0A0A0D"/>

      <!-- Header Section -->
      <rect x="0" y="0" width="${width}" height="320" fill="url(#headerGrad)"/>
      <rect x="0" y="316" width="${width}" height="4" fill="#F98A5B"/>

      <!-- Header Typography -->
      <text x="210" y="110" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="28" fill="#FFFFFF">
        GOVT POLYTECHNIC COLLEGE PERINTHALMANNA
      </text>
      <text x="210" y="150" font-family="Arial, Helvetica, sans-serif" font-weight="normal" font-size="22" fill="#B0B5C0">
        INNOVATION &amp; ENTREPRENEURSHIP DEVELOPMENT CENTRE
      </text>
      <text x="210" y="195" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="24" fill="#F98A5B" letter-spacing="1.5">
        OFFICIAL EVENT ENTRY PASS
      </text>

      <!-- Event Title -->
      <text x="80" y="420" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="44" fill="#FFFFFF">
        ${escapeXml(eventTitle.length > 40 ? eventTitle.substring(0, 37) + '...' : eventTitle)}
      </text>
      <text x="80" y="475" font-family="Arial, Helvetica, sans-serif" font-weight="normal" font-size="26" fill="#9CA3AF">
        Date: ${escapeXml(dateStr)}   |   Time: ${escapeXml(timeStr)}
      </text>
      <text x="80" y="520" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="26" fill="#F98A5B">
        Venue: ${escapeXml(venueStr)}
      </text>

      <!-- Participant Detail Card -->
      <rect x="80" y="580" width="1040" height="340" rx="24" fill="url(#cardGrad)" stroke="#2D2D3A" stroke-width="2"/>

      <text x="130" y="650" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="20" fill="#9CA3AF" letter-spacing="1">
        PARTICIPANT NAME
      </text>
      <text x="130" y="705" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="42" fill="#FFFFFF">
        ${escapeXml(studentName)}
      </text>

      <text x="130" y="775" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="20" fill="#9CA3AF" letter-spacing="1">
        REGISTRATION ID / PASS CODE
      </text>
      <text x="130" y="825" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="34" fill="#F98A5B" letter-spacing="2">
        ${escapeXml(regCode)}
      </text>

      <text x="130" y="875" font-family="Arial, Helvetica, sans-serif" font-weight="normal" font-size="24" fill="#D1D5DB">
        ${escapeXml(deptInfo || (reg.collegeName || 'Govt Polytechnic College Perinthalmanna'))}
      </text>

      <!-- Status Badge -->
      <rect x="910" y="630" width="170" height="60" rx="30" fill="#0A3320" stroke="#10B981" stroke-width="2"/>
      <text x="995" y="668" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="22" fill="#34D399" text-anchor="middle">
        ${escapeXml(statusStr)}
      </text>

      <!-- QR Code Outer Frame -->
      <rect x="340" y="990" width="520" height="520" rx="28" fill="#FFFFFF" stroke="#F98A5B" stroke-width="4"/>

      <!-- Instruction Texts -->
      <text x="600" y="1575" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="24" fill="#E5E7EB" text-anchor="middle" letter-spacing="1">
        SCAN WITH ADMIN QR SCANNER AT RECEPTION
      </text>
      <text x="600" y="1620" font-family="Arial, Helvetica, sans-serif" font-weight="normal" font-size="20" fill="#9CA3AF" text-anchor="middle">
        Please present this digital pass on your phone or printout at the entrance desk.
      </text>

      <!-- Footer Bar -->
      <rect x="0" y="1760" width="${width}" height="100" fill="#0E0E14"/>
      <line x1="0" y1="1760" x2="${width}" y2="1760" stroke="#252530" stroke-width="2"/>
      <text x="80" y="1818" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="22" fill="#6B7280">
        IEDC GPTC PMNA • INNOVATION CELL VERIFIED PASS
      </text>
      <text x="1120" y="1818" font-family="Arial, Helvetica, sans-serif" font-weight="normal" font-size="20" fill="#6B7280" text-anchor="end">
        Official Document
      </text>
    </svg>
  `;

  // Base canvas from SVG
  let baseSharp = sharp(Buffer.from(svgTemplate));

  // Composite QR code and logos onto canvas
  const overlays: any[] = [];

  // 1. QR Code
  overlays.push({
    input: await sharp(qrPngBytes).resize(460, 460).toBuffer(),
    top: 1020,
    left: 370
  });

  // 2. College Logo
  const collegeLogoPath = path.join(process.cwd(), 'public', 'college-logo.png');
  if (fs.existsSync(collegeLogoPath)) {
    try {
      const resizedLogo = await sharp(collegeLogoPath).resize(110, 110, { fit: 'inside' }).toBuffer();
      overlays.push({
        input: resizedLogo,
        top: 75,
        left: 65
      });
    } catch (e) {
      // safe fallback
    }
  }

  // 3. IEDC Logo
  const iedcLogoPath = path.join(process.cwd(), 'public', 'iedc-gptc-pmna-logo.png');
  if (fs.existsSync(iedcLogoPath)) {
    try {
      const resizedIedc = await sharp(iedcLogoPath).resize(120, 110, { fit: 'inside' }).toBuffer();
      overlays.push({
        input: resizedIedc,
        top: 75,
        left: 1015
      });
    } catch (e) {
      // safe fallback
    }
  }

  return baseSharp.composite(overlays).png({ quality: 95 }).toBuffer();
}

/**
 * Ensures pass PDF and PNG exist on filesystem for quick serving and caching.
 */
export async function ensurePassFiles(
  reg: PassRegistrationData,
  event: PassEventData
): Promise<{ pdfUrl: string; pngUrl: string }> {
  const passesDir = path.join(process.cwd(), 'public', 'passes');
  if (!fs.existsSync(passesDir)) {
    fs.mkdirSync(passesDir, { recursive: true });
  }

  const pdfPath = path.join(passesDir, `${reg.id}.pdf`);
  const pngPath = path.join(passesDir, `${reg.id}.png`);

  if (!fs.existsSync(pdfPath)) {
    const pdfBuf = await generatePassPdf(reg, event);
    fs.writeFileSync(pdfPath, pdfBuf);
  }

  if (!fs.existsSync(pngPath)) {
    const pngBuf = await generatePassPng(reg, event);
    fs.writeFileSync(pngPath, pngBuf);
  }

  return {
    pdfUrl: `/passes/${reg.id}.pdf`,
    pngUrl: `/passes/${reg.id}.png`
  };
}
