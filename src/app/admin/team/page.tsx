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
  List,
  Sparkles,
  Sliders,
  Check
} from 'lucide-react';
import { InstagramIcon as Instagram, LinkedInIcon as Linkedin } from '@/components/SocialIcons';
import AnimatedProfileCard, { ProfileCardData } from '@/components/team/AnimatedProfileCard';

export interface TeamMember extends ProfileCardData {
  showEmailPublicly?: boolean;
  showContactPublicly?: boolean;
  showSocialPublicly?: boolean;
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

  // Quick No-Background Photo Upload directly from table or cards
  const [quickUploadMemberId, setQuickUploadMemberId] = useState<string | null>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerQuickUpload = (memberId: string) => {
    setQuickUploadMemberId(memberId);
    quickFileInputRef.current?.click();
  };

  const handleQuickFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !quickUploadMemberId) return;

    try {
      addToast('Uploading', 'Uploading transparent cutout image...', 'info');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'team');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.success && data.url) {
        // Save to member record
        const updateRes = await fetch(`/api/admin/team?id=${quickUploadMemberId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photoUrl: data.url,
            isTransparent: true
          })
        });
        const updateData = await updateRes.json();
        if (updateData.success) {
          addToast('Success', 'No-background photo uploaded and linked!', 'success');
          fetchMembers();
        } else {
          addToast('Error', updateData.error || 'Failed to update member photo', 'error');
        }
      } else {
        addToast('Upload Error', data.error || 'Failed to upload photo', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Upload failed', 'error');
    } finally {
      setQuickUploadMemberId(null);
      if (quickFileInputRef.current) quickFileInputRef.current.value = '';
    }
  };

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
    showSocialPublicly: true,
    graduationDate: '31/05/2027',
    photoUrl: '',
    instagramUsername: '',
    instagramUrl: '',
    linkedinUrl: '',
    bio: '',
    displayOrder: 1,
    status: 'Published',
    verificationFlag: '',
    imagePosition: 'bottom',
    imageScale: 1.0,
    animationEnabled: true,
    animationStyle: 'fade-up',
    animationDelay: 0,
    glowEnabled: true,
    glowIntensity: 'subtle',
    bgStyle: 'radial-light',
    isTransparent: true
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
      showSocialPublicly: member.showSocialPublicly !== false,
      graduationDate: member.graduationDate || '',
      photoUrl: member.photoUrl || '',
      instagramUsername: member.instagramUsername || '',
      instagramUrl: member.instagramUrl || '',
      linkedinUrl: member.linkedinUrl || '',
      bio: member.bio || '',
      displayOrder: member.displayOrder,
      status: member.status,
      verificationFlag: member.verificationFlag || '',
      imagePosition: member.imagePosition || 'bottom',
      imageScale: member.imageScale !== undefined ? Number(member.imageScale) : 1.0,
      animationEnabled: member.animationEnabled !== false,
      animationStyle: member.animationStyle || 'fade-up',
      animationDelay: member.animationDelay !== undefined ? Number(member.animationDelay) : 0,
      glowEnabled: member.glowEnabled !== false,
      glowIntensity: member.glowIntensity || 'subtle',
      bgStyle: member.bgStyle || 'radial-light',
      isTransparent: member.isTransparent !== false
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
      instagramUrl: clean ? `https://www.instagram.com/${clean}/` : ''
    }));
  };

  const [isDragging, setIsDragging] = useState(false);

  // Process file upload directly from PC
  const processUpload = async (file: File) => {
    if (!file) return;

    // Check size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      addToast('File too large', 'Image must be under 10MB', 'error');
      return;
    }

    const isPngOrWebp =
      file.type === 'image/png' ||
      file.type === 'image/webp' ||
      /\.(png|webp)$/i.test(file.name);
    const isJpg =
      file.type === 'image/jpeg' ||
      /\.(jpg|jpeg)$/i.test(file.name);

    try {
      setUploading(true);
      setUploadProgress(20);

      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'team');

      setUploadProgress(50);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd
      });

      setUploadProgress(85);
      const data = await res.json();

      if (data.success && data.url) {
        setFormData((prev) => ({
          ...prev,
          photoUrl: data.url,
          isTransparent: isPngOrWebp ? true : (prev.isTransparent ?? false)
        }));
        setUploadProgress(100);

        if (isPngOrWebp) {
          addToast('Cutout Photo Uploaded', 'Transparent image loaded and prepared for animation.', 'success');
        } else if (isJpg) {
          addToast('Photo Uploaded', 'JPG photo uploaded. Note: JPG does not support alpha transparency.', 'info');
        } else {
          addToast('Photo Uploaded', 'Image uploaded successfully.', 'success');
        }
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

  // Handle photo upload via file input
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUpload(file);
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
      `"${(m.category || '').replace(/"/g, '""')}"`,
      `"${(m.department || '').replace(/"/g, '""')}"`,
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
                          <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                            <span>{member.name}</span>
                            {member.verificationFlag && (
                              <span title={member.verificationFlag} className="text-amber-400">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTriggerQuickUpload(member.id);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-[10px] font-mono cursor-pointer transition-colors"
                              title="Upload No-Background Photo directly from PC"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              <span>Upload Cutout</span>
                            </button>
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
                          onClick={() => handleTriggerQuickUpload(member.id)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                          title="Upload Member Photo"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
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
          {filtered.map((member, idx) => (
            <div key={member.id} className="relative group/adminCard flex flex-col justify-between">
              {/* Floating quick action buttons for admin */}
              <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 opacity-90 group-hover/adminCard:opacity-100 transition-opacity">
                <button
                  onClick={() => handleTriggerQuickUpload(member.id)}
                  className="p-1.5 rounded-lg bg-neutral-900/90 hover:bg-emerald-500 text-emerald-400 hover:text-neutral-950 border border-emerald-500/30 shadow-lg transition-colors cursor-pointer"
                  title="Upload Member Photo"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleOpenEdit(member)}
                  className="p-1.5 rounded-lg bg-neutral-900/90 hover:bg-[#F98A5B] text-white hover:text-neutral-950 border border-white/20 shadow-lg transition-colors cursor-pointer"
                  title="Edit Member"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteConfirmMember(member)}
                  className="p-1.5 rounded-lg bg-neutral-900/90 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 shadow-lg transition-colors cursor-pointer"
                  title="Delete Member"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <AnimatedProfileCard
                member={member}
                index={idx}
                containerHeight="h-72"
                layoutVariant="team"
              />
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
                {/* Photo Upload Zone (Drag-and-Drop + File Picker) */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                    isDragging
                      ? 'border-[#F98A5B] bg-[#F98A5B]/10 shadow-lg shadow-[#F98A5B]/20'
                      : 'bg-neutral-950 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#F98A5B]" />
                      Profile Photograph Upload (Transparent Cutout PNG / WebP)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-300">
                      PNG &bull; WebP &bull; JPG (Max 10MB)
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Upload a portrait photo from your computer. For optimal presentation, use photos with
                    a <strong>transparent background</strong> (cutout PNG or WebP). The website will automatically
                    render the cutout above an elegant soft light-gray gradient with ambient glow and smooth entrance animations.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* Visual Preview Box */}
                    <div
                      className="w-28 h-28 rounded-2xl border border-white/15 overflow-hidden flex items-end justify-center shrink-0 relative shadow-inner"
                      style={{
                        background: formData.isTransparent !== false
                          ? 'radial-gradient(circle at 50% 60%, #f8fafc 0%, #cbd5e1 100%)'
                          : '#17171a'
                      }}
                    >
                      {formData.photoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={formData.photoUrl}
                          alt="Preview"
                          className={`w-full h-full ${
                            formData.isTransparent !== false ? 'object-contain object-bottom' : 'object-cover'
                          }`}
                          style={{
                            transform: `scale(${formData.imageScale || 1.0})`,
                            filter: formData.isTransparent !== false ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.15))' : undefined
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                          <span className="text-lg font-black text-neutral-700">
                            {formData.name ? formData.name.substring(0, 2).toUpperCase() : 'PHOTO'}
                          </span>
                          <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest mt-1">
                            Placeholder
                          </span>
                        </div>
                      )}

                      {uploading && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-[10px] text-white">
                          <RefreshCw className="w-5 h-5 animate-spin text-[#F98A5B] mb-1.5" />
                          <span className="font-mono font-bold">{uploadProgress}%</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/png,image/webp,image/jpeg,image/jpg"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#fa753e] hover:brightness-110 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#F98A5B]/20 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-neutral-950" />
                          <span>{formData.photoUrl ? 'Replace Photo' : 'Upload Photo (JPG, PNG, WebP)'}</span>
                        </button>

                        {formData.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, photoUrl: '' }))}
                            className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>

                      {/* Transparency Checkbox */}
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-300">
                        <input
                          type="checkbox"
                          checked={formData.isTransparent !== false}
                          onChange={(e) => setFormData((p) => ({ ...p, isTransparent: e.target.checked }))}
                          className="w-4 h-4 rounded accent-[#F98A5B] cursor-pointer"
                        />
                        <span className="font-semibold text-white">
                          Transparent Background Cutout (renders above soft light-gray gradient)
                        </span>
                      </label>

                      {/* Direct URL input fallback */}
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] text-neutral-500 font-mono">Or paste existing image URL:</label>
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

                {/* ANIMATION & PROFILE PRESENTATION CONTROLS */}
                <div className="p-5 rounded-2xl bg-neutral-950/80 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#F98A5B]" />
                      <span>Cutout Presentation &amp; Scroll Animation Settings</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">Customizable Per Profile</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {/* Image Position */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-neutral-300 flex items-center justify-between">
                        <span>Display Position</span>
                        <span className="text-[10px] text-neutral-500 font-mono">Vertical align</span>
                      </label>
                      <select
                        value={formData.imagePosition || 'bottom'}
                        onChange={(e) => setFormData((p) => ({ ...p, imagePosition: e.target.value as any }))}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                      >
                        <option value="bottom">Bottom-Aligned (Ground Level Cutout)</option>
                        <option value="center">Center-Aligned</option>
                        <option value="top">Top-Aligned</option>
                      </select>
                    </div>

                    {/* Image Scale */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-neutral-300 flex items-center justify-between">
                        <span>Image Scale / Size</span>
                        <span className="text-[10px] text-[#F98A5B] font-mono font-bold">
                          {Math.round((formData.imageScale || 1.0) * 100)}%
                        </span>
                      </label>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="range"
                          min="0.85"
                          max="1.20"
                          step="0.05"
                          value={formData.imageScale || 1.0}
                          onChange={(e) => setFormData((p) => ({ ...p, imageScale: parseFloat(e.target.value) }))}
                          className="w-full accent-[#F98A5B] cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Animation Style */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-neutral-300">Animation Style</label>
                      <select
                        value={formData.animationStyle || 'fade-up'}
                        onChange={(e) => setFormData((p) => ({ ...p, animationStyle: e.target.value as any }))}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                      >
                        <option value="fade-up">Fade Up (Smooth ascent &amp; fade)</option>
                        <option value="soft-reveal">Soft Reveal (Gentle zoom &amp; glow)</option>
                        <option value="gentle-float">Gentle Float (Smooth levitation)</option>
                      </select>
                    </div>

                    {/* Light Background Style */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-neutral-300">Light Background Preset</label>
                      <select
                        value={formData.bgStyle || 'radial-light'}
                        onChange={(e) => setFormData((p) => ({ ...p, bgStyle: e.target.value as any }))}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                      >
                        <option value="radial-light">Radial Light (Soft off-white illumination)</option>
                        <option value="soft-slate">Soft Slate (Architectural cool cement)</option>
                        <option value="glass-glow">Glass Glow (Translucent frosted halo)</option>
                        <option value="minimal">Minimal (Clean matte light gray)</option>
                      </select>
                    </div>

                    {/* Ambient Glow Intensity */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-neutral-300">Ambient Glow Intensity</label>
                      <select
                        value={formData.glowIntensity || 'subtle'}
                        onChange={(e) => setFormData((p) => ({ ...p, glowIntensity: e.target.value as any }))}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                      >
                        <option value="subtle">Subtle (Tasteful soft illumination)</option>
                        <option value="medium">Medium (Enhanced backlight)</option>
                        <option value="vibrant">Vibrant (High-contrast glow)</option>
                      </select>
                    </div>

                    {/* Animation Delay */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-neutral-300 flex items-center justify-between">
                        <span>Entrance Delay</span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {formData.animationDelay || 0}s
                        </span>
                      </label>
                      <select
                        value={formData.animationDelay || 0}
                        onChange={(e) => setFormData((p) => ({ ...p, animationDelay: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B]"
                      >
                        <option value="0">0.0s (Immediate on scroll enter)</option>
                        <option value="0.1">0.10s (Gentle stagger)</option>
                        <option value="0.2">0.20s (Medium delay)</option>
                        <option value="0.3">0.30s (Deliberate entrance)</option>
                        <option value="0.4">0.40s</option>
                      </select>
                    </div>
                  </div>

                  {/* Toggles: Animation & Glow */}
                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-6 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={formData.animationEnabled !== false}
                        onChange={(e) => setFormData((p) => ({ ...p, animationEnabled: e.target.checked }))}
                        className="w-4 h-4 rounded accent-[#F98A5B] cursor-pointer"
                      />
                      <span>Enable Scroll Entrance &amp; Float Animation</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={formData.glowEnabled !== false}
                        onChange={(e) => setFormData((p) => ({ ...p, glowEnabled: e.target.checked }))}
                        className="w-4 h-4 rounded accent-[#F98A5B] cursor-pointer"
                      />
                      <span>Enable Soft Radial Glow Behind Cutout</span>
                    </label>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
                      Social Media Profiles
                    </span>
                    <label className="flex items-center gap-2 text-[11px] text-neutral-300 cursor-pointer bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.showSocialPublicly !== false}
                        onChange={(e) => setFormData((p) => ({ ...p, showSocialPublicly: e.target.checked }))}
                        className="rounded accent-[#F98A5B] cursor-pointer"
                      />
                      <span>Show social links publicly on card</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        placeholder="e.g. _aasshfaakk_"
                        value={formData.instagramUsername || ''}
                        onChange={(e) => handleInstagramUsernameChange(e.target.value)}
                        className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B] font-mono"
                      />
                    </div>
                  </div>

                  {/* Instagram Profile URL */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
                      Instagram Profile URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.instagram.com/_aasshfaakk_/"
                      value={formData.instagramUrl || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, instagramUrl: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F98A5B] font-mono"
                    />
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
              <div className="py-6 flex flex-col items-center justify-center space-y-5">
                <div className="text-center space-y-1">
                  <span className="text-xs font-mono font-bold text-[#F98A5B] flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Interactive Public Live Preview
                  </span>
                  <p className="text-xs text-neutral-400 max-w-md">
                    This is the live component rendered with real-time transparent cutout layering,
                    soft background styling, and smooth scroll animations as it appears on the public site.
                  </p>
                </div>

                <div className="w-full max-w-sm">
                  <AnimatedProfileCard
                    member={{
                      id: formData.id || 'preview',
                      name: formData.name || 'Member Full Name',
                      role: formData.role || 'Student Lead',
                      category: formData.category || 'Student Leads',
                      department: formData.department || 'Engineering Department',
                      graduationDate: formData.graduationDate,
                      photoUrl: formData.photoUrl,
                      instagramUsername: formData.instagramUsername,
                      instagramUrl: formData.instagramUrl,
                      linkedinUrl: formData.linkedinUrl,
                      bio: formData.bio || 'Passionate student engineer driving innovation programs, technical bootcamps, and Maker Space projects.',
                      displayOrder: formData.displayOrder || 1,
                      email: formData.showEmailPublicly ? formData.email : undefined,
                      contact: formData.showContactPublicly ? formData.contact : undefined,
                      imagePosition: formData.imagePosition || 'bottom',
                      imageScale: formData.imageScale || 1.0,
                      animationEnabled: formData.animationEnabled !== false,
                      animationStyle: formData.animationStyle || 'fade-up',
                      animationDelay: formData.animationDelay || 0,
                      glowEnabled: formData.glowEnabled !== false,
                      glowIntensity: formData.glowIntensity || 'subtle',
                      bgStyle: formData.bgStyle || 'radial-light',
                      isTransparent: formData.isTransparent !== false
                    }}
                    index={0}
                    containerHeight="h-72"
                    layoutVariant="team"
                  />
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('form')}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Back to Edit Form</span>
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

      {/* Hidden file input for one-click quick upload on table/card rows */}
      <input
        type="file"
        ref={quickFileInputRef}
        onChange={handleQuickFileChange}
        accept="image/png,image/webp,image/jpeg,image/jpg"
        className="hidden"
      />
    </div>
  );
}
