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
} from 'lucide-react';

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

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#0F0F10]">
      <ParticleBackground />

      {/* ═══════════════════════════════════════════════════════
          HOMEPAGE CAMPUS BACKGROUND PHOTO & DARK SHADE
      ═══════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        {/* Subtle Campus Photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/campus-main.jpeg"
          alt="GPTC Perinthalmanna Campus"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(12px) brightness(0.30) contrast(1.0)',
            transform: 'scale(1.04)',
            opacity: 0.28,
          }}
        />
        {/* Deep Black Shade Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(15, 15, 16, 0.88) 0%, rgba(15, 15, 16, 0.80) 50%, rgba(15, 15, 16, 0.94) 100%)',
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

            {/* College name + IEDC logos side-by-side */}
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/college-logo.png"
                alt="GPTC Perinthalmanna Crest"
                style={{ width: '60px', height: 'auto' }}
                className="drop-shadow-xl"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/iedc-logo.png"
                alt="IEDC Logo"
                style={{ width: '56px', height: 'auto' }}
                className="drop-shadow-xl"
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

            {/* Upcoming event + announcement side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Upcoming Event */}
              <div className="glass-iedc p-5 rounded-3xl border border-white/10 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/10 pb-2">
                  <Calendar className="w-4 h-4 text-[#F98A5B]" />
                  Upcoming Event
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-14 rounded-xl bg-[#1B1B1D] border border-white/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-lg font-black text-white leading-none">23</span>
                    <span className="text-[10px] font-bold text-[#F98A5B] font-mono uppercase">AUG</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-white leading-snug">Vibe Coding Session</h3>
                    <p className="flex items-center gap-1 text-[10px] text-slate-400">
                      <MapPin className="w-3 h-3 text-[#F98A5B]" /> ICFC Lab, GPTC PMNA
                    </p>
                    <p className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3 text-[#EC3A74]" /> 01:00 PM – 04:00 PM
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => registerForEvent('event-1')}
                  className="w-full py-2.5 rounded-xl btn-primary-iedc text-white font-extrabold text-xs shadow-lg"
                >
                  Register Now
                </button>
              </div>

              {/* Announcement */}
              <div className="glass-iedc p-5 rounded-3xl border border-white/10 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/10 pb-2">
                  <Megaphone className="w-4 h-4 text-[#EC3A74]" />
                  Announcement
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-[11px] text-slate-200">
                    <Star className="w-3.5 h-3.5 text-[#F98A5B] mt-0.5 shrink-0" />
                    Hackathon 2025 registrations are now open!
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#6249A3] mt-0.5 shrink-0" />
                    YIP &amp; KSUM applications submitted.
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-slate-400">
                    <Zap className="w-3.5 h-3.5 text-[#EC3A74] mt-0.5 shrink-0" />
                    New certificate portal is live!
                  </div>
                </div>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#F98A5B] hover:text-white transition-colors"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
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

        {/* 4 Feature Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              name: 'ANSHADH PK',
              role: 'Student Lead-I',
              dept: 'Electronics Engineering',
              grad: 'Class of 2027',
              insta: 'panshadh'
            },
            {
              name: 'FAHEEMA FARHANATH P',
              role: 'Student Lead-II',
              dept: 'Electrical Engineering',
              grad: 'Class of 2027',
              insta: 'faheemafarhanath'
            },
            {
              name: 'ANAGHA C',
              role: 'Community Lead',
              dept: 'Electrical Engineering',
              grad: 'Class of 2027',
              insta: 'canagha'
            },
            {
              name: 'NITHYA K',
              role: 'Branding & Marketing Lead',
              dept: 'Electronics Engineering',
              grad: 'Class of 2027',
              insta: 'nithyamadhavan'
            }
          ].map((lead) => (
            <div
              key={lead.name}
              className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 hover:border-white/25 flex flex-col justify-between space-y-4 shadow-xl transition-all group"
            >
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#F98A5B]/10 border border-[#F98A5B]/30 flex items-center justify-center group-hover:border-[#F98A5B] transition-colors">
                  <span className="text-xl font-black text-[#F98A5B]">
                    {lead.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono font-bold text-[#F98A5B] block">{lead.role}</span>
                  <h3 className="text-base font-bold text-white group-hover:text-[#F98A5B] transition-colors leading-snug">
                    {lead.name}
                  </h3>
                  <span className="text-xs text-neutral-400 block mt-0.5">{lead.dept}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
                <span className="text-[10px] font-mono">{lead.grad}</span>
                <span className="text-[10px] font-mono text-[#F98A5B]">@{lead.insta}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
