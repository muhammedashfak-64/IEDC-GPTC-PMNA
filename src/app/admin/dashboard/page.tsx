'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';
import {
  Calendar,
  Award,
  Cpu,
  Users,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Plus,
  Home,
  Image as ImageIcon,
  BookOpen,
  UserCheck,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminDashboardPage() {
  const { user, isFaculty } = useAdmin();
  const [stats, setStats] = useState<any>({
    totalEvents: 3,
    publishedEvents: 3,
    totalCertificates: 3,
    publishedCertificates: 3,
    totalRegistrations: 3,
    totalProjects: 2,
    totalIdeas: 2
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    // Fetch live dashboard analytics
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.stats) {
          setStats(data.data.stats);
        }
      })
      .catch(console.error);

    // Fetch audit logs if permitted
    if (isFaculty) {
      fetch('/api/admin/audit-logs')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setRecentLogs(data.data.slice(0, 5));
          }
        })
        .catch(console.error);
    }
  }, [isFaculty]);

  // Chart 1: Member Growth
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    datasets: [
      {
        label: 'Active IEDC Registrations',
        data: [120, 180, 240, 310, 380, 450, 540, 650],
        borderColor: '#E5E5EA',
        backgroundColor: 'rgba(229, 229, 234, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#000000',
        pointRadius: 4
      }
    ]
  };

  // Chart 2: Department Share
  const doughnutChartData = {
    labels: ['Computer', 'Electronics', 'Electrical', 'Mechanical', 'Civil'],
    datasets: [
      {
        data: [38, 30, 18, 10, 4],
        backgroundColor: ['#FFFFFF', '#D1D1D6', '#8E8E93', '#48484A', '#2C2C2E'],
        borderWidth: 0
      }
    ]
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#A1A1AA',
          font: { family: 'monospace', size: 11 }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#71717A', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#71717A', font: { size: 10 } }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider ${
                isFaculty
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              {isFaculty ? 'Faculty Coordinator (Full Access)' : 'Student Lead (Restricted Access)'}
            </span>
            <span className="text-xs text-slate-400 font-mono">Staff ID: {user?.staffId || 'ID-001'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Manage public website content, publish state hackathons, verify participant certificates, and oversee campus innovation initiatives.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/events"
            className="px-4 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </Link>
          <Link
            href="/admin/certificates"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Issue Certificates</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Events & Workshops',
            count: stats.totalEvents,
            sub: `${stats.publishedEvents} published live`,
            icon: Calendar,
            href: '/admin/events',
            color: 'text-amber-400'
          },
          {
            title: 'Issued Certificates',
            count: stats.totalCertificates,
            sub: `${stats.publishedCertificates} downloadable`,
            icon: Award,
            href: '/admin/certificates',
            color: 'text-emerald-400'
          },
          {
            title: 'Student Projects',
            count: stats.totalProjects,
            sub: 'Prototypes & Rovers',
            icon: Cpu,
            href: '/admin/projects',
            color: 'text-purple-400'
          },
          {
            title: 'Registered Participants',
            count: stats.totalRegistrations,
            sub: 'Across 3 workshops',
            icon: Users,
            href: '/admin/registrations',
            color: 'text-sky-400'
          }
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.title}
              href={kpi.href}
              className="bg-[#121216] border border-white/10 hover:border-white/20 p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</span>
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>

              <div>
                <div className="text-3xl font-black text-white">{kpi.count}</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">{kpi.sub}</div>
              </div>

              <div className="text-[11px] font-bold text-slate-400 group-hover:text-white flex items-center gap-1 transition-colors pt-2 border-t border-white/5">
                <span>Manage Module</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Line Chart: Member Growth */}
        <div className="lg:col-span-8 bg-[#121216] border border-white/10 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white">Innovation Community Growth</h3>
              <p className="text-[11px] text-slate-400">Total active registered student members in 2026</p>
            </div>
            <span className="text-xs font-mono font-bold text-white bg-white/5 px-3 py-1 rounded-full border border-white/10">
              +440% YTD
            </span>
          </div>

          <div className="h-64 pt-2">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Doughnut Chart: Department Distribution */}
        <div className="lg:col-span-4 bg-[#121216] border border-white/10 p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-sm font-extrabold text-white">Department Share</h3>
            <p className="text-[11px] text-slate-400">Participation across polytechnic branches</p>
          </div>

          <div className="h-52 flex items-center justify-center">
            <Doughnut
              data={doughnutChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#A1A1AA', font: { size: 10 } }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick CMS Jump Hub & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick CMS Hub */}
        <div className="lg:col-span-7 bg-[#121216] border border-white/10 p-6 rounded-3xl space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-sm font-extrabold text-white">Website CMS Quick Hub</h3>
            <p className="text-[11px] text-slate-400">Jump directly to website content editing modules</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Homepage CMS', href: '/admin/homepage', icon: Home },
              { label: 'Events & Posters', href: '/admin/events', icon: Calendar },
              { label: 'Certificates Desk', href: '/admin/certificates', icon: Award },
              { label: 'Gallery Manager', href: '/admin/gallery', icon: ImageIcon },
              { label: 'Student Projects', href: '/admin/projects', icon: Cpu },
              { label: 'Executive Team', href: '/admin/committee', icon: UserCheck }
            ].map((hub) => {
              const Icon = hub.icon;
              return (
                <Link
                  key={hub.label}
                  href={hub.href}
                  className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 flex flex-col items-start gap-2.5 transition-all group"
                >
                  <Icon className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white leading-tight">
                    {hub.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Security / Activity Logs Preview */}
        <div className="lg:col-span-5 bg-[#121216] border border-white/10 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white">Recent Admin Activity</h3>
              <p className="text-[11px] text-slate-400">Live system audit trail</p>
            </div>
            {isFaculty && (
              <Link href="/admin/audit-logs" className="text-[11px] text-slate-400 hover:text-white font-bold">
                View All →
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">{log.action}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-snug">{log.details}</p>
                  <span className="text-[9px] font-mono text-slate-400">By: {log.userName}</span>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.02] text-center text-xs text-slate-400">
                System separated into Frontend &amp; Backend. All activity logged securely.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
