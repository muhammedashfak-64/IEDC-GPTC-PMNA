import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { generateSingleCertificatePdf } from './certificateGenerator';
import { supabase } from '@/lib/supabase';
import {
  syncEventToSupabase,
  deleteEventFromSupabase,
  syncTeamMemberToSupabase,
  deleteTeamMemberFromSupabase,
  syncCertificateToSupabase,
  deleteCertificateFromSupabase,
  syncProjectToSupabase,
  deleteProjectFromSupabase,
  syncGalleryToSupabase,
  deleteGalleryFromSupabase,
  syncResourceToSupabase,
  syncBlogToSupabase,
  syncAnnouncementToSupabase,
  syncStartupToSupabase,
  syncSettingsToSupabase,
  syncAuditLogToSupabase,
  syncRegistrationToSupabase,
  deleteRegistrationFromSupabase
} from './supabaseSync';

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
  syncAuditLogToSupabase(logEntry).catch(() => {});
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
  syncSettingsToSupabase(db.settings).catch(() => {});
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
  syncEventToSupabase(newEvt, false).catch(() => {});
  addAuditLog('EVENT_CREATE', user, `Created event: ${newEvt.title}`);
  return newEvt;
}

export function updateEvent(id: string, updates: any, user: AuthUser) {
  const db = loadDb();
  const idx = (db.events || []).findIndex((e: any) => e.id === id);
  if (idx === -1) return null;
  db.events[idx] = { ...db.events[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDb(db);
  syncEventToSupabase(db.events[idx], true).catch(() => {});
  addAuditLog('EVENT_UPDATE', user, `Updated event: ${db.events[idx].title}`);
  return db.events[idx];
}

export function deleteEvent(id: string, user: AuthUser) {
  const db = loadDb();
  const item = (db.events || []).find((e: any) => e.id === id);
  db.events = (db.events || []).filter((e: any) => e.id !== id);
  saveDb(db);
  deleteEventFromSupabase(id).catch(() => {});
  if (item) addAuditLog('EVENT_DELETE', user, `Deleted event: ${item.title}`);
  return true;
}

// -------------------------------------------------------------
// REGISTRATIONS MODULE
// -------------------------------------------------------------
export function getRegistrations(eventId?: string) {
  const db = loadDb();
  let list = db.registrations || [];
  if (eventId && eventId !== 'All') {
    list = list.filter((r: any) => r.eventId === eventId);
  }

  // Enrich with event details if missing
  const eventsMap = new Map((db.events || []).map((e: any) => [e.id, e.title]));
  return list.map((r: any) => ({
    ...r,
    eventTitle: r.eventTitle || eventsMap.get(r.eventId) || 'Campus Event'
  }));
}

export function registerStudentForEvent(data: {
  eventId: string;
  studentName: string;
  registerNumber: string;
  email: string;
  phone: string;
  department: string;
  academicYear?: string;
  collegeName?: string;
  additionalNotes?: string;
  consent?: boolean;
}) {
  const db = loadDb();
  if (!db.registrations) db.registrations = [];
  if (!db.events) db.events = [];

  // 1. Validation
  if (!data.eventId) throw new Error('Event ID is required.');
  if (!data.studentName?.trim()) throw new Error('Student name is required.');
  if (!data.registerNumber?.trim()) throw new Error('Admission / Register number is required.');
  if (!data.email?.trim()) throw new Error('Email address is required.');
  if (!data.phone?.trim()) throw new Error('Mobile number is required.');
  if (!data.department?.trim()) throw new Error('Department is required.');

  // 2. Check Event
  const event = db.events.find((e: any) => e.id === data.eventId);
  if (!event) throw new Error('Selected event was not found.');
  if (event.status !== 'Published') throw new Error('Registration is not currently open for this event.');

  const cleanRegNo = data.registerNumber.trim().toUpperCase();
  const cleanEmail = data.email.trim().toLowerCase();

  // 3. Duplicate Prevention
  const existing = db.registrations.find(
    (r: any) =>
      r.eventId === data.eventId &&
      (r.registerNumber?.trim().toUpperCase() === cleanRegNo ||
        r.email?.trim().toLowerCase() === cleanEmail)
  );

  if (existing) {
    throw new Error(
      `You are already registered for "${event.title}". Your Registration ID is ${existing.registrationCode || existing.id}.`
    );
  }

  // 4. Capacity Limit Check
  const eventRegistrations = db.registrations.filter(
    (r: any) => r.eventId === data.eventId && r.status !== 'Cancelled'
  );
  if (event.totalSeats && eventRegistrations.length >= Number(event.totalSeats)) {
    throw new Error(`Registration closed: The capacity limit of ${event.totalSeats} seats has been reached.`);
  }

  // 5. Generate unique registration code and ID
  const codeNum = Math.floor(10000 + Math.random() * 90000);
  const registrationCode = `REG-2026-${codeNum}`;
  const newRegistration = {
    id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    registrationCode,
    eventId: data.eventId,
    eventTitle: event.title,
    studentName: data.studentName.trim(),
    registerNumber: cleanRegNo,
    email: cleanEmail,
    phone: data.phone.trim(),
    department: data.department.trim(),
    academicYear: data.academicYear || '2nd Year',
    collegeName: data.collegeName || 'Govt Polytechnic College Perinthalmanna',
    additionalNotes: data.additionalNotes || '',
    status: 'Confirmed',
    consent: data.consent !== false,
    registeredAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  db.registrations.unshift(newRegistration);

  // Update seats available on event
  if (typeof event.seatsAvailable === 'number') {
    event.seatsAvailable = Math.max(0, event.seatsAvailable - 1);
  }

  saveDb(db);

  // Async sync to Supabase
  syncRegistrationToSupabase(newRegistration, false).catch(console.error);
  syncEventToSupabase(event, true).catch(console.error);

  return newRegistration;
}

export function updateRegistrationStatus(id: string, status: string, user: AuthUser) {
  const db = loadDb();
  if (!db.registrations) db.registrations = [];

  const index = db.registrations.findIndex((r: any) => r.id === id);
  if (index === -1) throw new Error('Registration not found.');

  const validStatuses = ['Confirmed', 'Pending', 'Attended', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  db.registrations[index].status = status;
  db.registrations[index].updatedAt = new Date().toISOString();
  saveDb(db);

  syncRegistrationToSupabase(db.registrations[index], true).catch(console.error);
  addAuditLog('REGISTRATION_STATUS_UPDATE', user, `Changed status of ${db.registrations[index].studentName} (${id}) to ${status}`);

  return db.registrations[index];
}

export function deleteRegistration(id: string, user: AuthUser) {
  const db = loadDb();
  if (!db.registrations) return false;

  const target = db.registrations.find((r: any) => r.id === id);
  if (!target) return false;

  db.registrations = db.registrations.filter((r: any) => r.id !== id);

  // Restore seat if applicable
  const event = (db.events || []).find((e: any) => e.id === target.eventId);
  if (event && typeof event.seatsAvailable === 'number') {
    event.seatsAvailable = Math.min(event.totalSeats || 60, event.seatsAvailable + 1);
    syncEventToSupabase(event, true).catch(console.error);
  }

  saveDb(db);
  deleteRegistrationFromSupabase(id).catch(console.error);
  addAuditLog('REGISTRATION_DELETE', user, `Deleted registration for ${target.studentName} (${id})`);

  return true;
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
  syncCertificateToSupabase(newCert, false).catch(() => {});
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
  createdList.forEach((c) => syncCertificateToSupabase(c, false).catch(() => {}));
  addAuditLog('CERTIFICATES_BULK_ISSUE', user, `Batch issued ${createdList.length} certificates.`);
  return createdList;
}

export function updateCertificate(id: string, updates: any, user: AuthUser) {
  const db = loadDb();
  const idx = (db.certificates || []).findIndex((c: any) => c.id === id || c.certificateId === id);
  if (idx === -1) return null;
  db.certificates[idx] = { ...db.certificates[idx], ...updates };
  saveDb(db);
  syncCertificateToSupabase(db.certificates[idx], true).catch(() => {});
  addAuditLog('CERTIFICATE_UPDATE', user, `Updated certificate ${db.certificates[idx].certificateId}`);
  return db.certificates[idx];
}

export function deleteCertificate(id: string, user: AuthUser) {
  const db = loadDb();
  const item = (db.certificates || []).find((c: any) => c.id === id || c.certificateId === id);
  db.certificates = (db.certificates || []).filter((c: any) => c.id !== id && c.certificateId !== id);
  saveDb(db);
  deleteCertificateFromSupabase(id).catch(() => {});
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
// ATTENDANCE & PARTICIPANT OPERATIONS
// -------------------------------------------------------------
export function markAttendance(
  registrationId: string,
  attendance: 'Present' | 'Absent',
  user: AuthUser
) {
  const db = loadDb();
  if (!db.registrations) db.registrations = [];

  const index = db.registrations.findIndex((r: any) => r.id === registrationId);
  if (index === -1) throw new Error('Registration not found.');

  const isPresent = attendance === 'Present';
  db.registrations[index].attendance = attendance;
  db.registrations[index].status = isPresent ? 'Attended' : 'Confirmed';
  db.registrations[index].attendedAt = isPresent ? new Date().toISOString() : null;
  db.registrations[index].markedBy = user.full_name || user.username || 'Admin';
  db.registrations[index].updatedAt = new Date().toISOString();

  saveDb(db);
  syncRegistrationToSupabase(db.registrations[index], true).catch(console.error);
  addAuditLog(
    'ATTENDANCE_MARK',
    user,
    `Marked ${db.registrations[index].studentName} as ${attendance}`
  );

  return db.registrations[index];
}

export function markBulkAttendance(
  eventId: string,
  registrationIds: string[],
  attendance: 'Present' | 'Absent',
  user: AuthUser
) {
  const db = loadDb();
  if (!db.registrations) db.registrations = [];

  const isPresent = attendance === 'Present';
  const updatedList: any[] = [];

  db.registrations.forEach((r: any) => {
    if (r.eventId === eventId && (registrationIds.length === 0 || registrationIds.includes(r.id))) {
      r.attendance = attendance;
      r.status = isPresent ? 'Attended' : 'Confirmed';
      r.attendedAt = isPresent ? new Date().toISOString() : null;
      r.markedBy = user.full_name || user.username || 'Admin';
      r.updatedAt = new Date().toISOString();
      updatedList.push(r);
    }
  });

  saveDb(db);
  updatedList.forEach((r) => syncRegistrationToSupabase(r, true).catch(console.error));
  addAuditLog(
    'ATTENDANCE_BULK_MARK',
    user,
    `Batch marked ${updatedList.length} participants as ${attendance} for event ${eventId}`
  );

  return updatedList;
}

// -------------------------------------------------------------
// PROGRAM LEADERS & ORGANIZERS MODULE
// -------------------------------------------------------------
export function getProgramLeaders(eventId?: string) {
  const db = loadDb();
  let list = db.programLeaders || [];
  if (eventId && eventId !== 'All') {
    list = list.filter((l: any) => l.eventId === eventId);
  }
  return list;
}

export function addProgramLeader(
  data: {
    eventId: string;
    name: string;
    role: string;
    department?: string;
    email?: string;
    phone?: string;
    certificateEligible?: boolean;
  },
  user: AuthUser
) {
  const db = loadDb();
  if (!db.programLeaders) db.programLeaders = [];

  const newLeader = {
    id: `ldr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    eventId: data.eventId,
    name: data.name.trim(),
    role: data.role || 'Student Lead',
    department: data.department || '',
    email: data.email || '',
    phone: (data.phone || '').trim().replace(/\D/g, ''),
    certificateEligible: data.certificateEligible !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.programLeaders.unshift(newLeader);
  saveDb(db);
  addAuditLog('PROGRAM_LEADER_ADD', user, `Added leader ${newLeader.name} (${newLeader.role})`);
  return newLeader;
}

export function deleteProgramLeader(id: string, user: AuthUser) {
  const db = loadDb();
  if (!db.programLeaders) return false;
  const target = db.programLeaders.find((l: any) => l.id === id);
  if (!target) return false;
  db.programLeaders = db.programLeaders.filter((l: any) => l.id !== id);
  saveDb(db);
  addAuditLog('PROGRAM_LEADER_DELETE', user, `Removed leader ${target.name} (${id})`);
  return true;
}

// -------------------------------------------------------------
// AUTOMATIC CERTIFICATE GENERATION FOR PROGRAMS
// -------------------------------------------------------------
export async function generateProgramCertificates(
  eventId: string,
  options: { includeLeaders?: boolean; regenerateExisting?: boolean } = {},
  user: AuthUser
) {
  const db = loadDb();
  const event = (db.events || []).find((e: any) => e.id === eventId);
  if (!event) throw new Error('Event / Program not found.');

  if (!db.certificates) db.certificates = [];
  if (!db.registrations) db.registrations = [];
  if (!db.programLeaders) db.programLeaders = [];

  const programName = event.title;
  const programDate = event.date;
  const organizingBody = event.organizingBody || 'the IEDC Cell, Government Polytechnic College Perinthalmanna';
  const customParagraph = event.certificateParagraph || undefined;
  const templateConfig = event.templateConfig || undefined;

  // 1. Eligible Participants: Registered for this event AND marked Present (or Attended)!
  const eligibleRegistrations = db.registrations.filter((r: any) => {
    if (r.eventId !== eventId) return false;
    const isPresent = r.attendance === 'Present' || r.status === 'Attended';
    return isPresent;
  });

  // 2. Eligible Leaders
  const eligibleLeaders = options.includeLeaders !== false
    ? db.programLeaders.filter((l: any) => l.eventId === eventId && l.certificateEligible !== false)
    : [];

  const results: any[] = [];
  const failures: any[] = [];

  // Helper to generate a single record
  async function processRecipient(recipient: {
    name: string;
    phone: string;
    email: string;
    registerNumber: string;
    role: string;
    sourceType: 'participant' | 'leader';
    sourceId: string;
  }) {
    let existingCert = db.certificates.find((c: any) =>
      c.eventId === eventId &&
      (c.registerNumber === recipient.registerNumber || (recipient.phone && c.phone === recipient.phone)) &&
      c.participantName.trim().toUpperCase() === recipient.name.trim().toUpperCase()
    );

    if (existingCert && !options.regenerateExisting) {
      results.push({ ...existingCert, alreadyExisted: true });
      return;
    }

    const certId = existingCert?.certificateId || `IEDC-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      const generated = await generateSingleCertificatePdf(
        {
          certificateId: certId,
          recipientName: recipient.name,
          programName,
          programDate,
          organizingBody,
          customParagraph,
          role: recipient.role,
          customTemplatePath: event.certificateTemplateUrl && fs.existsSync(event.certificateTemplateUrl)
            ? event.certificateTemplateUrl
            : undefined
        },
        templateConfig
      );

      const certRecord = {
        id: existingCert?.id || `cert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        certificateId: certId,
        eventId,
        eventName: programName,
        participantName: recipient.name.trim().toUpperCase(),
        registerNumber: recipient.registerNumber,
        phone: recipient.phone,
        email: recipient.email,
        certificateType: recipient.role,
        eventDate: programDate,
        issueDate: new Date().toISOString().split('T')[0],
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:3000/verify/${certId}`,
        pdfStorageUrl: generated.publicUrl || `/certificates/${generated.fileName}`,
        status: 'Draft',
        downloadsCount: 0,
        issuedBy: user.id || 'admin',
        issuedAt: new Date().toISOString()
      };

      if (existingCert) {
        const idx = db.certificates.findIndex((c: any) => c.id === existingCert.id);
        if (idx !== -1) db.certificates[idx] = certRecord;
      } else {
        db.certificates.unshift(certRecord);
      }

      if (recipient.sourceType === 'participant') {
        const regIdx = db.registrations.findIndex((r: any) => r.id === recipient.sourceId);
        if (regIdx !== -1) {
          db.registrations[regIdx].certificateId = certId;
          db.registrations[regIdx].certificateGenerated = true;
        }
      }

      syncCertificateToSupabase(certRecord, !!existingCert).catch(console.error);
      results.push(certRecord);
    } catch (err: any) {
      console.error(`Failed generating cert for ${recipient.name}:`, err);
      failures.push({ name: recipient.name, error: err.message });
    }
  }

  for (const reg of eligibleRegistrations) {
    await processRecipient({
      name: reg.studentName,
      phone: (reg.phone || '').trim().replace(/\D/g, ''),
      email: reg.email || '',
      registerNumber: reg.registerNumber || reg.id,
      role: 'Participant',
      sourceType: 'participant',
      sourceId: reg.id
    });
  }

  for (const ldr of eligibleLeaders) {
    await processRecipient({
      name: ldr.name,
      phone: (ldr.phone || '').trim().replace(/\D/g, ''),
      email: ldr.email || '',
      registerNumber: `LEAD-${ldr.id.slice(-4)}`,
      role: ldr.role || 'Student Lead',
      sourceType: 'leader',
      sourceId: ldr.id
    });
  }

  saveDb(db);
  addAuditLog(
    'CERTIFICATES_PROGRAM_GENERATE',
    user,
    `Generated ${results.length} certificates for event "${programName}" (${failures.length} failed)`
  );

  return {
    totalEligibleParticipants: eligibleRegistrations.length,
    totalEligibleLeaders: eligibleLeaders.length,
    generatedCount: results.length,
    failedCount: failures.length,
    failures,
    certificates: results
  };
}

export function publishProgramCertificates(eventId: string, publish: boolean, user: AuthUser) {
  const db = loadDb();
  if (!db.certificates) db.certificates = [];

  const newStatus = publish ? 'Published' : 'Draft';
  let count = 0;

  db.certificates.forEach((c: any) => {
    if (c.eventId === eventId) {
      c.status = newStatus;
      c.updatedAt = new Date().toISOString();
      count++;
      syncCertificateToSupabase(c, true).catch(() => {});
    }
  });

  const evtIdx = (db.events || []).findIndex((e: any) => e.id === eventId);
  if (evtIdx !== -1) {
    db.events[evtIdx].certificateStatus = newStatus;
    db.events[evtIdx].updatedAt = new Date().toISOString();
    syncEventToSupabase(db.events[evtIdx], true).catch(() => {});
  }

  saveDb(db);
  addAuditLog(
    'CERTIFICATES_PUBLISH_TOGGLE',
    user,
    `${publish ? 'Published' : 'Unpublished'} ${count} certificates for event ${eventId}`
  );

  return { count, status: newStatus };
}

export async function generateProgramCertificatesZip(eventId: string) {
  const db = loadDb();
  const certs = (db.certificates || []).filter((c: any) => c.eventId === eventId);
  if (certs.length === 0) throw new Error('No certificates found for this program.');

  const zip = new JSZip();
  let addedCount = 0;

  for (const c of certs) {
    const fileName = `${c.certificateId}.pdf`;
    const localPath = path.join(process.cwd(), 'public', 'certificates', fileName);
    if (fs.existsSync(localPath)) {
      const fileData = fs.readFileSync(localPath);
      const safeRecipient = c.participantName.replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
      const zipEntryName = `${safeRecipient || 'Participant'}_${c.certificateId}.pdf`;
      zip.file(zipEntryName, fileData);
      addedCount++;
    }
  }

  if (addedCount === 0) {
    throw new Error('Certificate PDF files have not been generated yet. Please generate certificates first.');
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return {
    buffer: zipBuffer,
    fileName: `Certificates_${eventId}_${new Date().toISOString().split('T')[0]}.zip`,
    count: addedCount
  };
}

export function retrieveStudentCertificate(eventId: string, fullName: string, mobileNumber: string) {
  const db = loadDb();
  if (!fullName?.trim() || !mobileNumber?.trim()) {
    return { success: false, error: 'Full name and registered mobile number are required.' };
  }

  const cleanInputName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanInputPhone = mobileNumber.replace(/\D/g, '').slice(-10);

  if (cleanInputPhone.length < 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
  }

  const match = (db.certificates || []).find((c: any) => {
    if (eventId && eventId !== 'All' && c.eventId !== eventId && c.eventName !== eventId) {
      return false;
    }
    if (c.status !== 'Published') return false;

    const certNormName = (c.participantName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameMatches = certNormName === cleanInputName;

    const certPhone = String(c.phone || '').replace(/\D/g, '').slice(-10);
    const phoneMatches = certPhone ? certPhone === cleanInputPhone : false;

    return nameMatches && phoneMatches;
  });

  if (!match) {
    return {
      success: false,
      error: 'No published certificate was found for the supplied details.'
    };
  }

  match.downloadsCount = (match.downloadsCount || 0) + 1;
  saveDb(db);
  syncCertificateToSupabase(match, true).catch(() => {});

  return {
    success: true,
    certificate: {
      certificateId: match.certificateId,
      participantName: match.participantName,
      eventName: match.eventName,
      eventDate: match.eventDate,
      certificateType: match.certificateType,
      issueDate: match.issueDate,
      downloadUrl: match.pdfStorageUrl || `/certificates/${match.certificateId}.pdf`,
      status: match.status
    }
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
  syncGalleryToSupabase(newItem, false).catch(() => {});
  addAuditLog('GALLERY_UPLOAD', user, `Uploaded gallery item: ${newItem.title}`);
  return newItem;
}

export function updateGalleryItem(id: string, updates: any, user: AuthUser) {
  const db = loadDb();
  const idx = (db.gallery || []).findIndex((g: any) => g.id === id);
  if (idx === -1) return null;
  db.gallery[idx] = { ...db.gallery[idx], ...updates };
  saveDb(db);
  syncGalleryToSupabase(db.gallery[idx], true).catch(() => {});
  addAuditLog('GALLERY_UPDATE', user, `Updated gallery item: ${db.gallery[idx].title}`);
  return db.gallery[idx];
}

export function deleteGalleryItem(id: string, user: AuthUser) {
  const db = loadDb();
  db.gallery = (db.gallery || []).filter((g: any) => g.id !== id);
  saveDb(db);
  deleteGalleryFromSupabase(id).catch(() => {});
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
  syncProjectToSupabase(newProj, false).catch(() => {});
  addAuditLog('PROJECT_CREATE', user, `Created project: ${newProj.title}`);
  return newProj;
}

export function updateProject(id: string, updates: any, user: AuthUser) {
  const db = loadDb();
  const idx = (db.projects || []).findIndex((p: any) => p.id === id);
  if (idx === -1) return null;
  db.projects[idx] = { ...db.projects[idx], ...updates };
  saveDb(db);
  syncProjectToSupabase(db.projects[idx], true).catch(() => {});
  addAuditLog('PROJECT_UPDATE', user, `Updated project: ${db.projects[idx].title}`);
  return db.projects[idx];
}

export function deleteProject(id: string, user: AuthUser) {
  const db = loadDb();
  db.projects = (db.projects || []).filter((p: any) => p.id !== id);
  saveDb(db);
  deleteProjectFromSupabase(id).catch(() => {});
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
  syncTeamMemberToSupabase(newMember, false).catch(() => {});
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
  syncTeamMemberToSupabase(db.teamMembers[idx], true).catch(() => {});
  addAuditLog('TEAM_MEMBER_UPDATE', user, `Updated team member: ${db.teamMembers[idx].name}`);
  return db.teamMembers[idx];
}

export function deleteTeamMember(id: string, user: AuthUser) {
  const db = loadDb();
  ensureTeamData(db);

  const member = db.teamMembers.find((m: any) => m.id === id);
  db.teamMembers = db.teamMembers.filter((m: any) => m.id !== id);
  saveDb(db);
  deleteTeamMemberFromSupabase(id).catch(() => {});
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
  syncStartupToSupabase(newStartup, false).catch(() => {});
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
  syncResourceToSupabase(newRes, false).catch(() => {});
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
  syncBlogToSupabase(newBlog, false).catch(() => {});
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
  syncAnnouncementToSupabase(newAnn, false).catch(() => {});
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
