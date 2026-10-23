'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import {
  Stamp,
  Plus,
  CheckCircle2,
  Eye,
  Sparkles,
  Sliders,
  ExternalLink,
  RefreshCw,
  Download,
  Image as ImageIcon,
  Trophy,
  Award,
  Trash2
} from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function CertificateTemplatesPage() {
  const { addToast } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTemplateUrl, setNewTemplateUrl] = useState('');
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [savingPresets, setSavingPresets] = useState(false);
  const [livePdfUrl, setLivePdfUrl] = useState('/api/admin/certificates/sample-preview?type=participation');
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);

  // Preview Form Controls
  const [previewName, setPreviewName] = useState('MUHAMMED ASHFAK O');
  const [certType, setCertType] = useState<'Participation' | 'Achievement'>('Participation');
  const [awardCategory, setAwardCategory] = useState('First Prize Winner');
  const [programTitle, setProgramTitle] = useState('State-Wide Drone Innovation Hackathon 2026');
  const [programDate, setProgramDate] = useState('20 October 2026');
  const [customDescription, setCustomDescription] = useState('');

  // Master Template Placement Configuration
  const [activeConfig, setActiveConfig] = useState({
    nameY: 305,
    nameFontSize: 32,
    nameColor: '#8B0000',
    paraY: 252,
    paraFontSize: 12,
    paraMaxWidth: 580,
    paraLineSpacing: 17,
    showCertId: true,
    certIdY: 45,
    subtitleY: 398,
    introY: 363,
    showPhoto: false,
    photoX: 670,
    photoY: 240,
    photoWidth: 75,
    photoHeight: 95
  });

  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templates, setTemplates] = useState<any[]>([
    {
      id: 'tpl-master-vector',
      title: 'Official IEDC Master Certificate (Vector Reference)',
      type: 'Vector PDF Master',
      pdfUrl: '/templates/reference_certificate.pdf',
      cleanUrl: '/templates/clean_master_template.pdf',
      previewPdf: '/templates/test_generated_certificate.pdf',
      isActive: true,
      description: 'Preserves exact borders, logos, Principal Abdul Kader KT & Coordinator Anuroop P signatures, and typography.'
    }
  ]);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await fetch('/api/admin/certificate-templates');
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
        setTemplates(json.data);
        const activeTpl = json.data.find((t: any) => t.isActive) || json.data[0];
        if (activeTpl?.templateConfig) {
          setActiveConfig((prev) => ({ ...prev, ...activeTpl.templateConfig }));
        }
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const activeTemplate = templates.find((t) => t.id === selectedPreviewId) || templates.find((t) => t.isActive) || templates[0];

  const handleSetActive = async (id: string) => {
    try {
      const res = await fetch('/api/admin/certificate-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTemplates((prev) => prev.map((t) => ({ ...t, isActive: t.id === id })));
        setSelectedPreviewId(id);
        const target = templates.find((t) => t.id === id);
        if (target?.templateConfig) {
          setActiveConfig((prev) => ({ ...prev, ...target.templateConfig }));
        }
        addToast('Active Template Updated & Persisted', 'The selected template is now the master template for all future certificates.', 'success');
        // Automatically regenerate preview using this template
        triggerPreviewForTemplate(target || activeTemplate);
      } else {
        throw new Error(json.error || 'Failed to update active template');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleDeleteTemplate = async (id: string, title: string) => {
    if (id === 'tpl-master-vector') {
      addToast('Protected Template', 'The official master vector certificate template cannot be deleted.', 'warning');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete template "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/certificate-templates?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('Template Deleted', `Removed "${title}" from templates list.`, 'info');
        fetchTemplates();
      } else {
        throw new Error(json.error || 'Failed to delete template');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      addToast('Validation', 'Template title is required.', 'error');
      return;
    }
    if (!newTemplateUrl) {
      addToast('Validation', 'Please upload a PDF or image template from your computer.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/certificate-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          url: newTemplateUrl,
          isActive: true,
          templateConfig: activeConfig
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('Template Uploaded', `Uploaded and activated certificate template "${newTitle.trim()}"`, 'success');
        setShowModal(false);
        const savedTpl = json.data;
        setNewTitle('');
        setNewTemplateUrl('');
        await fetchTemplates();
        if (savedTpl) {
          setSelectedPreviewId(savedTpl.id);
          triggerPreviewForTemplate(savedTpl);
        }
      } else {
        throw new Error(json.error || 'Failed saving template to database');
      }
    } catch (err: any) {
      addToast('Upload Error', err.message, 'error');
    }
  };

  const handleSavePresets = async () => {
    try {
      setSavingPresets(true);
      const targetId = activeTemplate?.id || 'tpl-master-vector';
      const res = await fetch('/api/admin/certificate-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetId,
          templateConfig: activeConfig
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('Presets Saved', `Typography & positioning presets persisted for "${activeTemplate?.title || 'Active Template'}".`, 'success');
        fetchTemplates();
      } else {
        throw new Error(json.error || 'Failed saving presets');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setSavingPresets(false);
    }
  };

  const triggerPreviewForTemplate = async (tpl: any) => {
    try {
      setGeneratingPreview(true);
      const tplUrl = tpl?.cleanUrl || tpl?.pdfUrl || tpl?.url;
      const res = await fetch('/api/admin/certificates/sample-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: previewName,
          programName: programTitle,
          programDate: programDate,
          certificateType: certType,
          awardCategory: awardCategory,
          customParagraph: customDescription || undefined,
          templateConfig: activeConfig,
          certificateTemplateUrl: tplUrl
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const cacheBusted = `${json.pdfUrl}${json.pdfUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        setLivePdfUrl(cacheBusted);
      }
    } catch (e) {
      console.warn('Silent preview generation exception:', e);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleRegeneratePreview = async () => {
    try {
      setGeneratingPreview(true);
      const res = await fetch('/api/admin/certificates/sample-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: previewName,
          programName: programTitle,
          programDate: programDate,
          certificateType: certType,
          awardCategory: awardCategory,
          customParagraph: customDescription || undefined,
          templateConfig: activeConfig,
          certificateTemplateUrl: activeTemplate?.cleanUrl || activeTemplate?.pdfUrl || activeTemplate?.url
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const cacheBusted = `${json.pdfUrl}${json.pdfUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        setLivePdfUrl(cacheBusted);
        addToast('Live Preview Refreshed', 'Preview rendered using production certificate engine.', 'success');
      } else {
        throw new Error(json.error || 'Failed generating sample preview.');
      }
    } catch (err: any) {
      addToast('Preview Error', err.message, 'error');
    } finally {
      setGeneratingPreview(false);
    }
  };

  return (
    <div className="space-y-6 min-h-screen pb-16">
      {/* Top Header */}
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#F98A5B]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Template from PC</span>
          </button>
        </div>
      </div>

      {/* Grid of Templates & Live Visual Designer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Controls & Config */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Template Selector */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Stamp className="w-4 h-4 text-[#F98A5B]" /> Master Certificate Templates
            </h2>

            <div className="space-y-3">
              {templates.map((tpl) => {
                const isSelectedForPreview = (selectedPreviewId ? selectedPreviewId === tpl.id : tpl.isActive);
                return (
                  <div
                    key={tpl.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      tpl.isActive
                        ? 'bg-[#18181E] border-emerald-500/40 shadow-xl'
                        : isSelectedForPreview
                        ? 'bg-[#15151A] border-[#F98A5B]/40 shadow-lg'
                        : 'bg-[#121216] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white text-sm">{tpl.title}</h3>
                          {tpl.isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              Active Master
                            </span>
                          )}
                          {isSelectedForPreview && !tpl.isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F98A5B]/20 text-[#F98A5B] border border-[#F98A5B]/40">
                              Currently Previewing
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{tpl.type}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreviewId(tpl.id);
                            if (tpl.templateConfig) {
                              setActiveConfig((prev) => ({ ...prev, ...tpl.templateConfig }));
                            }
                            triggerPreviewForTemplate(tpl);
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                            isSelectedForPreview
                              ? 'bg-[#F98A5B]/20 border-[#F98A5B] text-white'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                          }`}
                          title="Preview this template in the right pane"
                        >
                          <Eye className="w-3 h-3 text-[#F98A5B]" />
                          <span>Preview</span>
                        </button>

                        {!tpl.isActive && (
                          <button
                            type="button"
                            onClick={() => handleSetActive(tpl.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-300 transition-colors cursor-pointer"
                          >
                            Set Active
                          </button>
                        )}

                        {tpl.id !== 'tpl-master-vector' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(tpl.id, tpl.title)}
                            className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Delete custom template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">{tpl.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Certificate Type Selector (Type A vs Type B) */}
          <div className="glass-iedc p-5 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Certificate Type &amp; Wording Mode
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCertType('Participation')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 ${
                  certType === 'Participation'
                    ? 'bg-[#F98A5B]/20 border-[#F98A5B] text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-4 h-4 text-[#F98A5B]" />
                <span>Type A: Participation</span>
                <span className="text-[9px] text-slate-400 font-normal">Present to all attendees</span>
              </button>

              <button
                type="button"
                onClick={() => setCertType('Achievement')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 ${
                  certType === 'Achievement'
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Type B: Achievement / Winner</span>
                <span className="text-[9px] text-slate-400 font-normal">Award to prize winners</span>
              </button>
            </div>

            {certType === 'Achievement' && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-bold text-amber-300 block">
                  Award Category
                </label>
                <select
                  value={awardCategory}
                  onChange={(e) => setAwardCategory(e.target.value)}
                  className="w-full bg-[#0B0B0D] border border-white/15 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Winner / First Prize">Winner / First Prize</option>
                  <option value="Second Prize / Runner-up">Second Prize / Runner-up</option>
                  <option value="Third Prize">Third Prize</option>
                  <option value="Special Award">Special Award</option>
                  <option value="Best Technical Innovation">Best Technical Innovation</option>
                  <option value="Outstanding Contributor">Outstanding Contributor</option>
                </select>
              </div>
            )}
          </div>

          {/* 3. Dynamic Text & Positioning Controls */}
          <div className="glass-iedc p-5 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#F98A5B]" /> Visual Name &amp; Description Placement
            </h3>

            {/* Recipient Name Input */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Sample Recipient Name (Center in White Area)
              </label>
              <input
                type="text"
                value={previewName}
                onChange={(e) => setPreviewName(e.target.value)}
                className="w-full bg-[#0B0B0D] border border-white/15 focus:border-[#F98A5B] rounded-xl px-3 py-2 text-xs text-white font-bold tracking-wide"
                placeholder="e.g. MUHAMMED ASHFAK O"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Name Y-Coord (pt)</label>
                <input
                  type="number"
                  value={activeConfig.nameY}
                  onChange={(e) => setActiveConfig({ ...activeConfig, nameY: Number(e.target.value) })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Name Size (pt)</label>
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
                <label className="text-[11px] text-slate-400 block mb-1">Paragraph Y-Coord (pt)</label>
                <input
                  type="number"
                  value={activeConfig.paraY}
                  onChange={(e) => setActiveConfig({ ...activeConfig, paraY: Number(e.target.value) })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Paragraph Size (pt)</label>
                <input
                  type="number"
                  value={activeConfig.paraFontSize}
                  onChange={(e) => setActiveConfig({ ...activeConfig, paraFontSize: Number(e.target.value) })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-white"
                />
              </div>
            </div>

            {/* Custom Paragraph Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-300 font-bold block">
                  Custom Description / Appreciation Text
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Exact Case Preserved
                </span>
              </div>
              <textarea
                rows={3}
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl p-3 text-xs text-white"
                placeholder={certType === 'Achievement' ? 'In recognition of your outstanding achievement and winning performance in...' : 'In recognition of your outstanding participation and dedication in...'}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Leave empty to use official template sentence, or type custom sentence with original capitalization preserved.
              </p>
            </div>

            {/* Optional Photo Toggle */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                <input
                  type="checkbox"
                  checked={activeConfig.showPhoto}
                  onChange={(e) => setActiveConfig({ ...activeConfig, showPhoto: e.target.checked })}
                  className="rounded border-white/20 text-[#F98A5B] focus:ring-0"
                />
                <span className="font-bold">Include Optional Recipient Photo</span>
              </label>
              <p className="text-[10px] text-slate-400">
                Disabled by default. Only enable if this certificate template features a photo designated box.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={generatingPreview}
                onClick={handleRegeneratePreview}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white font-bold text-xs shadow-md shadow-[#F98A5B]/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generatingPreview ? 'animate-spin' : ''}`} />
                <span>{generatingPreview ? 'Rendering Sample...' : 'Regenerate Live Preview'}</span>
              </button>

              <button
                type="button"
                disabled={savingPresets}
                onClick={handleSavePresets}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{savingPresets ? 'Saving...' : 'Save Presets'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Live Master PDF Canvas Preview */}
        <div className="lg:col-span-7 space-y-3 sticky top-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F98A5B]" /> Production PDF Engine Preview
            </span>
            <div className="flex items-center gap-3">
              <a
                href={livePdfUrl}
                download={`IEDC_Sample_Certificate_${previewName.replace(/\s+/g, '_')}.pdf`}
                className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download Sample PDF
              </a>
              <a
                href={livePdfUrl}
                target="_blank"
                className="text-xs font-bold text-[#F98A5B] hover:underline flex items-center gap-1"
              >
                Fullscreen <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="aspect-[1.414/1] w-full min-h-[420px] rounded-2xl border border-white/15 bg-neutral-900/60 overflow-hidden shadow-2xl relative">
            <iframe
              src={`${livePdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0 pointer-events-auto"
              title="Official Master Certificate"
            />
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            This preview is generated by the identical vector engine that delivers certificates to students upon verification.
          </p>
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
