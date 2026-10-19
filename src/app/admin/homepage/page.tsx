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
  Settings
} from 'lucide-react';

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
    statMembers: '650+',
    statProjects: '120+',
    statEvents: '35+',
    statStartups: '15+',
    statAwards: '25+',
    contactEmail: 'iedc@gptcpmna.edu.in',
    contactPhone: '+91 4933 227221',
    address: 'Govt Polytechnic College, Angadippuram PO, Perinthalmanna, Malappuram, Kerala 679321',
    footerCopyright: '© 2026 IEDC Government Polytechnic College Perinthalmanna. All Rights Reserved.'
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
            campusPhotoUrl: d.campusPhotoUrl || '/campus-main.jpeg',
            statMembers: d.stats?.[0]?.value || '650+',
            statProjects: d.stats?.[1]?.value || '120+',
            statEvents: d.stats?.[2]?.value || '35+',
            statStartups: d.stats?.[3]?.value || '15+',
            statAwards: d.stats?.[4]?.value || '25+',
            contactEmail: d.contact?.email || 'iedc@gptcpmna.edu.in',
            contactPhone: d.contact?.phone || '+91 4933 227221',
            address: d.contact?.address || '',
            footerCopyright: '© 2026 IEDC Government Polytechnic College Perinthalmanna. All Rights Reserved.'
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
            <span className="text-xs font-mono font-bold text-amber-300">● LIVE HERO PREVIEW CANVAS</span>
            <span className="text-[11px] text-slate-400">Shows how changes will render on the public site</span>
          </div>

          <div className="relative rounded-2xl overflow-hidden p-8 bg-[#0F0F10] border border-white/10 text-center space-y-4">
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-lg opacity-25"
              style={{ backgroundImage: `url(${formData.campusPhotoUrl})` }}
            />
            <div className="relative z-10 max-w-2xl mx-auto space-y-3">
              <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-mono text-slate-300 border border-white/15 inline-block">
                {formData.tickerAnnouncement}
              </span>
              <h2 className="text-3xl font-black text-white">{formData.heroHeading}</h2>
              <p className="text-xs text-slate-300 leading-relaxed">{formData.heroSub}</p>
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
              <Layers className="w-4 h-4 text-slate-300" /> Hero Section Content
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

          {/* Campus Background Image Upload / Path */}
          <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-300" /> Campus Background Image
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Campus Image URL or Relative Asset Path
              </label>
              <input
                type="text"
                value={formData.campusPhotoUrl}
                onChange={(e) => setFormData({ ...formData, campusPhotoUrl: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono"
              />
            </div>

            <div className="p-3 rounded-2xl bg-[#18181D] border border-white/10 flex items-center gap-4">
              <img
                src={formData.campusPhotoUrl}
                alt="Campus Preview"
                className="w-24 h-16 object-cover rounded-xl border border-white/10"
              />
              <div className="text-xs space-y-1">
                <div className="font-bold text-white">Current Overlay Photo</div>
                <div className="text-[11px] text-slate-400">Renders as blurred ambient backdrop behind the homepage.</div>
              </div>
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
