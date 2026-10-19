'use client';

import React, { useEffect, useRef } from 'react';
import { CertificateItem } from '@/types';
import { Download, ShieldCheck, Printer } from 'lucide-react';

interface CertificateGeneratorProps {
  certificate: CertificateItem;
}

export const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({ certificate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 850;

    // Background Gradient: Deep Purple to Royal Purple
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 850);
    bgGrad.addColorStop(0, '#201547');
    bgGrad.addColorStop(0.5, '#2D1E64');
    bgGrad.addColorStop(1, '#6249A3');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 850);

    // Decorative Coral Orange & Pink Borders
    ctx.strokeStyle = '#F98A5B';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 1140, 790);

    ctx.strokeStyle = '#EC3A74';
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, 1116, 766);

    // Corner Ornaments
    ctx.fillStyle = '#F98A5B';
    ctx.fillRect(30, 30, 40, 40);
    ctx.fillRect(1130, 30, 40, 40);
    ctx.fillRect(30, 780, 40, 40);
    ctx.fillRect(1130, 780, 40, 40);

    // Top Header Titles
    ctx.fillStyle = '#F98A5B';
    ctx.font = '700 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GOVERNMENT POLYTECHNIC COLLEGE PERINTHALMANNA', 600, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px system-ui, sans-serif';
    ctx.fillText('INNOVATION & ENTREPRENEURSHIP DEVELOPMENT CENTRE', 600, 160);

    ctx.fillStyle = '#EC3A74';
    ctx.font = '700 16px monospace';
    ctx.fillText('AFFILIATED WITH KERALA STARTUP MISSION (KSUM)', 600, 195);

    // Certificate Type Badge
    ctx.fillStyle = '#201547';
    ctx.fillRect(400, 230, 400, 45);
    ctx.strokeStyle = '#F98A5B';
    ctx.lineWidth = 2;
    ctx.strokeRect(400, 230, 400, 45);

    ctx.fillStyle = '#F98A5B';
    ctx.font = '800 22px system-ui, sans-serif';
    ctx.fillText(`CERTIFICATE OF ${certificate.certificateType.toUpperCase()}`, 600, 260);

    // Body Text
    ctx.fillStyle = '#f5f5f5';
    ctx.font = '500 20px system-ui, sans-serif';
    ctx.fillText('This is proudly presented to', 600, 340);

    // Participant Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px system-ui, sans-serif';
    ctx.fillText(certificate.participantName.toUpperCase(), 600, 410);

    // Underline for name
    ctx.strokeStyle = '#EC3A74';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(350, 430);
    ctx.lineTo(850, 430);
    ctx.stroke();

    // Event details
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '400 18px system-ui, sans-serif';
    ctx.fillText(`Reg. No: ${certificate.registerNumber} for active participation in`, 600, 475);

    ctx.fillStyle = '#F98A5B';
    ctx.font = '800 28px system-ui, sans-serif';
    ctx.fillText(certificate.eventName, 600, 525);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '400 16px system-ui, sans-serif';
    ctx.fillText(`Organized by IEDC GPTC PMNA on ${certificate.eventDate}`, 600, 565);

    // Signatures & QR Code
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.fillText('Prof. Muhammed Rashid', 300, 710);
    ctx.fillStyle = '#f5f5f5';
    ctx.font = '400 14px system-ui, sans-serif';
    ctx.fillText('Nodal Officer, IEDC', 300, 730);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.fillText('Er. Abdul Hameed', 900, 710);
    ctx.fillStyle = '#f5f5f5';
    ctx.font = '400 14px system-ui, sans-serif';
    ctx.fillText('Principal / Patron', 900, 730);

    ctx.fillStyle = '#F98A5B';
    ctx.font = '700 14px monospace';
    ctx.fillText(`ID: ${certificate.certificateId}`, 600, 720);

    const qrImg = new Image();
    qrImg.crossOrigin = 'Anonymous';
    qrImg.src = certificate.qrCodeUrl;
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 560, 610, 80, 80);
    };
  }, [certificate]);

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${certificate.certificateId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-4 text-center">
      <div className="overflow-x-auto rounded-3xl border border-[#F98A5B]/30 shadow-2xl p-2 bg-[#201547]">
        <canvas ref={canvasRef} className="max-w-full h-auto mx-auto rounded-2xl" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={downloadPNG}
          className="px-6 py-3 rounded-2xl btn-primary-iedc font-extrabold text-xs shadow-lg flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4 text-white" /> Download Official PNG Certificate
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-3 rounded-2xl glass-iedc border border-white/20 text-[#F98A5B] font-bold text-xs hover:bg-white/10 flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>
    </div>
  );
};
