'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CertificateGenerator } from '@/components/CertificateGenerator';
import {
  FileCheck,
  ShieldCheck,
  KeyRound,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
  Calendar,
  Sparkles,
  Lock
} from 'lucide-react';

export default function CertificatesDownloadPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [regNumber, setRegNumber] = useState('21051234');
  const [mobileNumber, setMobileNumber] = useState('9847123456');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [retrievedCert, setRetrievedCert] = useState<any>(null);

  useEffect(() => {
    fetch('/api/public/events')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setEvents(json.data);
          if (json.data.length > 0) {
            setSelectedEventId(json.data[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleDownloadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setRetrievedCert(null);

    try {
      const res = await fetch('/api/public/certificates/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEventId,
          full_name: regNumber,
          mobile_number: mobileNumber
        })
      });
      const data = await res.json();

      if (res.ok && data.success && data.certificate) {
        setRetrievedCert(data.certificate);
      } else {
        setErrorMsg(data.error || 'No published certificate was found for the supplied details.');
      }
    } catch (err: any) {
      setErrorMsg('No published certificate was found for the supplied details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 min-h-screen relative z-10 font-sans">
      
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-mono font-bold tracking-wider uppercase">
          <FileCheck className="w-4 h-4 text-amber-300" /> Official Certificate Retrieval Portal
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Download Your Certificate
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          Select the program you attended, enter your Polytechnic Registration Number and your registered 10-digit mobile number password to access and download your verified certificate.
        </p>
      </div>

      {/* Download Credentials Form */}
      <div className="max-w-xl mx-auto bg-[#121216] p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl space-y-6 backdrop-blur-xl">
        <form onSubmit={handleDownloadSubmit} className="space-y-4">
          
          {/* 1. Program Event Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              1. Select Event / Workshop
            </label>
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-xs text-white focus:outline-none appearance-none"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id} className="bg-[#121216] text-white">
                    {evt.title} ({evt.date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Full Name */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              2. Full Name (as registered)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ADARSH P or Muhammed Ashfak O"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Flexible matching: Case and harmless spacing differences are handled automatically.
            </span>
          </div>

          {/* 3. 10-Digit Mobile Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                3. Registered 10-Digit Mobile Number (Initial Password)
              </label>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                placeholder="10-digit registered mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-200 text-black font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? 'Authenticating Record...' : 'Verify & Access Certificate'}</span>
          </button>
        </form>

        {/* Demo Test Hint */}
        <div className="text-[11px] text-slate-400 text-center bg-white/[0.02] p-3 rounded-2xl border border-white/5 space-y-1">
          <div>
            Test Participant Reg: <span className="font-mono text-white font-bold">21051234</span> · Mobile: <span className="font-mono text-white font-bold">9847123456</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Protected with server rate limiting and certified digital signature verification.
          </div>
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="max-w-xl mx-auto bg-rose-950/40 border border-rose-500/40 p-4 rounded-2xl text-center space-y-1">
          <div className="text-xs font-bold text-rose-300 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Authentication Failed</span>
          </div>
          <p className="text-xs text-rose-200">{errorMsg}</p>
        </div>
      )}

      {/* Verified Certificate Display & Download Preview */}
      {retrievedCert && (
        <div className="max-w-4xl mx-auto space-y-6 pt-4">
          <div className="bg-[#121216] border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-mono font-bold">
                    VERIFIED &amp; APPROVED
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">{retrievedCert.certificateId}</h3>
                  <p className="text-xs text-slate-400">
                    Issued to {retrievedCert.participantName} ({retrievedCert.registerNumber})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/verify/${retrievedCert.certificateId}`}
                  target="_blank"
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-4 h-4 text-amber-300" />
                  <span>Public QR Link</span>
                </Link>
              </div>
            </div>

            {/* Visual Canvas Certificate Generator */}
            <CertificateGenerator
              certificate={{
                id: retrievedCert.certificateId,
                certificateId: retrievedCert.certificateId,
                participantName: retrievedCert.participantName,
                registerNumber: retrievedCert.registerNumber,
                email: 'student@gptcpmna.edu.in',
                eventName: retrievedCert.eventName,
                eventDate: retrievedCert.eventDate || '2026-08-25',
                certificateType: retrievedCert.certificateType || 'Participation',
                issueDate: retrievedCert.issueDate || '2026-08-26',
                qrCodeUrl: retrievedCert.qrCodeUrl,
                status: 'Verified'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
