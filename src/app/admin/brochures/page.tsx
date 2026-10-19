'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { FileText, Plus, Download, Trash2, Calendar, Upload } from 'lucide-react';

export default function BrochuresManagementPage() {
  const { addToast } = useAdmin();
  const [brochures, setBrochures] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    eventId: '',
    fileUrl: '',
    fileSize: '2.1 MB'
  });

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/brochures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        addToast('Brochure Uploaded', `Brochure "${formData.title}" published.`, 'success');
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
            MODULE 09 / CONTENT MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">Event Brochures</h1>
          <p className="text-slate-400 text-xs">
            Upload schedule leaflets, competition rulebooks, and event syllabus brochures.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              eventId: events[0]?.id || '',
              fileUrl: '',
              fileSize: '2.4 MB'
            });
            setShowModal(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Brochure</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {brochures.map((bro) => (
          <div key={bro.id} className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base leading-snug">{bro.title}</h3>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span className="font-mono">{bro.fileSize}</span>
                <span>•</span>
                <span>{bro.downloads} downloads</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <a
                href={bro.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>View / Download</span>
              </a>
              <span className="text-[10px] font-mono text-slate-400">ID: {bro.id}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Upload Event Brochure</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Brochure Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Hackathon 2026 Rulebook"
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
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">File URL / Storage Link</label>
                <input
                  type="text"
                  required
                  placeholder="/brochures/hackathon-2026.pdf"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
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
                  Publish Brochure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
