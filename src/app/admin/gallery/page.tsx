'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Image as ImageIcon, Plus, Trash2, Eye, CheckCircle2, Upload, Tag, Filter } from 'lucide-react';

export default function GalleryManagementPage() {
  const { addToast } = useAdmin();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    albumName: 'Hackathon 2026',
    mediaUrl: '',
    caption: '',
    altText: '',
    isCover: false,
    status: 'Published'
  });

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        addToast('Photo Uploaded', `Added "${formData.title}" to ${formData.albumName}`, 'success');
        setShowModal(false);
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gallery photo?')) return;
    try {
      const res = await fetch(`/api/admin/gallery?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Deleted', 'Photo removed from album.', 'info');
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const albums = Array.from(new Set(items.map((i) => i.albumName).filter(Boolean)));
  const filtered = items.filter((i) => selectedAlbum === 'All' || i.albumName === selectedAlbum);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 10 / CONTENT MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">Gallery Manager</h1>
          <p className="text-slate-400 text-xs">
            Organize event-based photo albums, add image captions, alt text, cover photos, and toggle public visibility.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              albumName: 'Hackathon 2026',
              mediaUrl: '',
              caption: '',
              altText: '',
              isCover: false,
              status: 'Published'
            });
            setShowModal(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Image</span>
        </button>
      </div>

      {/* Album Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedAlbum('All')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
            selectedAlbum === 'All' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          All Albums ({items.length})
        </button>
        {albums.map((alb) => (
          <button
            key={alb}
            onClick={() => setSelectedAlbum(alb)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
              selectedAlbum === alb ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            {alb} ({items.filter((i) => i.albumName === alb).length})
          </button>
        ))}
      </div>

      {/* Photo Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div key={item.id} className="p-4 rounded-3xl bg-[#121216] border border-white/10 space-y-3">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group">
              <img
                src={item.mediaUrl}
                alt={item.altText || item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-white border border-white/20">
                  {item.albumName}
                </span>
                {item.isCover && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/80 text-[9px] font-mono font-bold text-black">
                    COVER
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">{item.title}</h4>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{item.caption}</p>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <button
                onClick={() => handleTogglePublish(item)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border cursor-pointer ${
                  item.status === 'Published'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                }`}
              >
                {item.status === 'Published' ? 'Published' : 'Draft'}
              </button>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                title="Delete Photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Upload Gallery Image</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Photo Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IoT Hackathon Winning Presentation"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Album Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hackathon 2026 or IoT Bootcamp"
                  value={formData.albumName}
                  onChange={(e) => setFormData({ ...formData, albumName: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Image URL / Storage Path</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/... or /campus-main.jpeg"
                  value={formData.mediaUrl}
                  onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Caption</label>
                <textarea
                  rows={2}
                  placeholder="Description of the moment..."
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="coverCheck"
                  checked={formData.isCover}
                  onChange={(e) => setFormData({ ...formData, isCover: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="coverCheck" className="text-slate-300 cursor-pointer">
                  Set as album cover photo
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 font-extrabold"
                >
                  Upload &amp; Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
