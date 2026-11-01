import fs from 'fs';
import path from 'path';
import os from 'os';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';
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
 * Generates an authoritative QR code data payload for entry check-in.
 * Contains verifiable identifiers compatible with admin scanner:
 * IEDCPASS:{eventId}:{registrationCode}:{passToken}
 */
export function getPassQrPayload(reg: PassRegistrationData): string {
  if (reg.qrPayload) return reg.qrPayload;
  const token = reg.passToken || `pass_${Buffer.from(reg.id).toString('hex').slice(0, 24)}`;
  return `IEDCPASS:${reg.eventId}:${reg.registrationCode || reg.id}:${token}`;
}

/**
 * Generates a high-contrast QR code Data URL (PNG base64).
 * Uses Level M error correction for high scannability and robustness.
 */
export async function generatePassQrDataUrl(reg: PassRegistrationData): Promise<string> {
  const payload = getPassQrPayload(reg);
  return QRCode.toDataURL(payload, {
    width: 600,
    margin: 1,
    color: {
      dark: '#0B0B0D',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  });
}

// Escape XML characters for SVG templates
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

// Cached Base64 TrueType font to guarantee vector glyph rendering on serverless Linux
let cachedEmbeddedFontBase64 = '';
function getEmbeddedFontBase64(): string {
  if (cachedEmbeddedFontBase64) return cachedEmbeddedFontBase64;
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'fonts', 'Geist-Regular.ttf'),
    path.join(process.cwd(), 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og', 'Geist-Regular.ttf')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        cachedEmbeddedFontBase64 = fs.readFileSync(p).toString('base64');
        break;
      } catch {}
    }
  }
  return cachedEmbeddedFontBase64;
}

/**
 * Generates an authentic, high-quality companion PNG entry pass image (1200 x 1620 px).
 * Features:
 * - Official IEDC brand palette (#F98A5B, #EC3A74, #6249A3) on Deep Midnight Obsidian (#0B0B0F)
 * - Modern sans-serif typography hierarchy
 * - Compact, well-aligned participant information section
 * - 55px+ clear visual buffer preventing any overlap with the QR code
 * - Dedicated rounded white QR code container with IEDC orange border and ample quiet zone
 * - Verified attendance scanning instructions and reception verification notice
 */
export async function generatePassPng(
  reg: PassRegistrationData,
  event: PassEventData
): Promise<Buffer> {
  const qrDataUrl = await generatePassQrDataUrl(reg);
  const qrPngBytes = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');

  const width = 1200;
  const height = 1620;

  const eventTitle = (event.title || reg.eventTitle || 'Campus Innovation Event').toUpperCase();
  const dateStr = event.date || reg.eventDate || 'Date Announced Soon';
  const timeStr = event.time || reg.eventTime || '10:00 AM - 04:00 PM';
  const venueStr = event.venue || reg.eventVenue || 'IEDC Innovation Lab, GPTC PMNA';
  const eventCategory = (event.category || reg.participationCategory || 'OFFICIAL PROGRAM').toUpperCase();

  const studentName = (reg.studentName || 'Student Participant').toUpperCase();
  const regCode = reg.registrationCode || reg.id;
  const dept = reg.department || reg.branch || 'General';
  const yearSem = reg.semester ? `${reg.academicYear || ''} • Sem ${reg.semester}`.trim().replace(/^• | •$/g, '') : (reg.academicYear || 'All Batches');
  const collegeName = reg.collegeName || 'Govt Polytechnic College Perinthalmanna';
  const statusStr = (reg.status || 'Confirmed').toUpperCase();
  const isWaitlisted = statusStr.includes('WAIT');

  // Dynamic font sizing for long titles and names to avoid overflow
  const nameFontSize = studentName.length > 24 ? 26 : studentName.length > 18 ? 30 : 34;
  const titleFontSize = eventTitle.length > 40 ? 26 : eventTitle.length > 30 ? 29 : 32;

  const embeddedFontBase64 = getEmbeddedFontBase64();

  const svgTemplate = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${
          embeddedFontBase64
            ? `<style>
                @font-face {
                  font-family: 'EmbeddedGeist';
                  src: url('data:font/truetype;charset=utf-8;base64,${embeddedFontBase64}') format('truetype');
                  font-weight: 400;
                  font-style: normal;
                }
                @font-face {
                  font-family: 'EmbeddedGeist';
                  src: url('data:font/truetype;charset=utf-8;base64,${embeddedFontBase64}') format('truetype');
                  font-weight: 600;
                  font-style: normal;
                }
                @font-face {
                  font-family: 'EmbeddedGeist';
                  src: url('data:font/truetype;charset=utf-8;base64,${embeddedFontBase64}') format('truetype');
                  font-weight: 700;
                  font-style: normal;
                }
                @font-face {
                  font-family: 'EmbeddedGeist';
                  src: url('data:font/truetype;charset=utf-8;base64,${embeddedFontBase64}') format('truetype');
                  font-weight: 800;
                  font-style: normal;
                }
              </style>`
            : ''
        }

        <!-- Official IEDC Brand Gradient -->
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#F98A5B"/>
          <stop offset="50%" stop-color="#EC3A74"/>
          <stop offset="100%" stop-color="#6249A3"/>
        </linearGradient>

        <!-- Subtle Accent Glow for QR Card -->
        <filter id="qrGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="#F98A5B" flood-opacity="0.22"/>
        </filter>

        <style>
          .sans-bold { font-family: 'EmbeddedGeist', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, Helvetica, sans-serif; font-weight: 800; }
          .sans-semibold { font-family: 'EmbeddedGeist', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, Helvetica, sans-serif; font-weight: 600; }
          .sans-regular { font-family: 'EmbeddedGeist', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, Helvetica, sans-serif; font-weight: 400; }
          .font-mono { font-family: 'EmbeddedGeist', 'Consolas', 'Courier New', Monaco, monospace; font-weight: 800; }
        </style>
      </defs>

      <!-- Main Canvas Background: Deep Midnight Obsidian (#0B0B0F) -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="#0B0B0F"/>

      <!-- Top Accent Gradient Stripe: IEDC Brand Theme -->
      <rect x="0" y="0" width="${width}" height="8" fill="url(#brandGrad)"/>

      <!-- 1. INSTITUTIONAL HEADER -->
      <rect x="0" y="8" width="${width}" height="212" fill="#111118"/>
      <line x1="0" y1="220" x2="${width}" y2="220" stroke="#252538" stroke-width="2"/>

      <text x="600" y="85" class="sans-bold" font-size="24" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
        GOVT POLYTECHNIC COLLEGE PERINTHALMANNA
      </text>
      <text x="600" y="122" class="sans-semibold" font-size="18" fill="#9CA3AF" text-anchor="middle" letter-spacing="0.5">
        INNOVATION &amp; ENTREPRENEURSHIP DEVELOPMENT CENTRE
      </text>
      <text x="600" y="165" class="sans-bold" font-size="21" fill="#F98A5B" text-anchor="middle" letter-spacing="3">
        OFFICIAL EVENT ENTRY PASS
      </text>

      <!-- 2. EVENT INFORMATION CARD (#14141D) -->
      <rect x="60" y="250" width="1080" height="225" rx="24" fill="#14141D" stroke="#28283E" stroke-width="2"/>

      <!-- Category Pill -->
      <rect x="95" y="280" width="${Math.min(360, Math.max(180, eventCategory.length * 11 + 40))}" height="34" rx="10" fill="#F98A5B" fill-opacity="0.12" stroke="#F98A5B" stroke-opacity="0.4" stroke-width="1.5"/>
      <text x="${95 + Math.min(360, Math.max(180, eventCategory.length * 11 + 40)) / 2}" y="303" class="sans-bold" font-size="14" fill="#F98A5B" text-anchor="middle" letter-spacing="1.5">
        ${escapeXml(eventCategory)}
      </text>

      <!-- Status Badge -->
      <rect x="${isWaitlisted ? 875 : 905}" y="280" width="${isWaitlisted ? 190 : 160}" height="34" rx="17"
        fill="${isWaitlisted ? '#3D2806' : '#0A3320'}"
        stroke="${isWaitlisted ? '#F59E0B' : '#10B981'}"
        stroke-width="1.5"
      />
      <circle cx="${isWaitlisted ? 895 : 925}" cy="297" r="4" fill="${isWaitlisted ? '#FBBF24' : '#34D399'}"/>
      <text x="${isWaitlisted ? 975 : 995}" y="303" class="sans-bold" font-size="14"
        fill="${isWaitlisted ? '#FBBF24' : '#34D399'}"
        text-anchor="middle" letter-spacing="1">
        ${isWaitlisted ? `WAITLIST #${reg.waitlistPosition || 1}` : 'CONFIRMED'}
      </text>

      <!-- Event Title -->
      <text x="95" y="360" class="sans-bold" font-size="${titleFontSize}" fill="#FFFFFF" letter-spacing="0.5">
        ${escapeXml(eventTitle.length > 48 ? eventTitle.substring(0, 45) + '...' : eventTitle)}
      </text>

      <!-- Date, Time, Venue -->
      <text x="95" y="405" class="sans-regular" font-size="19" fill="#CBD5E1">
        Date: ${escapeXml(dateStr)}    |    Time: ${escapeXml(timeStr)}
      </text>
      <text x="95" y="440" class="sans-semibold" font-size="19" fill="#F98A5B">
        Venue: ${escapeXml(venueStr)}
      </text>

      <!-- 3. COMPACT PARTICIPANT DETAILS CARD (#14141D) -->
      <rect x="60" y="500" width="1080" height="260" rx="24" fill="#14141D" stroke="#28283E" stroke-width="2"/>

      <!-- Participant Name (Left Column) -->
      <text x="95" y="540" class="sans-bold" font-size="14" fill="#9CA3AF" letter-spacing="1.5">
        PARTICIPANT NAME
      </text>
      <text x="95" y="582" class="sans-bold" font-size="${nameFontSize}" fill="#FFFFFF" letter-spacing="1">
        ${escapeXml(studentName.length > 34 ? studentName.substring(0, 32) + '...' : studentName)}
      </text>

      <!-- Pass ID / Registration Code (Right Column) -->
      <text x="700" y="540" class="sans-bold" font-size="14" fill="#9CA3AF" letter-spacing="1.5">
        PASS ID / REGISTRATION NO
      </text>
      <text x="700" y="582" class="font-mono" font-size="30" fill="#F98A5B" letter-spacing="2">
        ${escapeXml(regCode)}
      </text>

      <!-- Internal Card Dividing Line -->
      <line x1="95" y1="615" x2="1085" y2="615" stroke="#242436" stroke-width="1.5"/>

      <!-- Department & Batch / Semester -->
      <text x="95" y="655" class="sans-regular" font-size="15" fill="#9CA3AF">
        Department / Branch:
      </text>
      <text x="270" y="655" class="sans-semibold" font-size="17" fill="#FFFFFF">
        ${escapeXml(dept.length > 32 ? dept.substring(0, 30) + '...' : dept)}
      </text>

      <text x="700" y="655" class="sans-regular" font-size="15" fill="#9CA3AF">
        Batch / Year:
      </text>
      <text x="810" y="655" class="sans-semibold" font-size="17" fill="#FFFFFF">
        ${escapeXml(yearSem)}
      </text>

      <!-- Institution & Reg No -->
      <text x="95" y="710" class="sans-regular" font-size="15" fill="#9CA3AF">
        Institution:
      </text>
      <text x="195" y="710" class="sans-semibold" font-size="17" fill="#E2E8F0">
        ${escapeXml(collegeName.length > 48 ? collegeName.substring(0, 45) + '...' : collegeName)}
      </text>

      <!-- 4. DEDICATED HIGH-CONTRAST QR CODE CARD WITH CLEAR BUFFER -->
      <!-- Visual Buffer: Participant card ends at y=760, QR card starts at y=815 (55px pure margin) -->
      <rect x="385" y="815" width="430" height="430" rx="28" fill="#FFFFFF" stroke="#F98A5B" stroke-width="4" filter="url(#qrGlow)"/>

      <!-- QR Instructions Underneath -->
      <text x="600" y="1295" class="sans-bold" font-size="23" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">
        SCAN FOR ENTRY VERIFICATION
      </text>
      <text x="600" y="1330" class="sans-regular" font-size="18" fill="#9CA3AF" text-anchor="middle">
        Present this pass at reception for automated attendance verification
      </text>

      <!-- 5. RECEPTION DESK VERIFICATION NOTICE -->
      <rect x="60" y="1380" width="1080" height="115" rx="18" fill="#14141D" stroke="#252538" stroke-width="1.5"/>
      <rect x="85" y="1402" width="5" height="70" rx="2.5" fill="url(#brandGrad)"/>

      <text x="110" y="1428" class="sans-bold" font-size="19" fill="#FFFFFF">
        Reception Desk Verification Notice
      </text>
      <text x="110" y="1462" class="sans-regular" font-size="16" fill="#94A3B8">
        Please present this pass on your phone or printout upon arrival. Attendance will be recorded instantly.
      </text>

      <!-- 6. FOOTER BAR -->
      <rect x="0" y="1525" width="${width}" height="95" fill="#0E0E14"/>
      <line x1="0" y1="1525" x2="${width}" y2="1525" stroke="#222234" stroke-width="2"/>

      <text x="65" y="1580" class="sans-bold" font-size="18" fill="#6B7280" letter-spacing="1">
        IEDC GPTC PMNA • INNOVATION CELL VERIFIED PASS
      </text>
      <text x="1135" y="1580" class="sans-regular" font-size="16" fill="#6B7280" text-anchor="end">
        Issued: ${new Date().toISOString().split('T')[0]} • Official Admission Token
      </text>
    </svg>
  `;

  const overlays: any[] = [];

  // 1. Center QR code onto the rounded white card
  // Card is at x=385, y=815, size=430x430.
  // Inner QR code is 370x370 with 30px quiet zone margin.
  // Left: 385 + 30 = 415, Top: 815 + 30 = 845.
  const resizedQr = await sharp(qrPngBytes).resize(370, 370).toBuffer();
  overlays.push({
    input: resizedQr,
    top: 845,
    left: 415
  });

  // 2. Institutional Crest (Left)
  const collegeLogoPath = path.join(process.cwd(), 'public', 'college-logo.png');
  if (fs.existsSync(collegeLogoPath)) {
    try {
      const resizedLogo = await sharp(collegeLogoPath)
        .resize(110, 110, { fit: 'inside' })
        .png({ quality: 90 })
        .toBuffer();
      overlays.push({
        input: resizedLogo,
        top: 55,
        left: 65
      });
    } catch {}
  }

  // 3. Official IEDC Logo (Right)
  const iedcLogoPath = path.join(process.cwd(), 'public', 'iedc-gptc-pmna-logo.png');
  if (fs.existsSync(iedcLogoPath)) {
    try {
      const resizedIedc = await sharp(iedcLogoPath)
        .resize(120, 110, { fit: 'inside' })
        .png({ quality: 90 })
        .toBuffer();
      overlays.push({
        input: resizedIedc,
        top: 55,
        left: 1015
      });
    } catch {}
  }

  return sharp(Buffer.from(svgTemplate))
    .composite(overlays)
    .png({ quality: 95 })
    .toBuffer();
}

/**
 * Generates an authentic, high-definition Event Entry Pass PDF.
 * Uses the exact same authoritative design, typography, brand colors,
 * quiet zone, and rounded QR card as the PNG version.
 * Standard event badge format: 400 x 540 pt (~5.55 x 7.5 inches).
 */
export async function generatePassPdf(
  reg: PassRegistrationData,
  event: PassEventData
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  // Standard vertical badge dimensions matching 1200 x 1620 ratio (400 x 540 pt)
  const width = 400;
  const height = 540;
  const page = pdfDoc.addPage([width, height]);

  // Document metadata
  pdfDoc.setTitle(`IEDC Entry Pass - ${reg.studentName || 'Participant'}`);
  pdfDoc.setAuthor('IEDC GPTC PMNA');
  pdfDoc.setSubject(`Official Entry Pass for ${reg.eventTitle || event.title || 'Event'}`);
  pdfDoc.setCreator('IEDC GPTC PMNA Event Admission System');
  pdfDoc.setKeywords(['IEDC', 'GPTC PMNA', 'Event Pass', reg.registrationCode || reg.id]);

  // Render the authoritative 300+ DPI pass image
  const pngBuffer = await generatePassPng(reg, event);
  const passImage = await pdfDoc.embedPng(pngBuffer);

  page.drawImage(passImage, {
    x: 0,
    y: 0,
    width,
    height
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
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

/**
 * Ensures pass PDF and PNG exist on filesystem for fast serving and caching.
 * Always writes the latest generated files to prevent serving outdated cache.
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

    const pdfBuf = await generatePassPdf(reg, event);
    fs.writeFileSync(pdfPath, pdfBuf);

    const pngBuf = await generatePassPng(reg, event);
    fs.writeFileSync(pngPath, pngBuf);
  } catch (fsErr) {
    try {
      const tmpPasses = path.join(os.tmpdir(), 'passes');
      if (!fs.existsSync(tmpPasses)) {
        fs.mkdirSync(tmpPasses, { recursive: true });
      }
      const tmpPdf = path.join(tmpPasses, `${reg.id}.pdf`);
      const tmpPng = path.join(tmpPasses, `${reg.id}.png`);

      const pdfBuf = await generatePassPdf(reg, event);
      fs.writeFileSync(tmpPdf, pdfBuf);

      const pngBuf = await generatePassPng(reg, event);
      fs.writeFileSync(tmpPng, pngBuf);
    } catch {}
  }

  return {
    pdfUrl: `/api/public/registrations/${reg.id}/pass/pdf`,
    pngUrl: `/api/public/registrations/${reg.id}/pass/png`
  };
}
