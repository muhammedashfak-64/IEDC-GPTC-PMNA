import fs from 'fs';
import path from 'path';
import os from 'os';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import sharp from 'sharp';
import { supabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';

/**
 * Safely resolves a certificate template path from a local file, public/ asset, or remote Supabase storage URL.
 * Automatically downloads and caches remote URLs to public/uploads/certificate-templates/ for local rendering.
 */
export async function resolveTemplateFile(templatePathOrUrl?: string): Promise<string | undefined> {
  if (!templatePathOrUrl || typeof templatePathOrUrl !== 'string') return undefined;
  const trimmed = templatePathOrUrl.trim();
  if (!trimmed) return undefined;

  // 1. Direct path check
  if (fs.existsSync(trimmed)) {
    return trimmed;
  }

  // 2. Relative to public/
  const candidateInPublic = path.join(process.cwd(), 'public', trimmed.replace(/^\//, ''));
  if (fs.existsSync(candidateInPublic)) {
    return candidateInPublic;
  }

  // 3. Match filename in public/uploads/certificate-templates/ or public/templates/
  const cleanUrl = trimmed.split('?')[0];
  const filename = path.basename(cleanUrl);
  if (filename) {
    const candidateUploads = path.join(process.cwd(), 'public', 'uploads', 'certificate-templates', filename);
    if (fs.existsSync(candidateUploads)) return candidateUploads;

    const candidateTemplates = path.join(process.cwd(), 'public', 'templates', filename);
    if (fs.existsSync(candidateTemplates)) return candidateTemplates;
  }

  // 4. If remote HTTP / HTTPS (Supabase Storage URL)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const res = await fetch(trimmed);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        let cachePath: string;
        try {
          const cacheDir = path.join(process.cwd(), 'public', 'uploads', 'certificate-templates');
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }
          cachePath = path.join(cacheDir, filename);
          fs.writeFileSync(cachePath, buffer);
        } catch {
          const tmpDir = path.join(os.tmpdir(), 'certificate-templates');
          if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
          }
          cachePath = path.join(tmpDir, filename);
          fs.writeFileSync(cachePath, buffer);
        }
        return cachePath;
      }
    } catch (err: any) {
      console.warn('Failed to fetch certificate template from URL:', trimmed, err.message);
    }
  }

  return undefined;
}

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
 * Safely create a pdf-lib RGB color where each component is strictly guaranteed to be a JavaScript number.
 * Permanently prevents errors like "'red' must be of type 'number', but was actually of type 'string'".
 */
export function safeRgb(r: any, g: any, b: any) {
  const numR = Math.min(1, Math.max(0, typeof r === 'number' && !isNaN(r) ? r : parseFloat(String(r || 0))));
  const numG = Math.min(1, Math.max(0, typeof g === 'number' && !isNaN(g) ? g : parseFloat(String(g || 0))));
  const numB = Math.min(1, Math.max(0, typeof b === 'number' && !isNaN(b) ? b : parseFloat(String(b || 0))));
  return rgb(isNaN(numR) ? 0 : numR, isNaN(numG) ? 0 : numG, isNaN(numB) ? 0 : numB);
}

/**
 * Safely parse any color representation (hex string #RRGGBB, #RGB, named color, rgb(...) string, object, or array of numbers)
 * into a valid pdf-lib RGB tuple: [r, g, b] where each channel is a float between 0.0 and 1.0.
 */
export function normalizeColorToRgb(
  color: any,
  fallback: [number, number, number] = [139 / 255, 0, 0]
): [number, number, number] {
  if (!color) return [Number(fallback[0]), Number(fallback[1]), Number(fallback[2])];

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
        return [Number(r), Number(g), Number(b)];
      }
    }
  }

  // Case 2: Array of numbers or numeric strings
  if (Array.isArray(color) && color.length >= 3) {
    const num0 = parseFloat(String(color[0]));
    const num1 = parseFloat(String(color[1]));
    const num2 = parseFloat(String(color[2]));
    if (!isNaN(num0) && !isNaN(num1) && !isNaN(num2)) {
      const r = num0 > 1.0 ? Math.min(1, Math.max(0, num0 / 255)) : Math.min(1, Math.max(0, num0));
      const g = num1 > 1.0 ? Math.min(1, Math.max(0, num1 / 255)) : Math.min(1, Math.max(0, num1));
      const b = num2 > 1.0 ? Math.min(1, Math.max(0, num2 / 255)) : Math.min(1, Math.max(0, num2));
      return [Number(r), Number(g), Number(b)];
    }
  }

  // Case 3: String
  if (typeof color === 'string') {
    const str = color.trim().toLowerCase();

    // Named color lookup
    if (NAMED_COLORS[str]) {
      return [Number(NAMED_COLORS[str][0]), Number(NAMED_COLORS[str][1]), Number(NAMED_COLORS[str][2])];
    }

    // Hex string
    const hex = str.replace(/^#/, '');
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [Number(r), Number(g), Number(b)];
    } else if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16) / 255;
      const g = parseInt(hex[1] + hex[1], 16) / 255;
      const b = parseInt(hex[2] + hex[2], 16) / 255;
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [Number(r), Number(g), Number(b)];
    }

    // rgb(r, g, b) string
    const rgbMatch = str.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgbMatch) {
      const r = Math.min(1, Math.max(0, parseInt(rgbMatch[1], 10) / 255));
      const g = Math.min(1, Math.max(0, parseInt(rgbMatch[2], 10) / 255));
      const b = Math.min(1, Math.max(0, parseInt(rgbMatch[3], 10) / 255));
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [Number(r), Number(g), Number(b)];
    }
  }

  return [Number(fallback[0]), Number(fallback[1]), Number(fallback[2])];
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

  let resolvedCustomPath = await resolveTemplateFile(params.customTemplatePath);
  if (params.customTemplatePath && !resolvedCustomPath) {
    throw new Error(
      `The configured certificate template "${params.customTemplatePath}" could not be loaded. Please ensure the template file is accessible in Supabase Storage or re-upload it.`
    );
  }

  const cleanPathLower = (resolvedCustomPath || '').toLowerCase().split('?')[0];

  const isCustomImage =
    resolvedCustomPath &&
    fs.existsSync(/*turbopackIgnore: true*/ resolvedCustomPath) &&
    (cleanPathLower.endsWith('.png') ||
      cleanPathLower.endsWith('.jpg') ||
      cleanPathLower.endsWith('.jpeg') ||
      cleanPathLower.endsWith('.webp'));

  if (isCustomImage && resolvedCustomPath) {
    // Image-based template: Create new landscape PDF (A4 842.25 x 595.5 pt) and embed template image
    pdfDoc = await PDFDocument.create();
    width = 842.25;
    height = 595.5;
    page = pdfDoc.addPage([width, height]);

    const imgBytes = fs.readFileSync(/*turbopackIgnore: true*/ resolvedCustomPath);
    let bgImage: any;
    if (cleanPathLower.endsWith('.png')) {
      bgImage = await pdfDoc.embedPng(imgBytes);
    } else if (cleanPathLower.endsWith('.jpg') || cleanPathLower.endsWith('.jpeg')) {
      bgImage = await pdfDoc.embedJpg(imgBytes);
    } else {
      const convertedPng = await sharp(imgBytes).toFormat('png').toBuffer();
      bgImage = await pdfDoc.embedPng(convertedPng);
    }

    page.drawImage(bgImage, { x: 0, y: 0, width, height });
    // Exact template preservation: No destructive whiteout rectangle. Background, borders, textures, and signatures remain 100% intact.
  } else {
    // Vector PDF Master: clean_master_template.pdf or reference_certificate.pdf
    let templateBytes: Buffer;
    if (resolvedCustomPath && fs.existsSync(/*turbopackIgnore: true*/ resolvedCustomPath) && cleanPathLower.endsWith('.pdf')) {
      templateBytes = fs.readFileSync(/*turbopackIgnore: true*/ resolvedCustomPath);
    } else if (!params.customTemplatePath && fs.existsSync(/*turbopackIgnore: true*/ masterCleanPath)) {
      templateBytes = fs.readFileSync(/*turbopackIgnore: true*/ masterCleanPath);
    } else if (!params.customTemplatePath && fs.existsSync(/*turbopackIgnore: true*/ referencePath)) {
      templateBytes = fs.readFileSync(/*turbopackIgnore: true*/ referencePath);
    } else {
      throw new Error(
        params.customTemplatePath
          ? `Could not load configured certificate template "${params.customTemplatePath}".`
          : 'Official Certificate Master Template not found on server.'
      );
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
    // Only cleanly cover the default line if using the vector PDF master where "— OF PARTICIPATION —" is pre-printed
    if (!isCustomImage && !cleanPathLower.endsWith('.pdf')) {
      page.drawRectangle({
        x: 180,
        y: 350,
        width: width - 360,
        height: 75,
        color: safeRgb(1, 1, 1)
      });
    }

    const subTitle = params.certificateSubtitle || '— OF ACHIEVEMENT —';
    const subWidth = fontBold.widthOfTextAtSize(subTitle, 13);
    page.drawText(subTitle, {
      x: (width - subWidth) / 2,
      y: cfg.subtitleY || 398,
      size: 13,
      font: fontBold,
      color: safeRgb(26 / 255, 36 / 255, 86 / 255) // Official IEDC Navy Blue
    });

    const intro = params.recipientIntro || 'THIS CERTIFICATE IS AWARDED TO';
    const introWidth = fontRegular.widthOfTextAtSize(intro, 11);
    page.drawText(intro, {
      x: (width - introWidth) / 2,
      y: cfg.introY || 363,
      size: 11,
      font: fontRegular,
      color: safeRgb(31 / 255, 41 / 255, 55 / 255)
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
    color: safeRgb(cfg.nameColor[0], cfg.nameColor[1], cfg.nameColor[2])
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
      color: safeRgb(cfg.paraColor[0], cfg.paraColor[1], cfg.paraColor[2])
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
            color: safeRgb(0.9, 0.9, 0.9)
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
      color: safeRgb(156 / 255, 163 / 255, 175 / 255)
    });
  }

  // 8. Output PDF
  const pdfBytes = await pdfDoc.save();
  const fileName = `${params.certificateId}.pdf`;
  const storagePath = `certificates/${fileName}`;

  // 9. Save local mirror copy in public/certificates/ or /tmp/certificates/
  let localFilePath: string | null = null;
  try {
    const localOutputDir = path.join(process.cwd(), 'public', 'certificates');
    if (!fs.existsSync(localOutputDir)) {
      fs.mkdirSync(localOutputDir, { recursive: true });
    }
    localFilePath = path.join(localOutputDir, fileName);
    fs.writeFileSync(localFilePath, pdfBytes);
  } catch (fsErr) {
    try {
      const tmpDir = path.join(os.tmpdir(), 'certificates');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      localFilePath = path.join(tmpDir, fileName);
      fs.writeFileSync(localFilePath, pdfBytes);
    } catch {}
  }

  // 10. Supabase Storage: compute publicUrl and dispatch upload asynchronously in background
  let publicUrl = `/api/public/certificates/${params.certificateId}/pdf`;
  if (isSupabaseAdminConfigured()) {
    try {
      const { data: urlData } = supabaseAdmin.storage
        .from('certificates')
        .getPublicUrl(fileName);
      if (urlData?.publicUrl) {
        publicUrl = urlData.publicUrl;
      }

      // Non-blocking upload in background so batch certificate generation does not stall HTTP serverless threads
      supabaseAdmin.storage
        .from('certificates')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        })
        .catch((e: any) => {
          console.warn(`Supabase storage background upload notice for ${fileName}:`, e?.message);
        });
    } catch (e: any) {
      // Local copy is already saved safely
    }
  }

  // 11. Companion high-resolution PNG rendered non-blockingly
  generateSingleCertificatePng(params, config).catch((pngErr: any) => {
    console.warn(`Companion PNG generation notice for ${params.certificateId}:`, pngErr?.message);
  });

  return {
    pdfBytes,
    fileName,
    storagePath,
    publicUrl
  };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate a high-resolution PNG certificate matching the exact template and typography.
 */
export async function generateSingleCertificatePng(
  params: CertificateGenerateParams,
  config: Partial<CertificateConfig> = {}
): Promise<{ pngBytes: Buffer; fileName: string; storagePath: string; publicUrl?: string }> {
  let resolvedTemplatePath = await resolveTemplateFile(params.customTemplatePath);
  if (params.customTemplatePath && !resolvedTemplatePath) {
    throw new Error(
      `The configured certificate template "${params.customTemplatePath}" could not be loaded for PNG export.`
    );
  }

  if (!resolvedTemplatePath) {
    const tplDir = path.join(process.cwd(), 'public', 'uploads', 'certificate-templates');
    if (fs.existsSync(tplDir)) {
      const files = fs.readdirSync(tplDir);
      const imgFile = files.find((f) => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
      if (imgFile) {
        resolvedTemplatePath = path.join(tplDir, imgFile);
      }
    }
  }

  if (!resolvedTemplatePath || !fs.existsSync(/*turbopackIgnore: true*/ resolvedTemplatePath)) {
    throw new Error('Certificate template not found on server for PNG rendering.');
  }

  // If the template path points to a PDF, automatically substitute the companion high-res raster master image
  if (resolvedTemplatePath.toLowerCase().endsWith('.pdf')) {
    const companionJpg = path.join(path.dirname(resolvedTemplatePath), 'extracted_clean_master.jpg');
    const companionUploads = path.join(process.cwd(), 'public', 'uploads', 'certificate-templates', 'IEDC_PARTICIPATE_CERTICICATE_1792467393382.png');
    const companionDefault = path.join(process.cwd(), 'public', 'uploads', 'certificate-templates', 'IEDC_CERTIFICATE_TEMPLATE_1792565763716.jpg');

    if (fs.existsSync(companionJpg)) {
      resolvedTemplatePath = companionJpg;
    } else if (fs.existsSync(companionUploads)) {
      resolvedTemplatePath = companionUploads;
    } else if (fs.existsSync(companionDefault)) {
      resolvedTemplatePath = companionDefault;
    }
  }

  const meta = await sharp(resolvedTemplatePath).metadata();
  const imgWidth = meta.width || 1920;
  const imgHeight = meta.height || 1358;
  const scale = imgWidth / 842.25;

  // Normalized values
  const nameY = (595.5 - normalizeNumber(config.nameY, DEFAULT_CERT_CONFIG.nameY)) * scale;
  const nameFontSize = normalizeNumber(config.nameFontSize, DEFAULT_CERT_CONFIG.nameFontSize, 10, 60) * scale;
  const nameRgb = normalizeColorToRgb(config.nameColor, [139 / 255, 0, 0]);
  const nameHex =
    '#' + nameRgb.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('');

  const paraY = (595.5 - normalizeNumber(config.paraY, DEFAULT_CERT_CONFIG.paraY)) * scale;
  const paraFontSize = normalizeNumber(config.paraFontSize, DEFAULT_CERT_CONFIG.paraFontSize, 8, 30) * scale;
  const paraLineSpacing = normalizeNumber(config.paraLineSpacing, DEFAULT_CERT_CONFIG.paraLineSpacing, 10, 50) * scale;
  const paraRgb = normalizeColorToRgb(config.paraColor, [31 / 255, 41 / 255, 55 / 255]);
  const paraHex =
    '#' + paraRgb.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('');

  const isTypeB =
    params.certificateType?.toLowerCase().includes('achievement') ||
    params.certificateType?.toLowerCase().includes('winner') ||
    params.certificateType?.toLowerCase().includes('prize') ||
    (params.role && params.role.toLowerCase().includes('winner'));

  let paraText = params.customParagraph || '';
  if (!paraText.trim()) {
    const orgBody = params.organizingBody || 'the IEDC Cell, Government Polytechnic College Perinthalmanna';
    if (isTypeB) {
      const awardCat = params.awardCategory || params.role || 'Winner';
      paraText = `In recognition of your outstanding achievement as ${awardCat} in the ${params.programName}, organized by ${orgBody}, held on ${params.programDate}.`;
    } else {
      paraText = `In recognition of your active participation and valuable contribution to the ${params.programName}, organized by ${orgBody}, held on ${params.programDate}.`;
    }
  }

  // Soft-wrap text lines for SVG
  const rawLines = paraText.split(/\r?\n/);
  const paraLines: string[] = [];
  const maxCharsPerLine = Math.floor(normalizeNumber(config.paraMaxWidth, 580) / 7.2);
  for (const raw of rawLines) {
    if (!raw.trim()) {
      paraLines.push('');
      continue;
    }
    const words = raw.split(/\s+/);
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length <= maxCharsPerLine) {
        cur = (cur + ' ' + w).trim();
      } else {
        if (cur) paraLines.push(cur);
        cur = w;
      }
    }
    if (cur) paraLines.push(cur);
  }

  const certIdY = (595.5 - normalizeNumber(config.certIdY, 45)) * scale;
  const recipientName = params.recipientName.trim().toUpperCase();

  const svgLines = paraLines
    .map((line, idx) => {
      const lineY = paraY + idx * paraLineSpacing;
      return `<text x="${imgWidth / 2}" y="${lineY}" class="para">${escapeXml(line)}</text>`;
    })
    .join('\n');

  const svgContent = `
    <svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .name { fill: ${nameHex}; font-size: ${nameFontSize}px; font-family: Helvetica, Arial, sans-serif; font-weight: bold; text-anchor: middle; }
        .para { fill: ${paraHex}; font-size: ${paraFontSize}px; font-family: Helvetica, Arial, sans-serif; text-anchor: middle; }
        .cert-id { fill: #9CA3AF; font-size: ${9 * scale}px; font-family: Helvetica, Arial, sans-serif; text-anchor: middle; font-weight: bold; }
      </style>
      <text x="${imgWidth / 2}" y="${nameY}" class="name">${escapeXml(recipientName)}</text>
      ${svgLines}
      ${
        config.showCertId !== false && params.certificateId
          ? `<text x="${imgWidth / 2}" y="${certIdY}" class="cert-id">CERTIFICATE ID: ${escapeXml(
              params.certificateId
            )}</text>`
          : ''
      }
    </svg>
  `;

  const svgPng = await sharp(Buffer.from(svgContent)).resize(imgWidth, imgHeight).png().toBuffer();
  const pngBytes = await sharp(resolvedTemplatePath)
    .resize(1920, 1358)
    .composite([{ input: await sharp(svgPng).resize(1920, 1358).png().toBuffer() }])
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();

  const fileName = `${params.certificateId}.png`;
  const storagePath = `certificates/${fileName}`;

  try {
    const localOutputDir = path.join(process.cwd(), 'public', 'certificates');
    if (!fs.existsSync(localOutputDir)) {
      fs.mkdirSync(localOutputDir, { recursive: true });
    }
    const localFilePath = path.join(localOutputDir, fileName);
    fs.writeFileSync(localFilePath, pngBytes);
  } catch (fsErr) {
    try {
      const tmpDir = path.join(os.tmpdir(), 'certificates');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      fs.writeFileSync(path.join(tmpDir, fileName), pngBytes);
    } catch {}
  }

  let publicUrl = `/api/public/certificates/${params.certificateId}/png`;
  if (isSupabaseAdminConfigured()) {
    try {
      const uploadPromise = supabaseAdmin.storage
        .from('certificates')
        .upload(fileName, pngBytes, {
          contentType: 'image/png',
          upsert: true
        });
      const timeoutPromise = new Promise<{ error: any }>((resolve) =>
        setTimeout(() => resolve({ error: new Error('PNG Upload timed out after 2.5s') }), 2500)
      );
      const { error: uploadErr } = await Promise.race([uploadPromise, timeoutPromise]);
      if (!uploadErr) {
        const { data: urlData } = supabaseAdmin.storage.from('certificates').getPublicUrl(fileName);
        if (urlData?.publicUrl) publicUrl = urlData.publicUrl;
      }
    } catch (e: any) {
      // Local copy saved safely
    }
  }

  return {
    pngBytes,
    fileName,
    storagePath,
    publicUrl
  };
}

/**
 * Generate a high-resolution JPG certificate matching the exact template and typography.
 */
export async function generateSingleCertificateJpg(
  params: CertificateGenerateParams,
  config: Partial<CertificateConfig> = {}
): Promise<{ jpgBytes: Buffer; fileName: string; storagePath: string; publicUrl?: string }> {
  const { pngBytes, fileName } = await generateSingleCertificatePng(params, config);
  const jpgBytes = await sharp(pngBytes).jpeg({ quality: 92 }).toBuffer();
  const jpgFileName = fileName.replace(/\.png$/i, '.jpg');
  return {
    jpgBytes,
    fileName: jpgFileName,
    storagePath: path.join(path.dirname(fileName), jpgFileName),
    publicUrl: `/api/public/certificates/${params.certificateId}/jpg`
  };
}

