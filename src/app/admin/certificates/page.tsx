'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';
import {
  Award,
  Plus,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Eye,
  QrCode,
  Upload,
  Calendar,
  FileText,
  Clock,
  ShieldCheck,
  Edit3
} from 'lucide-react';

export default function AdminCertificatesPage() {
  const { addToast } = useAdmin();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Single Modal State
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [editingCert, setEditingCert] = useState<any>(null);
  const [singleForm, setSingleForm] = useState({
    certificateId: '',
    eventId: '',
    eventName: 'GPTC PMNA State Hackathon 2026',
    participantName: '',
    registerNumber: '',
    phone: '',
    email: '',
    certificateType: 'Winner',
    eventDate: new Date().toISOString().split('T')[0],
    pdfStorageUrl: '',
    status: 'Published'
  });

  // Bulk CSV Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState(
    `Rahul V, 21051234, 9847123456, rahul.v@gptcpmna.edu.in, Winner
Fathima Riya, 21051235, 9847654321, fathima.riya@gptcpmna.edu.in, Participation
Arjun K, 21051236, 9847000111, arjun.k@gptcpmna.edu.in, Organizer
Muhammed Shafi, 21051237, 9847222333, shafi.m@gptcpmna.edu.in, Speaker`
  );
  const [bulkEventName, setBulkEventName] = useState('GPTC PMNA State Hackathon 2026');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/certificates').then((r) => r.json()),
      fetch('/api/admin/events').then((r) => r.json())
    ])
      .then(([certJson, evtJson]) => {
        if (certJson.success) setCertificates(certJson.data || []);
        if (evtJson.success) setEvents(evtJson.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateSingle = () => {
    setEditingCert(null);
    setSingleForm({
      certificateId: `IEDC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      eventId: events[0]?.id || 'evt-001',
      eventName: events[0]?.title || 'GPTC PMNA State Hackathon 2026',
      participantName: '',
      registerNumber: '',
      phone: '',
      email: '',
      certificateType: 'Winner',
      eventDate: new Date().toISOString().split('T')[0],
      pdfStorageUrl: '',
      status: 'Published'
    });
    setShowSingleModal(true);
  };

  const openEditSingle = (cert: any) => {
    setEditingCert(cert);
    setSingleForm({
      certificateId: cert.certificateId,
      eventId: cert.eventId || '',
      eventName: cert.eventName,
      participantName: cert.participantName,
      registerNumber: cert.registerNumber,
      phone: cert.phone || '',
      email: cert.email || '',
      certificateType: cert.certificateType || 'Participation',
      eventDate: cert.eventDate || '',
      pdfStorageUrl: cert.pdfStorageUrl || '',
      status: cert.status || 'Published'
    });
    setShowSingleModal(true);
  };

  const handleTogglePublish = async (cert: any) => {
    const newStatus = cert.status === 'Published' ? 'Draft' : 'Published';
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cert.id, status: newStatus })
      });
      if (res.ok) {
        addToast('Certificate Status Updated', `${cert.certificateId} marked as ${newStatus}`, 'info');
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleDelete = async (id: string, certId: string) => {
    if (!confirm(`Delete certificate ${certId}?`)) return;
    try {
      const res = await fetch(`/api/admin/certificates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Deleted', `Removed certificate ${certId}`, 'info');
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCert) {
        const res = await fetch('/api/admin/certificates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCert.id, ...singleForm })
        });
        if (res.ok) {
          addToast('Certificate Updated', `Updated certificate for ${singleForm.participantName}`, 'success');
          setShowSingleModal(false);
          loadData();
        }
      } else {
        const res = await fetch('/api/admin/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(singleForm)
        });
        if (res.ok) {
          addToast('Certificate Issued', `Created certificate ID: ${singleForm.certificateId}`, 'success');
          setShowSingleModal(false);
          loadData();
        }
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkCsvText.trim().split('\n');
    const parsed = lines.map((l) => {
      const parts = l.split(',').map((p) => p.trim());
      return {
        participantName: parts[0] || 'Student',
        registerNumber: parts[1] || '21051299',
        phone: parts[2] || '9847123456',
        email: parts[3] || 'student@gptcpmna.edu.in',
        certificateType: parts[4] || 'Participation',
        eventName: bulkEventName
      };
    });

    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: parsed })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Bulk Import Complete', `Batch issued ${data.count} participant certificates!`, 'success');
        setShowBulkModal(false);
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const exportRecords = () => {
    const headers = ['Certificate ID', 'Participant Name', 'Register No', 'Phone (Download Password)', 'Event Name', 'Type', 'Issue Date', 'Status', 'Downloads'];
    const rows = filtered.map((c) => [
      c.certificateId,
      c.participantName,
      c.registerNumber,
      c.phone || '',
      `"${c.eventName}"`,
      c.certificateType,
      c.issueDate,
      c.status,
      c.downloadsCount || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IEDC_Certificates_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Records Exported', 'Downloaded full certificate records with verification codes.', 'success');
  };

  const filtered = certificates.filter((c) => {
    const matchesEvent = selectedEventId === 'All' || c.eventId === selectedEventId || c.eventName === selectedEventId;
    const matchesSearch =
      c.participantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.certificateId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm);
    return matchesEvent && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 07 / CERTIFICATE MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">Certificate Management</h1>
          <p className="text-slate-400 text-xs">
            Issue individual participant certificates, bulk upload via CSV, configure download verification passwords, and monitor download counts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportRecords}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Export Records</span>
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bulk CSV Upload</span>
          </button>
          <button
            onClick={openCreateSingle}
            className="px-4 py-2 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-slate-200 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Certificate</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#121216] border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by participant name, register number, mobile or certificate ID..."
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
          <option value="All">All Event Programs</option>
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
                <th className="py-3.5 px-4 font-bold">Certificate ID &amp; Type</th>
                <th className="py-3.5 px-4 font-bold">Participant Name</th>
                <th className="py-3.5 px-4 font-bold">Reg No &amp; Mobile</th>
                <th className="py-3.5 px-4 font-bold">Event Name</th>
                <th className="py-3.5 px-4 font-bold">Downloads</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filtered.length > 0 ? (
                filtered.map((cert) => (
                  <tr key={cert.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 space-y-1">
                      <div className="font-mono font-bold text-white text-xs">{cert.certificateId}</div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-white/5 text-slate-300 border border-white/10 inline-block">
                        {cert.certificateType}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-bold text-white text-sm">
                      {cert.participantName}
                    </td>

                    <td className="py-4 px-4 space-y-1">
                      <div className="font-mono text-slate-200">{cert.registerNumber}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Pass: {cert.phone || '9847123456'}
                      </div>
                    </td>

                    <td className="py-4 px-4 max-w-[200px]">
                      <div className="truncate text-white font-medium">{cert.eventName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{cert.eventDate}</div>
                    </td>

                    <td className="py-4 px-4 font-mono">
                      <span className="font-bold text-white">{cert.downloadsCount || 0}</span>
                      <span className="text-[10px] text-slate-400"> hits</span>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleTogglePublish(cert)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border cursor-pointer transition-all ${
                          cert.status === 'Published'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                        }`}
                      >
                        {cert.status === 'Published' ? '● Published' : '○ Draft'}
                      </button>
                    </td>

                    <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        href={`/verify/${cert.certificateId}`}
                        target="_blank"
                        title="View Public QR Verification Page"
                        className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5 text-amber-400" />
                      </Link>
                      <button
                        onClick={() => openEditSingle(cert)}
                        title="Edit Certificate Details"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cert.id, cert.certificateId)}
                        title="Delete Certificate"
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {loading ? 'Loading certificates...' : 'No matching certificates found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Certificate Modal */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCert ? 'Edit Participant Certificate' : 'Issue New Certificate'}
              </h3>
              <button onClick={() => setShowSingleModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSingleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Participant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fathima Riya"
                  value={singleForm.participantName}
                  onChange={(e) => setSingleForm({ ...singleForm, participantName: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Register Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 21051235"
                    value={singleForm.registerNumber}
                    onChange={(e) => setSingleForm({ ...singleForm, registerNumber: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">10-Digit Mobile (Password)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9847654321"
                    value={singleForm.phone}
                    onChange={(e) => setSingleForm({ ...singleForm, phone: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Program / Event</label>
                  <select
                    value={singleForm.eventName}
                    onChange={(e) => setSingleForm({ ...singleForm, eventName: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {events.map((e) => (
                      <option key={e.id} value={e.title}>{e.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Certificate Type</label>
                  <select
                    value={singleForm.certificateType}
                    onChange={(e) => setSingleForm({ ...singleForm, certificateType: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Winner">Winner</option>
                    <option value="Participation">Participation</option>
                    <option value="Organizer">Organizer</option>
                    <option value="Speaker">Speaker</option>
                    <option value="Judge">Judge</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Certificate File Path / URL (Optional)</label>
                <input
                  type="text"
                  placeholder="/certificates/IEDC-2026-89412.pdf"
                  value={singleForm.pdfStorageUrl}
                  onChange={(e) => setSingleForm({ ...singleForm, pdfStorageUrl: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 font-extrabold"
                >
                  {editingCert ? 'Save Changes' : 'Generate & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Bulk CSV Certificate Dispatcher
                </h3>
                <p className="text-xs text-slate-400">
                  Format: <code className="text-amber-300">Name, RegisterNumber, MobileNumber, Email, Type</code>
                </p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Target Event</label>
                <select
                  value={bulkEventName}
                  onChange={(e) => setBulkEventName(e.target.value)}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.title}>{e.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">CSV Content (One record per line)</label>
                <textarea
                  rows={8}
                  required
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-3 text-xs text-amber-200 font-mono focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 font-extrabold"
                >
                  Import &amp; Issue Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
