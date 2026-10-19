'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Settings, Save, ShieldCheck, Database, Lock, Globe } from 'lucide-react';

export default function WebsiteSettingsPage() {
  const { isFaculty, addToast } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    siteTitle: 'IEDC GPTC PMNA',
    collegeName: 'Government Polytechnic College, Perinthalmanna',
    contactEmail: 'iedc@gptcpmna.edu.in',
    contactPhone: '+91 4933 227221',
    address: 'Govt Polytechnic College, Angadippuram PO, Perinthalmanna, Malappuram, Kerala 679321',
    github: 'https://github.com/iedc-gptc-pmna',
    linkedin: 'https://linkedin.com/company/iedc-gptc-pmna',
    instagram: 'https://instagram.com/iedc_gptcpmna'
  });

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          setFormData({
            siteTitle: d.siteTitle || 'IEDC GPTC PMNA',
            collegeName: d.collegeName || 'Government Polytechnic College, Perinthalmanna',
            contactEmail: d.contact?.email || 'iedc@gptcpmna.edu.in',
            contactPhone: d.contact?.phone || '+91 4933 227221',
            address: d.contact?.address || '',
            github: d.social?.github || '',
            linkedin: d.social?.linkedin || '',
            instagram: d.social?.instagram || ''
          });
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFaculty) return;
    setSaving(true);
    try {
      const payload = {
        siteTitle: formData.siteTitle,
        collegeName: formData.collegeName,
        contact: {
          email: formData.contactEmail,
          phone: formData.contactPhone,
          address: formData.address
        },
        social: {
          github: formData.github,
          linkedin: formData.linkedin,
          instagram: formData.instagram
        }
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
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
      </form>
    </div>
  );
}
