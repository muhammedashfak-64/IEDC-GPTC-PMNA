'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Stamp, Plus, CheckCircle2, Eye, Sparkles } from 'lucide-react';

export default function CertificateTemplatesPage() {
  const { addToast } = useAdmin();
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
    </div>
  );
}
