'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { History, ShieldCheck, Lock, Search, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const { isFaculty } = useAdmin();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isFaculty) {
      fetch('/api/admin/audit-logs')
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setLogs(json.data || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isFaculty]);

  if (!isFaculty) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Privileged Module: Faculty Only</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Security and Audit Logs are restricted exclusively to the Faculty Coordinator (Nodal Officer) to protect administrative confidentiality.
        </p>
      </div>
    );
  }

  const filtered = logs.filter((l) =>
    l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
          MODULE 24 / CORE &amp; SECURITY (FACULTY ONLY)
        </span>
        <h1 className="text-2xl font-black text-white">Security &amp; Audit Logs</h1>
        <p className="text-slate-400 text-xs">
          Immutable event log of administrative actions, logins, certificate issuances, and content modifications.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-[#121216] border border-white/10 relative">
        <Search className="w-4 h-4 absolute left-7 top-7 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by action, user name, or event details..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      <div className="rounded-3xl bg-[#121216] border border-white/10 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#18181E] border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3.5 px-4 font-bold">Timestamp</th>
              <th className="py-3.5 px-4 font-bold">Action</th>
              <th className="py-3.5 px-4 font-bold">Administrator</th>
              <th className="py-3.5 px-4 font-bold">Details</th>
              <th className="py-3.5 px-4 font-bold">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {filtered.length > 0 ? (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>

                  <td className="py-4 px-4">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 text-white border border-white/10">
                      {log.action}
                    </span>
                  </td>

                  <td className="py-4 px-4 space-y-0.5">
                    <div className="font-bold text-white text-xs">{log.userName}</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">{log.userRole}</div>
                  </td>

                  <td className="py-4 px-4 text-xs text-slate-300 leading-relaxed max-w-md">
                    {log.details}
                  </td>

                  <td className="py-4 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  {loading ? 'Loading audit records...' : 'No audit records match.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
