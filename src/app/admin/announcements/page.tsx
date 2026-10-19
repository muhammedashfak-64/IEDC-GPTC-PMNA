'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Megaphone, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function AnnouncementsManagerPage() {
  const { addToast } = useAdmin();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'High',
    targetAudience: 'All',
    attachmentUrl: ''
  });

  const loadData = () => {
    setLoading(true);
    fetch('/api/admin/announcements')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setAnnouncements(json.data || []);
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
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        addToast('Announcement Broadcasted', 'Notice is now live on the public website!', 'success');
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
            MODULE 16 / CONTENT MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">Announcements &amp; Bulletins</h1>
          <p className="text-slate-400 text-xs">
            Broadcast urgent ticker updates, registration deadlines, and college-wide circulars.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              message: '',
              priority: 'High',
              targetAudience: 'All',
              attachmentUrl: ''
            });
            setShowModal(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map((ann) => (
          <div key={ann.id} className="p-6 rounded-3xl bg-[#121216] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                    ann.priority === 'High'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {ann.priority} Priority
                </span>
                <span className="text-[10px] font-mono text-slate-400">Audience: {ann.targetAudience}</span>
              </div>
              <h3 className="font-bold text-white text-base leading-snug">{ann.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{ann.message}</p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-bold">
                Live Active
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Broadcast Announcement</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hackathon 2026 Registration Extended"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Message Body</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Details of the announcement..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="All">All Visitors &amp; Students</option>
                    <option value="Faculty">Faculty Only</option>
                    <option value="Executive">Student Leads Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <FileUpload
                  label="Announcement Banner or Attachment (Optional)"
                  value={formData.attachmentUrl || ''}
                  onChange={(url) => setFormData({ ...formData, attachmentUrl: url })}
                  folder="announcements"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  helperText="Upload circular poster (JPG/PNG) or official notice (PDF) from your PC"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-white text-black font-extrabold">
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
