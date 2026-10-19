'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserCheck, ShieldCheck, Mail, Phone, Share2, ExternalLink } from 'lucide-react';

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faculty.map((fac) => (
            <div key={fac.id} className="p-6 sm:p-8 rounded-3xl bg-[#121216] border border-white/10 space-y-4 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={fac.photoUrl || '/college-logo.png'}
                    alt={fac.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white/15 shadow"
                  />
                  <div>
                    <h3 className="font-extrabold text-white text-lg">{fac.name}</h3>
                    <p className="text-xs text-amber-300 font-bold">{fac.designation}</p>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{fac.department}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#18181D] p-4 rounded-2xl border border-white/5">
                  {fac.bio}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${fac.email}`} className="hover:text-white font-mono">{fac.email}</a>
                </div>
                {fac.phone && (
                  <div className="flex items-center gap-2 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fac.phone}</span>
                  </div>
                )}
              </div>
            </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {committee.map((mem) => (
            <div key={mem.id} className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 flex flex-col justify-between text-center items-center shadow-lg group hover:border-white/20 transition-all">
              <div className="space-y-3 w-full flex flex-col items-center">
                {mem.photoUrl ? (
                  <img
                    src={mem.photoUrl}
                    alt={mem.name}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-white/10 shadow group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-neutral-800 border-2 border-[#F98A5B]/30 flex items-center justify-center shadow group-hover:border-[#F98A5B] transition-colors">
                    <span className="text-xl font-black text-[#F98A5B]">
                      {mem.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-white text-base leading-snug">{mem.name}</h3>
                  <p className="text-xs text-cyan-300 font-bold mt-0.5">{mem.position}</p>
                  <span className="text-[10px] font-mono text-slate-400 block">{mem.department}</span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed text-left w-full bg-[#18181D] p-3 rounded-xl border border-white/5">
                  {mem.bio || 'Organizing bootcamps, workshops, and prototype hackathons.'}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between w-full text-xs text-slate-400">
                <span className="text-[10px] font-mono">{mem.academicYear}</span>
                {mem.linkedinUrl && (
                  <a
                    href={mem.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Profile link"
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
