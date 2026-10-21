'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserCheck, ShieldCheck, Mail, Phone, Share2, ExternalLink } from 'lucide-react';
import AnimatedProfileCard from '@/components/team/AnimatedProfileCard';

export default function PublicCommitteePage() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [committee, setCommittee] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/committee')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setFaculty(json.data.facultyCoordinators || []);
          setCommittee(json.data.executiveCommittee || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16 min-h-screen relative z-10 font-sans">
      
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-mono font-bold tracking-wider uppercase">
          <UserCheck className="w-4 h-4 text-amber-300" /> Leadership &amp; Governance
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Executive Committee &amp; Faculty Coordinators
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          The driving force behind IEDC Government Polytechnic College Perinthalmanna, committed to fostering student entrepreneurship, patent prototyping, and technical leadership.
        </p>

        <div className="pt-2 flex justify-center">
          <Link
            href="/team"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F98A5B] hover:bg-[#fa753e] text-neutral-950 font-bold text-xs shadow-lg transition-colors"
          >
            <span>Explore Complete IEDC Team &amp; Student Leads Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* SECTION 1: FACULTY COORDINATORS */}
      <section id="faculty" className="space-y-6 scroll-mt-24">
        <div className="border-b border-white/10 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <span>Faculty Coordinators &amp; Nodal Leadership</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Accredited institutional mentors overseeing incubation, KSUM liaisons, and academic grants.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
          {faculty.map((fac, idx) => (
            <AnimatedProfileCard
              key={fac.id}
              member={{
                ...fac,
                role: fac.designation || 'Faculty Coordinator',
                category: 'Faculty Leadership'
              }}
              index={idx}
              containerHeight="h-80 sm:h-96"
              layoutVariant="faculty"
            />
          ))}
        </div>
      </section>

      {/* SECTION 2: STUDENT EXECUTIVE COMMITTEE */}
      <section className="space-y-6">
        <div className="border-b border-white/10 pb-3">
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-cyan-400" />
            <span>Student Executive Committee</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Elected student innovators leading Maker Space events, hackathons, and community growth.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {committee.map((mem, idx) => (
            <AnimatedProfileCard
              key={mem.id}
              member={{
                ...mem,
                role: mem.role || mem.position || 'Executive Member'
              }}
              index={idx}
              containerHeight="h-72 sm:h-80"
              layoutVariant="team"
            />
          ))}
        </div>
      </section>

    </div>
  );
}
