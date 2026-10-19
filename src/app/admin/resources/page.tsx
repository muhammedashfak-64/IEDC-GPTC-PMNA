'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { GraduationCap, Plus, Download, FileText, Trash2, Eye } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function ResourcesManagerPage() {
  const { addToast } = useAdmin();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Embedded Systems',
    fileType: 'PDF',
    description: '',
    fileUrl: '',
    fileSize: '3.2 MB'
  });

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        addToast('Resource Uploaded', `Published "${formData.title}"`, 'success');
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
            MODULE 14 / INNOVATION &amp; ACADEMICS
          </span>
          <h1 className="text-2xl font-black text-white">Learning Resources &amp; Notes</h1>
          <p className="text-slate-400 text-xs">
            Upload workshop study materials, ESP32 documentation, IEEE conference templates, and student pitch kits.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              category: 'Embedded Systems',
              fileType: 'PDF',
              description: '',
              fileUrl: '',
              fileSize: '3.5 MB'
            });
            setShowModal(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Learning Resource</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((res) => (
          <div key={res.id} className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300">
                  {res.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{res.fileSize}</span>
              </div>

              <h3 className="font-bold text-white text-base leading-snug">{res.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{res.description}</p>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">{res.views || 0} student views</span>
              <a
                href={res.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Upload Learning Material</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Resource Title</label>
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
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-white text-black font-extrabold">
                  Upload Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
