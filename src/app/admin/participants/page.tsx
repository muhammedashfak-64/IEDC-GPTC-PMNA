'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Contact, Search, Award, Mail, Phone, Calendar, Download } from 'lucide-react';

export default function ParticipantsDirectoryPage() {
  const { addToast } = useAdmin();
  const [participants, setParticipants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/registrations').then((r) => r.json()),
      fetch('/api/admin/certificates').then((r) => r.json())
    ])
      .then(([regJson, certJson]) => {
        const regs = regJson.data || [];
        const certs = certJson.data || [];

        // Aggregate unique participants
        const map = new Map<string, any>();
        regs.forEach((r: any) => {
          const key = r.registerNumber;
          if (!map.has(key)) {
            map.set(key, {
              registerNumber: key,
              name: r.studentName,
              email: r.email,
              phone: r.phone,
              department: r.department,
              eventsCount: 1,
              certificatesCount: 0
            });
          } else {
            map.get(key).eventsCount += 1;
          }
        });

        certs.forEach((c: any) => {
          const key = c.registerNumber;
          if (map.has(key)) {
            map.get(key).certificatesCount += 1;
          } else {
            map.set(key, {
              registerNumber: key,
              name: c.participantName,
              email: c.email,
              phone: c.phone,
              department: 'General',
              eventsCount: 1,
              certificatesCount: 1
            });
          }
        });

        setParticipants(Array.from(map.values()));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = participants.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 06 / PARTICIPATION
          </span>
          <h1 className="text-2xl font-black text-white">Participants Directory</h1>
          <p className="text-slate-400 text-xs">
            Comprehensive registry of all student innovators who have registered and attended events.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#121216] border border-white/10 relative">
        <Search className="w-4 h-4 absolute left-7 top-7 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name, register number, department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      <div className="rounded-3xl bg-[#121216] border border-white/10 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#18181E] border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3.5 px-4 font-bold">Participant</th>
              <th className="py-3.5 px-4 font-bold">Register Number</th>
              <th className="py-3.5 px-4 font-bold">Department</th>
              <th className="py-3.5 px-4 font-bold">Events Attended</th>
              <th className="py-3.5 px-4 font-bold">Certificates Issued</th>
              <th className="py-3.5 px-4 font-bold">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <tr key={p.registerNumber} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4 font-bold text-white text-sm">{p.name}</td>
                  <td className="py-4 px-4 font-mono text-slate-300">{p.registerNumber}</td>
                  <td className="py-4 px-4 text-slate-300">{p.department}</td>
                  <td className="py-4 px-4 font-mono font-bold text-white">{p.eventsCount}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-mono font-bold text-[11px] border border-emerald-500/30">
                      {p.certificatesCount} Verified
                    </span>
                  </td>
                  <td className="py-4 px-4 space-y-0.5 text-[11px] text-slate-400">
                    <div>{p.email}</div>
                    {p.phone && <div className="font-mono">{p.phone}</div>}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  {loading ? 'Loading participants...' : 'No participant records found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
