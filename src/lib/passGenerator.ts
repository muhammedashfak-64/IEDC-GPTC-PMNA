import fs from 'fs';
import path from 'path';
import os from 'os';
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
  branch?: string;
  academicYear?: string;
  semester?: string | null;
  collegeName?: string;
  participationCategory?: string;
  status?: string;
  waitlistPosition?: number | null;
  registeredAt?: string;
  eventDate?: string;
  eventTime?: string;
  eventVenue?: string;
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
    width: 500,
    margin: 1,
    color: {
      dark: '#0B0B0D',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  });
}

// Cached Base64 TrueType font to guarantee vector glyph rendering on serverless Linux
let cachedEmbeddedFontBase64 = '';
function getEmbeddedFontBase64(): string {
  if (cachedEmbeddedFontBase64) return cachedEmbeddedFontBase64;
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'fonts', 'Geist-Regular.ttf'),
    path.join(process.cwd(), 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og', 'Geist-Regular.ttf')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      try {
        cachedEmbeddedFontBase64 = fs.readFileSync(/*turbopackIgnore: true*/ p).toString('base64');
        break;
      } catch {}
    }
  }
  return cachedEmbeddedFontBase64;
}

// Escape XML characters for SVG
function escapeXml(str: string): string {
  return String(str || '')
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
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

  // Background Canvas: Deep Midnight Obsidian (#0B0B0F)
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(11 / 255, 11 / 255, 15 / 255)
  });

  // Top Decorative Gradient Accent Bar (#F98A5B)
  page.drawRectangle({
    x: 0,
    y: height - 5,
    width,
    height: 5,
    color: rgb(249 / 255, 138 / 255, 91 / 255)
  });

  // Header Area Background (#12121A)
  page.drawRectangle({
    x: 0,
    y: height - 95,
    width,
    height: 90,
    color: rgb(18 / 255, 18 / 255, 26 / 255)
  });

  page.drawRectangle({
    x: 0,
    y: height - 96,
    width,
    height: 1,
    color: rgb(35 / 255, 35 / 255, 48 / 255)
  });

  // Embed Official Logos
  const collegeLogoPath = path.join(process.cwd(), 'public', 'college-logo.png');
  const iedcLogoPath = path.join(process.cwd(), 'public', 'iedc-gptc-pmna-logo.png');

  if (fs.existsSync(collegeLogoPath)) {
    try {
      const resizedLogo = await sharp(collegeLogoPath)
        .resize(120, 120, { fit: 'inside' })
        .png({ quality: 85 })
        .toBuffer();
      const collegeImg = await pdfDoc.embedPng(resizedLogo);
      page.drawImage(collegeImg, {
        x: 18,
        y: height - 76,
        width: 44,
        height: 44
      });
    } catch {}
  }

  if (fs.existsSync(iedcLogoPath)) {
    try {
      const resizedIedc = await sharp(iedcLogoPath)
        .resize(140, 120, { fit: 'inside' })
        .png({ quality: 85 })
        .toBuffer();
      const iedcImg = await pdfDoc.embedPng(resizedIedc);
      page.drawImage(iedcImg, {
        x: width - 68,
        y: height - 76,
        width: 48,
        height: 44
      });
    } catch {}
  }

  // Institution & Header Titles
  page.drawText('GOVT POLYTECHNIC COLLEGE PERINTHALMANNA', {
    x: 70,
    y: height - 42,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  page.drawText('INNOVATION & ENTREPRENEURSHIP DEVELOPMENT CENTRE', {
    x: 70,
    y: height - 55,
    size: 7,
    font: fontRegular,
    color: rgb(180 / 255, 185 / 255, 195 / 255)
  });

  page.drawText('OFFICIAL EVENT ENTRY PASS', {
    x: 70,
    y: height - 68,
    size: 8,
    font: fontBold,
    color: rgb(249 / 255, 138 / 255, 91 / 255)
  });

  // Event Details Box (#14141D)
  page.drawRectangle({
    x: 18,
    y: height - 180,
    width: width - 36,
    height: 75,
    color: rgb(20 / 255, 20 / 255, 29 / 255),
    borderColor: rgb(40 / 255, 40 / 255, 55 / 255),
    borderWidth: 1
  });

  const eventTitle = (event.title || reg.eventTitle || 'Campus Innovation Event').toUpperCase();
  const truncatedTitle = eventTitle.length > 46 ? eventTitle.substring(0, 43) + '...' : eventTitle;

  page.drawText(truncatedTitle, {
    x: 30,
    y: height - 130,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  const dateStr = event.date || reg.eventDate || 'Date Announced Soon';
  const timeStr = event.time || reg.eventTime || '10:00 AM - 04:00 PM';
  const venueStr = event.venue || reg.eventVenue || 'IEDC Hall / GPTC Campus';

  page.drawText(`Date: ${dateStr}   |   Time: ${timeStr}`, {
    x: 30,
    y: height - 150,
    size: 8.5,
    font: fontRegular,
    color: rgb(160 / 255, 165 / 255, 180 / 255)
  });

  page.drawText(`Venue: ${venueStr}`, {
    x: 30,
    y: height - 165,
    size: 8.5,
    font: fontBold,
    color: rgb(249 / 255, 138 / 255, 91 / 255)
  });

  // Participant Card Frame
  page.drawRectangle({
    x: 18,
    y: height - 305,
    width: width - 36,
    height: 115,
    color: rgb(18 / 255, 18 / 255, 26 / 255),
    borderColor: rgb(40 / 255, 40 / 255, 55 / 255),
    borderWidth: 1
  });

  // Participant Name
  page.drawText('PARTICIPANT NAME', {
    x: 30,
    y: height - 215,
    size: 7,
    font: fontBold,
    color: rgb(130 / 255, 135 / 255, 150 / 255)
  });

  const studentName = (reg.studentName || 'Student Participant').toUpperCase();
  page.drawText(studentName, {
    x: 30,
    y: height - 232,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  // Status Badge in Participant Box
  const statusStr = (reg.status || 'Confirmed').toUpperCase();
  const isWaitlisted = statusStr.includes('WAIT');
  page.drawRectangle({
    x: width - 125,
    y: height - 236,
    width: 88,
    height: 20,
    color: isWaitlisted ? rgb(60 / 255, 45 / 255, 10 / 255) : rgb(10 / 255, 50 / 255, 30 / 255),
    borderColor: isWaitlisted ? rgb(245 / 255, 158 / 255, 11 / 255) : rgb(16 / 255, 185 / 255, 129 / 255),
    borderWidth: 1
  });

  page.drawText(isWaitlisted ? `WAITLIST #${reg.waitlistPosition || 1}` : 'CONFIRMED', {
    x: width - 118,
    y: height - 228,
    size: 7.5,
    font: fontBold,
    color: isWaitlisted ? rgb(251 / 255, 191 / 255, 36 / 255) : rgb(52 / 255, 211 / 255, 153 / 255)
  });

  // Pass Code / Registration Code
  page.drawText('PASS ID / REGISTRATION NO', {
    x: 30,
    y: height - 253,
    size: 7,
    font: fontBold,
    color: rgb(130 / 255, 135 / 255, 150 / 255)
  });

  const regCode = reg.registrationCode || reg.id;
  page.drawText(regCode, {
    x: 30,
    y: height - 268,
    size: 11,
    font: fontBold,
    color: rgb(249 / 255, 138 / 255, 91 / 255)
  });

  // Department & Institution
  const deptInfo = `${reg.department || reg.branch || 'General'} - ${reg.academicYear || ''}`.trim().replace(/^ - | - $/g, '');
  page.drawText(deptInfo || (reg.collegeName || 'Govt Polytechnic College Perinthalmanna'), {
    x: 30,
    y: height - 288,
    size: 8.5,
    font: fontRegular,
    color: rgb(170 / 255, 175 / 255, 190 / 255)
  });

  // QR Code Box (White background with orange border)
  const qrBoxSize = 160;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = height - 485;

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
    x: qrBoxX + 8,
    y: qrBoxY + 8,
    width: qrBoxSize - 16,
    height: qrBoxSize - 16
  });

  // Text below QR
  page.drawText('ENTRY VERIFICATION • SCAN AT RECEPTION', {
    x: (width - 230) / 2,
    y: qrBoxY - 18,
    size: 8,
    font: fontBold,
    color: rgb(220 / 255, 225 / 255, 235 / 255)
  });

  page.drawText('Please present this pass on your phone or printout at the entrance desk.', {
    x: (width - 270) / 2,
    y: qrBoxY - 32,
    size: 7,
    font: fontRegular,
    color: rgb(130 / 255, 135 / 255, 150 / 255)
  });

  // Reception Desk Notice
  page.drawRectangle({
    x: 18,
    y: 50,
    width: width - 36,
    height: 38,
    color: rgb(18 / 255, 18 / 255, 26 / 255),
    borderColor: rgb(35 / 255, 35 / 255, 48 / 255),
    borderWidth: 1
  });

  page.drawText('Reception Verification: Show pass upon arrival for automated check-in logging.', {
    x: 28,
    y: 65,
    size: 6.8,
    font: fontRegular,
    color: rgb(140 / 255, 145 / 255, 160 / 255)
  });

  // Footer Bar
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: 36,
    color: rgb(14 / 255, 14 / 255, 20 / 255)
  });

  page.drawRectangle({
    x: 0,
    y: 35,
    width,
    height: 1,
    color: rgb(30 / 255, 30 / 255, 42 / 255)
  });

  page.drawText('IEDC GPTC PMNA • INNOVATION CELL VERIFIED PASS', {
    x: 18,
    y: 14,
    size: 7,
    font: fontBold,
    color: rgb(130 / 255, 135 / 255, 150 / 255)
  });

  page.drawText(`Issued: ${new Date().toISOString().split('T')[0]}`, {
    x: width - 85,
    y: 14,
    size: 7,
    font: fontRegular,
    color: rgb(100 / 255, 105 / 255, 120 / 255)
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generates an authentic companion PNG entry pass image (1200 x 1860 px).
 * Features self-contained embedded TrueType font data to prevent tofu/squares
 * on serverless Linux environments.
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
  const dateStr = event.date || reg.eventDate || 'Date Announced Soon';
  const timeStr = event.time || reg.eventTime || '10:00 AM - 04:00 PM';
  const venueStr = event.venue || reg.eventVenue || 'IEDC Hall, GPTC PMNA';
  const eventCategory = (event.category || 'OFFICIAL PROGRAM').toUpperCase();

  const studentName = (reg.studentName || 'Student Participant').toUpperCase();
  const regCode = reg.registrationCode || reg.id;
  const deptInfo = `${reg.department || reg.branch || 'General'} • ${reg.academicYear || ''}`.trim().replace(/^ • | • $/g, '');
  const collegeName = reg.collegeName || 'Govt Polytechnic College Perinthalmanna';
  const statusStr = (reg.status || 'Confirmed').toUpperCase();
  const isWaitlisted = statusStr.includes('WAIT');

  const fontBase64 = getEmbeddedFontBase64();

  const svgTemplate = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${
          fontBase64
            ? `<style>
                @font-face {
                  font-family: 'PassFont';
                  src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
                  font-weight: normal;
                  font-style: normal;
                }
                .font-pass { font-family: 'PassFont', -apple-system, sans-serif; }
              </style>`
            : `<style>.font-pass { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }</style>`
        }
        <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#F98A5B"/>
          <stop offset="50%" stop-color="#EC3A74"/>
          <stop offset="100%" stop-color="#6249A3"/>
        </linearGradient>
      </defs>

      <!-- Background Canvas -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="#0B0B0F"/>

      <!-- Decorative Top Stripe -->
      <rect x="0" y="0" width="${width}" height="10" fill="url(#headerGrad)"/>

      <!-- Header Section Background -->
      <rect x="0" y="10" width="${width}" height="240" fill="#12121A"/>
      <line x1="0" y1="250" x2="${width}" y2="250" stroke="#262636" stroke-width="2"/>

      <!-- Header Typography -->
      <text x="210" y="85" class="font-pass" font-weight="bold" font-size="28" fill="#FFFFFF" letter-spacing="1">
        GOVT POLYTECHNIC COLLEGE PERINTHALMANNA
      </text>
      <text x="210" y="125" class="font-pass" font-weight="normal" font-size="22" fill="#9CA3AF">
        INNOVATION &amp; ENTREPRENEURSHIP DEVELOPMENT CENTRE
      </text>
      <text x="210" y="170" class="font-pass" font-weight="bold" font-size="24" fill="#F98A5B" letter-spacing="2">
        OFFICIAL EVENT ENTRY PASS
      </text>

      <!-- Event Details Card (#14141D) -->
      <rect x="60" y="290" width="1080" height="230" rx="20" fill="#14141D" stroke="#2A2A38" stroke-width="2"/>

      <!-- Category Pill -->
      <rect x="90" y="325" width="${Math.min(500, Math.max(180, eventCategory.length * 12 + 40))}" height="36" rx="8" fill="#F98A5B" fill-opacity="0.12" stroke="#F98A5B" stroke-opacity="0.3" stroke-width="1.5"/>
      <text x="${90 + Math.min(500, Math.max(180, eventCategory.length * 12 + 40)) / 2}" y="349" class="font-pass" font-weight="bold" font-size="15" fill="#F98A5B" text-anchor="middle" letter-spacing="1.5">
        ${escapeXml(eventCategory)}
      </text>

      <!-- Event Title -->
      <text x="90" y="405" class="font-pass" font-weight="bold" font-size="36" fill="#FFFFFF" letter-spacing="0.5">
        ${escapeXml(eventTitle.length > 40 ? eventTitle.substring(0, 37) + '...' : eventTitle)}
      </text>

      <!-- Date, Time, Venue -->
      <text x="90" y="455" class="font-pass" font-weight="normal" font-size="22" fill="#E2E8F0">
        Date: ${escapeXml(dateStr)}   |   Time: ${escapeXml(timeStr)}
      </text>
      <text x="90" y="495" class="font-pass" font-weight="bold" font-size="22" fill="#F98A5B">
        Venue: ${escapeXml(venueStr)}
      </text>

      <!-- Participant Detail Card (#14141D) -->
      <rect x="60" y="550" width="1080" height="340" rx="24" fill="#14141D" stroke="#2D2D3E" stroke-width="2"/>

      <!-- Status Badge -->
      <rect x="880" y="585" width="220" height="54" rx="27"
        fill="${isWaitlisted ? '#3D2806' : '#0A3320'}"
        stroke="${isWaitlisted ? '#F59E0B' : '#10B981'}"
        stroke-width="2"
      />
      <text x="990" y="620" class="font-pass" font-weight="bold" font-size="20"
        fill="${isWaitlisted ? '#FBBF24' : '#34D399'}"
        text-anchor="middle" letter-spacing="1">
        ${escapeXml(isWaitlisted ? `WAITLIST #${reg.waitlistPosition || 1}` : 'CONFIRMED')}
      </text>

      <!-- Participant Name -->
      <text x="110" y="610" class="font-pass" font-weight="bold" font-size="18" fill="#9CA3AF" letter-spacing="1.5">
        PARTICIPANT NAME
      </text>
      <text x="110" y="660" class="font-pass" font-weight="bold" font-size="38" fill="#FFFFFF" letter-spacing="1">
        ${escapeXml(studentName)}
      </text>

      <!-- Registration ID -->
      <text x="110" y="730" class="font-pass" font-weight="bold" font-size="18" fill="#9CA3AF" letter-spacing="1.5">
        REGISTRATION ID / PASS CODE
      </text>
      <text x="110" y="775" class="font-pass" font-weight="bold" font-size="32" fill="#F98A5B" letter-spacing="2">
        ${escapeXml(regCode)}
      </text>

      <!-- Branch & Institution -->
      <text x="110" y="825" class="font-pass" font-weight="normal" font-size="22" fill="#CBD5E1">
        ${escapeXml(deptInfo)}
      </text>
      <text x="110" y="860" class="font-pass" font-weight="normal" font-size="20" fill="#94A3B8">
        ${escapeXml(collegeName)}
      </text>

      <!-- High-Contrast QR Code Card -->
      <rect x="360" y="930" width="480" height="480" rx="28" fill="#FFFFFF" stroke="#F98A5B" stroke-width="4"/>

      <!-- QR Instructions -->
      <text x="600" y="1465" class="font-pass" font-weight="bold" font-size="26" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.5">
        ENTRY VERIFICATION • SCAN AT RECEPTION
      </text>
      <text x="600" y="1510" class="font-pass" font-weight="normal" font-size="20" fill="#9CA3AF" text-anchor="middle">
        Please present this digital pass on your phone or printout at the entrance desk.
      </text>

      <!-- Verification Notice Card -->
      <rect x="60" y="1560" width="1080" height="130" rx="18" fill="#14141D" stroke="#252535" stroke-width="1.5"/>
      <text x="100" y="1610" class="font-pass" font-weight="bold" font-size="22" fill="#FFFFFF">
        Reception Desk Verification Notice
      </text>
      <text x="100" y="1650" class="font-pass" font-weight="normal" font-size="19" fill="#94A3B8">
        Your attendance will be verified and authenticated in the official registry upon scanning this QR pass.
      </text>

      <!-- Footer Bar -->
      <rect x="0" y="1740" width="${width}" height="120" fill="#0E0E14"/>
      <line x1="0" y1="1740" x2="${width}" y2="1740" stroke="#252535" stroke-width="2"/>
      <text x="60" y="1805" class="font-pass" font-weight="bold" font-size="22" fill="#6B7280" letter-spacing="1">
        IEDC GPTC PMNA • INNOVATION CELL VERIFIED PASS
      </text>
      <text x="1140" y="1805" class="font-pass" font-weight="normal" font-size="20" fill="#6B7280" text-anchor="end">
        Issued: ${new Date().toISOString().split('T')[0]}
      </text>
    </svg>
  `;

  // Base sharp canvas
  let baseSharp = sharp(Buffer.from(svgTemplate));

  // Overlays (QR code and institutional logos)
  const overlays: any[] = [];

  // 1. QR Code onto white card (center: 360 + 30 = 390, top: 930 + 30 = 960, size: 420x420)
  overlays.push({
    input: await sharp(qrPngBytes).resize(420, 420).toBuffer(),
    top: 960,
    left: 390
  });

  // 2. College Logo
  const collegeLogoPath = path.join(process.cwd(), 'public', 'college-logo.png');
  if (fs.existsSync(collegeLogoPath)) {
    try {
      const resizedLogo = await sharp(collegeLogoPath)
        .resize(110, 110, { fit: 'inside' })
        .png({ quality: 90 })
        .toBuffer();
      overlays.push({
        input: resizedLogo,
        top: 60,
        left: 65
      });
    } catch {}
  }

  // 3. IEDC Logo
  const iedcLogoPath = path.join(process.cwd(), 'public', 'iedc-gptc-pmna-logo.png');
  if (fs.existsSync(iedcLogoPath)) {
    try {
      const resizedIedc = await sharp(iedcLogoPath)
        .resize(130, 110, { fit: 'inside' })
        .png({ quality: 90 })
        .toBuffer();
      overlays.push({
        input: resizedIedc,
        top: 60,
        left: 1005
      });
    } catch {}
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
  try {
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
  } catch (fsErr) {
    try {
      const tmpPasses = path.join(os.tmpdir(), 'passes');
      if (!fs.existsSync(tmpPasses)) {
        fs.mkdirSync(tmpPasses, { recursive: true });
      }
      const tmpPdf = path.join(tmpPasses, `${reg.id}.pdf`);
      const tmpPng = path.join(tmpPasses, `${reg.id}.png`);
      if (!fs.existsSync(tmpPdf)) {
        const pdfBuf = await generatePassPdf(reg, event);
        fs.writeFileSync(tmpPdf, pdfBuf);
      }
      if (!fs.existsSync(tmpPng)) {
        const pngBuf = await generatePassPng(reg, event);
        fs.writeFileSync(tmpPng, pngBuf);
      }
    } catch {}
  }

  return {
    pdfUrl: `/api/public/registrations/${reg.id}/pass/pdf`,
    pngUrl: `/api/public/registrations/${reg.id}/pass/png`
  };
}

/**
 * Generates companion JPG entry pass image.
 */
export async function generatePassJpg(
  reg: PassRegistrationData,
  event: PassEventData
): Promise<Buffer> {
  const pngBuffer = await generatePassPng(reg, event);
  return sharp(pngBuffer).jpeg({ quality: 95 }).toBuffer();
}
