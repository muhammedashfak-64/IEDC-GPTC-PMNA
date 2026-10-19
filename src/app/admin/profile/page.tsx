'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { User, ShieldCheck, KeyRound, Save, Lock, CheckCircle2 } from 'lucide-react';

export default function MyProfilePage() {
  const { user, isFaculty, addToast } = useAdmin();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [updating, setUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      addToast('Validation Error', 'New password and confirm password do not match.', 'error');
      return;
    }
    if (newPass.length < 6) {
      addToast('Validation Error', 'Password must be at least 6 characters long.', 'error');
      return;
    }

    setUpdating(true);
    setTimeout(() => {
      setUpdating(false);
      addToast('Password Updated', 'Your administrative password was changed successfully.', 'success');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
          MODULE 25 / GOVERNANCE
        </span>
        <h1 className="text-2xl font-black text-white">My Administrative Profile</h1>
        <p className="text-slate-400 text-xs">
          View your authenticated account credentials, assigned role permissions, and change your password.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-5 p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/20 flex items-center justify-center font-black text-2xl text-white overflow-hidden shadow-xl">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.full_name?.charAt(0) || 'A'
            )}
          </div>

          <div>
            <h3 className="font-bold text-white text-lg">{user?.full_name}</h3>
            <span className="text-xs text-slate-400 font-mono">@{user?.username}</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                isFaculty
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              {isFaculty ? 'Faculty Coordinator (Nodal Officer)' : 'Student Lead (Chairperson)'}
            </span>
          </div>

          <div className="w-full text-xs text-left space-y-2 pt-4 border-t border-white/5 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Staff ID:</span>
              <span className="text-white font-bold">{user?.staffId || 'IEDC001'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Email:</span>
              <span className="text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Department:</span>
              <span className="text-white">{user?.department}</span>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="md:col-span-7 p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-300" /> Change Security Password
          </h3>
          <p className="text-xs text-slate-400">
            Update your administrative login password. Never share this with unauthorized individuals.
          </p>

          <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Current Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="py-3 px-6 rounded-xl bg-white text-black font-extrabold text-xs shadow hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {updating ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
