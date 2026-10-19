'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { UserCog, Plus, ShieldCheck, User, Lock, CheckCircle2, XCircle, KeyRound } from 'lucide-react';

export default function UserManagementPage() {
  const { isFaculty, addToast } = useAdmin();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: 'Student@123',
    name: '',
    role: 'student_lead',
    department: 'Computer Engineering',
    staffId: ''
  });

  const loadData = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setUsers(json.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isFaculty) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isFaculty]);

  const handleToggleStatus = async (id: string, name: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        addToast('Status Updated', `Toggled account access for ${name}`, 'info');
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        addToast('Account Provisioned', `Created ${formData.role} account for ${formData.name}`, 'success');
        setShowModal(false);
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  if (!isFaculty) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Privileged Module: Faculty Only</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          User Management is restricted exclusively to the Faculty Coordinator (Nodal Officer). Student Leads are not permitted to provision or modify administrative accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 22 / GOVERNANCE (FACULTY ONLY)
          </span>
          <h1 className="text-2xl font-black text-white">Administrative User Management</h1>
          <p className="text-slate-400 text-xs">
            Provision Student Lead accounts, assign Staff IDs, enforce permissions, and toggle access keys.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              username: '',
              email: '',
              password: 'Student@123',
              name: '',
              role: 'student_lead',
              department: 'Computer Engineering',
              staffId: `SL00${users.length + 1}`
            });
            setShowModal(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Student Lead Account</span>
        </button>
      </div>

      <div className="rounded-3xl bg-[#121216] border border-white/10 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#18181E] border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3.5 px-4 font-bold">Admin Profile</th>
              <th className="py-3.5 px-4 font-bold">Staff ID &amp; Username</th>
              <th className="py-3.5 px-4 font-bold">Role &amp; Permissions</th>
              <th className="py-3.5 px-4 font-bold">Department</th>
              <th className="py-3.5 px-4 font-bold">Account Status</th>
              <th className="py-3.5 px-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-4 px-4">
                  <div className="font-bold text-white text-sm">{u.full_name}</div>
                  <div className="text-[11px] text-slate-400">{u.email}</div>
                </td>

                <td className="py-4 px-4 font-mono">
                  <div className="text-white font-bold">{u.staffId || 'IEDC001'}</div>
                  <div className="text-[10px] text-slate-400">@{u.username}</div>
                </td>

                <td className="py-4 px-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                      u.role === 'faculty_coordinator'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {u.role === 'faculty_coordinator' ? 'Faculty Coordinator' : 'Student Lead'}
                  </span>
                </td>

                <td className="py-4 px-4 text-slate-300">
                  {u.department}
                </td>

                <td className="py-4 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      u.isActive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {u.isActive ? '● Active' : '○ Suspended'}
                  </span>
                </td>

                <td className="py-4 px-4 text-right">
                  {u.role !== 'faculty_coordinator' && (
                    <button
                      onClick={() => handleToggleStatus(u.id, u.full_name)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        u.isActive
                          ? 'border-rose-500/30 text-rose-300 hover:bg-rose-500/10'
                          : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
                      }`}
                    >
                      {u.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Provision Admin User Account</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sreelakshmi P"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="sree.lead"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Staff ID</label>
                  <input
                    type="text"
                    required
                    value={formData.staffId}
                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="student@gptcpmna.edu.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="student_lead">Student Lead</option>
                    <option value="faculty_coordinator">Faculty Coordinator</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Temporary Password</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-white text-black font-extrabold">
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
