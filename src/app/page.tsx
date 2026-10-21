'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ParticleBackground } from '@/components/ParticleBackground';
import { useApp } from '@/context/AppContext';
import {
  Rocket,
  Calendar,
  MapPin,
  Clock,
  Megaphone,
  ArrowRight,
  Users,
  Cpu,
  Lightbulb,
  Trophy,
  GraduationCap,
  FileCheck,
  Building2,
  CheckCircle2,
  Code,
  Globe,
  Share2,
  Zap,
  Star,
  ChevronRight,
  ExternalLink,
  Film,
  Sparkles,
} from 'lucide-react';
import { InstagramIcon as Instagram } from '@/components/SocialIcons';
import AnimatedProfileCard, { ProfileCardData } from '@/components/team/AnimatedProfileCard';

/* ─── PARTNER ORGANIZATIONS ──────────────────────────── */
const PARTNERS = [
  {
    name: 'IEDC Kerala',
    logo: '/iedc-logo.png',
    href: 'https://iedckerala.in',
    desc: 'Nurturing campus entrepreneurship & technical innovation across colleges in Kerala.',
  },
  {
    name: 'Kerala Startup Mission (KSUM)',
    logo: '/ksum-logo.png',
    href: 'https://startupmission.kerala.gov.in',
    desc: 'Nodal agency of Govt. of Kerala for entrepreneurship development and startup incubation.',
  },
  {
    name: 'Young Innovators Programme (YIP)',
    logo: '/yip-logo.png',
    href: 'https://yip.kerala.gov.in',
    desc: 'Flagship program by K-DISC to empower youth to solve real-world community problems.',
  },
  {
    name: 'MuLearn',
    logo: '/mulearn-logo.png',
    href: 'https://mulearn.org',
    desc: 'Peer-to-peer learning network empowering students with industry skills & mentorship.',
  },
];

/* ─── STATS ──────────────────────────────────────────── */
const STATS = [
  { icon: Users,        value: '650+', label: 'Active Members',   from: '#F98A5B', to: '#EC3A74' },
  { icon: Rocket,       value: '120+', label: 'Student Projects',  from: '#EC3A74', to: '#6249A3' },
  { icon: Calendar,     value: '35+',  label: 'Events Hosted',    from: '#6249A3', to: '#201547' },
  { icon: Lightbulb,    value: '15+',  label: 'Incubated Startups',from: '#F98A5B', to: '#6249A3' },
  { icon: Trophy,       value: '25+',  label: 'Awards & Prizes',   from: '#EC3A74', to: '#F98A5B' },
];

/* ─── EXPLORE CARDS ──────────────────────────────────── */
const EXPLORE_CARDS = [
  { href: '/projects',    icon: Lightbulb,    label: 'Projects',      sub: 'Innovative prototypes by our students.',    from: '#F98A5B', to: '#EC3A74' },
  { href: '/events',      icon: Calendar,     label: 'Events',        sub: 'Workshops, hackathons and more.',           from: '#EC3A74', to: '#6249A3' },
  { href: '/startups',    icon: Rocket,       label: 'Startups',      sub: 'Student ventures nurtured by IEDC.',       from: '#6249A3', to: '#201547' },
  { href: '/learning',    icon: GraduationCap,label: 'Learning Hub',  sub: 'Courses, notes and expert sessions.',      from: '#6249A3', to: '#EC3A74' },
  { href: '/verify',      icon: FileCheck,    label: 'Certificates',  sub: 'Download and verify your certificates.',   from: '#F98A5B', to: '#6249A3' },
  { href: '/community',   icon: Users,        label: 'Community',     sub: 'Collaborate and grow with IEDC peers.',    from: '#EC3A74', to: '#F98A5B' },
];

export default function HomePage() {
  const { registerForEvent, addToast } = useApp();
  const [teamMembers, setTeamMembers] = useState<ProfileCardData[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [homepageData, setHomepageData] = useState<{
    settings?: any;
    heroVisual?: {
      campusPhotoUrl: string;
      bgOpacity: number;
      bgBlur: number;
      darkOverlayOpacity: number;
      imagePosition: string;
      bgScale: number;
    };
    upcomingEvents?: any[];
    ongoingEvents?: any[];
    announcements?: any[];
  }>({});
  const [hpLoading, setHpLoading] = useState(true);

  useEffect(() => {
    // Real-time CMS homepage data: events, announcements, hero visuals
    fetch('/api/public/homepage')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setHomepageData(data.data);
        }
      })
      .catch((err) => console.error('Failed to load homepage CMS data:', err))
      .finally(() => setHpLoading(false));

    // Dynamic Student Leads
    fetch('/api/public/team')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setTeamMembers(data.data);
        }
      })
      .catch((err) => console.error('Failed to load team leads on homepage:', err))
      .finally(() => setTeamLoading(false));
  }, []);

  const heroVisual = homepageData.heroVisual || {
    campusPhotoUrl: '/campus-main.jpeg',
    bgOpacity: 28,
    bgBlur: 12,
    darkOverlayOpacity: 85,
    imagePosition: 'center',
    bgScale: 104
  };

  const bgOpacityFloat = (heroVisual.bgOpacity ?? 28) / 100;
  const bgBlurPx = heroVisual.bgBlur ?? 12;
  const darkOverlayFloat = (heroVisual.darkOverlayOpacity ?? 85) / 100;
  const bgScaleFloat = (heroVisual.bgScale ?? 104) / 100;
  const objectPos = heroVisual.imagePosition || 'center';

  const upcomingEvent = homepageData.upcomingEvents && homepageData.upcomingEvents.length > 0
    ? homepageData.upcomingEvents[0]
    : null;

  // Format date for upcoming event
  const eventDateObj = upcomingEvent?.date ? new Date(upcomingEvent.date) : null;
  const eventDay = eventDateObj && !isNaN(eventDateObj.getDate()) ? String(eventDateObj.getDate()).padStart(2, '0') : '--';
  const eventMonth = eventDateObj && !isNaN(eventDateObj.getMonth())
    ? eventDateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase()
    : '---';

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#0F0F10]">
      <ParticleBackground />

      {/* ═══════════════════════════════════════════════════════
          HOMEPAGE CAMPUS BACKGROUND PHOTO & DARK SHADE
          Strictly isolated to background layer: blur & opacity
          never affect text, buttons, or cards!
      ═══════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Subtle Campus Photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroVisual.campusPhotoUrl || '/campus-main.jpeg'}
          alt="GPTC Perinthalmanna Campus"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: objectPos,
            filter: `blur(${bgBlurPx}px) brightness(0.30) contrast(1.0)`,
            transform: `scale(${bgScaleFloat})`,
            opacity: bgOpacityFloat,
            transition: 'filter 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
          }}
        />
        {/* Deep Black Shade Overlay with configurable opacity */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, rgba(15, 15, 16, ${darkOverlayFloat}) 0%, rgba(15, 15, 16, ${Math.min(1, darkOverlayFloat * 0.92)}) 50%, rgba(15, 15, 16, ${Math.min(1, darkOverlayFloat * 1.05)}) 100%)`,
            transition: 'background 0.3s ease',
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION – Real campus photos cycling in foreground
      ═══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center pt-8 pb-16 px-4 sm:px-6 lg:px-8 z-10 max-w-7xl mx-auto">

        {/* Soft blurred colour glow orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#F98A5B]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#6249A3]/15 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">

          {/* ── Left: Headline & CTAs ── */}
          <div className="lg:col-span-6 space-y-7">

            {/* Top badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#F98A5B] tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              IEDC — Innovation &amp; Entrepreneurship Development Centre
            </div>

            {/* Institutional Crests - 1. IEDC GPTC PMNA, 2. College Crest, 3. Official IEDC */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/iedc-gptc-pmna-logo.png"
                alt="IEDC GPTC PMNA Logo"
                style={{ height: '48px', width: 'auto', maxWidth: '170px' }}
                className="drop-shadow-xl object-contain"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/college-logo.png"
                alt="GPTC Perinthalmanna Crest"
                style={{ width: '48px', height: 'auto' }}
                className="drop-shadow-xl object-contain"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/iedc-logo.png"
                alt="IEDC Logo"
                style={{ width: '48px', height: 'auto' }}
                className="drop-shadow-xl object-contain"
              />
              <div className="text-xs text-slate-400 leading-snug">
                <div className="font-bold text-white">Govt. Polytechnic College</div>
                <div>Perinthalmanna, Kerala</div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
                Where <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F98A5B] to-[#EC3A74]">
                  Innovation
                </span>{' '}
                Meets <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EC3A74] via-[#9D4EDD] to-[#6249A3]">
                  Opportunity
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed pt-2 font-normal">
                Innovation and Entrepreneurship Development Centre (IEDC) is the official innovation hub of Government Polytechnic College, Perinthalmanna, empowering students to innovate, build startups, develop technical skills, and transform ideas into impactful solutions.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/projects"
                className="px-7 py-3.5 rounded-full btn-primary-iedc font-extrabold text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <span>Explore Projects</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
              <Link
                href="/team"
                className="px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm hover:scale-105 transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-[#F98A5B]" />
                <span>Meet Our Team</span>
              </Link>
            </div>

            {/* Social row */}
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Follow Us</span>
              <a href="#" className="w-8 h-8 rounded-full glass-iedc border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#F98A5B] hover:border-[#F98A5B] transition-colors">
                <Globe className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full glass-iedc border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#EC3A74] hover:border-[#EC3A74] transition-colors">
                <Share2 className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full glass-iedc border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#6249A3] hover:border-[#6249A3] transition-colors">
                <Code className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* ── Right: Glass Info Cards & Quick Highlights ── */}
          <div className="lg:col-span-6 flex flex-col gap-5">

            {/* Quick Portal Feature Showcase Card */}
            <div className="glass-iedc p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/iedc-logo.png" alt="IEDC" style={{ width: '36px', height: 'auto' }} className="drop-shadow-md" />
                  <div>
                    <h3 className="font-extrabold text-white text-base">Innovation Hub Portal</h3>
                    <p className="text-[11px] text-slate-400">GPTC Perinthalmanna Executive Committee</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#F98A5B]/15 border border-[#F98A5B]/30 text-[#F98A5B] text-[10px] font-mono font-bold">
                  ACTIVE
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <Cpu className="w-5 h-5 text-[#F98A5B]" />
                  <div className="text-xs font-bold text-white">Maker Space &amp; Labs</div>
                  <div className="text-[10px] text-slate-400">Hardware, IoT &amp; Software facilities</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <Trophy className="w-5 h-5 text-[#EC3A74]" />
                  <div className="text-xs font-bold text-white">Hackathons &amp; Grants</div>
                  <div className="text-[10px] text-slate-400">KSUM YIP Seed Funding</div>
                </div>
              </div>
            </div>

            {/* Upcoming event + announcement side by side (Real-Time CMS-Driven) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Upcoming Event */}
              {upcomingEvent ? (
                <div className="glass-iedc p-5 rounded-3xl border border-white/10 shadow-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                        <Calendar className="w-4 h-4 text-[#F98A5B]" />
                        {upcomingEvent.isToday ? 'Ongoing Event' : 'Upcoming Event'}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                        upcomingEvent.registrationStatus === 'Ongoing'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : upcomingEvent.registrationStatus === 'Registration Closing Soon'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : upcomingEvent.registrationStatus === 'Registration Closed'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-[#F98A5B]/20 text-[#F98A5B] border-[#F98A5B]/30'
                      }`}>
                        {upcomingEvent.registrationStatus}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-12 h-14 rounded-xl bg-[#1B1B1D] border border-white/10 flex flex-col items-center justify-center shrink-0">
                        <span className="text-lg font-black text-white leading-none">{eventDay}</span>
                        <span className="text-[10px] font-bold text-[#F98A5B] font-mono uppercase">{eventMonth}</span>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-sm font-extrabold text-white leading-snug line-clamp-1">{upcomingEvent.title}</h3>
                        <p className="flex items-center gap-1 text-[10px] text-slate-400 line-clamp-1">
                          <MapPin className="w-3 h-3 text-[#F98A5B] shrink-0" /> {upcomingEvent.venue || 'GPTC Perinthalmanna'}
                        </p>
                        <p className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3 text-[#EC3A74] shrink-0" /> {upcomingEvent.time || '10:00 AM – 04:00 PM'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {upcomingEvent.registrationStatus === 'Registration Closed' ? (
                    <div className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-extrabold text-xs text-center">
                      Registration Closed
                    </div>
                  ) : (
                    <Link
                      href={`/register?event=${upcomingEvent.id}`}
                      className="w-full py-2.5 rounded-xl btn-primary-iedc text-white font-extrabold text-xs shadow-lg text-center block hover:scale-[1.02] transition-transform"
                    >
                      Register Now
                    </Link>
                  )}
                </div>
              ) : (
                <div className="glass-iedc p-5 rounded-3xl border border-white/10 shadow-xl space-y-3 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/10 pb-2">
                    <Calendar className="w-4 h-4 text-[#F98A5B]" />
                    Upcoming Event
                  </div>
                  <div className="py-3 text-center space-y-1.5">
                    <Calendar className="w-7 h-7 text-slate-500 mx-auto" />
                    <p className="text-xs font-bold text-white">No upcoming events at the moment.</p>
                    <p className="text-[10px] text-slate-400">Stay tuned for new workshops &amp; bootcamps.</p>
                  </div>
                  <Link
                    href="/events"
                    className="inline-flex items-center justify-center gap-1 text-xs font-bold text-[#F98A5B] hover:text-white transition-colors"
                  >
                    View All Programs <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Announcement */}
              {homepageData.announcements && homepageData.announcements.length > 0 ? (
                <div className="glass-iedc p-5 rounded-3xl border border-white/10 shadow-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                        <Megaphone className="w-4 h-4 text-[#EC3A74]" />
                        Announcements
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#EC3A74]/15 text-[#EC3A74] border border-[#EC3A74]/30">
                        LIVE
                      </span>
                    </div>
                    <div className="space-y-2">
                      {homepageData.announcements.slice(0, 3).map((ann: any, idx: number) => (
                        <div key={ann.id || idx} className="flex items-start gap-2 text-[11px] text-slate-200">
                          <Star className="w-3.5 h-3.5 text-[#F98A5B] mt-0.5 shrink-0" />
                          <span className="line-clamp-2 leading-relaxed">{ann.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#F98A5B] hover:text-white transition-colors pt-2"
                  >
                    View Notice Board <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="glass-iedc p-5 rounded-3xl border border-white/10 shadow-xl space-y-3 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/10 pb-2">
                    <Megaphone className="w-4 h-4 text-[#EC3A74]" />
                    Announcements
                  </div>
                  <div className="py-3 text-center space-y-1.5">
                    <Megaphone className="w-7 h-7 text-slate-500 mx-auto" />
                    <p className="text-xs font-bold text-white">No active announcements</p>
                    <p className="text-[10px] text-slate-400">Check back later for updates and circulars.</p>
                  </div>
                  <Link
                    href="/events"
                    className="inline-flex items-center justify-center gap-1 text-xs font-bold text-[#F98A5B] hover:text-white transition-colors"
                  >
                    View Archive <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FLOATING STATS BAR
      ═══════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-16">
        <div className="glass-iedc p-6 rounded-3xl border border-white/10 shadow-2xl grid grid-cols-2 md:grid-cols-5 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
          {STATS.map(({ icon: Icon, value, label, from, to }) => (
            <div key={label} className="flex items-center justify-center gap-3 pt-2 md:pt-0">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xl font-black text-white">{value}</div>
                <div className="text-[11px] text-slate-400 font-semibold">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          EXPLORE IEDC – 6 CARDS
      ═══════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-20 space-y-8">
        <h2 className="text-2xl sm:text-3xl font-black text-white">Explore IEDC</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
          {EXPLORE_CARDS.map(({ href, icon: Icon, label, sub, from, to }) => (
            <Link
              key={label}
              href={href}
              className="glass-iedc p-5 rounded-3xl border border-white/10 glass-iedc-hover flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{label}</h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">{sub}</p>
                </div>
              </div>
              <div className="font-bold text-xs group-hover:translate-x-1 transition-transform" style={{ color: from }}>→</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          ABOUT IEDC SECTION (About, Vision, Mission)
      ═══════════════════════════════════════════════════════ */}
      <section id="about" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 space-y-12">

        {/* Main About Glass Card */}
        <div className="glass-iedc p-8 sm:p-10 rounded-3xl border border-white/12 space-y-8 shadow-2xl">
          
          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F98A5B]/15 border border-[#F98A5B]/30 text-[#F98A5B] text-xs font-mono font-bold tracking-wider uppercase">
              <Building2 className="w-3.5 h-3.5" /> Official Centre — GPTC Perinthalmanna
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">About IEDC</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              The <strong className="text-white">Innovation and Entrepreneurship Development Centre (IEDC)</strong> at Government Polytechnic College, Perinthalmanna is an initiative of <strong className="text-[#F98A5B]">Kerala Startup Mission (KSUM)</strong> that promotes innovation, entrepreneurship, research, and technology-driven learning among students. The centre provides opportunities for students to develop practical skills, transform innovative ideas into prototypes, and participate in startup and innovation programs.
            </p>
          </div>

          {/* Vision & Mission Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">

            {/* Vision Card */}
            <div className="lg:col-span-5 p-7 rounded-3xl bg-white/[0.05] border border-white/12 backdrop-blur-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F98A5B]/20 border border-[#F98A5B]/40 flex items-center justify-center text-[#F98A5B]">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-extrabold text-white">Our Vision</h3>
                <p className="text-slate-300 text-sm italic leading-relaxed pt-1">
                  &ldquo;To create an innovative ecosystem that nurtures creative thinking, entrepreneurship, technological excellence, and socially impactful innovations among students.&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/college-logo.png" alt="GPTC Logo" style={{ width: '36px', height: 'auto' }} />
                <div className="text-[11px] text-slate-400 font-semibold">GPTC Perinthalmanna · KSUM Incubator</div>
              </div>
            </div>

            {/* Mission Card */}
            <div className="lg:col-span-7 p-7 rounded-3xl bg-white/[0.05] border border-white/12 backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#EC3A74]/20 border border-[#EC3A74]/40 flex items-center justify-center text-[#EC3A74]">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Our Mission</h3>
                  <p className="text-xs text-slate-400">Core directives guiding student innovators</p>
                </div>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-200 pt-1">
                {[
                  'Promote innovation and entrepreneurial culture.',
                  'Encourage students to develop real-world solutions.',
                  'Support startups and student innovators.',
                  'Conduct workshops, hackathons, bootcamps, and technical events.',
                  'Build strong industry and startup ecosystem connections.',
                  'Inspire students to become future entrepreneurs and technology leaders.'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="w-4 h-4 text-[#F98A5B] shrink-0 mt-0.5" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          OUR INNOVATION ECOSYSTEM (Dedicated Section)
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 space-y-10">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#6249A3]/15 border border-[#6249A3]/30 text-[#6249A3] text-xs font-mono font-bold uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5" /> Partner Organizations
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Our Innovation Ecosystem</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            IEDC GPTC Perinthalmanna collaborates closely with premier state bodies and technology platforms to empower student innovators.
          </p>
        </div>

        {/* 4 Dedicated Ecosystem Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PARTNERS.map(({ name, logo, href, desc }) => (
            <div
              key={name}
              className="glass-iedc glass-iedc-hover p-6 rounded-3xl border border-white/12 flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                {/* Logo container */}
                <div className="w-full h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-3 group-hover:border-[#F98A5B]/40 transition-colors">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo}
                    alt={name}
                    style={{ maxHeight: '48px', maxWidth: '85%', width: 'auto', height: 'auto' }}
                    className="object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-white group-hover:text-[#F98A5B] transition-colors leading-snug">
                    {name}
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>

              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-[#F98A5B] hover:text-white border border-white/15 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 group/btn"
              >
                <span>Learn More</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </a>
            </div>
          ))}
        </div>

      </section>

      {/* ═══════════════════════════════════════════════════════
          IEDC TEAM & STUDENT LEADS (Preview Showcase)
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 space-y-10 border-t border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F98A5B]/15 border border-[#F98A5B]/30 text-[#F98A5B] text-xs font-mono font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" /> STUDENT INNOVATION LEADERSHIP
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              IEDC Team &amp; Student Leads
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Meet the dynamic student leaders and innovators spearheading projects, technical workshops, and startup initiatives at GPTC Perinthalmanna.
            </p>
          </div>

          <Link
            href="/team"
            className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center gap-2 transition-all shrink-0"
          >
            <span>View All Leads &amp; Executive Members</span>
            <ArrowRight className="w-4 h-4 text-[#F98A5B]" />
          </Link>
        </div>

        {/* Dynamic Student Leads & Executive Members Grid */}
        {teamLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex flex-col items-center space-y-4">
                <div className="w-48 h-72 rounded-2xl bg-white/5" />
                <div className="h-4 w-32 bg-white/10 rounded" />
                <div className="h-3 w-24 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">
            No student leads found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.slice(0, 8).map((lead, idx) => (
              <AnimatedProfileCard
                key={lead.id}
                member={lead}
                index={idx}
                containerHeight="h-72 sm:h-80"
                layoutVariant="preview"
                showCardBackgroundInPreview={false}
              />
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════
          OPTIONAL FEATURED INSTAGRAM REEL / JOURNEY SPOTLIGHT
          Only rendered if enabled by CMS administrator
      ═══════════════════════════════════════════════════════ */}
      {(() => {
        const featuredReel = homepageData.settings?.footerSocial?.featuredReel;
        if (!featuredReel?.enabled || !featuredReel?.reelUrl) return null;

        const officialInstaUrl =
          homepageData.settings?.footerSocial?.officialInstagramUrl ||
          'https://www.instagram.com/iedc_gpc_pmna/';
        const officialUsername =
          homepageData.settings?.footerSocial?.officialInstagramUsername ||
          '@iedc_gpc_pmna';

        return (
          <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 border-t border-white/10">
            <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#141418] border border-white/10 shadow-2xl relative overflow-hidden">
              {/* Subtle ambient gradient glow */}
              <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-gradient-to-br from-[#833AB4]/15 via-[#FD1D1D]/15 to-[#FCB045]/15 blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                {/* Thumbnail or Instagram Preview Poster */}
                <div className="w-full md:w-56 h-64 sm:h-72 rounded-2xl overflow-hidden bg-black/60 border border-white/10 relative shrink-0 flex items-center justify-center group">
                  {featuredReel.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featuredReel.thumbnailUrl}
                      alt={featuredReel.caption || 'Featured IEDC Instagram Reel'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#833AB4]/25 via-[#FD1D1D]/20 to-[#FCB045]/20 text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#FCB045] flex items-center justify-center text-white shadow-lg shadow-[#FD1D1D]/25">
                        <Instagram className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
                          Instagram Reel
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {officialUsername}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Floating Reel Badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[10px] font-mono text-white flex items-center gap-1.5 shadow">
                    <Film className="w-3 h-3 text-[#FCB045]" />
                    <span>Featured Reel</span>
                  </div>
                </div>

                {/* Reel Info & Action Buttons */}
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#F98A5B]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>FROM OUR COMMUNITY &amp; JOURNEY</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Follow Our Student Innovation Journey
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      {featuredReel.caption ||
                        'Watch highlights of hackathons, student prototype showcases, hardware maker bootcamps, and innovation triumphs on our official Instagram.'}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <a
                      href={featuredReel.reelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Watch featured Reel on Instagram"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-[#FD1D1D]/20 transition-all hover:scale-105"
                    >
                      <Instagram className="w-4 h-4" />
                      <span>Watch Reel on Instagram</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                    </a>

                    <a
                      href={officialInstaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium text-xs transition-colors"
                    >
                      <span>Follow {officialUsername}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

    </div>
  );
}
