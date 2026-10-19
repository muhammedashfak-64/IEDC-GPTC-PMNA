'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Project } from '@/types';
import {
  Cpu,
  Search,
  Filter,
  Heart,
  Bookmark,
  Code,
  ExternalLink,
  Users,
  Download,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';

export default function ProjectsPage() {
  const { projects, toggleLikeProject, addToast } = useApp();
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedTech, setSelectedTech] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalProject, setActiveModalProject] = useState<Project | null>(null);

  const departments = ['All', 'Computer Engineering', 'Electronics Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'];
  const technologies = ['All', 'ESP32', 'IoT', 'Python', 'Arduino', 'OpenCV', 'TensorFlow', 'React'];
  const statuses = ['All', 'Incubated', 'Prototype', 'In Progress', 'Completed'];

  const filteredProjects = projects.filter((p) => {
    const matchesDept = selectedDept === 'All' || p.department === selectedDept;
    const matchesTech = selectedTech === 'All' || p.technology.includes(selectedTech);
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesTech && matchesStatus && matchesSearch;
  });

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#F98A5B]/15 border border-[#F98A5B]/30 text-[#F98A5B] text-xs font-mono">
          <Cpu className="w-3.5 h-3.5" /> INNOVATION SHOWCASE
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          Student <span className="text-[#F98A5B]">Project</span> Gallery
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl mx-auto">
          Discover hardware prototypes, software solutions, and patented innovations created by diploma students at GPTC PMNA.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-iedc p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects by title, author, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F0F10]/90 border border-white/20 focus:border-[#F98A5B] rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#F98A5B] shrink-0" />
            <span className="text-xs text-slate-300 font-bold uppercase">Filters</span>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-[#F98A5B] uppercase tracking-wider block mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-[#0F0F10] border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#EC3A74] uppercase tracking-wider block mb-1">Technology</label>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full bg-[#0F0F10] border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              {technologies.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6249A3] uppercase tracking-wider block mb-1">Incubation Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#0F0F10] border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((proj) => (
          <div key={proj.id} className="glass-iedc rounded-3xl border border-white/10 overflow-hidden flex flex-col justify-between glass-iedc-hover">
            <div className="relative h-48 w-full overflow-hidden group">
              <img
                src={proj.imageUrl}
                alt={proj.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#F98A5B]/40 text-[11px] font-bold text-[#F98A5B]">
                {proj.status}
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-[#F98A5B] font-bold uppercase">{proj.department} • {proj.year}</span>
                <h3 className="text-lg font-bold text-white leading-snug">{proj.title}</h3>
                <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">{proj.description}</p>
              </div>

              {/* Tech Tags */}
              <div className="flex flex-wrap gap-1.5">
                {proj.technology.map((t: string) => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-[#0F0F10] text-[#F98A5B] text-[10px] font-mono border border-[#F98A5B]/30">
                    {t}
                  </span>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleLikeProject(proj.id)}
                    className="flex items-center gap-1 text-slate-300 hover:text-[#EC3A74] text-xs font-semibold cursor-pointer"
                  >
                    <Heart className="w-4 h-4 text-[#EC3A74]" />
                    <span>{proj.likes}</span>
                  </button>
                  <button
                    onClick={() => addToast('Bookmarked', 'Project saved to your member profile bookmarks!', 'info')}
                    className="text-slate-300 hover:text-[#F98A5B] cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setActiveModalProject(proj)}
                  className="px-3.5 py-1.5 rounded-xl btn-primary-iedc text-white text-xs font-bold transition-all cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Project Detail Modal */}
      {activeModalProject && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl glass-iedc p-6 sm:p-8 rounded-3xl border border-[#F98A5B]/40 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setActiveModalProject(null)}
              className="absolute top-5 right-5 text-slate-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-[#F98A5B]">
              <Sparkles className="w-4 h-4 text-[#EC3A74]" />
              <span>PROJECT BLUEPRINT DETAIL</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{activeModalProject.title}</h2>

            <img
              src={activeModalProject.imageUrl}
              alt={activeModalProject.title}
              className="w-full h-64 object-cover rounded-2xl border border-white/10"
            />

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#F98A5B] uppercase tracking-wider">Abstract & Overview</h4>
              <p className="text-slate-200 text-sm leading-relaxed">{activeModalProject.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#0F0F10] p-4 rounded-2xl border border-white/10">
              <div>
                <span className="text-slate-400 block font-semibold">Lead Innovator</span>
                <span className="font-bold text-[#F98A5B]">{activeModalProject.author}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Faculty Mentor</span>
                <span className="font-bold text-[#EC3A74]">{activeModalProject.mentor || 'Prof. Muhammed Rashid'}</span>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-3">
              {activeModalProject.githubUrl && (
                <a
                  href={activeModalProject.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20"
                >
                  <Code className="w-4 h-4 text-[#F98A5B]" /> Source Repository
                </a>
              )}
              {activeModalProject.demoUrl && (
                <a
                  href={activeModalProject.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl btn-primary-iedc text-white font-bold text-xs flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> Live Web Demo
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
