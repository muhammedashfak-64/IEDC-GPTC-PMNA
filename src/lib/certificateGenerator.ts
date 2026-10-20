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
  certificateHeading?: string;
  customParagraph?: string;
  role?: string; // 'Participant' | 'Student Lead' | 'Program Coordinator' | 'Volunteer' | 'Organizer' | 'Speaker' | 'Faculty Coordinator'
  customTemplatePath?: string;
}

export interface CertificateConfig {
  nameX?: number; // if undefined, centered
  nameY: number; // default 305
  nameFontSize: number; // default 34
  nameColor: [number, number, number]; // RGB 0-1, default [139/255, 0, 0]
  paraY: number; // default 252
  paraFontSize: number; // default 12.5
  paraLineSpacing: number; // default 18
  paraMaxWidth: number; // default 580
  paraColor: [number, number, number]; // default [31/255, 41/255, 55/255]
  showCertId: boolean; // default true
  certIdY: number; // default 45
}

export const DEFAULT_CERT_CONFIG: CertificateConfig = {
  nameY: 305,
  nameFontSize: 34,
  nameColor: [139 / 255, 0, 0],
  paraY: 252,
  paraFontSize: 12.5,
  paraLineSpacing: 18,
  paraMaxWidth: 580,
  paraColor: [31 / 255, 41 / 255, 55 / 255],
  showCertId: true,
  certIdY: 45
};

/**
 * Word wrap helper for PDF canvas text
 */
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Generate a high-resolution PDF certificate preserving the official ADARSH P master design
 */
export async function generateSingleCertificatePdf(
  params: CertificateGenerateParams,
  config: Partial<CertificateConfig> = {}
): Promise<{ pdfBytes: Uint8Array; fileName: string; storagePath: string; publicUrl?: string }> {
  const cfg: CertificateConfig = { ...DEFAULT_CERT_CONFIG, ...config };

  // 1. Locate the master template
  let templateBytes: Buffer;
  const masterCleanPath = path.join(process.cwd(), 'public', 'templates', 'clean_master_template.pdf');
  const referencePath = path.join(process.cwd(), 'public', 'templates', 'reference_certificate.pdf');

  if (params.customTemplatePath && fs.existsSync(params.customTemplatePath)) {
    templateBytes = fs.readFileSync(params.customTemplatePath);
  } else if (fs.existsSync(masterCleanPath)) {
    templateBytes = fs.readFileSync(masterCleanPath);
  } else if (fs.existsSync(referencePath)) {
    templateBytes = fs.readFileSync(referencePath);
  } else {
    throw new Error('Official Certificate Master Template not found on server.');
  }

  // 2. Load PDF into pdf-lib
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const { width } = page.getSize();

  // 3. Embed standard fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 4. Clean & format Recipient Name
  const cleanName = params.recipientName.trim().toUpperCase();
  let nameSize = cfg.nameFontSize;
  let nameWidth = fontBold.widthOfTextAtSize(cleanName, nameSize);

  // Dynamically shrink font size if name is particularly long
  const maxNameWidth = width - 200;
  if (nameWidth > maxNameWidth) {
    nameSize = Math.max(22, (maxNameWidth / nameWidth) * nameSize);
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

  // 5. Construct Paragraph Text
  let paraText = params.customParagraph;
  const orgBody = params.organizingBody || 'the IEDC Cell, Government Polytechnic College Perinthalmanna';
  const roleText = params.role && params.role !== 'Participant' ? ` as ${params.role}` : '';

  if (!paraText) {
    paraText = `In recognition of your outstanding participation and dedication${roleText} in the ${params.programName}, organized by ${orgBody}, held on ${params.programDate}.`;
  }

  // 6. Word-wrap and draw paragraph lines centered
  const paraLines = wrapText(paraText, cfg.paraMaxWidth, fontRegular, cfg.paraFontSize);
  let currentY = cfg.paraY;
  for (const line of paraLines) {
    const lineWidth = fontRegular.widthOfTextAtSize(line, cfg.paraFontSize);
    const lineX = (width - lineWidth) / 2;
    page.drawText(line, {
      x: lineX,
      y: currentY,
      size: cfg.paraFontSize,
      font: fontRegular,
      color: rgb(cfg.paraColor[0], cfg.paraColor[1], cfg.paraColor[2])
    });
    currentY -= cfg.paraLineSpacing;
  }

  // 7. Draw Certificate ID
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
      const { error: uploadErr } = await supabaseAdmin.storage
        .from('certificates')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        });

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
