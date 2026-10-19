'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Bell, Plus, CheckCircle2, Send } from 'lucide-react';

export default function NotificationsManagerPage() {
  const { addToast } = useAdmin();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('All');

  const loadData = () => {
    fetch('/api/admin/notifications')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setNotifications(json.data || []);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      targetAudience: target,
      createdAt: new Date().toISOString()
    };
    setNotifications([newNotif, ...notifications]);
    addToast('Notification Dispatched', `Alert sent to ${target} administrative users.`, 'success');
    setTitle('');
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
          MODULE 20 / GOVERNANCE
        </span>
        <h1 className="text-2xl font-black text-white">System Notifications &amp; Alerts</h1>
        <p className="text-slate-400 text-xs">
          Broadcast administrative updates and important alerts to the dashboard console.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-slate-300" /> Dispatch New Notification
          </h3>

          <form onSubmit={handleSend} className="space-y-3.5 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Alert Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Schedule Verification Audit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Notification Message</label>
              <textarea
                rows={3}
                required
                placeholder="Alert details..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Target Role</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="All">All Administrators</option>
                <option value="Faculty">Faculty Coordinators Only</option>
                <option value="Student Lead">Student Leads Only</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white text-black font-extrabold text-xs shadow hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Dispatch Alert
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-sm font-bold text-white">Notification History</h3>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 rounded-2xl bg-[#121216] border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{n.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                <span className="text-[9px] font-mono text-amber-300">Target: {n.targetAudience}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
