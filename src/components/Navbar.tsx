'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Menu,
  X,
  FileCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logos, setLogos] = useState({
    iedcGptcPmnaLogoUrl: '/iedc-gptc-pmna-logo.png',
    collegeLogoUrl: '/college-logo.png',
    iedcLogoUrl: '/iedc-logo.png'
  });

  React.useEffect(() => {
    fetch('/api/public/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setLogos({
            iedcGptcPmnaLogoUrl: json.data.iedcGptcPmnaLogoUrl || '/iedc-gptc-pmna-logo.png',
            collegeLogoUrl: json.data.collegeLogoUrl || '/college-logo.png',
            iedcLogoUrl: json.data.iedcLogoUrl || '/iedc-logo.png'
          });
        }
      })
      .catch(() => {});
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/#about' },
    { name: 'Events', href: '/events' },
    { name: 'Team & Leads', href: '/team' },
    { name: 'Projects', href: '/projects' },
    { name: 'Startups', href: '/startups' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Faculty', href: '/faculty' },
    { name: 'Resources', href: '/resources' },
    { name: 'Certificates', href: '/certificates' },
    { name: 'Contact', href: '/contact' }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    router.push(`/projects?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#0F0F10]/90 border-b border-white/10 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Institutional Crests & Branding - Order: 1. IEDC GPTC PMNA, 2. College Crest, 3. Official IEDC */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0" title="IEDC GPTC PMNA">
            {/* 1. IEDC GPTC PMNA Logo */}
            {logos.iedcGptcPmnaLogoUrl && (
              <img
                src={logos.iedcGptcPmnaLogoUrl}
                alt="IEDC GPTC PMNA"
                className="h-9 sm:h-11 w-auto max-w-[130px] sm:max-w-[155px] object-contain drop-shadow-md transition-transform group-hover:scale-105 duration-200"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            )}

            {/* Subtle Divider */}
            <div className="hidden sm:block h-6 w-px bg-white/15" />

            {/* 2. Government Polytechnic College, Perinthalmanna Logo */}
            {logos.collegeLogoUrl && (
              <img
                src={logos.collegeLogoUrl}
                alt="Government Polytechnic College Perinthalmanna"
                className="h-8 sm:h-9 w-auto max-w-[38px] sm:max-w-[42px] object-contain drop-shadow-md transition-transform group-hover:scale-105 duration-200"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            )}

            {/* 3. Official Kerala IEDC Logo */}
            {logos.iedcLogoUrl && (
              <img
                src={logos.iedcLogoUrl}
                alt="Kerala IEDC"
                className="h-8 sm:h-9 w-auto max-w-[38px] sm:max-w-[42px] object-contain drop-shadow-md transition-transform group-hover:scale-105 duration-200"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            )}
          </Link>

          {/* Desktop Navigation Links - ZERO Login Buttons */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && !link.href.includes('#') && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-xs xl:text-sm font-semibold transition-all relative py-1 ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Tools: Search & Mobile Menu Button */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/certificates"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all"
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Get Certificate</span>
            </Link>

            {/* Global Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Search Portal"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-200 hover:text-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer - ZERO Login Buttons */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0F0F10] border-t border-white/10 px-4 pt-3 pb-6 space-y-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-2xl bg-[#121216] p-6 rounded-3xl border border-white/20 shadow-2xl relative">
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 border-b border-white/20 pb-4">
              <Search className="w-5 h-5 text-slate-300" />
              <input
                type="text"
                placeholder="Search student projects, hackathons, events, learning resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-transparent border-none text-base text-white placeholder-slate-400 focus:outline-none"
              />
            </form>
          </div>
        </div>
      )}
    </>
  );
};
