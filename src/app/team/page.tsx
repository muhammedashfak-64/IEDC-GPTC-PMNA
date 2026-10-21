'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Award,
  Filter
} from 'lucide-react';
import { InstagramIcon as Instagram, LinkedInIcon as Linkedin } from '@/components/SocialIcons';
import AnimatedProfileCard, { ProfileCardData } from '@/components/team/AnimatedProfileCard';

export type TeamMember = ProfileCardData;

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/public/team');
      const data = await res.json();
      if (data.success && data.data) {
        setMembers(data.data);
      }
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  // Filter categories
  const categories = useMemo(() => {
    const list = Array.from(new Set(members.map((m) => m.category || 'Executive Members')));
    return ['ALL', ...list];
  }, [members]);

  // Filter departments
  const departments = useMemo(() => {
    const list = Array.from(new Set(members.map((m) => m.department).filter(Boolean)));
    return ['ALL', ...list];
  }, [members]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.department && m.department.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
      const matchDept = selectedDept === 'ALL' || m.department === selectedDept;

      return matchSearch && matchCategory && matchDept;
    });
  }, [members, searchQuery, selectedCategory, selectedDept]);

  // Format graduation batch
  const formatGrad = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `Class of ${year}`;
    }
    return dateStr;
  };

  // Get initials for placeholder
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-[#F98A5B]" />
          IEDC TEAM & STUDENT LEADS
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
          Student Innovation Leaders & <br className="hidden sm:block" />
          <span className="text-[#F98A5B]">Executive Committee</span>
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          The passionate student engineers driving ideation, hackathons, hardware maker bootcamps, and startup culture at Government Polytechnic College, Perinthalmanna.
        </p>

        {/* Quick link to Faculty Coordinators */}
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/faculty"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-[#F98A5B]" />
            Looking for Faculty Leadership? View Faculty Coordinators
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Stats Quick Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 text-center">
          <div className="text-2xl font-black text-white">{members.length}</div>
          <div className="text-xs text-neutral-400 font-mono">Executive Leads</div>
        </div>
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 text-center">
          <div className="text-2xl font-black text-[#F98A5B]">3+</div>
          <div className="text-xs text-neutral-400 font-mono">Engineering Depts</div>
        </div>
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 text-center">
          <div className="text-2xl font-black text-white">2027 - 2028</div>
          <div className="text-xs text-neutral-400 font-mono">Graduation Cohorts</div>
        </div>
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 text-center">
          <div className="text-2xl font-black text-emerald-400">100%</div>
          <div className="text-xs text-neutral-400 font-mono">Student Led</div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by name, role, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900/80 border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#F98A5B] transition-colors"
            />
          </div>

          {/* Department Filter & Refresh */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="py-2.5 pl-3 pr-8 rounded-xl bg-neutral-900/80 border border-white/10 text-neutral-300 text-xs focus:outline-none focus:border-[#F98A5B] transition-colors cursor-pointer"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept} className="bg-neutral-900 text-white">
                    {dept === 'ALL' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchTeam}
              disabled={loading}
              title="Refresh Team"
              className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-[#F98A5B] text-neutral-950 font-bold shadow-lg shadow-[#F98A5B]/20'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Team Cards Grid */}
      {loading ? (
        <div className="text-center py-24 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#F98A5B]" />
          <p className="text-neutral-400 text-sm">Loading IEDC Team & Student Leads...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-20 p-8 rounded-3xl bg-neutral-950/60 border border-white/10 max-w-md mx-auto space-y-3">
          <Users className="w-12 h-12 text-neutral-600 mx-auto" />
          <h3 className="text-white font-bold text-base">No members found</h3>
          <p className="text-xs text-neutral-400">
            No student leads matched the selected search or category filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedDept('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMembers.map((member, idx) => (
            <AnimatedProfileCard
              key={member.id}
              member={member}
              index={idx}
              containerHeight="h-72 sm:h-80"
              layoutVariant="team"
            />
          ))}
        </div>
      )}
    </div>
  );
}
