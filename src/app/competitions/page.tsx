'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Award, Trophy, Zap, CheckCircle2, Medal, ExternalLink } from 'lucide-react';

const leaderboards = [
  { rank: 1, name: 'Rahul V', dept: 'Computer Engg', points: 1450, badge: 'Innovator Champion' },
  { rank: 2, name: 'Fathima Riya', dept: 'Electronics Engg', points: 1320, badge: 'IoT Pioneer' },
  { rank: 3, name: 'Arjun K', dept: 'Electrical Engg', points: 1180, badge: 'Hackathon Lead' },
  { rank: 4, name: 'Ananya P', dept: 'Mechanical Engg', points: 950, badge: 'Robotics Enthusiast' },
  { rank: 5, name: 'Mohammed Shafi', dept: 'Civil Engg', points: 890, badge: 'Design Thinker' }
];

export default function CompetitionsPage() {
  const { addToast } = useApp();

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
          <Trophy className="w-3.5 h-3.5" /> COMPETITIONS & LEADERBOARD
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">State Innovation Challenges</h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Compete in YIP 5.0, KSUM Idea Fest, IEEE Coding Hackathons, and Robotics challenges.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Leaderboard Table */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Medal className="w-5 h-5 text-amber-400" /> Student Innovation Leaderboard
            </h2>
            <span className="text-xs font-mono text-cyan-400">Season 2025-26</span>
          </div>

          <div className="space-y-3">
            {leaderboards.map((student) => (
              <div
                key={student.rank}
                className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                  student.rank === 1
                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border-amber-500/50 text-white font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                      student.rank === 1
                        ? 'bg-amber-400 text-black'
                        : student.rank === 2
                        ? 'bg-slate-300 text-black'
                        : student.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{student.rank}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{student.name}</h4>
                    <span className="text-[10px] text-slate-400">{student.dept}</span>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <div className="font-extrabold text-cyan-400 text-sm">{student.points} pts</div>
                  <span className="text-[10px] text-amber-300 font-mono">{student.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Major Competitions */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" /> Active Flagship Contests
          </h2>

          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 space-y-4">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold border border-cyan-500/40">
              KERALA DEVELOPMENT & INNOVATION STRATEGY COUNCIL
            </span>
            <h3 className="text-xl font-extrabold text-white">YIP 5.0 (Young Innovators Programme)</h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Submit your team proposal to receive up to ₹50,000 prototype funding and mentorship from Kerala state government innovation mentors.
            </p>
            <button
              onClick={() => addToast('YIP 5.0 Portal', 'Redirecting to state YIP registration desk...', 'info')}
              className="w-full py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-xs hover:bg-cyan-500/30 border border-cyan-500/40 flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Apply for YIP 5.0 Funding</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
