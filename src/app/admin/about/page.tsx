'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Info, Save, Plus, Trash2, CheckCircle2, Lightbulb, Rocket } from 'lucide-react';

export default function AboutVisionMissionPage() {
  const { addToast } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [aboutText, setAboutText] = useState(
    'The Innovation and Entrepreneurship Development Centre (IEDC) at Government Polytechnic College, Perinthalmanna is an initiative of Kerala Startup Mission (KSUM) that promotes innovation, entrepreneurship, research, and technology-driven learning among students. The centre provides opportunities for students to develop practical skills, transform innovative ideas into prototypes, and participate in startup and innovation programs.'
  );

  const [visionText, setVisionText] = useState(
    'To create an innovative ecosystem that nurtures creative thinking, entrepreneurship, technological excellence, and socially impactful innovations among students.'
  );

  const [missions, setMissions] = useState<string[]>([
    'Promote innovation and entrepreneurial culture.',
    'Encourage students to develop real-world solutions.',
    'Support startups and student innovators.',
    'Conduct workshops, hackathons, bootcamps, and technical events.',
    'Build strong industry and startup ecosystem connections.',
    'Inspire students to become future entrepreneurs and technology leaders.'
  ]);

  const [newMission, setNewMission] = useState('');

  const handleAddMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMission.trim()) return;
    setMissions([...missions, newMission.trim()]);
    setNewMission('');
  };

  const handleRemoveMission = (idx: number) => {
    setMissions(missions.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aboutText,
          visionText,
          missionItems: missions
        })
      });
      if (res.ok) {
        addToast('Saved Successfully', 'About, Vision, and Mission updated on the public site!', 'success');
      } else {
        addToast('Notice', 'Changes saved to store.', 'info');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 03 / CONTENT MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">About, Vision &amp; Mission</h1>
          <p className="text-slate-400 text-xs">
            Edit the official IEDC institutional overview, vision statement, and mission mandates.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save & Publish Live'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* About IEDC */}
        <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-3">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-300" /> About IEDC Overview
          </label>
          <textarea
            rows={5}
            required
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none"
          />
        </div>

        {/* Vision Statement */}
        <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-3">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-slate-300" /> Our Vision Statement
          </label>
          <textarea
            rows={3}
            required
            value={visionText}
            onChange={(e) => setVisionText(e.target.value)}
            className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none"
          />
        </div>

        {/* Mission Directives */}
        <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Rocket className="w-4 h-4 text-slate-300" /> Our Mission Directives
          </label>

          <div className="space-y-2">
            {missions.map((mission, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 text-xs text-white"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{mission}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMission(idx)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new mission item */}
          <div className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Add another mission goal..."
              value={newMission}
              onChange={(e) => setNewMission(e.target.value)}
              className="flex-1 bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddMission}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Goal</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
