'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Lightbulb, Send, CheckCircle2, Clock, ShieldCheck, FileText, Layers } from 'lucide-react';

export default function InnovationPortalPage() {
  const { ideas, submitIdea, user } = useApp();

  const [title, setTitle] = useState('');
  const [studentName, setStudentName] = useState(user?.name || '');
  const [registerNumber, setRegisterNumber] = useState(user?.registerNumber || '');
  const [department, setDepartment] = useState(user?.department || 'Computer Engineering');
  const [problemStatement, setProblemStatement] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [techStackInput, setTechStackInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !problemStatement || !proposedSolution) return;

    submitIdea({
      title,
      studentName,
      registerNumber,
      department,
      problemStatement,
      proposedSolution,
      technologyStack: techStackInput.split(',').map((s) => s.trim()).filter(Boolean)
    });

    setTitle('');
    setProblemStatement('');
    setProposedSolution('');
    setTechStackInput('');
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Lightbulb className="w-3.5 h-3.5" /> STUDENT INNOVATION PORTAL
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">Submit Your Technical Idea</h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Pitch your project or startup proposal directly to IEDC faculty coordinators for prototype grant allocation and mentor matching.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Submission Form */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" /> Pitch Submission Form
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Project / Idea Title</label>
              <input
                type="text"
                required
                placeholder="e.g. AI Solar Powered Waste Segregation Bin"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Register Number</label>
                <input
                  type="text"
                  required
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Electronics Engineering">Electronics Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Problem Statement</label>
              <textarea
                required
                rows={3}
                placeholder="What real-world problem does your project solve?"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Proposed Technical Solution</label>
              <textarea
                required
                rows={3}
                placeholder="Describe your technical architecture, sensors, hardware or software design..."
                value={proposedSolution}
                onChange={(e) => setProposedSolution(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Technology Stack (Comma separated)</label>
              <input
                type="text"
                placeholder="ESP32, Python, OpenCV, React, TensorFlow"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-sm shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" /> Submit Proposal for Review
            </button>
          </form>
        </div>

        {/* Real-time Submissions Tracker */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" /> Active Submissions Tracker
          </h2>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {ideas.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">No ideas submitted yet.</p>
            ) : (
              ideas.map((idea) => (
                <div key={idea.id} className="glass-panel p-5 rounded-2xl border border-cyan-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">{idea.department}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        idea.status === 'Approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {idea.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base leading-snug">{idea.title}</h3>
                  <p className="text-slate-300 text-xs line-clamp-2">{idea.proposedSolution}</p>

                  {idea.mentorAssigned && (
                    <div className="text-[11px] text-cyan-300 font-semibold bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20">
                      Mentor: {idea.mentorAssigned}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
