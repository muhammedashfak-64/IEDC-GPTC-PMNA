'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { FileText, Search, MessageSquare, Clock, User, Sparkles } from 'lucide-react';

export default function BlogPage() {
  const { blogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = blogs.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <FileText className="w-3.5 h-3.5" /> INNOVATION DISPATCH
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">IEDC Blog & Stories</h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Read articles on polytechnic startup culture, hackathon retrospectives, and technical innovation breakthroughs.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search articles by title or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none"
        />
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((b) => (
          <article key={b.id} className="glass-panel rounded-3xl border border-cyan-500/20 overflow-hidden flex flex-col justify-between glass-panel-hover">
            <div className="relative h-56 w-full">
              <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-cyan-500/30 text-[11px] font-bold text-cyan-300">
                {b.category}
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-cyan-400" /> {b.date}</span>
                  <span>•</span>
                  <span>{b.readTime}</span>
                </div>
                <h2 className="text-xl font-bold text-white leading-snug">{b.title}</h2>
                <p className="text-slate-300 text-xs line-clamp-3 leading-relaxed">{b.excerpt}</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-cyan-300 block">{b.author}</span>
                  <span className="text-[10px] text-slate-400">{b.authorRole}</span>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 text-cyan-400" /> {b.commentsCount} comments
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
