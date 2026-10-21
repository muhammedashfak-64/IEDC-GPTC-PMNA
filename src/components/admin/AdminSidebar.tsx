'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import {
  LayoutDashboard,
  TrendingUp,
  History,
  Home,
  Info,
  Calendar,
  FileText,
  Image as ImageIcon,
  BookOpen,
  Megaphone,
  Handshake,
  Cpu,
  Lightbulb,
  Rocket,
  GraduationCap,
  Award,
  Stamp,
  Users,
  Contact,
  ShieldCheck,
  UserCheck,
  UserCog,
  Settings,
  Bell,
  User,
  LogOut,
  Lock,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: any;
  facultyOnly?: boolean;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, isFaculty, logout, sidebarCollapsed, setSidebarCollapsed } = useAdmin();

  // All 25 Admin Sidebar Modules categorized into 5 logical CMS groups
  const sections: NavSection[] = [
    {
      title: 'CORE & ANALYTICS',
      items: [
        { id: 'dashboard', name: '1. Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { id: 'analytics', name: '21. Analytics & Reports', href: '/admin/analytics', icon: TrendingUp },
        { id: 'audit-logs', name: '24. Audit Logs', href: '/admin/audit-logs', icon: History, facultyOnly: true, badge: 'Faculty' }
      ]
    },
    {
      title: 'CONTENT MANAGEMENT (CMS)',
      items: [
        { id: 'homepage', name: '2. Homepage Management', href: '/admin/homepage', icon: Home },
        { id: 'about', name: '3. About, Vision & Mission', href: '/admin/about', icon: Info },
        { id: 'events', name: '4. Events & Workshops', href: '/admin/events', icon: Calendar },
        { id: 'brochures', name: '9. Brochures', href: '/admin/brochures', icon: FileText },
        { id: 'gallery', name: '10. Gallery', href: '/admin/gallery', icon: ImageIcon },
        { id: 'blogs', name: '15. Blogs', href: '/admin/blogs', icon: BookOpen },
        { id: 'announcements', name: '16. Announcements', href: '/admin/announcements', icon: Megaphone },
        { id: 'partners', name: '19. Partners & Sponsors', href: '/admin/partners', icon: Handshake }
      ]
    },
    {
      title: 'INNOVATION & ACADEMICS',
      items: [
        { id: 'projects', name: '11. Projects', href: '/admin/projects', icon: Cpu },
        { id: 'ideas', name: '12. Innovation Ideas', href: '/admin/ideas', icon: Lightbulb },
        { id: 'startups', name: '13. Startups', href: '/admin/startups', icon: Rocket },
        { id: 'resources', name: '14. Learning Resources', href: '/admin/resources', icon: GraduationCap }
      ]
    },
    {
      title: 'PARTICIPATION & CERTIFICATES',
      items: [
        { id: 'registrations', name: '5. Event Registrations', href: '/admin/registrations', icon: Users },
        { id: 'participants', name: '6. Participants Directory', href: '/admin/participants', icon: Contact },
        { id: 'certificates', name: '7. Certificates', href: '/admin/certificates', icon: Award },
        { id: 'certificate-templates', name: '8. Certificate Templates', href: '/admin/certificate-templates', icon: Stamp }
      ]
    },
    {
      title: 'GOVERNANCE & SYSTEM',
      items: [
        { id: 'team', name: '17. Team & Members', href: '/admin/team', icon: UserCheck },
        { id: 'faculty-coordinators', name: '18. Faculty Coordinators', href: '/admin/faculty-coordinators', icon: ShieldCheck, facultyOnly: true, badge: 'Faculty' },
        { id: 'notifications', name: '20. Notifications', href: '/admin/notifications', icon: Bell },
        { id: 'users', name: '22. Operator & Access Management', href: '/admin/users', icon: UserCog, facultyOnly: true, badge: 'Admin' },
        { id: 'settings', name: '23. Website Settings', href: '/admin/settings', icon: Settings, facultyOnly: true, badge: 'Faculty' },
        { id: 'profile', name: '25. My Profile', href: '/admin/profile', icon: User }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {!sidebarCollapsed && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0B0B0D] border-r border-white/10 flex flex-col transition-transform duration-300 ${
          sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 bg-[#0F0F12]">
          <Link href="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
            <img src="/iedc-logo.png" alt="IEDC" className="w-8 h-8 object-contain shrink-0 drop-shadow" />
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-sm tracking-wide text-white leading-tight truncate">
                  IEDC CMS
                </span>
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none truncate">
                  GPTC PMNA BACKEND
                </span>
              </div>
            )}
          </Link>

          {/* Toggle sidebar button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <X className="w-4 h-4 lg:hidden" />}
          </button>
        </div>

        {/* User Role Card */}
        {!sidebarCollapsed && user && (
          <div className="p-3 mx-3 my-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-white/15 flex items-center justify-center font-black text-xs text-white shrink-0 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                user.full_name?.charAt(0) || 'A'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate leading-snug">{user.full_name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-wider ${
                    user.role === 'main_admin'
                      ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                      : isFaculty
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {user.role === 'main_admin'
                    ? 'Main Administrator'
                    : isFaculty
                    ? 'Faculty Coordinator'
                    : 'Student Lead'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Navigation Modules List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pb-1">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                const isLocked = item.facultyOnly && !isFaculty;

                return (
                  <Link
                    key={item.id}
                    href={isLocked ? '#' : item.href}
                    onClick={(e) => {
                      if (isLocked) {
                        e.preventDefault();
                        alert('Access Restricted: This module requires Faculty Coordinator administrative privileges.');
                      }
                    }}
                    title={sidebarCollapsed ? item.name : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-white text-black font-extrabold shadow-sm'
                        : isLocked
                        ? 'text-slate-500 opacity-60 cursor-not-allowed hover:bg-white/[0.02]'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : isLocked ? 'text-slate-500' : 'text-slate-400 group-hover:text-white'}`} />
                    {!sidebarCollapsed && (
                      <span className="truncate flex-1">{item.name}</span>
                    )}
                    {!sidebarCollapsed && item.badge && isLocked && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-white/5 text-slate-400 border border-white/10 flex items-center gap-1 shrink-0">
                        <Lock className="w-2.5 h-2.5" />
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer: Sign Out & Live Link */}
        <div className="p-3 border-t border-white/10 bg-[#0B0B0D] space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Home className="w-4 h-4 shrink-0 text-slate-400" />
            {!sidebarCollapsed && <span className="truncate">View Public Site ↗</span>}
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
