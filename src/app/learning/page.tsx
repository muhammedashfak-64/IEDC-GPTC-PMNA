'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { BookOpen, Video, FileText, Download, Eye, Cpu, Code, Play } from 'lucide-react';

export default function LearningHubPage() {
  const { learningResources, addToast } = useApp();
  const [selectedCat, setSelectedCat] = useState('All');

  const categories = ['All', 'ESP32', 'Arduino', 'IoT', 'Python', 'AI & ML'];

  const filtered = selectedCat === 'All'
    ? learningResources
    : learningResources.filter((r) => r.category === selectedCat);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <BookOpen className="w-3.5 h-3.5" /> ACADEMIC & PROTOTYPE LEARNING HUB
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">Technical Knowledge Vault</h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Access ESP32 lab manuals, IoT circuit diagrams, Python hardware scripts, and workshop video tutorials created by IEDC faculty.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCat(c)}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCat === c
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg glow-cyan'
                : 'glass-panel text-slate-400 hover:text-white'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item) => (
          <div key={item.id} className="glass-panel p-6 rounded-3xl border border-cyan-500/20 space-y-4 glass-panel-hover flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[11px] font-mono font-bold border border-cyan-500/20">
                  {item.category} • {item.type}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {item.views} reads
                </span>
              </div>

              <h3 className="text-xl font-bold text-white leading-snug">{item.title}</h3>
              <p className="text-slate-300 text-xs leading-relaxed">{item.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Author: <strong className="text-cyan-300">{item.author}</strong></span>
              <button
                onClick={() => addToast('Downloading Manual', `Fetching ${item.title} PDF notes...`, 'success')}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold border border-cyan-500/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download Manual
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
