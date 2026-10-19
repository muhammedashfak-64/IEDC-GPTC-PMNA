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
  GraduationCap
} from 'lucide-react';
import QRCode from 'react-qr-code';

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const preselectedEventId = searchParams.get('event') || searchParams.get('id') || '';

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    studentName: '',
    registerNumber: '',
    department: 'Computer Engineering',
    academicYear: '2nd Year',
    email: '',
    phone: '',
    collegeName: 'Govt Polytechnic College Perinthalmanna',
    additionalNotes: '',
    consent: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredData, setRegisteredData] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState(false);

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

    if (!formData.registerNumber.trim()) {
      setErrorMessage('Please enter your Admission / Register number.');
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

    if (!formData.consent) {
      setErrorMessage('You must confirm the attendance declaration checkbox to register.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          ...formData
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
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
              CONFIRMED
            </span>
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
              <QRCode value={registeredData.registrationCode} size={130} />
              <span className="text-[9px] font-mono text-black font-bold mt-2">SCAN FOR CHECK-IN</span>
            </div>

            <div className="sm:col-span-2 space-y-2.5 text-xs text-neutral-300">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-neutral-500 font-medium">Participant:</span>
                <span className="font-bold text-white">{registeredData.studentName}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-neutral-500 font-medium">Register No:</span>
                <span className="font-mono text-white">{registeredData.registerNumber}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-neutral-500 font-medium">Department:</span>
                <span className="text-white">{registeredData.department}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-neutral-500 font-medium">Academic Year:</span>
                <span className="text-white">{registeredData.academicYear}</span>
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
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#F98A5B]" />
            <span>Print Pass / Save PDF</span>
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
              setFormData({
                studentName: '',
                registerNumber: '',
                department: 'Computer Engineering',
                academicYear: '2nd Year',
                email: '',
                phone: '',
                collegeName: 'Govt Polytechnic College Perinthalmanna',
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
            className="px-5 py-2.5 rounded-xl bg-[#F98A5B] hover:bg-[#F98A5B]/90 text-black font-bold text-xs flex items-center gap-1.5 transition-colors"
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
          <Ticket className="w-3.5 h-3.5" /> STUDENT EVENT REGISTRATION
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Event Registration Form</h1>
        <p className="text-neutral-400 text-sm">
          Register independently for campus bootcamps, technical workshops, and hackathons hosted by IEDC GPTC
          Perinthalmanna.
        </p>
      </div>

      {/* Main Registration Box */}
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

        {/* Step 2: Student Details Grid */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/10 pb-2">
            Student Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#F98A5B]" />
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Muhammed Ashfak"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Admission / Register Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#F98A5B]" />
                Admission / Register No <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 21051234 or ADM9841"
                value={formData.registerNumber}
                onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#F98A5B]" />
                Department <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Electronics Engineering">Electronics Engineering</option>
                <option value="Electrical & Electronics Engineering">Electrical &amp; Electronics Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="General Engineering">General / Other</option>
              </select>
            </div>

            {/* Academic Year */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Academic Year / Semester</label>
              <select
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="1st Year (Sem 1 & 2)">1st Year (Sem 1 &amp; 2)</option>
                <option value="2nd Year (Sem 3 & 4)">2nd Year (Sem 3 &amp; 4)</option>
                <option value="3rd Year (Sem 5 & 6)">3rd Year (Sem 5 &amp; 6)</option>
                <option value="Alumni / External">Alumni / External</option>
              </select>
            </div>

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
          disabled={submitting}
          className="w-full py-3.5 rounded-2xl bg-[#F98A5B] hover:bg-[#F98A5B]/90 text-black font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
        >
          {submitting ? (
            <span>Confirming Registration...</span>
          ) : (
            <>
              <Ticket className="w-4 h-4" />
              <span>Submit &amp; Generate Event Pass</span>
            </>
          )}
        </button>
      </form>
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
