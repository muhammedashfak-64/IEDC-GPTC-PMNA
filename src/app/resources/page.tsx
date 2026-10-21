'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderDown,
  FileText,
  Download,
  Search,
  ExternalLink,
  BookOpen,
  Filter,
  Eye,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  GraduationCap,
  Sparkles,
  Layers
} from 'lucide-react';

export default function ResourceCenterPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    fetch('/api/resources')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setResources(json.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return ['All', ...Array.from(set)];
  }, [resources]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchCat = selectedCategory === 'All' || r.category === selectedCategory;
      const matchType = selectedType === 'All' || (r.fileType || '').toUpperCase() === selectedType.toUpperCase();
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.author?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q);

      return matchCat && matchType && matchSearch;
    });
  }, [resources, selectedCategory, selectedType, searchQuery]);

  // Handle download / open tracking
  const handleDownload = async (resource: any) => {
    try {
      fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resource.id })
      }).catch(() => {});
    } catch {}

    // Open link
    if (resource.fileUrl) {
      window.open(resource.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getFileIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t === 'PDF') return <FileText className="w-5 h-5 text-rose-400" />;
    if (t === 'PPT' || t === 'PPTX') return <Layers className="w-5 h-5 text-amber-400" />;
    if (t === 'ZIP' || t === 'RAR') return <FileArchive className="w-5 h-5 text-purple-400" />;
    if (t === 'CODE' || t === 'JS' || t === 'PY') return <FileCode className="w-5 h-5 text-emerald-400" />;
    if (t === 'XLS' || t === 'XLSX' || t === 'CSV') return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    return <BookOpen className="w-5 h-5 text-cyan-400" />;
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 min-h-[80vh]">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F98A5B]/10 border border-[#F98A5B]/20 text-[#F98A5B] text-xs font-mono font-bold">
          <FolderDown className="w-4 h-4" /> LEARNING HUB &amp; TECHNICAL ARCHIVES
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Resource Library &amp; Downloads
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Access verified hardware handbooks, microcontroller manuals, IEEE presentation slide decks, and startup pitch kits published by IEDC GPTC Perinthalmanna.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-5 rounded-3xl bg-[#121216] border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by topic, document name, or keywords (e.g. ESP32, Pitch Deck)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick File Type Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium shrink-0">Format:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
            >
              <option value="All">All Formats</option>
              <option value="PDF">PDF Documents</option>
              <option value="PPT">Presentations (PPTX)</option>
              <option value="ZIP">ZIP Archives</option>
              <option value="Code">Code &amp; Schematics</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-[#F98A5B] shrink-0" />
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#F98A5B] text-black font-bold shadow-md shadow-[#F98A5B]/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resources Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-[#F98A5B]/30 border-t-[#F98A5B] animate-spin" />
          <span className="text-xs font-mono uppercase tracking-wider">Loading resource archives...</span>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="py-16 p-8 rounded-3xl bg-[#121216] border border-white/10 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Learning Resources Found</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search terms or selecting another category filter.'
              : 'New resources, guides, and templates will be published soon by the faculty coordinator.'}
          </p>
          {(searchQuery || selectedCategory !== 'All' || selectedType !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedType('All');
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 mt-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <div
              key={res.id}
              className="p-6 rounded-3xl bg-[#121216] border border-white/10 hover:border-[#F98A5B]/40 space-y-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-[#F98A5B]/5 group"
            >
              <div className="space-y-3.5">
                {/* Header Row: Category Badge & File Format */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#F98A5B]/10 border border-[#F98A5B]/20 text-[#F98A5B]">
                    {res.category || 'General'}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                    {getFileIcon(res.fileType)}
                    <span>{res.fileType || 'DOC'}</span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#F98A5B] transition-colors leading-snug">
                    {res.title}
                  </h3>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed line-clamp-3">
                    {res.description || 'Verified academic resource curated for IEDC student innovators and startup teams.'}
                  </p>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Author: {res.author || 'IEDC Faculty'}</span>
                  <span>{res.fileSize || 'Standard'}</span>
                </div>

                {/* Download / Open Action Button */}
                <button
                  onClick={() => handleDownload(res)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-[#F98A5B] text-white hover:text-black font-extrabold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm group-hover:shadow-[#F98A5B]/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download / View Resource</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
