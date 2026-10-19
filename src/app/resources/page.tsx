'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { FolderDown, FileText, Download, ShieldCheck, Sparkles } from 'lucide-react';

export default function ResourceCenterPage() {
  const { templates, addToast } = useApp();

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <FolderDown className="w-3.5 h-3.5" /> BRANDING & REPORT ASSETS
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">Resource Downloads</h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Download standardized PowerPoint pitch decks, IEEE seminar paper templates, and official IEDC vector logos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((t) => (
          <div key={t.id} className="glass-panel p-6 rounded-3xl border border-cyan-500/20 space-y-4 glass-panel-hover flex flex-col justify-between">
            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                {t.type}
              </span>
              <h3 className="text-lg font-bold text-white leading-snug">{t.title}</h3>
              <p className="text-slate-400 text-xs font-mono">Size: {t.fileSize}</p>
            </div>

            <button
              onClick={() => addToast('Downloading File', `Preparing ${t.title}...`, 'success')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Package
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
