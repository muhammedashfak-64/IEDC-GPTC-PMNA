'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, Phone, ExternalLink } from 'lucide-react';

import AnimatedProfileCard from '@/components/team/AnimatedProfileCard';

export default function PublicFacultyPage() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/committee')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setFaculty(json.data.facultyCoordinators || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 min-h-screen relative z-10 font-sans">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-mono font-bold tracking-wider uppercase">
          <ShieldCheck className="w-4 h-4 text-amber-300" /> Nodal Officer Leadership
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Faculty Coordinators
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          The institutional leadership driving the Innovation &amp; Entrepreneurship Development Centre at Government Polytechnic College, Perinthalmanna.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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

      <div className="text-center pt-6">
        <Link
          href="/committee"
          className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs inline-flex items-center gap-2 transition-colors"
        >
          <span>View Student Executive Committee</span>
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
