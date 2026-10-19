'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Handshake, Plus, ExternalLink, Globe, CheckCircle2 } from 'lucide-react';

export default function PartnersSponsorsPage() {
  const { addToast } = useAdmin();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((json) => {
        // Fallback default partners
        setPartners([
          {
            name: 'Kerala Startup Mission (KSUM)',
            logo: '/ksum-logo.png',
            href: 'https://startupmission.kerala.gov.in',
            tier: 'State Nodal Incubator',
            desc: 'Nodal agency of Govt. of Kerala for entrepreneurship development.'
          },
          {
            name: 'IEDC Kerala',
            logo: '/iedc-logo.png',
            href: 'https://iedckerala.in',
            tier: 'Flagship Network',
            desc: 'Nurturing campus entrepreneurship across Kerala engineering & polytechnic colleges.'
          },
          {
            name: 'Young Innovators Programme (YIP)',
            logo: '/yip-logo.png',
            href: 'https://yip.kerala.gov.in',
            tier: 'State Grant Partner',
            desc: 'Flagship programme by K-DISC empowering polytechnic youth to solve community challenges.'
          },
          {
            name: 'MuLearn',
            logo: '/mulearn-logo.png',
            href: 'https://mulearn.org',
            tier: 'Skill Community',
            desc: 'Peer-to-peer learning network empowering students with industry micro-skills.'
          }
        ]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
          MODULE 19 / CONTENT MANAGEMENT
        </span>
        <h1 className="text-2xl font-black text-white">Partners &amp; Sponsors</h1>
        <p className="text-slate-400 text-xs">
          Manage ecosystem tie-ups with Kerala Startup Mission, K-DISC YIP, MuLearn, and industry collaborators.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {partners.map((p) => (
          <div key={p.name} className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-3">
                <img src={p.logo} alt="" className="max-h-10 max-w-[80%] object-contain" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-amber-300 font-bold uppercase">{p.tier}</span>
                <h3 className="font-bold text-white text-base leading-snug mt-0.5">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{p.desc}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5">
              <a
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Visit Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
