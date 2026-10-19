'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import {
  Settings,
  Save,
  ShieldCheck,
  Database,
  Lock,
  Globe,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  ExternalLink
} from 'lucide-react';

export default function WebsiteSettingsPage() {
  const { isFaculty, addToast } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    siteTitle: 'IEDC GPTC PMNA',
    collegeName: 'Government Polytechnic College, Perinthalmanna',
    contactEmail: 'iedc@gptcpmna.edu.in',
    contactPhone: '+91 4933 227221',
    address: 'Govt Polytechnic College, Angadippuram PO, Perinthalmanna, Malappuram, Kerala 679321',
    github: 'https://github.com/iedc-gptc-pmna',
    linkedin: 'https://linkedin.com/company/iedc-gptc-pmna',
    instagram: 'https://instagram.com/iedc_gptcpmna'
  });

  const [supabaseInfo, setSupabaseInfo] = useState<any>(null);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseServiceKey, setSupabaseServiceKey] = useState('');
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          setFormData({
            siteTitle: d.siteTitle || 'IEDC GPTC PMNA',
            collegeName: d.collegeName || 'Government Polytechnic College, Perinthalmanna',
            contactEmail: d.contact?.email || 'iedc@gptcpmna.edu.in',
            contactPhone: d.contact?.phone || '+91 4933 227221',
            address: d.contact?.address || '',
            github: d.social?.github || '',
            linkedin: d.social?.linkedin || '',
            instagram: d.social?.instagram || ''
          });
        }
        if (json.supabase) {
          setSupabaseInfo(json.supabase);
          if (json.supabase.status) {
            setTestResult(json.supabase.status);
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleTestConnection = async () => {
    setTestingSupabase(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (json.supabase) {
        setSupabaseInfo(json.supabase);
        setTestResult(json.supabase.status);
        if (json.supabase.status?.connected) {
          addToast('Supabase Connected', 'Successfully communicated with PostgreSQL database.', 'success');
        } else {
          addToast('Supabase Notice', json.supabase.status?.message || 'Using local fallback persistence.', 'info');
        }
      }
    } catch (err: any) {
      setTestResult({ connected: false, message: err.message });
      addToast('Error', 'Failed to test Supabase connection.', 'error');
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFaculty) return;
    setSaving(true);
    try {
      const payload: any = {
        siteTitle: formData.siteTitle,
        collegeName: formData.collegeName,
        contact: {
          email: formData.contactEmail,
          phone: formData.contactPhone,
          address: formData.address
        },
        social: {
          github: formData.github,
          linkedin: formData.linkedin,
          instagram: formData.instagram
        }
      };

      if (supabaseAnonKey.trim()) {
        payload.supabaseAnonKey = supabaseAnonKey.trim();
      }
      if (supabaseServiceKey.trim()) {
        payload.supabaseServiceKey = supabaseServiceKey.trim();
      }

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.supabaseStatus) {
          setTestResult(json.supabaseStatus);
        }
        addToast('Settings Saved', 'Website configurations updated.', 'success');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setSaving(false);
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
          System Website Settings are restricted exclusively to the Faculty Coordinator. Student Leads cannot modify core site configurations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 23 / GOVERNANCE (FACULTY ONLY)
          </span>
          <h1 className="text-2xl font-black text-white">Website Settings &amp; Configuration</h1>
          <p className="text-slate-400 text-xs">
            Manage global site titles, college address credentials, contact phone lines, and social links.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
          <h3 className="font-bold text-white text-base">Institutional Identity</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Portal Name</label>
              <input
                type="text"
                value={formData.siteTitle}
                onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">College Name</label>
              <input
                type="text"
                value={formData.collegeName}
                onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Official Address</label>
              <textarea
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
          <h3 className="font-bold text-white text-base">Official Contact &amp; Social Links</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Public Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Official Instagram Account</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://instagram.com/iedc_gptcpmna"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className="flex-1 bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#F98A5B]"
                />
                {formData.instagram && (
                  <a
                    href={formData.instagram.startsWith('http') ? formData.instagram : `https://instagram.com/${formData.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-[#E1306C]/10 text-[#E1306C] hover:bg-[#E1306C]/20 border border-[#E1306C]/30 text-xs flex items-center justify-center"
                    title="Test Instagram Link"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Official LinkedIn Page</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://linkedin.com/company/iedc-gptc-pmna"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="flex-1 bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#F98A5B]"
                />
                {formData.linkedin && (
                  <a
                    href={formData.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 text-xs flex items-center justify-center"
                    title="Test LinkedIn Link"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">GitHub Organization</label>
              <input
                type="url"
                value={formData.github}
                onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>
      </form>

      {/* ═══════════════════════════════════════════════════════
          SUPABASE CENTRAL DATABASE & BACKEND INTEGRATION CARD
      ═══════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-3xl bg-[#121216] border border-emerald-500/20 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                Supabase PostgreSQL Backend &amp; Storage Architecture
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  eibjvsfxucifbeckftjw
                </span>
              </h3>
              <p className="text-slate-400 text-xs">
                Unified database engine powering both the Public Frontend and Private Admin Backend with Row Level Security.
              </p>
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testingSupabase}
            className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />
            <span>{testingSupabase ? 'Testing Ping...' : 'Test Database Connection'}</span>
          </button>
        </div>

        {/* Live Connectivity Diagnostic Banner */}
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
          testResult?.connected
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            {testResult?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <p className="font-bold">
                {testResult?.connected ? 'Live Supabase Connection Verified' : 'Supabase Live Token Status'}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {testResult?.message || 'Ready to communicate with project eibjvsfxucifbeckftjw.'}
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-[11px] shrink-0">
            <span className="text-slate-400">Endpoint: </span>
            <span className="text-white">https://eibjvsfxucifbeckftjw.supabase.co</span>
          </div>
        </div>

        {/* Grid of 12 Tables & 5 Storage Buckets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#18181D] border border-white/5 space-y-2">
            <div className="flex items-center justify-between font-bold text-white">
              <span>PostgreSQL Tables</span>
              <span className="text-emerald-400 font-mono">12 Active</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              events, team_members, certificates, projects, gallery_items, resources, blogs, announcements, startups, website_settings, profiles, audit_logs.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#18181D] border border-white/5 space-y-2">
            <div className="flex items-center justify-between font-bold text-white">
              <span>Storage Buckets</span>
              <span className="text-cyan-400 font-mono">5 Configured</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              team-photos (public), event-posters (public), gallery (public), documents (public), certificates (private/signed URLs).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#18181D] border border-white/5 space-y-2">
            <div className="flex items-center justify-between font-bold text-white">
              <span>Row Level Security (RLS)</span>
              <span className="text-emerald-400 font-mono">Enforced</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Public visitors can only read Published rows. Drafts, private participant contact info, and admin functions require authenticated tokens.
            </p>
          </div>
        </div>

        {/* Live Token Entry form if key update needed */}
        <div className="p-5 rounded-2xl bg-[#18181D] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Update Supabase API Keys (Optional)</span>
            </div>
            <a
              href="https://supabase.com/dashboard/project/eibjvsfxucifbeckftjw/settings/api"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 text-[11px] flex items-center gap-1 font-mono"
            >
              <span>Open Supabase Project API Settings</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Project Anon Key (JWT)
              </label>
              <input
                type="password"
                placeholder="Paste live Supabase anon key here..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Service Role Key (Server-Only Secret)
              </label>
              <input
                type="password"
                placeholder="Paste live service_role key here..."
                value={supabaseServiceKey}
                onChange={(e) => setSupabaseServiceKey(e.target.value)}
                className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Master SQL Migration Script: <code className="text-white bg-black/40 px-2 py-0.5 rounded">supabase/migrations/20261019_complete_iedc_schema.sql</code>
            </span>
            <button
              onClick={handleSave}
              disabled={saving || (!supabaseAnonKey && !supabaseServiceKey)}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Supabase Keys</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
