'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Users, Search, Download, Filter, CheckCircle2, Clock, XCircle, Mail, Phone } from 'lucide-react';

export default function EventRegistrationsPage() {
  const { addToast } = useAdmin();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/registrations').then((r) => r.json()),
      fetch('/api/admin/events').then((r) => r.json())
    ])
      .then(([regJson, evtJson]) => {
        if (regJson.success) setRegistrations(regJson.data || []);
        if (evtJson.success) setEvents(evtJson.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        addToast('Status Updated', `Registration marked as ${newStatus}`, 'success');
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Student Name', 'Register No', 'Email', 'Phone', 'Department', 'Status', 'Registered At'];
    const rows = filteredList.map((r) => [
      r.id,
      r.studentName,
      r.registerNumber,
      r.email,
      r.phone || 'N/A',
      r.department,
      r.status,
      r.registeredAt
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IEDC_Registrations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('CSV Exported', 'Participant registration records downloaded.', 'success');
  };

  const filteredList = registrations.filter((r) => {
    const matchesEvent = selectedEventId === 'All' || r.eventId === selectedEventId;
    const matchesSearch =
      r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEvent && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 05 / PARTICIPATION
          </span>
          <h1 className="text-2xl font-black text-white">Event Registrations</h1>
          <p className="text-slate-400 text-xs">
            Review live student registrations, verify attendance check-ins, and export participant data.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-[#121216] border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, register number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
        >
          <option value="All">All Events &amp; Workshops</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-[#121216] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18181E] border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4 font-bold">Student Participant</th>
                <th className="py-3.5 px-4 font-bold">Register Number</th>
                <th className="py-3.5 px-4 font-bold">Contact Info</th>
                <th className="py-3.5 px-4 font-bold">Department</th>
                <th className="py-3.5 px-4 font-bold">Attendance Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredList.length > 0 ? (
                filteredList.map((reg) => (
                  <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-bold text-white text-sm">
                      {reg.studentName}
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-300">
                      {reg.registerNumber}
                    </td>

                    <td className="py-4 px-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{reg.email}</span>
                      </div>
                      {reg.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{reg.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-300">
                      {reg.department}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                          reg.status === 'Attended'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : reg.status === 'Cancelled'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {reg.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {reg.status !== 'Attended' && (
                        <button
                          onClick={() => handleStatusChange(reg.id, 'Attended')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]"
                        >
                          Mark Attended
                        </button>
                      )}
                      {reg.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleStatusChange(reg.id, 'Cancelled')}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-[10px]"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {loading ? 'Loading registrations...' : 'No registrations found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
