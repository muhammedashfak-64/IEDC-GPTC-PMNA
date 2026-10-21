'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '@/context/AdminContext';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Mail,
  Phone,
  Lock,
  Sparkles,
  RefreshCw,
  X,
  Upload
} from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';
import AnimatedProfileCard, { ProfileCardData } from '@/components/team/AnimatedProfileCard';

export default function FacultyCoordinatorsManagementPage() {
  const { isFaculty, addToast } = useAdmin();
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any>(null);
  const [previewTab, setPreviewTab] = useState<'form' | 'cardPreview'>('form');

  // Quick No-Background Photo Upload directly from faculty cards
  const [quickUploadFacId, setQuickUploadFacId] = useState<string | null>(null);
  const quickFacInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerQuickFacUpload = (facId: string) => {
    setQuickUploadFacId(facId);
    quickFacInputRef.current?.click();
  };

  const handleQuickFacFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !quickUploadFacId) return;

    try {
      addToast('Uploading', 'Uploading transparent cutout photo...', 'info');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'faculty');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.success && data.url) {
        // Save to faculty record
        const updateRes = await fetch(`/api/admin/faculty?id=${quickUploadFacId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photoUrl: data.url,
            isTransparent: true
          })
        });
        const updateData = await updateRes.json();
        if (updateData.success) {
          addToast('Success', 'No-background photo uploaded and linked!', 'success');
          loadData();
        } else {
          addToast('Error', updateData.error || 'Failed to update faculty photo', 'error');
        }
      } else {
        addToast('Upload Error', data.error || 'Failed to upload photo', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Upload failed', 'error');
    } finally {
      setQuickUploadFacId(null);
      if (quickFacInputRef.current) quickFacInputRef.current.value = '';
    }
  };

  const initialForm = {
    name: '',
    designation: 'Lecturer & Faculty Coordinator',
    department: 'Department of Electronics Engineering',
    bio: '',
    email: '',
    phone: '',
    photoUrl: '',
    isActive: true,
    imagePosition: 'bottom' as const,
    imageScale: 1.0,
    animationEnabled: true,
    animationStyle: 'fade-up' as const,
    animationDelay: 0,
    glowEnabled: true,
    glowIntensity: 'subtle' as const,
    bgStyle: 'radial-light' as const,
    isTransparent: true
  };

  const [formData, setFormData] = useState(initialForm);

  const loadData = () => {
    setLoading(true);
    fetch('/api/admin/faculty')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setFacultyList(json.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    if (!isFaculty) {
      alert('Permission Denied: Only Faculty Coordinators can add faculty profiles.');
      return;
    }
    setEditingFaculty(null);
    setFormData(initialForm);
    setPreviewTab('form');
    setShowModal(true);
  };

  const openEdit = (fac: any) => {
    if (!isFaculty) {
      alert('Permission Denied: Only Faculty Coordinators can modify faculty records.');
      return;
    }
    setEditingFaculty(fac);
    setFormData({
      name: fac.name,
      designation: fac.designation,
      department: fac.department,
      bio: fac.bio || '',
      email: fac.email || '',
      phone: fac.phone || '',
      photoUrl: fac.photoUrl || '',
      isActive: fac.isActive ?? true,
      imagePosition: fac.imagePosition || 'bottom',
      imageScale: fac.imageScale !== undefined ? Number(fac.imageScale) : 1.0,
      animationEnabled: fac.animationEnabled !== false,
      animationStyle: fac.animationStyle || 'fade-up',
      animationDelay: fac.animationDelay !== undefined ? Number(fac.animationDelay) : 0,
      glowEnabled: fac.glowEnabled !== false,
      glowIntensity: fac.glowIntensity || 'subtle',
      bgStyle: fac.bgStyle || 'radial-light',
      isTransparent: fac.isTransparent !== false
    });
    setPreviewTab('form');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFaculty) return;

    try {
      if (editingFaculty) {
        const res = await fetch('/api/admin/faculty', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingFaculty.id, ...formData })
        });
        if (res.ok) {
          addToast('Profile Updated', `Updated faculty profile for ${formData.name}`, 'success');
          setShowModal(false);
          loadData();
        }
      } else {
        const res = await fetch('/api/admin/faculty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          addToast('Faculty Coordinator Added', `Added ${formData.name}`, 'success');
          setShowModal(false);
          loadData();
        }
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isFaculty) {
      alert('Permission Denied: Only Faculty Coordinators can delete faculty records.');
      return;
    }
    if (!confirm(`Delete faculty profile "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/faculty?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Profile Deleted', `Removed ${name}`, 'info');
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
            MODULE 18 / GOVERNANCE
          </span>
          <h1 className="text-2xl font-black text-white">Faculty Coordinator Management</h1>
          <p className="text-slate-400 text-xs">
            Manage Nodal Officer and institutional faculty coordinator profiles with premium animated cutout presentation.
          </p>
        </div>

        {isFaculty ? (
          <div className="flex items-center gap-2">

            <button
              onClick={openCreate}
              className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Faculty Profile</span>
            </button>
          </div>
        ) : (
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" /> Read-Only for Student Lead
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-neutral-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F98A5B]" />
          Loading faculty profiles...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
          {facultyList.map((fac, idx) => (
            <div key={fac.id} className="relative group/facCard flex flex-col justify-between">
              {/* Floating action buttons for admin */}
              {isFaculty && (
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 opacity-90 group-hover/facCard:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleTriggerQuickFacUpload(fac.id)}
                    className="p-1.5 rounded-lg bg-neutral-900/90 hover:bg-emerald-500 text-emerald-400 hover:text-neutral-950 border border-emerald-500/30 shadow-lg transition-colors cursor-pointer"
                    title="Upload No-Background Photo"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEdit(fac)}
                    className="p-1.5 rounded-lg bg-neutral-900/90 hover:bg-[#F98A5B] text-white hover:text-neutral-950 border border-white/20 shadow-lg transition-colors cursor-pointer"
                    title="Edit Faculty Profile"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(fac.id, fac.name)}
                    className="p-1.5 rounded-lg bg-neutral-900/90 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 shadow-lg transition-colors cursor-pointer"
                    title="Delete Faculty Profile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <AnimatedProfileCard
                member={{
                  ...fac,
                  role: fac.designation || 'Faculty Coordinator',
                  category: 'Faculty Leadership'
                }}
                index={idx}
                containerHeight="h-80 sm:h-96"
                layoutVariant="faculty"
              />
            </div>
          ))}
        </div>
      )}

      {showModal && isFaculty && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>{editingFaculty ? 'Edit Faculty Profile' : 'Add Faculty Coordinator'}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Update mentor credentials, transparent cutout photo, and animation settings.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-neutral-950 p-1 rounded-xl flex items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('form')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      previewTab === 'form' ? 'bg-[#F98A5B] text-neutral-950 font-bold' : 'text-neutral-400'
                    }`}
                  >
                    Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('cardPreview')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      previewTab === 'cardPreview' ? 'bg-[#F98A5B] text-neutral-950 font-bold' : 'text-neutral-400'
                    }`}
                  >
                    Live Preview
                  </button>
                </div>

                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {previewTab === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Photo Upload */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <FileUpload
                      label="Faculty Photograph (Transparent Cutout PNG/WebP or JPG)"
                      value={formData.photoUrl}
                      onChange={(url) => setFormData({ ...formData, photoUrl: url })}
                      folder="faculty"
                      accept="image/png,image/webp,image/jpeg,image/jpg"
                      helperText="Upload transparent portrait photo directly from your computer"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                    <input
                      type="checkbox"
                      checked={formData.isTransparent !== false}
                      onChange={(e) => setFormData({ ...formData, isTransparent: e.target.checked })}
                      className="w-4 h-4 rounded accent-[#F98A5B] cursor-pointer"
                    />
                    <span className="font-semibold text-white">
                      Transparent Background Cutout (renders over soft off-white gradient with ambient glow)
                    </span>
                  </label>
                </div>

                {/* ANIMATION & PROFILE PRESENTATION CONTROLS */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#F98A5B]" />
                      <span>Cutout Presentation &amp; Scroll Animation</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">Public Rendering</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold block">Vertical Position</label>
                      <select
                        value={formData.imagePosition || 'bottom'}
                        onChange={(e) => setFormData({ ...formData, imagePosition: e.target.value as any })}
                        className="w-full bg-[#18181D] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="bottom">Bottom-Aligned (Ground Level)</option>
                        <option value="center">Center-Aligned</option>
                        <option value="top">Top-Aligned</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold flex items-center justify-between">
                        <span>Image Scale</span>
                        <span className="text-[#F98A5B] font-mono font-bold">
                          {Math.round((formData.imageScale || 1.0) * 100)}%
                        </span>
                      </label>
                      <input
                        type="range"
                        min="0.85"
                        max="1.20"
                        step="0.05"
                        value={formData.imageScale || 1.0}
                        onChange={(e) => setFormData({ ...formData, imageScale: parseFloat(e.target.value) })}
                        className="w-full accent-[#F98A5B] cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold block">Animation Style</label>
                      <select
                        value={formData.animationStyle || 'fade-up'}
                        onChange={(e) => setFormData({ ...formData, animationStyle: e.target.value as any })}
                        className="w-full bg-[#18181D] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="fade-up">Fade Up</option>
                        <option value="soft-reveal">Soft Reveal</option>
                        <option value="gentle-float">Gentle Float</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold block">Background Preset</label>
                      <select
                        value={formData.bgStyle || 'radial-light'}
                        onChange={(e) => setFormData({ ...formData, bgStyle: e.target.value as any })}
                        className="w-full bg-[#18181D] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="radial-light">Radial Light (Default)</option>
                        <option value="soft-slate">Soft Slate</option>
                        <option value="glass-glow">Glass Glow</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold block">Glow Intensity</label>
                      <select
                        value={formData.glowIntensity || 'subtle'}
                        onChange={(e) => setFormData({ ...formData, glowIntensity: e.target.value as any })}
                        className="w-full bg-[#18181D] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="subtle">Subtle</option>
                        <option value="medium">Medium</option>
                        <option value="vibrant">Vibrant</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold block">Animation Enabled</label>
                      <label className="flex items-center gap-2 pt-1 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.animationEnabled !== false}
                          onChange={(e) => setFormData({ ...formData, animationEnabled: e.target.checked })}
                          className="w-4 h-4 rounded accent-[#F98A5B] cursor-pointer"
                        />
                        <span>Enable Motion</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Basic Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Prof. Muhammed Rashid"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Designation</label>
                    <input
                      type="text"
                      required
                      placeholder="Nodal Officer & Lecturer"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Department</label>
                  <input
                    type="text"
                    required
                    placeholder="Department of Electronics Engineering"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Professional Biography</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Official Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-white text-black font-extrabold hover:bg-slate-200">
                    Save Faculty Profile
                  </button>
                </div>
              </form>
            ) : (
              /* Live Preview Tab */
              <div className="py-4 flex flex-col items-center justify-center space-y-4">
                <span className="text-xs font-mono text-neutral-400">
                  Interactive live preview of faculty coordinator card:
                </span>
                <div className="w-full max-w-sm">
                  <AnimatedProfileCard
                    member={{
                      id: editingFaculty?.id || 'fac-preview',
                      name: formData.name || 'Faculty Coordinator Name',
                      role: formData.designation || 'Lecturer & Faculty Coordinator',
                      category: 'Faculty Leadership',
                      department: formData.department || 'Engineering Department',
                      bio: formData.bio || 'Institutional mentor overseeing incubation and student innovation.',
                      email: formData.email,
                      phone: formData.phone,
                      photoUrl: formData.photoUrl,
                      imagePosition: formData.imagePosition,
                      imageScale: formData.imageScale,
                      animationEnabled: formData.animationEnabled,
                      animationStyle: formData.animationStyle,
                      animationDelay: formData.animationDelay,
                      glowEnabled: formData.glowEnabled,
                      glowIntensity: formData.glowIntensity,
                      bgStyle: formData.bgStyle,
                      isTransparent: formData.isTransparent
                    }}
                    index={0}
                    containerHeight="h-80"
                    layoutVariant="faculty"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewTab('form')}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                >
                  Back to Form
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input for one-click quick upload on faculty cards */}
      <input
        type="file"
        ref={quickFacInputRef}
        onChange={handleQuickFacFileChange}
        accept="image/png,image/webp,image/jpeg,image/jpg"
        className="hidden"
      />
    </div>
  );
}
