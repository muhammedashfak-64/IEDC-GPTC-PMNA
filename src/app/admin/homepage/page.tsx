'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import {
  Home,
  Save,
  Eye,
  CheckCircle2,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Layers,
  BarChart2,
  Globe,
  Settings,
  Sliders,
  RotateCcw
} from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function HomepageManagementPage() {
  const { addToast } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    siteTitle: 'IEDC GPTC PMNA',
    collegeName: 'Government Polytechnic College, Perinthalmanna',
    heroHeading: 'Where Innovation Meets Opportunity',
    heroSub: 'Innovation and Entrepreneurship Development Centre (IEDC) is the official innovation hub of Government Polytechnic College, Perinthalmanna, empowering students to innovate, build startups, develop technical skills, and transform ideas into impactful solutions.',
    tickerAnnouncement: 'Hackathon 2026 Registrations are now LIVE! Certificate portal is open for recent workshops.',
    campusPhotoUrl: '/campus-main.jpeg',
    bgOpacity: 28,
    bgBlur: 12,
    darkOverlayOpacity: 85,
    imagePosition: 'center',
    bgScale: 104,
    statMembers: '650+',
    statProjects: '120+',
    statEvents: '35+',
    statStartups: '15+',
    statAwards: '25+',
    contactEmail: 'iedc@gptcpmna.edu.in',
    contactPhone: '+91 4933 227221',
    address: 'Govt Polytechnic College, Angadippuram PO, Perinthalmanna, Malappuram, Kerala 679321',
    footerCopyright: '© 2026 IEDC Government Polytechnic College Perinthalmanna. All Rights Reserved.',
    iedcGptcPmnaLogoUrl: '/iedc-gptc-pmna-logo.png',
    collegeLogoUrl: '/college-logo.png',
    iedcLogoUrl: '/iedc-logo.png'
  });

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          setFormData({
            siteTitle: d.siteTitle || 'IEDC GPTC PMNA',
            collegeName: d.collegeName || 'Government Polytechnic College, Perinthalmanna',
            heroHeading: d.heroHeading || 'Where Innovation Meets Opportunity',
            heroSub: d.heroSub || '',
            tickerAnnouncement: d.tickerAnnouncement || '',
            campusPhotoUrl: d.heroVisual?.campusPhotoUrl || d.campusPhotoUrl || '/campus-main.jpeg',
            bgOpacity: d.heroVisual?.bgOpacity ?? 28,
            bgBlur: d.heroVisual?.bgBlur ?? 12,
            darkOverlayOpacity: d.heroVisual?.darkOverlayOpacity ?? 85,
            imagePosition: d.heroVisual?.imagePosition || 'center',
            bgScale: d.heroVisual?.bgScale ?? 104,
            statMembers: d.stats?.[0]?.value || '650+',
            statProjects: d.stats?.[1]?.value || '120+',
            statEvents: d.stats?.[2]?.value || '35+',
            statStartups: d.stats?.[3]?.value || '15+',
            statAwards: d.stats?.[4]?.value || '25+',
            contactEmail: d.contact?.email || 'iedc@gptcpmna.edu.in',
            contactPhone: d.contact?.phone || '+91 4933 227221',
            address: d.contact?.address || '',
            footerCopyright: '© 2026 IEDC Government Polytechnic College Perinthalmanna. All Rights Reserved.',
            iedcGptcPmnaLogoUrl: d.iedcGptcPmnaLogoUrl || '/iedc-gptc-pmna-logo.png',
            collegeLogoUrl: d.collegeLogoUrl || '/college-logo.png',
            iedcLogoUrl: d.iedcLogoUrl || '/iedc-logo.png'
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const restoreDefaultHeroVisual = () => {
    setFormData((prev) => ({
      ...prev,
      campusPhotoUrl: '/campus-main.jpeg',
      bgOpacity: 28,
      bgBlur: 12,
      darkOverlayOpacity: 85,
      imagePosition: 'center',
      bgScale: 104
    }));
    addToast('Visual Settings Reset', 'Hero background settings restored to defaults.', 'info');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      siteTitle: formData.siteTitle,
      collegeName: formData.collegeName,
      heroHeading: formData.heroHeading,
      heroSub: formData.heroSub,
      tickerAnnouncement: formData.tickerAnnouncement,
      campusPhotoUrl: formData.campusPhotoUrl,
      iedcGptcPmnaLogoUrl: formData.iedcGptcPmnaLogoUrl,
      collegeLogoUrl: formData.collegeLogoUrl,
      iedcLogoUrl: formData.iedcLogoUrl,
      logoUrl: formData.collegeLogoUrl,
      heroVisual: {
        campusPhotoUrl: formData.campusPhotoUrl,
        bgOpacity: Number(formData.bgOpacity),
        bgBlur: Number(formData.bgBlur),
        darkOverlayOpacity: Number(formData.darkOverlayOpacity),
        imagePosition: formData.imagePosition,
        bgScale: Number(formData.bgScale)
      },
      stats: [
        { label: 'Active Members', value: formData.statMembers },
        { label: 'Student Projects', value: formData.statProjects },
        { label: 'Events Hosted', value: formData.statEvents },
        { label: 'Incubated Startups', value: formData.statStartups },
        { label: 'Awards & Prizes', value: formData.statAwards }
      ],
      contact: {
        email: formData.contactEmail,
        phone: formData.contactPhone,
        address: formData.address
      }
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Homepage Content Saved', 'All changes published to database and live on the public site!', 'success');
      } else {
        addToast('Save Notice', data.error || 'Failed to update homepage', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto mb-2" />
        <span>Loading Homepage Settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 02 / CONTENT MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">Homepage Management (CMS)</h1>
          <p className="text-slate-400 text-xs">
            Edit the public hero heading, description, campus background photo, live stats, and footer details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>{previewMode ? 'Exit Preview' : 'Live Preview'}</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* Live Preview Panel */}
      {previewMode && (
        <div className="p-6 rounded-3xl bg-[#141418] border border-white/20 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">LIVE HERO PREVIEW CANVAS</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Blur: {formData.bgBlur}px | Opacity: {formData.bgOpacity}% | Overlay: {formData.darkOverlayOpacity}%
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden p-8 bg-[#0F0F10] border border-white/10 text-center min-h-[260px] flex items-center justify-center">
            {/* Background layer with isolated blur & opacity */}
            <div
              className="absolute inset-0 bg-cover pointer-events-none"
              style={{
                backgroundImage: `url(${formData.campusPhotoUrl || '/campus-main.jpeg'})`,
                backgroundPosition: formData.imagePosition || 'center',
                filter: `blur(${formData.bgBlur}px) brightness(0.30) contrast(1.0)`,
                transform: `scale(${(formData.bgScale || 104) / 100})`,
                opacity: (formData.bgOpacity ?? 28) / 100,
                transition: 'all 0.2s ease',
              }}
            />
            {/* Configurable dark overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(to bottom, rgba(15, 15, 16, ${(formData.darkOverlayOpacity ?? 85) / 100}) 0%, rgba(15, 15, 16, ${Math.min(1, ((formData.darkOverlayOpacity ?? 85) / 100) * 0.92)}) 50%, rgba(15, 15, 16, ${Math.min(1, ((formData.darkOverlayOpacity ?? 85) / 100) * 1.05)}) 100%)`,
                transition: 'background 0.2s ease',
              }}
            />
            {/* Foreground content: 100% crisp, never transparent or blurred */}
            <div className="relative z-10 max-w-2xl mx-auto space-y-3">
              {formData.tickerAnnouncement && (
                <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-mono text-slate-200 border border-white/15 inline-block shadow-sm">
                  {formData.tickerAnnouncement}
                </span>
              )}
              <h2 className="text-3xl font-black text-white drop-shadow-md">{formData.heroHeading}</h2>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{formData.heroSub}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main CMS Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Hero & Background */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#F98A5B]" /> Hero Section Content
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Main Hero Headline
              </label>
              <input
                type="text"
                required
                value={formData.heroHeading}
                onChange={(e) => setFormData({ ...formData, heroHeading: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Hero Subtitle / Description
              </label>
              <textarea
                rows={4}
                required
                value={formData.heroSub}
                onChange={(e) => setFormData({ ...formData, heroSub: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl p-3 text-xs text-white focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Announcement Ticker (Homepage Banner)
              </label>
              <input
                type="text"
                value={formData.tickerAnnouncement}
                onChange={(e) => setFormData({ ...formData, tickerAnnouncement: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              SECTION: HERO BACKGROUND & VISUAL SETTINGS
          ═══════════════════════════════════════════════════════ */}
          <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <span className="text-[9px] font-mono font-bold text-[#F98A5B] uppercase tracking-wider block">
                  VISUAL CONTROLS
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#F98A5B]" /> HERO BACKGROUND &amp; VISUAL SETTINGS
                </h3>
              </div>
              <button
                type="button"
                onClick={restoreDefaultHeroVisual}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Restore Defaults</span>
              </button>
            </div>

            {/* A. College background image upload and preview */}
            <div className="space-y-3">
              <FileUpload
                label="College Background Photograph"
                value={formData.campusPhotoUrl}
                onChange={(url) => setFormData({ ...formData, campusPhotoUrl: url || '/campus-main.jpeg' })}
                folder="homepage"
                accept="image/jpeg,image/png,image/webp"
                helperText="Upload official college campus photograph from your computer. Stored securely in Supabase."
              />
              {formData.campusPhotoUrl && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Current Source: <code className="text-white bg-white/5 px-2 py-0.5 rounded">{formData.campusPhotoUrl}</code></span>
                  {formData.campusPhotoUrl !== '/campus-main.jpeg' && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, campusPhotoUrl: '/campus-main.jpeg' })}
                      className="text-[#F98A5B] hover:underline cursor-pointer"
                    >
                      Revert to Default Campus Image
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* B & C. Sliders: Opacity, Blur, Overlay, Zoom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Opacity Slider */}
              <div className="p-4 rounded-2xl bg-[#18181D] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Background Opacity</label>
                  <span className="px-2 py-0.5 rounded-md bg-[#F98A5B]/20 border border-[#F98A5B]/40 text-[#F98A5B] text-xs font-mono font-bold">
                    {formData.bgOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.bgOpacity}
                  onChange={(e) => setFormData({ ...formData, bgOpacity: Number(e.target.value) })}
                  className="w-full accent-[#F98A5B] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0% (Transparent)</span>
                  <span>100% (Solid)</span>
                </div>
              </div>

              {/* Blur Slider */}
              <div className="p-4 rounded-2xl bg-[#18181D] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Background Blur</label>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold">
                    {formData.bgBlur}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={formData.bgBlur}
                  onChange={(e) => setFormData({ ...formData, bgBlur: Number(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0px (Crisp)</span>
                  <span>20px (Maximum Softness)</span>
                </div>
              </div>

              {/* Dark Overlay Opacity Slider */}
              <div className="p-4 rounded-2xl bg-[#18181D] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Dark Shade Overlay</label>
                  <span className="px-2 py-0.5 rounded-md bg-slate-700/50 border border-white/20 text-slate-200 text-xs font-mono font-bold">
                    {formData.darkOverlayOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.darkOverlayOpacity}
                  onChange={(e) => setFormData({ ...formData, darkOverlayOpacity: Number(e.target.value) })}
                  className="w-full accent-slate-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0% (No Shade)</span>
                  <span>100% (Deep Black)</span>
                </div>
              </div>

              {/* Background Zoom / Scale Slider */}
              <div className="p-4 rounded-2xl bg-[#18181D] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Backdrop Zoom (Scale)</label>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                    {formData.bgScale}%
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="130"
                  step="1"
                  value={formData.bgScale}
                  onChange={(e) => setFormData({ ...formData, bgScale: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>100% (Original)</span>
                  <span>130% (Zoomed)</span>
                </div>
              </div>
            </div>

            {/* D. Image Positioning */}
            <div className="p-4 rounded-2xl bg-[#18181D] border border-white/10 space-y-2">
              <label className="text-xs font-bold text-white block">Image Alignment Position</label>
              <select
                value={formData.imagePosition}
                onChange={(e) => setFormData({ ...formData, imagePosition: e.target.value })}
                className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="center">Center (Balanced Campus View)</option>
                <option value="top">Top (Show Upper Campus &amp; Architecture)</option>
                <option value="bottom">Bottom (Show Ground Level)</option>
                <option value="left">Left Aligned</option>
                <option value="right">Right Aligned</option>
              </select>
              <p className="text-[10px] text-slate-400">
                Positions the focal point of the college photo behind the hero text and cards.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Key Stats & Contact */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-slate-300" /> Homepage Floating Metrics
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Active Members</label>
                <input
                  type="text"
                  value={formData.statMembers}
                  onChange={(e) => setFormData({ ...formData, statMembers: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Student Projects</label>
                <input
                  type="text"
                  value={formData.statProjects}
                  onChange={(e) => setFormData({ ...formData, statProjects: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Events Hosted</label>
                <input
                  type="text"
                  value={formData.statEvents}
                  onChange={(e) => setFormData({ ...formData, statEvents: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Startups</label>
                <input
                  type="text"
                  value={formData.statStartups}
                  onChange={(e) => setFormData({ ...formData, statStartups: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Awards &amp; Grants</label>
                <input
                  type="text"
                  value={formData.statAwards}
                  onChange={(e) => setFormData({ ...formData, statAwards: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-300" /> Public Contact &amp; Footer
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Public Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Campus Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Institutional Logos & Header Branding (Order: 1, 2, 3) */}
          <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" /> Header Branding Logos
            </h3>
            <p className="text-[11px] text-slate-400">
              Configure the 3 official logos displayed across the public header in left-to-right order.
            </p>

            <div className="space-y-4 pt-1">
              <div className="bg-[#16161D] p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block mb-2">
                  1. IEDC GPTC PMNA LOGO (LEFTMOST)
                </span>
                <FileUpload
                  label="IEDC GPTC PMNA LOGO"
                  value={formData.iedcGptcPmnaLogoUrl}
                  onChange={(url) => setFormData({ ...formData, iedcGptcPmnaLogoUrl: url })}
                  folder="branding"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  helperText="Upload official college unit logo from PC. Appears 1st on the left."
                />
              </div>

              <div className="bg-[#16161D] p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  2. COLLEGE CREST / LOGO (CENTER)
                </span>
                <FileUpload
                  label="COLLEGE CREST / LOGO"
                  value={formData.collegeLogoUrl}
                  onChange={(url) => setFormData({ ...formData, collegeLogoUrl: url })}
                  folder="branding"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  helperText="Government Polytechnic College Perinthalmanna crest. Appears 2nd."
                />
              </div>

              <div className="bg-[#16161D] p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  3. OFFICIAL IEDC LOGO (RIGHT)
                </span>
                <FileUpload
                  label="OFFICIAL IEDC LOGO"
                  value={formData.iedcLogoUrl}
                  onChange={(url) => setFormData({ ...formData, iedcLogoUrl: url })}
                  folder="branding"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  helperText="Official Kerala IEDC state emblem. Appears 3rd."
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-200 text-black font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save & Publish Live to Supabase'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
