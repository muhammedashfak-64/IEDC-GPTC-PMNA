'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAdmin } from '@/context/AdminContext';
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit3,
  Upload,
  Mail,
  Phone,
  GraduationCap,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  X,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  ShieldAlert,
  Archive,
  RefreshCw,
  LayoutGrid,
  List
} from 'lucide-react';
import { InstagramIcon as Instagram, LinkedInIcon as Linkedin } from '@/components/SocialIcons';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: string;
  department: string;
  email?: string;
  contact?: string;
  showEmailPublicly?: boolean;
  showContactPublicly?: boolean;
  graduationDate?: string;
  photoUrl?: string;
  instagramUsername?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  bio?: string;
  displayOrder: number;
  status: 'Published' | 'Draft' | 'Archived';
  verificationFlag?: string;
  createdAt?: string;
  updatedAt?: string;
}

const COMMON_ROLES = [
  'Student Lead-I',
  'Student Lead-II',
  'Community Lead',
  'Branding and Marketing Lead',
  'Quality and Operations Lead',
  'Women Innovation Lead',
  'Finance Lead',
  'IPR and Research Lead',
  'Creative and Innovation Lead',
  'Technology Lead',
  'Executive Committee Member'
];

const COMMON_DEPTS = [
  'Electronics Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Computer Engineering'
];

const COMMON_CATEGORIES = [
  'Student Leads',
  'Executive Members',
  'Community and Special Interest Leads',
  'Advisory Board'
];

export default function AdminTeamPage() {
  const { addToast } = useAdmin();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<TeamMember | null>(null);
  const [previewTab, setPreviewTab] = useState<'form' | 'cardPreview'>('form');

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const initialForm: Partial<TeamMember> = {
    name: '',
    role: 'Student Lead-I',
    category: 'Student Leads',
    department: 'Electronics Engineering',
    email: '',
    contact: '',
    showEmailPublicly: false,
    showContactPublicly: false,
    graduationDate: '31/05/2027',
    photoUrl: '',
    instagramUsername: '',
    instagramUrl: '',
    linkedinUrl: '',
    bio: '',
    displayOrder: 1,
    status: 'Published',
    verificationFlag: ''
  };
  const [formData, setFormData] = useState<Partial<TeamMember>>(initialForm);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/team');
      const data = await res.json();
      if (data.success && data.data) {
        setMembers(data.data);
      } else {
        addToast('Error', data.error || 'Failed to load team members', 'error');
      }
    } catch (e: any) {
      addToast('Error', e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Filtered members
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.department && m.department.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCat = categoryFilter === 'ALL' || m.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;

      return matchSearch && matchCat && matchStatus;
    });
  }, [members, searchTerm, categoryFilter, statusFilter]);

  // Handle open create
  const handleOpenCreate = () => {
    setEditingMember(null);
    setFormData({
      ...initialForm,
      displayOrder: members.length + 1
    });
    setPreviewTab('form');
    setShowModal(true);
  };

  // Handle open edit
  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      category: member.category,
      department: member.department,
      email: member.email || '',
      contact: member.contact || '',
      showEmailPublicly: !!member.showEmailPublicly,
      showContactPublicly: !!member.showContactPublicly,
      graduationDate: member.graduationDate || '',
      photoUrl: member.photoUrl || '',
      instagramUsername: member.instagramUsername || '',
      instagramUrl: member.instagramUrl || '',
      linkedinUrl: member.linkedinUrl || '',
      bio: member.bio || '',
      displayOrder: member.displayOrder,
      status: member.status,
      verificationFlag: member.verificationFlag || ''
    });
    setPreviewTab('form');
    setShowModal(true);
  };

  // Handle auto Instagram URL generation
  const handleInstagramUsernameChange = (uname: string) => {
    const clean = uname.trim().replace(/^@/, '');
    setFormData((prev) => ({
      ...prev,
      instagramUsername: clean,
      instagramUrl: clean ? `https://instagram.com/${clean}` : ''
    }));
  };

  // Handle photo upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('File too large', 'Image must be under 5MB', 'error');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(25);

      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'team');

      setUploadProgress(50);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd
      });

      setUploadProgress(80);
      const data = await res.json();

      if (data.success && data.url) {
        setFormData((prev) => ({ ...prev, photoUrl: data.url }));
        setUploadProgress(100);
        addToast('Photo Uploaded', 'Image uploaded successfully.', 'success');
      } else {
        addToast('Upload Error', data.error || 'Failed to upload photo', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Network upload error', 'error');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Save member
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      addToast('Validation', 'Member name is required', 'error');
      return;
    }

    try {
      const url = '/api/admin/team';
      const method = editingMember ? 'PUT' : 'POST';
      const payload = editingMember ? { id: editingMember.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        addToast('Success', editingMember ? 'Member updated successfully' : 'Member added successfully', 'success');
        setShowModal(false);
        fetchMembers();
      } else {
        addToast('Error', data.error || 'Failed to save member', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  // Delete member
  const confirmDelete = async () => {
    if (!deleteConfirmMember) return;
    try {
      const res = await fetch(`/api/admin/team?id=${deleteConfirmMember.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        addToast('Deleted', `${deleteConfirmMember.name} deleted.`, 'success');
        setDeleteConfirmMember(null);
        fetchMembers();
      } else {
        addToast('Error', data.error, 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  // Quick reorder (move up / down)
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= members.length) return;

    const newOrder = [...members];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    // Recalculate order index
    const orderMap = newOrder.map((m, idx) => ({ id: m.id, displayOrder: idx + 1 }));

    try {
      const res = await fetch('/api/admin/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: true, orderMap })
      });
      const data = await res.json();
      if (data.success) {
        setMembers(newOrder);
        addToast('Order Updated', 'Member sequence saved.', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'archive' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !confirm(`Permanently delete ${selectedIds.length} members?`)) return;

    try {
      const res = await fetch('/api/admin/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkAction: action, ids: selectedIds })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Bulk Action Complete', `Updated ${selectedIds.length} records.`, 'success');
        setSelectedIds([]);
        fetchMembers();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (members.length === 0) return;
    const headers = [
      'ID',
      'Name',
      'Role',
      'Category',
      'Department',
      'Email',
      'Contact',
      'Graduation Date',
      'Instagram',
      'LinkedIn',
      'Status',
      'Display Order',
      'Verification Flag'
    ];
    const rows = members.map((m) => [
      `"${m.id}"`,
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.role.replace(/"/g, '""')}"`,
      `"${m.category.replace(/"/g, '""')}"`,
      `"${m.department.replace(/"/g, '""')}"`,
      `"${(m.email || '').replace(/"/g, '""')}"`,
      `"${(m.contact || '').replace(/"/g, '""')}"`,
      `"${(m.graduationDate || '').replace(/"/g, '""')}"`,
      `"${(m.instagramUsername || '').replace(/"/g, '""')}"`,
      `"${(m.linkedinUrl || '').replace(/"/g, '""')}"`,
      `"${m.status}"`,
      m.displayOrder,
      `"${(m.verificationFlag || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IEDC_Team_Members_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported', 'Team CSV downloaded successfully.', 'success');
  };

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((m) => m.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#F98A5B]" />
            <span>Team &amp; Student Leads Management</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage student leads, executive committee members, roles, contact privacy, Instagram IDs, and photo uploads.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#F98A5B]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-[#F98A5B] hover:bg-[#fa753e] text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Review Warnings Box (if any flags exist) */}
      {members.some((m) => m.verificationFlag) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white block">Records Pending Verification</span>
            <p className="text-neutral-300">
              Some student leads have details transcribed with notes from source documents (e.g. Muhammed Nahan's normalized email or Abhijith's incomplete phone). Click "Edit" on flagged records to verify before publishing.
            </p>
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by name, role, department, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#F98A5B]"
            />
          </div>

          {/* Category & Status Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-neutral-950 border border-white/10 text-neutral-300 text-xs focus:outline-none focus:border-[#F98A5B]"
            >
              <option value="ALL">All Categories</option>
              {COMMON_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-neutral-950 border border-white/10 text-neutral-300 text-xs focus:outline-none focus:border-[#F98A5B]"
            >
              <option value="ALL">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>

            <div className="border-l border-white/10 pl-2 flex items-center gap-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white/15 text-white' : 'text-neutral-500 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'cards' ? 'bg-white/15 text-white' : 'text-neutral-500 hover:text-white'
                }`}
                title="Card Preview View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-white">
              {selectedIds.length} member{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkAction('publish')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 font-semibold"
              >
                Publish Selected
              </button>
              <button
                onClick={() => handleBulkAction('unpublish')}
                className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/40 font-semibold"
              >
                Move to Draft
              </button>
              <button
                onClick={() => handleBulkAction('archive')}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-semibold"
              >
                Archive
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 font-semibold"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-20 text-neutral-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F98A5B]" />
          Loading team members...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-2xl bg-neutral-900/60 border border-white/10 text-neutral-400">
          <Users className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
          <p className="font-semibold text-white">No members match your filter criteria.</p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 rounded-xl bg-[#F98A5B] text-neutral-950 font-bold text-xs"
          >
            Add First Member
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-white/10 bg-neutral-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 font-mono uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded accent-[#F98A5B]"
                    />
                  </th>
                  <th className="p-3 w-16">Order</th>
                  <th className="p-3">Member</th>
                  <th className="p-3">Role &amp; Category</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Contact &amp; Privacy</th>
                  <th className="p-3">Instagram</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((member, index) => (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(member.id)}
                        onChange={() => toggleSelectOne(member.id)}
                        className="rounded accent-[#F98A5B]"
                      />
                    </td>

                    {/* Order & Move Buttons */}
                    <td className="p-3">
                      <div className="flex items-center gap-1 font-mono">
                        <span className="w-5 text-center text-neutral-400">{member.displayOrder}</span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => handleMove(index, 'up')}
                            disabled={index === 0}
                            className="p-0.5 text-neutral-500 hover:text-white disabled:opacity-20"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMove(index, 'down')}
                            disabled={index === members.length - 1}
                            className="p-0.5 text-neutral-500 hover:text-white disabled:opacity-20"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Member Name & Avatar */}
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-[#F98A5B]/30 flex items-center justify-center shrink-0">
                            <span className="font-bold text-[#F98A5B] text-xs">
                              {member.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{member.name}</span>
                            {member.verificationFlag && (
                              <span title={member.verificationFlag} className="text-amber-400">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          {member.graduationDate && (
                            <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" /> Grad: {member.graduationDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role & Category */}
                    <td className="p-3">
                      <span className="font-semibold text-white block">{member.role}</span>
                      <span className="text-[10px] font-mono text-neutral-400">{member.category}</span>
                    </td>

                    {/* Department */}
                    <td className="p-3 text-neutral-300">{member.department}</td>

                    {/* Contact & Privacy */}
                    <td className="p-3 space-y-0.5">
                      {member.email && (
                        <div className="flex items-center gap-1.5 text-neutral-400">
                          <Mail className="w-3 h-3 text-neutral-500" />
                          <span className="truncate max-w-[140px]">{member.email}</span>
                          {member.showEmailPublicly ? (
                            <span title="Publicly Visible"><Eye className="w-3 h-3 text-emerald-400" /></span>
                          ) : (
                            <span title="Private (Hidden from public)"><EyeOff className="w-3 h-3 text-neutral-600" /></span>
                          )}
                        </div>
                      )}
                      {member.contact && (
                        <div className="flex items-center gap-1.5 text-neutral-400">
                          <Phone className="w-3 h-3 text-neutral-500" />
                          <span>{member.contact}</span>
                          {member.showContactPublicly ? (
                            <span title="Publicly Visible"><Eye className="w-3 h-3 text-emerald-400" /></span>
                          ) : (
                            <span title="Private (Hidden from public)"><EyeOff className="w-3 h-3 text-neutral-600" /></span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Instagram */}
                    <td className="p-3">
                      {member.instagramUsername ? (
                        <a
                          href={member.instagramUrl || `https://instagram.com/${member.instagramUsername}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#E1306C]/10 text-[#E1306C] hover:bg-[#E1306C]/20 border border-[#E1306C]/30 text-[11px] font-mono"
                        >
                          <Instagram className="w-3 h-3" />
                          <span>@{member.instagramUsername}</span>
                        </a>
                      ) : (
                        <span className="text-neutral-600 text-[11px] font-mono">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                          member.status === 'Published'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : member.status === 'Draft'
                            ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                          title="Edit Member"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmMember(member)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Delete Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD PREVIEW VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((member) => (
            <div
              key={member.id}
              className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 flex flex-col justify-between space-y-4 shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-[#F98A5B]/30 flex items-center justify-center">
                        <span className="font-bold text-[#F98A5B] text-base">
                          {member.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-mono text-[#F98A5B] font-bold block">{member.role}</span>
                      <h4 className="font-bold text-white text-sm">{member.name}</h4>
                      <span className="text-[11px] text-neutral-400 block">{member.department}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      member.status === 'Published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                {member.verificationFlag && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{member.verificationFlag}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                {member.instagramUsername ? (
                  <a
                    href={member.instagramUrl || `https://instagram.com/${member.instagramUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#E1306C] text-[11px] font-mono"
                  >
                    <Instagram className="w-3 h-3" /> @{member.instagramUsername}
                  </a>
                ) : (
                  <span className="text-neutral-500 text-[11px]">No Instagram</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(member)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmMember(member)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-neutral-900 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#F98A5B]" />
                  <span>{editingMember ? 'Edit Team Member' : 'Add New Student Lead / Member'}</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Update profile information, Instagram links, contact visibility, and upload photographs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Tab switcher: Form vs Card Preview */}
                <div className="bg-neutral-950 p-1 rounded-xl flex items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('form')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      previewTab === 'form' ? 'bg-[#F98A5B] text-neutral-950 font-bold' : 'text-neutral-400'
                    }`}
                  >
                    Edit Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('cardPreview')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      previewTab === 'cardPreview' ? 'bg-[#F98A5B] text-neutral-950 font-bold' : 'text-neutral-400'
                    }`}
                  >
                    Card Preview
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TAB 1: FORM */}
            {previewTab === 'form' ? (
              <form onSubmit={handleSave} className="space-y-5">
                {/* Photo Upload Zone */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-white/10 space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#F98A5B]" />
                    Profile Photograph (JPG, PNG, WebP &bull; Max 5MB)
                  </span>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Preview Box */}
                    <div className="w-24 h-24 rounded-2xl bg-neutral-900 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 relative">
                      {formData.photoUrl ? (
                        <img
                          src={formData.photoUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <span className="text-lg font-bold text-[#F98A5B]">
                            {formData.name ? formData.name.substring(0, 2).toUpperCase() : 'PHOTO'}
                          </span>
                          <span className="text-[9px] text-neutral-500 block">Default Placeholder</span>
                        </div>
                      )}

                      {uploading && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-[10px] text-white">
                          <RefreshCw className="w-4 h-4 animate-spin text-[#F98A5B] mb-1" />
                          <span>{uploadProgress}%</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#F98A5B]" />
                          <span>{formData.photoUrl ? 'Replace Photo' : 'Upload Photograph'}</span>
                        </button>

                        {formData.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, photoUrl: '' }))}
                            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-500">Or Paste Image URL directly:</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={formData.photoUrl || ''}
                          onChange={(e) => setFormData((p) => ({ ...p, photoUrl: e.target.value }))}
                          className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Core Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">
                      Full Name <span className="text-[#F98A5B]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ANSHADH PK"
                      value={formData.name || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                    />
                  </div>

                  {/* Role / Designation */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">
                      Lead Role / Designation <span className="text-[#F98A5B]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      list="rolesList"
                      placeholder="e.g. Student Lead-I"
                      value={formData.role || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                    />
                    <datalist id="rolesList">
                      {COMMON_ROLES.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Category</label>
                    <input
                      type="text"
                      list="catList"
                      value={formData.category || 'Executive Members'}
                      onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                    />
                    <datalist id="catList">
                      {COMMON_CATEGORIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  {/* Department */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Department</label>
                    <input
                      type="text"
                      list="deptList"
                      value={formData.department || 'Electronics Engineering'}
                      onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                    />
                    <datalist id="deptList">
                      {COMMON_DEPTS.map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </div>

                  {/* Graduation Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Graduation Date</label>
                    <input
                      type="text"
                      placeholder="e.g. 31/05/2027 or 31/05/2028"
                      value={formData.graduationDate || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, graduationDate: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                    />
                  </div>

                  {/* Display Order */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Display Order</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.displayOrder ?? 1}
                      onChange={(e) => setFormData((p) => ({ ...p, displayOrder: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                    />
                  </div>
                </div>

                {/* Contact & Public Privacy Toggles */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-white/10 space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                    Contact &amp; Public Visibility Controls
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-300">Email Address</label>
                      <input
                        type="email"
                        placeholder="student@example.com"
                        value={formData.email || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                      />
                      <label className="flex items-center gap-2 text-[11px] text-neutral-400 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={!!formData.showEmailPublicly}
                          onChange={(e) => setFormData((p) => ({ ...p, showEmailPublicly: e.target.checked }))}
                          className="rounded accent-[#F98A5B]"
                        />
                        <span>Display email publicly on member card</span>
                      </label>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-300">Contact Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 9847123456"
                        value={formData.contact || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, contact: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                      />
                      <label className="flex items-center gap-2 text-[11px] text-neutral-400 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={!!formData.showContactPublicly}
                          onChange={(e) => setFormData((p) => ({ ...p, showContactPublicly: e.target.checked }))}
                          className="rounded accent-[#F98A5B]"
                        />
                        <span>Display contact phone publicly on member card</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Social Profiles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Instagram Username */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
                      Instagram Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">@</span>
                      <input
                        type="text"
                        placeholder="username (auto-generates link)"
                        value={formData.instagramUsername || ''}
                        onChange={(e) => handleInstagramUsernameChange(e.target.value)}
                        className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                      />
                    </div>
                  </div>

                  {/* LinkedIn URL */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-[#0077B5]" />
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={formData.linkedinUrl || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, linkedinUrl: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                    />
                  </div>
                </div>

                {/* Short Bio */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Short Bio</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the student lead's initiatives, focus areas, and activities..."
                    value={formData.bio || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                  />
                </div>

                {/* Verification Flag & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Verification / Review Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Email verified with student / Incomplete phone"
                      value={formData.verificationFlag || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, verificationFlag: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300">Publication Status</label>
                    <select
                      value={formData.status || 'Published'}
                      onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as any }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                    >
                      <option value="Published">Published (Visible on Public Website)</option>
                      <option value="Draft">Draft (Hidden from Public)</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#F98A5B] hover:bg-[#fa753e] text-neutral-950 font-bold text-xs shadow-lg"
                  >
                    {editingMember ? 'Save Changes' : 'Create Member'}
                  </button>
                </div>
              </form>
            ) : (
              /* TAB 2: LIVE CARD PREVIEW */
              <div className="py-6 flex flex-col items-center justify-center space-y-4">
                <span className="text-xs font-mono text-neutral-400">
                  Live Preview: Exactly how this member will appear on the public /team portal
                </span>

                <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-white/20 overflow-hidden shadow-2xl flex flex-col justify-between">
                  <div>
                    {/* Photo / Avatar */}
                    <div className="relative h-56 w-full bg-neutral-800 flex items-center justify-center overflow-hidden border-b border-white/5">
                      {formData.photoUrl ? (
                        <img
                          src={formData.photoUrl}
                          alt={formData.name || 'Preview'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950">
                          <div className="w-20 h-20 rounded-2xl bg-[#F98A5B]/10 border border-[#F98A5B]/30 flex items-center justify-center">
                            <span className="text-2xl font-black text-[#F98A5B]">
                              {formData.name ? formData.name.substring(0, 2).toUpperCase() : 'PM'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                            IEDC Student Lead
                          </span>
                        </div>
                      )}

                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-neutral-300">
                        {formData.category || 'Executive Members'}
                      </div>

                      {formData.graduationDate && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-[#F98A5B]" />
                          <span>{formData.graduationDate}</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-5 space-y-2.5">
                      <span className="text-[11px] font-mono font-bold text-[#F98A5B] block">
                        {formData.role || 'Role'}
                      </span>
                      <h4 className="text-lg font-bold text-white">{formData.name || 'Member Name'}</h4>
                      <p className="text-xs text-neutral-400">{formData.department || 'Department'}</p>

                      {formData.bio && (
                        <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed pt-1">
                          {formData.bio}
                        </p>
                      )}

                      {/* Contact items if visible */}
                      {(formData.showEmailPublicly || formData.showContactPublicly) && (
                        <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] text-neutral-400">
                          {formData.showEmailPublicly && formData.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-[#F98A5B]" />
                              <span>{formData.email}</span>
                            </div>
                          )}
                          {formData.showContactPublicly && formData.contact && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{formData.contact}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Social Footer */}
                  <div className="p-4 pt-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {formData.instagramUsername ? (
                        <span className="px-2.5 py-1 rounded-xl bg-[#E1306C]/15 border border-[#E1306C]/30 text-[#E1306C] text-xs font-mono flex items-center gap-1.5">
                          <Instagram className="w-3.5 h-3.5" />
                          <span>@{formData.instagramUsername}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-600">No Instagram</span>
                      )}

                      {formData.linkedinUrl && (
                        <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-400">
                          <Linkedin className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-neutral-500">#{formData.displayOrder || 1}</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('form')}
                    className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                  >
                    Back to Edit Form
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-rose-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Delete Member</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Are you sure you want to permanently delete <strong className="text-white">{deleteConfirmMember.name}</strong> ({deleteConfirmMember.role}) from the team database?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmMember(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
