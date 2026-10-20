'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Stamp, Plus, CheckCircle2, Eye, Sparkles, Sliders, ExternalLink, RefreshCw } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function CertificateTemplatesPage() {
  const { addToast } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTemplateUrl, setNewTemplateUrl] = useState('');
  const [previewName, setPreviewName] = useState('MUHAMMED ASHFAK O');

  // Master Template Settings
  const [activeConfig, setActiveConfig] = useState({
    nameY: 305,
    nameFontSize: 34,
    nameColor: '#8B0000',
    paraY: 252,
    paraFontSize: 12.5,
    paraMaxWidth: 580,
    paraLineSpacing: 18,
    showCertId: true,
    certIdY: 45
  });

  const [templates, setTemplates] = useState<any[]>([
    {
      id: 'tpl-master-3d',
      title: 'Official IEDC Master Participation Certificate (ADARSH P Reference)',
      type: 'Vector PDF Master',
      pdfUrl: '/templates/reference_certificate.pdf',
      cleanUrl: '/templates/clean_master_template.pdf',
      previewPdf: '/templates/test_generated_certificate.pdf',
      isActive: true,
      description: 'Preserves exact borders, logos, Principal Abdul Kader KT & Coordinator Anuroop P signatures, and typography.'
    },
    {
      id: 'tpl-002',
      title: 'Innovation Bootcamps & Hackathons Template',
      type: 'Custom Background',
      pdfUrl: '/templates/clean_master_template.pdf',
      cleanUrl: '/templates/clean_master_template.pdf',
      previewPdf: '/templates/test_generated_certificate.pdf',
      isActive: false,
      description: 'Alternative layout for state-level competitions and hackathon prize winners.'
    }
  ]);

  const handleSetActive = (id: string) => {
    setTemplates((prev) => prev.map((t) => ({ ...t, isActive: t.id === id })));
    addToast('Active Template Updated', 'success');
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      addToast('Template title is required.', 'error');
      return;
    }
    if (!newTemplateUrl) {
      addToast('Please upload a PDF or image template from your computer.', 'error');
      return;
    }

    const newTpl = {
      id: `tpl-${Date.now()}`,
      title: newTitle.trim(),
      type: newTemplateUrl.endsWith('.pdf') ? 'PDF Master' : 'Image Master',
      pdfUrl: newTemplateUrl,
      cleanUrl: newTemplateUrl,
      previewPdf: newTemplateUrl,
      isActive: false,
      description: 'Custom uploaded reference certificate design.'
    };

    setTemplates([newTpl, ...templates]);
    setShowModal(false);
    setNewTitle('');
    setNewTemplateUrl('');
    addToast(`Uploaded certificate template "${newTpl.title}"`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F98A5B] uppercase tracking-widest block mb-1">
            MODULE 08 / CERTIFICATE TEMPLATE MANAGER
          </span>
          <h1 className="text-2xl font-black text-white">Certificate Template Manager</h1>
          <p className="text-slate-400 text-xs">
            Manage the official certificate vector templates, visual coordinate positioning, and typography presets.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#F98A5B]/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Template from PC</span>
        </button>
      </div>

      {/* Grid of Templates & Live Visual Designer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Stamp className="w-4 h-4 text-[#F98A5B]" /> Configured Certificate Templates
          </h2>

          <div className="space-y-3">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  tpl.isActive
                    ? 'bg-[#18181E] border-emerald-500/40 shadow-xl'
                    : 'bg-[#121216] border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">{tpl.title}</h3>
                      {tpl.isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          Active Master
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{tpl.type}</span>
                  </div>

                  {!tpl.isActive && (
                    <button
                      onClick={() => handleSetActive(tpl.id)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300"
                    >
                      Set Active
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-400">{tpl.description}</p>

                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <a
                    href={tpl.previewPdf || tpl.pdfUrl}
                    target="_blank"
                    className="text-xs font-mono text-[#F98A5B] hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View PDF Reference
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Positioning Sliders */}
          <div className="glass-iedc p-4 rounded-2xl border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#F98A5B]" /> Visual Name & Paragraph Placement
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Name Y-Coord (pt)</label>
                <input
                  type="number"
                  value={activeConfig.nameY}
                  onChange={(e) => setActiveConfig({ ...activeConfig, nameY: Number(e.target.value) })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Name Size (pt)</label>
                <input
                  type="number"
                  value={activeConfig.nameFontSize}
                  onChange={(e) => setActiveConfig({ ...activeConfig, nameFontSize: Number(e.target.value) })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Paragraph Y-Coord (pt)</label>
                <input
                  type="number"
                  value={activeConfig.paraY}
                  onChange={(e) => setActiveConfig({ ...activeConfig, paraY: Number(e.target.value) })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Paragraph Size (pt)</label>
                <input
                  type="number"
                  value={activeConfig.paraFontSize}
                  onChange={(e) => setActiveConfig({ ...activeConfig, paraFontSize: Number(e.target.value) })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-xs">Test Sample Recipient Name</label>
              <input
                type="text"
                value={previewName}
                onChange={(e) => setPreviewName(e.target.value)}
                className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white uppercase font-bold"
              />
            </div>

            <button
              onClick={() => {
                addToast('Template configuration saved for all programs', 'success');
              }}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
            >
              Save Configuration Presets
            </button>
          </div>
        </div>

        {/* Live Master PDF Canvas Preview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F98A5B]" /> Master Certificate Vector Render
            </span>
            <a
              href="/templates/test_generated_certificate.pdf"
              target="_blank"
              className="text-xs font-bold text-[#F98A5B] hover:underline flex items-center gap-1"
            >
              Open Fullscreen <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="aspect-[1.414/1] w-full rounded-2xl border border-white/15 bg-white/5 overflow-hidden shadow-2xl relative">
            <iframe
              src="/templates/test_generated_certificate.pdf#toolbar=0&navpanes=0&scrollbar=0"
              className="w-full h-full border-0"
              title="Official Master Certificate"
            />
          </div>
        </div>
      </div>

      {/* Upload Custom Template Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="glass-iedc p-6 rounded-2xl border border-white/10 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold text-white">Upload Certificate Template from PC</h3>

            <form onSubmit={handleAddTemplate} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Template Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Bootcamp Participation Certificate"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Upload Template File (PDF, PNG, JPG)
                </label>
                <FileUpload
                  label="Certificate Template File"
                  value={newTemplateUrl}
                  onChange={(url) => setNewTemplateUrl(url)}
                  folder="certificate-templates"
                  accept="application/pdf,image/png,image/jpeg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white text-xs font-bold"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
