'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Rocket, Plus, ExternalLink, Trash2 } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function StartupsManagerPage() {
  const { addToast } = useAdmin();
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    founders: '',
    department: 'Electronics Engineering',
    stage: 'Incubated',
    fundingAmount: '₹2,00,000 YIP Grant',
    logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300&auto=format&fit=crop&q=80',
    website: ''
  });

  const loadData = () => {
    setLoading(true);
    fetch('/api/admin/startups')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStartups(json.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/startups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        addToast('Startup Added', `Added startup ${formData.name}`, 'success');
        setShowModal(false);
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 13 / INNOVATION &amp; ACADEMICS
          </span>
          <h1 className="text-2xl font-black text-white">Startups Incubator Manager</h1>
          <p className="text-slate-400 text-xs">
            Manage student-founded startups, seed funding grants received, and incubator progress.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: '',
              tagline: '',
              description: '',
              founders: '',
              department: 'Electronics Engineering',
              stage: 'Incubated',
              fundingAmount: '₹2,00,000 YIP Grant',
              logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300&auto=format&fit=crop&q=80',
              website: ''
            });
            setShowModal(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Incubated Startup</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {startups.map((st) => (
          <div key={st.id} className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
            <div className="flex items-center gap-4">
              <img src={st.logoUrl || '/college-logo.png'} alt="" className="w-14 h-14 rounded-2xl object-cover border border-white/10" />
              <div>
                <h3 className="font-bold text-white text-base">{st.name}</h3>
                <p className="text-xs text-amber-300 font-medium">{st.tagline}</p>
                <span className="text-[10px] font-mono text-slate-400">{st.fundingAmount}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{st.description}</p>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">Founders: {Array.isArray(st.founders) ? st.founders.join(', ') : st.founders}</span>
              {st.website && (
                <a href={st.website} target="_blank" rel="noreferrer" className="text-white hover:text-amber-300 flex items-center gap-1">
                  <span>Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Add Incubated Startup</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Company / Startup Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AgriTech Automation Systems"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Tagline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IoT Precision Irrigation for Spice Farms"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Founders</label>
                  <input
                    type="text"
                    required
                    placeholder="Fathima Riya (ECE)"
                    value={formData.founders}
                    onChange={(e) => setFormData({ ...formData, founders: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Grant / Funding</label>
                  <input
                    type="text"
                    placeholder="₹2,00,000 YIP Grant"
                    value={formData.fundingAmount}
                    onChange={(e) => setFormData({ ...formData, fundingAmount: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <FileUpload
                  label="Startup Brand Logo / Image"
                  value={formData.logoUrl}
                  onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                  folder="startups"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  helperText="Upload official startup logo or prototype photo from your PC"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-white text-black font-extrabold">
                  Save Startup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
