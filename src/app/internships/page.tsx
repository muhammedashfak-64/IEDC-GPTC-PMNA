'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Briefcase, Building2, MapPin, DollarSign, Clock, Send } from 'lucide-react';

const internshipsList = [
  {
    id: 'int-1',
    title: 'Embedded Firmware Engineering Intern',
    company: 'AgroTech PMNA Solutions',
    location: 'Perinthalmanna (Incubator Lab)',
    stipend: '₹8,000 / month',
    duration: '3 Months',
    skills: ['ESP32', 'C++', 'FreeRTOS', 'PCB Design'],
    type: 'Hardware Internship'
  },
  {
    id: 'int-2',
    title: 'Full Stack React & Node Developer',
    company: 'EcoMotion EV Tech',
    location: 'Remote / On-site',
    stipend: '₹10,000 / month',
    duration: '6 Months',
    skills: ['React', 'Node.js', 'Tailwind', 'REST APIs'],
    type: 'Software Internship'
  },
  {
    id: 'int-3',
    title: 'Computer Vision & AI Research Assistant',
    company: 'IEDC Prototyping Cell',
    location: 'GPTC PMNA Campus',
    stipend: '₹6,000 / month',
    duration: '2 Months',
    skills: ['Python', 'OpenCV', 'YOLO', 'Raspberry Pi'],
    type: 'Research Fellowship'
  }
];

export default function InternshipsPage() {
  const { addToast } = useApp();

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Briefcase className="w-3.5 h-3.5" /> CAREERS & INDUSTRY EXPOSURE
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">Internship & Placement Portal</h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Gain real-world engineering experience with incubated startups and technical research cells at GPTC PMNA.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {internshipsList.map((job) => (
          <div key={job.id} className="glass-panel p-6 rounded-3xl border border-cyan-500/20 space-y-4 glass-panel-hover flex flex-col justify-between">
            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                {job.type}
              </span>
              <h3 className="text-lg font-extrabold text-white">{job.title}</h3>
              <p className="text-cyan-400 font-semibold text-xs flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {job.company}
              </p>

              <div className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-cyan-400" /> {job.location}</div>
                <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-emerald-400" /> {job.stipend}</div>
                <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" /> Duration: {job.duration}</div>
              </div>

              {/* Skill Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {job.skills.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => addToast('Application Sent', `Submitted application for ${job.title}`, 'success')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Apply for Internship
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
