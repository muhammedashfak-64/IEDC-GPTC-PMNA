'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
  FileCheck,
  User,
  Phone,
  Eye,
  Award,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function VerifyPage() {
  const [programsList, setProgramsList] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authenticatedCert, setAuthenticatedCert] = useState<any>(null);

  // Load programs from database
  useEffect(() => {
    fetch('/api/admin/events')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const published = json.data.filter((e: any) => e.status === 'Published');
          setProgramsList(published);
          if (published.length > 0) {
            setSelectedEventId(published[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setAuthenticatedCert(null);

    try {
      const res = await fetch('/api/public/certificates/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEventId,
          full_name: fullName,
          mobile_number: mobileNumber
        })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(
          json.error || 'No published certificate was found for the supplied details.'
        );
      } else {
        setAuthenticatedCert(json.certificate);
      }
    } catch (err: any) {
      setErrorMessage('No published certificate was found for the supplied details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10 min-h-screen relative z-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F98A5B]/15 border border-[#F98A5B]/40 text-[#F98A5B] text-xs font-mono font-bold tracking-wider uppercase">
          <ShieldCheck className="w-4 h-4" /> Official Certificate Portal
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">Student Certificate Portal</h1>
        <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
          Select your program, enter your full name and registered 10-digit mobile number to retrieve and download your official certificate.
        </p>
      </div>

      {/* Program Selector & Credentials Form */}
      <div className="max-w-2xl mx-auto glass-iedc p-8 rounded-3xl border border-white/12 shadow-2xl space-y-6">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          {/* 1. Program Select */}
          <div>
            <label className="text-xs font-bold text-[#F98A5B] uppercase tracking-wider block mb-1.5">
              1. Select Program / Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-[#0F0F10] border border-white/20 focus:border-[#F98A5B] rounded-xl px-4 py-3 text-xs text-white focus:outline-none cursor-pointer"
            >
              {programsList.map((prog) => (
                <option key={prog.id} value={prog.id} className="bg-[#0F0F10] text-white">
                  {prog.title} ({prog.date})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Full Name (Flexible Name Matching) */}
          <div>
            <label className="text-xs font-bold text-[#EC3A74] uppercase tracking-wider block mb-1.5">
              2. Full Name (as registered)
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Muhammed Ashfak O"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#0F0F10] border border-white/20 focus:border-[#EC3A74] rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none placeholder:text-slate-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Flexible matching: Case and spacing differences are handled automatically.
            </span>
          </div>

          {/* 3. Registered Mobile Number */}
          <div>
            <label className="text-xs font-bold text-[#6249A3] uppercase tracking-wider block mb-1.5">
              3. Registered Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="tel"
                required
                placeholder="10-digit registered number (e.g. 9847123456)"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                maxLength={10}
                className="w-full bg-[#0F0F10] border border-white/20 focus:border-[#6249A3] rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none font-mono placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] font-black text-xs text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01] disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>{loading ? 'Verifying Details...' : 'Find & Retrieve My Certificate'}</span>
          </button>
        </form>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Authenticated Certificate Result Card */}
      {authenticatedCert && (
        <div className="max-w-3xl mx-auto glass-iedc p-8 rounded-3xl border border-emerald-500/30 space-y-6 shadow-2xl animate-fade-in bg-emerald-500/[0.03]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Certificate Verified & Ready
              </span>
              <h2 className="text-2xl font-black text-white">{authenticatedCert.participantName}</h2>
              <p className="text-xs text-slate-300 mt-1">{authenticatedCert.eventName}</p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={authenticatedCert.downloadUrl}
                download={`${authenticatedCert.participantName}_${authenticatedCert.certificateId}.pdf`}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg hover:opacity-95 transition-all"
              >
                <Download className="w-4 h-4" /> Download Certificate (PDF)
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Certificate ID</span>
              <span className="font-mono font-bold text-[#F98A5B] mt-0.5 block truncate">
                {authenticatedCert.certificateId}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Role</span>
              <span className="font-bold text-white mt-0.5 block">{authenticatedCert.certificateType}</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Event Date</span>
              <span className="text-slate-200 mt-0.5 block">{authenticatedCert.eventDate}</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Issued On</span>
              <span className="text-slate-200 mt-0.5 block">{authenticatedCert.issueDate}</span>
            </div>
          </div>

          {/* Embedded Interactive PDF Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Official Certificate Preview</span>
              <a
                href={authenticatedCert.downloadUrl}
                target="_blank"
                className="text-xs font-bold text-[#F98A5B] hover:underline flex items-center gap-1"
              >
                Open Fullscreen <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="aspect-[1.414/1] w-full rounded-2xl border border-white/15 bg-white/5 overflow-hidden shadow-2xl">
              <iframe
                src={`${authenticatedCert.downloadUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title="Your Certificate"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
