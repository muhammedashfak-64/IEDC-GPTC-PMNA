'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '@/context/AdminContext';
import {
  Users,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  FileSpreadsheet,
  FileText,
  Copy,
  Trash2,
  Eye,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building,
  Award
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { isExternalParticipant, isInternalParticipant } from '@/lib/quotaUtils';

export default function AdminRegistrationsPage() {
  const { addToast } = useAdmin();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('All');
  const [selectedGroup, setSelectedGroup] = useState<'All' | 'Internal' | 'External'>('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals & Details
  const [selectedRegistration, setSelectedRegistration] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedList.length && paginatedList.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedList.map((r) => r.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [regRes, evtRes] = await Promise.all([
        fetch('/api/admin/registrations'),
        fetch('/api/admin/events')
      ]);
      const regJson = await regRes.json();
      const evtJson = await evtRes.json();

      if (regJson.success) setRegistrations(regJson.data || []);
      if (evtJson.success) setEvents(evtJson.data || []);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to fetch data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered and Sorted Registrations
  const filteredList = useMemo(() => {
    return registrations
      .filter((r) => {
        const matchesEvent = selectedEventId === 'All' || r.eventId === selectedEventId;
        const matchesDept = selectedDepartment === 'All' || r.department === selectedDepartment;
        const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus;
        const isExt = isExternalParticipant(r);
        const matchesGroup =
          selectedGroup === 'All' ||
          (selectedGroup === 'Internal' && !isExt) ||
          (selectedGroup === 'External' && isExt);
        const matchesYear = selectedYear === 'All' || r.academicYear === selectedYear;
        const matchesSemester = selectedSemester === 'All' || r.semester === selectedSemester;
        const cleanSearch = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !cleanSearch ||
          r.studentName?.toLowerCase().includes(cleanSearch) ||
          r.registerNumber?.toLowerCase().includes(cleanSearch) ||
          r.registrationCode?.toLowerCase().includes(cleanSearch) ||
          r.email?.toLowerCase().includes(cleanSearch) ||
          r.phone?.includes(cleanSearch) ||
          r.collegeName?.toLowerCase().includes(cleanSearch) ||
          r.branch?.toLowerCase().includes(cleanSearch);

        return matchesEvent && matchesDept && matchesStatus && matchesGroup && matchesYear && matchesSemester && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.registeredAt || b.createdAt || 0).getTime() - new Date(a.registeredAt || a.createdAt || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.registeredAt || a.createdAt || 0).getTime() - new Date(b.registeredAt || b.createdAt || 0).getTime();
        }
        return (a.studentName || '').localeCompare(b.studentName || '');
      });
  }, [registrations, selectedEventId, selectedDepartment, selectedStatus, selectedGroup, selectedYear, selectedSemester, searchTerm, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = registrations.length;
    const internalCount = registrations.filter((r) => isInternalParticipant(r)).length;
    const externalCount = registrations.filter((r) => isExternalParticipant(r)).length;
    const confirmed = registrations.filter((r) => r.status === 'Confirmed').length;
    const attended = registrations.filter((r) => r.status === 'Attended').length;
    const cancelled = registrations.filter((r) => r.status === 'Cancelled').length;
    return { total, internalCount, externalCount, confirmed, attended, cancelled };
  }, [registrations]);

  // Paginated View
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));

  // Handle Status Update
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update status.');
      }

      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      if (selectedRegistration && selectedRegistration.id === id) {
        setSelectedRegistration({ ...selectedRegistration, status: newStatus });
      }

      addToast('Status Updated', `Registration marked as ${newStatus}`, 'success');
    } catch (err: any) {
      addToast('Update Failed', err.message, 'error');
    }
  };

  // Handle Delete Registration
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/registrations?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete');

      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      if (selectedRegistration?.id === id) setSelectedRegistration(null);
      addToast('Deleted', 'Registration record removed successfully.', 'success');
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // -------------------------------------------------------------
  // EXCEL EXPORT (.XLSX)
  // -------------------------------------------------------------
  const exportExcel = (mode: 'all' | 'filtered' | 'selected' = 'filtered') => {
    let recordsToExport = filteredList;
    if (mode === 'all') recordsToExport = registrations;
    if (mode === 'selected') {
      recordsToExport = registrations.filter((r) => selectedIds.has(r.id));
      if (recordsToExport.length === 0) {
        addToast('No Selection', 'Please select at least one participant using the checkboxes.', 'warning');
        return;
      }
    }

    if (recordsToExport.length === 0) {
      addToast('No Data', 'No registration records available to export.', 'warning');
      return;
    }

    const eventTitle =
      selectedEventId !== 'All'
        ? events.find((e) => e.id === selectedEventId)?.title || 'Selected_Event'
        : 'All_Events';

    const cleanRows = recordsToExport.map((r, index) => {
      const isOurCollege =
        r.registrationGroup === 'our_college' ||
        (!r.registrationGroup && (!r.collegeName || r.collegeName.toLowerCase().includes('perinthalmanna')));
      return {
        'Sl No': index + 1,
        'Registration ID': r.registrationCode || r.id,
        'Full Name': r.studentName,
        'Registration Group': isOurCollege ? 'GPTC PMNA' : 'Other College',
        'College / Institution': r.collegeName || (isOurCollege ? 'GPTC Perinthalmanna' : 'Other College'),
        'Admission / Reg No': r.registerNumber || 'N/A',
        'Branch / Department': r.branch || r.department || 'N/A',
        'Academic Year': r.academicYear || 'N/A',
        'Semester': r.semester || 'N/A',
        'Email Address': r.email,
        'Mobile Number': r.phone || 'N/A',
        'Program / Event': r.eventTitle || 'Campus Event',
        'Registration Date': r.registeredAt ? new Date(r.registeredAt).toLocaleString('en-IN') : 'N/A',
        'Attendance Status': r.attendance || (r.status === 'Attended' ? 'Present' : 'Not Marked'),
        'Status': r.status || 'Confirmed'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(cleanRows);

    // Set readable column widths
    worksheet['!cols'] = [
      { wch: 8 },  // Sl No
      { wch: 20 }, // Reg ID
      { wch: 24 }, // Name
      { wch: 16 }, // Group
      { wch: 32 }, // College
      { wch: 18 }, // Reg No
      { wch: 25 }, // Dept / Branch
      { wch: 15 }, // Year
      { wch: 12 }, // Semester
      { wch: 28 }, // Email
      { wch: 16 }, // Phone
      { wch: 28 }, // Event
      { wch: 22 }, // Date
      { wch: 18 }, // Attendance
      { wch: 14 }  // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `IEDC_Registrations_${eventTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${mode.toUpperCase()}_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, filename);
    addToast('Excel Exported', `Downloaded ${recordsToExport.length} registrations (${mode}) as genuine .xlsx file.`, 'success');
  };

  // -------------------------------------------------------------
  // CSV EXPORT (.CSV)
  // -------------------------------------------------------------
  const exportCsv = (mode: 'all' | 'filtered' | 'selected' = 'filtered') => {
    let recordsToExport = filteredList;
    if (mode === 'all') recordsToExport = registrations;
    if (mode === 'selected') {
      recordsToExport = registrations.filter((r) => selectedIds.has(r.id));
      if (recordsToExport.length === 0) {
        addToast('No Selection', 'Please select at least one participant using the checkboxes.', 'warning');
        return;
      }
    }

    if (recordsToExport.length === 0) {
      addToast('No Data', 'No registration records available to export.', 'warning');
      return;
    }

    const cleanRows = recordsToExport.map((r, index) => {
      const isOurCollege =
        r.registrationGroup === 'our_college' ||
        (!r.registrationGroup && (!r.collegeName || r.collegeName.toLowerCase().includes('perinthalmanna')));
      return {
        'Sl No': index + 1,
        'Registration ID': r.registrationCode || r.id,
        'Full Name': r.studentName,
        'Registration Group': isOurCollege ? 'GPTC PMNA' : 'Other College',
        'College / Institution': r.collegeName || (isOurCollege ? 'GPTC Perinthalmanna' : 'Other College'),
        'Admission / Reg No': r.registerNumber || 'N/A',
        'Branch / Department': r.branch || r.department || 'N/A',
        'Academic Year': r.academicYear || 'N/A',
        'Semester': r.semester || 'N/A',
        'Email Address': r.email,
        'Mobile Number': r.phone || 'N/A',
        'Program / Event': r.eventTitle || 'Campus Event',
        'Registration Date': r.registeredAt ? new Date(r.registeredAt).toLocaleString('en-IN') : 'N/A',
        'Attendance Status': r.attendance || (r.status === 'Attended' ? 'Present' : 'Not Marked'),
        'Status': r.status || 'Confirmed'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(cleanRows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IEDC_Registrations_${mode.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    addToast('CSV Exported', `Exported ${recordsToExport.length} registrations to genuine CSV.`, 'success');
  };

  // -------------------------------------------------------------
  // PDF EXPORT (.PDF)
  // -------------------------------------------------------------
  const exportPDF = (mode: 'all' | 'filtered' | 'selected' = 'filtered') => {
    let recordsToExport = filteredList;
    if (mode === 'all') recordsToExport = registrations;
    if (mode === 'selected') {
      recordsToExport = registrations.filter((r) => selectedIds.has(r.id));
      if (recordsToExport.length === 0) {
        addToast('No Selection', 'Please select at least one participant using the checkboxes.', 'warning');
        return;
      }
    }

    if (recordsToExport.length === 0) {
      addToast('No Data', 'No registration records available to export.', 'warning');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const eventTitle =
      selectedEventId !== 'All'
        ? events.find((e) => e.id === selectedEventId)?.title || 'All Events'
        : 'All Events & Workshops';

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(20, 20, 20);
    doc.text('IEDC — GOVERNMENT POLYTECHNIC COLLEGE PERINTHALMANNA', 14, 15);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text('Statewide Student Event Registrations & Participant Master Report', 14, 21);

    // Meta details line
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    const dateStr = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Event: ${eventTitle}  |  Department Filter: ${selectedDepartment}  |  Total Count: ${recordsToExport.length}  |  Generated: ${dateStr}`, 14, 27);

    // Draw thin line under header
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 29, 283, 29);

    const tableColumns = [
      'Sl',
      'Reg ID',
      'Participant Name',
      'Group',
      'College / Institution',
      'Branch / Dept',
      'Year/Sem',
      'Mobile No',
      'Status'
    ];

    const tableRows = recordsToExport.map((r, i) => {
      const isOurCollege =
        r.registrationGroup === 'our_college' ||
        (!r.registrationGroup && (!r.collegeName || r.collegeName.toLowerCase().includes('perinthalmanna')));
      const groupLabel = isOurCollege ? 'GPTC PMNA' : 'Other College';
      const collegeDisplay = isOurCollege ? 'GPTC Perinthalmanna' : (r.collegeName || 'Other College');
      const branchDisplay = r.branch || r.department || 'N/A';
      const yearSem = `${r.academicYear || ''} ${r.semester ? `(${r.semester})` : ''}`.trim() || 'N/A';

      return [
        i + 1,
        r.registrationCode || r.id,
        r.studentName,
        groupLabel,
        collegeDisplay,
        branchDisplay,
        yearSem,
        r.phone || 'N/A',
        r.status
      ];
    });

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 32,
      theme: 'striped',
      headStyles: {
        fillColor: [24, 24, 29],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        textColor: [30, 30, 30],
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 24, fontStyle: 'bold' },
        2: { cellWidth: 38, fontStyle: 'bold' },
        3: { cellWidth: 24 },
        4: { cellWidth: 46 },
        5: { cellWidth: 38 },
        6: { cellWidth: 22 },
        7: { cellWidth: 24 },
        8: { cellWidth: 20 }
      },
      didDrawPage: (data) => {
        // Footer: Page Number
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount} — Confidential • IEDC GPTC PMNA`,
          14,
          doc.internal.pageSize.height - 8
        );
      }
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `IEDC_Registrations_${eventTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${timestamp}.pdf`;
    doc.save(filename);
    addToast('PDF Exported', `Generated printable PDF report for ${recordsToExport.length} participants.`, 'success');
  };

  // WhatsApp helper
  const openWhatsApp = (reg: any) => {
    const phone = (reg.phone || '').replace(/\D/g, '');
    if (!phone) {
      addToast('No Phone Number', 'This student has no phone number recorded.', 'warning');
      return;
    }
    const cleanNumber = phone.length === 10 ? `91${phone}` : phone;
    const message = encodeURIComponent(
      `Hello ${reg.studentName},\n\nYour registration for "${reg.eventTitle || 'the campus event'}" at IEDC GPTC Perinthalmanna has been confirmed.\n\nRegistration ID: ${reg.registrationCode || reg.id}\nStatus: ${reg.status}\n\nPlease present this ID at the entry desk.\n\nIEDC GPTC PMNA`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  const copyConfirmationMessage = (reg: any) => {
    const text = `Hello ${reg.studentName},\n\nYour registration for "${reg.eventTitle || 'the campus event'}" at IEDC GPTC Perinthalmanna has been confirmed.\n\nRegistration ID: ${reg.registrationCode || reg.id}\nStatus: ${reg.status}\n\nPlease present this ID at the entry desk.\n\nIEDC GPTC PMNA`;
    navigator.clipboard.writeText(text);
    addToast('Copied to Clipboard', 'WhatsApp confirmation message template copied.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F98A5B] uppercase tracking-widest block mb-1">
            MODULE 05 / REGISTRATION MANAGEMENT
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Event Registrations</h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time participant registry, attendance tracking, and Excel &amp; PDF report generation.
          </p>
        </div>

        {/* Action Buttons: Excel & PDF */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={() => exportExcel('selected')}
              className="px-3 py-2 rounded-xl bg-purple-600/25 hover:bg-purple-600/35 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              title={`Download Excel workbook for ${selectedIds.size} selected records`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
              <span>Export Selected ({selectedIds.size})</span>
            </button>
          )}

          <button
            onClick={() => exportExcel('filtered')}
            className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            title={`Download Excel workbook for ${filteredList.length} filtered records`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Filtered ({filteredList.length})</span>
          </button>

          <button
            onClick={() => exportExcel('all')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title={`Download Excel workbook for all ${registrations.length} registrations`}
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export All ({registrations.length})</span>
          </button>

          <button
            onClick={() => exportCsv(selectedIds.size > 0 ? 'selected' : 'filtered')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download registrations as CSV"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => exportPDF(selectedIds.size > 0 ? 'selected' : 'filtered')}
            className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            title="Download PDF printable report"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>PDF</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F98A5B]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#121216] border border-white/10 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Total Registrations</span>
          <p className="text-2xl font-black text-white">{stats.total}</p>
          <span className="text-[10px] text-slate-500">Across all campus programs</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#121216] border border-white/10 space-y-1">
          <span className="text-[10px] font-mono text-emerald-400 uppercase">Confirmed</span>
          <p className="text-2xl font-black text-emerald-400">{stats.confirmed}</p>
          <span className="text-[10px] text-slate-500">Active seat reservations</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#121216] border border-white/10 space-y-1">
          <span className="text-[10px] font-mono text-blue-400 uppercase">Attended Check-In</span>
          <p className="text-2xl font-black text-blue-400">{stats.attended}</p>
          <span className="text-[10px] text-slate-500">Verified at venue</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#121216] border border-white/10 space-y-1">
          <span className="text-[10px] font-mono text-red-400 uppercase">Cancelled</span>
          <p className="text-2xl font-black text-red-400">{stats.cancelled}</p>
          <span className="text-[10px] text-slate-500">Seats restored</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#121216] border border-white/10 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, register no, email, or phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Event Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none truncate"
            >
              <option value="All">All Events &amp; Workshops</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="All">All Departments</option>
              <option value="Civil Engineering">Civil Engg</option>
              <option value="Mechanical Engineering">Mechanical Engg</option>
              <option value="Electrical and Electronics Engineering">EEE</option>
              <option value="Electronics Engineering">Electronics Engg</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Attended">Attended</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
          <div>
            Showing <span className="font-bold text-white">{filteredList.length}</span> matching registrations
            {filteredList.length !== registrations.length && (
              <span> (filtered from {registrations.length} total)</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value="newest" className="bg-[#18181D]">Newest First</option>
              <option value="oldest" className="bg-[#18181D]">Oldest First</option>
              <option value="name" className="bg-[#18181D]">Student Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="rounded-3xl bg-[#121216] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18181E] border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedList.length > 0 && paginatedList.every((r) => selectedIds.has(r.id))}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-700 text-[#F98A5B] focus:ring-[#F98A5B] bg-[#18181D] cursor-pointer"
                    title="Select all on this page"
                  />
                </th>
                <th className="py-3.5 px-4 font-bold">Pass ID</th>
                <th className="py-3.5 px-4 font-bold">Student Participant</th>
                <th className="py-3.5 px-4 font-bold">Event &amp; Department</th>
                <th className="py-3.5 px-4 font-bold">Contact Info</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {paginatedList.length > 0 ? (
                paginatedList.map((reg) => (
                  <tr
                    key={reg.id}
                    className={`hover:bg-white/[0.02] transition-colors ${selectedIds.has(reg.id) ? 'bg-[#F98A5B]/[0.05]' : ''}`}
                  >
                    <td className="py-4 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(reg.id)}
                        onChange={() => toggleSelectOne(reg.id)}
                        className="rounded border-slate-700 text-[#F98A5B] focus:ring-[#F98A5B] bg-[#18181D] cursor-pointer"
                      />
                    </td>
                    {/* Pass ID */}
                    <td className="py-4 px-4 font-mono text-xs font-bold text-[#F98A5B] whitespace-nowrap">
                      {reg.registrationCode || reg.id}
                    </td>

                    {/* Student Name & Reg No */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{reg.studentName}</span>
                        {reg.registrationGroup === 'other_college' || (reg.collegeName && !reg.collegeName.toLowerCase().includes('perinthalmanna')) ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300">
                            Other College
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#F98A5B]/15 border border-[#F98A5B]/30 text-[#F98A5B]">
                            GPTC PMNA
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {reg.registerNumber || 'No Reg No'} • {reg.academicYear || '2nd Year'} {reg.semester ? `(${reg.semester})` : ''}
                      </div>
                    </td>

                    {/* Event & Department */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-semibold text-white truncate">{reg.eventTitle || 'Campus Event'}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {reg.branch || reg.department || 'N/A'}
                        {reg.collegeName && !reg.collegeName.toLowerCase().includes('perinthalmanna') && (
                          <span className="text-slate-500 block truncate text-[10px]">{reg.collegeName}</span>
                        )}
                      </div>
                    </td>

                    {/* Contact Info & WhatsApp */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-[11px] truncate max-w-[150px]">{reg.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300 mt-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-mono text-[11px]">{reg.phone || 'N/A'}</span>
                        {reg.phone && (
                          <button
                            onClick={() => openWhatsApp(reg)}
                            className="text-emerald-400 hover:text-emerald-300 p-0.5 ml-1"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Status with quick selector */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <select
                        value={reg.status}
                        onChange={(e) => handleStatusChange(reg.id, e.target.value)}
                        className={`text-[10px] font-mono font-bold uppercase rounded-lg px-2.5 py-1 border focus:outline-none ${
                          reg.status === 'Confirmed'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : reg.status === 'Attended'
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                            : reg.status === 'Cancelled'
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}
                      >
                        <option value="Confirmed" className="bg-[#18181D] text-white">Confirmed</option>
                        <option value="Attended" className="bg-[#18181D] text-white">Attended</option>
                        <option value="Pending" className="bg-[#18181D] text-white">Pending</option>
                        <option value="Cancelled" className="bg-[#18181D] text-white">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRegistration(reg)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="View Full Registration Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyConfirmationMessage(reg)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#F98A5B] hover:text-white transition-colors cursor-pointer"
                          title="Copy WhatsApp Message"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(reg.id)}
                          disabled={deletingId === reg.id}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                          title="Delete Registration"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">No registrations found matching your criteria</p>
                    <p className="text-xs mt-1">Try resetting the search keyword or selecting &quot;All Events&quot;.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page <span className="font-bold text-white">{currentPage}</span> of{' '}
              <span className="font-bold text-white">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedRegistration && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-[#121216] p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#F98A5B] uppercase block">
                  PARTICIPANT DETAILS
                </span>
                <h3 className="text-xl font-black text-white">{selectedRegistration.studentName}</h3>
              </div>
              <button
                onClick={() => setSelectedRegistration(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">REGISTRATION ID</span>
                  <p className="text-lg font-mono font-black text-[#F98A5B]">
                    {selectedRegistration.registrationCode || selectedRegistration.id}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-white">
                  {selectedRegistration.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-500 block text-[10px] font-mono">REGISTRATION GROUP</span>
                  <span className="font-bold text-[#F98A5B]">
                    {selectedRegistration.registrationGroup === 'other_college' || (selectedRegistration.collegeName && !selectedRegistration.collegeName.toLowerCase().includes('perinthalmanna'))
                      ? 'Other College'
                      : 'GPTC PMNA'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-mono">ADMISSION / REG NO</span>
                  <span className="font-bold text-white">{selectedRegistration.registerNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-mono">BRANCH / DEPARTMENT</span>
                  <span className="text-white">{selectedRegistration.branch || selectedRegistration.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-mono">ACADEMIC YEAR &amp; SEM</span>
                  <span className="text-white">
                    {selectedRegistration.academicYear || 'N/A'} {selectedRegistration.semester ? `(${selectedRegistration.semester})` : ''}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px] font-mono">COLLEGE / INSTITUTION</span>
                  <span className="text-white truncate block">
                    {selectedRegistration.collegeName || 'Government Polytechnic College Perinthalmanna'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-mono">EMAIL</span>
                  <span className="text-white truncate block">{selectedRegistration.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-mono">MOBILE / WHATSAPP</span>
                  <span className="text-white font-mono">{selectedRegistration.phone || 'N/A'}</span>
                </div>
              </div>

              {selectedRegistration.additionalNotes && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 mt-2">
                  <span className="text-slate-400 block text-[10px] font-mono">STUDENT NOTES &amp; QUESTIONS:</span>
                  <p className="text-slate-200 text-xs mt-1">{selectedRegistration.additionalNotes}</p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => openWhatsApp(selectedRegistration)}
                className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chat on WhatsApp</span>
              </button>

              <button
                onClick={() => copyConfirmationMessage(selectedRegistration)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-[#F98A5B]" />
                <span>Copy Message</span>
              </button>

              <button
                onClick={() => setSelectedRegistration(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
