'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { GraduationCap, Plus, Download, FileText, Trash2, Edit3, Search, Filter, AlertTriangle } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function ResourcesManagerPage() {
  const { addToast } = useAdmin();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [deletingResource, setDeletingResource] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    title: '',
    category: 'Embedded Systems',
    fileType: 'PDF',
    description: '',
    fileUrl: '',
    fileSize: '3.2 MB',
    status: 'Published'
  };

  const [formData, setFormData] = useState(initialForm);

  const loadData = () => {
    setLoading(true);
    fetch('/api/admin/resources')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setResources(json.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingResource(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEditModal = (res: any) => {
    setEditingResource(res);
    setFormData({
      title: res.title || '',
      category: res.category || 'Embedded Systems',
      fileType: res.fileType || 'PDF',
      description: res.description || '',
      fileUrl: res.fileUrl || '',
      fileSize: res.fileSize || '3.2 MB',
      status: res.status || 'Published'
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fileUrl) {
      addToast('File Required', 'Please upload a resource document file.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingResource) {
        // UPDATE
        const res = await fetch('/api/admin/resources', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingResource.id, ...formData })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          addToast('Resource Updated', `Saved changes to "${formData.title}"`, 'success');
          setShowModal(false);
          loadData();
        } else {
          addToast('Update Failed', json.error || 'Failed to update resource', 'error');
        }
      } else {
        // CREATE
        const res = await fetch('/api/admin/resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const json = await res.json();
        if (res.ok && json.success) {
          addToast('Resource Uploaded', `Published "${formData.title}"`, 'success');
          setShowModal(false);
          loadData();
        } else {
          addToast('Upload Failed', json.error || 'Failed to upload resource', 'error');
        }
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingResource) return;
    try {
      const res = await fetch(`/api/admin/resources?id=${deletingResource.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('Deleted', `Removed "${deletingResource.title}"`, 'success');
        setDeletingResource(null);
        loadData();
      } else {
        addToast('Delete Failed', json.error || 'Could not delete resource', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || res.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 14 / INNOVATION &amp; ACADEMICS
          </span>
          <h1 className="text-2xl font-black text-white">Learning Resources &amp; Notes</h1>
          <p className="text-slate-400 text-xs">
            Upload workshop study materials, ESP32 documentation, IEEE conference templates, and student pitch kits.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Learning Resource</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search learning materials by title or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121216] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#121216] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Embedded Systems">Embedded Systems</option>
            <option value="Startup Templates">Startup Templates</option>
            <option value="Robotics & IoT">Robotics &amp; IoT</option>
            <option value="Software & AI">Software &amp; AI</option>
          </select>
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading resources...</div>
      ) : filteredResources.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#121216] border border-white/10 text-center space-y-3">
          <GraduationCap className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-white text-sm font-bold">No learning resources found</p>
          <p className="text-slate-400 text-xs">Upload study notes, templates, or circuit schematics to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <div key={res.id} className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300">
                    {res.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{res.fileSize || 'PDF'}</span>
                </div>

                <h3 className="font-bold text-white text-base leading-snug">{res.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{res.description}</p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <a
                  href={res.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(res)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingResource(res)}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                    title="Delete Resource"
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingResource ? `Edit Resource: ${editingResource.title}` : 'Upload Learning Material'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FreeRTOS & MQTT Manual"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Embedded Systems">Embedded Systems</option>
                    <option value="Startup Templates">Startup Templates</option>
                    <option value="Robotics & IoT">Robotics &amp; IoT</option>
                    <option value="Software & AI">Software &amp; AI</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">File Type</label>
                  <select
                    value={formData.fileType}
                    onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="PDF">PDF</option>
                    <option value="PPT">PPT</option>
                    <option value="ZIP">ZIP</option>
                    <option value="Code">Code</option>
                  </select>
                </div>
              </div>

              <FileUpload
                label="Resource Document File"
                value={formData.fileUrl}
                onChange={(url) => setFormData({ ...formData, fileUrl: url })}
                folder="resources"
                isDocument={true}
                accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.zip,.pptx"
                helperText="Upload official PDF notes, templates, or spreadsheets from your PC"
                required={true}
              />

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Brief Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

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
                  {submitting ? 'Saving...' : editingResource ? 'Update Resource' : 'Upload Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingResource && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Learning Resource</h3>
                <span className="text-xs text-rose-400">Permanent Action</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the learning resource{' '}
              <strong className="text-white font-bold">&quot;{deletingResource.title}&quot;</strong>?
              This note will be permanently removed from student access.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingResource(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-lg shadow-rose-500/20"
              >
                Yes, Delete Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
