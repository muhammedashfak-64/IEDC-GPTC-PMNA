'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { FileText, Plus, Download, Trash2, Edit3, Search, Calendar, AlertTriangle } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function BrochuresManagementPage() {
  const { addToast } = useAdmin();
  const [brochures, setBrochures] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingBrochure, setEditingBrochure] = useState<any>(null);
  const [deletingBrochure, setDeletingBrochure] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    title: '',
    eventId: '',
    fileUrl: '',
    fileSize: '2.1 MB'
  };

  const [formData, setFormData] = useState(initialForm);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/brochures').then((r) => r.json()),
      fetch('/api/admin/events').then((r) => r.json())
    ])
      .then(([broJson, evtJson]) => {
        if (broJson.success) setBrochures(broJson.data || []);
        if (evtJson.success) setEvents(evtJson.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingBrochure(null);
    setFormData({
      title: '',
      eventId: events[0]?.id || '',
      fileUrl: '',
      fileSize: '2.4 MB'
    });
    setShowModal(true);
  };

  const openEditModal = (bro: any) => {
    setEditingBrochure(bro);
    setFormData({
      title: bro.title || '',
      eventId: bro.eventId || events[0]?.id || '',
      fileUrl: bro.fileUrl || '',
      fileSize: bro.fileSize || '2.1 MB'
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fileUrl) {
      addToast('Document Required', 'Please upload a PDF or document brochure.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingBrochure) {
        // UPDATE
        const res = await fetch('/api/admin/brochures', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBrochure.id, ...formData })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          addToast('Brochure Updated', `Saved changes to "${formData.title}"`, 'success');
          setShowModal(false);
          loadData();
        } else {
          addToast('Update Failed', json.error || 'Failed to update brochure', 'error');
        }
      } else {
        // CREATE
        const res = await fetch('/api/admin/brochures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const json = await res.json();
        if (res.ok && json.success) {
          addToast('Brochure Uploaded', `Brochure "${formData.title}" published.`, 'success');
          setShowModal(false);
          loadData();
        } else {
          addToast('Upload Failed', json.error || 'Failed to upload brochure', 'error');
        }
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingBrochure) return;
    try {
      const res = await fetch(`/api/admin/brochures?id=${deletingBrochure.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('Brochure Deleted', `Deleted "${deletingBrochure.title}"`, 'success');
        setDeletingBrochure(null);
        loadData();
      } else {
        addToast('Delete Failed', json.error || 'Could not delete brochure', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const filteredBrochures = brochures.filter((bro) =>
    bro.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 09 / CONTENT MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">Event Brochures &amp; Rulebooks</h1>
          <p className="text-slate-400 text-xs">
            Upload schedule leaflets, competition rulebooks, problem statements, and event syllabus brochures.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Brochure</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search brochures by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#121216] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Brochures Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading brochures...</div>
      ) : filteredBrochures.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#121216] border border-white/10 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-white text-sm font-bold">No brochures found</p>
          <p className="text-slate-400 text-xs">Upload an event schedule, rulebook, or leaflet to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBrochures.map((bro) => {
            const matchedEvent = events.find((e) => e.id === bro.eventId);
            return (
              <div key={bro.id} className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                      {bro.fileSize || 'PDF'}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base leading-snug">{bro.title}</h3>

                  {matchedEvent && (
                    <div className="text-[11px] text-amber-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{matchedEvent.title}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{bro.downloads || 0} downloads</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <a
                    href={bro.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>View</span>
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(bro)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingBrochure(bro)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                      title="Delete Brochure"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingBrochure ? `Edit Brochure: ${editingBrochure.title}` : 'Upload Event Brochure'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Brochure Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Hackathon 2026 Rulebook & Guidelines"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Target Event</label>
                <select
                  value={formData.eventId}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">General Brochure (No Specific Event)</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">File Size Tag</label>
                <input
                  type="text"
                  placeholder="e.g. 2.4 MB"
                  value={formData.fileSize}
                  onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <FileUpload
                label="Event Brochure Document (PDF / DOCX)"
                value={formData.fileUrl}
                onChange={(url) => setFormData({ ...formData, fileUrl: url })}
                folder="documents"
                isDocument={true}
                accept=".pdf,.docx,.doc"
                helperText="Upload official PDF brochure or leaflet from your PC"
                required={true}
              />

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingBrochure ? 'Update Brochure' : 'Publish Brochure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingBrochure && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Brochure</h3>
                <span className="text-xs text-rose-400">Permanent Action</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the brochure{' '}
              <strong className="text-white font-bold">&quot;{deletingBrochure.title}&quot;</strong>?
              Students will no longer be able to download this document.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBrochure(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-lg shadow-rose-500/20"
              >
                Yes, Delete Brochure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
