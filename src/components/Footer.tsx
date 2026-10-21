'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Rocket,
  Mail,
  Phone,
  MapPin,
  Send,
  Eye,
  ShieldCheck,
  Globe,
  Share2,
  Code,
  FileCheck
} from 'lucide-react';
import { InstagramIcon as Instagram } from '@/components/SocialIcons';

export const Footer: React.FC = () => {
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [footerSettings, setFooterSettings] = useState({
    officialInstagramUsername: '@iedc_gpc_pmna',
    officialInstagramUrl: 'https://www.instagram.com/iedc_gpc_pmna/',
    creatorName: 'Muhammed Ashfak O',
    creatorInstagramUsername: '@_aasshfaakk_',
    creatorInstagramUrl: 'https://www.instagram.com/_aasshfaakk/',
    showOfficialInstagram: true,
    showCreatorAttribution: true,
    showFooterSocialSection: true
  });

  useEffect(() => {
    fetch('/api/public/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.footerSocial) {
          setFooterSettings((prev) => ({
            ...prev,
            ...json.data.footerSocial
          }));
        }
      })
      .catch((err) => console.error('Failed to load footer settings:', err));
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setSubscribed(true);
    setEmailInput('');
  };

  return (
    <footer className="w-full relative overflow-hidden bg-[#0B0B0D] text-slate-300 text-xs border-t border-white/10 mt-16 z-10 font-sans">
      {/* Blurred Campus Background Photo */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-2xl scale-110 opacity-20 pointer-events-none z-0"
        style={{
          backgroundImage: `url('/campus-main.jpeg')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0D]/95 via-[#0B0B0D]/90 to-[#0B0B0D] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/iedc-gptc-pmna-logo.png" alt="IEDC GPTC PMNA" className="h-9 w-auto max-w-[130px] object-contain drop-shadow" />
              <img src="/college-logo.png" alt="GPTC" className="w-8 h-8 object-contain drop-shadow" />
              <img src="/iedc-logo.png" alt="IEDC" className="w-8 h-8 object-contain drop-shadow" />
              <div className="flex flex-col">
                <span className="font-black text-lg text-white tracking-wide">
                  IEDC GPTC PMNA
                </span>
                <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest leading-none">
                  INNOVATION INCUBATOR
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed pr-4">
              Innovation and Entrepreneurship Development Centre (IEDC) at Government Polytechnic College, Perinthalmanna is a flagship incubator accredited by Kerala Startup Mission (KSUM) to empower polytechnic students to transform creative technical ideas into scalable prototypes.
            </p>

            {/* Newsletter Subscription */}
            <form onSubmit={handleSubscribe} className="space-y-2 pt-2">
              <label className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                INNOVATION NEWSLETTER DISPATCH
              </label>
              {subscribed ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  ✓ Subscribed! You will receive monthly event bulletins.
                </div>
              ) : (
                <div className="flex gap-2 max-w-md">
                  <input
                    type="email"
                    placeholder="Enter your student email..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-[#16161B] border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-white hover:bg-slate-200 text-black rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                  >
                    <span>Join</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Ecosystem Column */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs tracking-wider uppercase font-mono">ECOSYSTEM</h4>
            <ul className="space-y-2.5 font-medium">
              <li><Link href="/projects" className="hover:text-white transition-colors">Student Projects</Link></li>
              <li><Link href="/startups" className="hover:text-white transition-colors">Startup Incubator</Link></li>
              <li><Link href="/events" className="hover:text-white transition-colors">Hackathons &amp; Workshops</Link></li>
              <li><Link href="/gallery" className="hover:text-white transition-colors">Campus Gallery</Link></li>
              <li><Link href="/committee" className="hover:text-white transition-colors">Executive Committee</Link></li>
              <li><Link href="/committee#faculty" className="hover:text-white transition-colors">Faculty Coordinators</Link></li>
            </ul>
          </div>

          {/* Verification & Downloads Column */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs tracking-wider uppercase font-mono">CERTIFICATES &amp; RES</h4>
            <ul className="space-y-2.5 font-medium">
              <li>
                <Link href="/certificates" className="hover:text-white transition-colors flex items-center gap-1.5 text-white font-bold">
                  <FileCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Download Certificate</span>
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>QR Verification</span>
                </Link>
              </li>
              <li><Link href="/resources" className="hover:text-white transition-colors">Learning Notes &amp; Guides</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Innovation Stories</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Hub</Link></li>
            </ul>
          </div>

          {/* Contact Hub Column */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs tracking-wider uppercase font-mono">CAMPUS HUB</h4>
            <div className="space-y-2.5 text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                <span className="leading-relaxed">Govt Polytechnic College, Angadippuram PO, Perinthalmanna, Malappuram, Kerala 679321</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-300 shrink-0" />
                <a href="mailto:iedc@gptcpmna.edu.in" className="hover:text-white transition-colors">iedc@gptcpmna.edu.in</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-300 shrink-0" />
                <span>+91 4933 227221 / +91 9447 123456</span>
              </div>
            </div>

            {/* CONNECT WITH US — Official IEDC Instagram */}
            {footerSettings.showFooterSocialSection && footerSettings.showOfficialInstagram && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                  CONNECT WITH US
                </div>
                <div className="text-[11px] text-slate-400">
                  Follow IEDC GPTC PMNA on Instagram
                </div>
                <a
                  href={footerSettings.officialInstagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow IEDC GPTC PMNA on Instagram (@iedc_gpc_pmna)"
                  className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#FCB045]/10 hover:from-[#833AB4]/20 hover:via-[#FD1D1D]/20 hover:to-[#FCB045]/20 border border-white/10 hover:border-[#E1306C]/40 text-slate-200 hover:text-white transition-all group"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045] flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Instagram className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-[9px] text-slate-400 font-mono leading-none">Official Instagram</div>
                    <span className="text-xs font-bold text-white group-hover:text-[#F98A5B] transition-colors font-mono">
                      {footerSettings.officialInstagramUsername}
                    </span>
                  </div>
                </a>
              </div>
            )}

            {/* General Social Icons */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href={footerSettings.officialInstagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="IEDC Instagram"
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#E1306C] hover:bg-white/10 transition-all"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://linkedin.com/company/iedc-gptc-pmna"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="IEDC LinkedIn"
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#0077b5] hover:bg-white/10 transition-all"
              >
                <Globe className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://github.com/iedc-gptc-pmna"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="IEDC GitHub"
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              >
                <Code className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://iedckerala.in"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="IEDC Kerala Portal"
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#F98A5B] hover:bg-white/10 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Creator Attribution Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-slate-400 font-medium text-center md:text-left">
            © 2026 IEDC Government Polytechnic College Perinthalmanna. All Rights Reserved.
          </div>

          {/* Website Creator Attribution - Subtle, Professional & Unobtrusive */}
          {footerSettings.showCreatorAttribution && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-slate-400 text-[11px]">
              <span>Website Designed &amp; Developed by <strong className="text-slate-200 font-semibold">{footerSettings.creatorName}</strong></span>
              {footerSettings.creatorInstagramUrl && (
                <a
                  href={footerSettings.creatorInstagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${footerSettings.creatorName}'s Instagram Profile (${footerSettings.creatorInstagramUsername})`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#E1306C]/30 text-slate-300 hover:text-white transition-all group font-mono text-[11px]"
                >
                  <Instagram className="w-3 h-3 text-[#E1306C] group-hover:scale-110 transition-transform" />
                  <span>{footerSettings.creatorInstagramUsername}</span>
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-mono text-[11px]">
            <Eye className="w-3.5 h-3.5 text-white" />
            <span>Campus Innovation Network</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
