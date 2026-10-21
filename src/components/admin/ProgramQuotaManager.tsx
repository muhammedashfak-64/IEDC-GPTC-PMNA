'use client';

import React, { useState, useEffect } from 'react';
import {
  COLLEGE_DEPARTMENTS,
  COLLEGE_ACADEMIC_YEARS,
  ProgramParticipationType,
  ProgramQuotaConfig,
  EventQuotaSummary,
  ClassQuotaItem,
  ReallocationAuditEntry
} from '@/types/quotas';
import {
  getClassKey,
  parseClassKey,
  normalizeDepartment,
  normalizeAcademicYear
} from '@/lib/quotaUtils';
import {
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Sparkles,
  Sliders,
  Calendar,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  UserCheck,
  ShieldAlert,
  Save,
  RefreshCw,
  Globe,
  School,
  Lock,
  Unlock,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProgramQuotaManagerProps {
  eventId: string;
  eventTitle: string;
  eventLevel: string;
  addToast: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onRefreshAll?: () => void;
}

export default function ProgramQuotaManager({
  eventId,
  eventTitle,
  eventLevel,
  addToast,
  onRefreshAll
}: ProgramQuotaManagerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quotaConfig, setQuotaConfig] = useState<ProgramQuotaConfig | null>(null);
  const [summary, setSummary] = useState<EventQuotaSummary | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);

  // Reallocation State
  const [showReallocateModal, setShowReallocateModal] = useState(false);
  const [reallocating, setReallocating] = useState(false);
  const [reallocForm, setReallocForm] = useState({
    sourceKey: '',
    destKey: '',
    seats: 1,
    reason: ''
  });

  // Bulk Edit States
  const [bulkSeats, setBulkSeats] = useState(5);
  const [bulkDept, setBulkDept] = useState<string>(COLLEGE_DEPARTMENTS[0]);
  const [bulkDeptSeats, setBulkDeptSeats] = useState(5);
  const [bulkYear, setBulkYear] = useState<string>(COLLEGE_ACADEMIC_YEARS[0]);
  const [bulkYearSeats, setBulkYearSeats] = useState(5);

  // Promotion State
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const fetchQuotaDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/quotas`);
      const data = await res.json();
      if (data.success) {
        setQuotaConfig(data.quotaConfig);
        setSummary(data.summary);
        setRegistrations(data.registrations || []);
      } else {
        addToast('Failed to load quota settings', data.error || 'Server error', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotaDetails();
  }, [eventId]);

  if (loading || !quotaConfig || !summary) {
    return (
      <div className="glass-iedc p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[300px]">
        <RefreshCw className="w-8 h-8 text-[#F98A5B] animate-spin mb-3" />
        <p className="text-slate-400 text-sm">Loading Registration Quotas & Seat Allocations...</p>
      </div>
    );
  }

  // Handle Participation Type Switch
  const handleTypeChange = (newType: ProgramParticipationType) => {
    setQuotaConfig((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, participationType: newType };
      if (newType === 'Statewide') {
        updated.externalQuota = {
          ...updated.externalQuota,
          enabled: true,
          maxSeats: updated.externalQuota.maxSeats || 30
        };
      }
      return updated;
    });
  };

  // Handle Single Class Change
  const handleSingleClassChange = (field: string, val: any) => {
    setQuotaConfig((prev) => {
      if (!prev) return prev;
      const cur = prev.singleClass || {
        department: 'Mechanical Engineering',
        academicYear: 'Second Year',
        maxSeats: 25
      };
      return {
        ...prev,
        singleClass: {
          ...cur,
          [field]: field === 'maxSeats' ? Math.max(0, parseInt(val) || 0) : val
        }
      };
    });
  };

  // Handle Cell Change in 12-Class Matrix
  const handleCellChange = (key: string, field: 'enabled' | 'maxSeats', val: any) => {
    setQuotaConfig((prev) => {
      if (!prev) return prev;
      const curItem = prev.classes[key] || {
        department: parseClassKey(key).department,
        academicYear: parseClassKey(key).academicYear,
        enabled: true,
        maxSeats: 5
      };

      return {
        ...prev,
        classes: {
          ...prev.classes,
          [key]: {
            ...curItem,
            [field]: field === 'maxSeats' ? Math.max(0, parseInt(val) || 0) : Boolean(val)
          }
        }
      };
    });
  };

  // Bulk Apply Functions
  const applyAllEnabledSeats = () => {
    setQuotaConfig((prev) => {
      if (!prev) return prev;
      const newClasses = { ...prev.classes };
      for (const key of Object.keys(newClasses)) {
        if (newClasses[key].enabled) {
          newClasses[key] = { ...newClasses[key], maxSeats: Math.max(0, bulkSeats) };
        }
      }
      return { ...prev, classes: newClasses };
    });
    addToast('Bulk Quota Updated', `Set all enabled classes to ${bulkSeats} seats`, 'success');
  };

  const applyDeptSeats = () => {
    setQuotaConfig((prev) => {
      if (!prev) return prev;
      const newClasses = { ...prev.classes };
      for (const yr of COLLEGE_ACADEMIC_YEARS) {
        const key = getClassKey(bulkDept, yr);
        if (newClasses[key]) {
          newClasses[key] = {
            ...newClasses[key],
            enabled: true,
            maxSeats: Math.max(0, bulkDeptSeats)
          };
        }
      }
      return { ...prev, classes: newClasses };
    });
    addToast('Department Quota Updated', `Set ${bulkDept} to ${bulkDeptSeats} seats per year`, 'success');
  };

  const applyYearSeats = () => {
    setQuotaConfig((prev) => {
      if (!prev) return prev;
      const newClasses = { ...prev.classes };
      for (const dept of COLLEGE_DEPARTMENTS) {
        const key = getClassKey(dept, bulkYear);
        if (newClasses[key]) {
          newClasses[key] = {
            ...newClasses[key],
            enabled: true,
            maxSeats: Math.max(0, bulkYearSeats)
          };
        }
      }
      return { ...prev, classes: newClasses };
    });
    addToast('Year Quota Updated', `Set all ${bulkYear} classes to ${bulkYearSeats} seats`, 'success');
  };

  const toggleAllClasses = (enable: boolean) => {
    setQuotaConfig((prev) => {
      if (!prev) return prev;
      const newClasses = { ...prev.classes };
      for (const key of Object.keys(newClasses)) {
        newClasses[key] = { ...newClasses[key], enabled: enable };
      }
      return { ...prev, classes: newClasses };
    });
    addToast(enable ? 'Enabled All Classes' : 'Disabled All Classes', 'Updated class toggles', 'success');
  };

  // Save Quotas to Backend
  const handleSaveQuotas = async (force = false) => {
    if (!quotaConfig) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/quotas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotaConfig, force })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuotaConfig(data.quotaConfig);
        setSummary(data.summary);
        addToast('Quotas Saved Successfully', 'Program seat allocations updated', 'success');
        if (onRefreshAll) onRefreshAll();
      } else {
        addToast('Save Failed', data.error || 'Could not save quota configuration', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Execute Reallocation
  const handleReallocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reallocForm.sourceKey || !reallocForm.destKey || reallocForm.seats <= 0) {
      addToast('Invalid Input', 'Please select source, destination, and seats.', 'error');
      return;
    }

    setReallocating(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/quotas/reallocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reallocForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Seats Reallocated', `Transferred ${reallocForm.seats} seats successfully!`, 'success');
        setShowReallocateModal(false);
        setReallocForm({ sourceKey: '', destKey: '', seats: 1, reason: '' });
        fetchQuotaDetails();
        if (onRefreshAll) onRefreshAll();
      } else {
        addToast('Reallocation Failed', data.error || 'Server error', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setReallocating(false);
    }
  };

  // Promote Waitlisted Student
  const handlePromote = async (regId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to promote ${studentName} to a Confirmed seat?`)) return;
    setPromotingId(regId);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/quotas/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: regId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Student Promoted', `${studentName} has been confirmed!`, 'success');
        fetchQuotaDetails();
        if (onRefreshAll) onRefreshAll();
      } else {
        addToast('Promotion Failed', data.error || 'No seats available', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setPromotingId(null);
    }
  };

  // Exports
  const handleExportQuotaExcel = () => {
    const rows: any[] = [];
    for (const [key, stat] of Object.entries(summary.classes)) {
      rows.push({
        Department: stat.department,
        'Academic Year': stat.academicYear,
        Status: stat.status,
        Enabled: stat.enabled ? 'Yes' : 'No',
        'Allocated Seats': stat.maxSeats,
        'Confirmed Registrations': stat.confirmedCount,
        'Remaining Seats': stat.remainingSeats,
        'Waitlisted Count': stat.waitlistCount
      });
    }

    if (summary.isStatewide) {
      rows.push({
        Department: 'Other Colleges (Statewide)',
        'Academic Year': 'All Years Combined',
        Status: summary.externalQuota.status,
        Enabled: summary.externalQuota.enabled ? 'Yes' : 'No',
        'Allocated Seats': summary.externalQuota.maxSeats,
        'Confirmed Registrations': summary.externalQuota.confirmedCount,
        'Remaining Seats': summary.externalQuota.remainingSeats,
        'Waitlisted Count': summary.externalQuota.waitlistCount
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quota Utilization');
    XLSX.writeFile(wb, `Quota_Utilization_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    addToast('Excel Exported', 'Quota report downloaded', 'success');
  };

  const handleExportWaitlistExcel = () => {
    const waitlistRegs = registrations.filter((r) => r.status === 'Waitlisted');
    if (waitlistRegs.length === 0) {
      addToast('No Waitlisted Records', 'The waiting list is currently empty.', 'info');
      return;
    }
    const rows = waitlistRegs.map((r, i) => ({
      'Waitlist #': r.waitlistPosition || i + 1,
      'Registration Code': r.registrationCode || r.id,
      'Student Name': r.studentName,
      Department: r.department,
      'Academic Year': r.academicYear,
      'College Name': r.collegeName,
      Phone: r.phone,
      Email: r.email,
      'Registered At': r.registeredAt
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Waiting List');
    XLSX.writeFile(wb, `Waitlist_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    addToast('Excel Exported', 'Waiting list downloaded', 'success');
  };

  // Reallocation options calculation
  const getTransferSourceOptions = () => {
    const options: { key: string; label: string; available: number }[] = [];
    for (const [key, stat] of Object.entries(summary.classes)) {
      if (stat.enabled && stat.remainingSeats > 0) {
        options.push({
          key,
          label: `${stat.department} (${stat.academicYear}) — ${stat.remainingSeats} unused seats`,
          available: stat.remainingSeats
        });
      }
    }
    if (summary.isStatewide && summary.externalQuota.remainingSeats > 0) {
      options.push({
        key: 'External',
        label: `Other Colleges (External Pool) — ${summary.externalQuota.remainingSeats} unused seats`,
        available: summary.externalQuota.remainingSeats
      });
    }
    return options;
  };

  const getTransferDestOptions = () => {
    const options: { key: string; label: string }[] = [];
    for (const [key, stat] of Object.entries(summary.classes)) {
      options.push({
        key,
        label: `${stat.department} (${stat.academicYear}) [Current: ${stat.maxSeats}]`
      });
    }
    if (summary.isStatewide) {
      options.push({
        key: 'External',
        label: `Other Colleges (External Pool) [Current: ${summary.externalQuota.maxSeats}]`
      });
    }
    return options;
  };

  const waitlistRegistrations = registrations.filter((r) => r.status === 'Waitlisted');

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. TOP LIVE QUOTA OVERVIEW STATS (SECTION 10)                 */}
      {/* ============================================================== */}
      <div className="glass-iedc p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-bold text-[#F98A5B] tracking-wider uppercase flex items-center gap-2">
              <Layers className="w-4 h-4" /> Live Seat Allocation & Quota Utilization
            </div>
            <h2 className="text-lg font-black text-white mt-1">
              {eventTitle} <span className="text-xs font-normal text-slate-400">({quotaConfig.participationType})</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportQuotaExcel()}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export Quota
            </button>
            <button
              onClick={() => setShowReallocateModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> Reallocate Seats
            </button>
            <button
              onClick={() => handleSaveQuotas()}
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-[#F98A5B] hover:bg-[#ff9c73] text-black font-black text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-[#F98A5B]/20 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Quotas'}
            </button>
          </div>
        </div>

        {/* 8 Live Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="glass-iedc p-3 rounded-xl border border-white/10 bg-white/5">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Total Internal</div>
            <div className="text-xl font-black text-white mt-0.5">{summary.totalInternalSeats}</div>
            <div className="text-[9px] text-slate-500">College Quota</div>
          </div>

          <div className="glass-iedc p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="text-[10px] text-emerald-400 font-bold uppercase">Internal Conf.</div>
            <div className="text-xl font-black text-emerald-300 mt-0.5">{summary.internalConfirmed}</div>
            <div className="text-[9px] text-emerald-400/70">Occupied</div>
          </div>

          <div className="glass-iedc p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
            <div className="text-[10px] text-blue-400 font-bold uppercase">Internal Rem.</div>
            <div className="text-xl font-black text-blue-300 mt-0.5">{summary.internalRemaining}</div>
            <div className="text-[9px] text-blue-400/70">Seats Open</div>
          </div>

          {summary.isStatewide && (
            <>
              <div className="glass-iedc p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
                <div className="text-[10px] text-purple-400 font-bold uppercase">External Quota</div>
                <div className="text-xl font-black text-purple-300 mt-0.5">{summary.totalExternalSeats}</div>
                <div className="text-[9px] text-purple-400/70">Other Colleges</div>
              </div>

              <div className="glass-iedc p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="text-[10px] text-emerald-400 font-bold uppercase">External Conf.</div>
                <div className="text-xl font-black text-emerald-300 mt-0.5">{summary.externalConfirmed}</div>
                <div className="text-[9px] text-emerald-400/70">Occupied</div>
              </div>

              <div className="glass-iedc p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
                <div className="text-[10px] text-purple-400 font-bold uppercase">External Rem.</div>
                <div className="text-xl font-black text-purple-300 mt-0.5">{summary.externalRemaining}</div>
                <div className="text-[9px] text-purple-400/70">Seats Open</div>
              </div>
            </>
          )}

          <div className="glass-iedc p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <div className="text-[10px] text-amber-400 font-bold uppercase">Waiting List</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">{summary.waitlistCount}</div>
            <div className="text-[9px] text-amber-400/70">In Queue</div>
          </div>

          <div className="glass-iedc p-3 rounded-xl border border-white/10 bg-white/5">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Total Registrations</div>
            <div className="text-xl font-black text-white mt-0.5">{summary.totalConfirmed + summary.waitlistCount}</div>
            <div className="text-[9px] text-slate-500">Cap: {summary.totalCapacity}</div>
          </div>
        </div>

        {/* Global Capacity Progress Bar */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-bold">
            <span>Overall Capacity Utilization</span>
            <span>
              {summary.totalConfirmed} / {summary.totalCapacity} Seats ({summary.totalCapacity > 0 ? Math.round((summary.totalConfirmed / summary.totalCapacity) * 100) : 0}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-emerald-500 to-[#F98A5B] h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${summary.totalCapacity > 0 ? Math.min(100, Math.round((summary.totalConfirmed / summary.totalCapacity) * 100)) : 0}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. PROGRAM PARTICIPATION TYPE SELECTOR (SECTION 2)            */}
      {/* ============================================================== */}
      <div className="glass-iedc p-5 rounded-2xl border border-white/10 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#F98A5B]" /> Program Participation Type
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Choose how participants are permitted to register. Changing the type applies eligibility rules immediately on the server.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(
            [
              {
                id: 'Single Class',
                title: '1. Single Class',
                desc: 'Open exclusively to 1 chosen class. All other 11 classes locked.'
              },
              {
                id: 'Selected Classes',
                title: '2. Selected Classes',
                desc: 'Enable selected classes from the 12-class matrix.'
              },
              {
                id: 'Entire College',
                title: '3. Entire College',
                desc: 'All 4 departments and 3 academic years with independent quotas.'
              },
              {
                id: 'Statewide',
                title: '4. Statewide',
                desc: 'GPTC PMNA 12 classes + shared external college pool.'
              },
              {
                id: 'Custom Allocation',
                title: '5. Custom Allocation',
                desc: 'Granular custom quota rules per class and category.'
              }
            ] as const
          ).map((item) => {
            const isSelected = quotaConfig.participationType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTypeChange(item.id)}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-[#F98A5B] bg-[#F98A5B]/10 shadow-lg shadow-[#F98A5B]/5'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className={`text-xs font-black ${isSelected ? 'text-[#F98A5B]' : 'text-white'}`}>
                  {item.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MODE: SINGLE CLASS (SECTION 3)                              */}
      {/* ============================================================== */}
      {quotaConfig.participationType === 'Single Class' && (
        <div className="glass-iedc p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-300">Single Class Exclusive Enrollment</h3>
          </div>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            When active, only students from this specific department and academic year will be permitted to register.
            Any registration attempt from other classes will be rejected server-side.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Target Department</label>
              <select
                value={quotaConfig.singleClass?.department || 'Mechanical Engineering'}
                onChange={(e) => handleSingleClassChange('department', e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
              >
                {COLLEGE_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Academic Year</label>
              <select
                value={quotaConfig.singleClass?.academicYear || 'Second Year'}
                onChange={(e) => handleSingleClassChange('academicYear', e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
              >
                {COLLEGE_ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Maximum Seats</label>
              <input
                type="number"
                min="1"
                value={quotaConfig.singleClass?.maxSeats || 25}
                onChange={(e) => handleSingleClassChange('maxSeats', e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. 12-CLASS QUOTA MATRIX TABLE (SECTIONS 4, 5, 6)             */}
      {/* ============================================================== */}
      {quotaConfig.participationType !== 'Single Class' && (
        <div className="glass-iedc p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <School className="w-4 h-4 text-[#F98A5B]" />
                {quotaConfig.participationType === 'Statewide'
                  ? 'Section A: Our College — GPTC Perinthalmanna (12 Classes)'
                  : 'College Class-Wise Seat Quotas (12 Combinations)'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure participation toggles, seat limits, and view live occupancy for every department and year.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleAllClasses(true)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
              >
                Enable All
              </button>
              <button
                type="button"
                onClick={() => toggleAllClasses(false)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
              >
                Disable All
              </button>
            </div>
          </div>

          {/* Bulk Configuration Tools */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F98A5B]" /> Quick Bulk Allocation Tools
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tool 1: Common Seats */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={bulkSeats}
                  onChange={(e) => setBulkSeats(parseInt(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-xs text-white text-center"
                />
                <button
                  type="button"
                  onClick={applyAllEnabledSeats}
                  className="flex-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all whitespace-nowrap"
                >
                  Apply to All Enabled Classes
                </button>
              </div>

              {/* Tool 2: By Department */}
              <div className="flex items-center gap-2">
                <select
                  value={bulkDept}
                  onChange={(e) => setBulkDept(e.target.value)}
                  className="w-32 bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-[11px] text-white"
                >
                  {COLLEGE_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d.split(' ')[0]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  value={bulkDeptSeats}
                  onChange={(e) => setBulkDeptSeats(parseInt(e.target.value) || 0)}
                  className="w-14 bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-xs text-white text-center"
                />
                <button
                  type="button"
                  onClick={applyDeptSeats}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all"
                >
                  Set Dept
                </button>
              </div>

              {/* Tool 3: By Academic Year */}
              <div className="flex items-center gap-2">
                <select
                  value={bulkYear}
                  onChange={(e) => setBulkYear(e.target.value)}
                  className="w-28 bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-[11px] text-white"
                >
                  {COLLEGE_ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  value={bulkYearSeats}
                  onChange={(e) => setBulkYearSeats(parseInt(e.target.value) || 0)}
                  className="w-14 bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-xs text-white text-center"
                />
                <button
                  type="button"
                  onClick={applyYearSeats}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all"
                >
                  Set Year
                </button>
              </div>
            </div>
          </div>

          {/* 12-Class Matrix Interactive Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 bg-white/5 uppercase">
                  <th className="p-3 w-64">Department</th>
                  {COLLEGE_ACADEMIC_YEARS.map((yr) => (
                    <th key={yr} className="p-3 text-center min-w-[200px]">
                      {yr}
                    </th>
                  ))}
                  <th className="p-3 text-center">Total Dept</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COLLEGE_DEPARTMENTS.map((dept) => {
                  let deptTotalAlloc = 0;
                  let deptTotalConf = 0;

                  return (
                    <tr key={dept} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-bold text-white">
                        <div className="text-sm">{dept}</div>
                        <div className="text-[10px] text-slate-500 font-normal">3 Academic Years</div>
                      </td>

                      {COLLEGE_ACADEMIC_YEARS.map((yr) => {
                        const key = getClassKey(dept, yr);
                        const conf = quotaConfig.classes?.[key] || {
                          department: dept,
                          academicYear: yr,
                          enabled: true,
                          maxSeats: 5
                        };
                        const stat = summary.classes?.[key];
                        const confirmed = stat?.confirmedCount || 0;
                        const remaining = stat?.remainingSeats || 0;
                        const isWarning = stat?.isWarning || false;

                        if (conf.enabled) {
                          deptTotalAlloc += Number(conf.maxSeats) || 0;
                          deptTotalConf += confirmed;
                        }

                        return (
                          <td key={yr} className="p-3">
                            <div
                              className={`p-3 rounded-xl border transition-all ${
                                !conf.enabled
                                  ? 'bg-slate-900/40 border-white/5 opacity-60'
                                  : isWarning
                                  ? 'bg-rose-500/10 border-rose-500/40'
                                  : 'bg-white/5 border-white/10'
                              }`}
                            >
                              {/* Enable Checkbox + Status */}
                              <div className="flex items-center justify-between gap-1 mb-2">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={conf.enabled}
                                    onChange={(e) => handleCellChange(key, 'enabled', e.target.checked)}
                                    className="rounded border-white/20 text-[#F98A5B] focus:ring-0"
                                  />
                                  <span className="text-[11px] font-bold text-slate-300">
                                    {conf.enabled ? 'Participating' : 'Disabled'}
                                  </span>
                                </label>

                                {stat && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                      stat.status === 'OPEN'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : stat.status === 'LIMITED'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : stat.status === 'WAITLIST_AVAILABLE'
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : stat.status === 'FULL'
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                        : 'bg-slate-800 text-slate-400 border border-white/5'
                                    }`}
                                  >
                                    {stat.status.replace('_', ' ')}
                                  </span>
                                )}
                              </div>

                              {/* Quota Seat Limit Input */}
                              <div className="flex items-center gap-2">
                                <div className="text-[10px] text-slate-400 font-bold">Limit:</div>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!conf.enabled}
                                  value={conf.maxSeats}
                                  onChange={(e) => handleCellChange(key, 'maxSeats', e.target.value)}
                                  className={`w-20 bg-slate-900 border rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none ${
                                    isWarning
                                      ? 'border-rose-500 text-rose-300'
                                      : 'border-white/15 focus:border-[#F98A5B]'
                                  } disabled:opacity-40`}
                                />
                                <div className="text-[10px] text-slate-400">seats</div>
                              </div>

                              {/* Confirmed & Remaining Indicators */}
                              {conf.enabled && (
                                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                                  <span className="text-emerald-400 font-bold">Confirmed: {confirmed}</span>
                                  <span className="text-blue-400 font-bold">Remaining: {remaining}</span>
                                </div>
                              )}

                              {/* Warning Banner */}
                              {isWarning && (
                                <div className="mt-1.5 text-[9px] text-rose-400 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                  Limit ({conf.maxSeats}) below confirmed ({confirmed})!
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Total Dept Summary */}
                      <td className="p-3 text-center">
                        <div className="font-black text-white text-base">{deptTotalAlloc}</div>
                        <div className="text-[10px] text-emerald-400 font-bold">Confirmed: {deptTotalConf}</div>
                        <div className="text-[10px] text-blue-400">
                          Remaining: {Math.max(0, deptTotalAlloc - deptTotalConf)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. STATEWIDE SECTION B: OTHER COLLEGES (SECTION 6)            */}
      {/* ============================================================== */}
      {quotaConfig.participationType === 'Statewide' && (
        <div className="glass-iedc p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-4">
            <div>
              <div className="text-xs font-bold text-purple-400 tracking-wider uppercase flex items-center gap-2">
                <Globe className="w-4 h-4" /> Section B: Other Colleges (Shared External Quota)
              </div>
              <h3 className="text-sm font-bold text-white mt-1">
                Statewide External College Capacity Pool
              </h3>
              <p className="text-xs text-purple-200/80 mt-1">
                A single shared seat limit applied across all outside colleges. Once this quota is reached, no further external registrations are accepted.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-slate-900/60 px-3 py-1.5 rounded-xl border border-purple-500/30">
              <input
                type="checkbox"
                checked={quotaConfig.externalQuota?.enabled !== false}
                onChange={(e) =>
                  setQuotaConfig((prev) =>
                    prev
                      ? {
                          ...prev,
                          externalQuota: {
                            ...prev.externalQuota,
                            enabled: e.target.checked
                          }
                        }
                      : prev
                  )
                }
                className="rounded border-white/20 text-purple-500 focus:ring-0"
              />
              <span className="text-xs font-bold text-white">External Participation Enabled</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Shared Seat Limit (All Other Colleges)
              </label>
              <input
                type="number"
                min="0"
                value={quotaConfig.externalQuota?.maxSeats || 30}
                onChange={(e) =>
                  setQuotaConfig((prev) =>
                    prev
                      ? {
                          ...prev,
                          externalQuota: {
                            ...prev.externalQuota,
                            maxSeats: Math.max(0, parseInt(e.target.value) || 0)
                          }
                        }
                      : prev
                  )
                }
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Confirmed External</div>
              <div className="text-xl font-black text-emerald-400 mt-1">
                {summary.externalQuota.confirmedCount}
              </div>
              <div className="text-[10px] text-slate-500">From other institutions</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Remaining External</div>
              <div className="text-xl font-black text-blue-400 mt-1">
                {summary.externalQuota.remainingSeats}
              </div>
              <div className="text-[10px] text-slate-500">Seats remaining in pool</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex flex-col justify-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Status</div>
              <div>
                <span
                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                    summary.externalQuota.status === 'OPEN'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : summary.externalQuota.status === 'LIMITED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : summary.externalQuota.status === 'WAITLIST_AVAILABLE'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {summary.externalQuota.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. WAITING LIST MANAGEMENT (SECTION 9)                         */}
      {/* ============================================================== */}
      <div className="glass-iedc p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400" /> Program Waiting List ({waitlistRegistrations.length})
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              When enabled, eligible students can join the waiting list when their class or category quota is full.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10">
              <input
                type="checkbox"
                checked={quotaConfig.waitlistEnabled !== false}
                onChange={(e) =>
                  setQuotaConfig((prev) =>
                    prev ? { ...prev, waitlistEnabled: e.target.checked } : prev
                  )
                }
                className="rounded border-white/20 text-amber-500 focus:ring-0"
              />
              <span className="text-xs font-bold text-slate-300">Waitlist Enabled</span>
            </label>

            {waitlistRegistrations.length > 0 && (
              <button
                type="button"
                onClick={handleExportWaitlistExcel}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" /> Export Waitlist
              </button>
            )}
          </div>
        </div>

        {waitlistRegistrations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs border border-white/5 rounded-xl bg-white/[0.01]">
            No students are currently in the waiting list.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 bg-white/5 uppercase">
                  <th className="p-3 text-center">Queue #</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Institution</th>
                  <th className="p-3">Dept & Year</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Joined Queue</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {waitlistRegistrations.map((r, i) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black border border-amber-500/30">
                        #{r.waitlistPosition || i + 1}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">
                      <div>{r.studentName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{r.registrationCode}</div>
                    </td>
                    <td className="p-3 text-slate-300">{r.collegeName}</td>
                    <td className="p-3 text-slate-300">
                      {r.department} <span className="text-slate-500">({r.academicYear})</span>
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{r.phone}</td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(r.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handlePromote(r.id, r.studentName)}
                        disabled={promotingId === r.id}
                        className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-all disabled:opacity-50"
                      >
                        {promotingId === r.id ? 'Promoting...' : 'Promote to Confirmed'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 7. REGISTRATION DEADLINES & DATES                             */}
      {/* ============================================================== */}
      <div className="glass-iedc p-5 rounded-2xl border border-white/10 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#F98A5B]" /> Registration Schedule & Deadlines (IST / Asia/Kolkata)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Specify opening and closing timestamps. Once closed, the public form blocks new submissions automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Registration Opening Date & Time
            </label>
            <input
              type="datetime-local"
              value={
                quotaConfig.registrationStartDate
                  ? new Date(quotaConfig.registrationStartDate).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) =>
                setQuotaConfig((prev) =>
                  prev
                    ? {
                        ...prev,
                        registrationStartDate: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined
                      }
                    : prev
                )
              }
              className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Registration Closing Date & Time
            </label>
            <input
              type="datetime-local"
              value={
                quotaConfig.registrationClosingDate
                  ? new Date(quotaConfig.registrationClosingDate).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) =>
                setQuotaConfig((prev) =>
                  prev
                    ? {
                        ...prev,
                        registrationClosingDate: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined
                      }
                    : prev
                )
              }
              className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
            />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 8. SEAT REALLOCATION AUDIT LOG (SECTION 8)                     */}
      {/* ============================================================== */}
      <div className="glass-iedc p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-400" /> Quota Reallocation History & Audit Logs
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Permanent immutable record of all seat transfers between classes.
            </p>
          </div>
        </div>

        {(!quotaConfig.reallocationLogs || quotaConfig.reallocationLogs.length === 0) ? (
          <div className="p-6 text-center text-slate-500 text-xs border border-white/5 rounded-xl bg-white/[0.01]">
            No seat transfers have been executed for this program yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 bg-white/5 uppercase">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Source Class</th>
                  <th className="p-3">Destination Class</th>
                  <th className="p-3 text-center">Seats</th>
                  <th className="p-3">Admin</th>
                  <th className="p-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {quotaConfig.reallocationLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 text-rose-300 font-medium">
                      {log.sourceClass.replace('__', ' ')}
                      <span className="text-[10px] text-slate-500 block">
                        ({log.previousSourceQuota} &rarr; {log.newSourceQuota})
                      </span>
                    </td>
                    <td className="p-3 text-emerald-300 font-medium">
                      {log.destinationClass.replace('__', ' ')}
                      <span className="text-[10px] text-slate-500 block">
                        ({log.previousDestQuota} &rarr; {log.newDestQuota})
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black">
                        +{log.seatsTransferred}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{log.adminUser || 'Admin'}</td>
                    <td className="p-3 text-slate-400 italic">{log.reason || 'Manual Reallocation'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: MANUAL SEAT REALLOCATION                                */}
      {/* ============================================================== */}
      {showReallocateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-iedc p-6 rounded-2xl border border-white/20 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" /> Transfer Unused Seats
              </h3>
              <button
                type="button"
                onClick={() => setShowReallocateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleReallocate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Source Class (Unused Seats to Transfer From)
                </label>
                <select
                  required
                  value={reallocForm.sourceKey}
                  onChange={(e) => setReallocForm({ ...reallocForm, sourceKey: e.target.value })}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                >
                  <option value="">-- Select Source Class --</option>
                  {getTransferSourceOptions().map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Destination Class (Class Receiving Capacity)
                </label>
                <select
                  required
                  value={reallocForm.destKey}
                  onChange={(e) => setReallocForm({ ...reallocForm, destKey: e.target.value })}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                >
                  <option value="">-- Select Destination Class --</option>
                  {getTransferDestOptions()
                    .filter((opt) => opt.key !== reallocForm.sourceKey)
                    .map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Number of Seats to Transfer
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={reallocForm.seats}
                  onChange={(e) =>
                    setReallocForm({
                      ...reallocForm,
                      seats: Math.max(1, parseInt(e.target.value) || 1)
                    })
                  }
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Reason / Administrative Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mechanical 3rd Year had zero applicants; transferring to ECE"
                  value={reallocForm.reason}
                  onChange={(e) => setReallocForm({ ...reallocForm, reason: e.target.value })}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowReallocateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reallocating}
                  className="px-4 py-2 rounded-xl bg-[#F98A5B] hover:bg-[#ff9c73] text-black font-black text-xs shadow-lg shadow-[#F98A5B]/20 disabled:opacity-50"
                >
                  {reallocating ? 'Transferring...' : 'Confirm Reallocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
