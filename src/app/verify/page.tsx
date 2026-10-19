'use client';

import React, { useState } from 'react';
import { CertificateGenerator } from '@/components/CertificateGenerator';
import { ShieldCheck, Search, QrCode, CheckCircle2, AlertTriangle, Lock, KeyRound, Download, Share2, FileCheck } from 'lucide-react';
import Link from 'next/link';

export default function VerifyPage() {
  const [selectedProgram, setSelectedProgram] = useState('GPTC PMNA Hackathon 2026');
  const [regNumber, setRegNumber] = useState('21051234');
  const [phonePassword, setPhonePassword] = useState('9847123456');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authenticatedCert, setAuthenticatedCert] = useState<any>(null);

  const programsList = [
    'GPTC PMNA Hackathon 2026',
    'Hands-on IoT & Embedded Robotics Bootcamp',
    'State-Level Idea Fest 2026',
    'YIP 5.0 Innovation Workshop'
  ];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setAuthenticatedCert(null);

    try {
      const res = await fetch('/api/certificates/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          register_number: regNumber,
          password: phonePassword
        })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || 'Invalid Registration Number or Password.');
      } else {
        setAuthenticatedCert(json.certificate);
      }
    } catch (err: any) {
      setErrorMessage('Verification server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 min-h-screen relative z-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F98A5B]/15 border border-[#F98A5B]/40 text-[#F98A5B] text-xs font-mono font-bold tracking-wider uppercase">
          <ShieldCheck className="w-4 h-4" /> Official Certificate Verification & Download Portal
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">Student Certificate Portal</h1>
        <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
          Select your event program, enter your Registration Number and 10-digit registered Mobile Number password to access and download your verified certificate.
        </p>
      </div>

      {/* Program Selector & Credentials Form */}
      <div className="max-w-2xl mx-auto glass-iedc p-8 rounded-3xl border border-white/12 shadow-2xl space-y-6">
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {/* Program Select */}
          <div>
            <label className="text-xs font-bold text-[#F98A5B] uppercase tracking-wider block mb-1.5">
              1. Select Program / Workshop Event
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full bg-[#0F0F10] border border-white/20 focus:border-[#F98A5B] rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
            >
              {programsList.map((prog) => (
                <option key={prog} value={prog} className="bg-[#0F0F10] text-white">
                  {prog}
                </option>
              ))}
            </select>
          </div>

          {/* Registration Number */}
          <div>
            <label className="text-xs font-bold text-[#EC3A74] uppercase tracking-wider block mb-1.5">
              2. Enter Register Number
            </label>
            <div className="relative">
              <FileCheck className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. 21051234"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                className="w-full bg-[#0F0F10] border border-white/20 focus:border-[#EC3A74] rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Password (10-Digit Mobile Number) */}
          <div>
            <label className="text-xs font-bold text-[#6249A3] uppercase tracking-wider block mb-1.5">
              3. Enter Password (Registered 10-Digit Mobile Number)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                placeholder="10-digit mobile number (e.g. 9847123456)"
                value={phonePassword}
                onChange={(e) => setPhonePassword(e.target.value)}
                className="w-full bg-[#0F0F10] border border-white/20 focus:border-[#6249A3] rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl btn-primary-iedc font-black text-xs shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>{loading ? 'Authenticating Credentials...' : 'Authenticate & Download Certificate'}</span>
          </button>
        </form>

        <div className="text-[11px] text-slate-400 text-center bg-white/5 p-3 rounded-2xl border border-white/10">
          Demo Test Reg Number: <span className="font-mono text-[#F98A5B] font-bold">21051234</span> · Password: <span className="font-mono text-[#F98A5B] font-bold">9847123456</span>
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="max-w-2xl mx-auto glass-iedc p-6 rounded-3xl border border-rose-500/40 text-center space-y-2">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Authentication Failed</h3>
          <p className="text-xs text-rose-200">{errorMessage}</p>
        </div>
      )}

      {/* Authenticated Certificate Result */}
      {authenticatedCert && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="glass-iedc p-6 sm:p-8 rounded-3xl border border-[#F98A5B]/40 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F98A5B]/20 border border-[#F98A5B] flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-[#F98A5B]" />
                </div>
                <div>
                  <span className="px-3 py-0.5 rounded-full bg-[#F98A5B]/20 text-[#F98A5B] text-[10px] font-mono font-bold">
                    OFFICIAL VERIFIED CERTIFICATE
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">{authenticatedCert.certificate_id}</h3>
                  <p className="text-xs text-slate-300">Issued to {authenticatedCert.participant_name} ({authenticatedCert.register_number})</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/verify/${authenticatedCert.certificate_id}`}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5"
                >
                  <QrCode className="w-4 h-4 text-[#F98A5B]" /> QR Page
                </Link>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(authenticatedCert.verification_url || window.location.href);
                    alert('Certificate Verification Link Copied!');
                  }}
                  className="px-4 py-2 rounded-xl btn-primary-iedc text-xs font-bold text-white flex items-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" /> Share Link
                </button>
              </div>
            </div>

            {/* Certificate Preview Canvas */}
            <CertificateGenerator
              certificate={{
                id: authenticatedCert.certificate_id,
                certificateId: authenticatedCert.certificate_id,
                participantName: authenticatedCert.participant_name,
                registerNumber: authenticatedCert.register_number,
                email: authenticatedCert.email || 'student@gptcpmna.edu.in',
                eventName: authenticatedCert.event_name,
                eventDate: authenticatedCert.event_date || '2026-08-25',
                certificateType: authenticatedCert.certificate_type || 'Participation',
                issueDate: authenticatedCert.event_date || '2026-08-25',
                qrCodeUrl: authenticatedCert.qr_code_url,
                status: 'Verified'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
