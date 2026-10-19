'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Award, Sparkles, QrCode, FileText, ArrowRight, Download, RefreshCw } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [registered, setRegistered] = useState<Record<string, boolean>>({});

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/public/events');
      const data = await res.json();
      if (data.success && data.data) {
        setEvents(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRegister = (id: string, title: string) => {
    setRegistered(prev => ({ ...prev, [id]: true }));
    alert(`Registration initiated for ${title}. Please visit the front desk on the event day or check your email for the entrance pass.`);
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-mono">
          <Calendar className="w-3.5 h-3.5 text-[#F98A5B]" /> EVENTS & WORKSHOPS
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          Innovation & Tech <span className="text-[#F98A5B]">Programs</span>
        </h1>
        <p className="text-neutral-400 text-sm max-w-2xl mx-auto">
          Participate in state-level hackathons, IoT bootcamps, and technical seminars organized by IEDC GPTC Perinthalmanna.
        </p>

        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/certificates"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold text-xs transition-colors"
          >
            <Award className="w-4 h-4 text-[#F98A5B]" />
            Claim / Download Event Certificate
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Featured Hackathon Banner */}
      <div className="p-8 rounded-3xl border border-white/10 relative overflow-hidden bg-neutral-900/90 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl">
        <div className="space-y-4 max-w-xl">
          <span className="px-3 py-1 rounded-full bg-[#F98A5B]/20 text-[#F98A5B] font-mono text-xs font-bold border border-[#F98A5B]/40">
            NEXT BIG EVENT • 24 HOURS HACKATHON
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">GPTC PMNA Hackathon 2026</h2>
          <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
            Build hardware & software solutions for Smart Campus, Green Energy, and Healthcare. Win prizes worth ₹50,000 + KSUM Incubation.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#F98A5B]">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#EC3A74]" /> Aug 20, 2026</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#F98A5B]" /> Main Auditorium</span>
          </div>
        </div>

        {/* QR Check-in Box */}
        <div className="p-6 rounded-2xl border border-white/10 bg-black/40 text-center space-y-3 shrink-0">
          <QrCode className="w-16 h-16 text-[#F98A5B] mx-auto glow-orange" />
          <p className="text-xs font-bold text-white">On-site Attendance Check-In</p>
          <button
            onClick={() => setShowQRModal(true)}
            className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-colors"
          >
            Show Pass QR Code
          </button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Upcoming & Active Events</span>
            <span className="text-xs font-normal text-neutral-400">({events.length} Published)</span>
          </h2>
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="p-2 rounded-lg bg-neutral-900 border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white transition-colors"
            title="Refresh events"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F98A5B]" />
            Loading events from database...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-3xl bg-neutral-950/60 border border-white/10 text-neutral-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
            <p className="font-semibold text-white">No active events published yet.</p>
            <p className="text-xs mt-1">Please check back soon or consult the administration.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((e) => (
              <div key={e.id} className="rounded-3xl border border-white/10 bg-neutral-900/60 overflow-hidden flex flex-col justify-between hover:border-white/25 transition-all">
                <div className="relative h-48 w-full bg-neutral-800">
                  <img
                    src={e.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
                    alt={e.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#F98A5B]/40 text-[11px] font-bold text-[#F98A5B]">
                    {e.category || 'Workshop'}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-[#F98A5B] font-bold">{e.level || 'State'} Level Program</span>
                    <h3 className="text-lg font-bold text-white leading-snug">{e.title}</h3>
                    <p className="text-neutral-400 text-xs line-clamp-3 leading-relaxed">{e.description}</p>
                  </div>

                  <div className="space-y-2 text-xs text-neutral-300 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#F98A5B] shrink-0" />
                      <span>{e.date} {e.time ? `• ${e.time}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#EC3A74] shrink-0" />
                      <span>{e.venue || 'College Auditorium'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                      <span className="text-neutral-400">Seats Left:</span>
                      <span className="font-bold text-[#F98A5B]">{e.seatsAvailable ?? 50} / {e.totalSeats ?? 60}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    {e.brochureUrl && (
                      <a
                        href={e.brochureUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#F98A5B]" />
                        Download Event Brochure
                      </a>
                    )}

                    <button
                      onClick={() => handleRegister(e.id, e.title)}
                      disabled={registered[e.id] || (e.seatsAvailable === 0)}
                      className="w-full py-2.5 rounded-xl bg-[#F98A5B] hover:bg-[#fa753e] text-neutral-950 font-bold text-xs shadow-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {registered[e.id] ? 'Registered ✓' : (e.seatsAvailable === 0 ? 'Seats Full' : 'Register Now')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 rounded-3xl border border-[#F98A5B]/40 bg-neutral-900 text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Event Entry Pass</h3>
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=IEDC-PMNA-ATTENDANCE-PASS"
              alt="QR Code"
              className="w-48 h-48 mx-auto rounded-xl border border-[#F98A5B] p-2 bg-white"
            />
            <p className="text-xs text-neutral-300">Scan at the entrance table for instant attendance validation.</p>
            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

