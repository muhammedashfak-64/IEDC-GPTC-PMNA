'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import {
  UserCog,
  Plus,
  ShieldCheck,
  User,
  Lock,
  CheckCircle2,
  XCircle,
  KeyRound,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Link as LinkIcon,
  Crown,
  Eye,
  EyeOff,
  Sparkles,
  Sliders
} from 'lucide-react';

interface OperatorUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'main_admin' | 'faculty_coordinator' | 'student_operator' | 'student_lead';
  department: string;
  designation?: string;
  staffId: string;
  avatar?: string;
  linkedProfileId?: string | null;
  linkedProfileType?: 'team' | 'faculty' | null;
  permissions?: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'events', label: 'Programs, Workshops & Quotas', desc: 'Manage events, eligibility and class-wise seat limits' },
  { id: 'registrations', label: 'Registrations & Capacity', desc: 'Review student registrations, approval and waitlists' },
  { id: 'certificates', label: 'Certificates & Attendance', desc: 'Mark attendance, configure templates & publish certificates' },
  { id: 'team', label: 'Team & Faculty CMS', desc: 'Update student leads and faculty coordinator profiles' },
  { id: 'homepage', label: 'Hero Background & Visuals', desc: 'Configure college backdrop, opacity and blur controls' },
  { id: 'gallery', label: 'Media & Gallery', desc: 'Upload and organize event photographs and highlights' },
  { id: 'announcements', label: 'Announcements & Alerts', desc: 'Broadcast notifications and ticker messages' },
  { id: 'projects', label: 'Projects & Startups', desc: 'Showcase student innovations and prototypes' }
];

export default function OperatorManagementPage() {
  const { user: currentAdmin, isFaculty, addToast } = useAdmin();
  const [operators, setOperators] = useState<OperatorUser[]>([]);
  const [teamProfiles, setTeamProfiles] = useState<any[]>([]);
  const [facultyProfiles, setFacultyProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  const [activeTargetUser, setActiveTargetUser] = useState<OperatorUser | null>(null);

  // Create / Edit Form State
  const [formData, setFormData] = useState({
    id: '',
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'student_operator',
    department: 'Electronics Engineering',
    staffId: '',
    linkedProfileId: '',
    linkedProfileType: '',
    permissions: [] as string[]
  });

  // Reset Password State
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  const isMainAdmin = currentAdmin?.role === 'main_admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, teamRes, facRes] = await Promise.all([
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/public/team').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/admin/faculty').then((r) => r.json()).catch(() => ({ success: false }))
      ]);

      if (usersRes.success) setOperators(usersRes.data || []);
      if (teamRes.success && Array.isArray(teamRes.data)) setTeamProfiles(teamRes.data);
      if (facRes.success && Array.isArray(facRes.data)) setFacultyProfiles(facRes.data);
    } catch (err) {
      console.error('Failed to load operators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFaculty) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isFaculty]);

  // Filtered operators list
  const filteredOperators = operators.filter((op) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      op.username.toLowerCase().includes(q) ||
      op.full_name.toLowerCase().includes(q) ||
      op.email.toLowerCase().includes(q) ||
      (op.staffId && op.staffId.toLowerCase().includes(q)) ||
      (op.department && op.department.toLowerCase().includes(q));

    const matchesRole =
      roleFilter === 'all' ||
      op.role === roleFilter ||
      (roleFilter === 'student_operator' && op.role === 'student_lead');

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && op.isActive !== false) ||
      (statusFilter === 'suspended' && op.isActive === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      id: '',
      username: '',
      email: '',
      password: 'Student@123',
      full_name: '',
      role: 'student_operator',
      department: 'Electronics Engineering',
      staffId: `SL00${operators.length + 1}`,
      linkedProfileId: '',
      linkedProfileType: '',
      permissions: ['events', 'registrations', 'certificates']
    });
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (op: OperatorUser) => {
    setActiveTargetUser(op);
    setFormData({
      id: op.id,
      username: op.username,
      email: op.email,
      password: '',
      full_name: op.full_name,
      role: op.role,
      department: op.department || 'Electronics Engineering',
      staffId: op.staffId || '',
      linkedProfileId: op.linkedProfileId || '',
      linkedProfileType: op.linkedProfileType || '',
      permissions: op.permissions || []
    });
    setShowEditModal(true);
  };

  // Open Password Reset Modal
  const handleOpenReset = (op: OperatorUser) => {
    setActiveTargetUser(op);
    setNewPassword('');
    setShowResetModal(true);
  };

  // Submit Create Operator
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Operator Provisioned', `Created account @${formData.username} (${formData.role})`, 'success');
        setShowCreateModal(false);
        loadData();
      } else {
        addToast('Provision Error', data.error || 'Failed to create operator', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  // Submit Edit Operator
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTargetUser) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeTargetUser.id,
          updates: {
            username: formData.username,
            full_name: formData.full_name,
            email: formData.email,
            role: formData.role,
            department: formData.department,
            staffId: formData.staffId,
            linkedProfileId: formData.linkedProfileId || null,
            linkedProfileType: formData.linkedProfileType || null,
            permissions: formData.permissions
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Account Updated', `Updated settings for @${formData.username}`, 'success');
        setShowEditModal(false);
        loadData();
      } else {
        addToast('Update Error', data.error || 'Failed to update operator', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  // Submit Password Reset
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTargetUser) return;
    if (!newPassword || newPassword.length < 6) {
      addToast('Validation', 'Password must be at least 6 characters long.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeTargetUser.id,
          action: 'reset_password',
          newPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Password Reset Complete', `New credential activated for @${activeTargetUser.username}`, 'success');
        setShowResetModal(false);
        loadData();
      } else {
        addToast('Reset Error', data.error || 'Failed to reset password', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  // Toggle Suspend / Activate Status
  const handleToggleStatus = async (op: OperatorUser) => {
    if (op.role === 'main_admin') {
      addToast('Protection Policy', 'The Main Administrator account cannot be suspended.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: op.id,
          action: 'toggle_status'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const newStatus = op.isActive ? 'suspended' : 'activated';
        addToast('Status Changed', `Account @${op.username} is now ${newStatus}.`, 'info');
        loadData();
      } else {
        addToast('Error', data.error || 'Failed to change status', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  // Generate secure password suggestion
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'IEDC@';
    for (let i = 0; i < 5; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => {
      const current = prev.permissions || [];
      if (current.includes(permId)) {
        return { ...prev, permissions: current.filter((p) => p !== permId) };
      } else {
        return { ...prev, permissions: [...current, permId] };
      }
    });
  };

  if (!isFaculty) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Privileged Module: Main Admin &amp; Faculty Only</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Operator &amp; Access Management is restricted to the Website Owner (Main Administrator) and Faculty Coordinators. Student operators cannot provision or alter administrative credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F98A5B] uppercase tracking-widest block mb-1">
            MODULE 22 / OPERATOR &amp; ACCESS MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">Operator &amp; Access Management</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Manage Main Administrator, Faculty Coordinator, and Student Operator accounts. Configure usernames, individual passwords, CMS profile links, and module permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Operator List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Operator Account</span>
          </button>
        </div>
      </div>

      {/* Role Summary Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#121216] border border-purple-500/30 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-400">
            <span className="flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" /> MAIN ADMINISTRATOR</span>
            <span>{operators.filter((o) => o.role === 'main_admin').length} Active</span>
          </div>
          <p className="text-[11px] text-slate-300">Website owner with full CMS control, security settings &amp; operator provisioning.</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#121216] border border-amber-500/30 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> FACULTY COORDINATORS</span>
            <span>{operators.filter((o) => o.role === 'faculty_coordinator').length} Active</span>
          </div>
          <p className="text-[11px] text-slate-300">Nodal officers managing activities, registrations, certificates &amp; reports.</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#121216] border border-cyan-500/30 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400">
            <span className="flex items-center gap-1.5"><UserCog className="w-3.5 h-3.5" /> STUDENT OPERATORS &amp; LEADS</span>
            <span>{operators.filter((o) => o.role === 'student_operator' || o.role === 'student_lead').length} Active</span>
          </div>
          <p className="text-[11px] text-slate-300">Student Leads &amp; Media Designers operating specifically granted CMS modules.</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#121216] p-3 rounded-2xl border border-white/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by username (@iedc.admin), name, or staff ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181D] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Operator Roles</option>
            <option value="main_admin">Main Administrator</option>
            <option value="faculty_coordinator">Faculty Coordinator</option>
            <option value="student_operator">Student Operator</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Operators Table */}
      <div className="rounded-3xl bg-[#121216] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18181E] border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4 font-bold">Operator Profile</th>
                <th className="py-3.5 px-4 font-bold">Username &amp; Staff ID</th>
                <th className="py-3.5 px-4 font-bold">Role &amp; Permissions</th>
                <th className="py-3.5 px-4 font-bold">Linked CMS Profile</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto mb-2" />
                    <span>Loading Operators &amp; Access Records...</span>
                  </td>
                </tr>
              ) : filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No operator accounts matched your query.
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op) => {
                  const initials = (op.full_name || op.username || 'OP')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  const isTargetMainAdmin = op.role === 'main_admin';

                  return (
                    <tr key={op.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Operator Profile */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/15 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-xs shadow-md">
                            {op.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={op.avatar} alt={op.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                              <span>{op.full_name}</span>
                              {isTargetMainAdmin && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-slate-400">{op.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Username & Staff ID */}
                      <td className="py-4 px-4 font-mono">
                        <div className="text-white font-bold flex items-center gap-1">
                          <span className="text-[#F98A5B]">@</span>
                          <span>{op.username}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{op.staffId || 'ID: --'}</div>
                      </td>

                      {/* Role & Permissions */}
                      <td className="py-4 px-4 space-y-1">
                        <div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase inline-block ${
                              op.role === 'main_admin'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : op.role === 'faculty_coordinator'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            }`}
                          >
                            {op.role === 'main_admin'
                              ? 'Main Administrator'
                              : op.role === 'faculty_coordinator'
                              ? 'Faculty Coordinator'
                              : 'Student Operator'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isTargetMainAdmin
                            ? 'Full CMS Access (Unrestricted)'
                            : op.permissions && op.permissions.length > 0
                            ? `${op.permissions.length} Modules Permitted`
                            : 'Standard Dashboard Access'}
                        </div>
                      </td>

                      {/* Linked CMS Profile */}
                      <td className="py-4 px-4">
                        {op.linkedProfileId ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300">
                            <LinkIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {op.linkedProfileType === 'faculty' ? 'Faculty Record' : 'Student Lead Record'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Direct Account</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                            op.isActive !== false
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {op.isActive !== false ? '● ACTIVE' : '○ SUSPENDED'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenReset(op)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3 h-3 text-amber-400" />
                            <span>Reset</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(op)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit Permissions & Details"
                          >
                            <Sliders className="w-3 h-3 text-[#F98A5B]" />
                            <span>Edit</span>
                          </button>

                          {!isTargetMainAdmin && (
                            <button
                              onClick={() => handleToggleStatus(op)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                op.isActive !== false
                                  ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                                  : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                              title={op.isActive !== false ? 'Suspend Account' : 'Re-activate Account'}
                            >
                              {op.isActive !== false ? 'Suspend' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODAL: PROVISION NEW OPERATOR
      ═══════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">Provision Backend Operator Account</h3>
                <p className="text-xs text-slate-400">Create an individual username and credential with assigned permissions.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Login Username (Required)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iedc.designer"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Used to log into the Admin CMS.</p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammed Ashfak"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Operator Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="student_operator">Student Operator / Lead</option>
                    <option value="faculty_coordinator">Faculty Coordinator</option>
                    {isMainAdmin && <option value="main_admin">Main Administrator / Owner</option>}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Initial Password
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Linked CMS Profile Selector */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase block">
                  Link Existing CMS Profile (Synchronize Photo &amp; Details)
                </label>
                <select
                  value={formData.linkedProfileId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const teamMatch = teamProfiles.find((t) => t.id === selectedId);
                    const facMatch = facultyProfiles.find((f) => f.id === selectedId);
                    if (teamMatch) {
                      setFormData({
                        ...formData,
                        linkedProfileId: selectedId,
                        linkedProfileType: 'team',
                        full_name: formData.full_name || teamMatch.name,
                        department: teamMatch.department || formData.department
                      });
                    } else if (facMatch) {
                      setFormData({
                        ...formData,
                        linkedProfileId: selectedId,
                        linkedProfileType: 'faculty',
                        full_name: formData.full_name || facMatch.name,
                        department: facMatch.department || formData.department
                      });
                    } else {
                      setFormData({ ...formData, linkedProfileId: '', linkedProfileType: '' });
                    }
                  }}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">-- No Linked Profile (Direct Operator) --</option>
                  <optgroup label="Student Leads &amp; Team Members">
                    {teamProfiles.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role || 'Student Lead'})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Faculty Coordinators">
                    {facultyProfiles.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.designation || 'Faculty'})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-slate-400">
                  When linked, photo updates made in Team or Faculty management immediately update this operator&apos;s avatar.
                </p>
              </div>

              {/* Module Permissions Matrix */}
              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase block">
                  Assigned CMS Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label
                      key={perm.id}
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                        formData.permissions.includes(perm.id)
                          ? 'bg-[#F98A5B]/10 border-[#F98A5B]/40 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="mt-0.5 accent-[#F98A5B]"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight">{perm.label}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{perm.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-white text-black font-extrabold hover:bg-slate-200 transition-all"
                >
                  Provision Operator Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: EDIT OPERATOR & PERMISSIONS
      ═══════════════════════════════════════════════════════ */}
      {showEditModal && activeTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">Edit Operator Access: @{formData.username}</h3>
                <p className="text-xs text-slate-400">Update role, profile linking, or modify module permissions.</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Operator Role
                  </label>
                  <select
                    value={formData.role}
                    disabled={activeTargetUser.role === 'main_admin' && !isMainAdmin}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="student_operator">Student Operator / Lead</option>
                    <option value="faculty_coordinator">Faculty Coordinator</option>
                    {isMainAdmin && <option value="main_admin">Main Administrator / Owner</option>}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Staff / Operator ID
                  </label>
                  <input
                    type="text"
                    value={formData.staffId}
                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Linked CMS Profile Selector */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase block">
                  Linked CMS Profile (Avatar Sync)
                </label>
                <select
                  value={formData.linkedProfileId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const teamMatch = teamProfiles.find((t) => t.id === selectedId);
                    const facMatch = facultyProfiles.find((f) => f.id === selectedId);
                    if (teamMatch) {
                      setFormData({
                        ...formData,
                        linkedProfileId: selectedId,
                        linkedProfileType: 'team'
                      });
                    } else if (facMatch) {
                      setFormData({
                        ...formData,
                        linkedProfileId: selectedId,
                        linkedProfileType: 'faculty'
                      });
                    } else {
                      setFormData({ ...formData, linkedProfileId: '', linkedProfileType: '' });
                    }
                  }}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">-- No Linked Profile --</option>
                  <optgroup label="Student Leads &amp; Team Members">
                    {teamProfiles.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role || 'Student Lead'})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Faculty Coordinators">
                    {facultyProfiles.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.designation || 'Faculty'})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Permissions Matrix */}
              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase block">
                  Permitted Modules
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label
                      key={perm.id}
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                        formData.permissions.includes(perm.id)
                          ? 'bg-[#F98A5B]/10 border-[#F98A5B]/40 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="mt-0.5 accent-[#F98A5B]"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight">{perm.label}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{perm.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-white text-black font-extrabold hover:bg-slate-200 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: SECURE PASSWORD RESET
      ═══════════════════════════════════════════════════════ */}
      {showResetModal && activeTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Reset Operator Password</h3>
              </div>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-white">Operator: {activeTargetUser.full_name}</div>
              <div className="font-mono text-[11px] text-[#F98A5B]">Username: @{activeTargetUser.username}</div>
              <p className="text-[10px] text-slate-400 pt-1">
                This reset updates the login credential immediately. Existing passwords are never exposed in audit logs.
              </p>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">
                    New Secure Password
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-generate
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono pr-10 focus:outline-none focus:border-amber-400/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold transition-all"
                >
                  Activate New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
