'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PublicDashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect internal dashboard request to the private admin dashboard
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <span className="text-xs font-mono uppercase tracking-wider">Redirecting to Admin Dashboard...</span>
      </div>
    </div>
  );
}
