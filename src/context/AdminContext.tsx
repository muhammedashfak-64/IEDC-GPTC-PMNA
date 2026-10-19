'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'faculty_coordinator' | 'student_lead';
  department?: string;
  designation?: string;
  staffId?: string;
  phone?: string;
  avatar?: string;
}

export interface AdminToast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AdminContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFaculty: boolean;
  isStudentLead: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  toasts: AdminToast[];
  addToast: (title: string, message: string, type?: AdminToast['type']) => void;
  removeToast: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (c: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<AdminToast[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const addToast = useCallback((title: string, message: string, type: AdminToast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth/session', { cache: 'no-store' });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        addToast('Authentication Verified', `Logged in as ${data.user.full_name} (${data.user.role === 'faculty_coordinator' ? 'Faculty Coordinator' : 'Student Lead'})`, 'success');
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Invalid credentials' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setIsAuthenticated(false);
    addToast('Logged Out', 'Administrative session terminated safely.', 'info');
    router.push('/admin/login');
  };

  const isFaculty = user?.role === 'faculty_coordinator';
  const isStudentLead = user?.role === 'student_lead';

  return (
    <AdminContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isFaculty,
        isStudentLead,
        login,
        logout,
        refreshSession,
        toasts,
        addToast,
        removeToast,
        searchQuery,
        setSearchQuery,
        sidebarCollapsed,
        setSidebarCollapsed
      }}
    >
      {children}

      {/* Admin Toast Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-xl border shadow-2xl backdrop-blur-xl pointer-events-auto flex items-start justify-between gap-3 text-xs font-semibold ${
              t.type === 'success'
                ? 'border-emerald-500/40 text-emerald-200 bg-[#0E1713]/95'
                : t.type === 'error'
                ? 'border-rose-500/40 text-rose-200 bg-[#1A0D0E]/95'
                : t.type === 'warning'
                ? 'border-amber-500/40 text-amber-200 bg-[#1A1409]/95'
                : 'border-white/20 text-slate-200 bg-[#121214]/95'
            }`}
          >
            <div>
              <h4 className="font-bold text-sm text-white">{t.title}</h4>
              <p className="mt-0.5 opacity-90">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white ml-2 text-sm"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
