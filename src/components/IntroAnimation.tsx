'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'intro' | 'revealed' | 'fading'>('intro');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      onComplete();
      return;
    }

    // Sequence timer:
    // 0.0s - 1.2s: 3D logo reveal & ambient lighting
    // 1.2s - 2.8s: Full institutional identity reveal
    // 2.8s: Smooth transition to homepage
    const revealTimer = setTimeout(() => {
      setPhase('revealed');
    }, 1100);

    const fadeTimer = setTimeout(() => {
      setPhase('fading');
    }, 2800);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3400);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  // Subtle 3D card tilt tracking mouse
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x: x * 18, y: -y * 18 });
  };

  return (
    <AnimatePresence>
      {phase !== 'fading' ? (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090B] text-white overflow-hidden select-none"
          onMouseMove={handleMouseMove}
          ref={containerRef}
        >
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-[#F98A5B]/15 via-[#EC3A74]/10 to-[#6249A3]/15 rounded-full blur-[130px] opacity-70 animate-pulse" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,9,11,0.85)_80%)]" />
          </div>

          {/* Minimal Geometric Perspective Grid Lines */}
          <div className="absolute inset-0 opacity-[0.035] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]">
            <div className="w-full h-full border-t border-b border-white/20 grid grid-cols-6 grid-rows-6" />
          </div>

          {/* Skip Button Top Right */}
          <div className="absolute top-6 right-6 z-20">
            <button
              onClick={onComplete}
              className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-xs font-mono font-medium text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg backdrop-blur-md"
            >
              <span>Explore Website</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F98A5B]" />
              <span className="text-[10px] text-slate-500 hidden sm:inline ml-1">[Esc]</span>
            </button>
          </div>

          {/* Main 3D Card Emblem Container */}
          <div className="relative z-10 max-w-xl mx-auto px-6 text-center perspective-[1200px]">
            <motion.div
              style={{
                rotateY: mousePos.x,
                rotateX: mousePos.y,
                transformStyle: 'preserve-3d'
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
            >
              {/* Decorative Subtle Corner Accents */}
              <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-[#F98A5B]/40 rounded-tl-sm" />
              <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-[#EC3A74]/40 rounded-tr-sm" />
              <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-[#6249A3]/40 rounded-bl-sm" />
              <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-[#F98A5B]/40 rounded-br-sm" />

              {/* Real Official Logos Reveal in 3D */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center gap-6 sm:gap-8 mb-8"
              >
                {/* Government Polytechnic College Crest */}
                <div className="relative group">
                  <div className="absolute -inset-2 rounded-2xl bg-white/5 blur-md group-hover:bg-[#F98A5B]/20 transition-colors" />
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 p-2.5 rounded-2xl bg-black/40 border border-white/15 flex items-center justify-center shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/college-logo.png"
                      alt="Government Polytechnic College Perinthalmanna Crest"
                      className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    />
                  </div>
                </div>

                {/* Central Glowing Divider */}
                <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                {/* Official IEDC GPTC PMNA Logo */}
                <div className="relative group">
                  <div className="absolute -inset-2 rounded-2xl bg-white/5 blur-md group-hover:bg-[#EC3A74]/20 transition-colors" />
                  <div className="relative h-16 sm:h-20 px-3 py-2 rounded-2xl bg-black/40 border border-white/15 flex items-center justify-center shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/iedc-gptc-pmna-logo.png"
                      alt="IEDC GPTC PMNA Official Logo"
                      className="h-full w-auto max-w-[170px] sm:max-w-[210px] object-contain filter drop-shadow-[0_4px_14px_rgba(249,138,91,0.25)]"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Institutional Typography Reveal */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#F98A5B] uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" />
                  <span>Innovation Ecosystem</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  IEDC{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F98A5B] via-[#EC3A74] to-[#9D4EDD]">
                    GPTC PMNA
                  </span>
                </h2>

                <p className="text-xs sm:text-sm font-semibold text-slate-300 tracking-wide uppercase">
                  Innovation &amp; Entrepreneurship Development Centre
                </p>

                <p className="text-xs font-mono text-slate-400">
                  Government Polytechnic College, Perinthalmanna
                </p>
              </motion.div>

              {/* Progress Bar Indicator */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="w-48 mx-auto h-1 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.8, ease: 'linear' }}
                    className="h-full bg-gradient-to-r from-[#F98A5B] via-[#EC3A74] to-[#6249A3]"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-2 block tracking-wider">
                  Entering Campus Innovation Portal...
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
