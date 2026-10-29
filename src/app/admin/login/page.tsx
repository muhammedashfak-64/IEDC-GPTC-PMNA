'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import { Lock, Mail, ShieldCheck, KeyRound, Eye, EyeOff, ArrowRight, Shield, CheckCircle2, User, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAdmin();

  const [identifier, setIdentifier] = useState('iedc.faculty');
  const [password, setPassword] = useState('Faculty@123');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    const res = await login(identifier, password);
    setSubmitting(false);

    if (res.success) {
      router.push('/admin/dashboard');
    } else {
      setErrorMessage(res.error || 'Authentication failed. Please verify your username and password.');
    }
  };

  const autofillMainAdmin = () => {
    setIdentifier('iedc.admin');
    setPassword('Admin@123');
    setErrorMessage('');
  };

  const autofillFaculty = () => {
    setIdentifier('iedc.faculty');
    setPassword('Faculty@123');
    setErrorMessage('');
  };

  const autofillStudentLead = () => {
    setIdentifier('iedc.studentlead');
    setPassword('Student@123');
    setErrorMessage('');
  };

  const autofillDesigner = () => {
    setIdentifier('iedc.designer');
    setPassword('Designer@123');
    setErrorMessage('');
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotMessage('');
    setForgotError('');

    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotMessage(data.message || 'Password reset instructions dispatched.');
      } else {
        setForgotError(data.error || 'Failed to initiate password recovery.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Network error while contacting recovery service.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-slate-100 font-sans">
      {/* Background Subtle Monochrome Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Branding Crest & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-3 bg-[#111114] border border-white/10 p-2.5 rounded-2xl shadow-xl">
            <img src="/iedc-logo.png" alt="IEDC Logo" className="w-9 h-9 object-contain" />
            <div className="w-px h-6 bg-white/10" />
            <img src="/college-logo.png" alt="GPTC Logo" className="w-8 h-8 object-contain" />
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 block mb-1">
              OFFICIAL ADMINISTRATIVE BACKEND
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              IEDC Admin Console
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Government Polytechnic College Perinthalmanna
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#0E0E12] border border-white/12 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-2xl">
          
          {/* Quick Credential Test Switcher Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>OPERATOR ROLES:</span>
              <span className="text-[10px] text-slate-400">1-Click Autofill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={autofillMainAdmin}
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Main Admin</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                  @iedc.admin
                </div>
              </button>

              <button
                type="button"
                onClick={autofillFaculty}
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Faculty Nodal</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                  @iedc.faculty
                </div>
              </button>

              <button
                type="button"
                onClick={autofillStudentLead}
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <User className="w-3.5 h-3.5" />
                  <span>Student Lead</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                  @iedc.studentlead
                </div>
              </button>

              <button
                type="button"
                onClick={autofillDesigner}
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Media Designer</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                  @iedc.designer
                </div>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2.5">
              <span className="text-sm shrink-0">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Username or Staff ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. iedc.faculty or iedc.designer"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-[#16161B] border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Admin Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#16161B] border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-200 text-black font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <span>{submitting ? 'Verifying Credentials...' : 'Sign In to Admin Console'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Security Note */}
          <div className="pt-2 border-t border-white/10 text-center">
            <span className="text-[11px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              Protected by Enterprise Multi-Layer Security
            </span>
          </div>

        </div>

        {/* Public Website Return Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            ← Return to Public Website
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121216] border border-white/15 rounded-3xl p-6 space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reset Administrative Password</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your official email address to receive password reset instructions.
              </p>
            </div>

            {forgotMessage ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold leading-relaxed">
                  ✓ {forgotMessage}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotMessage('');
                    setForgotError('');
                    setForgotEmail('');
                  }}
                  className="w-full py-2.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-slate-200 transition-colors"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                {forgotError && (
                  <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs leading-relaxed text-left">
                    <span className="font-bold block mb-0.5">Recovery Notice:</span>
                    {forgotError}
                  </div>
                )}

                <input
                  type="text"
                  required
                  placeholder="Enter username or official email address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotError('');
                      setForgotMessage('');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 font-extrabold text-xs transition-colors disabled:opacity-50"
                  >
                    {forgotLoading ? 'Verifying...' : 'Initiate Recovery'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
