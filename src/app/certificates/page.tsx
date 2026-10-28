'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  ShieldCheck,
  Phone,
  User,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon
} from 'lucide-react';

export default function CertificatesDownloadPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  // Section 6: Initial state must be completely empty strings
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [showPhone, setShowPhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [retrievedCert, setRetrievedCert] = useState<any>(null);

  useEffect(() => {
    // Only fetch programs with official published certificates
    setEventsLoading(true);
    fetch('/api/public/events?hasCertificates=true')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setEvents(json.data);
          if (json.data.length > 0) {
            setSelectedEventId(json.data[0].id);
          }
        }
      })
      .catch((err) => console.error('Error loading events with certificates:', err))
      .finally(() => setEventsLoading(false));
  }, []);

  const handleDownloadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setRetrievedCert(null);

    if (!selectedEventId) {
      setErrorMsg('Please select a program or workshop.');
      return;
    }

    const cleanName = fullName.trim();
    if (!cleanName) {
      setErrorMsg('Please enter your full name as registered.');
      return;
    }

    const cleanPhone = mobileNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter your registered 10-digit mobile number.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/public/certificates/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEventId,
          full_name: cleanName,
          mobile_number: cleanPhone
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
          <FileCheck className="w-4 h-4 text-[#F98A5B]" /> Official Certificate Retrieval Portal
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Download Your Certificate
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          Select the program you attended, enter your full registered name and your 10-digit registered mobile number to retrieve and download your official IEDC certificate.
        </p>
      </div>

      {/* Download Credentials Form */}
      <div className="max-w-xl mx-auto bg-[#121216] p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl space-y-6 backdrop-blur-xl">
        <form onSubmit={handleDownloadSubmit} className="space-y-4">
          {/* 1. Program Event Selector - Only events with published certificates */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              1. Select Event / Workshop
            </label>
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                disabled={eventsLoading || events.length === 0}
                className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-xs text-white focus:outline-none appearance-none cursor-pointer disabled:opacity-50"
              >
                {events.length === 0 ? (
                  <option value="">{eventsLoading ? 'Loading programs...' : 'No published programs available'}</option>
                ) : (
                  events.map((evt) => (
                    <option key={evt.id} value={evt.id} className="bg-[#121216] text-white">
                      {evt.title} ({evt.date})
                    </option>
                  ))
                )}
              </select>
            </div>
            {events.length === 0 && !eventsLoading && (
              <span className="text-[11px] text-amber-400 mt-1 block">
                No published certificates are currently available for retrieval. Please check back later.
              </span>
            )}
          </div>

          {/* 2. Full Name Input (Initially Blank, No registration numbers) */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              2. Full Name (as registered)
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="Enter your full registered name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Flexible matching: Case and spacing differences are handled automatically.
            </span>
          </div>

          {/* 3. Registered Mobile Number Input (Hidden by default with Eye toggle icon) */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              3. Registered Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showPhone ? 'text' : 'password'}
                inputMode="numeric"
                required
                autoComplete="off"
                maxLength={10}
                placeholder="Enter your registered mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-11 py-3 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPhone(!showPhone)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showPhone ? 'Hide mobile number' : 'Show mobile number'}
              >
                {showPhone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Enter the 10-digit mobile number provided during event registration.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || events.length === 0}
            className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-200 text-black font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01] disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? 'Verifying Record...' : 'Find & Retrieve Certificate'}</span>
          </button>
        </form>
      </div>

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="max-w-xl mx-auto bg-rose-950/40 border border-rose-500/40 p-4 rounded-2xl text-center space-y-1">
          <div className="text-xs font-bold text-rose-300 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Verification Notice</span>
          </div>
          <p className="text-xs text-rose-200">{errorMsg}</p>
        </div>
      )}

      {/* Verified Certificate Display & Official PDF / PNG Downloads */}
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
                    Issued to <span className="text-white font-bold">{retrievedCert.participantName}</span> for{' '}
                    <span className="text-[#F98A5B] font-bold">{retrievedCert.eventName}</span>
                  </p>
                </div>
              </div>

              {/* Download Actions: View, PDF, PNG, QR */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`/api/public/certificates/${retrievedCert.certificateId}/pdf`}
                  target="_blank"
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>View</span>
                </a>

                <a
                  href={`/api/public/certificates/${retrievedCert.certificateId}/pdf`}
                  download={`Certificate_${retrievedCert.participantName?.replace(/\s+/g, '_')}_IEDC.pdf`}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white text-xs font-extrabold flex items-center gap-2 shadow-lg hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </a>

                <a
                  href={`/api/public/certificates/${retrievedCert.certificateId}/png`}
                  download={`Certificate_${retrievedCert.participantName?.replace(/\s+/g, '_')}_IEDC.png`}
                  className="px-3.5 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-bold text-purple-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <span>Download PNG</span>
                </a>

                <Link
                  href={`/verify/${retrievedCert.certificateId}`}
                  target="_blank"
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-4 h-4 text-amber-300" />
                  <span>Verify Record</span>
                </Link>
              </div>
            </div>

            {/* Official PDF Master Preview */}
            <div className="aspect-[1.414/1] w-full min-h-[360px] rounded-2xl border border-white/15 bg-neutral-900/60 overflow-hidden shadow-2xl relative">
              <iframe
                src={`/api/public/certificates/${retrievedCert.certificateId}/pdf#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-0 pointer-events-auto"
                title="Verified Certificate"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-2 gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#F98A5B]" />
                <span>Issue Date: {retrievedCert.issueDate || '2026-10-20'}</span>
              </div>
              <div>
                Type:{' '}
                <span className="font-bold text-white">
                  {retrievedCert.certificateType || 'Participation Certificate'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
