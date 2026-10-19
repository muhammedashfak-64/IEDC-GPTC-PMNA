'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Handshake, Plus, ExternalLink, Globe, CheckCircle2, Trash2 } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function PartnersSponsorsPage() {
  const { addToast } = useAdmin();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    href: '',
    tier: 'Ecosystem Partner',
    desc: ''
  });

  useEffect(() => {
    // Default initial partners
    setPartners([
      {
        name: 'Kerala Startup Mission (KSUM)',
        logo: '/ksum-logo.png',
        href: 'https://startupmission.kerala.gov.in',
        tier: 'State Nodal Incubator',
        desc: 'Nodal agency of Govt. of Kerala for entrepreneurship development.'
      },
      {
        name: 'IEDC Kerala',
        logo: '/iedc-logo.png',
        href: 'https://iedckerala.in',
        tier: 'Flagship Network',
        desc: 'Nurturing campus entrepreneurship across Kerala engineering & polytechnic colleges.'
      },
      {
        name: 'Young Innovators Programme (YIP)',
        logo: '/yip-logo.png',
        href: 'https://yip.kerala.gov.in',
        tier: 'State Grant Partner',
        desc: 'Flagship programme by K-DISC empowering polytechnic youth to solve community challenges.'
      },
      {
        name: 'MuLearn',
        logo: '/mulearn-logo.png',
        href: 'https://mulearn.org',
        tier: 'Skill Community',
        desc: 'Peer-to-peer learning network empowering students with industry micro-skills.'
      }
    ]);
    setLoading(false);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Validation', 'Partner name is required.', 'error');
      return;
    }
    setPartners([formData, ...partners]);
    setShowModal(false);
    setFormData({
      name: '',
      logo: '',
      href: '',
      tier: 'Ecosystem Partner',
      desc: ''
    });
    addToast('Partner Added', `Added partner ${formData.name}`, 'success');
  };

  const handleDelete = (name: string) => {
    setPartners(partners.filter((p) => p.name !== name));
    addToast('Removed', 'Partner removed from list.', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 19 / CONTENT MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">Partners &amp; Sponsors</h1>
          <p className="text-slate-400 text-xs">
            Manage ecosystem tie-ups with Kerala Startup Mission, K-DISC YIP, MuLearn, and industry collaborators.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Partner / Sponsor</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {partners.map((p) => (
          <div key={p.name} className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-3 relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.logo || '/college-logo.png'} alt="" className="max-h-10 max-w-[80%] object-contain" />
                <button
                  onClick={() => handleDelete(p.name)}
                  className="absolute top-2 right-2 p-1 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <span className="text-[9px] font-mono text-amber-300 font-bold uppercase">{p.tier}</span>
                <h3 className="font-bold text-white text-base leading-snug mt-0.5">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{p.desc}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5">
              <a
                href={p.href || '#'}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Visit Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#121216] border border-white/20 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Add Partner / Sponsor</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Partner Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kerala Startup Mission"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <FileUpload
                label="Partner / Sponsor Logo"
                value={formData.logo}
                onChange={(url) => setFormData({ ...formData, logo: url })}
                folder="partners"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                helperText="Upload official brand logo (PNG, SVG, WebP) from your PC"
                required={true}
              />

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Partnership Tier / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Incubation Partner or Title Sponsor"
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Website URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.href}
                  onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Brief Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of partnership..."
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-white text-black font-extrabold hover:bg-slate-200"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
