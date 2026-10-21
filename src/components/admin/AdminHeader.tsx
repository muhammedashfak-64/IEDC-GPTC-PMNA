'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import {
  Menu,
  Search,
  Bell,
  Plus,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
  Database,
  ExternalLink,
  Award,
  Calendar,
  Image as ImageIcon,
  Cpu
} from 'lucide-react';

export const AdminHeader: React.FC = () => {
  const pathname = usePathname();
  const { user, isFaculty, logout, sidebarCollapsed, setSidebarCollapsed, searchQuery, setSearchQuery } = useAdmin();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  // Generate dynamic breadcrumb segments from pathname
  const segments = pathname.split('/').filter(Boolean);

  return (
    <header className="h-16 bg-[#0E0E11]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 gap-4">
      {/* Left: Sidebar Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Path */}
        <nav className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Link href="/admin/dashboard" className="hover:text-white transition-colors">
            Admin
          </Link>
          {segments.slice(1).map((seg, idx) => (
            <React.Fragment key={seg}>
              <span className="text-slate-600">/</span>
              <span className={`capitalize ${idx === segments.length - 2 ? 'text-white font-bold' : ''}`}>
                {seg.replace(/-/g, ' ')}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Middle: Global Admin Search */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search events, certificates, participants, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161619] border border-white/10 focus:border-white/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Tools: Status, Quick Create, Notifications, Profile */}
      <div className="flex items-center gap-2.5">
        {/* System Database Status Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-mono font-medium">
          <Database className="w-3 h-3 text-emerald-400" />
          <span>Supabase Sync Active</span>
        </div>

        {/* Quick Action Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickCreate(!showQuickCreate)}
            className="px-3 py-1.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-slate-200 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showQuickCreate && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#141418] border border-white/15 shadow-2xl p-2 space-y-1 z-50">
              <Link
                href="/admin/events"
                onClick={() => setShowQuickCreate(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>New Event</span>
              </Link>
              <Link
                href="/admin/certificates"
                onClick={() => setShowQuickCreate(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Issue Certificate</span>
              </Link>
              <Link
                href="/admin/gallery"
                onClick={() => setShowQuickCreate(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span>Upload Photos</span>
              </Link>
              <Link
                href="/admin/projects"
                onClick={() => setShowQuickCreate(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Add Project</span>
              </Link>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors relative cursor-pointer"
            title="System Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-2 right-2" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#141418] border border-white/15 shadow-2xl p-4 space-y-3 z-50">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                <span className="text-[10px] font-mono text-slate-400">2 New</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                  <div className="font-bold text-white">System Architecture Restructured</div>
                  <div className="text-slate-400 text-[11px]">Separate public frontend and private backend active.</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                  <div className="font-bold text-white">Supabase Auth Integrated</div>
                  <div className="text-slate-400 text-[11px]">Role-based access enforced server-side.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Role Badge & Logout */}
        <div className="flex items-center gap-2 pl-1 border-l border-white/10">
          <Link
            href="/admin/profile"
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-white/20 flex items-center justify-center font-bold text-xs text-white">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-300" />
              )}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-none">{user?.full_name?.split(' ')[0] || user?.username}</span>
              <span className="text-[9px] font-mono text-slate-400">
                {user?.role === 'main_admin' ? 'Main Admin' : user?.role === 'faculty_coordinator' ? 'Faculty' : 'Student Lead'}
              </span>
            </div>
          </Link>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
