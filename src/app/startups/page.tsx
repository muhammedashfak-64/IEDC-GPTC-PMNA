'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Rocket, TrendingUp, DollarSign, Award, Users, ChevronRight, CheckCircle } from 'lucide-react';

const startupJourneySteps = [
  { step: '01', title: 'Problem Discovery', desc: 'Identify real-world challenges in Malappuram agriculture, energy, or civic tech.' },
  { step: '02', title: 'Prototype Validation', desc: 'Build initial hardware node or software MVP in IEDC hardware lab.' },
  { step: '03', title: 'Pitch Deck & Review', desc: 'Present to Nodal Officer & KSUM mentors during campus Pitch Fest.' },
  { step: '04', title: 'Seed Grant & Incubation', desc: 'Acquire ₹2 Lakhs KSUM seed grant & register company as Pvt Ltd / LLP.' }
];

export default function StartupsPage() {
  const { startups, addToast } = useApp();

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <Rocket className="w-3.5 h-3.5" /> STUDENT VENTURE INCUBATOR
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">Startup Ecosystem</h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Transforming diploma engineering projects into commercial ventures registered with Kerala Startup Mission (KSUM).
        </p>
      </div>

      {/* Incubated Startups Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {startups.map((s) => (
          <div key={s.id} className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/30 space-y-6 glass-panel-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={s.logo} alt={s.name} className="w-14 h-14 rounded-2xl object-cover border border-emerald-400/40" />
                  <div>
                    <h3 className="text-2xl font-extrabold text-white">{s.name}</h3>
                    <span className="text-xs text-emerald-400 font-mono font-bold uppercase">{s.stage} Stage</span>
                  </div>
                </div>

                {s.fundingAmount && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> {s.fundingAmount}
                  </span>
                )}
              </div>

              <p className="text-cyan-300 font-semibold text-sm italic">&quot;{s.tagline}&quot;</p>
              <p className="text-slate-300 text-xs leading-relaxed">{s.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Founders:</span>
                <span className="text-white font-bold">{s.founders.join(', ')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Department:</span>
                <span className="text-cyan-400 font-mono">{s.department}</span>
              </div>

              {s.website && (
                <a
                  href={s.website}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs text-center block shadow-lg hover:opacity-90 transition-opacity"
                >
                  Visit Official Company Portal
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Startup Journey Roadmap */}
      <div className="glass-panel p-8 rounded-3xl border border-cyan-500/20 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Incubation Lifecycle Journey</h2>
          <p className="text-slate-400 text-xs">How IEDC GPTC PMNA nurtures your project into a funded startup.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {startupJourneySteps.map((step, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-3 relative">
              <span className="text-2xl font-black text-cyan-400 font-mono">{step.step}</span>
              <h4 className="font-bold text-white text-base">{step.title}</h4>
              <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
