'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { CertificateGenerator } from '@/components/CertificateGenerator';
import confetti from 'canvas-confetti';
import { ShieldCheck, CheckCircle2, QrCode, Building2, Calendar, User } from 'lucide-react';
import Link from 'next/link';

export default function CertificateDetailPage() {
  const params = useParams();
  const certId = Array.isArray(params?.id) ? params.id[0] : params?.id || '';
  const { verifyCertificateById } = useApp();

  const certificate = verifyCertificateById(certId);

  useEffect(() => {
    if (certificate) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [certificate]);

  if (!certificate) {
    return (
      <div className="py-24 text-center space-y-4">
        <h1 className="text-3xl font-bold text-white">Invalid or Expired Certificate</h1>
        <p className="text-slate-400 text-sm">Certificate ID &quot;{certId}&quot; is not registered in IEDC database.</p>
        <Link href="/verify" className="inline-block px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs">
          Return to Verification Engine
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
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
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">{certificate.participantName}</h1>
            <p className="text-cyan-300 text-xs font-mono">Certificate ID: {certificate.certificateId}</p>
          </div>
        </div>

        <div className="text-right sm:border-l border-emerald-500/20 sm:pl-6 space-y-1 text-xs">
          <p className="text-slate-400">Issuer Agency:</p>
          <p className="font-bold text-white">IEDC Govt Polytechnic College Perinthalmanna</p>
          <p className="text-emerald-400 font-semibold">Status: Verified Authentic</p>
        </div>
      </div>

      {/* Render Canvas Certificate */}
      <CertificateGenerator certificate={certificate} />
    </div>
  );
}
