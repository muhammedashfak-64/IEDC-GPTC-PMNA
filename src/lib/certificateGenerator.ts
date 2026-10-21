import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { supabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';

export interface CertificateGenerateParams {
  certificateId: string;
  recipientName: string;
  programName: string;
  programDate: string;
  organizingBody?: string;
  certificateHeading?: string; // 'CERTIFICATE'
  certificateSubtitle?: string; // e.g. '— OF PARTICIPATION —' or '— OF ACHIEVEMENT —'
  recipientIntro?: string; // 'THIS CERTIFICATE IS PRESENTED TO' or 'THIS CERTIFICATE IS AWARDED TO'
  customParagraph?: string;
  role?: string; // 'Participant' | 'Winner' | 'First Prize' | 'Runner-up' | 'Student Lead' | 'Coordinator'
  certificateType?: 'Participation' | 'Achievement' | 'Winner' | string;
  awardCategory?: string; // 'Winner' | 'First Prize' | 'Second Prize' | 'Third Prize' | 'Special Award' | 'Custom Achievement'
  achievementDescription?: string;
  recipientPhotoUrl?: string; // optional recipient photo path or URL
  customTemplatePath?: string;
}

export interface CertificateConfig {
  nameX?: number; // if undefined, centered
  nameY: number; // default 305
  nameFontSize: number; // default 32
  nameColor: string | [number, number, number]; // Hex string or RGB 0-1
  paraX?: number; // if undefined, auto-aligned within paraMaxWidth
  paraY: number; // default 252
  paraFontSize: number; // default 12
  paraLineSpacing: number; // default 17
  paraMaxWidth: number; // default 580
  paraColor: string | [number, number, number]; // Hex string or RGB 0-1
  paraAlign?: 'center' | 'left' | 'right'; // default 'center'
  paraBold?: boolean; // default false
  showCertId: boolean; // default true
  certIdY: number; // default 45
  // Type B Header Positions
  subtitleY?: number; // default 398
  introY?: number; // default 363
  // Optional Recipient Photo
  showPhoto?: boolean; // default false
  photoX?: number; // default 670
  photoY?: number; // default 240
  photoWidth?: number; // default 75
  photoHeight?: number; // default 95
}

export const DEFAULT_CERT_CONFIG: CertificateConfig = {
  nameY: 305,
  nameFontSize: 32,
  nameColor: [139 / 255, 0, 0],
  paraX: undefined,
  paraY: 252,
  paraFontSize: 12,
  paraLineSpacing: 17,
  paraMaxWidth: 580,
  paraColor: [31 / 255, 41 / 255, 55 / 255],
  paraAlign: 'center',
  paraBold: false,
  showCertId: true,
  certIdY: 45,
  subtitleY: 398,
  introY: 363,
  showPhoto: false,
  photoX: 670,
  photoY: 240,
  photoWidth: 75,
  photoHeight: 95
};

const NAMED_COLORS: Record<string, [number, number, number]> = {
  red: [1, 0, 0],
  darkred: [139 / 255, 0, 0],
  maroon: [139 / 255, 0, 0],
  navy: [26 / 255, 36 / 255, 86 / 255],
  blue: [0, 0, 1],
  black: [0, 0, 0],
  white: [1, 1, 1],
  gray: [0.5, 0.5, 0.5],
  darkgray: [0.2, 0.2, 0.2],
  green: [0, 0.5, 0],
  gold: [218 / 255, 165 / 255, 32 / 255],
  charcoal: [31 / 255, 41 / 255, 55 / 255]
};

/**
 * Safely parse any color representation (hex string #RRGGBB, #RGB, named color, rgb(...) string, object, or array of numbers)
 * into a valid pdf-lib RGB tuple: [r, g, b] where each channel is a float between 0.0 and 1.0.
 * Prevents errors like "'red' must be of type 'number', but was actually of type 'string'".
 */
export function normalizeColorToRgb(
  color: any,
  fallback: [number, number, number] = [139 / 255, 0, 0]
): [number, number, number] {
  if (!color) return fallback;

  // Case 1: Object with red/green/blue or r/g/b keys
  if (typeof color === 'object' && !Array.isArray(color)) {
    const rawR = color.red !== undefined ? color.red : color.r;
    const rawG = color.green !== undefined ? color.green : color.g;
    const rawB = color.blue !== undefined ? color.blue : color.b;

    if (rawR !== undefined && rawG !== undefined && rawB !== undefined) {
      const numR = parseFloat(String(rawR));
      const numG = parseFloat(String(rawG));
      const numB = parseFloat(String(rawB));
      if (!isNaN(numR) && !isNaN(numG) && !isNaN(numB)) {
        const r = numR > 1.0 ? Math.min(1, Math.max(0, numR / 255)) : Math.min(1, Math.max(0, numR));
        const g = numG > 1.0 ? Math.min(1, Math.max(0, numG / 255)) : Math.min(1, Math.max(0, numG));
        const b = numB > 1.0 ? Math.min(1, Math.max(0, numB / 255)) : Math.min(1, Math.max(0, numB));
        return [r, g, b];
      }
    }
  }

  // Case 2: Array of numbers
  if (Array.isArray(color) && color.length >= 3) {
    const isAlready01 = color.slice(0, 3).every(
      (c) => typeof c === 'number' && !isNaN(c) && c >= 0 && c <= 1.0
    );
    if (isAlready01) {
      return [Number(color[0]), Number(color[1]), Number(color[2])];
    }
    const r = Math.min(1, Math.max(0, Number(color[0]) / 255));
    const g = Math.min(1, Math.max(0, Number(color[1]) / 255));
    const b = Math.min(1, Math.max(0, Number(color[2]) / 255));
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return [r, g, b];
    }
  }

  // Case 3: String
  if (typeof color === 'string') {
    const str = color.trim().toLowerCase();

    // Named color lookup
    if (NAMED_COLORS[str]) {
      return NAMED_COLORS[str];
    }

    // Hex string
    const hex = str.replace(/^#/, '');
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b];
    } else if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16) / 255;
      const g = parseInt(hex[1] + hex[1], 16) / 255;
      const b = parseInt(hex[2] + hex[2], 16) / 255;
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b];
    }

    // rgb(r, g, b) string
    const rgbMatch = str.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgbMatch) {
      const r = Math.min(1, Math.max(0, parseInt(rgbMatch[1], 10) / 255));
      const g = Math.min(1, Math.max(0, parseInt(rgbMatch[2], 10) / 255));
      const b = Math.min(1, Math.max(0, parseInt(rgbMatch[3], 10) / 255));
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b];
    }
  }

  return fallback;
}

/**
 * Safely parse numbers from inputs or JSON, rejecting NaN and keeping within boundaries.
 */
export function normalizeNumber(
  val: any,
  fallback: number,
  min: number = -Infinity,
  max: number = Infinity
): number {
  if (val === undefined || val === null || val === '') return fallback;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num) || !isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

/**
 * Word wrap helper for PDF canvas text that respects explicit newlines
 * while soft-wrapping lines exceeding maxWidth.
 */
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  if (!text) return [];
  const paragraphs = text.split(/\r?\n/);
  const resultLines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      resultLines.push('');
      continue;
    }
    const words = paragraph.split(/\s+/).filter(Boolean);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) resultLines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) resultLines.push(currentLine);
  }

  return resultLines;
}

/**
 * Generate a high-resolution PDF certificate preserving the official master design
 */
export async function generateSingleCertificatePdf(
  params: CertificateGenerateParams,
  config: Partial<CertificateConfig> = {}
): Promise<{ pdfBytes: Uint8Array; fileName: string; storagePath: string; publicUrl?: string }> {
  // Normalize all configuration values safely
  const defaultNameColor = Array.isArray(DEFAULT_CERT_CONFIG.nameColor)
    ? DEFAULT_CERT_CONFIG.nameColor
    : [139 / 255, 0, 0];
  const defaultParaColor = Array.isArray(DEFAULT_CERT_CONFIG.paraColor)
    ? DEFAULT_CERT_CONFIG.paraColor
    : [31 / 255, 41 / 255, 55 / 255];

  const cfg = {
    nameX: config.nameX !== undefined && config.nameX !== null && !isNaN(Number(config.nameX)) && Number(config.nameX) !== 0 ? normalizeNumber(config.nameX, 0) : undefined,
    nameY: normalizeNumber(config.nameY, DEFAULT_CERT_CONFIG.nameY),
    nameFontSize: normalizeNumber(config.nameFontSize, DEFAULT_CERT_CONFIG.nameFontSize, 10, 60),
    nameColor: normalizeColorToRgb(config.nameColor, defaultNameColor as [number, number, number]),
    paraX: config.paraX !== undefined && config.paraX !== null && !isNaN(Number(config.paraX)) && Number(config.paraX) !== 0 ? normalizeNumber(config.paraX, 0) : undefined,
    paraY: normalizeNumber(config.paraY, DEFAULT_CERT_CONFIG.paraY),
    paraFontSize: normalizeNumber(config.paraFontSize, DEFAULT_CERT_CONFIG.paraFontSize, 8, 30),
    paraLineSpacing: normalizeNumber(config.paraLineSpacing, DEFAULT_CERT_CONFIG.paraLineSpacing, 10, 50),
    paraMaxWidth: normalizeNumber(config.paraMaxWidth, DEFAULT_CERT_CONFIG.paraMaxWidth, 200, 800),
    paraColor: normalizeColorToRgb(config.paraColor, defaultParaColor as [number, number, number]),
    paraAlign: (config.paraAlign === 'left' || config.paraAlign === 'right' ? config.paraAlign : 'center') as 'center' | 'left' | 'right',
    paraBold: Boolean(config.paraBold),
    showCertId: config.showCertId !== undefined ? Boolean(config.showCertId) : DEFAULT_CERT_CONFIG.showCertId,
    certIdY: normalizeNumber(config.certIdY, DEFAULT_CERT_CONFIG.certIdY),
    subtitleY: normalizeNumber(config.subtitleY, DEFAULT_CERT_CONFIG.subtitleY || 398),
    introY: normalizeNumber(config.introY, DEFAULT_CERT_CONFIG.introY || 363),
    showPhoto: Boolean(config.showPhoto),
    photoX: normalizeNumber(config.photoX, DEFAULT_CERT_CONFIG.photoX || 670),
    photoY: normalizeNumber(config.photoY, DEFAULT_CERT_CONFIG.photoY || 240),
    photoWidth: normalizeNumber(config.photoWidth, DEFAULT_CERT_CONFIG.photoWidth || 75),
    photoHeight: normalizeNumber(config.photoHeight, DEFAULT_CERT_CONFIG.photoHeight || 95)
  };

  // Determine Certificate Type: Type A (Participation) vs Type B (Achievement/Winner)
  const isTypeB =
    params.certificateType?.toLowerCase().includes('achievement') ||
    params.certificateType?.toLowerCase().includes('winner') ||
    params.certificateType?.toLowerCase().includes('prize') ||
    (params.role && params.role.toLowerCase().includes('winner'));

  // 1. Locate the master template
  const masterCleanPath = path.join(process.cwd(), 'public', 'templates', 'clean_master_template.pdf');
  const referencePath = path.join(process.cwd(), 'public', 'templates', 'reference_certificate.pdf');
  const masterPngPath = path.join(
    process.cwd(),
    'public',
    'uploads',
    'certificate-templates',
    'IEDC_PARTICIPATE_CERTICICATE_1792467393382.png'
  );

  let pdfDoc: PDFDocument;
  let page: any;
  let width: number;
  let height: number;

  let resolvedCustomPath = params.customTemplatePath;
  if (resolvedCustomPath && !fs.existsSync(/*turbopackIgnore: true*/ resolvedCustomPath)) {
    const candidateInPublic = path.join(process.cwd(), 'public', resolvedCustomPath.replace(/^\//, ''));
    if (fs.existsSync(candidateInPublic)) {
      resolvedCustomPath = candidateInPublic;
    }
  }

  const isCustomImage =
    resolvedCustomPath &&
    fs.existsSync(/*turbopackIgnore: true*/ resolvedCustomPath) &&
    (resolvedCustomPath.endsWith('.png') || resolvedCustomPath.endsWith('.jpg') || resolvedCustomPath.endsWith('.jpeg'));

  if (isCustomImage && resolvedCustomPath) {
    // Image-based template: Create new landscape PDF (A4 842.25 x 595.5 pt) and embed template image
    pdfDoc = await PDFDocument.create();
    width = 842.25;
    height = 595.5;
    page = pdfDoc.addPage([width, height]);

    const imgBytes = fs.readFileSync(/*turbopackIgnore: true*/ resolvedCustomPath);
    const bgImage = resolvedCustomPath.endsWith('.png')
      ? await pdfDoc.embedPng(imgBytes)
      : await pdfDoc.embedJpg(imgBytes);

    page.drawImage(bgImage, { x: 0, y: 0, width, height });

    // Clean whiteout over recipient name & paragraph if an existing populated template was uploaded
    page.drawRectangle({
      x: 110,
      y: 190,
      width: width - 220,
      height: 155,
      color: rgb(1, 1, 1)
    });
  } else {
    // Vector PDF Master: clean_master_template.pdf or reference_certificate.pdf
    let templateBytes: Buffer;
    if (resolvedCustomPath && fs.existsSync(/*turbopackIgnore: true*/ resolvedCustomPath) && resolvedCustomPath.endsWith('.pdf')) {
      templateBytes = fs.readFileSync(/*turbopackIgnore: true*/ resolvedCustomPath);
    } else if (fs.existsSync(masterCleanPath)) {
      templateBytes = fs.readFileSync(masterCleanPath);
    } else if (fs.existsSync(referencePath)) {
      templateBytes = fs.readFileSync(referencePath);
    } else {
      throw new Error('Official Certificate Master Template not found on server.');
    }

    pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    page = pages[0];
    const size = page.getSize();
    width = size.width;
    height = size.height;
  }

  // Embed standard Helvetica fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 2. Type B Header Replacement (if Certificate of Achievement / Winner)
  if (isTypeB) {
    // Cleanly cover the original "— OF PARTICIPATION —" and "THIS CERTIFICATE IS PRESENTED TO" lines
    page.drawRectangle({
      x: 180,
      y: 350,
      width: width - 360,
      height: 75,
      color: rgb(1, 1, 1)
    });

    const subTitle = params.certificateSubtitle || '— OF ACHIEVEMENT —';
    const subWidth = fontBold.widthOfTextAtSize(subTitle, 13);
    page.drawText(subTitle, {
      x: (width - subWidth) / 2,
      y: cfg.subtitleY || 398,
      size: 13,
      font: fontBold,
      color: rgb(26 / 255, 36 / 255, 86 / 255) // Official IEDC Navy Blue
    });

    const intro = params.recipientIntro || 'THIS CERTIFICATE IS AWARDED TO';
    const introWidth = fontRegular.widthOfTextAtSize(intro, 11);
    page.drawText(intro, {
      x: (width - introWidth) / 2,
      y: cfg.introY || 363,
      size: 11,
      font: fontRegular,
      color: rgb(31 / 255, 41 / 255, 55 / 255)
    });
  }

  // 3. Recipient Name
  const cleanName = params.recipientName.trim().toUpperCase();
  let nameSize = cfg.nameFontSize;
  let nameWidth = fontBold.widthOfTextAtSize(cleanName, nameSize);

  // Dynamically shrink font size if name is particularly long
  const maxNameWidth = width - 240;
  if (nameWidth > maxNameWidth) {
    nameSize = Math.max(20, (maxNameWidth / nameWidth) * nameSize);
    nameWidth = fontBold.widthOfTextAtSize(cleanName, nameSize);
  }

  const nameX = cfg.nameX !== undefined ? cfg.nameX : (width - nameWidth) / 2;
  page.drawText(cleanName, {
    x: nameX,
    y: cfg.nameY,
    size: nameSize,
    font: fontBold,
    color: rgb(cfg.nameColor[0], cfg.nameColor[1], cfg.nameColor[2])
  });

  // 4. Construct Dynamic Paragraph Text
  let paraText = params.customParagraph;
  const orgBody = params.organizingBody || 'the IEDC Cell, Government Polytechnic College Perinthalmanna';

  if (!paraText) {
    if (isTypeB) {
      const category = params.awardCategory || params.role || 'Winner';
      paraText = `In recognition of your outstanding achievement as ${category} in the ${params.programName}, organized by ${orgBody}, held on ${params.programDate}.`;
    } else {
      const roleText = params.role && params.role !== 'Participant' ? ` as ${params.role}` : '';
      paraText = `In recognition of your outstanding participation and dedication${roleText} in the ${params.programName}, organized by ${orgBody}, held on ${params.programDate}.`;
    }
  }

  // 5. Word-wrap and draw paragraph lines with alignment and font styling
  const fontForPara = cfg.paraBold ? fontBold : fontRegular;
  const paraLines = wrapText(paraText, cfg.paraMaxWidth, fontForPara, cfg.paraFontSize);
  let currentY = cfg.paraY;
  for (const line of paraLines) {
    if (!line) {
      currentY -= cfg.paraLineSpacing;
      continue;
    }
    const lineWidth = fontForPara.widthOfTextAtSize(line, cfg.paraFontSize);
    let lineX: number;
    if (cfg.paraAlign === 'left') {
      lineX = cfg.paraX !== undefined && cfg.paraX > 0 ? cfg.paraX : (width - cfg.paraMaxWidth) / 2;
    } else if (cfg.paraAlign === 'right') {
      const rightEdge = cfg.paraX !== undefined && cfg.paraX > 0 ? cfg.paraX : (width + cfg.paraMaxWidth) / 2;
      lineX = rightEdge - lineWidth;
    } else {
      // centered
      lineX = cfg.paraX !== undefined && cfg.paraX > 0 ? cfg.paraX - lineWidth / 2 : (width - lineWidth) / 2;
    }

    page.drawText(line, {
      x: lineX,
      y: currentY,
      size: cfg.paraFontSize,
      font: fontForPara,
      color: rgb(cfg.paraColor[0], cfg.paraColor[1], cfg.paraColor[2])
    });
    currentY -= cfg.paraLineSpacing;
  }

  // 6. Optional Recipient Photograph (Only if explicitly enabled)
  if (cfg.showPhoto && params.recipientPhotoUrl) {
    try {
      let photoBytes: Buffer | null = null;
      if (params.recipientPhotoUrl.startsWith('http')) {
        const photoRes = await fetch(params.recipientPhotoUrl);
        if (photoRes.ok) {
          photoBytes = Buffer.from(await photoRes.arrayBuffer());
        }
      } else {
        const localPath = path.join(process.cwd(), 'public', params.recipientPhotoUrl.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          photoBytes = fs.readFileSync(localPath);
        }
      }

      if (photoBytes) {
        let photoImg: any = null;
        try {
          photoImg = await pdfDoc.embedPng(photoBytes);
        } catch {
          photoImg = await pdfDoc.embedJpg(photoBytes);
        }

        if (photoImg) {
          const pWidth = cfg.photoWidth || 75;
          const pHeight = cfg.photoHeight || 95;
          const px = cfg.photoX || 670;
          const py = cfg.photoY || 240;

          // Subtle photo border
          page.drawRectangle({
            x: px - 2,
            y: py - 2,
            width: pWidth + 4,
            height: pHeight + 4,
            color: rgb(0.9, 0.9, 0.9)
          });

          page.drawImage(photoImg, {
            x: px,
            y: py,
            width: pWidth,
            height: pHeight
          });
        }
      }
    } catch (e: any) {
      console.warn('Optional recipient photo could not be embedded:', e.message);
    }
  }

  // 7. Draw Official Certificate ID
  if (cfg.showCertId && params.certificateId) {
    const certIdText = `CERTIFICATE ID: ${params.certificateId}`;
    const idWidth = fontRegular.widthOfTextAtSize(certIdText, 8.5);
    page.drawText(certIdText, {
      x: (width - idWidth) / 2,
      y: cfg.certIdY,
      size: 8.5,
      font: fontRegular,
      color: rgb(156 / 255, 163 / 255, 175 / 255)
    });
  }

  // 8. Output PDF
  const pdfBytes = await pdfDoc.save();
  const fileName = `${params.certificateId}.pdf`;
  const storagePath = `certificates/${fileName}`;

  // 9. Save local mirror copy in public/certificates/
  const localOutputDir = path.join(process.cwd(), 'public', 'certificates');
  if (!fs.existsSync(localOutputDir)) {
    fs.mkdirSync(localOutputDir, { recursive: true });
  }
  const localFilePath = path.join(localOutputDir, fileName);
  fs.writeFileSync(localFilePath, pdfBytes);

  // 10. Upload to Supabase Storage if configured
  let publicUrl = `/certificates/${fileName}`;
  if (isSupabaseAdminConfigured()) {
    try {
      const uploadPromise = supabaseAdmin.storage
        .from('certificates')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        });
      const timeoutPromise = new Promise<{ error: any }>((resolve) =>
        setTimeout(() => resolve({ error: new Error('Upload timed out after 5s') }), 5000)
      );
      const { error: uploadErr } = await Promise.race([uploadPromise, timeoutPromise]);

      if (!uploadErr) {
        const { data: urlData } = supabaseAdmin.storage
          .from('certificates')
          .getPublicUrl(fileName);
        if (urlData?.publicUrl) {
          publicUrl = urlData.publicUrl;
        }
      } else {
        console.warn('Supabase storage upload warning (using local mirror):', uploadErr.message);
      }
    } catch (e: any) {
      console.warn('Supabase storage exception (using local mirror):', e.message);
    }
  }

  return {
    pdfBytes,
    fileName,
    storagePath,
    publicUrl
  };
}
