'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '@/context/AdminContext';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Link as LinkIcon,
  FileText,
  ExternalLink
} from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'High' | 'Medium' | 'Low';
  targetAudience: string;
  isActive: boolean;
  actionLink?: string;
  attachmentUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AnnouncementsManagerPage() {
  const { addToast } = useAdmin();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [deleteConfirmAnnouncement, setDeleteConfirmAnnouncement] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'High' as 'High' | 'Medium' | 'Low',
    targetAudience: 'All',
    isActive: true,
    actionLink: '',
    attachmentUrl: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/announcements');
      const json = await res.json();
      if (json.success) {
        setAnnouncements(json.data || []);
      } else {
        addToast('Error', json.error || 'Failed to load announcements', 'error');
      }
    } catch (err: any) {
      console.error(err);
      addToast('Error', err.message || 'Failed connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      title: '',
      message: '',
      priority: 'High',
      targetAudience: 'All',
      isActive: true,
      actionLink: '',
      attachmentUrl: ''
    });
    setShowModal(true);
  };

  const openEditModal = (ann: Announcement) => {
    setIsEditing(true);
    setEditingId(ann.id);
    setFormData({
      title: ann.title || '',
      message: ann.message || '',
      priority: ann.priority || 'Medium',
      targetAudience: ann.targetAudience || 'All',
      isActive: ann.isActive !== false,
      actionLink: ann.actionLink || '',
      attachmentUrl: ann.attachmentUrl || ''
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.title.trim()) {
      addToast('Validation Error', 'Announcement title is required.', 'error');
      return;
    }
    if (!formData.message.trim()) {
      addToast('Validation Error', 'Message body is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && editingId) {
        // Edit existing announcement
        const res = await fetch('/api/admin/announcements', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            ...formData
          })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          addToast('Announcement Updated', `Saved changes to "${formData.title}"`, 'success');
          setShowModal(false);
          loadData();
        } else {
          addToast('Update Failed', json.error || 'Server rejected changes', 'error');
        }
      } else {
        // Create new announcement
        const res = await fetch('/api/admin/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const json = await res.json();
        if (res.ok && json.success) {
          addToast('Announcement Broadcasted', 'Notice is now live on the public website!', 'success');
          setShowModal(false);
          loadData();
        } else {
          addToast('Creation Failed', json.error || 'Server rejected announcement', 'error');
        }
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Network error submitting announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmAnnouncement) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/announcements?id=${deleteConfirmAnnouncement.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('Announcement Deleted', `Permanently removed "${deleteConfirmAnnouncement.title}"`, 'info');
        setDeleteConfirmAnnouncement(null);
        loadData();
      } else {
        addToast('Delete Failed', json.error || 'Could not delete announcement', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Network error deleting announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (ann: Announcement) => {
    try {
      const newStatus = !ann.isActive;
      const res = await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ann.id,
          isActive: newStatus
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('Status Updated', `Notice marked as ${newStatus ? 'Published (Live)' : 'Archived (Hidden)'}`, 'info');
        loadData();
      } else {
        addToast('Error', json.error || 'Failed updating status', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.message.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority =
        priorityFilter === 'all' || a.priority?.toLowerCase() === priorityFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && a.isActive !== false) ||
        (statusFilter === 'archived' && a.isActive === false);

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [announcements, searchQuery, priorityFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            CONTENT &amp; BROADCAST MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">Announcements &amp; Bulletins</h1>
          <p className="text-slate-400 text-xs">
            Broadcast urgent ticker updates, registration deadlines, and college-wide circulars.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white font-extrabold text-xs flex items-center gap-2 hover:opacity-90 cursor-pointer shadow-lg shadow-[#F98A5B]/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by announcement title or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121216] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#121216] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#121216] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-400">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published (Live)</option>
              <option value="archived">Archived (Hidden)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-[#121216] rounded-3xl border border-white/10">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">Loading announcements...</span>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-[#121216] rounded-3xl border border-white/10 space-y-2">
            <Megaphone className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-white">No announcements found</p>
            <p className="text-xs text-slate-500">
              {searchQuery || priorityFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search filters.'
                : 'Click "New Announcement" above to broadcast your first notice.'}
            </p>
          </div>
        ) : (
          filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`p-6 rounded-3xl bg-[#121216] border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                ann.isActive !== false ? 'border-white/10' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="space-y-2 flex-1 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                      ann.priority === 'High'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : ann.priority === 'Medium'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {ann.priority} Priority
                  </span>

                  <span className="text-[10px] font-mono text-slate-400">
                    Audience: {ann.targetAudience || 'All'}
                  </span>

                  {ann.createdAt && (
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ann.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  )}

                  {ann.attachmentUrl && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 font-mono px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                      <FileText className="w-2.5 h-2.5" />
                      Attachment
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-white text-base leading-snug">{ann.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{ann.message}</p>
              </div>

              {/* Status and Action Buttons */}
              <div className="shrink-0 flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(ann)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold border transition-colors cursor-pointer ${
                    ann.isActive !== false
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-slate-500/15 text-slate-400 border-slate-500/30 hover:bg-slate-500/25'
                  }`}
                  title="Click to toggle publication status"
                >
                  {ann.isActive !== false ? '● Live Published' : '○ Archived'}
                </button>

                <button
                  type="button"
                  onClick={() => setViewingAnnouncement(ann)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="View Notice Details"
                >
                  <Eye className="w-4 h-4 text-sky-400" />
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(ann)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Edit Announcement"
                >
                  <Edit3 className="w-4 h-4 text-[#F98A5B]" />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmAnnouncement(ann)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODAL: CREATE / EDIT ANNOUNCEMENT
      ═══════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {isEditing ? 'Edit Announcement' : 'Broadcast Announcement'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isEditing
                    ? 'Update announcement details and publication status.'
                    : 'Broadcast urgent notice to public website ticker and circulars.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hackathon 2026 Registration Extended"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Message Body *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide full details of the circular or notification..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as 'High' | 'Medium' | 'Low' })
                    }
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="High">High (Urgent Ticker)</option>
                    <option value="Medium">Medium (Standard Notice)</option>
                    <option value="Low">Low (Informational)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Target Audience
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="All">All Visitors &amp; Students</option>
                    <option value="Students">Registered Students Only</option>
                    <option value="Faculty">Faculty &amp; Staff</option>
                    <option value="Executive">Student Leads &amp; Operators</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Action Link / URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://... or /events/..."
                  value={formData.actionLink}
                  onChange={(e) => setFormData({ ...formData, actionLink: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-white/10">
                <FileUpload
                  label="Circular Document or Poster Attachment (Optional)"
                  value={formData.attachmentUrl}
                  onChange={(url) => setFormData({ ...formData, attachmentUrl: url })}
                  folder="announcements"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  helperText="Upload official circular (PDF) or announcement creative (JPG/PNG)"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <input
                  type="checkbox"
                  id="announcementActiveCheckbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-white/20 bg-black/40 text-[#F98A5B] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="announcementActiveCheckbox" className="text-xs text-slate-300 cursor-pointer">
                  Publish immediately (Show on public website homepage &amp; notices)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white font-extrabold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-md shadow-[#F98A5B]/20"
                >
                  {submitting
                    ? isEditing
                      ? 'Saving Changes...'
                      : 'Broadcasting...'
                    : isEditing
                    ? 'Save Changes'
                    : 'Broadcast Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: VIEW ANNOUNCEMENT DETAILS
      ═══════════════════════════════════════════════════════ */}
      {viewingAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                  viewingAnnouncement.priority === 'High'
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {viewingAnnouncement.priority} Priority
              </span>
              <button
                type="button"
                onClick={() => setViewingAnnouncement(null)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-black text-white">{viewingAnnouncement.title}</h2>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {viewingAnnouncement.message}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px] text-slate-400 font-mono">
                <div>
                  <span className="text-slate-500 block">Target Audience:</span>
                  <span className="text-white">{viewingAnnouncement.targetAudience || 'All'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Publication Date:</span>
                  <span className="text-white">
                    {viewingAnnouncement.createdAt
                      ? new Date(viewingAnnouncement.createdAt).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })
                      : '--'}
                  </span>
                </div>
              </div>

              {viewingAnnouncement.actionLink && (
                <div className="pt-2">
                  <a
                    href={viewingAnnouncement.actionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#F98A5B] hover:underline font-mono"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Action Link</span>
                  </a>
                </div>
              )}

              {viewingAnnouncement.attachmentUrl && (
                <div className="pt-2">
                  <a
                    href={viewingAnnouncement.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:underline font-mono"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Official Circular / Attachment</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const ann = viewingAnnouncement;
                  setViewingAnnouncement(null);
                  openEditModal(ann);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
              >
                Edit Notice
              </button>
              <button
                type="button"
                onClick={() => setViewingAnnouncement(null)}
                className="px-4 py-2 rounded-xl bg-white text-black font-extrabold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: CONFIRM DELETE ANNOUNCEMENT
      ═══════════════════════════════════════════════════════ */}
      {deleteConfirmAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Announcement?</h3>
                <p className="text-xs text-slate-400">This action will remove the notice permanently.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-slate-300">
              <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">Notice to Delete:</span>
              <strong className="text-white block text-sm">&ldquo;{deleteConfirmAnnouncement.title}&rdquo;</strong>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete this announcement? It will be permanently removed from the website and public ticker.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setDeleteConfirmAnnouncement(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-md shadow-rose-600/30"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
