'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  Download,
  ExternalLink,
  Award,
  AlertTriangle,
  Loader2,
  QrCode,
  FileCheck
} from 'lucide-react';
import Link from 'next/link';

export default function CertificateDetailPage() {
  const params = useParams();
  const certId = Array.isArray(params?.id) ? params.id[0] : params?.id || '';

  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!certId) {
      setLoading(false);
      setErrorMessage('No Certificate ID provided.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    fetch(`/api/public/certificates/verify?id=${encodeURIComponent(certId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.certificate) {
          setCertificate(json.certificate);
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
          } catch {}
        } else {
          setErrorMessage(json.error || `Certificate ID "${certId}" is not registered or unverified in the official IEDC database.`);
        }
      })
      .catch((err) => {
        setErrorMessage(`Failed to verify credential: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [certId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-wide">Cryptographic Verification in Progress</h2>
        <p className="text-slate-400 text-xs font-mono">Authenticating credential {certId} against official IEDC ledger...</p>
      </div>
    );
  }

  if (errorMessage || !certificate) {
    return (
      <div className="py-24 px-4 max-w-xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white">Invalid or Unverified Credential</h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            {errorMessage || `Certificate ID "${certId}" is not registered in the official database of IEDC Govt Polytechnic College Perinthalmanna.`}
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/verify"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#F98A5B] text-black font-extrabold text-xs tracking-wider uppercase transition-transform hover:scale-[1.02]"
          >
            Search by Name & Mobile
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const pdfUrl = certificate.pdfUrl || `/api/public/certificates/${certificate.certificateId}/pdf`;
  const pngUrl = certificate.pngUrl || `/api/public/certificates/${certificate.certificateId}/png`;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 relative z-10">
      {/* Verification Shield Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-cyan-950/60 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0 glow-cyan">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> AUTHENTICATED DIGITAL CREDENTIAL
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5">{certificate.participantName}</h1>
            <p className="text-cyan-300 text-xs font-mono mt-0.5">Certificate ID: {certificate.certificateId}</p>
          </div>
        </div>

        <div className="text-left sm:text-right sm:border-l border-emerald-500/20 sm:pl-6 space-y-1 text-xs w-full sm:w-auto">
          <p className="text-slate-400">Issuer Authority:</p>
          <p className="font-bold text-white">IEDC Govt Polytechnic College Perinthalmanna</p>
          <p className="text-emerald-400 font-semibold flex items-center gap-1 sm:justify-end">
            <FileCheck className="w-3.5 h-3.5" /> Verified Authentic & Valid
          </p>
        </div>
      </div>

      {/* Metadata Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">Program / Event</span>
          <span className="font-bold text-white mt-1 block truncate" title={certificate.eventName}>
            {certificate.eventName}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">Recognition / Role</span>
          <span className="font-bold text-[#F98A5B] mt-1 block truncate">
            {certificate.certificateType || 'Participant'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">Program Date</span>
          <span className="text-slate-200 mt-1 block truncate">
            {certificate.eventDate || 'Completed'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">Issue Date</span>
          <span className="text-slate-200 mt-1 block truncate">
            {certificate.issueDate || 'Official Record'}
          </span>
        </div>
      </div>

      {/* Action Download Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-slate-300">Official High-Resolution Vector Assets Available</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={pdfUrl}
            download={`${certificate.participantName}_${certificate.certificateId}.pdf`}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg hover:opacity-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download PDF
          </a>

          <a
            href={pngUrl}
            download={`${certificate.participantName}_${certificate.certificateId}.png`}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-extrabold text-xs flex items-center gap-2 border border-white/15 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download PNG
          </a>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <span>Fullscreen</span> <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Embedded Official Certificate View */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#F98A5B]" /> Official Master Vector Certificate
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Ref: {certificate.certificateId}
          </span>
        </div>

        <div className="aspect-[1.414/1] w-full rounded-3xl border border-white/15 bg-white/5 overflow-hidden shadow-2xl relative">
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0`}
            className="w-full h-full border-0 rounded-3xl"
            title={`Certificate of ${certificate.participantName}`}
          />
        </div>
      </div>

      {/* Return to Portal Footer */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <p>Issued by Innovation and Entrepreneurship Development Centre (IEDC), GPTC Perinthalmanna.</p>
        <Link
          href="/verify"
          className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 hover:underline"
        >
          Verify another certificate &rarr;
        </Link>
      </div>
    </div>
  );
}
