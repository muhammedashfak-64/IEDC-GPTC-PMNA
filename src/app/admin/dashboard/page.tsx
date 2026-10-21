'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';
import {
  Calendar,
  Award,
  Cpu,
  Users,
  ArrowRight,
  Plus,
  Home,
  Image as ImageIcon,
  BookOpen,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart2,
  PieChart as PieIcon
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
    totalEvents: 0,
    publishedEvents: 0,
    totalCertificates: 0,
    publishedCertificates: 0,
    totalRegistrations: 0,
    totalProjects: 0,
    totalIdeas: 0
  });
  const [analyticsPayload, setAnalyticsPayload] = useState<any>({
    timeline: [],
    departmentBreakdown: []
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live dashboard analytics from real database
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.stats) setStats(data.data.stats);
          setAnalyticsPayload({
            timeline: data.data.timeline || [],
            departmentBreakdown: data.data.departmentBreakdown || []
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch live audit logs
    fetch('/api/admin/audit-logs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setRecentLogs(data.data.slice(0, 5));
        }
      })
      .catch(console.error);
  }, []);

  // Real Timeline Chart Data
  const timeline = analyticsPayload.timeline || [];
  const lineLabels = timeline.length > 0 ? timeline.map((t: any) => t.period) : ['Start'];
  const lineValues = timeline.length > 0 ? timeline.map((t: any) => t.cumulative) : [0];

  const lineChartData = {
    labels: lineLabels,
    datasets: [
      {
        label: 'Cumulative Registrations',
        data: lineValues,
        borderColor: '#F98A5B',
        backgroundColor: 'rgba(249, 138, 91, 0.12)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#F98A5B',
        pointBorderColor: '#000000',
        pointRadius: 4
      }
    ]
  };

  // Real Department Doughnut Chart Data
  const deptBreakdown = analyticsPayload.departmentBreakdown || [];
  const deptLabels = deptBreakdown.length > 0 ? deptBreakdown.map((d: any) => d.department) : ['No Data'];
  const deptValues = deptBreakdown.length > 0 ? deptBreakdown.map((d: any) => d.count) : [0];
  const deptColors = ['#F98A5B', '#38BDF8', '#A855F7', '#10B981', '#F59E0B', '#EC4899'];

  const doughnutChartData = {
    labels: deptLabels,
    datasets: [
      {
        data: deptValues,
        backgroundColor: deptColors.slice(0, Math.max(1, deptLabels.length)),
        borderColor: '#121216',
        borderWidth: 2
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
          font: { family: 'ui-sans-serif, system-ui, sans-serif', size: 11 }
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
        ticks: { color: '#71717A', font: { size: 10 }, precision: 0 }
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
                  : 'bg-[#F98A5B]/15 text-[#F98A5B] border border-[#F98A5B]/30'
              }`}
            >
              {isFaculty ? 'Faculty Coordinator (Full Access)' : 'Main Administrator (Full CMS Control)'}
            </span>
            <span className="text-xs text-slate-400 font-mono">Operator ID: {user?.staffId || user?.username || 'ADMIN-01'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome back, {user?.full_name || 'Administrator'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Manage public website content, publish campus workshops, verify participant certificates, and oversee IEDC operations.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/events"
            className="px-4 py-2.5 rounded-xl bg-[#F98A5B] text-black font-extrabold text-xs flex items-center gap-2 hover:bg-[#F98A5B]/90 transition-colors shadow-sm"
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
            count: stats.totalEvents ?? 0,
            sub: `${stats.publishedEvents ?? 0} published live`,
            icon: Calendar,
            href: '/admin/events',
            color: 'text-amber-400'
          },
          {
            title: 'Issued Certificates',
            count: stats.publishedCertificates ?? 0,
            sub: `${stats.totalCertificates ?? 0} total generated`,
            icon: Award,
            href: '/admin/certificates',
            color: 'text-emerald-400'
          },
          {
            title: 'Student Projects',
            count: stats.totalProjects ?? 0,
            sub: 'Prototypes & Innovations',
            icon: Cpu,
            href: '/admin/projects',
            color: 'text-purple-400'
          },
          {
            title: 'Registered Students',
            count: stats.totalRegistrations ?? 0,
            sub: `${stats.confirmedRegistrations ?? stats.totalRegistrations ?? 0} confirmed`,
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
              <p className="text-[11px] text-slate-400">Total active registered student participants in database</p>
            </div>
            <Link
              href="/admin/analytics"
              className="text-xs font-mono font-bold text-[#F98A5B] hover:underline bg-[#F98A5B]/10 px-3 py-1 rounded-full border border-[#F98A5B]/20"
            >
              Detailed Analytics →
            </Link>
          </div>

          <div className="h-64 pt-2">
            {timeline.length > 0 ? (
              <Line data={lineChartData} options={chartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <BarChart2 className="w-8 h-8 mb-2 opacity-40" />
                <span>Loading live registration data...</span>
              </div>
            )}
          </div>
        </div>

        {/* Doughnut Chart: Department Distribution */}
        <div className="lg:col-span-4 bg-[#121216] border border-white/10 p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-sm font-extrabold text-white">Department Share</h3>
            <p className="text-[11px] text-slate-400">Participation across polytechnic branches</p>
          </div>

          <div className="h-52 flex items-center justify-center">
            {deptBreakdown.length > 0 ? (
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
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <PieIcon className="w-8 h-8 mb-2 opacity-40" />
                <span>No department data logged</span>
              </div>
            )}
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
              { label: 'Learning Resources', href: '/admin/resources', icon: BookOpen },
              { label: 'Gallery Manager', href: '/admin/gallery', icon: ImageIcon },
              { label: 'Student Projects', href: '/admin/projects', icon: Cpu },
              { label: 'Student Leads', href: '/admin/team', icon: Users },
              { label: 'Faculty Coordinators', href: '/admin/faculty-coordinators', icon: UserCheck }
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
            <Link href="/admin/audit-logs" className="text-[11px] text-[#F98A5B] hover:underline font-bold">
              View All →
            </Link>
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
                All administrator actions and content changes are recorded in the system audit logs.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
