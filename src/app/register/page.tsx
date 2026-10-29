'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Share2,
  ArrowLeft,
  Sparkles,
  Ticket,
  Printer,
  ChevronRight,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Lock,
  Search,
  RefreshCw,
  Users
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { getEventRegistrationStatus } from '@/lib/quotaUtils';
import { downloadPass } from '@/lib/downloadHelper';

function getCanonicalDept(dept: string): string {
  const d = (dept || '').trim().toLowerCase();
  if (d.includes('electrical') || d.includes('eee') || d === 'ee') return 'Electrical and Electronics Engineering';
  if (d.includes('electronics') || d.includes('ec') || d === 'ece') return 'Electronics Engineering';
  if (d.includes('civil') || d.includes('ce')) return 'Civil Engineering';
  if (d.includes('mechanical') || d.includes('mech') || d.includes('me')) return 'Mechanical Engineering';
  return dept;
}

function getCanonicalYear(year: string): string {
  const y = (year || '').trim().toLowerCase();
  if (y.includes('1') || y.includes('first') || y.includes('sem 1') || y.includes('sem 2')) return 'First Year';
  if (y.includes('2') || y.includes('second') || y.includes('sem 3') || y.includes('sem 4')) return 'Second Year';
  if (y.includes('3') || y.includes('third') || y.includes('sem 5') || y.includes('sem 6')) return 'Third Year';
  return year;
}

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const preselectedEventId = searchParams.get('event') || searchParams.get('id') || '';

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Form State
  const [participationCategory, setParticipationCategory] = useState<'Internal' | 'External'>('Internal');
  const [eventQuota, setEventQuota] = useState<any | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(false);

  const [formData, setFormData] = useState({
    studentName: '',
    registerNumber: '',
    department: 'Electronics Engineering',
    branch: '',
    academicYear: 'First Year',
    semester: 'Semester 1',
    email: '',
    phone: '',
    collegeName: 'Govt Polytechnic College Perinthalmanna',
    district: 'Malappuram',
    course: '',
    additionalNotes: '',
    consent: true
  });

  const handleYearChange = (newYear: string) => {
    const semestersMap: Record<string, string[]> = {
      'First Year': ['Semester 1', 'Semester 2'],
      'Second Year': ['Semester 3', 'Semester 4'],
      'Third Year': ['Semester 5', 'Semester 6'],
      'Fourth Year': ['Semester 7', 'Semester 8']
    };
    const allowed = semestersMap[newYear] || ['Semester 1', 'Semester 2'];
    setFormData((prev) => ({
      ...prev,
      academicYear: newYear,
      semester: allowed[0]
    }));
  };

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredData, setRegisteredData] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Pass Retrieval Mode State
  const [activeTab, setActiveTab] = useState<'register' | 'lookup'>(
    searchParams.get('lookup') === '1' ? 'lookup' : 'register'
  );
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupCode, setLookupCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLookupPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    const cleanPhone = lookupPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setLookupError('Please enter your 10-digit registered mobile number.');
      return;
    }
    setLookupLoading(true);
    try {
      const res = await fetch('/api/public/registrations/retrieve-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId || undefined,
          phone: cleanPhone,
          registrationCode: lookupCode.trim() || undefined
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No matching confirmed pass found for this mobile number.');
      }
      setRegisteredData(json.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setLookupError(err.message || 'No matching confirmed pass found for this mobile number.');
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/public/events')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setEvents(json.data);
          if (!selectedEventId && json.data.length > 0) {
            setSelectedEventId(json.data[0].id);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingEvents(false));
  }, []);

  useEffect(() => {
    if (preselectedEventId) {
      setSelectedEventId(preselectedEventId);
    }
  }, [preselectedEventId]);

  // Fetch Event Quotas when selectedEventId changes
  useEffect(() => {
    if (!selectedEventId) {
      setEventQuota(null);
      return;
    }
    setLoadingQuota(true);
    fetch(`/api/public/events/${selectedEventId}/quotas`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setEventQuota(json);
          // If Single Class mode, lock department and year
          if (json.participationType === 'Single Class' && json.singleClass) {
            setFormData((prev) => ({
              ...prev,
              department: json.singleClass.department,
              academicYear: json.singleClass.academicYear,
              collegeName: 'Govt Polytechnic College Perinthalmanna'
            }));
            setParticipationCategory('Internal');
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingQuota(false));
  }, [selectedEventId]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedEventId) {
      setErrorMessage('Please select an event or workshop to register for.');
      return;
    }

    if (!formData.studentName.trim()) {
      setErrorMessage('Please enter your full legal student name.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid student email address.');
      return;
    }

    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (participationCategory === 'External') {
      if (!formData.collegeName.trim()) {
        setErrorMessage('Please enter your Institution / College name.');
        return;
      }
      if (!formData.branch.trim()) {
        setErrorMessage('Please enter your Branch / Department name (e.g. Computer Science, Mechanical, Electronics, etc.).');
        return;
      }
    }

    if (!formData.consent) {
      setErrorMessage('You must confirm the attendance declaration checkbox to register.');
      return;
    }

    setSubmitting(true);

    try {
      const chosenDept = participationCategory === 'Internal' ? formData.department : formData.branch.trim();
      const res = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          ...formData,
          department: chosenDept,
          branch: chosenDept,
          participationCategory,
          collegeName:
            participationCategory === 'Internal'
              ? 'Govt Polytechnic College Perinthalmanna'
              : formData.collegeName.trim()
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit registration. Please try again.');
      }

      setRegisteredData(json.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 3000);
  };

  const openWhatsAppShare = () => {
    if (!registeredData) return;
    const text = encodeURIComponent(
      `Hello! I registered for "${registeredData.eventTitle}" at IEDC GPTC Perinthalmanna.\nMy Registration ID: ${registeredData.registrationCode}\nName: ${registeredData.studentName}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  // SUCCESS CONFIRMATION PASS VIEW
  if (registeredData) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white">Registration Confirmed!</h1>
          <p className="text-neutral-400 text-sm">
            Your seat has been reserved. Please save your official registration pass below for event entry.
          </p>
        </div>

        {/* Digital Entry Pass */}
        <div
          id="registration-pass"
          className="rounded-3xl border border-white/20 bg-[#121216] p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#F98A5B] uppercase block">
                OFFICIAL ENTRY PASS • IEDC GPTC PMNA
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {registeredData.eventTitle}
              </h2>
            </div>
            {registeredData.status === 'Waitlisted' ? (
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs font-bold">
                WAITLISTED #{registeredData.waitlistPosition || 1}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                CONFIRMED
              </span>
            )}
          </div>

          {/* Registration Code Display */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-neutral-400 uppercase">Registration ID</span>
              <p className="text-2xl font-mono font-black text-white tracking-wider">
                {registeredData.registrationCode}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(registeredData.registrationCode)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#F98A5B]" />
              <span>{copiedId ? 'Copied!' : 'Copy Pass ID'}</span>
            </button>
          </div>

          {/* QR Code & Student Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            <div className="p-4 rounded-2xl bg-white p-3 flex flex-col items-center justify-center shrink-0 w-fit mx-auto">
              <QRCode
                value={
                  registeredData.qrPayload ||
                  `IEDCPASS:${registeredData.eventId}:${registeredData.registrationCode}:${registeredData.passToken || registeredData.id}`
                }
                size={130}
              />
              <span className="text-[9px] font-mono text-black font-bold mt-2">SCAN FOR CHECK-IN</span>
            </div>

            <div className="sm:col-span-2 space-y-2.5 text-xs text-neutral-300">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-neutral-500 font-medium">Participant:</span>
                <span className="font-bold text-white">{registeredData.studentName}</span>
              </div>
              {registeredData.registerNumber && registeredData.registerNumber !== 'N/A' && !registeredData.registerNumber.startsWith('REG-') && (
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-neutral-500 font-medium">Register No:</span>
                  <span className="font-mono text-white">{registeredData.registerNumber}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-neutral-500 font-medium">Branch / Dept:</span>
                <span className="text-white">{registeredData.department}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-neutral-500 font-medium">Year &amp; Semester:</span>
                <span className="text-white">
                  {registeredData.academicYear}
                  {registeredData.semester ? ` • ${registeredData.semester}` : ''}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-neutral-500 font-medium">Institution:</span>
                <span className="text-white truncate max-w-[200px]">{registeredData.collegeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Registered On:</span>
                <span className="font-mono text-neutral-400">
                  {new Date(registeredData.registeredAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Notice */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-neutral-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#F98A5B] shrink-0 mt-0.5" />
            <span>
              Show this pass at the IEDC reception desk on the day of the event. A confirmation email has been logged in
              our database.
            </span>
          </div>
        </div>

        {/* Pass Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={`/api/public/registrations/${registeredData.id}/pass/pdf`}
            download={`IEDC_Pass_${(registeredData.studentName || 'Student').replace(/\s+/g, '_')}.pdf`}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] hover:opacity-90 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#F98A5B]/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Pass (PDF)</span>
          </a>
          <a
            href={`/api/public/registrations/${registeredData.id}/pass/png`}
            download={`IEDC_Pass_${(registeredData.studentName || 'Student').replace(/\s+/g, '_')}.png`}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#F98A5B]" />
            <span>Download Pass (PNG)</span>
          </a>
          <a
            href={`/api/public/registrations/${registeredData.id}/pass/jpg`}
            download={`IEDC_Pass_${(registeredData.studentName || 'Student').replace(/\s+/g, '_')}.jpg`}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Download Pass (JPG)</span>
          </a>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#F98A5B]" />
            <span>Print Pass</span>
          </button>
          <button
            onClick={openWhatsAppShare}
            className="px-5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Share via WhatsApp</span>
          </button>
          <button
            onClick={() => {
              setRegisteredData(null);
              setActiveTab('register');
              setFormData({
                studentName: '',
                registerNumber: '',
                department: 'Electronics Engineering',
                branch: '',
                academicYear: 'First Year',
                semester: 'Semester 1',
                email: '',
                phone: '',
                collegeName: 'Govt Polytechnic College Perinthalmanna',
                district: 'Malappuram',
                course: '',
                additionalNotes: '',
                consent: true
              });
            }}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Register Another Participant
          </button>
          <Link
            href="/events"
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Back to All Events</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // REGISTRATION FORM VIEW
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-8">
      {/* Top Breadcrumb & Heading */}
      <div className="space-y-3">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Events Catalog</span>
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#F98A5B] text-xs font-mono">
          <Ticket className="w-3.5 h-3.5" /> STUDENT EVENT REGISTRATION &amp; PASSES
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Event Registration &amp; Passes</h1>
        <p className="text-neutral-400 text-sm">
          Register for campus bootcamps, technical workshops, and hackathons hosted by IEDC GPTC
          Perinthalmanna, or retrieve your official entry pass.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex rounded-2xl bg-[#121216] p-1.5 border border-white/10 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('register')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'register'
              ? 'bg-[#F98A5B] text-black shadow-md shadow-[#F98A5B]/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>New Registration</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lookup')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'lookup'
              ? 'bg-[#F98A5B] text-black shadow-md shadow-[#F98A5B]/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Retrieve Existing Pass</span>
        </button>
      </div>

      {/* Pass Retrieval Card View */}
      {activeTab === 'lookup' && (
        <form
          onSubmit={handleLookupPass}
          className="p-6 sm:p-8 rounded-3xl bg-[#121216] border border-white/10 space-y-6 shadow-xl"
        >
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-[#F98A5B]" /> Retrieve Your Event Entry Pass
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Already registered? Enter your details below to download your official PDF or PNG QR pass.
            </p>
          </div>

          {lookupError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Program / Event <span className="text-slate-500 font-normal">(Optional — auto-detects by phone)</span>
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              >
                <option value="">-- All Programs / Auto-Detect by Mobile Number --</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} — {e.date}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Registered Mobile Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-4 py-3 text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Pass ID / Reg Code <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                  placeholder="e.g. REG-2026-12345"
                  className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-4 py-3 text-sm text-white focus:outline-none uppercase font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={lookupLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] hover:opacity-90 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#F98A5B]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{lookupLoading ? 'Locating Pass...' : 'Find and Download Pass'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Main Registration Box */}
      {activeTab === 'register' && (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-[#121216] border border-white/10 space-y-6 shadow-xl">
          {/* Step 1: Event Selection */}
          <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Select Event / Workshop <span className="text-red-400">*</span>
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={loadingEvents}
            className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} — {e.date} ({e.category})
              </option>
            ))}
          </select>

          {/* Selected Event Details Card */}
          {selectedEvent && (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-white text-sm block">{selectedEvent.title}</span>
                <div className="flex flex-wrap items-center gap-3 text-neutral-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[#F98A5B]" /> {selectedEvent.date}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" /> {selectedEvent.time || '10:00 AM - 04:00 PM'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#EC3A74]" /> {selectedEvent.venue}
                  </span>
                </div>
              </div>
              <div className="shrink-0 font-mono text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300">
                Seats Available: <span className="font-bold text-[#F98A5B]">{selectedEvent.seatsAvailable ?? 50}</span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Participation Category (If Statewide) */}
        {eventQuota?.isStatewide && (
          <div className="space-y-2 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
              Participation Category <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setParticipationCategory('Internal');
                  setFormData((prev) => ({
                    ...prev,
                    collegeName: 'Govt Polytechnic College Perinthalmanna'
                  }));
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  participationCategory === 'Internal'
                    ? 'border-[#F98A5B] bg-[#F98A5B]/15 text-white font-bold'
                    : 'border-white/10 bg-black/40 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs">Govt Polytechnic College Perinthalmanna</div>
                <div className="text-[10px] text-slate-400 font-normal">Internal College Quota (12 Classes)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setParticipationCategory('External');
                  setFormData((prev) => ({
                    ...prev,
                    collegeName: prev.collegeName.includes('Perinthalmanna') ? '' : prev.collegeName
                  }));
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  participationCategory === 'External'
                    ? 'border-purple-400 bg-purple-500/15 text-white font-bold'
                    : 'border-white/10 bg-black/40 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs">Other Polytechnic / College</div>
                <div className="text-[10px] text-slate-400 font-normal">Statewide Shared External Quota</div>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Student Details Grid */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {participationCategory === 'Internal' ? 'College Student Information' : 'External Participant Information'}
            </h3>
            {/* Live Availability Badge */}
            {eventQuota && (
              <div>
                {participationCategory === 'Internal' ? (
                  (() => {
                    const classKey = `${formData.department}__${formData.academicYear}`;
                    const cls = eventQuota.classes?.[classKey];
                    if (!cls) return null;
                    return (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          cls.status === 'OPEN'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : cls.status === 'LIMITED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : cls.status === 'WAITLIST_AVAILABLE'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : cls.status === 'FULL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border border-white/10'
                        }`}
                      >
                        {cls.status === 'OPEN' && `● Open (${cls.remainingSeats} Seats Left)`}
                        {cls.status === 'LIMITED' && `● Limited (${cls.remainingSeats} Seats Left)`}
                        {cls.status === 'WAITLIST_AVAILABLE' && '● Class Full — Waitlist Open'}
                        {cls.status === 'FULL' && '● Class Full'}
                        {cls.status === 'DISABLED' && '● Class Registration Disabled'}
                      </span>
                    );
                  })()
                ) : (
                  (() => {
                    const ext = eventQuota.externalQuota;
                    if (!ext) return null;
                    return (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          ext.status === 'OPEN'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : ext.status === 'LIMITED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : ext.status === 'WAITLIST_AVAILABLE'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {ext.status === 'OPEN' && `● External Open (${ext.remainingSeats} Seats Left)`}
                        {ext.status === 'LIMITED' && `● Limited (${ext.remainingSeats} Seats Left)`}
                        {ext.status === 'WAITLIST_AVAILABLE' && '● External Full — Waitlist Open'}
                        {ext.status === 'FULL' && '● External Quota Full'}
                      </span>
                    );
                  })()
                )}
              </div>
            )}
          </div>

          {/* Single Class Locked Banner */}
          {participationCategory === 'Internal' &&
            eventQuota?.participationType === 'Single Class' &&
            eventQuota.singleClass && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-medium">
                <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  Single Class Enrollment: This program is open exclusively to{' '}
                  <strong className="text-white">
                    {eventQuota.singleClass.department} ({eventQuota.singleClass.academicYear})
                  </strong>
                  . Other classes cannot register.
                </span>
              </div>
            )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#F98A5B]" />
                Full Legal Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MUHAMMED ASHFAK"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value.toUpperCase() })}
                onBlur={(e) => setFormData({ ...formData, studentName: e.target.value.trim().toUpperCase() })}
                className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none uppercase"
              />
            </div>

            {/* If Internal: 4 Departments, 3 Academic Years & Dynamic Semesters */}
            {participationCategory === 'Internal' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#F98A5B]" />
                    Academic Department <span className="text-red-400">*</span>
                  </label>
                  <select
                    disabled={eventQuota?.participationType === 'Single Class'}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none disabled:opacity-60"
                  >
                    <option value="Electronics Engineering">Electronics Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical and Electronics Engineering">
                      Electrical and Electronics Engineering
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Academic Year <span className="text-red-400">*</span>
                  </label>
                  <select
                    disabled={eventQuota?.participationType === 'Single Class'}
                    value={formData.academicYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none disabled:opacity-60"
                  >
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Semester <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    {formData.academicYear === 'First Year' && (
                      <>
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                      </>
                    )}
                    {formData.academicYear === 'Second Year' && (
                      <>
                        <option value="Semester 3">Semester 3</option>
                        <option value="Semester 4">Semester 4</option>
                      </>
                    )}
                    {formData.academicYear === 'Third Year' && (
                      <>
                        <option value="Semester 5">Semester 5</option>
                        <option value="Semester 6">Semester 6</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Admission / Register Number <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 23010410"
                    value={formData.registerNumber}
                    onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none uppercase font-mono"
                  />
                </div>
              </>
            ) : (
              /* If External: College Name, Free-text Branch, Academic Year (1-4), Dynamic Semesters (1-8), District */
              <>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-purple-400" />
                    College / Institution Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Govt Engineering College Thrissur / NSS College of Engineering"
                    value={formData.collegeName}
                    onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 focus:border-purple-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                    Branch / Department <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science, AI & DS, Robotics, ECE"
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData({ ...formData, branch: e.target.value, department: e.target.value })
                    }
                    className="w-full bg-[#18181D] border border-white/10 focus:border-purple-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Academic Year <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.academicYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full bg-[#18181D] border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="First Year">First Year (1st Year)</option>
                    <option value="Second Year">Second Year (2nd Year)</option>
                    <option value="Third Year">Third Year (3rd Year)</option>
                    <option value="Fourth Year">Fourth Year (4th Year)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Semester <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    {formData.academicYear === 'First Year' && (
                      <>
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                      </>
                    )}
                    {formData.academicYear === 'Second Year' && (
                      <>
                        <option value="Semester 3">Semester 3</option>
                        <option value="Semester 4">Semester 4</option>
                      </>
                    )}
                    {formData.academicYear === 'Third Year' && (
                      <>
                        <option value="Semester 5">Semester 5</option>
                        <option value="Semester 6">Semester 6</option>
                      </>
                    )}
                    {formData.academicYear === 'Fourth Year' && (
                      <>
                        <option value="Semester 7">Semester 7</option>
                        <option value="Semester 8">Semester 8</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">District <span className="text-red-400">*</span></label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    {[
                      'Malappuram',
                      'Palakkad',
                      'Kozhikode',
                      'Thrissur',
                      'Ernakulam',
                      'Wayanad',
                      'Kannur',
                      'Kasaragod',
                      'Kottayam',
                      'Kollam',
                      'Thiruvananthapuram',
                      'Alappuzha',
                      'Idukki',
                      'Pathanamthitta',
                      'Outside Kerala'
                    ].map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#F98A5B]" />
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="name@gptcpmna.edu.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#F98A5B]" />
                WhatsApp / Mobile No <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* College Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">College / Polytechnic Institution</label>
            <input
              type="text"
              value={formData.collegeName}
              onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
              className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Questions / Dietary / Technical Experience (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Any prior hardware experience, laptop availability, or special questions..."
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Consent Declaration */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
          <input
            type="checkbox"
            id="consent-check"
            checked={formData.consent}
            onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-white/20 text-[#F98A5B] focus:ring-[#F98A5B] bg-[#18181D]"
          />
          <label htmlFor="consent-check" className="text-xs text-neutral-300 leading-relaxed cursor-pointer">
            I confirm that the details provided above are accurate. I commit to attending the scheduled event sessions
            at Govt Polytechnic College Perinthalmanna and adhering to IEDC campus guidelines.
          </label>
        </div>

        {/* Event Registration Closure Notice */}
        {selectedEvent && !getEventRegistrationStatus(selectedEvent).isOpen && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Registration Closed: {getEventRegistrationStatus(selectedEvent).reason}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || (Boolean(selectedEvent) && !getEventRegistrationStatus(selectedEvent).isOpen)}
          className="w-full py-3.5 rounded-2xl bg-[#F98A5B] hover:bg-[#F98A5B]/90 text-black font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span>Confirming Registration...</span>
          ) : selectedEvent && !getEventRegistrationStatus(selectedEvent).isOpen ? (
            <span>{getEventRegistrationStatus(selectedEvent).statusText}</span>
          ) : (
            <>
              <Ticket className="w-4 h-4" />
              <span>Submit &amp; Generate Event Pass</span>
            </>
          )}
        </button>
      </form>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white text-xs font-mono">
          Loading registration portal...
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
