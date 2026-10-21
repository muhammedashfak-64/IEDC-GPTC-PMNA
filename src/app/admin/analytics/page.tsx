'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useAdmin } from '@/context/AdminContext';
import {
  TrendingUp,
  BarChart2,
  Download,
  Users,
  Award,
  Calendar,
  Lightbulb,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  FolderGit2,
  BookOpen,
  Filter,
  PieChart as PieIcon,
  ShieldAlert,
  Clock,
  Layers
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type DateRange = 'all' | 'today' | '7d' | '30d' | 'month' | 'year' | 'custom';

export default function AnalyticsReportsPage() {
  const { addToast } = useAdmin();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<DateRange>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);

  const fetchAnalytics = async (range: DateRange = selectedRange, start?: string, end?: string) => {
    setLoading(true);
    try {
      let url = `/api/admin/analytics?range=${range}`;
      if (range === 'custom') {
        if (start) url += `&startDate=${encodeURIComponent(start)}`;
        if (end) url += `&endDate=${encodeURIComponent(end)}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        addToast('Error', json.error || 'Failed to fetch analytics', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Network error fetching analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics('all');
  }, []);

  const handleRangeChange = (range: DateRange) => {
    setSelectedRange(range);
    if (range !== 'custom') {
      fetchAnalytics(range);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart) {
      addToast('Validation', 'Please select a start date.', 'warning');
      return;
    }
    fetchAnalytics('custom', customStart, customEnd);
  };

  // Helper chart configurations
  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#A1A1AA',
          font: { family: 'ui-sans-serif, system-ui, sans-serif', size: 11 }
        }
      },
      tooltip: {
        backgroundColor: '#18181D',
        titleColor: '#FFFFFF',
        bodyColor: '#E4E4E7',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10
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

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#D4D4D8',
          font: { size: 11 },
          padding: 16
        }
      }
    }
  };

  // Prepare Chart Datasets from Real Data
  const stats = data?.stats || {};
  const timeline = data?.timeline || [];
  const departmentBreakdown = data?.departmentBreakdown || [];
  const eventAttendanceBreakdown = data?.eventAttendanceBreakdown || [];
  const categoryBreakdown = data?.categoryBreakdown || { internal: 0, external: 0 };
  const academicYearBreakdown = data?.academicYearBreakdown || [];

  // 1. Timeline Chart Data
  const timelineLabels = timeline.length > 0 ? timeline.map((t: any) => t.period) : ['No Data'];
  const timelineCounts = timeline.length > 0 ? timeline.map((t: any) => t.count) : [0];
  const timelineCumulative = timeline.length > 0 ? timeline.map((t: any) => t.cumulative) : [0];

  const lineChartData = {
    labels: timelineLabels,
    datasets: [
      {
        label: 'Cumulative Registrations',
        data: timelineCumulative,
        borderColor: '#F98A5B',
        backgroundColor: 'rgba(249, 138, 91, 0.12)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#F98A5B'
      },
      {
        label: 'Period Registrations',
        data: timelineCounts,
        borderColor: '#38BDF8',
        backgroundColor: 'rgba(56, 189, 248, 0.05)',
        tension: 0.35,
        borderDash: [5, 5],
        fill: false,
        pointBackgroundColor: '#38BDF8'
      }
    ]
  };

  // 2. Department Breakdown Chart
  const deptPalette = [
    '#F98A5B',
    '#38BDF8',
    '#A855F7',
    '#10B981',
    '#F59E0B',
    '#EC4899',
    '#6366F1'
  ];
  const departmentChartData = {
    labels: departmentBreakdown.length > 0 ? departmentBreakdown.map((d: any) => d.department) : ['No Registrations'],
    datasets: [
      {
        label: 'Registrations',
        data: departmentBreakdown.length > 0 ? departmentBreakdown.map((d: any) => d.count) : [0],
        backgroundColor: deptPalette.slice(0, Math.max(1, departmentBreakdown.length)),
        borderColor: '#121216',
        borderWidth: 2
      }
    ]
  };

  // 3. Event Attendance Chart
  const eventAttendanceChartData = {
    labels: eventAttendanceBreakdown.length > 0 ? eventAttendanceBreakdown.map((e: any) => e.title) : ['No Program Data'],
    datasets: [
      {
        label: 'Registered Students',
        data: eventAttendanceBreakdown.length > 0 ? eventAttendanceBreakdown.map((e: any) => e.registered) : [0],
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 6
      },
      {
        label: 'Attended Students',
        data: eventAttendanceBreakdown.length > 0 ? eventAttendanceBreakdown.map((e: any) => e.attended) : [0],
        backgroundColor: '#10B981',
        borderRadius: 6
      }
    ]
  };

  // 4. Participation Category (Internal vs External)
  const categoryChartData = {
    labels: ['Internal (GPTC PMNA)', 'External Institutions'],
    datasets: [
      {
        data: [categoryBreakdown.internal, categoryBreakdown.external],
        backgroundColor: ['#F98A5B', '#8B5CF6'],
        borderColor: '#121216',
        borderWidth: 2
      }
    ]
  };

  // 5. Academic Year Chart
  const academicYearChartData = {
    labels: academicYearBreakdown.length > 0 ? academicYearBreakdown.map((y: any) => y.year) : ['None'],
    datasets: [
      {
        label: 'Students by Academic Year',
        data: academicYearBreakdown.length > 0 ? academicYearBreakdown.map((y: any) => y.count) : [0],
        backgroundColor: '#6366F1',
        borderRadius: 6
      }
    ]
  };

  // -------------------------------------------------------------
  // EXPORT SUMMARY PDF (Functional jsPDF Generator)
  // -------------------------------------------------------------
  const exportSummaryPdf = () => {
    setExportingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(18, 18, 22);
      doc.rect(0, 0, pageWidth, 42, 'F');

      doc.setTextColor(249, 138, 91);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('IEDC GPTC PMNA — OFFICIAL ACCREDITATION REPORT', 14, 15);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Comprehensive Analytics & Program Metrics', 14, 25);

      doc.setTextColor(161, 161, 170);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Government Polytechnic College Perinthalmanna  |  Generated on: ${new Date().toLocaleString('en-IN')}`,
        14,
        34
      );

      let currentY = 50;

      // Filter Range Label
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Active Filter Range: ${selectedRange.toUpperCase()}`, 14, currentY);
      currentY += 6;

      // Table 1: Key Executive Metrics
      const keyStatsRows = [
        ['Total Student Registrations', `${stats.totalRegistrations || 0} (${stats.allTimeRegistrations || 0} all-time)`],
        ['Confirmed Participants', `${stats.confirmedRegistrations || 0}`],
        ['Verified Event Attendees', `${stats.attendedRegistrations || 0}`],
        ['Overall Attendance Conversion Rate', `${stats.attendanceRate || 0}%`],
        ['Waiting List Entries', `${stats.waitlistedRegistrations || 0}`],
        ['Total Campus Programs & Workshops', `${stats.totalEvents || 0} (${stats.publishedEvents || 0} Published)`],
        ['Upcoming vs Completed Programs', `${stats.upcomingEvents || 0} Upcoming / ${stats.completedEvents || 0} Completed`],
        ['Issued & Published Certificates', `${stats.publishedCertificates || 0} / ${stats.totalCertificates || 0}`],
        ['Certificate Downloads by Students', `${stats.totalCertDownloads || 0}`],
        ['Student Innovation Projects', `${stats.totalProjects || 0}`],
        ['Entrepreneurship Ideas Submitted', `${stats.totalIdeas || 0} (${stats.approvedIdeas || 0} Approved)`],
        ['Published Learning Resources', `${stats.publishedResources || 0}`],
        ['Active Student Leads & Faculty', `${stats.totalTeamMembers || 0} Leads / ${stats.totalFaculty || 0} Faculty Coordinators`]
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Executive Metric', 'Recorded Value']],
        body: keyStatsRows,
        theme: 'striped',
        headStyles: { fillColor: [24, 24, 29], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5 }
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 12;

      // Table 2: Department Breakdown
      if (departmentBreakdown.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text('Departmental Participant Distribution', 14, currentY);
        currentY += 4;

        const deptRows = departmentBreakdown.map((d: any) => [
          d.department,
          d.count,
          stats.totalRegistrations > 0 ? `${Math.round((d.count / stats.totalRegistrations) * 100)}%` : '0%'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Department / Branch', 'Participants', 'Share (%)']],
          body: deptRows,
          theme: 'striped',
          headStyles: { fillColor: [249, 138, 91], textColor: [0, 0, 0], fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2 }
        });

        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 12;
      }

      // Check if page overflow
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      // Table 3: Program Attendance Summary
      if (eventAttendanceBreakdown.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text('Workshop & Event Attendance Breakdown', 14, currentY);
        currentY += 4;

        const eventRows = eventAttendanceBreakdown.map((e: any) => {
          const rate = e.registered > 0 ? Math.round((e.attended / e.registered) * 100) : 0;
          return [e.title, e.registered, e.attended, `${rate}%`];
        });

        autoTable(doc, {
          startY: currentY,
          head: [['Event Title', 'Registered', 'Attended', 'Attendance Rate']],
          body: eventRows,
          theme: 'striped',
          headStyles: { fillColor: [24, 24, 29], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2 }
        });
      }

      // Footer disclaimer
      const finalY = doc.internal.pageSize.getHeight() - 10;
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Verified document generated directly from IEDC GPTC PMNA production database. For official audit use only.',
        pageWidth / 2,
        finalY,
        { align: 'center' }
      );

      doc.save(`IEDC_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      addToast('Export Complete', 'Analytics report PDF downloaded successfully.', 'success');
    } catch (err: any) {
      addToast('Export Failed', err.message || 'Could not generate PDF report', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F98A5B] uppercase tracking-widest block mb-1">
            ANALYTICS &amp; INSTITUTIONAL REPORTS
          </span>
          <h1 className="text-2xl font-black text-white">Program Analytics &amp; Metrics</h1>
          <p className="text-slate-400 text-xs">
            Real-time data synchronization directly from student event registrations, attendance records, certificates, and campus workshops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAnalytics(selectedRange, customStart, customEnd)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#F98A5B]' : ''}`} />
          </button>

          <button
            onClick={exportSummaryPdf}
            disabled={exportingPdf || loading}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{exportingPdf ? 'Generating PDF...' : 'Export Summary PDF'}</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#121216] border border-white/10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-[#F98A5B]" />
            <span>Time Range:</span>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'custom', label: 'Custom Range' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleRangeChange(btn.id as DateRange)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedRange === btn.id
                    ? 'bg-[#F98A5B] text-black font-bold shadow-md shadow-[#F98A5B]/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Picker Drawer */}
        {selectedRange === 'custom' && (
          <form
            onSubmit={handleApplyCustom}
            className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                required
                className="bg-[#18181D] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-[#18181D] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 font-bold transition-colors cursor-pointer"
            >
              Apply Filter
            </button>
          </form>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registrations */}
        <div className="p-5 rounded-2xl bg-[#121216] border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Student Registrations</span>
            <Users className="w-4 h-4 text-[#F98A5B]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.totalRegistrations ?? 0}</span>
            <span className="text-[11px] text-slate-500 font-mono">
              / {stats.allTimeRegistrations ?? 0} total
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-white/5">
            <span className="text-emerald-400 font-bold">{stats.confirmedRegistrations ?? 0} Confirmed</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">{stats.waitlistedRegistrations ?? 0} Waitlist</span>
          </div>
        </div>

        {/* Card 2: Attendance Rate */}
        <div className="p-5 rounded-2xl bg-[#121216] border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Attendance Rate</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{stats.attendanceRate ?? 0}%</span>
            <span className="text-[11px] text-slate-500 font-mono">verified</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-white/5">
            <span>{stats.attendedRegistrations ?? 0} attended in person</span>
          </div>
        </div>

        {/* Card 3: Events & Workshops */}
        <div className="p-5 rounded-2xl bg-[#121216] border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Programs &amp; Workshops</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.totalEvents ?? 0}</span>
            <span className="text-[11px] text-slate-500 font-mono">
              ({stats.publishedEvents ?? 0} active)
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-white/5">
            <span className="text-purple-400">{stats.upcomingEvents ?? 0} Upcoming</span>
            <span>•</span>
            <span>{stats.completedEvents ?? 0} Completed</span>
          </div>
        </div>

        {/* Card 4: Certificates Issued */}
        <div className="p-5 rounded-2xl bg-[#121216] border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Certificates Issued</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.publishedCertificates ?? 0}</span>
            <span className="text-[11px] text-slate-500 font-mono">
              / {stats.totalCertificates ?? 0} generated
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-white/5">
            <span className="text-amber-400">{stats.totalCertDownloads ?? 0} downloads verified</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-black text-white">{stats.publishedResources ?? 0}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Learning Resources</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-black text-white">{stats.totalProjects ?? 0}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Student Projects</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-black text-white">{stats.approvedIdeas ?? 0} / {stats.totalIdeas ?? 0}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Approved Ideas</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-black text-white">{stats.totalTeamMembers ?? 0} + {stats.totalFaculty ?? 0}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Leads &amp; Faculty</div>
          </div>
        </div>
      </div>

      {/* Row 1: Charts - Registration Timeline & Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline (Spans 2 columns) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Registration &amp; Enrollment Trajectory</h3>
              <p className="text-slate-400 text-xs">Timeline of verified registrations across filtered periods</p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
              {timeline.length} Date Point{timeline.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="h-64 sm:h-72">
            {timeline.length > 0 ? (
              <Line data={lineChartData} options={chartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <BarChart2 className="w-8 h-8 mb-2 opacity-40" />
                <span>No registration activity recorded for selected range.</span>
              </div>
            )}
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 flex flex-col">
          <div>
            <h3 className="font-bold text-white text-base">Department Distribution</h3>
            <p className="text-slate-400 text-xs">Registrations by engineering branch</p>
          </div>

          <div className="h-64 sm:h-72 flex-1">
            {departmentBreakdown.length > 0 ? (
              <Doughnut data={departmentChartData} options={doughnutOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <PieIcon className="w-8 h-8 mb-2 opacity-40" />
                <span>No department data available.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Event Attendance & Institutional Participation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Attendance by Program */}
        <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Program Attendance vs Registration</h3>
              <p className="text-slate-400 text-xs">Comparison of enrolled students against actual present attendees</p>
            </div>
          </div>

          <div className="h-64">
            {eventAttendanceBreakdown.length > 0 ? (
              <Bar data={eventAttendanceChartData} options={chartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <Calendar className="w-8 h-8 mb-2 opacity-40" />
                <span>No program attendance records found.</span>
              </div>
            )}
          </div>
        </div>

        {/* Academic Year & Internal/External Breakdown */}
        <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Cohort &amp; Institutional Breakdown</h3>
              <p className="text-slate-400 text-xs">Student academic year distribution and college quotas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Academic Year Chart */}
            <div className="h-48">
              <Bar data={academicYearChartData} options={chartOptions} />
            </div>

            {/* Category Doughnut */}
            <div className="h-48">
              <Doughnut data={categoryChartData} options={doughnutOptions} />
            </div>
          </div>

          {/* Quick Stats Pill Summary */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">Internal Students:</span>
              <span className="font-bold text-[#F98A5B] font-mono">{categoryBreakdown.internal}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">External Participants:</span>
              <span className="font-bold text-purple-400 font-mono">{categoryBreakdown.external}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
