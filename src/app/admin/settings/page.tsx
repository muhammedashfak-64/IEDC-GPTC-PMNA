'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import {
  Settings,
  Save,
  ShieldCheck,
  Database,
  Lock,
  Globe,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  ExternalLink,
  Film,
  Sparkles,
  Share2,
  GraduationCap,
  UserCheck
} from 'lucide-react';
import { InstagramIcon as Instagram } from '@/components/SocialIcons';
import FileUpload from '@/components/admin/FileUpload';

export default function WebsiteSettingsPage() {
  const { isFaculty, addToast } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    siteTitle: 'IEDC GPTC PMNA',
    collegeName: 'Government Polytechnic College, Perinthalmanna',
    contactEmail: 'iedc@gptcpmna.edu.in',
    contactPhone: '+91 4933 227221',
    address: 'Govt Polytechnic College, Angadippuram PO, Perinthalmanna, Malappuram, Kerala 679321',
    logoUrl: '/college-logo.png',
    iedcGptcPmnaLogoUrl: '/iedc-gptc-pmna-logo.png',
    collegeLogoUrl: '/college-logo.png',
    iedcLogoUrl: '/iedc-logo.png',
    github: 'https://github.com/iedc-gptc-pmna',
    linkedin: 'https://linkedin.com/company/iedc-gptc-pmna',
    instagram: 'https://www.instagram.com/iedc_gpc_pmna/',
    // Footer & Social Media Settings
    officialInstagramUsername: '@iedc_gpc_pmna',
    officialInstagramUrl: 'https://www.instagram.com/iedc_gpc_pmna/',
    creatorName: 'Muhammed Ashfak O',
    creatorInstagramUsername: '@_aasshfaakk_',
    creatorInstagramUrl: 'https://www.instagram.com/_aasshfaakk/',
    showOfficialInstagram: true,
    showCreatorAttribution: true,
    showFooterSocialSection: true,
    // Featured Reel
    featuredReelEnabled: false,
    featuredReelUrl: '',
    featuredReelCaption: '',
    featuredReelThumbnail: '',
    // Principal Profile & Message
    principalName: 'Abdul Khader',
    principalDesignation: 'Principal, Government Polytechnic College Perinthalmanna',
    principalHeading: "Principal's Message",
    principalQuote: "The college is responsible and competent for the development of technical education and has tried to retain its glory by implementing schemes to achieve academic excellence and improving administrative performance.",
    principalPhotoUrl: '/images/principal.jpeg',
    principalEnabled: true
  });

  const [supabaseInfo, setSupabaseInfo] = useState<any>(null);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseServiceKey, setSupabaseServiceKey] = useState('');
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          const fs = d.footerSocial || {};
          const pr = d.principal || {};
          setFormData({
            siteTitle: d.siteTitle || 'IEDC GPTC PMNA',
            collegeName: d.collegeName || 'Government Polytechnic College, Perinthalmanna',
            contactEmail: d.contact?.email || 'iedc@gptcpmna.edu.in',
            contactPhone: d.contact?.phone || '+91 4933 227221',
            address: d.contact?.address || '',
            logoUrl: d.collegeLogoUrl || d.logoUrl || '/college-logo.png',
            iedcGptcPmnaLogoUrl: d.iedcGptcPmnaLogoUrl || '/iedc-gptc-pmna-logo.png',
            collegeLogoUrl: d.collegeLogoUrl || d.logoUrl || '/college-logo.png',
            iedcLogoUrl: d.iedcLogoUrl || '/iedc-logo.png',
            github: d.social?.github || '',
            linkedin: d.social?.linkedin || '',
            instagram: fs.officialInstagramUrl || d.social?.instagram || 'https://www.instagram.com/iedc_gpc_pmna/',
            officialInstagramUsername: fs.officialInstagramUsername || '@iedc_gpc_pmna',
            officialInstagramUrl: fs.officialInstagramUrl || 'https://www.instagram.com/iedc_gpc_pmna/',
            creatorName: fs.creatorName || 'Muhammed Ashfak O',
            creatorInstagramUsername: fs.creatorInstagramUsername || '@_aasshfaakk_',
            creatorInstagramUrl: fs.creatorInstagramUrl || 'https://www.instagram.com/_aasshfaakk/',
            showOfficialInstagram: fs.showOfficialInstagram ?? true,
            showCreatorAttribution: fs.showCreatorAttribution ?? true,
            showFooterSocialSection: fs.showFooterSocialSection ?? true,
            featuredReelEnabled: fs.featuredReel?.enabled ?? false,
            featuredReelUrl: fs.featuredReel?.reelUrl || '',
            featuredReelCaption: fs.featuredReel?.caption || '',
            featuredReelThumbnail: fs.featuredReel?.thumbnailUrl || '',
            // Principal details
            principalName: pr.name || 'Abdul Khader',
            principalDesignation: pr.designation || 'Principal, Government Polytechnic College Perinthalmanna',
            principalHeading: pr.heading || "Principal's Message",
            principalQuote: pr.quote || "The college is responsible and competent for the development of technical education and has tried to retain its glory by implementing schemes to achieve academic excellence and improving administrative performance.",
            principalPhotoUrl: pr.photoUrl || '/images/principal.jpeg',
            principalEnabled: pr.enabled !== false
          });
        }
        if (json.supabase) {
          setSupabaseInfo(json.supabase);
          if (json.supabase.status) {
            setTestResult(json.supabase.status);
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleTestConnection = async () => {
    setTestingSupabase(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (json.supabase) {
        setSupabaseInfo(json.supabase);
        setTestResult(json.supabase.status);
        if (json.supabase.status?.connected) {
          addToast('Cloud Connection Verified', 'Successfully communicated with cloud infrastructure.', 'success');
        } else {
          addToast('Cloud Sync Notice', json.supabase.status?.message || 'Using local fallback persistence.', 'info');
        }
      }
    } catch (err: any) {
      setTestResult({ connected: false, message: err.message });
      addToast('Error', 'Failed to test cloud connection.', 'error');
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFaculty) return;
    setSaving(true);
    try {
      const payload: any = {
        siteTitle: formData.siteTitle,
        collegeName: formData.collegeName,
        iedcGptcPmnaLogoUrl: formData.iedcGptcPmnaLogoUrl,
        collegeLogoUrl: formData.collegeLogoUrl,
        iedcLogoUrl: formData.iedcLogoUrl,
        logoUrl: formData.collegeLogoUrl,
        contact: {
          email: formData.contactEmail,
          phone: formData.contactPhone,
          address: formData.address
        },
        social: {
          github: formData.github,
          linkedin: formData.linkedin,
          instagram: formData.officialInstagramUrl
        },
        principal: {
          name: formData.principalName,
          designation: formData.principalDesignation,
          heading: formData.principalHeading,
          quote: formData.principalQuote,
          photoUrl: formData.principalPhotoUrl,
          enabled: formData.principalEnabled
        },
        footerSocial: {
          officialInstagramUsername: formData.officialInstagramUsername,
          officialInstagramUrl: formData.officialInstagramUrl,
          creatorName: formData.creatorName,
          creatorInstagramUsername: formData.creatorInstagramUsername,
          creatorInstagramUrl: formData.creatorInstagramUrl,
          showOfficialInstagram: formData.showOfficialInstagram,
          showCreatorAttribution: formData.showCreatorAttribution,
          showFooterSocialSection: formData.showFooterSocialSection,
          featuredReel: {
            enabled: formData.featuredReelEnabled,
            reelUrl: formData.featuredReelUrl,
            caption: formData.featuredReelCaption,
            thumbnailUrl: formData.featuredReelThumbnail
          }
        }
      };

      if (supabaseAnonKey.trim()) {
        payload.supabaseAnonKey = supabaseAnonKey.trim();
      }
      if (supabaseServiceKey.trim()) {
        payload.supabaseServiceKey = supabaseServiceKey.trim();
      }

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.supabaseStatus) {
          setTestResult(json.supabaseStatus);
        }
        addToast('Settings Saved', 'Website configurations updated.', 'success');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isFaculty) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Privileged Module: Faculty Only</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          System Website Settings are restricted exclusively to the Faculty Coordinator. Student Leads cannot modify core site configurations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 23 / GOVERNANCE (FACULTY ONLY)
          </span>
          <h1 className="text-2xl font-black text-white">Website Settings &amp; Configuration</h1>
          <p className="text-slate-400 text-xs">
            Manage global site titles, college address credentials, contact phone lines, and social links.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
          <h3 className="font-bold text-white text-base">Institutional Identity</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Portal Name</label>
              <input
                type="text"
                value={formData.siteTitle}
                onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">College Name</label>
              <input
                type="text"
                value={formData.collegeName}
                onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Official Address</label>
              <textarea
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="bg-[#16161D] p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block mb-2">
                  1. PRIMARY BRAND LOGO (LEFTMOST IN HEADER)
                </span>
                <FileUpload
                  label="IEDC GPTC PMNA LOGO"
                  value={formData.iedcGptcPmnaLogoUrl}
                  onChange={(url) => setFormData({ ...formData, iedcGptcPmnaLogoUrl: url })}
                  folder="branding"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  helperText="Official IEDC unit logo for Government Polytechnic College, Perinthalmanna. Appears first in the website header."
                />
              </div>

              <div className="bg-[#16161D] p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  2. COLLEGE CREST (CENTER IN HEADER)
                </span>
                <FileUpload
                  label="COLLEGE CREST / LOGO"
                  value={formData.collegeLogoUrl}
                  onChange={(url) => setFormData({ ...formData, collegeLogoUrl: url, logoUrl: url })}
                  folder="branding"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  helperText="Official Government Polytechnic College Perinthalmanna institutional seal. Appears second in the header."
                />
              </div>

              <div className="bg-[#16161D] p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  3. KERALA IEDC LOGO (RIGHT IN HEADER)
                </span>
                <FileUpload
                  label="OFFICIAL IEDC LOGO"
                  value={formData.iedcLogoUrl}
                  onChange={(url) => setFormData({ ...formData, iedcLogoUrl: url })}
                  folder="branding"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  helperText="Official Kerala Startup Mission / IEDC Kerala state emblem. Appears third in the header."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
          <h3 className="font-bold text-white text-base">Official Contact &amp; Social Links</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Public Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Official Instagram Account</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://instagram.com/iedc_gptcpmna"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className="flex-1 bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#F98A5B]"
                />
                {formData.instagram && (
                  <a
                    href={formData.instagram.startsWith('http') ? formData.instagram : `https://instagram.com/${formData.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-[#E1306C]/10 text-[#E1306C] hover:bg-[#E1306C]/20 border border-[#E1306C]/30 text-xs flex items-center justify-center"
                    title="Test Instagram Link"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Official LinkedIn Page</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://linkedin.com/company/iedc-gptc-pmna"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="flex-1 bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#F98A5B]"
                />
                {formData.linkedin && (
                  <a
                    href={formData.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 text-xs flex items-center justify-center"
                    title="Test LinkedIn Link"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">GitHub Organization</label>
              <input
                type="url"
                value={formData.github}
                onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            FOOTER & SOCIAL MEDIA SETTINGS (MD:COL-SPAN-2)
        ═══════════════════════════════════════════════════════ */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#F98A5B] uppercase tracking-wider block mb-1">
                PUBLIC FOOTER &amp; COMMUNITY INTEGRATION
              </span>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#E1306C]" /> FOOTER &amp; SOCIAL MEDIA SETTINGS
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Manage the official IEDC Instagram account, subtle website creator attribution, footer visibility, and optional featured Reels.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer self-start sm:self-auto bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <input
                type="checkbox"
                checked={formData.showFooterSocialSection}
                onChange={(e) => setFormData({ ...formData, showFooterSocialSection: e.target.checked })}
                className="accent-[#F98A5B]"
              />
              <span>Footer Social Section Visible</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Official IEDC Instagram Profile */}
            <div className="p-4 rounded-2xl bg-[#18181D] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Instagram className="w-3.5 h-3.5" />
                  </div>
                  <span>Official IEDC Instagram</span>
                </div>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showOfficialInstagram}
                    onChange={(e) => setFormData({ ...formData, showOfficialInstagram: e.target.checked })}
                    className="accent-[#F98A5B]"
                  />
                  <span>Display in Footer</span>
                </label>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Official Instagram ID</label>
                  <input
                    type="text"
                    required
                    value={formData.officialInstagramUsername}
                    onChange={(e) => setFormData({ ...formData, officialInstagramUsername: e.target.value })}
                    className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    placeholder="@iedc_gpc_pmna"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Official Profile URL</label>
                  <input
                    type="url"
                    required
                    value={formData.officialInstagramUrl}
                    onChange={(e) => setFormData({ ...formData, officialInstagramUrl: e.target.value })}
                    className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    placeholder="https://www.instagram.com/iedc_gpc_pmna/"
                  />
                </div>
              </div>
            </div>

            {/* Right: Website Creator & Designer Attribution */}
            <div className="p-4 rounded-2xl bg-[#18181D] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Website Creator Attribution</span>
                </div>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showCreatorAttribution}
                    onChange={(e) => setFormData({ ...formData, showCreatorAttribution: e.target.checked })}
                    className="accent-[#F98A5B]"
                  />
                  <span>Show Attribution</span>
                </label>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Creator Name</label>
                  <input
                    type="text"
                    required
                    value={formData.creatorName}
                    onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
                    className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="Muhammed Ashfak O"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Personal Instagram ID</label>
                    <input
                      type="text"
                      required
                      value={formData.creatorInstagramUsername}
                      onChange={(e) => setFormData({ ...formData, creatorInstagramUsername: e.target.value })}
                      className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      placeholder="@_aasshfaakk_"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Personal Profile URL</label>
                    <input
                      type="url"
                      required
                      value={formData.creatorInstagramUrl}
                      onChange={(e) => setFormData({ ...formData, creatorInstagramUrl: e.target.value })}
                      className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      placeholder="https://www.instagram.com/_aasshfaakk/"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Featured Instagram Reel */}
          <div className="p-4 rounded-2xl bg-[#18181D] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Film className="w-4 h-4 text-purple-400" />
                <span>Featured Instagram Reel (Optional Homepage Spotlight)</span>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featuredReelEnabled}
                  onChange={(e) => setFormData({ ...formData, featuredReelEnabled: e.target.checked })}
                  className="accent-purple-400"
                />
                <span>Enable Reel Spotlight</span>
              </label>
            </div>

            {formData.featuredReelEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Featured Reel URL</label>
                  <input
                    type="url"
                    value={formData.featuredReelUrl}
                    onChange={(e) => setFormData({ ...formData, featuredReelUrl: e.target.value })}
                    className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    placeholder="https://www.instagram.com/reel/C3abcXYZ/"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Short Caption / Highlight</label>
                  <input
                    type="text"
                    value={formData.featuredReelCaption}
                    onChange={(e) => setFormData({ ...formData, featuredReelCaption: e.target.value })}
                    className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="e.g. Highlights from Drone Technology Bootcamp 2026"
                  />
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-white/5">
                  <FileUpload
                    label="Optional Reel Thumbnail / Poster Image"
                    value={formData.featuredReelThumbnail}
                    onChange={(url) => setFormData({ ...formData, featuredReelThumbnail: url })}
                    folder="reels"
                    accept="image/*"
                    helperText="Upload an optional custom cover photo or poster frame for this featured Reel"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            COLLEGE PRINCIPAL'S PROFILE & MESSAGE SECTION
        ═══════════════════════════════════════════════════════ */}
        <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F98A5B]/10 border border-[#F98A5B]/20 flex items-center justify-center text-[#F98A5B]">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">College Principal Profile &amp; Message</h3>
                <p className="text-slate-400 text-xs">
                  Manage the college principal photograph, designation, leadership message, and homepage visibility.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-black/40 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-semibold text-white">
              <input
                type="checkbox"
                checked={formData.principalEnabled}
                onChange={(e) => setFormData({ ...formData, principalEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-[#F98A5B] focus:ring-[#F98A5B] bg-[#18181D]"
              />
              <span>Display on Homepage</span>
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Principal Photo & Preview */}
            <div className="lg:col-span-4 space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Principal Photograph <span className="text-slate-500 font-normal">(JPEG, PNG, WebP)</span>
              </label>
              <div className="relative rounded-2xl overflow-hidden bg-black/50 border border-white/10 aspect-[4/5] flex items-center justify-center max-w-[220px] mx-auto lg:mx-0 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.principalPhotoUrl || '/images/principal.jpeg'}
                  alt="Principal Preview"
                  className="w-full h-full object-cover object-top"
                  onError={(e: any) => {
                    e.currentTarget.src = '/images/principal.jpeg';
                  }}
                />
              </div>
              <FileUpload
                label="Change Photograph"
                value={formData.principalPhotoUrl}
                onChange={(url) => setFormData({ ...formData, principalPhotoUrl: url || '/images/principal.jpeg' })}
                folder="principal"
                accept="image/jpeg,image/png,image/webp"
                helperText="Upload official photograph from your computer (auto-persists to Cloud Storage)"
              />
            </div>

            {/* Principal Profile Fields */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Principal Display Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.principalName}
                    onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                    placeholder="e.g. Abdul Khader"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Section Heading
                  </label>
                  <input
                    type="text"
                    value={formData.principalHeading}
                    onChange={(e) => setFormData({ ...formData, principalHeading: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                    placeholder="e.g. Principal's Message"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Official Designation / Title
                </label>
                <input
                  type="text"
                  value={formData.principalDesignation}
                  onChange={(e) => setFormData({ ...formData, principalDesignation: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                  placeholder="e.g. Principal, Government Polytechnic College Perinthalmanna"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Leadership Message / Vision Statement
                </label>
                <textarea
                  rows={4}
                  value={formData.principalQuote}
                  onChange={(e) => setFormData({ ...formData, principalQuote: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F98A5B] leading-relaxed"
                  placeholder="Enter the official institutional message..."
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ═══════════════════════════════════════════════════════
          CLOUD INFRASTRUCTURE & BACKEND SERVICES CARD
      ═══════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-3xl bg-[#121216] border border-emerald-500/20 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                Cloud Infrastructure &amp; Data Synchronization
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Cloud Active
                </span>
              </h3>
              <p className="text-slate-400 text-xs">
                Unified data engine powering both the Public Frontend and Private Admin Console with encrypted role-based access.
              </p>
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testingSupabase}
            className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />
            <span>{testingSupabase ? 'Verifying Services...' : 'Test Cloud Connection'}</span>
          </button>
        </div>

        {/* Live Connectivity Diagnostic Banner */}
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
          testResult?.connected
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            {testResult?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <p className="font-bold">
                {testResult?.connected ? 'Cloud Synchronization Active & Verified' : 'Cloud Service Verification Status'}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {testResult?.message || 'Cloud storage and record services are functioning normally.'}
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-[11px] shrink-0">
            <span className="text-slate-400">Status: </span>
            <span className="text-emerald-400">Operational</span>
          </div>
        </div>

        {/* Grid of Data Modules & Storage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#18181D] border border-white/5 space-y-2">
            <div className="flex items-center justify-between font-bold text-white">
              <span>Managed Data Modules</span>
              <span className="text-emerald-400 font-mono">12 Active</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Events, participants, team members, certificates, projects, gallery items, resources, announcements, and audit records.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#18181D] border border-white/5 space-y-2">
            <div className="flex items-center justify-between font-bold text-white">
              <span>Cloud Asset Storage</span>
              <span className="text-cyan-400 font-mono">5 Channels</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Public banners, portraits, documents, event gallery media, and secure encrypted certificates.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#18181D] border border-white/5 space-y-2">
            <div className="flex items-center justify-between font-bold text-white">
              <span>Access Security</span>
              <span className="text-emerald-400 font-mono">Enforced</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Public visitors can access published content. Administrative actions and participant records are protected with authenticated credentials.
            </p>
          </div>
        </div>

        {/* Live Token Entry form if key update needed */}
        <div className="p-5 rounded-2xl bg-[#18181D] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Update Cloud Access Credentials (Optional)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Client Integration Token
              </label>
              <input
                type="password"
                placeholder="Paste client integration token here..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Secure Master Token
              </label>
              <input
                type="password"
                placeholder="Paste secure master token here..."
                value={supabaseServiceKey}
                onChange={(e) => setSupabaseServiceKey(e.target.value)}
                className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              System Engine: <code className="text-white bg-black/40 px-2 py-0.5 rounded">Active &amp; Persistent</code>
            </span>
            <button
              onClick={handleSave}
              disabled={saving || (!supabaseAnonKey && !supabaseServiceKey)}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Cloud Credentials</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
