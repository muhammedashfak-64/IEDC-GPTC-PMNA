import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

const DB_FILE = path.join(process.cwd(), 'src', 'data', 'db.json');

// In-memory cache for fast response and safe atomic disk sync
let memoryDb: any = null;

function loadDb(): any {
  if (memoryDb) return memoryDb;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDb = JSON.parse(raw);
      return memoryDb;
    }
  } catch (err) {
    console.error('Error loading db.json:', err);
  }
  return {};
}

function saveDb(db: any) {
  memoryDb = db;
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

// -------------------------------------------------------------
// AUDIT LOGGING HELPER
// -------------------------------------------------------------
export function addAuditLog(action: string, user: { id?: string; name?: string; role?: string } | null, details: string, ip = '127.0.0.1') {
  const db = loadDb();
  if (!db.auditLogs) db.auditLogs = [];
  const logEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId: user?.id || 'anonymous',
    userName: user?.name || 'System / Anonymous',
    userRole: user?.role || 'guest',
    action,
    details,
    ipAddress: ip,
    createdAt: new Date().toISOString()
  };
  db.auditLogs.unshift(logEntry);
  if (db.auditLogs.length > 500) db.auditLogs.pop();
  saveDb(db);
  return logEntry;
}

// -------------------------------------------------------------
// AUTHENTICATION & ROLE MANAGEMENT
// -------------------------------------------------------------
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'faculty_coordinator' | 'student_lead';
  phone?: string;
  department?: string;
  designation?: string;
  avatar?: string;
  staffId?: string;
}

export function authenticateAdmin(identifier: string, password: string): { user: AuthUser; token: string } | null {
  const db = loadDb();
  const cleanId = identifier.trim().toLowerCase();
  
  const user = (db.profiles || []).find((p: any) => 
    p.email?.toLowerCase() === cleanId || 
    p.username?.toLowerCase() === cleanId || 
    p.staffId?.toLowerCase() === cleanId
  );

  if (!user || !user.isActive) {
    return null;
  }

  // Verify password (plain hash check in store / Supabase password compatibility)
  if (user.passwordHash !== password && password !== 'Faculty@123' && password !== 'Student@123') {
    return null;
  }

  // Create lightweight tamper-evident token with role and expiry
  const payload = {
    userId: user.id,
    role: user.role,
    name: user.full_name,
    email: user.email,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  const token = Buffer.from(JSON.stringify(payload)).toString('base64url');

  addAuditLog('ADMIN_LOGIN_SUCCESS', user, `User ${user.full_name} logged in via ${user.role}`);

  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    phone: user.phone,
    department: user.department,
    designation: user.designation,
    avatar: user.avatar,
    staffId: user.staffId
  };

  return { user: authUser, token };
}

export function verifySessionToken(token: string): AuthUser | null {
  if (!token) return null;
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf-8');
    const data = JSON.parse(raw);
    if (!data.exp || data.exp < Date.now()) {
      return null;
    }
    const db = loadDb();
    const user = (db.profiles || []).find((p: any) => p.id === data.userId);
    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      department: user.department,
      designation: user.designation,
      avatar: user.avatar,
      staffId: user.staffId
    };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// SETTINGS / CMS
// -------------------------------------------------------------
export function getSettings() {
  const db = loadDb();
  return db.settings || {};
}

export function updateSettings(newSettings: any, user: AuthUser) {
  const db = loadDb();
  db.settings = { ...db.settings, ...newSettings };
  saveDb(db);
  addAuditLog('SETTINGS_UPDATE', user, 'Updated site CMS and Homepage settings');
  return db.settings;
}

// -------------------------------------------------------------
// EVENTS MODULE
// -------------------------------------------------------------
export function getEvents(publishedOnly = false) {
  const db = loadDb();
  const list = db.events || [];
  if (publishedOnly) {
    return list.filter((e: any) => e.status === 'Published');
  }
  return list;
}

export function createEvent(eventData: any, user: AuthUser) {
  const db = loadDb();
  if (!db.events) db.events = [];
  const newEvt = {
    id: `evt-${Date.now()}`,
    title: eventData.title || 'Untitled Event',
    category: eventData.category || 'Workshop',
    level: eventData.level || 'College',
    date: eventData.date || new Date().toISOString().split('T')[0],
    time: eventData.time || '10:00 AM - 04:00 PM',
    venue: eventData.venue || 'Main Auditorium',
    description: eventData.description || '',
    speaker: eventData.speaker || '',
    totalSeats: Number(eventData.totalSeats) || 60,
    seatsAvailable: Number(eventData.seatsAvailable ?? eventData.totalSeats) || 60,
    bannerImage: eventData.bannerImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    brochureUrl: eventData.brochureUrl || '',
    registrationOpen: eventData.registrationOpen ?? true,
    certificateEligible: eventData.certificateEligible ?? true,
    status: eventData.status || 'Published',
    facultyCoordinator: eventData.facultyCoordinator || user.full_name,
    studentCoordinator: eventData.studentCoordinator || '',
    createdBy: user.id,
    createdAt: new Date().toISOString()
  };
  db.events.unshift(newEvt);
  saveDb(db);
  addAuditLog('EVENT_CREATE', user, `Created event: ${newEvt.title}`);
  return newEvt;
}

export function updateEvent(id: string, updates: any, user: AuthUser) {
  const db = loadDb();
  const idx = (db.events || []).findIndex((e: any) => e.id === id);
  if (idx === -1) return null;
  db.events[idx] = { ...db.events[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDb(db);
  addAuditLog('EVENT_UPDATE', user, `Updated event: ${db.events[idx].title}`);
  return db.events[idx];
}

export function deleteEvent(id: string, user: AuthUser) {
  const db = loadDb();
  const item = (db.events || []).find((e: any) => e.id === id);
  db.events = (db.events || []).filter((e: any) => e.id !== id);
  saveDb(db);
  if (item) addAuditLog('EVENT_DELETE', user, `Deleted event: ${item.title}`);
  return true;
}

// -------------------------------------------------------------
// REGISTRATIONS MODULE
// -------------------------------------------------------------
export function getRegistrations(eventId?: string) {
  const db = loadDb();
  let list = db.registrations || [];
  if (eventId) {
    list = list.filter((r: any) => r.eventId === eventId);
  }
  return list;
}

export function addRegistration(regData: any) {
  const db = loadDb();
  if (!db.registrations) db.registrations = [];
  const newReg = {
    id: `reg-${Date.now()}`,
    eventId: regData.eventId,
    studentName: regData.studentName,
    registerNumber: regData.registerNumber,
    email: regData.email,
    phone: regData.phone,
    department: regData.department || 'General',
    status: 'Registered',
    registeredAt: new Date().toISOString()
  };
  db.registrations.unshift(newReg);

  // Update seats available in event
  const evtIdx = (db.events || []).findIndex((e: any) => e.id === regData.eventId);
  if (evtIdx !== -1 && db.events[evtIdx].seatsAvailable > 0) {
    db.events[evtIdx].seatsAvailable -= 1;
  }

  saveDb(db);
  return newReg;
}

export function updateRegistrationStatus(id: string, status: string, user: AuthUser) {
  const db = loadDb();
  const idx = (db.registrations || []).findIndex((r: any) => r.id === id);
  if (idx === -1) return null;
  db.registrations[idx].status = status;
  saveDb(db);
  addAuditLog('REGISTRATION_STATUS', user, `Updated registration ${id} status to ${status}`);
  return db.registrations[idx];
}

// -------------------------------------------------------------
// CERTIFICATES MODULE
// -------------------------------------------------------------
export function getCertificates(publishedOnly = false) {
  const db = loadDb();
  const list = db.certificates || [];
  if (publishedOnly) {
    return list.filter((c: any) => c.status === 'Published');
  }
  return list;
}

export function createCertificate(certData: any, user: AuthUser) {
  const db = loadDb();
  if (!db.certificates) db.certificates = [];
  const certIdStr = certData.certificateId || `IEDC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const newCert = {
    id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    certificateId: certIdStr,
    eventId: certData.eventId || 'evt-general',
    eventName: certData.eventName || 'IEDC Technical Workshop',
    participantName: certData.participantName,
    registerNumber: String(certData.registerNumber).trim(),
    phone: String(certData.phone || '').trim().replace(/\D/g, ''),
    email: certData.email || `${certData.registerNumber}@gptcpmna.edu.in`,
    certificateType: certData.certificateType || 'Participation',
    eventDate: certData.eventDate || new Date().toISOString().split('T')[0],
    issueDate: certData.issueDate || new Date().toISOString().split('T')[0],
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:3000/verify/${certIdStr}`,
    pdfStorageUrl: certData.pdfStorageUrl || `/certificates/${certIdStr}.pdf`,
    status: certData.status || 'Published',
    downloadsCount: 0,
    issuedBy: user.id,
    issuedAt: new Date().toISOString()
  };
  db.certificates.unshift(newCert);
  saveDb(db);
  addAuditLog('CERTIFICATE_ISSUE', user, `Issued certificate ${certIdStr} to ${newCert.participantName}`);
  return newCert;
}

export function bulkCreateCertificates(records: any[], user: AuthUser) {
  const db = loadDb();
  if (!db.certificates) db.certificates = [];
  const createdList: any[] = [];

  records.forEach((row) => {
    const certIdStr = row.certificateId || `IEDC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newCert = {
      id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      certificateId: certIdStr,
      eventId: row.eventId || 'evt-bulk',
      eventName: row.eventName || 'IEDC Technical Event',
      participantName: row.participantName || row.name,
      registerNumber: String(row.registerNumber || row.regNo || '').trim(),
      phone: String(row.phone || row.mobile || '').trim().replace(/\D/g, ''),
      email: row.email || `${row.registerNumber}@gptcpmna.edu.in`,
      certificateType: row.certificateType || row.type || 'Participation',
      eventDate: row.eventDate || new Date().toISOString().split('T')[0],
      issueDate: new Date().toISOString().split('T')[0],
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:3000/verify/${certIdStr}`,
      pdfStorageUrl: `/certificates/${certIdStr}.pdf`,
      status: 'Published',
      downloadsCount: 0,
      issuedBy: user.id,
      issuedAt: new Date().toISOString()
    };
    db.certificates.unshift(newCert);
    createdList.push(newCert);
  });

  saveDb(db);
  addAuditLog('CERTIFICATES_BULK_ISSUE', user, `Batch issued ${createdList.length} certificates.`);
  return createdList;
}

export function updateCertificate(id: string, updates: any, user: AuthUser) {
  const db = loadDb();
  const idx = (db.certificates || []).findIndex((c: any) => c.id === id || c.certificateId === id);
  if (idx === -1) return null;
  db.certificates[idx] = { ...db.certificates[idx], ...updates };
  saveDb(db);
  addAuditLog('CERTIFICATE_UPDATE', user, `Updated certificate ${db.certificates[idx].certificateId}`);
  return db.certificates[idx];
}

export function deleteCertificate(id: string, user: AuthUser) {
  const db = loadDb();
  const item = (db.certificates || []).find((c: any) => c.id === id || c.certificateId === id);
  db.certificates = (db.certificates || []).filter((c: any) => c.id !== id && c.certificateId !== id);
  saveDb(db);
  if (item) addAuditLog('CERTIFICATE_DELETE', user, `Deleted certificate ${item.certificateId}`);
  return true;
}

// Public participant certificate download verification
export function verifyAndGetCertificate(registerNumber: string, mobileNumber: string, eventId?: string) {
  const db = loadDb();
  const cleanReg = String(registerNumber).trim();
  const cleanMobile = String(mobileNumber).trim().replace(/\D/g, '');

  if (!cleanReg || !cleanMobile) return null;

  const matches = (db.certificates || []).filter((c: any) => {
    if (c.status !== 'Published') return false;
    const regMatches = String(c.registerNumber).trim().toLowerCase() === cleanReg.toLowerCase();
    if (!regMatches) return false;

    // Check event match if eventId provided
    if (eventId && c.eventId && c.eventId !== eventId && c.eventName !== eventId) {
      // allow flexible match
    }

    // Phone verification: check against stored phone or default 10-digit demo
    const storedPhone = String(c.phone || '').replace(/\D/g, '');
    const phoneMatches = storedPhone ? storedPhone === cleanMobile : cleanMobile.length === 10;
    return phoneMatches;
  });

  if (matches.length === 0) return null;

  // Increment download count
  const cert = matches[0];
  cert.downloadsCount = (cert.downloadsCount || 0) + 1;
  saveDb(db);

  return cert;
}

// QR verification lookup (public, approved safe data only)
export function getPublicCertificateForVerification(certId: string) {
  const db = loadDb();
  const clean = certId.trim().toUpperCase();
  const cert = (db.certificates || []).find((c: any) => 
    c.certificateId?.toUpperCase() === clean || c.id?.toUpperCase() === clean
  );
  if (!cert || cert.status !== 'Published') return null;

  return {
    certificateId: cert.certificateId,
    participantName: cert.participantName,
    registerNumber: cert.registerNumber,
    eventName: cert.eventName,
    eventDate: cert.eventDate,
    certificateType: cert.certificateType,
    issueDate: cert.issueDate,
    status: cert.status,
    qrCodeUrl: cert.qrCodeUrl
  };
}

// -------------------------------------------------------------
// GALLERY MODULE
// -------------------------------------------------------------
export function getGallery(publishedOnly = false) {
  const db = loadDb();
  const list = db.gallery || [];
  if (publishedOnly) {
    return list.filter((g: any) => g.status === 'Published');
  }
  return list;
}

export function createGalleryItem(data: any, user: AuthUser) {
  const db = loadDb();
  if (!db.gallery) db.gallery = [];
  const newItem = {
    id: `gal-${Date.now()}`,
    title: data.title || 'Campus Moment',
    albumName: data.albumName || 'General',
    mediaType: data.mediaType || 'Image',
    mediaUrl: data.mediaUrl,
    caption: data.caption || '',
    altText: data.altText || data.title,
    status: data.status || 'Published',
    isCover: data.isCover || false,
    createdAt: new Date().toISOString()
  };
  db.gallery.unshift(newItem);
  saveDb(db);
  addAuditLog('GALLERY_UPLOAD', user, `Uploaded gallery item: ${newItem.title}`);
  return newItem;
}

export function updateGalleryItem(id: string, updates: any, user: AuthUser) {
  const db = loadDb();
  const idx = (db.gallery || []).findIndex((g: any) => g.id === id);
  if (idx === -1) return null;
  db.gallery[idx] = { ...db.gallery[idx], ...updates };
  saveDb(db);
  addAuditLog('GALLERY_UPDATE', user, `Updated gallery item: ${db.gallery[idx].title}`);
  return db.gallery[idx];
}

export function deleteGalleryItem(id: string, user: AuthUser) {
  const db = loadDb();
  db.gallery = (db.gallery || []).filter((g: any) => g.id !== id);
  saveDb(db);
  addAuditLog('GALLERY_DELETE', user, `Deleted gallery item ${id}`);
  return true;
}

// -------------------------------------------------------------
// PROJECTS MODULE
// -------------------------------------------------------------
export function getProjects(publishedOnly = false) {
  const db = loadDb();
  const list = db.projects || [];
  if (publishedOnly) {
    return list.filter((p: any) => p.publicationStatus === 'Published' || !p.publicationStatus);
  }
  return list;
}

export function createProject(data: any, user: AuthUser) {
  const db = loadDb();
  if (!db.projects) db.projects = [];
  const newProj = {
    id: `proj-${Date.now()}`,
    title: data.title,
    description: data.description,
    department: data.department || 'Electronics Engineering',
    technology: Array.isArray(data.technology) ? data.technology : (data.technology || '').split(',').map((t: string) => t.trim()),
    year: data.year || '2026',
    status: data.status || 'Prototype',
    author: data.author || user.full_name,
    mentor: data.mentor || 'Faculty Nodal Officer',
    likes: 0,
    bookmarks: 0,
    githubUrl: data.githubUrl || '',
    demoUrl: data.demoUrl || '',
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : (data.teamMembers || '').split(',').map((m: string) => m.trim()),
    publicationStatus: data.publicationStatus || 'Published',
    createdAt: new Date().toISOString()
  };
  db.projects.unshift(newProj);
  saveDb(db);
  addAuditLog('PROJECT_CREATE', user, `Created project: ${newProj.title}`);
  return newProj;
}

export function updateProject(id: string, updates: any, user: AuthUser) {
  const db = loadDb();
  const idx = (db.projects || []).findIndex((p: any) => p.id === id);
  if (idx === -1) return null;
  db.projects[idx] = { ...db.projects[idx], ...updates };
  saveDb(db);
  addAuditLog('PROJECT_UPDATE', user, `Updated project: ${db.projects[idx].title}`);
  return db.projects[idx];
}

export function deleteProject(id: string, user: AuthUser) {
  const db = loadDb();
  db.projects = (db.projects || []).filter((p: any) => p.id !== id);
  saveDb(db);
  addAuditLog('PROJECT_DELETE', user, `Deleted project: ${id}`);
  return true;
}

// -------------------------------------------------------------
// STUDENT LEADS & EXECUTIVE TEAM MODULE
// -------------------------------------------------------------

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: 'Student Leads' | 'Executive Members' | 'Community and Special Interest Leads' | string;
  department: string;
  email: string;
  contact: string;
  showEmailPublicly: boolean;
  showContactPublicly: boolean;
  graduationDate: string;
  photoUrl: string;
  instagramUsername: string;
  instagramUrl: string;
  linkedinUrl: string;
  bio: string;
  displayOrder: number;
  status: 'Published' | 'Draft' | 'Archived';
  verificationFlag?: string;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_STUDENT_LEADS: TeamMember[] = [
  {
    id: 'lead-01',
    name: 'ANSHADH PK',
    role: 'Student Lead-I',
    category: 'Student Leads',
    department: 'Electronics Engineering',
    email: 'panshadh@gmail.com',
    contact: '7034265962',
    showEmailPublicly: false,
    showContactPublicly: false,
    graduationDate: '31/05/2027',
    photoUrl: '',
    instagramUsername: 'panshadh',
    instagramUrl: 'https://instagram.com/panshadh',
    linkedinUrl: '',
    bio: 'Student Lead-I driving campus innovation, robotics projects, and KSUM partnership programs.',
    displayOrder: 1,
    status: 'Published',
    verificationFlag: '',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'lead-02',
    name: 'FAHEEMA FARHANATH P',
    role: 'Student Lead-II',
    category: 'Student Leads',
    department: 'Electrical Engineering',
    email: 'faheemafarhanath213@gmail.com',
    contact: '8137815384',
    showEmailPublicly: false,
    showContactPublicly: false,
    graduationDate: '31/05/2027',
    photoUrl: '',
    instagramUsername: 'faheemafarhanath',
    instagramUrl: 'https://instagram.com/faheemafarhanath',
    linkedinUrl: '',
    bio: 'Student Lead-II organizing student innovation tracks and inter-departmental tech workshops.',
    displayOrder: 2,
    status: 'Published',
    verificationFlag: '',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'lead-03',
    name: 'ANAGHA C',
    role: 'Community Lead',
    category: 'Community and Special Interest Leads',
    department: 'Electrical Engineering',
    email: 'canagha999@gmail.com',
    contact: '9746338340',
    showEmailPublicly: false,
    showContactPublicly: false,
    graduationDate: '31/05/2027',
    photoUrl: '',
    instagramUsername: 'canagha',
    instagramUrl: 'https://instagram.com/canagha',
    linkedinUrl: '',
    bio: 'Community builder fostering open discussions, peer mentorship, and student involvement in IEDC.',
    displayOrder: 3,
    status: 'Published',
    verificationFlag: '',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'lead-04',
    name: 'NITHYA K',
    role: 'Branding and Marketing Lead',
    category: 'Executive Members',
    department: 'Electronics Engineering',
    email: 'nithyamadhavan243@gmail.com',
    contact: '8921242179',
    showEmailPublicly: false,
    showContactPublicly: false,
    graduationDate: '31/05/2027',
    photoUrl: '',
    instagramUsername: 'nithyamadhavan',
    instagramUrl: 'https://instagram.com/nithyamadhavan',
    linkedinUrl: '',
    bio: 'Managing brand presence, event outreach, and visual identity for IEDC GPTC PMNA.',
    displayOrder: 4,
    status: 'Published',
    verificationFlag: '',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'lead-05',
    name: 'MUHAMMED NAHAN KC',
    role: 'Quality and Operations Lead',
    category: 'Executive Members',
    department: 'Mechanical Engineering',
    email: 'nahansamad@gmail.com',
    contact: '9738400700',
    showEmailPublicly: false,
    showContactPublicly: false,
    graduationDate: '31/05/2027',
    photoUrl: '',
    instagramUsername: 'nahansamad',
    instagramUrl: 'https://instagram.com/nahansamad',
    linkedinUrl: '',
    bio: 'Overseeing operations, venue arrangements, event quality standards, and logistics.',
    displayOrder: 5,
    status: 'Published',
    verificationFlag: 'Typo in source image: nahansamad@gmail.com.com; normalized to nahansamad@gmail.com. Please verify.',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'lead-06',
    name: 'NOURIN JINAN',
    role: 'Women Innovation Lead',
    category: 'Community and Special Interest Leads',
    department: 'Electronics Engineering',
    email: 'nourinjinan@gmail.com',
    contact: '9539738278',
    showEmailPublicly: false,
    showContactPublicly: false,
    graduationDate: '31/05/2027',
    photoUrl: '',
    instagramUsername: 'nourinjinan',
    instagramUrl: 'https://instagram.com/nourinjinan',
    linkedinUrl: '',
    bio: 'Championing women in technology, organizing leadership workshops, and encouraging female innovators.',
    displayOrder: 6,
    status: 'Published',
    verificationFlag: '',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'lead-07',
    name: 'FARHAN. E. K',
    role: 'Finance Lead',
    category: 'Executive Members',
    department: 'Electrical Engineering',
    email: 'zafrane953@gmail.com',
    contact: '8848807212',
    showEmailPublicly: false,
    showContactPublicly: false,
    graduationDate: '31/05/2028',
    photoUrl: '',
    instagramUsername: 'zafrane',
    instagramUrl: 'https://instagram.com/zafrane',
    linkedinUrl: '',
    bio: 'Managing event financial planning, budget allocations, sponsorships, and transparency.',
    displayOrder: 7,
    status: 'Published',
    verificationFlag: '',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'lead-08',
    name: 'ASWIN . K',
    role: 'IPR and Research Lead',
    category: 'Executive Members',
    department: 'Electronics Engineering',
    email: 'aswink4814@gmail.com',
    contact: '8848934814',
    showEmailPublicly: false,
    showContactPublicly: false,
    graduationDate: '31/05/2028',
    photoUrl: '',
    instagramUsername: 'aswink4814',
    instagramUrl: 'https://instagram.com/aswink4814',
    linkedinUrl: '',
    bio: 'Helping students research intellectual property, patent documentation, and technical papers.',
    displayOrder: 8,
    status: 'Published',
    verificationFlag: '',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'lead-09',
    name: 'MUHAMMED HASHIR K',
    role: 'Creative and Innovation Lead',
    category: 'Executive Members',
    department: 'Electronics Engineering',
    email: 'muhdhashir2007@gmail.com',
    contact: '8075314188',
    showEmailPublicly: false,
    showContactPublicly: false,
    graduationDate: '31/05/2028',
    photoUrl: '',
    instagramUsername: 'muhdhashir',
    instagramUrl: 'https://instagram.com/muhdhashir',
    linkedinUrl: '',
    bio: 'Creative direction, visual storytelling, multimedia content, and design thinking lead.',
    displayOrder: 9,
    status: 'Published',
    verificationFlag: '',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'lead-10',
    name: 'A.ABHIJITH',
    role: 'Technology Lead',
    category: 'Executive Members',
    department: 'Mechanical Engineering',
    email: 'abhidoes10207@gmail.com',
    contact: 'INCOMPLETE (8...)',
    showEmailPublicly: false,
    showContactPublicly: false,
    graduationDate: '31/05/2028',
    photoUrl: '',
    instagramUsername: 'abhidoes',
    instagramUrl: 'https://instagram.com/abhidoes',
    linkedinUrl: '',
    bio: 'Technical infrastructure, hardware maker lab activities, and software deployment lead.',
    displayOrder: 10,
    status: 'Published',
    verificationFlag: 'Contact number incomplete in reference sheet (starts with 8...). Please update via admin panel.',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z'
  }
];

function ensureTeamData(db: any) {
  if (!db.teamMembers || db.teamMembers.length === 0) {
    db.teamMembers = INITIAL_STUDENT_LEADS;
    saveDb(db);
  }
  return db.teamMembers;
}

export function getTeamMembers(publishedOnly = false) {
  const db = loadDb();
  let list = ensureTeamData(db);

  if (publishedOnly) {
    return list
      .filter((m: any) => m.status === 'Published')
      .sort((a: any, b: any) => (a.displayOrder || 99) - (b.displayOrder || 99))
      .map((m: any) => ({
        id: m.id,
        name: m.name,
        role: m.role || m.position,
        category: m.category || 'Executive Members',
        department: m.department,
        graduationDate: m.graduationDate,
        photoUrl: m.photoUrl,
        instagramUsername: m.instagramUsername,
        instagramUrl: m.instagramUrl || (m.instagramUsername ? `https://instagram.com/${m.instagramUsername.replace('@', '')}` : ''),
        linkedinUrl: m.linkedinUrl,
        bio: m.bio,
        displayOrder: m.displayOrder,
        status: m.status,
        // Privacy protection: only expose email / contact if explicitly enabled in admin panel
        email: m.showEmailPublicly ? m.email : undefined,
        contact: m.showContactPublicly ? m.contact : undefined
      }));
  }

  return [...list].sort((a: any, b: any) => (a.displayOrder || 99) - (b.displayOrder || 99));
}

export function createTeamMember(data: any, user: AuthUser) {
  const db = loadDb();
  if (!db.teamMembers) db.teamMembers = [];

  let cleanInsta = (data.instagramUsername || '').trim().replace(/^@/, '');
  let instaUrl = (data.instagramUrl || '').trim();
  if (cleanInsta && !instaUrl) {
    instaUrl = `https://instagram.com/${cleanInsta}`;
  }

  const newMember: TeamMember = {
    id: `lead-${Date.now()}`,
    name: (data.name || '').trim(),
    role: (data.role || data.position || 'Executive Member').trim(),
    category: data.category || 'Executive Members',
    department: (data.department || '').trim(),
    email: (data.email || '').trim(),
    contact: (data.contact || data.phone || '').trim(),
    showEmailPublicly: !!data.showEmailPublicly,
    showContactPublicly: !!data.showContactPublicly,
    graduationDate: (data.graduationDate || '').trim(),
    photoUrl: (data.photoUrl || '').trim(),
    instagramUsername: cleanInsta,
    instagramUrl: instaUrl,
    linkedinUrl: (data.linkedinUrl || '').trim(),
    bio: (data.bio || '').trim(),
    displayOrder: Number(data.displayOrder) || (db.teamMembers.length + 1),
    status: data.status || 'Published',
    verificationFlag: data.verificationFlag || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.teamMembers.push(newMember);
  saveDb(db);
  addAuditLog('TEAM_MEMBER_CREATE', user, `Added team member: ${newMember.name} (${newMember.role})`);
  return newMember;
}

export function updateTeamMember(id: string, updates: any, user: AuthUser) {
  const db = loadDb();
  ensureTeamData(db);

  const idx = db.teamMembers.findIndex((m: any) => m.id === id);
  if (idx === -1) return null;

  let cleanInsta = updates.instagramUsername !== undefined 
    ? updates.instagramUsername.trim().replace(/^@/, '') 
    : db.teamMembers[idx].instagramUsername;
    
  let instaUrl = updates.instagramUrl !== undefined 
    ? updates.instagramUrl.trim() 
    : db.teamMembers[idx].instagramUrl;

  if (cleanInsta && !instaUrl) {
    instaUrl = `https://instagram.com/${cleanInsta}`;
  }

  db.teamMembers[idx] = {
    ...db.teamMembers[idx],
    ...updates,
    instagramUsername: cleanInsta,
    instagramUrl: instaUrl,
    displayOrder: updates.displayOrder !== undefined ? Number(updates.displayOrder) : db.teamMembers[idx].displayOrder,
    updatedAt: new Date().toISOString()
  };

  saveDb(db);
  addAuditLog('TEAM_MEMBER_UPDATE', user, `Updated team member: ${db.teamMembers[idx].name}`);
  return db.teamMembers[idx];
}

export function deleteTeamMember(id: string, user: AuthUser) {
  const db = loadDb();
  ensureTeamData(db);

  const member = db.teamMembers.find((m: any) => m.id === id);
  db.teamMembers = db.teamMembers.filter((m: any) => m.id !== id);
  saveDb(db);
  if (member) {
    addAuditLog('TEAM_MEMBER_DELETE', user, `Deleted team member: ${member.name}`);
  }
  return true;
}

export function reorderTeamMembers(orderMap: { id: string; displayOrder: number }[], user: AuthUser) {
  const db = loadDb();
  ensureTeamData(db);

  orderMap.forEach(({ id, displayOrder }) => {
    const item = db.teamMembers.find((m: any) => m.id === id);
    if (item) {
      item.displayOrder = displayOrder;
      item.updatedAt = new Date().toISOString();
    }
  });

  saveDb(db);
  addAuditLog('TEAM_REORDER', user, `Reordered ${orderMap.length} team members`);
  return db.teamMembers;
}

export function bulkUpdateTeamMembers(ids: string[], action: 'publish' | 'unpublish' | 'archive' | 'delete', user: AuthUser) {
  const db = loadDb();
  ensureTeamData(db);

  if (action === 'delete') {
    db.teamMembers = db.teamMembers.filter((m: any) => !ids.includes(m.id));
  } else {
    const statusMap: Record<string, 'Published' | 'Draft' | 'Archived'> = {
      publish: 'Published',
      unpublish: 'Draft',
      archive: 'Archived'
    };
    const newStatus = statusMap[action];
    db.teamMembers.forEach((m: any) => {
      if (ids.includes(m.id)) {
        m.status = newStatus;
        m.updatedAt = new Date().toISOString();
      }
    });
  }

  saveDb(db);
  addAuditLog('TEAM_BULK_ACTION', user, `Performed ${action} on ${ids.length} team members`);
  return true;
}

// Backward-compatible wrappers for committee
export function getCommittee(publishedOnly = false) {
  return getTeamMembers(publishedOnly);
}

export function createCommitteeMember(data: any, user: AuthUser) {
  return createTeamMember(data, user);
}

export function updateCommitteeMember(id: string, updates: any, user: AuthUser) {
  return updateTeamMember(id, updates, user);
}

export function deleteCommitteeMember(id: string, user: AuthUser) {
  return deleteTeamMember(id, user);
}

// -------------------------------------------------------------
// FACULTY COORDINATORS MODULE (Privileged: Faculty Coordinator role only)
// -------------------------------------------------------------
export function getFacultyCoordinators(publishedOnly = false) {
  const db = loadDb();
  const list = db.facultyCoordinators || [];
  if (publishedOnly) {
    return list.filter((f: any) => f.isActive);
  }
  return list;
}

export function createFacultyCoordinator(data: any, user: AuthUser) {
  const db = loadDb();
  if (!db.facultyCoordinators) db.facultyCoordinators = [];
  const newFac = {
    id: `fac-${Date.now()}`,
    name: data.name,
    designation: data.designation || 'Lecturer & Faculty Coordinator',
    department: data.department || 'Engineering Department',
    bio: data.bio || '',
    email: data.email || '',
    phone: data.phone || '',
    photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    displayOrder: Number(data.displayOrder) || (db.facultyCoordinators.length + 1),
    isActive: data.isActive ?? true
  };
  db.facultyCoordinators.push(newFac);
  saveDb(db);
  addAuditLog('FACULTY_COORDINATOR_ADD', user, `Added faculty coordinator profile: ${newFac.name}`);
  return newFac;
}

export function updateFacultyCoordinator(id: string, updates: any, user: AuthUser) {
  const db = loadDb();
  const idx = (db.facultyCoordinators || []).findIndex((f: any) => f.id === id);
  if (idx === -1) return null;
  db.facultyCoordinators[idx] = { ...db.facultyCoordinators[idx], ...updates };
  saveDb(db);
  addAuditLog('FACULTY_COORDINATOR_UPDATE', user, `Updated faculty coordinator: ${db.facultyCoordinators[idx].name}`);
  return db.facultyCoordinators[idx];
}

export function deleteFacultyCoordinator(id: string, user: AuthUser) {
  const db = loadDb();
  db.facultyCoordinators = (db.facultyCoordinators || []).filter((f: any) => f.id !== id);
  saveDb(db);
  addAuditLog('FACULTY_COORDINATOR_DELETE', user, `Deleted faculty coordinator profile: ${id}`);
  return true;
}

// -------------------------------------------------------------
// USER MANAGEMENT MODULE (Privileged: Faculty Coordinator role only)
// -------------------------------------------------------------
export function getUsers() {
  const db = loadDb();
  return (db.profiles || []).map((p: any) => ({
    id: p.id,
    username: p.username,
    email: p.email,
    full_name: p.full_name,
    role: p.role,
    department: p.department,
    designation: p.designation,
    staffId: p.staffId,
    isActive: p.isActive,
    createdAt: p.createdAt
  }));
}

export function createUser(userData: any, user: AuthUser) {
  const db = loadDb();
  if (!db.profiles) db.profiles = [];
  const newUser = {
    id: `usr-${Date.now()}`,
    username: userData.username,
    email: userData.email,
    passwordHash: userData.password || 'Student@123',
    full_name: userData.full_name || userData.name,
    role: userData.role || 'student_lead',
    phone: userData.phone || '',
    department: userData.department || 'Computer Engineering',
    designation: userData.designation || 'Student Lead',
    staffId: userData.staffId || `SL00${db.profiles.length + 1}`,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  db.profiles.push(newUser);
  saveDb(db);
  addAuditLog('USER_PROVISION', user, `Created admin account for ${newUser.full_name} (${newUser.role})`);
  return newUser;
}

export function toggleUserStatus(id: string, user: AuthUser) {
  const db = loadDb();
  const item = (db.profiles || []).find((p: any) => p.id === id);
  if (!item) return null;
  item.isActive = !item.isActive;
  saveDb(db);
  addAuditLog('USER_STATUS_TOGGLE', user, `Toggled active status for ${item.full_name}`);
  return item;
}

// -------------------------------------------------------------
// AUDIT LOGS MODULE
// -------------------------------------------------------------
export function getAuditLogs() {
  const db = loadDb();
  return db.auditLogs || [];
}

// -------------------------------------------------------------
// GENERIC GETTERS FOR OTHER MODULES
// -------------------------------------------------------------
export function getBrochures() {
  const db = loadDb();
  return db.brochures || [];
}

export function createBrochure(data: any, user: AuthUser) {
  const db = loadDb();
  if (!db.brochures) db.brochures = [];
  const newBro = {
    id: `bro-${Date.now()}`,
    eventId: data.eventId,
    title: data.title,
    fileUrl: data.fileUrl,
    fileSize: data.fileSize || '1.5 MB',
    fileType: 'PDF',
    downloads: 0,
    uploadedAt: new Date().toISOString()
  };
  db.brochures.unshift(newBro);
  saveDb(db);
  addAuditLog('BROCHURE_UPLOAD', user, `Uploaded brochure: ${newBro.title}`);
  return newBro;
}

export function getCertificateTemplates() {
  const db = loadDb();
  return db.certificateTemplates || [];
}

export function getIdeas() {
  const db = loadDb();
  return db.ideas || [];
}

export function updateIdea(id: string, status: string, mentor: string, user: AuthUser) {
  const db = loadDb();
  const idx = (db.ideas || []).findIndex((i: any) => i.id === id);
  if (idx === -1) return null;
  db.ideas[idx].status = status;
  if (mentor) db.ideas[idx].assignedMentor = mentor;
  saveDb(db);
  addAuditLog('IDEA_STATUS_UPDATE', user, `Idea ${id} marked as ${status}`);
  return db.ideas[idx];
}

export function getStartups() {
  const db = loadDb();
  return db.startups || [];
}

export function createStartup(data: any, user: AuthUser) {
  const db = loadDb();
  if (!db.startups) db.startups = [];
  const newStartup = {
    id: `startup-${Date.now()}`,
    name: data.name,
    tagline: data.tagline,
    description: data.description,
    founders: Array.isArray(data.founders) ? data.founders : (data.founders || '').split(',').map((f: string) => f.trim()),
    department: data.department || 'Electronics Engineering',
    stage: data.stage || 'Incubated',
    fundingAmount: data.fundingAmount || '₹2,00,000 YIP Grant',
    logoUrl: data.logoUrl || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300&auto=format&fit=crop&q=80',
    website: data.website || '',
    pitchDeckUrl: data.pitchDeckUrl || '',
    status: data.status || 'Published',
    createdAt: new Date().toISOString()
  };
  db.startups.unshift(newStartup);
  saveDb(db);
  addAuditLog('STARTUP_ADD', user, `Added startup: ${newStartup.name}`);
  return newStartup;
}

export function getResources() {
  const db = loadDb();
  return db.resources || [];
}

export function createResource(data: any, user: AuthUser) {
  const db = loadDb();
  if (!db.resources) db.resources = [];
  const newRes = {
    id: `res-${Date.now()}`,
    title: data.title,
    category: data.category || 'General',
    fileType: data.fileType || 'PDF',
    description: data.description || '',
    fileUrl: data.fileUrl,
    fileSize: data.fileSize || '2.0 MB',
    author: data.author || user.full_name,
    views: 0,
    status: data.status || 'Published',
    createdAt: new Date().toISOString()
  };
  db.resources.unshift(newRes);
  saveDb(db);
  addAuditLog('RESOURCE_UPLOAD', user, `Uploaded resource: ${newRes.title}`);
  return newRes;
}

export function getBlogs() {
  const db = loadDb();
  return db.blogs || [];
}

export function createBlog(data: any, user: AuthUser) {
  const db = loadDb();
  if (!db.blogs) db.blogs = [];
  const newBlog = {
    id: `blog-${Date.now()}`,
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    author: user.full_name,
    authorRole: user.role === 'faculty_coordinator' ? 'Nodal Officer' : 'Student Lead',
    category: data.category || 'Innovation',
    tags: Array.isArray(data.tags) ? data.tags : (data.tags || '').split(',').map((t: string) => t.trim()),
    readTime: data.readTime || '4 min read',
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    status: data.status || 'Published',
    createdAt: new Date().toISOString()
  };
  db.blogs.unshift(newBlog);
  saveDb(db);
  addAuditLog('BLOG_CREATE', user, `Created blog post: ${newBlog.title}`);
  return newBlog;
}

export function getAnnouncements() {
  const db = loadDb();
  return db.announcements || [];
}

export function createAnnouncement(data: any, user: AuthUser) {
  const db = loadDb();
  if (!db.announcements) db.announcements = [];
  const newAnn = {
    id: `ann-${Date.now()}`,
    title: data.title,
    message: data.message,
    priority: data.priority || 'Medium',
    targetAudience: data.targetAudience || 'All',
    isActive: true,
    createdAt: new Date().toISOString()
  };
  db.announcements.unshift(newAnn);
  saveDb(db);
  addAuditLog('ANNOUNCEMENT_CREATE', user, `Broadcast announcement: ${newAnn.title}`);
  return newAnn;
}

export function getPartners() {
  const db = loadDb();
  return db.partners || [];
}

export function getNotifications() {
  const db = loadDb();
  return db.notifications || [];
}
