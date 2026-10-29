'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import {
  User,
  ShieldCheck,
  KeyRound,
  Save,
  Lock,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Camera,
  Trash2,
  Mail,
  Phone,
  BadgeCheck,
  UploadCloud
} from 'lucide-react';
import { InstagramIcon as Instagram } from '@/components/SocialIcons';
import FileUpload from '@/components/admin/FileUpload';

export default function MyProfilePage() {
  const { user, isFaculty, isMainAdmin, addToast, refreshSession } = useAdmin();

  // Profile fields state
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  // Social profile fields
  const [instagramUsername, setInstagramUsername] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [savingSocial, setSavingSocial] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setAvatar(user.avatar || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setInstagramUsername(user.instagramUsername || (user.role === 'main_admin' ? '_aasshfaakk_' : ''));
      setInstagramUrl(user.instagramUrl || (user.role === 'main_admin' ? 'https://www.instagram.com/_aasshfaakk/' : ''));
    }
  }, [user]);

  // Save Administrator Profile & Avatar
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSavingProfile(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          updates: {
            full_name: fullName.trim() || user.full_name,
            avatar: avatar.trim(),
            email: email.trim() || user.email,
            phone: phone.trim()
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Profile Saved', 'Your administrator profile and photo have been updated successfully.', 'success');
        if (refreshSession) await refreshSession();
      } else {
        addToast('Update Error', data.error || 'Failed to update profile.', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Network error updating profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle password change
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

    setUpdatingPass(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user?.id,
          action: 'reset_password',
          newPassword: newPass
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Password Updated', 'Your administrative password was changed successfully.', 'success');
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        addToast('Update Error', data.error || 'Failed to update password', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setUpdatingPass(false);
    }
  };

  // Handle social links
  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSavingSocial(true);
    try {
      const cleanInsta = instagramUsername.trim().replace(/^@/, '');
      const cleanUrl = instagramUrl.trim() || (cleanInsta ? `https://www.instagram.com/${cleanInsta}/` : '');

      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          updates: {
            instagramUsername: cleanInsta,
            instagramUrl: cleanUrl
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Social Profile Saved', 'Your personal Instagram profile was updated successfully.', 'success');
        if (refreshSession) await refreshSession();
      } else {
        addToast('Error', data.error || 'Failed to update profile social links', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setSavingSocial(false);
    }
  };

  const isCreatorProfile = user?.role === 'main_admin';
  const activeInstagram = instagramUsername || (isCreatorProfile ? '_aasshfaakk_' : '');
  const activeInstaUrl = instagramUrl || (isCreatorProfile ? 'https://www.instagram.com/_aasshfaakk/' : '');

  // Extract initials for professional initials-based avatar
  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <span className="text-[10px] font-mono font-bold text-[#F98A5B] uppercase tracking-widest block mb-1">
          MODULE 25 / GOVERNANCE &amp; ACCOUNT
        </span>
        <h1 className="text-2xl font-black text-white">My Administrative Profile</h1>
        <p className="text-slate-400 text-xs">
          Manage your protected administrator identity, independent profile photo, contact details, and account credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Administrator Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 text-center flex flex-col items-center shadow-xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#F98A5B]/10 to-transparent pointer-events-none" />

            {/* Avatar container */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 border-2 border-white/20 flex items-center justify-center font-black text-2xl text-white overflow-hidden shadow-2xl relative">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt={fullName || user?.full_name || 'Admin'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="tracking-wider bg-clip-text text-transparent bg-gradient-to-tr from-white to-slate-300">
                    {getInitials(fullName || user?.full_name)}
                  </span>
                )}
              </div>

              {/* Status Indicator */}
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#121216] flex items-center justify-center"
                title="Active Protected Session"
              >
                <BadgeCheck className="w-3.5 h-3.5 text-neutral-950 stroke-[3]" />
              </div>
            </div>

            <div>
              <h3 className="font-bold text-white text-lg leading-snug">
                {fullName || user?.full_name}
              </h3>
              <span className="text-xs text-slate-400 font-mono">@{user?.username}</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  user?.role === 'main_admin'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                    : user?.role === 'faculty_coordinator'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {user?.role === 'main_admin'
                  ? 'Main Administrator (Root)'
                  : user?.role === 'faculty_coordinator'
                  ? 'Faculty Coordinator'
                  : 'Student Lead'}
              </span>
            </div>

            {/* Account Details Box */}
            <div className="w-full text-xs text-left space-y-2.5 pt-4 border-t border-white/10 font-mono">
              <div className="flex justify-between items-center text-slate-400">
                <span>Staff ID:</span>
                <span className="text-white font-bold">{user?.staffId || 'ADMIN001'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Official Email:</span>
                <span className="text-white truncate max-w-[170px]" title={email || user?.email}>
                  {email || user?.email}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Contact Phone:</span>
                <span className="text-white">{phone || user?.phone || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Security Level:</span>
                <span className="text-emerald-400 font-bold">RLS Protected</span>
              </div>
            </div>

            {/* Connected Instagram Profile */}
            {activeInstaUrl && (
              <div className="w-full pt-3 pb-1 border-t border-white/10 space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  {isCreatorProfile ? 'Website Creator & Designer Profile' : 'Personal Instagram Profile'}
                </span>
                <a
                  href={activeInstaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#E1306C]/40 text-xs font-mono text-slate-200 hover:text-white transition-all group shadow-sm"
                >
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045] flex items-center justify-center text-white shrink-0">
                    <Instagram className="w-3 h-3" />
                  </div>
                  <span className="font-bold">@{activeInstagram.replace(/^@/, '')}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Profile Photo & Account Management */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 1: MY ADMINISTRATOR PROFILE (Primary Photo & Identity) */}
          <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#F98A5B]" />
                  <span>MY ADMINISTRATOR PROFILE</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Independent administrator photo and identity. Does not require a public student or faculty record.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#F98A5B]/10 text-[#F98A5B] border border-[#F98A5B]/30 font-bold uppercase">
                Direct Identity
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile Photo Upload Field */}
              <div className="bg-[#16161D] p-4 rounded-2xl border border-white/10 space-y-3">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">
                  Administrator Profile Photo
                </span>
                <FileUpload
                  label="Profile Photo (Upload from PC)"
                  value={avatar}
                  onChange={(url) => setAvatar(url)}
                  folder="avatars"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  helperText="Upload your official administrator photo (JPG, PNG, WebP). Saved to Cloud Storage and shown across top navigation, sidebar, and account cards."
                />

                {avatar && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAvatar('')}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Profile Photo</span>
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono">
                      (Click &quot;Save Profile Changes&quot; below to confirm removal)
                    </span>
                  </div>
                )}
              </div>

              {/* Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Username (System Login ID)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={user?.username || ''}
                      className="w-full bg-[#18181D]/60 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono cursor-not-allowed"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                      Immutable
                    </span>
                  </div>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Email / Recovery Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9447123456"
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                  />
                </div>
              </div>

              {/* Account Role (Read Only) */}
              <div className="text-xs">
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Assigned Administrative Role
                </label>
                <div className="p-3 rounded-xl bg-[#18181D] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span className="text-white font-semibold">
                      {user?.role === 'main_admin'
                        ? 'Main Administrator (Root System Authority & Webmaster)'
                        : user?.role === 'faculty_coordinator'
                        ? 'Faculty Coordinator (Full CMS Access)'
                        : 'Student Operator (Limited Permissions)'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Protected</span>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-black font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? 'Saving Profile...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: Personal Instagram Attribution */}
          <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Instagram className="w-4 h-4 text-[#E1306C]" />
                <span>Personal Social Media &amp; Attribution</span>
              </h3>
              {isCreatorProfile && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/30 font-bold">
                  Creator Profile
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400">
              {isCreatorProfile
                ? 'Your personal Instagram account (@_aasshfaakk_) is used for subtle designer/creator attribution in the public footer. Keep this independent from the official college IEDC account.'
                : 'Configure your personal Instagram profile link. This will be associated with your administrative identity.'}
            </p>

            <form onSubmit={handleSaveSocial} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Instagram Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">@</span>
                    <input
                      type="text"
                      placeholder="_aasshfaakk_"
                      value={instagramUsername}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^@/, '');
                        setInstagramUsername(val);
                        if (!instagramUrl || instagramUrl.includes('instagram.com/')) {
                          setInstagramUrl(val ? `https://www.instagram.com/${val}/` : '');
                        }
                      }}
                      className="w-full pl-7 pr-3 py-2 bg-[#18181D] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#F98A5B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Instagram Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.instagram.com/_aasshfaakk_/"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181D] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#F98A5B]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {activeInstaUrl && (
                  <a
                    href={activeInstaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#E1306C] hover:underline inline-flex items-center gap-1 font-mono"
                  >
                    <span>Test Profile Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  type="submit"
                  disabled={savingSocial}
                  className="py-2.5 px-5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs ml-auto transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingSocial ? 'Saving...' : 'Save Social Profile'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 3: Change Password */}
          <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 shadow-xl">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>

              <button
                type="submit"
                disabled={updatingPass}
                className="py-2.5 px-6 rounded-xl bg-white text-black font-extrabold text-xs shadow hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {updatingPass ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
