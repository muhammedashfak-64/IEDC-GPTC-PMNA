'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Image as ImageIcon, Plus, Trash2, Edit3, Eye, CheckCircle2, Upload, Tag, Filter, AlertTriangle } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function GalleryManagementPage() {
  const { addToast } = useAdmin();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    title: '',
    albumName: 'Hackathon 2026',
    mediaUrl: '',
    caption: '',
    altText: '',
    isCover: false,
    status: 'Published'
  };

  const [formData, setFormData] = useState(initialForm);

  const loadData = () => {
    setLoading(true);
    fetch('/api/admin/gallery')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setItems(json.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      albumName: item.albumName || 'General',
      mediaUrl: item.mediaUrl || '',
      caption: item.caption || '',
      altText: item.altText || '',
      isCover: item.isCover || false,
      status: item.status || 'Published'
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mediaUrl) {
      addToast('Image Required', 'Please upload a photo.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        // UPDATE
        const res = await fetch('/api/admin/gallery', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...formData })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          addToast('Photo Updated', `Saved changes to "${formData.title}"`, 'success');
          setShowModal(false);
          loadData();
        } else {
          addToast('Update Failed', json.error || 'Failed to update photo', 'error');
        }
      } else {
        // CREATE
        const res = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const json = await res.json();
        if (res.ok && json.success) {
          addToast('Photo Uploaded', `Added "${formData.title}" to ${formData.albumName}`, 'success');
          setShowModal(false);
          loadData();
        } else {
          addToast('Upload Failed', json.error || 'Failed to upload photo', 'error');
        }
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (item: any) => {
    const newStatus = item.status === 'Published' ? 'Draft' : 'Published';
    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: newStatus })
      });
      if (res.ok) {
        addToast('Status Updated', `Photo marked as ${newStatus}`, 'info');
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    try {
      const res = await fetch(`/api/admin/gallery?id=${deletingItem.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('Photo Deleted', `Removed "${deletingItem.title || 'Photo'}" from album`, 'success');
        setDeletingItem(null);
        loadData();
      } else {
        addToast('Delete Failed', json.error || 'Could not delete photo', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const albums = Array.from(new Set(items.map((i) => i.albumName).filter(Boolean)));
  const filtered = items.filter((i) => {
    const matchesAlbum = selectedAlbum === 'All' || i.albumName === selectedAlbum;
    const matchesSearch =
      (i.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.caption || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAlbum && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 10 / CONTENT MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">Gallery Manager</h1>
          <p className="text-slate-400 text-xs">
            Organize event photo albums, update image captions, cover photos, and toggle public visibility.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Image</span>
        </button>
      </div>

      {/* Album Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <button
            onClick={() => setSelectedAlbum('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedAlbum === 'All'
                ? 'bg-white text-black'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            All Photos ({items.length})
          </button>
          {albums.map((alb) => (
            <button
              key={alb}
              onClick={() => setSelectedAlbum(alb)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedAlbum === alb
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              {alb}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filter by caption or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Photo Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading photos...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#121216] border border-white/10 text-center space-y-3">
          <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-white text-sm font-bold">No photos in this album</p>
          <p className="text-slate-400 text-xs">Upload photos to showcase your events.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-[#121216] flex flex-col justify-between">
              <div className="aspect-square relative overflow-hidden bg-white/5">
                <img
                  src={item.mediaUrl}
                  alt={item.altText || item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  {item.isCover && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500 text-black">
                      Cover
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold backdrop-blur-md border ${
                      item.status === 'Published'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="p-3 space-y-2">
                <h4 className="font-bold text-white text-xs truncate">{item.title || item.albumName}</h4>
                {item.caption && <p className="text-[11px] text-slate-400 line-clamp-1">{item.caption}</p>}

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(item)}
                    className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    {item.status === 'Published' ? 'Unpublish' : 'Publish'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                      title="Edit Photo"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingItem(item)}
                      className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                {editingItem ? `Edit Photo: ${editingItem.title}` : 'Upload Gallery Photo'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Photo Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winner Felicitation Ceremony"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Album Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hackathon 2026, Robowars"
                  value={formData.albumName}
                  onChange={(e) => setFormData({ ...formData, albumName: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Caption</label>
                <textarea
                  rows={2}
                  placeholder="Short description of the moment..."
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <FileUpload
                label="Photo Image File"
                value={formData.mediaUrl}
                onChange={(url) => setFormData({ ...formData, mediaUrl: url })}
                folder="gallery"
                accept="image/jpeg,image/png,image/webp"
                helperText="Upload official event photo from your PC"
                required={true}
              />

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="coverCheckbox"
                  checked={formData.isCover}
                  onChange={(e) => setFormData({ ...formData, isCover: e.target.checked })}
                  className="rounded border-white/20 bg-[#18181D] text-amber-500"
                />
                <label htmlFor="coverCheckbox" className="text-xs text-slate-300 cursor-pointer">
                  Set as Album Cover Photo
                </label>
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
                  {submitting ? 'Saving...' : editingItem ? 'Update Photo' : 'Upload Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Photo</h3>
                <span className="text-xs text-rose-400">Permanent Action</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete the photo{' '}
              <strong className="text-white font-bold">&quot;{deletingItem.title || 'Untitled Photo'}&quot;</strong>{' '}
              from album <span className="text-amber-300 font-mono">{deletingItem.albumName}</span>?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-lg shadow-rose-500/20"
              >
                Yes, Delete Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
