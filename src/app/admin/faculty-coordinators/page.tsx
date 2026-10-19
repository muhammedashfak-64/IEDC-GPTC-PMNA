'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { ShieldCheck, Plus, Trash2, Edit3, Mail, Phone, Lock } from 'lucide-react';

export default function FacultyCoordinatorsManagementPage() {
  const { isFaculty, addToast } = useAdmin();
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    designation: 'Lecturer & Faculty Coordinator',
    department: 'Department of Electronics Engineering',
    bio: '',
    email: '',
    phone: '',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    isActive: true
  });

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
    setFormData({
      name: '',
      designation: 'Lecturer & Faculty Coordinator',
      department: 'Department of Electronics Engineering',
      bio: '',
      email: '',
      phone: '',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      isActive: true
    });
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
      isActive: fac.isActive ?? true
    });
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
            Manage Nodal Officer and institutional faculty coordinator profiles. Restricted to Faculty Coordinator administrators.
          </p>
        </div>

        {isFaculty ? (
          <button
            onClick={openCreate}
            className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty Profile</span>
          </button>
        ) : (
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" /> Read-Only for Student Lead
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {facultyList.map((fac) => (
          <div key={fac.id} className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={fac.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow"
                />
                <div>
                  <h3 className="font-bold text-white text-lg">{fac.name}</h3>
                  <p className="text-xs text-amber-300 font-bold">{fac.designation}</p>
                  <span className="text-[11px] text-slate-400 font-mono">{fac.department}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-[#18181D] p-3.5 rounded-2xl border border-white/5">
                {fac.bio}
              </p>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <div className="space-y-0.5 text-[11px] text-slate-400 font-mono">
                <div>{fac.email}</div>
                {fac.phone && <div>{fac.phone}</div>}
              </div>

              {isFaculty && (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(fac)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(fac.id, fac.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && isFaculty && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingFaculty ? 'Edit Faculty Profile' : 'Add Faculty Coordinator'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Prof. Muhammed Rashid"
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
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Photograph URL</label>
                <input
                  type="text"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
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
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-white text-black font-extrabold">
                  Save Faculty Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
