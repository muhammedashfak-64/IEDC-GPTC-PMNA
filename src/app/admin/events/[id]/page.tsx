'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';
import {
  Calendar,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Trash2,
  Edit3,
  UserPlus,
  Share2,
  Eye,
  RefreshCw,
  Stamp,
  Sliders,
  Archive,
  AlertTriangle,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ProgramWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addToast } = useAdmin();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'participants' | 'leaders' | 'template' | 'certificates'>('attendance');

  // Program / Event State
  const [program, setProgram] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Attendance & Filter States
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'All' | 'Present' | 'Absent'>('All');
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Participant Management States
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantDeptFilter, setParticipantDeptFilter] = useState('All');
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<any>(null);
  const [participantForm, setParticipantForm] = useState({
    studentName: '',
    registerNumber: '',
    email: '',
    phone: '',
    department: 'Computer Engineering',
    academicYear: '2nd Year',
    collegeName: 'Govt Polytechnic College Perinthalmanna'
  });

  // Leader Management States
  const [showAddLeaderModal, setShowAddLeaderModal] = useState(false);
  const [leaderForm, setLeaderForm] = useState({
    name: '',
    role: 'Student Lead',
    department: 'Computer Engineering',
    email: '',
    phone: '',
    certificateEligible: true
  });

  // Certificate Generator States
  const [generating, setGenerating] = useState(false);
  const [generationSummary, setGenerationSummary] = useState<any>(null);
  const [previewCert, setPreviewCert] = useState<any>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Template Config State
  const [templateConfig, setTemplateConfig] = useState({
    nameY: 305,
    nameFontSize: 34,
    nameColor: '#8B0000',
    paraY: 252,
    paraFontSize: 12.5,
    paraMaxWidth: 580,
    paraLineSpacing: 18,
    showCertId: true,
    certIdY: 45
  });

  // Load all program data
  const loadProgramData = async () => {
    setLoading(true);
    try {
      const [evtRes, regRes, ldrRes, certRes] = await Promise.all([
        fetch('/api/admin/events').then((r) => r.json()),
        fetch(`/api/admin/events/${id}/attendance`).then((r) => r.json()),
        fetch(`/api/admin/events/${id}/leaders`).then((r) => r.json()),
        fetch('/api/admin/certificates').then((r) => r.json())
      ]);

      if (evtRes.success) {
        const found = (evtRes.data || []).find((e: any) => e.id === id);
        if (found) {
          setProgram(found);
          if (found.templateConfig) {
            setTemplateConfig((prev) => ({ ...prev, ...found.templateConfig }));
          }
        }
      }

      if (regRes.success) setRegistrations(regRes.data || []);
      if (ldrRes.success) setLeaders(ldrRes.data || []);
      if (certRes.success) {
        const programCerts = (certRes.data || []).filter((c: any) => c.eventId === id);
        setCertificates(programCerts);
      }
    } catch (err: any) {
      console.error(err);
      addToast('Failed loading program workspace data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgramData();
  }, [id]);

  // Attendance Handlers
  const handleToggleAttendance = async (reg: any) => {
    const isCurrentlyPresent = reg.attendance === 'Present' || reg.status === 'Attended';
    const nextAttendance = isCurrentlyPresent ? 'Absent' : 'Present';
    setMarkingId(reg.id);

    try {
      const res = await fetch(`/api/admin/events/${id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: reg.id,
          attendance: nextAttendance
        })
      });
      const json = await res.json();
      if (json.success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === reg.id
              ? {
                  ...r,
                  attendance: nextAttendance,
                  status: nextAttendance === 'Present' ? 'Attended' : 'Confirmed',
                  attendedAt: nextAttendance === 'Present' ? new Date().toISOString() : null
                }
              : r
          )
        );
        addToast(
          `Marked ${reg.studentName} as ${nextAttendance}`,
          nextAttendance === 'Present' ? 'success' : 'info'
        );
      } else {
        addToast(json.error || 'Failed updating attendance', 'error');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setMarkingId(null);
    }
  };

  const handleBulkAttendance = async (attendance: 'Present' | 'Absent') => {
    if (!confirm(`Are you sure you want to mark ALL ${registrations.length} participants as ${attendance}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/events/${id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk: true,
          attendance
        })
      });
      const json = await res.json();
      if (json.success) {
        setRegistrations((prev) =>
          prev.map((r) => ({
            ...r,
            attendance,
            status: attendance === 'Present' ? 'Attended' : 'Confirmed',
            attendedAt: attendance === 'Present' ? new Date().toISOString() : null
          }))
        );
        addToast(`Marked all participants as ${attendance}`, 'success');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  // Add / Edit Participant
  const handleSaveParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingParticipant) {
        // Edit participant details (spelling, phone, dept)
        const res = await fetch('/api/admin/registrations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingParticipant.id,
            status: editingParticipant.status,
            ...participantForm
          })
        });
        const json = await res.json();
        if (json.success) {
          setRegistrations((prev) =>
            prev.map((r) => (r.id === editingParticipant.id ? { ...r, ...participantForm } : r))
          );
          addToast('Participant details updated successfully', 'success');
          setShowAddParticipantModal(false);
          setEditingParticipant(null);
        }
      } else {
        // Add manual participant
        const res = await fetch('/api/public/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: id,
            ...participantForm,
            consent: true
          })
        });
        const json = await res.json();
        if (json.success) {
          setRegistrations((prev) => [json.registration, ...prev]);
          addToast('Participant added successfully', 'success');
          setShowAddParticipantModal(false);
        } else {
          addToast(json.error || 'Failed adding participant', 'error');
        }
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  // Add Leader
  const handleSaveLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/events/${id}/leaders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaderForm)
      });
      const json = await res.json();
      if (json.success) {
        setLeaders((prev) => [json.data, ...prev]);
        setShowAddLeaderModal(false);
        addToast(`Leader ${json.data.name} added successfully`, 'success');
      } else {
        addToast(json.error || 'Failed adding leader', 'error');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleDeleteLeader = async (leaderId: string) => {
    if (!confirm('Are you sure you want to remove this leader?')) return;
    try {
      const res = await fetch(`/api/admin/events/${id}/leaders?id=${leaderId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setLeaders((prev) => prev.filter((l) => l.id !== leaderId));
        addToast('Leader removed', 'info');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  // Generate Certificates
  const handleGenerateCertificates = async (regenerate = false) => {
    setGenerating(true);
    setGenerationSummary(null);

    try {
      const res = await fetch(`/api/admin/events/${id}/certificates/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeLeaders: true,
          regenerateExisting: regenerate
        })
      });

      const json = await res.json();
      if (json.success) {
        setGenerationSummary(json);
        setCertificates(json.certificates || []);
        addToast(
          `Successfully generated ${json.generatedCount} certificates (${json.totalEligibleParticipants} participants, ${json.totalEligibleLeaders} leaders)!`,
          'success'
        );
        loadProgramData();
      } else {
        addToast(json.error || 'Generation failed', 'error');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Publish / Unpublish Certificates
  const handleTogglePublication = async (publish: boolean) => {
    try {
      const res = await fetch(`/api/admin/events/${id}/certificates/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish })
      });
      const json = await res.json();
      if (json.success) {
        setProgram((prev: any) => ({ ...prev, certificateStatus: json.status }));
        setCertificates((prev) => prev.map((c) => ({ ...c, status: json.status })));
        addToast(
          publish
            ? 'Certificates published! Students can now retrieve them on the public portal.'
            : 'Certificates unpublished.',
          'success'
        );
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  // Download ZIP
  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const res = await fetch(`/api/admin/events/${id}/certificates/zip`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to download ZIP file.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificates_${program?.title?.replace(/[^a-zA-Z0-9_-]/g, '_') || id}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast('ZIP download completed!', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setDownloadingZip(false);
    }
  };

  // Export Participants to Excel
  const handleExportExcel = () => {
    const rows = registrations.map((r, i) => ({
      '#': i + 1,
      'Registration ID': r.registrationCode || r.id,
      'Student Name': r.studentName,
      'Admission Number': r.registerNumber,
      Department: r.department,
      'Academic Year': r.academicYear || '',
      Email: r.email,
      'Mobile Number': r.phone,
      Attendance: r.attendance || (r.status === 'Attended' ? 'Present' : 'Absent'),
      'Attended At': r.attendedAt || '',
      'Certificate ID': r.certificateId || '',
      Status: r.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
    XLSX.writeFile(
      workbook,
      `IEDC_${program?.title?.replace(/[^a-zA-Z0-9_-]/g, '_')}_Participants.xlsx`
    );
    addToast('Excel export downloaded', 'success');
  };

  // Export Participants to PDF
  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    doc.setFontSize(16);
    doc.text(`IEDC GPTC PMNA — ${program?.title || 'Program Participants'}`, 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | Total Registrations: ${registrations.length} | Venue: ${program?.venue || 'Campus'}`,
      14,
      22
    );

    const headers = [
      ['#', 'Reg ID', 'Student Name', 'Admission No', 'Department', 'Phone', 'Attendance', 'Cert ID']
    ];
    const data = registrations.map((r, i) => [
      i + 1,
      r.registrationCode || r.id,
      r.studentName,
      r.registerNumber,
      r.department,
      r.phone,
      r.attendance || (r.status === 'Attended' ? 'Present' : 'Absent'),
      r.certificateId || '-'
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [20, 20, 25], textColor: [255, 255, 255] }
    });

    doc.save(`IEDC_${program?.title?.replace(/[^a-zA-Z0-9_-]/g, '_')}_Report.pdf`);
    addToast('PDF report downloaded', 'success');
  };

  // Filtered lists
  const presentCount = registrations.filter(
    (r) => r.attendance === 'Present' || r.status === 'Attended'
  ).length;
  const absentCount = registrations.length - presentCount;

  const filteredAttendanceList = registrations.filter((r) => {
    const isPresent = r.attendance === 'Present' || r.status === 'Attended';
    if (attendanceFilter === 'Present' && !isPresent) return false;
    if (attendanceFilter === 'Absent' && isPresent) return false;

    if (attendanceSearch) {
      const q = attendanceSearch.toLowerCase();
      const matchName = (r.studentName || '').toLowerCase().includes(q);
      const matchReg = (r.registerNumber || '').toLowerCase().includes(q);
      const matchPhone = (r.phone || '').includes(q);
      if (!matchName && !matchReg && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/events"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#F98A5B] uppercase font-bold tracking-wider">
                PROGRAM MANAGEMENT WORKSPACE
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  program?.certificateStatus === 'Published'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                Certs: {program?.certificateStatus || 'Draft'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {program?.title || 'Program Management'}
            </h1>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/register?event=${id}`}
            target="_blank"
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" /> Public Form
          </Link>

          <button
            onClick={() => handleGenerateCertificates(false)}
            disabled={generating}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#F98A5B]/20 hover:opacity-95 transition-all disabled:opacity-50"
          >
            <Award className="w-4 h-4" />
            {generating ? 'Generating...' : 'Generate Certificates'}
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={downloadingZip || certificates.length === 0}
            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {downloadingZip ? 'Zipping...' : 'Download ZIP'}
          </button>
        </div>
      </div>

      {/* Program Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-iedc p-4 rounded-2xl border border-white/10">
          <div className="text-xs text-slate-400">Total Registered</div>
          <div className="text-2xl font-black text-white mt-1">{registrations.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Capacity: {program?.totalSeats || '50'}</div>
        </div>

        <div className="glass-iedc p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="text-xs text-emerald-400 font-bold">Marked Present</div>
          <div className="text-2xl font-black text-emerald-300 mt-1">{presentCount}</div>
          <div className="text-[10px] text-emerald-400/70 mt-1">
            Rate: {registrations.length > 0 ? Math.round((presentCount / registrations.length) * 100) : 0}%
          </div>
        </div>

        <div className="glass-iedc p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <div className="text-xs text-rose-400 font-bold">Marked Absent</div>
          <div className="text-2xl font-black text-rose-300 mt-1">{absentCount}</div>
          <div className="text-[10px] text-rose-400/70 mt-1">Ineligible for Certs</div>
        </div>

        <div className="glass-iedc p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
          <div className="text-xs text-blue-400 font-bold">Generated Certs</div>
          <div className="text-2xl font-black text-blue-300 mt-1">{certificates.length}</div>
          <div className="text-[10px] text-blue-400/70 mt-1">
            Leaders: {leaders.length} eligible
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/10 overflow-x-auto gap-2">
        {[
          { id: 'attendance', label: `Attendance Marking (${presentCount}/${registrations.length})`, icon: CheckCircle2 },
          { id: 'participants', label: `Participants (${registrations.length})`, icon: Users },
          { id: 'leaders', label: `Leaders & Organizers (${leaders.length})`, icon: Award },
          { id: 'template', label: 'Certificate Template', icon: Stamp },
          { id: 'certificates', label: `Certificates (${certificates.length})`, icon: Award },
          { id: 'overview', label: 'Program Settings', icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-[#F98A5B] text-[#F98A5B] bg-[#F98A5B]/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ATTENDANCE MARKING SYSTEM                         */}
      {/* ======================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-iedc p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or reg number..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                />
              </div>

              <div className="flex items-center bg-[#0B0B0D] border border-white/10 rounded-xl p-0.5 text-xs">
                {(['All', 'Present', 'Absent'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setAttendanceFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      attendanceFilter === filter
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAttendance('Present')}
                className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark All Present
              </button>
              <button
                onClick={() => handleBulkAttendance('Absent')}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <XCircle className="w-4 h-4" /> Mark All Absent
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="glass-iedc rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-400 uppercase font-mono tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Participant Name</th>
                    <th className="py-3 px-4">Register Number</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4 text-center w-36">Attendance Status</th>
                    <th className="py-3 px-4 text-center w-36">Mark Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredAttendanceList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No participants match the selected attendance filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendanceList.map((reg, idx) => {
                      const isPresent = reg.attendance === 'Present' || reg.status === 'Attended';
                      return (
                        <tr
                          key={reg.id}
                          className={`hover:bg-white/5 transition-colors ${
                            isPresent ? 'bg-emerald-500/[0.02]' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            {reg.studentName}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {reg.registerNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {reg.department}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {reg.phone}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isPresent
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {isPresent ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> Present
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" /> Absent
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleAttendance(reg)}
                              disabled={markingId === reg.id}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 w-full transition-all ${
                                isPresent
                                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isPresent}
                                readOnly
                                className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
                              />
                              <span>{isPresent ? 'Present' : 'Mark Present'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PARTICIPANTS MANAGEMENT & EXPORTS                */}
      {/* ======================================================== */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-iedc p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or email..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                />
              </div>

              <select
                value={participantDeptFilter}
                onChange={(e) => setParticipantDeptFilter(e.target.value)}
                className="bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="All">All Departments</option>
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Electronics Engineering">Electronics Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" /> Download Excel
              </button>

              <button
                onClick={handleExportPdf}
                className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <FileText className="w-4 h-4" /> Download PDF
              </button>

              <button
                onClick={() => {
                  setEditingParticipant(null);
                  setParticipantForm({
                    studentName: '',
                    registerNumber: '',
                    email: '',
                    phone: '',
                    department: 'Computer Engineering',
                    academicYear: '2nd Year',
                    collegeName: 'Govt Polytechnic College Perinthalmanna'
                  });
                  setShowAddParticipantModal(true);
                }}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#F98A5B]/20"
              >
                <UserPlus className="w-4 h-4" /> Add Participant
              </button>
            </div>
          </div>

          {/* Participant Table */}
          <div className="glass-iedc rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-400 uppercase font-mono tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Reg Code</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4 text-center">Attendance</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {registrations.map((reg, idx) => (
                    <tr key={reg.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-[#F98A5B]">
                        {reg.registrationCode || reg.id}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{reg.studentName}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{reg.registerNumber}</td>
                      <td className="py-3 px-4">{reg.department}</td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-[150px]">{reg.email}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{reg.phone}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            reg.attendance === 'Present' || reg.status === 'Attended'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {reg.attendance || (reg.status === 'Attended' ? 'Present' : 'Absent')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingParticipant(reg);
                            setParticipantForm({
                              studentName: reg.studentName,
                              registerNumber: reg.registerNumber,
                              email: reg.email,
                              phone: reg.phone,
                              department: reg.department,
                              academicYear: reg.academicYear || '2nd Year',
                              collegeName: reg.collegeName || 'Govt Polytechnic College Perinthalmanna'
                            });
                            setShowAddParticipantModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                          title="Edit spelling / phone"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: LEADERS & ORGANIZERS                              */}
      {/* ======================================================== */}
      {activeTab === 'leaders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between glass-iedc p-4 rounded-2xl border border-white/10">
            <div>
              <h2 className="text-sm font-bold text-white">Event Leaders & Organizers</h2>
              <p className="text-xs text-slate-400">
                Add student leads, coordinators, volunteers, and faculty who will receive certificates for this program.
              </p>
            </div>
            <button
              onClick={() => setShowAddLeaderModal(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#F98A5B]/20"
            >
              <UserPlus className="w-4 h-4" /> Add Leader
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaders.map((ldr) => (
              <div
                key={ldr.id}
                className="glass-iedc p-4 rounded-2xl border border-white/10 flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">{ldr.name}</div>
                  <div className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#F98A5B]/15 text-[#F98A5B] border border-[#F98A5B]/30">
                    {ldr.role}
                  </div>
                  <div className="text-xs text-slate-400">{ldr.department}</div>
                  <div className="text-xs font-mono text-slate-500">{ldr.phone || ldr.email}</div>
                  <div className="text-[10px] text-emerald-400 font-bold mt-2">
                    ✓ Certificate Eligible
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteLeader(ldr.id)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                  title="Remove leader"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: CERTIFICATE TEMPLATE & VISUAL DESIGNER            */}
      {/* ======================================================== */}
      {activeTab === 'template' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-iedc p-5 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#F98A5B]" /> Template Visual Configuration
              </h3>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                <span className="font-bold text-white">Master Template: </span>
                Official ADARSH P reference certificate design with vector artwork, border mosaic cubes, signatures, and logos.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  Upload Custom Reference Template (Optional)
                </label>
                <FileUpload
                  label="Certificate Template File"
                  value={program?.certificateTemplateUrl || ''}
                  onChange={(url) => setProgram((p: any) => ({ ...p, certificateTemplateUrl: url }))}
                  folder="certificate-templates"
                  accept="application/pdf,image/png,image/jpeg"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Name Y Position (pt)</label>
                    <input
                      type="number"
                      value={templateConfig.nameY}
                      onChange={(e) => setTemplateConfig({ ...templateConfig, nameY: Number(e.target.value) })}
                      className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Name Font Size (pt)</label>
                    <input
                      type="number"
                      value={templateConfig.nameFontSize}
                      onChange={(e) => setTemplateConfig({ ...templateConfig, nameFontSize: Number(e.target.value) })}
                      className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Paragraph Y Position (pt)</label>
                    <input
                      type="number"
                      value={templateConfig.paraY}
                      onChange={(e) => setTemplateConfig({ ...templateConfig, paraY: Number(e.target.value) })}
                      className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Paragraph Font Size (pt)</label>
                    <input
                      type="number"
                      value={templateConfig.paraFontSize}
                      onChange={(e) => setTemplateConfig({ ...templateConfig, paraFontSize: Number(e.target.value) })}
                      className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Certificate Paragraph Template</label>
                  <textarea
                    rows={3}
                    value={program?.certificateParagraph || ''}
                    onChange={(e) => setProgram({ ...program, certificateParagraph: e.target.value })}
                    className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl p-3 text-xs text-white"
                    placeholder="In recognition of your outstanding participation and dedication in..."
                  />
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/events', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id,
                        templateConfig,
                        certificateParagraph: program.certificateParagraph,
                        certificateTemplateUrl: program.certificateTemplateUrl
                      })
                    });
                    const json = await res.json();
                    if (json.success) addToast('Template settings saved successfully', 'success');
                  } catch (e: any) {
                    addToast(e.message, 'error');
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white font-bold text-xs shadow-md shadow-[#F98A5B]/20"
              >
                Save Template Configuration
              </button>
            </div>
          </div>

          {/* Live Preview Canvas */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Live Certificate Render Preview</span>
              <a
                href="/templates/test_generated_certificate.pdf"
                target="_blank"
                className="text-xs font-bold text-[#F98A5B] hover:underline flex items-center gap-1"
              >
                Open Fullscreen PDF <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="aspect-[1.414/1] w-full rounded-2xl border border-white/15 bg-white/5 overflow-hidden shadow-2xl relative flex items-center justify-center">
              <iframe
                src="/templates/test_generated_certificate.pdf#toolbar=0&navpanes=0&scrollbar=0"
                className="w-full h-full border-0 pointer-events-auto"
                title="Certificate Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: CERTIFICATES & DISTRIBUTION                       */}
      {/* ======================================================== */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-iedc p-5 rounded-2xl border border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white">Certificate Issuance & Distribution</h3>
              <p className="text-xs text-slate-400">
                Generate individual certificates for students who attended and eligible leaders.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleGenerateCertificates(true)}
                disabled={generating}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#F98A5B]/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Generating...' : 'Regenerate All'}
              </button>

              {program?.certificateStatus === 'Published' ? (
                <button
                  onClick={() => handleTogglePublication(false)}
                  className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition-all"
                >
                  Unpublish Certificates
                </button>
              ) : (
                <button
                  onClick={() => handleTogglePublication(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-md"
                >
                  ✓ Publish Certificates to Students
                </button>
              )}

              <button
                onClick={handleDownloadZip}
                disabled={downloadingZip || certificates.length === 0}
                className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloadingZip ? 'Preparing ZIP...' : 'Download All as ZIP'}
              </button>
            </div>
          </div>

          {/* Certificates Table */}
          <div className="glass-iedc rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-400 uppercase font-mono tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Certificate ID</th>
                    <th className="py-3 px-4">Recipient Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Issued Date</th>
                    <th className="py-3 px-4 text-center">Publication Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {certificates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No certificates generated yet. Click &quot;Generate Certificates&quot; to produce PDFs for present participants.
                      </td>
                    </tr>
                  ) : (
                    certificates.map((cert, idx) => (
                      <tr key={cert.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#F98A5B]">
                          {cert.certificateId}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {cert.participantName}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {cert.certificateType}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {cert.issueDate || cert.eventDate}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              cert.status === 'Published'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {cert.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={cert.pdfStorageUrl || `/certificates/${cert.certificateId}.pdf`}
                              target="_blank"
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1 font-mono text-[11px]"
                            >
                              <Eye className="w-3.5 h-3.5" /> PDF
                            </a>
                            <a
                              href={cert.pdfStorageUrl || `/certificates/${cert.certificateId}.pdf`}
                              download={`${cert.participantName}_${cert.certificateId}.pdf`}
                              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: PROGRAM SETTINGS                                  */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="glass-iedc p-6 rounded-2xl border border-white/10 space-y-4 max-w-4xl">
          <h3 className="text-base font-bold text-white">Program Details & Settings</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Program Title</label>
              <input
                type="text"
                value={program?.title || ''}
                onChange={(e) => setProgram({ ...program, title: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Category</label>
              <select
                value={program?.category || 'Workshop'}
                onChange={(e) => setProgram({ ...program, category: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Bootcamp">Bootcamp</option>
                <option value="Competition">Competition</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Training Program">Training Program</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Event Date</label>
              <input
                type="date"
                value={program?.date || ''}
                onChange={(e) => setProgram({ ...program, date: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Venue</label>
              <input
                type="text"
                value={program?.venue || ''}
                onChange={(e) => setProgram({ ...program, venue: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Organizing Body / Cell</label>
              <input
                type="text"
                value={program?.organizingBody || 'the IEDC Cell, Government Polytechnic College Perinthalmanna'}
                onChange={(e) => setProgram({ ...program, organizingBody: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Certificate Heading</label>
              <input
                type="text"
                value={program?.certificateHeading || 'CERTIFICATE OF PARTICIPATION'}
                onChange={(e) => setProgram({ ...program, certificateHeading: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Program Description</label>
            <textarea
              rows={3}
              value={program?.description || ''}
              onChange={(e) => setProgram({ ...program, description: e.target.value })}
              className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl p-3 text-xs text-white"
            />
          </div>

          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/admin/events', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(program)
                });
                const json = await res.json();
                if (json.success) addToast('Program details updated', 'success');
              } catch (e: any) {
                addToast(e.message, 'error');
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white font-bold text-xs shadow-md shadow-[#F98A5B]/20"
          >
            Save Program Details
          </button>
        </div>
      )}

      {/* Add / Edit Participant Modal */}
      {showAddParticipantModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="glass-iedc p-6 rounded-2xl border border-white/10 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingParticipant ? 'Edit Participant Details' : 'Add Participant Manually'}
            </h3>

            <form onSubmit={handleSaveParticipant} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={participantForm.studentName}
                  onChange={(e) => setParticipantForm({ ...participantForm, studentName: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Admission / Reg No</label>
                  <input
                    type="text"
                    required
                    value={participantForm.registerNumber}
                    onChange={(e) => setParticipantForm({ ...participantForm, registerNumber: e.target.value })}
                    className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={participantForm.phone}
                    onChange={(e) => setParticipantForm({ ...participantForm, phone: e.target.value })}
                    className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Department</label>
                <select
                  value={participantForm.department}
                  onChange={(e) => setParticipantForm({ ...participantForm, department: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Electronics Engineering">Electronics Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={participantForm.email}
                  onChange={(e) => setParticipantForm({ ...participantForm, email: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddParticipantModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white text-xs font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Leader Modal */}
      {showAddLeaderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="glass-iedc p-6 rounded-2xl border border-white/10 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">Add Program Leader / Organizer</h3>

            <form onSubmit={handleSaveLeader} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Leader Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Er. Anuroop P"
                  value={leaderForm.name}
                  onChange={(e) => setLeaderForm({ ...leaderForm, name: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Role / Designation</label>
                <select
                  value={leaderForm.role}
                  onChange={(e) => setLeaderForm({ ...leaderForm, role: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Student Lead">Student Lead</option>
                  <option value="Program Coordinator">Program Coordinator</option>
                  <option value="Volunteer">Volunteer</option>
                  <option value="Organizer">Organizer</option>
                  <option value="Speaker">Speaker</option>
                  <option value="Faculty Coordinator">Faculty Coordinator</option>
                  <option value="Principal">Principal</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Engineering"
                  value={leaderForm.department}
                  onChange={(e) => setLeaderForm({ ...leaderForm, department: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Mobile</label>
                  <input
                    type="text"
                    value={leaderForm.phone}
                    onChange={(e) => setLeaderForm({ ...leaderForm, phone: e.target.value })}
                    className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={leaderForm.email}
                    onChange={(e) => setLeaderForm({ ...leaderForm, email: e.target.value })}
                    className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddLeaderModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white text-xs font-bold"
                >
                  Add Leader
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
