'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Clock,
  Users,
  Award,
  Upload,
  ArrowUpRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function AdminEventsPage() {
  const { addToast } = useAdmin();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Hackathon',
    level: 'College',
    scope: 'College' as 'College' | 'Statewide',
    gptcQuota: 50,
    otherCollegeQuota: 50,
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM - 04:00 PM',
    venue: 'Main Auditorium',
    description: '',
    speaker: '',
    totalSeats: 60,
    seatsAvailable: 60,
    bannerImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    brochureUrl: '',
    registrationOpen: true,
    certificateEligible: true,
    status: 'Published',
    facultyCoordinator: 'Prof. Muhammed Rashid',
    studentCoordinator: 'Rahul V'
  });

  const loadEvents = () => {
    setLoading(true);
    setLoadError(null);
    fetch('/api/admin/events')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setEvents(json.data);
        } else {
          setLoadError(json.error || 'Failed to load events from database.');
          addToast('Database Error', json.error || 'Failed to load events', 'error');
        }
      })
      .catch((err) => {
        setLoadError(err.message || 'Connection error');
        addToast('Connection Error', err.message, 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      category: 'Workshop',
      level: 'State',
      scope: 'Statewide',
      gptcQuota: 50,
      otherCollegeQuota: 100,
      date: new Date().toISOString().split('T')[0],
      time: '09:00 AM - 05:00 PM',
      venue: 'Main Auditorium & ICFC Lab',
      description: '',
      speaker: '',
      totalSeats: 150,
      seatsAvailable: 150,
      bannerImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
      brochureUrl: '',
      registrationOpen: true,
      certificateEligible: true,
      status: 'Published',
      facultyCoordinator: 'Prof. Muhammed Rashid',
      studentCoordinator: 'Rahul V'
    });
    setShowModal(true);
  };

  const openEditModal = (evt: any) => {
    setEditingEvent(evt);
    const isStatewide = evt.quotaConfig?.participationType === 'Statewide' || evt.level?.toLowerCase().includes('state');
    const extQuota = evt.quotaConfig?.externalQuota?.maxSeats ?? (isStatewide ? 50 : 0);
    const gptcQuota = Math.max(1, (evt.totalSeats || 60) - (isStatewide ? extQuota : 0));

    setFormData({
      title: evt.title,
      category: evt.category || 'Workshop',
      level: evt.level || 'College',
      scope: isStatewide ? 'Statewide' : 'College',
      gptcQuota: gptcQuota,
      otherCollegeQuota: extQuota,
      date: evt.date,
      time: evt.time || '10:00 AM - 04:00 PM',
      venue: evt.venue,
      description: evt.description || '',
      speaker: evt.speaker || '',
      totalSeats: evt.totalSeats || 60,
      seatsAvailable: evt.seatsAvailable || 60,
      bannerImage: evt.bannerImage || '',
      brochureUrl: evt.brochureUrl || '',
      registrationOpen: evt.registrationOpen ?? true,
      certificateEligible: evt.certificateEligible ?? true,
      status: evt.status || 'Published',
      facultyCoordinator: evt.facultyCoordinator || '',
      studentCoordinator: evt.studentCoordinator || ''
    });
    setShowModal(true);
  };

  const handleDuplicate = async (evt: any) => {
    const dupPayload = {
      ...evt,
      title: `${evt.title} (Copy)`,
      status: 'Draft'
    };
    delete dupPayload.id;

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dupPayload)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('Event Duplicated', `Created draft copy of ${evt.title}`, 'success');
        loadEvents();
      } else {
        addToast('Duplicate Failed', json.error || 'Server rejected event duplicate', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleTogglePublish = async (evt: any) => {
    const newStatus = evt.status === 'Published' ? 'Draft' : 'Published';
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: evt.id, status: newStatus })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('Status Updated', `Event marked as ${newStatus}`, 'info');
        loadEvents();
      } else {
        addToast('Status Update Failed', json.error || 'Could not update event status', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete event "${title}"? This will remove it from the authoritative database.`)) return;

    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('Event Deleted', `Removed ${title} from database.`, 'info');
        loadEvents();
      } else {
        addToast('Delete Failed', json.error || 'Could not delete event', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const isStatewide = formData.scope === 'Statewide';
      const totalSeats = isStatewide
        ? Number(formData.gptcQuota) + Number(formData.otherCollegeQuota)
        : Number(formData.totalSeats);

      const existingConfig = editingEvent?.quotaConfig || {};
      const quotaConfig = {
        ...existingConfig,
        participationType: isStatewide ? 'Statewide' : (existingConfig.participationType === 'Single Class' ? 'Single Class' : 'Entire College'),
        externalQuota: {
          enabled: isStatewide,
          maxSeats: isStatewide ? Number(formData.otherCollegeQuota) : 0
        },
        waitlistEnabled: existingConfig.waitlistEnabled !== false
      };

      const payload = {
        ...formData,
        totalSeats,
        seatsAvailable: editingEvent ? editingEvent.seatsAvailable : totalSeats,
        level: isStatewide ? 'State' : formData.level,
        quotaConfig
      };

      if (editingEvent) {
        const res = await fetch('/api/admin/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingEvent.id, ...payload })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          addToast('Event Updated', `Saved changes to ${formData.title}`, 'success');
          setShowModal(false);
          loadEvents();
        } else {
          addToast('Update Failed', json.error || 'Server rejected event update', 'error');
        }
      } else {
        const res = await fetch('/api/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (res.ok && json.success) {
          addToast('Event Created', `Created new event: ${formData.title}`, 'success');
          setShowModal(false);
          loadEvents();
        } else {
          addToast('Creation Failed', json.error || 'Server rejected event creation', 'error');
        }
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Network error saving event', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Events
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.speaker?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || e.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || e.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 04 / EVENT MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-white">Events &amp; Workshops</h1>
          <p className="text-slate-400 text-xs">
            Create, duplicate, publish, manage brochures, and oversee registration seat caps for college and state events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadEvents}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh from authoritative database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Event</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#121216] border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, speaker, or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Hackathon">Hackathon</option>
            <option value="Workshop">Workshop</option>
            <option value="Seminar">Seminar</option>
            <option value="Bootcamp">Bootcamp</option>
            <option value="Competition">Competition</option>
            <option value="State Program">State Program</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-3xl bg-[#121216] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18181E] border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4 font-bold">Event Details</th>
                <th className="py-3.5 px-4 font-bold">Date &amp; Venue</th>
                <th className="py-3.5 px-4 font-bold">Seats</th>
                <th className="py-3.5 px-4 font-bold">Brochure</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={evt.bannerImage || '/campus-main.jpeg'}
                          alt=""
                          className="w-12 h-10 object-cover rounded-lg border border-white/10 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{evt.title}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-slate-400">{evt.category}</span>
                            <span>•</span>
                            <span>{evt.level} Level</span>
                            {evt.speaker && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[150px]">By {evt.speaker}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-white font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{evt.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[140px]">{evt.venue}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-mono font-bold text-white">
                        {evt.seatsAvailable} / {evt.totalSeats}
                      </div>
                      <span className="text-[10px] text-slate-400">Available</span>
                    </td>

                    <td className="py-4 px-4">
                      {evt.brochureUrl ? (
                        <a
                          href={evt.brochureUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] font-mono border border-white/10"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>PDF</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleTogglePublish(evt)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border cursor-pointer transition-all ${
                          evt.status === 'Published'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-slate-500/15 text-slate-300 border-slate-500/30 hover:bg-slate-500/25'
                        }`}
                      >
                        {evt.status === 'Published' ? '● Published' : '○ Draft'}
                      </button>
                    </td>

                    <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        href={`/admin/events/${evt.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F98A5B]/15 hover:bg-[#F98A5B]/25 text-[#F98A5B] font-bold text-xs border border-[#F98A5B]/30 transition-all mr-2"
                        title="Open Program Workspace (Attendance, Registrations, Certificates)"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Manage Program</span>
                      </Link>
                      <button
                        onClick={() => handleDuplicate(evt)}
                        title="Duplicate Event"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(evt)}
                        title="Edit Event"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(evt.id, evt.title)}
                        title="Delete Event"
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {loading ? 'Loading events...' : 'No events match the search or filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingEvent ? 'Edit Event Details' : 'Create New Event / Workshop'}
                </h3>
                <p className="text-xs text-slate-400">
                  Fill in event schedule, seat limit, poster banner, and brochure link.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GPTC PMNA State Hackathon 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Bootcamp">Bootcamp</option>
                    <option value="Competition">Competition</option>
                    <option value="State Program">State Program</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="College">College</option>
                    <option value="State">State</option>
                    <option value="National">National</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Time Range</label>
                  <input
                    type="text"
                    required
                    placeholder="09:00 AM - 05:00 PM"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Venue</label>
                <input
                  type="text"
                  required
                  placeholder="Main Auditorium & ICFC Lab"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Comprehensive event details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Speaker / Mentor</label>
                <input
                  type="text"
                  placeholder="Er. Mohammed Shafi"
                  value={formData.speaker}
                  onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Event Scope & Separate Quota Configuration */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-200 uppercase block">Event Scope / Registration Category</label>
                    <p className="text-[10px] text-slate-400">Choose whether this event is internal to GPTC PMNA or statewide.</p>
                  </div>
                  <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, scope: 'College' })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formData.scope === 'College'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Internal College Event
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, scope: 'Statewide' })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formData.scope === 'Statewide'
                          ? 'bg-purple-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Statewide Event / Workshop
                    </button>
                  </div>
                </div>

                {formData.scope === 'Statewide' ? (
                  <div className="pt-2 border-t border-white/10 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                        <label className="text-[10px] font-mono font-bold text-amber-300 uppercase block">
                          Group A: GPTC PMNA Students Quota
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={formData.gptcQuota}
                          onChange={(e) => setFormData({ ...formData, gptcQuota: Math.max(1, Number(e.target.value)) })}
                          className="w-full bg-[#18181D] border border-white/15 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        />
                        <span className="text-[9px] text-amber-300/70 block">Seats reserved for our polytechnic students</span>
                      </div>

                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                        <label className="text-[10px] font-mono font-bold text-purple-300 uppercase block">
                          Group B: Other-College Students Quota
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={formData.otherCollegeQuota}
                          onChange={(e) => setFormData({ ...formData, otherCollegeQuota: Math.max(1, Number(e.target.value)) })}
                          className="w-full bg-[#18181D] border border-white/15 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        />
                        <span className="text-[9px] text-purple-300/70 block">Seats allocated for external polytechnics &amp; colleges</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/10 text-xs">
                      <span className="text-slate-300 font-medium">Total Allocated Statewide Seats:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {Number(formData.gptcQuota) + Number(formData.otherCollegeQuota)} seats
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-white/10">
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Total College Seats Limit</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.totalSeats}
                      onChange={(e) => setFormData({ ...formData, totalSeats: Math.max(1, Number(e.target.value)) })}
                      className="w-full sm:w-48 bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-2 border-t border-white/10">
                <FileUpload
                  label="Event Poster / Banner Image"
                  value={formData.bannerImage}
                  onChange={(url) => setFormData({ ...formData, bannerImage: url })}
                  folder="events"
                  accept="image/jpeg,image/png,image/webp"
                  helperText="Upload event poster or creative graphic (JPG, PNG, WebP)"
                />

                <FileUpload
                  label="Event Brochure Document"
                  value={formData.brochureUrl}
                  onChange={(url) => setFormData({ ...formData, brochureUrl: url })}
                  folder="documents"
                  isDocument={true}
                  accept=".pdf,.docx,.doc"
                  helperText="Upload official guidelines, schedule, or brochure (PDF or DOCX)"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.registrationOpen}
                    onChange={(e) => setFormData({ ...formData, registrationOpen: e.target.checked })}
                    className="rounded text-white"
                  />
                  <span>Registration Open</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.certificateEligible}
                    onChange={(e) => setFormData({ ...formData, certificateEligible: e.target.checked })}
                    className="rounded text-white"
                  />
                  <span>Certificate Eligible</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 font-extrabold text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    editingEvent ? 'Save Changes' : 'Create & Publish'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
