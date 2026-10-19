'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { BookOpen, Plus, Trash2, Edit3, Eye, CheckCircle2 } from 'lucide-react';

export default function BlogsManagerPage() {
  const { addToast } = useAdmin();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Innovation',
    tags: 'Robotics, IoT, Prototype',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    readTime: '4 min read'
  });

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        addToast('Blog Published', `Published article "${formData.title}"`, 'success');
        setShowModal(false);
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 15 / CONTENT MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">Blogs &amp; Innovation Stories</h1>
          <p className="text-slate-400 text-xs">
            Publish technical stories, hackathon recaps, and student prototype spotlights.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              excerpt: '',
              content: '',
              category: 'Innovation',
              tags: 'IoT, Prototype, Hackathon',
              imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
              readTime: '4 min read'
            });
            setShowModal(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Article</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {blogs.map((b) => (
          <div key={b.id} className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="aspect-video rounded-2xl overflow-hidden border border-white/10">
                <img src={b.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-300 font-bold uppercase">{b.category} • {b.readTime}</span>
                <h3 className="font-bold text-white text-base mt-1">{b.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">{b.excerpt}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>Author: <strong className="text-white">{b.author}</strong></span>
              <span className="text-[10px] font-mono">{b.status}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Write Blog Article</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Article Title</label>
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
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Short Excerpt</label>
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
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Article Content (Markdown supported)</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Write the full story..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-3 text-xs text-white leading-relaxed font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-white text-black font-extrabold">
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
