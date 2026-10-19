'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Stamp, Plus, CheckCircle2, Eye, Sparkles, XCircle } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function CertificateTemplatesPage() {
  const { addToast } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBackgroundUrl, setNewBackgroundUrl] = useState('');
  const [newBorderColor, setNewBorderColor] = useState('#F98A5B');
  const [templates, setTemplates] = useState<any[]>([
    {
      id: 'tpl-001',
      title: 'Official State Hackathon Template 2026',
      backgroundImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      fontColor: '#FFFFFF',
      borderColor: '#F98A5B',
      isActive: true
    },
    {
      id: 'tpl-002',
      title: 'Technical Workshop Certificate Template',
      backgroundImageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
      fontColor: '#F3F4F6',
      borderColor: '#EC3A74',
      isActive: false
    }
  ]);

  const handleSetActive = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => ({ ...t, isActive: t.id === id }))
    );
    addToast('Active Template Set', 'Certificate generation template updated.', 'success');
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      addToast('Validation', 'Template title is required.', 'error');
      return;
    }
    if (!newBackgroundUrl) {
      addToast('Validation', 'Please upload or select a background image.', 'error');
      return;
    }

    const newTpl = {
      id: `tpl-${Date.now()}`,
      title: newTitle.trim(),
      backgroundImageUrl: newBackgroundUrl,
      fontColor: '#FFFFFF',
      borderColor: newBorderColor,
      isActive: false
    };

    setTemplates([newTpl, ...templates]);
    setShowModal(false);
    setNewTitle('');
    setNewBackgroundUrl('');
    addToast('Template Added', `Uploaded certificate template "${newTpl.title}"`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 08 / CERTIFICATE MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">Certificate Templates</h1>
          <p className="text-slate-400 text-xs">
            Manage background layout borders, color grading, and active master template for automated certificate generation.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Certificate Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className={`p-6 rounded-3xl bg-[#121216] border transition-all space-y-4 ${
              tpl.isActive ? 'border-emerald-500/40 shadow-xl' : 'border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">{tpl.title}</h3>
                <span className="text-[10px] font-mono text-slate-400">ID: {tpl.id}</span>
              </div>
              {tpl.isActive ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE TEMPLATE
                </span>
              ) : (
                <button
                  onClick={() => handleSetActive(tpl.id)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[10px] font-mono font-bold cursor-pointer"
                >
                  Set as Active
                </button>
              )}
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-video border border-white/10">
              <img
                src={tpl.backgroundImageUrl}
                alt={tpl.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 p-4 flex flex-col justify-between text-center">
                <div className="text-[10px] font-mono text-white/80 tracking-widest">
                  IEDC GPTC PMNA PREVIEW
                </div>
                <div className="space-y-1">
                  <div className="text-base font-black text-white">CERTIFICATE OF PARTICIPATION</div>
                  <div className="text-[10px] text-white/70">Awarded to Student Innovator</div>
                </div>
                <div className="text-[9px] font-mono text-white/60">SEAL OF NODAL OFFICER</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
              <span>Accent: <code className="text-white font-mono">{tpl.borderColor}</code></span>
              <span>Font: <code className="text-white font-mono">{tpl.fontColor}</code></span>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#121216] border border-white/20 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Upload Certificate Template</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddTemplate} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Template Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Innovation Summit 2026 Template"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <FileUpload
                label="Template Background Graphic"
                value={newBackgroundUrl}
                onChange={(url) => setNewBackgroundUrl(url)}
                folder="certificates"
                accept="image/jpeg,image/png,image/webp"
                helperText="Upload official high-resolution certificate frame or background layout from your PC"
                required={true}
              />

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Border Accent Color</label>
                <input
                  type="text"
                  value={newBorderColor}
                  onChange={(e) => setNewBorderColor(e.target.value)}
                  placeholder="#F98A5B"
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
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
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
