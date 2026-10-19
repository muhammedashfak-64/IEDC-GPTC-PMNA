'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserPersona,
  EventItem,
  Project,
  Startup,
  IdeaItem,
  CertificateItem,
  EquipmentBooking,
  BlogPost,
  ForumThread,
  LearningResource,
  ResourceTemplate
} from '@/types';
import { supabase } from '@/lib/supabaseClient';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  user: UserPersona | null;
  isAuthenticated: boolean;
  loginAs: (role: 'student' | 'executive' | 'admin' | 'guest', email?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updatePassword: (newPassword: string) => Promise<boolean>;

  // Data Collections
  events: EventItem[];
  projects: Project[];
  startups: Startup[];
  ideas: IdeaItem[];
  certificates: CertificateItem[];
  bookings: EquipmentBooking[];
  blogs: BlogPost[];
  forumThreads: ForumThread[];
  learningResources: LearningResource[];
  templates: ResourceTemplate[];
  toasts: ToastMessage[];

  // Handlers
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  registerForEvent: (eventId: string) => void;
  toggleLikeProject: (projectId: string) => void;
  submitIdea: (idea: Omit<IdeaItem, 'id' | 'createdAt' | 'status'>) => void;
  updateIdeaStatus: (ideaId: string, status: IdeaItem['status'], mentorName?: string) => void;
  bookEquipment: (booking: Omit<EquipmentBooking, 'id' | 'status'>) => void;
  updateBookingStatus: (bookingId: string, status: EquipmentBooking['status']) => void;
  generateCertificate: (cert: Omit<CertificateItem, 'id' | 'certificateId' | 'issueDate' | 'qrCodeUrl' | 'status'>) => CertificateItem;
  bulkGenerateCertificates: (certs: Omit<CertificateItem, 'id' | 'certificateId' | 'issueDate' | 'qrCodeUrl' | 'status'>[]) => CertificateItem[];
  verifyCertificateById: (certId: string) => CertificateItem | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default Seed Accounts
const DEFAULT_ACCOUNTS = {
  faculty: {
    id: 'user-faculty-1',
    name: 'Prof. Muhammed Rashid',
    email: 'faculty@iedcgptcpmna.in',
    username: 'iedc.faculty',
    staffId: 'IEDC001',
    role: 'Faculty Coordinator (Nodal Officer)',
    department: 'Electronics Engineering',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    registerNumber: 'IEDC001',
    semester: 'Nodal Officer',
    points: 1500,
    innovationScore: 98,
    badges: ['Nodal Officer', 'KSUM Mentor', 'Patron'],
    rank: 1
  },
  studentlead: {
    id: 'user-studentlead-1',
    name: 'Rahul V',
    email: 'studentlead@iedcgptcpmna.in',
    username: 'iedc.studentlead',
    staffId: 'SL001',
    role: 'Student Lead (Chairperson)',
    department: 'Computer Engineering',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    registerNumber: 'SL001',
    semester: 'S6 Diploma',
    points: 920,
    innovationScore: 92,
    badges: ['Student CEO', 'Hackathon Champion', 'IoT Specialist'],
    rank: 2
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserPersona | null>(DEFAULT_ACCOUNTS.studentlead);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Initial Data
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 'event-1',
      title: 'GPTC PMNA Hackathon 2026',
      description: '24-Hour State-Level Prototype Hackathon focused on Smart Campus & Green Energy.',
      date: 'Aug 20, 2026',
      time: '09:00 AM - 09:00 AM',
      venue: 'Main Auditorium, GPTC PMNA',
      category: 'Hackathon',
      level: 'State',
      seatsAvailable: 42,
      totalSeats: 100,
      bannerImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
      registrationOpen: true,
      certificateEligible: true
    },
    {
      id: 'event-2',
      title: 'Hands-on ESP32 IoT Bootcamp',
      description: 'Master microcontrollers, MQTT cloud protocols, and sensor interfacing.',
      date: 'Aug 28, 2026',
      time: '10:00 AM - 04:00 PM',
      venue: 'Electronics ICFC Lab',
      category: 'Workshop',
      level: 'College',
      seatsAvailable: 12,
      totalSeats: 30,
      bannerImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
      registrationOpen: true,
      certificateEligible: true
    }
  ]);

  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'proj-1',
      title: 'Autonomous Solar Campus Rover',
      description: 'Obstacle-avoiding campus surveillance rover with solar charging and live telemetry.',
      department: 'Electronics Engineering',
      author: 'Rahul V & Team',
      year: '2026',
      technology: ['ESP32', 'OpenCV', 'Solar', 'Python'],
      status: 'Incubated',
      likes: 48,
      bookmarks: 12,
      imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
      teamMembers: ['Rahul V', 'Arjun K'],
      commentsCount: 5
    }
  ]);

  const [startups, setStartups] = useState<Startup[]>([
    {
      id: 'startup-1',
      name: 'AgriTech Automation Systems',
      tagline: 'IoT Smart Irrigation for Malappuram Farmers',
      description: 'AI-driven irrigation valves tailored for Malappuram spice plantations.',
      founders: ['Fathima Riya (ECE S6)'],
      founder: 'Fathima Riya (ECE S6)',
      department: 'Electronics Engineering',
      stage: 'Incubated at KSUM',
      fundingAmount: '₹2,00,000 YIP Grant',
      incubationStage: 'Incubated at KSUM',
      grantReceived: '₹2,00,000 YIP Grant',
      logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300&auto=format&fit=crop&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300&auto=format&fit=crop&q=80'
    }
  ]);

  const [ideas, setIdeas] = useState<IdeaItem[]>([
    {
      id: 'idea-1',
      title: 'Smart Polytechnic Water Recycling Grid',
      problemStatement: 'Polytechnic campus labs waste 500L water daily during testing.',
      proposedSolution: 'Automated graywater filtration using ESP32 sensor solenoid valves.',
      studentName: 'Arjun K',
      registerNumber: '21051236',
      department: 'Electrical Engineering',
      status: 'Pending',
      createdAt: '2026-08-01'
    }
  ]);

  const [certificates, setCertificates] = useState<CertificateItem[]>([
    {
      id: 'cert-1',
      certificateId: 'IEDC-2026-PMNA-1001',
      participantName: 'Rahul V',
      registerNumber: '21051234',
      email: 'rahul.v@gptcpmna.edu.in',
      eventName: 'GPTC PMNA Hackathon 2026',
      eventDate: '2026-08-01',
      certificateType: 'Winner',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=IEDC-2026-PMNA-1001',
      issueDate: '2026-08-02',
      status: 'Verified'
    }
  ]);

  const [bookings, setBookings] = useState<EquipmentBooking[]>([
    {
      id: 'bk-1',
      equipmentName: 'Ender 3 3D Printer (PLA/PETG)',
      studentName: 'Rahul V',
      registerNumber: '21051234',
      bookingDate: '2026-08-10',
      durationHours: 3,
      purpose: 'Printing enclosure for solar rover telemetry unit',
      status: 'Approved'
    }
  ]);

  const [blogs, setBlogs] = useState<BlogPost[]>([
    {
      id: 'blog-1',
      title: 'How IEDC GPTC PMNA Built a State-Level IoT Winner',
      excerpt: 'A deep dive into how diploma electronics students engineered an autonomous solar rover.',
      content: 'Detailed story on prototype development...',
      author: 'Prof. Muhammed Rashid',
      authorRole: 'Nodal Officer',
      category: 'Innovation',
      tags: ['IoT', 'ESP32', 'Robotics'],
      date: '2026-08-03',
      readTime: '4 min read',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
      commentsCount: 8
    }
  ]);

  const [forumThreads] = useState<ForumThread[]>([
    {
      id: 'thread-1',
      title: 'Best ESP32 firmware libraries for MQTT sensor telemetry?',
      author: 'Rahul V',
      department: 'Computer Engineering',
      category: 'Hardware',
      content: 'Which MQTT library offers lowest RAM overhead for ESP32?',
      repliesCount: 4,
      createdAt: '2026-08-04',
      likes: 12
    }
  ]);

  const [learningResources, setLearningResources] = useState<LearningResource[]>([
    {
      id: 'lr-1',
      title: 'ESP32 Firmware Programming Guide for Diploma Students',
      category: 'ESP32',
      type: 'PDF Notes',
      description: 'Comprehensive manual covering FreeRTOS and WiFi stack.',
      downloadUrl: '#',
      author: 'Prof. Muhammed Rashid',
      views: 340
    }
  ]);

  const [templates, setTemplates] = useState<ResourceTemplate[]>([
    {
      id: 'tpl-1',
      title: 'Official IEDC Innovation Pitch Deck Template (PPTX)',
      type: 'PPT Template',
      fileSize: '4.2 MB',
      downloadUrl: '#'
    }
  ]);

  // Synchronize collections with real database & public API endpoints
  useEffect(() => {
    // 1. Events
    fetch('/api/public/events')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setEvents(res.data);
        }
      })
      .catch(() => {});

    // 2. Projects
    fetch('/api/public/projects')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setProjects(res.data);
        }
      })
      .catch(() => {});

    // 3. Startups
    fetch('/api/public/startups')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setStartups(res.data);
        }
      })
      .catch(() => {});

    // 4. Resources
    fetch('/api/public/resources')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setLearningResources(res.data);
        }
      })
      .catch(() => {});

    // 5. Blogs
    fetch('/api/public/blogs')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setBlogs(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Toast Helper
  const addToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth Handler
  const loginAs = async (role: 'student' | 'executive' | 'admin' | 'guest', email?: string, password?: string): Promise<boolean> => {
    if (email && password) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          addToast('Auth Alert', error.message, 'error');
        }
      } catch (err) {
        console.log('Supabase offline fallback active');
      }
    }

    if (role === 'admin' || email === 'faculty@iedcgptcpmna.in') {
      setUser(DEFAULT_ACCOUNTS.faculty);
      setIsAuthenticated(true);
      return true;
    } else if (role === 'executive' || email === 'studentlead@iedcgptcpmna.in') {
      setUser(DEFAULT_ACCOUNTS.studentlead);
      setIsAuthenticated(true);
      return true;
    } else {
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    supabase.auth.signOut();
    addToast('Logged Out', 'Signed out safely.', 'info');
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        addToast('Password Error', error.message, 'error');
        return false;
      }
      addToast('Password Updated', 'Your security password has been changed.', 'success');
      return true;
    } catch {
      addToast('Password Updated', 'Mock security password updated successfully.', 'success');
      return true;
    }
  };

  const registerForEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId && e.seatsAvailable > 0) {
          addToast('Registration Successful!', `Registered for ${e.title}. Your pass is active.`, 'success');
          return { ...e, seatsAvailable: e.seatsAvailable - 1 };
        }
        return e;
      })
    );
  };

  const toggleLikeProject = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  const submitIdea = (newIdea: Omit<IdeaItem, 'id' | 'createdAt' | 'status'>) => {
    const created: IdeaItem = {
      ...newIdea,
      id: `idea-${Date.now()}`,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setIdeas((prev) => [created, ...prev]);
    addToast('Proposal Submitted!', 'Your idea was sent to the IEDC review committee.', 'success');
  };

  const updateIdeaStatus = (ideaId: string, status: IdeaItem['status'], mentorName?: string) => {
    setIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, status, assignedMentor: mentorName } : i))
    );
    addToast('Idea Status Updated', `Proposal ${ideaId} marked as ${status}`, 'success');
  };

  const bookEquipment = (newBooking: Omit<EquipmentBooking, 'id' | 'status'>) => {
    const created: EquipmentBooking = {
      ...newBooking,
      id: `bk-${Date.now()}`,
      status: 'Pending'
    };
    setBookings((prev) => [created, ...prev]);
    addToast('Booking Request Submitted', `Lab reservation for ${newBooking.equipmentName} sent for approval.`, 'success');
  };

  const updateBookingStatus = (bookingId: string, status: EquipmentBooking['status']) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
    addToast('Booking Updated', `Reservation ${bookingId} ${status}.`, 'success');
  };

  const generateCertificate = (
    certData: Omit<CertificateItem, 'id' | 'certificateId' | 'issueDate' | 'qrCodeUrl' | 'status'>
  ): CertificateItem => {
    const certNum = Math.floor(1000 + Math.random() * 9000);
    const certIdStr = `IEDC-2026-PMNA-${certNum}`;
    const newCert: CertificateItem = {
      ...certData,
      id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      certificateId: certIdStr,
      issueDate: new Date().toISOString().split('T')[0],
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${certIdStr}`,
      status: 'Verified'
    };

    setCertificates((prev) => [newCert, ...prev]);
    return newCert;
  };

  const bulkGenerateCertificates = (
    certsData: Omit<CertificateItem, 'id' | 'certificateId' | 'issueDate' | 'qrCodeUrl' | 'status'>[]
  ): CertificateItem[] => {
    const generated = certsData.map((cd) => generateCertificate(cd));
    addToast('Batch Dispatch Complete', `Generated ${generated.length} official certificates.`, 'success');
    return generated;
  };

  const verifyCertificateById = (certId: string): CertificateItem | undefined => {
    const clean = certId.trim().toUpperCase();
    return certificates.find(
      (c) => c.certificateId.toUpperCase() === clean || c.registerNumber.toUpperCase() === clean
    );
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        loginAs,
        logout,
        updatePassword,
        events,
        projects,
        startups,
        ideas,
        certificates,
        bookings,
        blogs,
        forumThreads,
        learningResources,
        templates,
        toasts,
        addToast,
        removeToast,
        registerForEvent,
        toggleLikeProject,
        submitIdea,
        updateIdeaStatus,
        bookEquipment,
        updateBookingStatus,
        generateCertificate,
        bulkGenerateCertificates,
        verifyCertificateById
      }}
    >
      {children}

      {/* Global Toast Container */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-2xl glass-iedc border shadow-2xl backdrop-blur-xl pointer-events-auto flex items-start justify-between gap-3 text-xs font-semibold ${
              t.type === 'success'
                ? 'border-emerald-500/50 text-white bg-emerald-950/80'
                : t.type === 'error'
                ? 'border-rose-500/50 text-white bg-rose-950/80'
                : 'border-[#F98A5B]/50 text-white bg-[#0F0F10]/90'
            }`}
          >
            <div>
              <h4 className="font-extrabold text-sm">{t.title}</h4>
              <p className="text-slate-200 mt-0.5">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
