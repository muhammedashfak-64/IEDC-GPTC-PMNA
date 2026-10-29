'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { BookOpen, Plus, Trash2, Edit3, Search, Filter, AlertTriangle, Eye, CheckCircle2 } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function BlogsManagerPage() {
  const { addToast } = useAdmin();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [deletingBlog, setDeletingBlog] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    title: '',
    excerpt: '',
    content: '',
    category: 'Innovation',
    tags: 'Robotics, IoT, Prototype',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    readTime: '4 min read',
    status: 'Published'
  };

  const [formData, setFormData] = useState(initialForm);

  const loadData = () => {
    setLoading(true);
    fetch('/api/admin/blogs')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setBlogs(json.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingBlog(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEditModal = (blog: any) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || '',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      category: blog.category || 'Innovation',
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : (blog.tags || ''),
      imageUrl: blog.imageUrl || '',
      readTime: blog.readTime || '4 min read',
      status: blog.status || 'Published'
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingBlog) {
        // UPDATE
        const res = await fetch('/api/admin/blogs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBlog.id, ...formData })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          addToast('Blog Updated', `Saved changes to "${formData.title}"`, 'success');
          setShowModal(false);
          loadData();
        } else {
          addToast('Update Failed', json.error || 'Failed to update blog article', 'error');
        }
      } else {
        // CREATE
        const res = await fetch('/api/admin/blogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const json = await res.json();
        if (res.ok && json.success) {
          addToast('Blog Published', `Published article "${formData.title}"`, 'success');
          setShowModal(false);
          loadData();
        } else {
          addToast('Publish Failed', json.error || 'Failed to publish blog article', 'error');
        }
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (blog: any) => {
    const newStatus = blog.status === 'Published' ? 'Draft' : 'Published';
    try {
      const res = await fetch('/api/admin/blogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: blog.id, status: newStatus })
      });
      if (res.ok) {
        addToast('Status Updated', `Article marked as ${newStatus}`, 'info');
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deletingBlog) return;
    try {
      const res = await fetch(`/api/admin/blogs?id=${deletingBlog.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('Article Deleted', `Deleted "${deletingBlog.title}"`, 'success');
        setDeletingBlog(null);
        loadData();
      } else {
        addToast('Delete Failed', json.error || 'Could not delete article', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const filteredBlogs = blogs.filter((b) => {
    const matchesSearch =
      b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || b.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 15 / CONTENT MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">Blogs &amp; Innovation Stories</h1>
          <p className="text-slate-400 text-xs">
            Publish technical stories, hackathon recaps, prototype showcases, and student spotlights.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Article</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles by title, excerpt, or author..."
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
            <option value="Innovation">Innovation</option>
            <option value="Technology">Technology</option>
            <option value="Hackathon">Hackathon</option>
            <option value="Startup Stories">Startup Stories</option>
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading articles...</div>
      ) : filteredBlogs.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#121216] border border-white/10 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-white text-sm font-bold">No articles found</p>
          <p className="text-slate-400 text-xs">Write a new article to share campus innovation stories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBlogs.map((b) => (
            <div key={b.id} className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white/5 relative">
                  <img src={b.imageUrl || '/college-logo.png'} alt="" className="w-full h-full object-cover" />
                  <span
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold backdrop-blur-md border ${
                      b.status === 'Published'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {b.status || 'Published'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-amber-300 font-bold uppercase">
                    {b.category} • {b.readTime || '4 min read'}
                  </span>
                  <h3 className="font-bold text-white text-base mt-1 leading-snug">{b.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">{b.excerpt}</p>
                </div>
              </div>

              {/* Actions & Author */}
              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Author: <strong className="text-white">{b.author || 'IEDC Lead'}</strong></span>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(b)}
                    className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    {b.status === 'Published' ? 'Make Draft' : 'Publish'}
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => openEditModal(b)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingBlog(b)}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                    title="Delete Article"
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
          <div className="w-full max-w-xl bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingBlog ? `Edit Article: ${editingBlog.title}` : 'Write Blog Article'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How Our Diploma Students Built an Autonomous Solar Rover"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Short Excerpt *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="1-2 sentence preview..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Full Article Body *</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Write the complete technical article, interview, or tutorial here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
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
                    <option value="Innovation">Innovation</option>
                    <option value="Technology">Technology</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Startup Stories">Startup Stories</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Estimated Read Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 5 min read"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Keywords / Tags</label>
                <input
                  type="text"
                  placeholder="e.g. Robotics, LoRa, ESP32, KSUM"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 border-t border-white/10">
                <FileUpload
                  label="Cover Feature Image"
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="blogs"
                  accept="image/jpeg,image/png,image/webp"
                  helperText="Upload official blog cover photo from your PC"
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
                  {submitting ? 'Saving...' : editingBlog ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingBlog && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Blog Article</h3>
                <span className="text-xs text-rose-400">Permanent Action</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the article{' '}
              <strong className="text-white font-bold">&quot;{deletingBlog.title}&quot;</strong>?
              This article will be completely removed from the public website.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBlog(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-lg shadow-rose-500/20"
              >
                Yes, Delete Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
