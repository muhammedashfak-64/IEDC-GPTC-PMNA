'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { MessageSquare, ThumbsUp, Plus, Users, Sparkles } from 'lucide-react';

export default function CommunityPage() {
  const { forumThreads, addToast } = useApp();

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Users className="w-3.5 h-3.5" /> STUDENT DISCUSSIONS & COLLABORATION
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">Community Forum</h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Ask technical questions about circuit design, software algorithms, and project team formation.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Discussions</span>
        <button
          onClick={() => addToast('New Discussion', 'Opening forum thread editor...', 'info')}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
        >
          <Plus className="w-4 h-4" /> Start New Discussion
        </button>
      </div>

      <div className="space-y-4">
        {forumThreads.map((thread) => (
          <div key={thread.id} className="glass-panel p-6 rounded-3xl border border-cyan-500/20 space-y-3 glass-panel-hover">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-[11px] font-mono font-bold border border-cyan-500/30">
                {thread.category} • {thread.department}
              </span>
              <span className="text-xs text-slate-400 font-mono">{thread.createdAt}</span>
            </div>

            <h3 className="text-lg font-bold text-white">{thread.title}</h3>
            <p className="text-slate-300 text-xs leading-relaxed">{thread.content}</p>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Asked by: <strong className="text-cyan-300">{thread.author}</strong></span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-slate-400"><ThumbsUp className="w-3.5 h-3.5 text-cyan-400" /> {thread.likes}</span>
                <span className="flex items-center gap-1 text-slate-400"><MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> {thread.repliesCount} replies</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
