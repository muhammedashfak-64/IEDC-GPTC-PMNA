'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Award, Sparkles, QrCode, FileText, ArrowRight, Download, RefreshCw } from 'lucide-react';
import { getEventRegistrationStatus } from '@/lib/quotaUtils';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

      {/* Featured Spotlight Banner */}
      {events.length > 0 && (
        <div className="p-8 rounded-3xl border border-white/10 relative overflow-hidden bg-neutral-900/90 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl">
          <div className="space-y-4 max-w-xl">
            <span className="px-3 py-1 rounded-full bg-[#F98A5B]/20 text-[#F98A5B] font-mono text-xs font-bold border border-[#F98A5B]/40">
              FEATURED PROGRAM • {events[0].category ? events[0].category.toUpperCase() : 'INNOVATION'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">{events[0].title}</h2>
            <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed line-clamp-3">
              {events[0].description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#F98A5B]">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#EC3A74]" /> {events[0].date} {events[0].time ? `• ${events[0].time}` : ''}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#F98A5B]" /> {events[0].venue || 'Main Auditorium'}</span>
            </div>

            <div className="pt-2">
              {(() => {
                const regStatus = getEventRegistrationStatus(events[0]);
                return regStatus.isOpen ? (
                  <Link
                    href={`/register?event=${events[0].id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F98A5B] hover:bg-[#fa753e] text-black font-extrabold text-xs transition-colors shadow-lg"
                  >
                    <span>Register for This Event</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-400 font-bold text-xs border border-white/10 cursor-not-allowed">
                    <span>{regStatus.statusText}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* QR Check-in Box */}
          <div className="p-6 rounded-2xl border border-white/10 bg-black/40 text-center space-y-3 shrink-0">
            <QrCode className="w-16 h-16 text-[#F98A5B] mx-auto glow-orange" />
            <p className="text-xs font-bold text-white">Event Entry Pass</p>
            <Link
              href="/register?lookup=1"
              className="inline-block w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-colors"
            >
              Retrieve Pass / QR Code
            </Link>
          </div>
        </div>
      )}

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

                    {(() => {
                      const regStatus = getEventRegistrationStatus(e);
                      return regStatus.isOpen ? (
                        <div className="space-y-1">
                          <Link
                            href={`/register?event=${e.id}`}
                            className="w-full py-2.5 rounded-xl bg-[#F98A5B] hover:bg-[#fa753e] text-neutral-950 font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Register for Event</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          {regStatus.deadlineFormatted && (
                            <span className="text-[10px] text-neutral-400 block text-center">
                              Closes: {regStatus.deadlineFormatted}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-full py-2.5 rounded-xl bg-neutral-800 text-neutral-400 font-bold text-xs text-center border border-white/10 cursor-not-allowed">
                          <span>{regStatus.statusText}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

