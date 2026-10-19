'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Lightbulb, CheckCircle2, XCircle, UserCheck, Search, Filter } from 'lucide-react';

export default function InnovationIdeasPage() {
  const { addToast } = useAdmin();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetch('/api/admin/ideas')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setIdeas(json.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdate = async (id: string, status: string, mentor = 'Prof. Muhammed Rashid') => {
    try {
      const res = await fetch('/api/admin/ideas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, mentor })
      });
      if (res.ok) {
        addToast('Idea Proposal Updated', `Proposal marked as ${status}`, 'success');
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
          MODULE 12 / INNOVATION &amp; ACADEMICS
        </span>
        <h1 className="text-2xl font-black text-white">Innovation Ideas Review Desk</h1>
        <p className="text-slate-400 text-xs">
          Evaluate student problem statements, approve promising ideas, and assign faculty nodal mentors for seed grant incubation.
        </p>
      </div>

      <div className="space-y-4">
        {ideas.map((idea) => (
          <div key={idea.id} className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-white">{idea.title}</h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  By {idea.studentName} ({idea.registerNumber}) • {idea.department}
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border ${
                  idea.status === 'Approved'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : idea.status === 'Rejected'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {idea.status}
              </span>
            </div>

            <div className="text-xs text-slate-300 space-y-2 bg-[#18181D] p-4 rounded-2xl border border-white/5">
              <div>
                <strong className="text-white block mb-0.5 font-bold">Problem Statement:</strong>
                <p className="leading-relaxed">{idea.problemStatement}</p>
              </div>
              <div>
                <strong className="text-white block mb-0.5 font-bold">Proposed Solution:</strong>
                <p className="leading-relaxed">{idea.proposedSolution}</p>
              </div>
              {idea.assignedMentor && (
                <div className="text-amber-300 font-mono text-[11px] pt-1 border-t border-white/5">
                  Mentor Assigned: {idea.assignedMentor}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => handleUpdate(idea.id, 'Rejected')}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs cursor-pointer"
              >
                Reject Proposal
              </button>
              <button
                onClick={() => handleUpdate(idea.id, 'Approved', 'Prof. Muhammed Rashid')}
                className="px-4 py-1.5 rounded-xl bg-white text-black hover:bg-slate-200 font-extrabold text-xs cursor-pointer"
              >
                Approve &amp; Assign Nodal Mentor
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
