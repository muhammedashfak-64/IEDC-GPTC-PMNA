'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Rocket, Plus, ExternalLink, Trash2, Edit3, Search, Filter, AlertTriangle, Eye, CheckCircle2 } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function StartupsManagerPage() {
  const { addToast } = useAdmin();
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('All');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingStartup, setEditingStartup] = useState<any>(null);
  const [deletingStartup, setDeletingStartup] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    name: '',
    tagline: '',
    description: '',
    founders: '',
    department: 'Electronics Engineering',
    stage: 'Incubated',
    fundingAmount: '₹2,00,000 YIP Grant',
    logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300&auto=format&fit=crop&q=80',
    website: '',
    status: 'Published'
  };

  const [formData, setFormData] = useState(initialForm);

  const loadData = () => {
    setLoading(true);
    fetch('/api/admin/startups')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStartups(json.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingStartup(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEditModal = (st: any) => {
    setEditingStartup(st);
    setFormData({
      name: st.name || '',
      tagline: st.tagline || '',
      description: st.description || '',
      founders: Array.isArray(st.founders) ? st.founders.join(', ') : (st.founders || ''),
      department: st.department || 'Electronics Engineering',
      stage: st.stage || 'Incubated',
      fundingAmount: st.fundingAmount || '',
      logoUrl: st.logoUrl || '',
      website: st.website || '',
      status: st.status || 'Published'
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingStartup) {
        // UPDATE existing record
        const res = await fetch('/api/admin/startups', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingStartup.id, ...formData })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          addToast('Startup Updated', `Saved changes to "${formData.name}"`, 'success');
          setShowModal(false);
          loadData();
        } else {
          addToast('Update Failed', json.error || 'Failed to update startup', 'error');
        }
      } else {
        // CREATE new record
        const res = await fetch('/api/admin/startups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const json = await res.json();
        if (res.ok && json.success) {
          addToast('Startup Added', `Added startup "${formData.name}"`, 'success');
          setShowModal(false);
          loadData();
        } else {
          addToast('Create Failed', json.error || 'Failed to add startup', 'error');
        }
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (st: any) => {
    const newStatus = st.status === 'Published' ? 'Draft' : 'Published';
    try {
      const res = await fetch('/api/admin/startups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: st.id, status: newStatus })
      });
      if (res.ok) {
        addToast('Status Updated', `"${st.name}" marked as ${newStatus}`, 'info');
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deletingStartup) return;
    try {
      const res = await fetch(`/api/admin/startups?id=${deletingStartup.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('Startup Deleted', `Deleted "${deletingStartup.name}"`, 'success');
        setDeletingStartup(null);
        loadData();
      } else {
        addToast('Delete Failed', json.error || 'Could not delete startup', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const filteredStartups = startups.filter((st) => {
    const matchesSearch =
      st.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.tagline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(st.founders) ? st.founders.join(' ') : st.founders || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'All' || st.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 13 / INNOVATION &amp; ACADEMICS
          </span>
          <h1 className="text-2xl font-black text-white">Startups Incubator Manager</h1>
          <p className="text-slate-400 text-xs">
            Manage student-founded startups, seed funding grants received, incubator progress, and live product URLs.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Incubated Startup</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search startups by name, tagline, or founder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121216] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-[#121216] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
          >
            <option value="All">All Stages</option>
            <option value="Ideation">Ideation</option>
            <option value="Incubated">Incubated</option>
            <option value="MVP / Prototype">MVP / Prototype</option>
            <option value="Funded">Funded</option>
            <option value="Graduated">Graduated</option>
          </select>
        </div>
      </div>

      {/* Startups Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading startups...</div>
      ) : filteredStartups.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#121216] border border-white/10 text-center space-y-3">
          <Rocket className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-white text-sm font-bold">No startups found</p>
          <p className="text-slate-400 text-xs">Try adjusting your search or add a new incubated startup.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStartups.map((st) => (
            <div key={st.id} className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={st.logoUrl || '/college-logo.png'}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover border border-white/10 bg-white/5 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base">{st.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                            st.status === 'Published'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {st.status || 'Published'}
                        </span>
                      </div>
                      <p className="text-xs text-amber-300 font-medium">{st.tagline}</p>
                      <span className="text-[10px] font-mono text-slate-400">{st.fundingAmount || 'Grant Stage'}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300 shrink-0">
                    {st.stage}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{st.description}</p>

                <div className="pt-2 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 border-t border-white/5">
                  <span>Founders: <strong className="text-slate-200">{Array.isArray(st.founders) ? st.founders.join(', ') : st.founders}</strong></span>
                  {st.website && (
                    <a href={st.website} target="_blank" rel="noreferrer" className="text-white hover:text-amber-300 flex items-center gap-1">
                      <span>Website</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(st)}
                  className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  {st.status === 'Published' ? 'Unpublish (Draft)' : 'Publish Live'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(st)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingStartup(st)}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                    title="Delete Startup"
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
          <div className="w-full max-w-lg bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingStartup ? `Edit Startup: ${editingStartup.name}` : 'Add Incubated Startup'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Company / Startup Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AgriTech Automation Systems"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Tagline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IoT Precision Irrigation for Spice Farms"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Founders *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fathima Riya, Rahul V"
                    value={formData.founders}
                    onChange={(e) => setFormData({ ...formData, founders: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Ideation">Ideation</option>
                    <option value="Incubated">Incubated</option>
                    <option value="MVP / Prototype">MVP / Prototype</option>
                    <option value="Funded">Funded</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Grant / Funding</label>
                  <input
                    type="text"
                    placeholder="₹2,00,000 YIP Grant"
                    value={formData.fundingAmount}
                    onChange={(e) => setFormData({ ...formData, fundingAmount: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://startup.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <FileUpload
                  label="Startup Brand Logo / Image"
                  value={formData.logoUrl}
                  onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                  folder="startups"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  helperText="Upload official startup logo or prototype photo from your PC"
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
                  {submitting ? 'Saving...' : editingStartup ? 'Update Startup' : 'Save Startup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingStartup && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Startup</h3>
                <span className="text-xs text-rose-400">Permanent Database Action</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the startup{' '}
              <strong className="text-white font-bold">&quot;{deletingStartup.name}&quot;</strong>?
              This action will remove all incubator records and project links.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStartup(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-lg shadow-rose-500/20"
              >
                Yes, Delete Startup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
