'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AIChatbot } from '@/components/AIChatbot';
import { IntroAnimation } from '@/components/IntroAnimation';
import { ParticleBackground } from '@/components/ParticleBackground';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    // Show intro animation only on first visit to public root homepage
    if (!isAdminRoute && pathname === '/') {
      const hasSeenIntro = sessionStorage.getItem('iedc_intro_seen');
      if (!hasSeenIntro) {
        setShowIntro(true);
      }
    }
  }, [isAdminRoute, pathname]);

  const handleIntroComplete = () => {
    sessionStorage.setItem('iedc_intro_seen', 'true');
    setShowIntro(false);
  };

  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <title>IEDC GPTC PMNA — Innovation &amp; Entrepreneurship Development Centre</title>
        <meta
          name="description"
          content="Official Innovation & Entrepreneurship Development Centre of Government Polytechnic College, Perinthalmanna."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0F0F10" />
        <link rel="icon" href="/iedc-logo.png" type="image/png" />
      </head>
      <body className="bg-[#0F0F10] text-[#ECECEC] min-h-screen flex flex-col antialiased selection:bg-slate-300 selection:text-black relative font-sans">
        <AppProvider>
          {isAdminRoute ? (
            // Dedicated Private Admin Backend Area - Zero public components
            <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col font-sans">
              {children}
            </div>
          ) : (
            // Dedicated Public Frontend Area
            <div className="flex flex-col min-h-screen relative">
              {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
              <ParticleBackground />

              {/* Subtle Watermark Logo */}
              <div
                className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.03]"
                aria-hidden="true"
              >
                <img
                  src="/iedc-logo.png"
                  alt=""
                  style={{ width: '700px', height: 'auto', filter: 'brightness(1.4)' }}
                />
              </div>

              <Navbar />
              <main className="flex-1 relative z-10">{children}</main>
              <Footer />
              <AIChatbot />
            </div>
          )}
        </AppProvider>
      </body>
    </html>
  );
}
