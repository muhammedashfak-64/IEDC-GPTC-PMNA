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
import { Analytics } from '@vercel/analytics/next';

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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="IEDC GPTC PMNA" />
        <meta name="application-name" content="IEDC GPTC PMNA" />
        <meta name="msapplication-TileColor" content="#0F0F10" />
        <meta name="msapplication-TileImage" content="/icon-512.png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
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
        <Analytics />
      </body>
    </html>
  );
}
