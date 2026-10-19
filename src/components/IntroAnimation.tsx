'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

const wordsSequence = [
  'INNOVATE',
  'CREATE',
  'INSPIRE',
  'BUILD THE FUTURE',
  'WELCOME TO IEDC GPTC PERINTHALMANNA'
];

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [phase, setPhase] = useState<'particles' | 'blueprint' | 'complete'>('particles');

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => {
        if (prev < wordsSequence.length - 1) {
          if (prev === 2) setPhase('blueprint');
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 1800);
          return prev;
        }
      });
    }, 1400);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let angle = 0;
    let cameraZ = 0;

    const render = () => {
      // 1. Pure Matte Black Screen
      ctx.fillStyle = '#0F0F10';
      ctx.fillRect(0, 0, width, height);

      angle += 0.02;
      cameraZ += 0.5;

      const centerX = width / 2;
      const centerY = height / 2;

      if (phase === 'particles') {
        // Outer Subtle Rotating Ring
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.arc(0, 0, 145, 0, Math.PI * 2);
        ctx.strokeStyle = '#F98A5B';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#F98A5B';
        ctx.setLineDash([16, 12]);
        ctx.stroke();
        ctx.restore();

        // Inner Pink Pulsing Ring
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-angle * 1.5);
        ctx.beginPath();
        ctx.arc(0, 0, 115, 0, Math.PI * 2);
        ctx.strokeStyle = '#EC3A74';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#EC3A74';
        ctx.stroke();
        ctx.restore();

        // Glowing Core Logo Emblem
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.fillStyle = '#F98A5B';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#EC3A74';
        ctx.font = '900 52px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('IEDC', 0, -10);

        ctx.font = '700 15px system-ui, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('GPTC PERINTHALMANNA', 0, 32);
        ctx.restore();
      } else {
        // Blueprint Mode: Wireframe grid flying towards campus
        ctx.save();
        ctx.translate(centerX, centerY + 100);

        ctx.strokeStyle = 'rgba(249, 138, 91, 0.3)';
        ctx.lineWidth = 1;

        const horizonY = -150;
        for (let x = -width; x <= width; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 300);
          ctx.lineTo(x * 0.2, horizonY);
          ctx.stroke();
        }

        const gridSpeed = (cameraZ % 40);
        for (let y = 300; y >= horizonY; y -= 30) {
          ctx.beginPath();
          ctx.moveTo(-width, y + gridSpeed);
          ctx.lineTo(width, y + gridSpeed);
          ctx.stroke();
        }

        // Campus wireframes
        const buildings = [
          { x: -220, y: 50, w: 120, h: 160 },
          { x: -60, y: -20, w: 160, h: 220 },
          { x: 130, y: 40, w: 110, h: 140 }
        ];

        buildings.forEach((b) => {
          ctx.strokeStyle = '#F98A5B';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#EC3A74';
          ctx.strokeRect(b.x, b.y - b.h, b.w, b.h);

          ctx.beginPath();
          ctx.moveTo(b.x, b.y - b.h);
          ctx.lineTo(b.x + b.w / 2, b.y - b.h - 30);
          ctx.lineTo(b.x + b.w, b.y - b.h);
          ctx.stroke();
        });

        ctx.font = '700 18px monospace';
        ctx.fillStyle = '#F98A5B';
        ctx.textAlign = 'center';
        ctx.fillText('GOVERNMENT POLYTECHNIC COLLEGE PERINTHALMANNA', 0, -220);

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [phase]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0F0F10] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Skip Button */}
      <button
        onClick={onComplete}
        className="absolute top-8 right-8 z-50 flex items-center gap-2 px-5 py-2.5 rounded-full glass-iedc hover:bg-[#F98A5B]/20 text-[#F98A5B] text-sm font-semibold transition-all border border-[#F98A5B]/30 glow-orange cursor-pointer"
      >
        <span>Skip Intro</span>
        <Play className="w-4 h-4 fill-[#F98A5B]" />
      </button>

      {/* Text Overlay */}
      <div className="relative z-10 text-center px-4 max-w-4xl pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={wordIndex}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 1.1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center gap-4"
          >
            <div className="flex items-center gap-2 text-[#F98A5B] font-mono text-xs tracking-widest uppercase">
              <Sparkles className="w-4 h-4 animate-spin text-[#EC3A74]" />
              <span>OFFICIAL IEDC KERALA • GPTC PMNA</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F98A5B] to-[#EC3A74] tracking-tight leading-none drop-shadow-2xl">
              {wordsSequence[wordIndex]}
            </h1>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 h-1 bg-[#1B1B1D] rounded-full overflow-hidden border border-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] glow-orange"
          initial={{ width: '0%' }}
          animate={{ width: `${((wordIndex + 1) / wordsSequence.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
};
