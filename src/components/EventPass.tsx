'use client';

import React, { useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import {
  Download,
  Printer,
  Share2,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import html2canvas from 'html2canvas';

export interface EventPassData {
  id: string;
  registrationCode?: string;
  passToken?: string;
  qrPayload?: string;
  studentName: string;
  registerNumber?: string;
  department?: string;
  branch?: string;
  academicYear?: string;
  semester?: string | null;
  collegeName?: string;
  participationCategory?: string;
  eventTitle?: string;
  eventId?: string;
  status?: string;
  waitlistPosition?: number | null;
  registeredAt?: string;
  eventDate?: string;
  eventTime?: string;
  eventVenue?: string;
}

export interface EventPassProps {
  registration: EventPassData;
  event?: {
    id?: string;
    title?: string;
    date?: string;
    time?: string;
    venue?: string;
    category?: string;
  };
  showActions?: boolean;
  onReset?: () => void;
}

export function EventPass({
  registration,
  event,
  showActions = true,
  onReset
}: EventPassProps) {
  const passRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<'png' | 'jpg' | 'pdf' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Derived event fields with fallbacks
  const eventTitle = (event?.title || registration.eventTitle || 'Campus Innovation Event').trim();
  const eventDate = event?.date || registration.eventDate || 'Date Announced Soon';
  const eventTime = event?.time || registration.eventTime || '10:00 AM - 04:00 PM';
  const eventVenue = event?.venue || registration.eventVenue || 'IEDC Hall, GPTC PMNA';
  const eventCategory = event?.category || 'Official Program';

  // Derived participant fields
  const studentName = (registration.studentName || 'Student Participant').trim();
  const regCode = registration.registrationCode || registration.id;
  const isWaitlisted = (registration.status || '').toLowerCase().includes('wait');
  const regNo =
    registration.registerNumber &&
    registration.registerNumber !== 'N/A' &&
    !registration.registerNumber.startsWith('REG-')
      ? registration.registerNumber
      : null;

  const department = registration.department || registration.branch || 'General';
  const academicYear = registration.academicYear || 'All Batches';
  const semester = registration.semester ? `Sem ${registration.semester}` : null;
  const collegeName = registration.collegeName || 'Govt Polytechnic College Perinthalmanna';

  // Secure QR payload: IEDCPASS:{eventId}:{regCode}:{token}
  const qrPayload =
    registration.qrPayload ||
    `IEDCPASS:${registration.eventId || event?.id || 'evt'}:${regCode}:${
      registration.passToken || registration.id
    }`;

  // Copy Pass ID
  const handleCopy = () => {
    navigator.clipboard.writeText(regCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Official Event Entry Pass — IEDC GPTC PMNA\n` +
      `Program: "${eventTitle}"\n` +
      `Participant: ${studentName}\n` +
      `Pass ID: ${regCode}\n` +
      `Date: ${eventDate} | Venue: ${eventVenue}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Browser Print
  const handlePrint = () => {
    window.print();
  };

  // High-Resolution DOM-to-Image Export (PNG / JPG)
  const handleExportImage = async (format: 'png' | 'jpg') => {
    if (!passRef.current || downloadingFormat) return;
    setDownloadingFormat(format);
    setExportError(null);

    const safeName = studentName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeCode = regCode.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `IEDC_Pass_${safeName}_${safeCode}.${format}`;

    try {
      // 1. Ensure all document fonts are completely loaded
      if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // 2. Ensure all images inside the pass are loaded
      const images = Array.from(passRef.current.querySelectorAll('img'));
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) resolve();
              else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            })
        )
      );

      // Brief pause to ensure full paint of borders and SVG QR
      await new Promise((r) => setTimeout(r, 120));

      let dataUrl = '';
      try {
        // High fidelity 3x pixel ratio via html-to-image
        const options = {
          quality: 0.98,
          pixelRatio: 3,
          backgroundColor: '#0B0B0F',
          cacheBust: true,
          style: {
            transform: 'none',
            margin: '0',
            maxWidth: 'none'
          }
        };

        if (format === 'png') {
          dataUrl = await toPng(passRef.current, options);
        } else {
          dataUrl = await toJpeg(passRef.current, options);
        }
      } catch (htmlToImageErr) {
        console.warn('html-to-image notice, falling back to html2canvas:', htmlToImageErr);
        // Fallback to html2canvas if html-to-image encounters environment restrictions
        const canvas = await html2canvas(passRef.current, {
          scale: 3,
          backgroundColor: '#0B0B0F',
          useCORS: true,
          logging: false
        });
        dataUrl = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
      }

      if (!dataUrl || dataUrl.length < 500) {
        throw new Error('Image canvas generation returned an incomplete buffer.');
      }

      // Trigger instant download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error(`Error exporting pass as ${format}:`, err);
      // Fallback: trigger backend API endpoint if client capture failed
      try {
        const fallbackUrl = `/api/public/registrations/${registration.id}/pass/${format}`;
        const res = await fetch(fallbackUrl);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          }, 500);
          return;
        }
      } catch {}
      setExportError(err.message || `Failed to download ${format.toUpperCase()} pass.`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* ============================================================== */}
      {/* AUTHORITATIVE ENTRY PASS CARD (DOM CAPTURED DIRECTLY ON EXPORT) */}
      {/* ============================================================== */}
      <div
        ref={passRef}
        id="official-event-pass"
        className="rounded-[28px] border-2 border-white/15 bg-[#0B0B0F] text-[#ECECEC] p-6 sm:p-8 shadow-2xl relative overflow-hidden font-sans space-y-5"
        style={{
          backgroundColor: '#0B0B0F',
          color: '#ECECEC'
        }}
      >
        {/* Decorative Top Accent Stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F98A5B] via-[#EC3A74] to-[#6249A3]"
          aria-hidden="true"
        />

        {/* 1. INSTITUTIONAL HEADER & BRANDING */}
        <div className="flex items-center justify-between gap-3 pt-2 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/college-logo.png"
              alt="GPTC PMNA Crest"
              className="w-12 h-12 object-contain shrink-0"
              crossOrigin="anonymous"
            />
            <div className="leading-tight">
              <span className="text-[11px] sm:text-xs font-black tracking-wide text-white block uppercase">
                Govt Polytechnic College Perinthalmanna
              </span>
              <span className="text-[9px] sm:text-[10px] text-neutral-400 font-medium block">
                Innovation &amp; Entrepreneurship Development Centre
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#F98A5B] uppercase block mt-0.5">
                Official Event Entry Pass
              </span>
            </div>
          </div>

          <img
            src="/iedc-gptc-pmna-logo.png"
            alt="IEDC Logo"
            className="w-12 h-10 object-contain shrink-0"
            crossOrigin="anonymous"
          />
        </div>

        {/* 2. EVENT INFORMATION BANNER */}
        <div className="p-4 rounded-2xl bg-[#14141D] border border-white/10 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[9px] font-mono tracking-widest text-[#F98A5B] uppercase font-bold px-2 py-0.5 rounded bg-[#F98A5B]/10 border border-[#F98A5B]/20 inline-block mb-1">
                {eventCategory}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white leading-snug uppercase tracking-tight">
                {eventTitle}
              </h2>
            </div>

            {/* Status Pill */}
            {isWaitlisted ? (
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-bold shrink-0">
                WAITLIST #{registration.waitlistPosition || 1}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CONFIRMED
              </span>
            )}
          </div>

          {/* Event Metadata Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-300 pt-1 border-t border-white/5">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#F98A5B] shrink-0" />
              <span>{eventDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>{eventTime}</span>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 text-[#F98A5B]">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{eventVenue}</span>
            </div>
          </div>
        </div>

        {/* 3. PARTICIPANT INFORMATION CARD & QR CODE */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
          {/* High-Contrast Crisp White QR Card */}
          <div className="p-3.5 rounded-2xl bg-white flex flex-col items-center justify-center shrink-0 w-fit mx-auto shadow-lg border-2 border-[#F98A5B]/40">
            <div className="p-1 bg-white">
              <QRCode
                value={qrPayload}
                size={136}
                level="M"
                fgColor="#0B0B0D"
                bgColor="#FFFFFF"
              />
            </div>
            <span className="text-[9px] font-mono font-black text-[#0B0B0D] tracking-widest mt-2 uppercase">
              Entry Verification
            </span>
          </div>

          {/* Participant Details Column */}
          <div className="sm:col-span-2 space-y-2 text-xs">
            {/* Participant Name */}
            <div>
              <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase block">
                Participant Name
              </span>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide uppercase leading-tight">
                {studentName}
              </h3>
            </div>

            {/* Pass ID / Reg Code */}
            <div>
              <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase block">
                Pass ID / Registration Code
              </span>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-mono font-black text-[#F98A5B] tracking-wider">
                  {regCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy Pass ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Department & Batch */}
            <div className="pt-1 border-t border-white/10 text-neutral-300 space-y-1 text-[11px]">
              {regNo && (
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-mono">Reg No:</span>
                  <span className="font-mono text-white font-bold">{regNo}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">Branch:</span>
                <span className="text-white font-medium truncate max-w-[170px]">{department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Year / Batch:</span>
                <span className="text-white font-medium">
                  {academicYear} {semester ? `• ${semester}` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">College:</span>
                <span className="text-white font-medium truncate max-w-[170px]">{collegeName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. RECEPTION INSTRUCTIONS & VERIFICATION BADGE */}
        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-2.5 text-[11px] text-neutral-300">
          <ShieldCheck className="w-4 h-4 text-[#F98A5B] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-white block">Reception Desk Verification Notice</span>
            <span>
              Please present this verified pass (digital screen or printout) at the reception counter. Your attendance
              will be authenticated in the official event registry upon scanning.
            </span>
          </div>
        </div>

        {/* 5. FOOTER & SECURITY AUTHENTICATION */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-[10px] font-mono text-neutral-500 gap-2">
          <span>IEDC GPTC PMNA • INNOVATION CELL VERIFIED PASS</span>
          <span>Issued: {registration.registeredAt?.split('T')[0] || new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>

      {/* Export Error Alert (if any) */}
      {exportError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* ACTION BUTTONS (PNG, JPG, PDF, PRINT, WHATSAPP, REGISTER MORE) */}
      {/* ============================================================== */}
      {showActions && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Download PNG (High-Res Client Capture) */}
            <button
              type="button"
              onClick={() => handleExportImage('png')}
              disabled={!!downloadingFormat}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] hover:opacity-90 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#F98A5B]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {downloadingFormat === 'png' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rendering HD PNG...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Pass (PNG)</span>
                </>
              )}
            </button>

            {/* Download JPG (High-Res Client Capture) */}
            <button
              type="button"
              onClick={() => handleExportImage('jpg')}
              disabled={!!downloadingFormat}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {downloadingFormat === 'jpg' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rendering HD JPG...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-purple-400" />
                  <span>Download Pass (JPG)</span>
                </>
              )}
            </button>

            {/* Download PDF (Server Vector Pipeline) */}
            <a
              href={`/api/public/registrations/${registration.id}/pass/pdf`}
              download={`IEDC_Pass_${studentName.replace(/\s+/g, '_')}_${regCode}.pdf`}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#F98A5B]" />
              <span>Download Pass (PDF)</span>
            </a>

            {/* Print Pass */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-neutral-400" />
              <span>Print</span>
            </button>

            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Reset / New Registration Button */}
          {onReset && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-neutral-400 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
              >
                Register another student or workshop
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
