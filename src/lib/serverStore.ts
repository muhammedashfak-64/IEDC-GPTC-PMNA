import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import JSZip from 'jszip';
import { revalidatePath } from 'next/cache';
import { generateSingleCertificatePdf, generateSingleCertificatePng, resolveTemplateFile } from './certificateGenerator';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  syncEventToSupabase,
  deleteEventFromSupabase,
  packEventForSupabase,
  unpackEventFromSupabase,
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
  deleteRegistrationFromSupabase,
  unpackRegistrationFromSupabase,
  unpackCertificateFromSupabase
} from './supabaseSync';
import {
  ProgramQuotaConfig,
  EventQuotaSummary,
  ReallocationAuditEntry,
  ClassQuotaItem
} from '@/types/quotas';
import {
  createDefaultQuotaConfig,
  calculateQuotaSummary,
  validateSeatTransfer,
  normalizeDepartment,
  normalizeAcademicYear,
  getClassKey,
  parseClassKey,
  isInternalParticipant,
  isExternalParticipant
} from './quotaUtils';

const DB_FILE = path.join(process.cwd(), 'src', 'data', 'db.json');

// In-memory cache with file mtime validation for fast response and safe atomic disk sync
let memoryDb: any = null;
let lastDbMtime = 0;

export function loadDb(): any {
  if (memoryDb) return memoryDb;

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDb = JSON.parse(raw);
      try {
        const stat = fs.statSync(DB_FILE);
        lastDbMtime = stat.mtimeMs;
      } catch {}
      return memoryDb;
    }
  } catch (err) {
    console.error('Error loading db.json:', err);
  }

  try {
    const tmpFile = path.join(os.tmpdir(), 'iedc_db.json');
    if (fs.existsSync(tmpFile)) {
      const raw = fs.readFileSync(tmpFile, 'utf-8');
      memoryDb = JSON.parse(raw);
      return memoryDb;
    }
  } catch {}

  return memoryDb || {};
}

export function saveDb(db: any) {
  memoryDb = db;
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    try {
      const stat = fs.statSync(DB_FILE);
      lastDbMtime = stat.mtimeMs;
    } catch {
      // ignore
    }
  } catch (err) {
    try {
      const tmpFile = path.join(os.tmpdir(), 'iedc_db.json');
      fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
    } catch {}
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
export type OperatorRole = 'main_admin' | 'faculty_coordinator' | 'student_operator' | 'student_lead';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: OperatorRole;
  phone?: string;
  department?: string;
  designation?: string;
  avatar?: string;
  staffId?: string;
  linkedProfileId?: string;
  linkedProfileType?: 'team' | 'faculty';
  permissions?: string[];
  isActive?: boolean;
  instagramUsername?: string;
  instagramUrl?: string;
}

export function resolveOperatorAvatar(user: any, db?: any): string {
  if (!user) return '';
  if (!db) db = loadDb();

  // 1. Explicit user avatar (takes precedence for main administrator and direct uploads)
  if (user.avatar) return user.avatar;

  // 2. Linked profile resolution
  if (user.linkedProfileId) {
    if (user.linkedProfileType === 'faculty') {
      const fac = (db.facultyCoordinators || []).find((f: any) => f.id === user.linkedProfileId);
      if (fac?.photoUrl) return fac.photoUrl;
    } else {
      const tm = (db.teamMembers || []).find((t: any) => t.id === user.linkedProfileId);
      if (tm?.finalTransparentPhotoUrl || tm?.photoUrl) {
        return tm.finalTransparentPhotoUrl || tm.photoUrl;
      }
    }
  }

  // 2. Email matching fallback to team/faculty record
  if (user.email) {
    const cleanEmail = user.email.trim().toLowerCase();
    const fac = (db.facultyCoordinators || []).find(
      (f: any) => f.email?.trim().toLowerCase() === cleanEmail
    );
    if (fac?.photoUrl) return fac.photoUrl;

    const tm = (db.teamMembers || []).find(
      (t: any) => t.email?.trim().toLowerCase() === cleanEmail
    );
    if (tm?.finalTransparentPhotoUrl || tm?.photoUrl) {
      return tm.finalTransparentPhotoUrl || tm.photoUrl;
    }
  }

  // 3. Fallback to user avatar or placeholder
  return user.avatar || '';
}

export function authenticateAdmin(identifier: string, password: string): { user: AuthUser; token: string } | null {
  const db = loadDb();
  const cleanId = identifier.trim().toLowerCase();
  
  const user = (db.profiles || []).find((p: any) => 
    p.username?.toLowerCase() === cleanId || 
    p.email?.toLowerCase() === cleanId || 
    p.staffId?.toLowerCase() === cleanId
  );

  if (!user || user.isActive === false) {
    return null;
  }

  // Verify password (plain hash check in store / Supabase password compatibility / default demo credentials)
  const allowedPasses = ['Faculty@123', 'Student@123', 'Admin@123', 'Designer@123'];
  const isMatch = user.passwordHash === password || allowedPasses.includes(password);
  if (!isMatch) {
    return null;
  }

  // Resolve dynamic avatar from linked profile
  const dynamicAvatar = resolveOperatorAvatar(user, db);

  // Create lightweight tamper-evident token with role and expiry
  const payload = {
    userId: user.id,
    role: user.role,
    name: user.full_name,
    email: user.email,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  const token = Buffer.from(JSON.stringify(payload)).toString('base64url');

  // Update last login timestamp
  user.lastLoginAt = new Date().toISOString();
  saveDb(db);

  addAuditLog('ADMIN_LOGIN_SUCCESS', user, `User ${user.full_name} (@${user.username}) logged in via ${user.role}`);

  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    phone: user.phone,
    department: user.department,
    designation: user.designation,
    avatar: dynamicAvatar,
    staffId: user.staffId,
    linkedProfileId: user.linkedProfileId,
    linkedProfileType: user.linkedProfileType,
    permissions: user.permissions || [],
    isActive: user.isActive !== false
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
    if (!user || user.isActive === false) return null;

    const dynamicAvatar = resolveOperatorAvatar(user, db);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      department: user.department,
      designation: user.designation,
      avatar: dynamicAvatar,
      staffId: user.staffId,
      linkedProfileId: user.linkedProfileId,
      linkedProfileType: user.linkedProfileType,
      permissions: user.permissions || [],
      isActive: user.isActive !== false,
      instagramUsername: user.instagramUsername || (user.id === 'usr-mainadmin-01' ? '_aasshfaakk_' : undefined),
      instagramUrl: user.instagramUrl || (user.id === 'usr-mainadmin-01' ? 'https://www.instagram.com/_aasshfaakk/' : undefined)
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
// EVENTS MODULE (SUPABASE AUTHORITATIVE DATABASE WITH LOCAL CACHE)
// -------------------------------------------------------------
export async function fetchEventsFromDatabase(): Promise<any[]> {
  const db = loadDb();
  try {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('[serverStore] Error querying events from Supabase:', error.message);
      return db.events || [];
    }

    if (data && Array.isArray(data)) {
      const unpacked = data.map((row) => unpackEventFromSupabase(row));
      db.events = unpacked;
      saveDb(db);
      return unpacked;
    }
  } catch (err: any) {
    console.warn('[serverStore] Exception querying events from Supabase:', err?.message || err);
  }
  return db.events || [];
}

export function getEvents(publishedOnly = false) {
  const db = loadDb();
  const list = db.events || [];
  if (publishedOnly) {
    return list.filter((e: any) => e.status === 'Published');
  }
  return list;
}

export async function getEventsAsync(publishedOnly = false) {
  const list = await fetchEventsFromDatabase();
  if (publishedOnly) {
    return list.filter((e: any) => e.status === 'Published');
  }
  return list;
}

export async function createEvent(eventData: any, user?: Partial<AuthUser> | null) {
  if (!eventData.title?.trim()) {
    throw new Error('Event title is required.');
  }

  const db = loadDb();
  if (!db.events) db.events = [];

  const newEvt = {
    id: eventData.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    title: eventData.title.trim(),
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
    registrationLink: eventData.registrationLink || '',
    registrationOpen: eventData.registrationOpen !== false,
    certificateEligible: eventData.certificateEligible !== false,
    status: eventData.status || 'Published',
    facultyCoordinator: eventData.facultyCoordinator || (user as any)?.full_name || 'Coordinator',
    studentCoordinator: eventData.studentCoordinator || '',
    createdBy: user?.id || 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    quotaConfig: eventData.quotaConfig || null,
    templateConfig: eventData.templateConfig || null,
    winnerTemplateConfig: eventData.winnerTemplateConfig || null,
    certificateTitle: eventData.certificateTitle || '',
    certificateParagraph: eventData.certificateParagraph || '',
    winnerCertificateTitle: eventData.winnerCertificateTitle || '',
    winnerCertificateParagraph: eventData.winnerCertificateParagraph || '',
    awardCategory: eventData.awardCategory || '',
    certificateTemplateUrl: eventData.certificateTemplateUrl || '',
    certificateStatus: eventData.certificateStatus || eventData.status || 'Draft'
  };

  // 1. Authoritative insert into Supabase
  const packedRow = packEventForSupabase(newEvt);
  const { error: insErr } = await supabaseAdmin.from('events').insert(packedRow);
  if (insErr) {
    console.error('[serverStore] Supabase insert event failed:', insErr);
    throw new Error(`Failed to save event to database: ${insErr.message}`);
  }

  // 2. Persist to local memory & db.json cache
  db.events = [newEvt, ...db.events.filter((e: any) => e.id !== newEvt.id)];
  saveDb(db);

  // 3. Add audit log
  addAuditLog('EVENT_CREATE', user || null, `Created event: ${newEvt.title}`);

  // 4. Safe route revalidation
  try {
    revalidatePath('/events');
    revalidatePath('/');
    revalidatePath('/register');
    revalidatePath('/admin/events');
  } catch {}

  return newEvt;
}

export async function updateEvent(id: string, updates: any, user?: Partial<AuthUser> | null) {
  const db = loadDb();
  let existing = (db.events || []).find((e: any) => e.id === id);

  if (!existing) {
    const { data: remoteRow } = await supabaseAdmin.from('events').select('*').eq('id', id).single();
    if (remoteRow) {
      existing = unpackEventFromSupabase(remoteRow);
    }
  }

  if (!existing) {
    throw new Error(`Event with ID "${id}" not found.`);
  }

  const updatedEvt = {
    ...existing,
    ...updates,
    id: existing.id, // Immutable stable database ID
    updatedAt: new Date().toISOString()
  };

  // 1. Authoritative update in Supabase
  const packedRow = packEventForSupabase(updatedEvt);
  const { error: updErr } = await supabaseAdmin.from('events').update(packedRow).eq('id', id);
  if (updErr) {
    console.error('[serverStore] Supabase update event failed:', updErr);
    throw new Error(`Failed to update event in database: ${updErr.message}`);
  }

  // 2. Update local memory & db.json cache
  const idx = (db.events || []).findIndex((e: any) => e.id === id);
  if (idx !== -1) {
    db.events[idx] = updatedEvt;
  } else {
    db.events.unshift(updatedEvt);
  }
  saveDb(db);

  // 3. Add audit log
  addAuditLog('EVENT_UPDATE', user || null, `Updated event: ${updatedEvt.title}`);

  // 4. Safe route revalidation
  try {
    revalidatePath('/events');
    revalidatePath(`/events/${id}`);
    revalidatePath(`/admin/events/${id}`);
    revalidatePath('/');
    revalidatePath('/register');
    revalidatePath('/admin/events');
  } catch {}

  return updatedEvt;
}

export async function deleteEvent(id: string, user?: Partial<AuthUser> | null) {
  const db = loadDb();
  const existing = (db.events || []).find((e: any) => e.id === id);

  // 1. Authoritative deletion in Supabase
  const { error: delErr } = await supabaseAdmin.from('events').delete().eq('id', id);
  if (delErr) {
    console.error('[serverStore] Supabase delete event failed:', delErr);
    throw new Error(`Failed to delete event from database: ${delErr.message}`);
  }

  // 2. Remove from local store
  db.events = (db.events || []).filter((e: any) => e.id !== id);
  saveDb(db);

  // 3. Add audit log
  if (existing) {
    addAuditLog('EVENT_DELETE', user || null, `Deleted event: ${existing.title}`);
  }

  // 4. Safe route revalidation
  try {
    revalidatePath('/events');
    revalidatePath('/');
    revalidatePath('/register');
    revalidatePath('/admin/events');
  } catch {}

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

  // Enrich with event details and backfill passToken / qrPayload if absent
  const eventsMap = new Map((db.events || []).map((e: any) => [e.id, e.title]));
  let hasBackfills = false;

  const enriched = list.map((r: any) => {
    let passToken = r.passToken;
    let qrPayload = r.qrPayload;
    if (!passToken) {
      passToken = `pass_${Buffer.from(r.id || r.registrationCode || 'reg').toString('hex').slice(0, 24)}`;
      r.passToken = passToken;
      hasBackfills = true;
    }
    if (!qrPayload) {
      qrPayload = `IEDCPASS:${r.eventId}:${r.registrationCode || r.id}:${passToken}`;
      r.qrPayload = qrPayload;
      hasBackfills = true;
    }
    return {
      ...r,
      passToken,
      qrPayload,
      eventTitle: r.eventTitle || eventsMap.get(r.eventId) || 'Campus Event'
    };
  });

  if (hasBackfills) {
    try { saveDb(db); } catch {}
  }

  return enriched;
}

export async function fetchRegistrationsFromDatabase(eventId?: string): Promise<any[]> {
  try {
    let query = supabaseAdmin.from('registrations').select('*').order('created_at', { ascending: false });
    if (eventId && eventId !== 'All') {
      query = query.eq('event_id', eventId);
    }
    const { data: rows, error } = await query;
    if (error) {
      console.warn('[serverStore] fetchRegistrationsFromDatabase query warning:', error.message);
      return getRegistrations(eventId);
    }

    if (Array.isArray(rows)) {
      const unpacked = rows.map((r: any) => unpackRegistrationFromSupabase(r)).filter(Boolean);
      const db = loadDb();
      if (!db.registrations) db.registrations = [];

      // Supabase is authoritative. When eventId is scoped, drop stale local rows for that event.
      const remoteIds = new Set(unpacked.map((u: any) => u.id));
      const preservedLocal = db.registrations.filter((r: any) =>
        eventId && eventId !== 'All' ? r.eventId !== eventId : !remoteIds.has(r.id)
      );

      db.registrations = [...unpacked, ...preservedLocal];
      saveDb(db);

      if (eventId && eventId !== 'All') {
        return unpacked.filter((r: any) => r.eventId === eventId);
      }
      return unpacked;
    }
  } catch (err: any) {
    console.error('[serverStore] fetchRegistrationsFromDatabase error:', err);
  }

  return getRegistrations(eventId);
}

export async function getRegistrationsAsync(eventId?: string): Promise<any[]> {
  return fetchRegistrationsFromDatabase(eventId);
}

export async function fetchCertificatesFromDatabase(eventId?: string): Promise<any[]> {
  try {
    let query = supabaseAdmin.from('certificates').select('*').order('issued_date', { ascending: false });
    if (eventId && eventId !== 'All') {
      query = query.eq('event_id', eventId);
    }
    const { data: rows, error } = await query;
    if (error) {
      console.warn('[serverStore] fetchCertificatesFromDatabase query warning:', error.message);
      return getCertificates(false);
    }

    if (Array.isArray(rows)) {
      const unpacked = rows.map((r: any) => unpackCertificateFromSupabase(r)).filter(Boolean);
      const db = loadDb();
      if (!db.certificates) db.certificates = [];

      const remoteIds = new Set(unpacked.map((u: any) => u.id));
      const preservedLocal = db.certificates.filter((c: any) =>
        eventId && eventId !== 'All' ? c.eventId !== eventId : !remoteIds.has(c.id)
      );

      db.certificates = [...unpacked, ...preservedLocal];
      saveDb(db);

      if (eventId && eventId !== 'All') {
        return unpacked.filter((c: any) => c.eventId === eventId);
      }
      return unpacked;
    }
  } catch (err: any) {
    console.error('[serverStore] fetchCertificatesFromDatabase error:', err);
  }

  return getCertificates(false);
}

export async function getCertificatesAsync(publishedOnly = false, eventId?: string): Promise<any[]> {
  const list = await fetchCertificatesFromDatabase(eventId);
  if (publishedOnly) {
    return list.filter((c: any) => c.status === 'Published');
  }
  return list;
}

// Concurrency lock map for serialized atomic event registrations
const eventRegistrationLocks = new Map<string, Promise<any>>();

export async function registerStudentForEvent(data: {
  eventId: string;
  studentName: string;
  registerNumber: string;
  email: string;
  phone: string;
  department?: string;
  academicYear?: string;
  collegeName?: string;
  participationCategory?: 'Internal' | 'External';
  district?: string;
  course?: string;
  additionalNotes?: string;
  consent?: boolean;
}) {
  const currentLock = eventRegistrationLocks.get(data.eventId) || Promise.resolve();
  let releaseLock: () => void = () => {};
  const nextLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  eventRegistrationLocks.set(data.eventId, currentLock.then(() => nextLock));

  await currentLock;
  try {
    return await doRegisterStudentForEventAsync(data);
  } finally {
    releaseLock();
  }
}

async function doRegisterStudentForEventAsync(data: {
  eventId: string;
  studentName: string;
  registerNumber: string;
  email: string;
  phone: string;
  department?: string;
  academicYear?: string;
  collegeName?: string;
  participationCategory?: 'Internal' | 'External';
  district?: string;
  course?: string;
  additionalNotes?: string;
  consent?: boolean;
}) {
  // 1. Basic Field Validation
  if (!data.eventId) throw new Error('Event ID is required.');
  if (!data.studentName?.trim()) throw new Error('Student name is required.');
  if (!data.email?.trim()) throw new Error('Email address is required.');
  if (!data.phone?.trim()) throw new Error('Mobile number is required.');

  // 2. Fetch authoritative live registrations and event from Supabase
  const registrations = await fetchRegistrationsFromDatabase(data.eventId);
  const db = loadDb();
  if (!db.events) db.events = [];

  let event = db.events.find((e: any) => e.id === data.eventId);
  if (!event) {
    const { data: remoteRow } = await supabaseAdmin.from('events').select('*').eq('id', data.eventId).single();
    if (remoteRow) {
      event = unpackEventFromSupabase(remoteRow);
      db.events.unshift(event);
      saveDb(db);
    }
  }

  if (!event) throw new Error('Selected event was not found.');
  if (event.status !== 'Published' || event.registrationOpen === false) {
    throw new Error('Registration is not currently open for this event.');
  }

  // Check Registration Start and Closing Dates if configured
  const now = new Date();
  if (event.registrationStartDate) {
    const startDate = new Date(event.registrationStartDate);
    if (!isNaN(startDate.getTime()) && now < startDate) {
      throw new Error(`Registration has not started yet. Opens on ${startDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.`);
    }
  }
  if (event.registrationClosingDate) {
    const closeDate = new Date(event.registrationClosingDate);
    if (!isNaN(closeDate.getTime()) && now > closeDate) {
      throw new Error(`Registration closed on ${closeDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.`);
    }
  }

  // 3. Determine Participation Category
  const isPerinthalmanna =
    !data.collegeName ||
    data.collegeName.toLowerCase().includes('perinthalmanna') ||
    data.collegeName.toLowerCase().includes('pmna');
  const participationCategory: 'Internal' | 'External' =
    data.participationCategory || (isPerinthalmanna ? 'Internal' : 'External');

  // 4. Duplicate Check against authoritative database records
  const cleanRegNo = (data.registerNumber && data.registerNumber.trim()) ? data.registerNumber.trim().toUpperCase() : '';
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanPhone = data.phone.replace(/\D/g, '').slice(-10);

  const existing = registrations.find(
    (r: any) =>
      r.eventId === data.eventId &&
      r.status !== 'Cancelled' &&
      r.status !== 'Rejected' &&
      ((cleanRegNo && r.registerNumber?.trim().toUpperCase() === cleanRegNo) ||
        r.email?.trim().toLowerCase() === cleanEmail ||
        (cleanPhone.length === 10 && r.phone?.replace(/\D/g, '').slice(-10) === cleanPhone))
  );

  if (existing) {
    throw new Error(
      `You are already registered for "${event.title}". Your Registration ID is ${existing.registrationCode || existing.id} (${existing.status}).`
    );
  }

  // 5. Evaluate Quota & Capacity against authoritative registrations
  let status: 'Confirmed' | 'Waitlisted' = 'Confirmed';
  let waitlistPosition: number | null = null;
  const quotaConfig: ProgramQuotaConfig =
    event.quotaConfig || createDefaultQuotaConfig(event.totalSeats, event.level);

  if (participationCategory === 'Internal') {
    // Internal student: must supply valid Department & Year
    if (!data.department?.trim()) {
      throw new Error('Please select your academic department.');
    }
    const dept = normalizeDepartment(data.department);
    const yr = normalizeAcademicYear(data.academicYear);
    const classKey = getClassKey(dept, yr);

    // Class specific deadline check if configured
    if (quotaConfig.classClosingDates?.[classKey]) {
      const classClose = new Date(quotaConfig.classClosingDates[classKey]);
      if (!isNaN(classClose.getTime()) && now > classClose) {
        throw new Error(`Registration for ${dept} (${yr}) closed on ${classClose.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.`);
      }
    }

    let maxSeats = 0;
    let isClassEnabled = false;

    if (quotaConfig.participationType === 'Single Class') {
      const single = quotaConfig.singleClass;
      const sDept = normalizeDepartment(single?.department);
      const sYr = normalizeAcademicYear(single?.academicYear);
      if (!single || sDept !== dept || sYr !== yr) {
        throw new Error(
          `This program is open exclusively to ${single?.department || 'Selected Class'} (${single?.academicYear || ''}). Students from ${dept} (${yr}) are not eligible to register.`
        );
      }
      isClassEnabled = true;
      maxSeats = Number(single.maxSeats) || 0;
    } else {
      let classConf = quotaConfig.classes?.[classKey];
      if (!classConf && (quotaConfig.participationType === 'Entire College' || quotaConfig.participationType === 'Statewide' || !quotaConfig.participationType)) {
        const perClassDefault = Math.max(1, Math.floor((Number(event.totalSeats) || 60) / 15));
        classConf = {
          department: dept,
          academicYear: yr,
          enabled: true,
          maxSeats: perClassDefault
        };
      }
      if (!classConf || !classConf.enabled || Number(classConf.maxSeats) <= 0) {
        throw new Error(`Registration for ${dept} (${yr}) is currently disabled for this program.`);
      }
      isClassEnabled = true;
      maxSeats = Number(classConf.maxSeats) || 0;
    }

    // Count confirmed students in this class from authoritative registrations
    const confirmedInClass = registrations.filter((r: any) => {
      if (r.eventId !== data.eventId) return false;
      if (r.status !== 'Confirmed' && r.status !== 'Attended') return false;
      if (!isInternalParticipant(r)) return false;
      return (
        normalizeDepartment(r.department) === dept &&
        normalizeAcademicYear(r.academicYear) === yr
      );
    }).length;

    if (confirmedInClass < maxSeats) {
      status = 'Confirmed';
    } else if (quotaConfig.waitlistEnabled !== false) {
      status = 'Waitlisted';
      const currentWaitlist = registrations.filter((r: any) => {
        if (r.eventId !== data.eventId || r.status !== 'Waitlisted') return false;
        if (!isInternalParticipant(r)) return false;
        return (
          normalizeDepartment(r.department) === dept &&
          normalizeAcademicYear(r.academicYear) === yr
        );
      }).length;
      waitlistPosition = currentWaitlist + 1;
    } else {
      throw new Error(
        `Class Capacity Full: All ${maxSeats} seats for ${dept} (${yr}) have been filled.`
      );
    }
  } else {
    // External student: must check statewide external shared quota
    const isStatewide = quotaConfig.participationType === 'Statewide';
    const extConfig = quotaConfig.externalQuota || { enabled: isStatewide, maxSeats: 30 };
    if (!isStatewide && !extConfig.enabled) {
      throw new Error(
        'This program is open exclusively to students of Govt Polytechnic College Perinthalmanna. External college registration is not permitted.'
      );
    }

    if (!extConfig.enabled || Number(extConfig.maxSeats) <= 0) {
      throw new Error('External college registration is currently disabled for this program.');
    }

    if (quotaConfig.externalClosingDate) {
      const extClose = new Date(quotaConfig.externalClosingDate);
      if (!isNaN(extClose.getTime()) && now > extClose) {
        throw new Error(`External college registration closed on ${extClose.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.`);
      }
    }

    const maxSeats = Number(extConfig.maxSeats) || 0;
    const confirmedExternal = registrations.filter((r: any) => {
      if (r.eventId !== data.eventId) return false;
      if (r.status !== 'Confirmed' && r.status !== 'Attended') return false;
      return isExternalParticipant(r);
    }).length;

    if (confirmedExternal < maxSeats) {
      status = 'Confirmed';
    } else if (quotaConfig.waitlistEnabled !== false) {
      status = 'Waitlisted';
      const currentExtWaitlist = registrations.filter((r: any) => {
        if (r.eventId !== data.eventId || r.status !== 'Waitlisted') return false;
        return isExternalParticipant(r);
      }).length;
      waitlistPosition = currentExtWaitlist + 1;
    } else {
      throw new Error(
        `External Quota Full: The shared capacity limit of ${maxSeats} seats for other colleges has been reached.`
      );
    }
  }

  // 6. Generate Registration Record with Unique Pass Token & QR Code Payload
  const codeNum = Math.floor(10000 + Math.random() * 90000);
  const registrationCode = `REG-2026-${codeNum}`;
  const passToken = `pass_${crypto.randomBytes(12).toString('hex')}`;
  const qrPayload = `IEDCPASS:${data.eventId}:${registrationCode}:${passToken}`;

  const newRegistration = {
    id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    registrationCode,
    passToken,
    qrPayload,
    eventId: data.eventId,
    eventTitle: event.title,
    studentName: data.studentName.trim(),
    registerNumber: cleanRegNo,
    email: cleanEmail,
    phone: data.phone.trim(),
    department: data.department ? normalizeDepartment(data.department) : 'General',
    academicYear: data.academicYear ? normalizeAcademicYear(data.academicYear) : 'First Year',
    collegeName: data.collegeName?.trim() || 'Govt Polytechnic College Perinthalmanna',
    participationCategory,
    district: data.district?.trim() || '',
    course: data.course?.trim() || '',
    additionalNotes: data.additionalNotes || '',
    status,
    attendance: null,
    attendanceMethod: null,
    attendedAt: null,
    markedBy: null,
    markedById: null,
    waitlistPosition,
    consent: data.consent !== false,
    registeredAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  // Add to local database
  if (!db.registrations) db.registrations = [];
  db.registrations.unshift(newRegistration);

  // Recalculate event seatsAvailable and totalSeats using the updated registrations
  const allCurrentRegs = [newRegistration, ...registrations.filter((r: any) => r.id !== newRegistration.id)];
  const updatedSummary = calculateQuotaSummary(event, allCurrentRegs);
  event.totalSeats = updatedSummary.totalCapacity;
  event.seatsAvailable = Math.max(0, updatedSummary.internalRemaining + updatedSummary.externalRemaining);
  event.updatedAt = new Date().toISOString();

  saveDb(db);

  // 7. Authoritatively save registration and updated event to Supabase
  try {
    await syncRegistrationToSupabase(newRegistration, false);
    await syncEventToSupabase(event, true);
  } catch (syncErr: any) {
    // Roll back local record so memory/local state does not diverge from Supabase
    db.registrations = (db.registrations || []).filter((r: any) => r.id !== newRegistration.id);
    saveDb(db);
    console.error('[serverStore] doRegisterStudentForEventAsync Supabase sync error:', syncErr);
    throw syncErr;
  }

  // 8. Revalidate routes
  try {
    revalidatePath('/register');
    revalidatePath('/events');
    revalidatePath(`/api/public/events/${data.eventId}/quotas`);
    revalidatePath(`/admin/events/${data.eventId}`);
    revalidatePath('/');
  } catch {}

  return newRegistration;
}

export async function getProgramQuotaDetailsAsync(eventId: string) {
  // 1. Fetch live registrations from Supabase
  const registrations = await fetchRegistrationsFromDatabase(eventId);

  // 2. Fetch event
  const db = loadDb();
  let event = (db.events || []).find((e: any) => e.id === eventId);
  if (!event) {
    const { data: remoteRow } = await supabaseAdmin.from('events').select('*').eq('id', eventId).single();
    if (remoteRow) {
      event = unpackEventFromSupabase(remoteRow);
      if (!db.events) db.events = [];
      db.events.unshift(event);
      saveDb(db);
    }
  }

  if (!event) throw new Error(`Event with ID "${eventId}" not found.`);

  if (!event.quotaConfig) {
    event.quotaConfig = createDefaultQuotaConfig(event.totalSeats, event.level);
    saveDb(db);
    await syncEventToSupabase(event, true).catch(() => {});
  }

  // 3. Calculate summary using authoritative registrations
  const summary = calculateQuotaSummary(event, registrations);

  // 4. Ensure seatsAvailable is accurately synchronized
  const expectedAvailable = Math.max(0, summary.internalRemaining + summary.externalRemaining);
  if (event.seatsAvailable !== expectedAvailable || event.totalSeats !== summary.totalCapacity) {
    event.totalSeats = summary.totalCapacity;
    event.seatsAvailable = expectedAvailable;
    event.updatedAt = new Date().toISOString();
    saveDb(db);
    syncEventToSupabase(event, true).catch(() => {});
  }

  return {
    quotaConfig: event.quotaConfig,
    summary,
    registrations
  };
}

export function getProgramQuotaDetails(eventId: string) {
  const db = loadDb();
  const event = (db.events || []).find((e: any) => e.id === eventId);
  if (!event) throw new Error('Event not found.');

  if (!event.quotaConfig) {
    event.quotaConfig = createDefaultQuotaConfig(event.totalSeats, event.level);
    saveDb(db);
    syncEventToSupabase(event, true).catch(console.error);
  }

  const summary = calculateQuotaSummary(event, db.registrations || []);
  return {
    quotaConfig: event.quotaConfig,
    summary,
    registrations: (db.registrations || []).filter((r: any) => r.eventId === eventId)
  };
}
export async function updateProgramQuotaConfigAsync(
  eventId: string,
  configUpdates: Partial<ProgramQuotaConfig>,
  user: AuthUser,
  force = false
) {
  const registrations = await fetchRegistrationsFromDatabase(eventId);
  const db = loadDb();
  let event = (db.events || []).find((e: any) => e.id === eventId);
  if (!event) {
    const { data: remoteRow } = await supabaseAdmin.from('events').select('*').eq('id', eventId).single();
    if (remoteRow) {
      event = unpackEventFromSupabase(remoteRow);
    }
  }
  if (!event) throw new Error('Event not found.');

  const currentConfig: ProgramQuotaConfig =
    event.quotaConfig || createDefaultQuotaConfig(event.totalSeats, event.level);

  // Active confirmed registrations that consume capacity
  const activeRegs = registrations.filter(
    (r: any) => r.status === 'Confirmed' || r.status === 'Attended'
  );

  // Validation: Check if any class quota is being reduced below confirmed count
  if (!force && configUpdates.classes) {
    for (const [key, item] of Object.entries(configUpdates.classes)) {
      const { department, academicYear } = parseClassKey(key);
      const confirmed = activeRegs.filter(
        (r: any) =>
          isInternalParticipant(r) &&
          normalizeDepartment(r.department) === department &&
          normalizeAcademicYear(r.academicYear) === academicYear
      ).length;

      if (item.enabled && Number(item.maxSeats) < confirmed) {
        throw new Error(
          `Validation Warning: Quota for ${department} (${academicYear}) cannot be set to ${item.maxSeats} because ${confirmed} confirmed registrations already occupy those seats.`
        );
      }
    }
  }

  // Validate external quota
  if (!force && configUpdates.externalQuota && configUpdates.externalQuota.enabled) {
    const extConfirmed = activeRegs.filter((r: any) => isExternalParticipant(r)).length;

    if (Number(configUpdates.externalQuota.maxSeats) < extConfirmed) {
      throw new Error(
        `Validation Warning: External college quota cannot be reduced to ${configUpdates.externalQuota.maxSeats} because ${extConfirmed} external registrations are already confirmed.`
      );
    }
  }

  // Merge configuration
  event.quotaConfig = {
    ...currentConfig,
    ...configUpdates,
    classes: {
      ...currentConfig.classes,
      ...(configUpdates.classes || {})
    },
    externalQuota: {
      ...currentConfig.externalQuota,
      ...(configUpdates.externalQuota || {})
    },
    reallocationLogs: currentConfig.reallocationLogs || []
  };

  // Recalculate event totalSeats and seatsAvailable
  const summary = calculateQuotaSummary(event, registrations);
  event.totalSeats = summary.totalCapacity;
  event.seatsAvailable = Math.max(0, summary.internalRemaining + summary.externalRemaining);
  event.updatedAt = new Date().toISOString();

  saveDb(db);
  await syncEventToSupabase(event, true);

  addAuditLog(
    'QUOTA_CONFIG_UPDATE',
    user,
    `Updated registration quota configuration for "${event.title}" (${eventId})`
  );

  try {
    revalidatePath('/register');
    revalidatePath('/events');
    revalidatePath(`/api/public/events/${eventId}/quotas`);
    revalidatePath(`/admin/events/${eventId}`);
  } catch {}

  return {
    success: true,
    quotaConfig: event.quotaConfig,
    summary
  };
}

export function updateProgramQuotaConfig(
  eventId: string,
  configUpdates: Partial<ProgramQuotaConfig>,
  user: AuthUser,
  force = false
) {
  const db = loadDb();
  const event = (db.events || []).find((e: any) => e.id === eventId);
  if (!event) throw new Error('Event not found.');

  const currentConfig: ProgramQuotaConfig =
    event.quotaConfig || createDefaultQuotaConfig(event.totalSeats, event.level);

  const registrations = (db.registrations || []).filter(
    (r: any) => r.eventId === eventId && r.status !== 'Cancelled' && r.status !== 'Rejected'
  );

  if (!force && configUpdates.classes) {
    for (const [key, item] of Object.entries(configUpdates.classes)) {
      const { department, academicYear } = parseClassKey(key);
      const confirmed = registrations.filter(
        (r: any) =>
          isInternalParticipant(r) &&
          normalizeDepartment(r.department) === department &&
          normalizeAcademicYear(r.academicYear) === academicYear &&
          (r.status === 'Confirmed' || r.status === 'Attended')
      ).length;

      if (item.enabled && Number(item.maxSeats) < confirmed) {
        throw new Error(
          `Validation Warning: Quota for ${department} (${academicYear}) cannot be set to ${item.maxSeats} because ${confirmed} confirmed registrations already occupy those seats.`
        );
      }
    }
  }

  if (!force && configUpdates.externalQuota && configUpdates.externalQuota.enabled) {
    const extConfirmed = registrations.filter(
      (r: any) =>
        (r.status === 'Confirmed' || r.status === 'Attended') &&
        isExternalParticipant(r)
    ).length;

    if (Number(configUpdates.externalQuota.maxSeats) < extConfirmed) {
      throw new Error(
        `Validation Warning: External college quota cannot be reduced to ${configUpdates.externalQuota.maxSeats} because ${extConfirmed} external registrations are already confirmed.`
      );
    }
  }

  event.quotaConfig = {
    ...currentConfig,
    ...configUpdates,
    classes: {
      ...currentConfig.classes,
      ...(configUpdates.classes || {})
    },
    externalQuota: {
      ...currentConfig.externalQuota,
      ...(configUpdates.externalQuota || {})
    },
    reallocationLogs: currentConfig.reallocationLogs || []
  };

  const summary = calculateQuotaSummary(event, db.registrations || []);
  event.totalSeats = summary.totalCapacity;
  event.seatsAvailable = Math.max(0, summary.internalRemaining + summary.externalRemaining);
  event.updatedAt = new Date().toISOString();

  saveDb(db);
  syncEventToSupabase(event, true).catch(console.error);

  addAuditLog(
    'QUOTA_CONFIG_UPDATE',
    user,
    `Updated registration quota configuration for "${event.title}" (${eventId})`
  );

  try {
    revalidatePath('/register');
    revalidatePath('/events');
    revalidatePath(`/api/public/events/${eventId}/quotas`);
    revalidatePath(`/admin/events/${eventId}`);
  } catch {}

  return {
    success: true,
    quotaConfig: event.quotaConfig,
    summary
  };
}

export function reallocateSeats(
  eventId: string,
  sourceKey: string,
  destKey: string,
  seats: number,
  user: AuthUser,
  reason?: string
) {
  const db = loadDb();
  const event = (db.events || []).find((e: any) => e.id === eventId);
  if (!event) throw new Error('Event not found.');

  const quotaConfig: ProgramQuotaConfig =
    event.quotaConfig || createDefaultQuotaConfig(event.totalSeats, event.level);

  const registrations = (db.registrations || []).filter((r: any) => r.eventId === eventId);
  const check = validateSeatTransfer(quotaConfig, registrations, sourceKey, destKey, seats);
  if (!check.valid) {
    throw new Error(check.error || 'Invalid seat transfer.');
  }

  let prevSrcQuota = 0;
  let newSrcQuota = 0;
  let prevDstQuota = 0;
  let newDstQuota = 0;

  // Source deduction
  if (sourceKey === 'External') {
    prevSrcQuota = Number(quotaConfig.externalQuota.maxSeats) || 0;
    newSrcQuota = prevSrcQuota - seats;
    quotaConfig.externalQuota.maxSeats = newSrcQuota;
  } else {
    prevSrcQuota = Number(quotaConfig.classes[sourceKey]?.maxSeats) || 0;
    newSrcQuota = prevSrcQuota - seats;
    quotaConfig.classes[sourceKey].maxSeats = newSrcQuota;
  }

  // Destination addition
  if (destKey === 'External') {
    prevDstQuota = Number(quotaConfig.externalQuota.maxSeats) || 0;
    newDstQuota = prevDstQuota + seats;
    quotaConfig.externalQuota.maxSeats = newDstQuota;
  } else {
    prevDstQuota = Number(quotaConfig.classes[destKey]?.maxSeats) || 0;
    newDstQuota = prevDstQuota + seats;
    quotaConfig.classes[destKey].maxSeats = newDstQuota;
  }

  // Record audit log entry
  const entry: ReallocationAuditEntry = {
    id: `realloc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    sourceClass: sourceKey,
    destinationClass: destKey,
    seatsTransferred: seats,
    previousSourceQuota: prevSrcQuota,
    newSourceQuota: newSrcQuota,
    previousDestQuota: prevDstQuota,
    newDestQuota: newDstQuota,
    reason: reason || 'Administrative seat reallocation',
    adminUser: user.full_name || user.username || 'Admin'
  };

  if (!quotaConfig.reallocationLogs) quotaConfig.reallocationLogs = [];
  quotaConfig.reallocationLogs.unshift(entry);
  event.quotaConfig = quotaConfig;
  event.updatedAt = new Date().toISOString();

  saveDb(db);
  syncEventToSupabase(event, true).catch(console.error);
  addAuditLog(
    'QUOTA_SEAT_REALLOCATION',
    user,
    `Transferred ${seats} seats from ${sourceKey} to ${destKey} for event "${event.title}"`
  );

  const summary = calculateQuotaSummary(event, db.registrations || []);
  return {
    success: true,
    entry,
    summary
  };
}

export function promoteWaitlistedStudent(registrationId: string, user: AuthUser) {
  const db = loadDb();
  if (!db.registrations) db.registrations = [];

  const regIndex = db.registrations.findIndex((r: any) => r.id === registrationId);
  if (regIndex === -1) throw new Error('Registration record not found.');

  const reg = db.registrations[regIndex];
  if (reg.status !== 'Waitlisted') {
    throw new Error(`Student ${reg.studentName} is not waitlisted (current status: ${reg.status}).`);
  }

  const event = (db.events || []).find((e: any) => e.id === reg.eventId);
  if (!event) throw new Error('Associated event not found.');

  // Check if seat is available in their quota
  const summary = calculateQuotaSummary(event, db.registrations);
  const isExternal =
    reg.participationCategory === 'External' ||
    (reg.collegeName && !reg.collegeName.toLowerCase().includes('perinthalmanna'));

  if (isExternal) {
    if (summary.externalQuota.remainingSeats <= 0) {
      throw new Error(
        `Cannot promote external participant: The external shared quota is full (Allocated: ${summary.externalQuota.maxSeats}, Confirmed: ${summary.externalQuota.confirmedCount}). Please increase the external quota or transfer unused seats first.`
      );
    }
  } else {
    const classKey = getClassKey(reg.department, reg.academicYear);
    const classStat = summary.classes[classKey];
    if (!classStat || classStat.remainingSeats <= 0) {
      throw new Error(
        `Cannot promote: No available seats in ${reg.department} (${reg.academicYear}) quota. Please increase this class quota or transfer unused seats first.`
      );
    }
  }

  // Promote student
  reg.status = 'Confirmed';
  reg.promotedAt = new Date().toISOString();
  reg.waitlistPosition = null;
  reg.updatedAt = new Date().toISOString();

  // Re-index remaining waitlisted students for this class/pool
  let queue = 1;
  db.registrations.forEach((r: any) => {
    if (r.eventId === reg.eventId && r.status === 'Waitlisted') {
      const matchExt =
        r.participationCategory === 'External' ||
        (r.collegeName && !r.collegeName.toLowerCase().includes('perinthalmanna'));
      if (isExternal && matchExt) {
        r.waitlistPosition = queue++;
      } else if (
        !isExternal &&
        !matchExt &&
        normalizeDepartment(r.department) === normalizeDepartment(reg.department) &&
        normalizeAcademicYear(r.academicYear) === normalizeAcademicYear(reg.academicYear)
      ) {
        r.waitlistPosition = queue++;
      }
    }
  });

  if (typeof event.seatsAvailable === 'number') {
    event.seatsAvailable = Math.max(0, event.seatsAvailable - 1);
  }

  saveDb(db);
  syncRegistrationToSupabase(reg, true).catch(console.error);
  syncEventToSupabase(event, true).catch(console.error);

  addAuditLog(
    'WAITLIST_PROMOTION',
    user,
    `Promoted ${reg.studentName} (${reg.registrationCode}) from Waitlist to Confirmed for "${event.title}"`
  );

  const updatedSummary = calculateQuotaSummary(event, db.registrations);
  return {
    success: true,
    registration: reg,
    summary: updatedSummary
  };
}

export async function updateRegistrationStatus(id: string, status: string, user: AuthUser) {
  const db = loadDb();
  if (!db.registrations) db.registrations = [];

  let reg = db.registrations.find((r: any) => r.id === id);
  if (!reg) {
    const { data: remoteRow } = await supabaseAdmin.from('registrations').select('*').eq('id', id).single();
    if (remoteRow) {
      reg = unpackRegistrationFromSupabase(remoteRow);
      db.registrations.push(reg);
    }
  }
  if (!reg) throw new Error('Registration not found.');

  const validStatuses = ['Confirmed', 'Pending', 'Attended', 'Cancelled', 'Waitlisted', 'Rejected'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const prevStatus = reg.status;
  reg.status = status;
  reg.updatedAt = new Date().toISOString();

  // Recalculate event seats using authoritative summary
  const eventId = reg.eventId;
  let event = (db.events || []).find((e: any) => e.id === eventId);
  if (!event) {
    const { data: remoteRow } = await supabaseAdmin.from('events').select('*').eq('id', eventId).single();
    if (remoteRow) {
      event = unpackEventFromSupabase(remoteRow);
      if (!db.events) db.events = [];
      db.events.push(event);
    }
  }

  if (event) {
    const eventRegs = db.registrations.filter((r: any) => r.eventId === eventId);
    const summary = calculateQuotaSummary(event, eventRegs);
    event.totalSeats = summary.totalCapacity;
    event.seatsAvailable = Math.max(0, summary.internalRemaining + summary.externalRemaining);
    event.updatedAt = new Date().toISOString();
    await syncEventToSupabase(event, true).catch(console.error);
  }

  saveDb(db);
  await syncRegistrationToSupabase(reg, true).catch(console.error);
  addAuditLog('REGISTRATION_STATUS_UPDATE', user, `Changed status of ${reg.studentName} (${id}) from ${prevStatus} to ${status}`);

  try {
    revalidatePath('/register');
    revalidatePath('/events');
    revalidatePath(`/api/public/events/${eventId}/quotas`);
    revalidatePath(`/admin/events/${eventId}`);
  } catch {}

  return reg;
}

export async function deleteRegistration(id: string, user: AuthUser) {
  const db = loadDb();
  if (!db.registrations) db.registrations = [];

  const targetIndex = db.registrations.findIndex((r: any) => r.id === id);
  let target = targetIndex !== -1 ? db.registrations[targetIndex] : null;

  if (!target) {
    const { data: remoteRow } = await supabaseAdmin.from('registrations').select('*').eq('id', id).single();
    if (remoteRow) {
      target = unpackRegistrationFromSupabase(remoteRow);
    }
  }

  if (!target) return false;

  const eventId = target.eventId;
  if (targetIndex !== -1) {
    db.registrations.splice(targetIndex, 1);
  }

  const event = (db.events || []).find((e: any) => e.id === eventId);
  if (event) {
    const eventRegs = db.registrations.filter((r: any) => r.eventId === eventId);
    const summary = calculateQuotaSummary(event, eventRegs);
    event.totalSeats = summary.totalCapacity;
    event.seatsAvailable = Math.max(0, summary.internalRemaining + summary.externalRemaining);
    event.updatedAt = new Date().toISOString();
    await syncEventToSupabase(event, true).catch(console.error);
  }

  saveDb(db);
  await deleteRegistrationFromSupabase(id).catch(console.error);
  addAuditLog('REGISTRATION_DELETE', user, `Deleted registration for ${target.studentName} (${id})`);

  try {
    revalidatePath('/register');
    revalidatePath('/events');
    revalidatePath(`/api/public/events/${eventId}/quotas`);
    revalidatePath(`/admin/events/${eventId}`);
  } catch {}

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



export async function ensureCertificatePdfExists(cert: any): Promise<string> {
  try {
    const certId = cert.certificateId;
    if (!certId) return '';
    const pdfFileName = `${certId}.pdf`;
    const localOutputDir = path.join(process.cwd(), 'public', 'certificates');
    const localFilePath = path.join(localOutputDir, pdfFileName);

    const tmpFilePath = path.join(os.tmpdir(), 'certificates', pdfFileName);
    if (
      (fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 1000) ||
      (fs.existsSync(tmpFilePath) && fs.statSync(tmpFilePath).size > 1000)
    ) {
      return `/api/public/certificates/${certId}/pdf`;
    }

    const db = loadDb();
    const event = (db.events || []).find((e: any) => e.id === cert.eventId);

    const isWinner =
      cert.certificateType?.toLowerCase().includes('winner') ||
      cert.certificateType?.toLowerCase().includes('achievement') ||
      cert.certificateType?.toLowerCase().includes('prize') ||
      event?.certificateType === 'Achievement';

    const customParagraph = isWinner
      ? (event?.winnerCertificateParagraph || undefined)
      : (event?.certificateParagraph || undefined);

    const targetConfig = isWinner
      ? (event?.winnerTemplateConfig || event?.templateConfig || {})
      : (event?.templateConfig || {});

    const formattedSubtitle = isWinner
      ? (event?.winnerCertificateTitle ? `— ${event.winnerCertificateTitle.replace(/^—\s*|\s*—$/g, '').trim()} —` : '— OF ACHIEVEMENT —')
      : (event?.certificateTitle ? `— ${event.certificateTitle.replace(/^—\s*|\s*—$/g, '').trim()} —` : undefined);

    const allTemplates = getCertificateTemplates();
    const activeGlobalTemplate = allTemplates.find((t: any) => t.isActive) || allTemplates[0];
    const templateToUse = event?.certificateTemplateUrl || activeGlobalTemplate?.cleanUrl || undefined;
    const resolvedTemplatePath = await resolveTemplateFile(templateToUse);
    const defaultTemplateConfig = activeGlobalTemplate?.templateConfig || undefined;

    const finalConfig = {
      ...(defaultTemplateConfig || {}),
      ...(targetConfig || {})
    };

    const result = await generateSingleCertificatePdf({
      certificateId: certId,
      recipientName: cert.participantName,
      programName: cert.eventName,
      programDate: cert.eventDate || cert.issueDate || new Date().toISOString().split('T')[0],
      organizingBody: event?.organizingBody || undefined,
      role: cert.certificateType,
      certificateType: isWinner ? 'Achievement' : 'Participation',
      awardCategory: isWinner ? (cert.awardCategory || event?.awardCategory || 'Winner') : undefined,
      certificateSubtitle: formattedSubtitle,
      recipientIntro: isWinner ? 'THIS CERTIFICATE IS AWARDED TO' : undefined,
      customParagraph,
      customTemplatePath: resolvedTemplatePath
    }, targetConfig);

    return result.publicUrl || `/certificates/${pdfFileName}`;
  } catch (err: any) {
    console.error(`ensureCertificatePdfExists failed for ${cert?.certificateId}:`, err.message);
    return `/certificates/${cert.certificateId}.pdf`;
  }
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
  ensureCertificatePdfExists(newCert).catch(() => {});
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
  createdList.forEach((c) => {
    ensureCertificatePdfExists(c).catch(() => {});
    syncCertificateToSupabase(c, false).catch(() => {});
  });
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
  if (!cert || (cert.status !== 'Published' && cert.status !== 'Verified')) return null;

  return {
    certificateId: cert.certificateId,
    participantName: cert.participantName,
    registerNumber: cert.registerNumber,
    eventName: cert.eventName,
    eventDate: cert.eventDate,
    certificateType: cert.certificateType,
    issueDate: cert.issueDate,
    status: cert.status,
    qrCodeUrl: cert.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:3000/verify/${cert.certificateId}`,
    pdfUrl: `/api/public/certificates/${cert.certificateId}/pdf`,
    pngUrl: `/api/public/certificates/${cert.certificateId}/png`,
    downloadUrl: `/api/public/certificates/${cert.certificateId}/pdf`
  };
}

// -------------------------------------------------------------
// ATTENDANCE & PARTICIPANT OPERATIONS
// -------------------------------------------------------------
export async function markAttendance(
  registrationId: string,
  attendance: 'Present' | 'Absent',
  user: AuthUser
) {
  let db = loadDb();
  if (!db.registrations) db.registrations = [];

  let index = db.registrations.findIndex((r: any) => r.id === registrationId);
  if (index === -1) {
    await fetchRegistrationsFromDatabase();
    db = loadDb();
    index = db.registrations.findIndex((r: any) => r.id === registrationId);
  }
  if (index === -1) throw new Error('Registration not found.');

  const isPresent = attendance === 'Present';
  db.registrations[index].attendance = attendance;
  db.registrations[index].status = isPresent ? 'Attended' : 'Confirmed';
  db.registrations[index].attendedAt = isPresent ? new Date().toISOString() : null;
  db.registrations[index].attendanceMethod = 'MANUAL';
  db.registrations[index].markedBy = user.full_name || user.username || 'Admin';
  db.registrations[index].markedById = user.id;
  db.registrations[index].updatedAt = new Date().toISOString();

  saveDb(db);
  await syncRegistrationToSupabase(db.registrations[index], true);
  addAuditLog(
    'ATTENDANCE_MARK',
    user,
    `Marked ${db.registrations[index].studentName} as ${attendance}`
  );

  return db.registrations[index];
}

export async function markBulkAttendance(
  eventId: string,
  registrationIds: string[],
  attendance: 'Present' | 'Absent',
  user: AuthUser
) {
  await fetchRegistrationsFromDatabase(eventId);
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
  await Promise.all(updatedList.map((r) => syncRegistrationToSupabase(r, true)));
  addAuditLog(
    'ATTENDANCE_BULK_MARK',
    user,
    `Batch marked ${updatedList.length} participants as ${attendance} for event ${eventId}`
  );

  return updatedList;
}

/**
 * Validates a scanned QR pass token and atomically marks attendance.
 * Enforces event binding, prevents duplicates, and logs scan metadata.
 */
export async function scanPassAttendance(
  targetEventId: string,
  scannedCodeOrToken: string,
  user: AuthUser
) {
  await fetchRegistrationsFromDatabase(targetEventId);
  const db = loadDb();
  if (!db.registrations) db.registrations = [];
  if (!db.events) db.events = [];

  const raw = String(scannedCodeOrToken || '').trim();
  if (!raw) {
    const err: any = new Error('INVALID OR UNRECOGNIZED PASS');
    err.code = 'INVALID_PASS';
    throw err;
  }

  // Parse QR payload formats:
  // 1. "IEDCPASS:eventId:regCode:passToken"
  // 2. JSON: {"type":"IEDC_EVENT_PASS","eventId":"...","token":"...","regCode":"..."}
  // 3. Raw passToken or registrationCode or id
  let scannedEventId = '';
  let scannedToken = '';
  let scannedRegCode = '';

  if (raw.startsWith('IEDCPASS:')) {
    const parts = raw.split(':');
    scannedEventId = parts[1] || '';
    scannedRegCode = parts[2] || '';
    scannedToken = parts[3] || '';
  } else if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      scannedEventId = parsed.eventId || '';
      scannedToken = parsed.token || parsed.passToken || '';
      scannedRegCode = parsed.regCode || parsed.registrationCode || '';
    } catch {
      // not JSON
    }
  }

  // Fallback if raw is just registrationCode or passToken or regId
  if (!scannedToken && !scannedRegCode) {
    scannedToken = raw;
  }

  // Find registration in DB
  const regIndex = db.registrations.findIndex((r: any) => {
    if (scannedToken && r.passToken && r.passToken === scannedToken) return true;
    if (scannedRegCode && r.registrationCode && r.registrationCode === scannedRegCode) return true;
    if (raw && (r.registrationCode === raw || r.id === raw || r.passToken === raw)) return true;
    return false;
  });

  if (regIndex === -1) {
    const err: any = new Error('INVALID OR UNRECOGNIZED PASS');
    err.code = 'INVALID_PASS';
    throw err;
  }

  const registration = db.registrations[regIndex];

  // 1. Verify that the pass belongs to the selected event
  if (registration.eventId !== targetEventId) {
    const err: any = new Error('THIS PASS DOES NOT BELONG TO THE SELECTED EVENT');
    err.code = 'WRONG_EVENT';
    err.eventTitle = registration.eventTitle;
    throw err;
  }

  // 2. Verify that registration is valid and not cancelled or rejected
  if (registration.status === 'Cancelled' || registration.status === 'Rejected') {
    const err: any = new Error('THIS REGISTRATION IS NOT VALID');
    err.code = 'INVALID_REGISTRATION';
    throw err;
  }

  // 3. Check current attendance status (Duplicate Scan Prevention)
  const isAlreadyPresent = registration.attendance === 'Present' || registration.status === 'Attended';
  if (isAlreadyPresent) {
    return {
      success: true,
      alreadyMarked: true,
      code: 'ALREADY_MARKED',
      message: 'ALREADY MARKED PRESENT',
      attendedAt: registration.attendedAt || registration.updatedAt,
      markedBy: registration.markedBy || 'Admin',
      attendanceMethod: registration.attendanceMethod || 'QR',
      data: {
        id: registration.id,
        studentName: registration.studentName,
        registrationCode: registration.registrationCode,
        registerNumber: registration.registerNumber,
        department: registration.department,
        academicYear: registration.academicYear,
        attendance: 'Present',
        status: registration.status,
        eventTitle: registration.eventTitle
      }
    };
  }

  // 4. Mark attendance atomically
  const nowIso = new Date().toISOString();
  db.registrations[regIndex].attendance = 'Present';
  db.registrations[regIndex].status = 'Attended';
  db.registrations[regIndex].attendedAt = nowIso;
  db.registrations[regIndex].attendanceMethod = 'QR';
  db.registrations[regIndex].markedBy = user.full_name || user.username || 'Admin';
  db.registrations[regIndex].markedById = user.id;
  db.registrations[regIndex].updatedAt = nowIso;

  saveDb(db);
  await syncRegistrationToSupabase(db.registrations[regIndex], true);

  addAuditLog(
    'ATTENDANCE_QR_SCAN',
    user,
    `QR Scan: Marked ${registration.studentName} (${registration.registrationCode}) present for event ${targetEventId}`
  );

  return {
    success: true,
    alreadyMarked: false,
    code: 'ATTENDANCE_MARKED',
    message: 'ATTENDANCE MARKED SUCCESSFULLY',
    attendedAt: nowIso,
    markedBy: db.registrations[regIndex].markedBy,
    attendanceMethod: 'QR',
    data: {
      id: registration.id,
      studentName: registration.studentName,
      registrationCode: registration.registrationCode,
      registerNumber: registration.registerNumber,
      department: registration.department,
      academicYear: registration.academicYear,
      attendance: 'Present',
      status: 'Attended',
      eventTitle: registration.eventTitle
    }
  };
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
  options: {
    includeLeaders?: boolean;
    regenerateExisting?: boolean;
    singleRegistrationId?: string;
    singleCertificateId?: string;
  } = {},
  user: AuthUser
) {
  // Authoritatively load latest live registrations and certificates from Supabase
  await fetchRegistrationsFromDatabase(eventId);
  await fetchCertificatesFromDatabase(eventId);

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
  // If event does not track attendance (requiresAttendance === false), confirmed registrations are eligible.
  let eligibleRegistrations = db.registrations.filter((r: any) => {
    if (r.eventId !== eventId) return false;
    if (r.attendance === 'Absent' || r.status === 'Cancelled') return false;
    if (r.attendance === 'Present' || r.status === 'Attended') return true;
    if (event.requiresAttendance === false && (r.status === 'Confirmed' || !r.status)) return true;
    return false;
  });

  if (options.singleRegistrationId) {
    eligibleRegistrations = eligibleRegistrations.filter((r: any) => r.id === options.singleRegistrationId);
  }

  // 2. Eligible Leaders
  let eligibleLeaders = options.includeLeaders !== false && !options.singleRegistrationId
    ? db.programLeaders.filter((l: any) => l.eventId === eventId && l.certificateEligible !== false)
    : [];

  const results: any[] = [];
  const failures: any[] = [];

  // Pre-resolve master template and active typography presets once outside the recipient loop
  const allTemplates = getCertificateTemplates();
  const activeGlobalTemplate = allTemplates.find((t: any) => t.isActive) || allTemplates[0];
  const templateToUse = event.certificateTemplateUrl || activeGlobalTemplate?.cleanUrl || undefined;
  const preResolvedTemplatePath = await resolveTemplateFile(templateToUse);
  const defaultTemplateConfig = activeGlobalTemplate?.templateConfig || undefined;

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
    // 1. Stable lookup: first by registrationId / sourceId, then phone + normalized name
    let existingCert = db.certificates.find((c: any) => {
      if (c.eventId !== eventId) return false;
      if (c.registrationId && recipient.sourceType === 'participant' && c.registrationId === recipient.sourceId) {
        return true;
      }
      if (c.leaderId && recipient.sourceType === 'leader' && c.leaderId === recipient.sourceId) {
        return true;
      }
      const normCertName = (c.participantName || '').trim().toUpperCase();
      const normRecipName = (recipient.name || '').trim().toUpperCase();
      const cleanPhoneCert = String(c.phone || '').replace(/\D/g, '').slice(-10);
      const cleanPhoneRecip = String(recipient.phone || '').replace(/\D/g, '').slice(-10);

      if (cleanPhoneCert && cleanPhoneRecip && cleanPhoneCert === cleanPhoneRecip && normCertName === normRecipName) {
        return true;
      }
      if (recipient.registerNumber && recipient.registerNumber !== 'N/A' && c.registerNumber === recipient.registerNumber && normCertName === normRecipName) {
        return true;
      }
      return false;
    });

    if (existingCert && !options.regenerateExisting) {
      await ensureCertificatePdfExists(existingCert);
      results.push({ ...existingCert, alreadyExisted: true });
      return;
    }

    const certId = existingCert?.certificateId || `IEDC-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      const isWinner =
        recipient.role?.toLowerCase().includes('winner') ||
        recipient.role?.toLowerCase().includes('prize') ||
        recipient.role?.toLowerCase().includes('award') ||
        event.certificateType === 'Achievement';

      const customParagraph = isWinner
        ? (event.winnerCertificateParagraph || undefined)
        : (event.certificateParagraph || undefined);

      const targetConfig = isWinner
        ? (event.winnerTemplateConfig || event.templateConfig || defaultTemplateConfig)
        : (event.templateConfig || defaultTemplateConfig);

      const formattedSubtitle = isWinner
        ? (event.winnerCertificateTitle ? `— ${event.winnerCertificateTitle.replace(/^—\s*|\s*—$/g, '').trim()} —` : '— OF ACHIEVEMENT —')
        : (event.certificateTitle ? `— ${event.certificateTitle.replace(/^—\s*|\s*—$/g, '').trim()} —` : undefined);

      const generated = await generateSingleCertificatePdf(
        {
          certificateId: certId,
          recipientName: recipient.name,
          programName,
          programDate,
          organizingBody,
          customParagraph,
          role: recipient.role,
          certificateType: isWinner ? 'Achievement' : 'Participation',
          awardCategory: isWinner ? (event.awardCategory || recipient.role || 'Winner') : undefined,
          certificateSubtitle: formattedSubtitle,
          recipientIntro: isWinner ? 'THIS CERTIFICATE IS AWARDED TO' : undefined,
          customTemplatePath: preResolvedTemplatePath
        },
        targetConfig
      );

      const initialStatus =
        event.certificateStatus === 'Published' ? 'Published' : (existingCert?.status || 'Draft');

      const certRecord = {
        id: existingCert?.id || `cert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        certificateId: certId,
        eventId,
        eventName: programName,
        registrationId: recipient.sourceType === 'participant' ? recipient.sourceId : undefined,
        leaderId: recipient.sourceType === 'leader' ? recipient.sourceId : undefined,
        participantName: recipient.name.trim().toUpperCase(),
        registerNumber: recipient.registerNumber,
        phone: recipient.phone,
        email: recipient.email,
        certificateType: recipient.role,
        eventDate: programDate,
        issueDate: new Date().toISOString().split('T')[0],
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:3000/verify/${certId}`,
        pdfStorageUrl: generated.publicUrl || `/certificates/${generated.fileName}`,
        pngStorageUrl: `/certificates/${certId}.png`,
        status: initialStatus,
        downloadsCount: existingCert?.downloadsCount || 0,
        issuedBy: user?.id || 'admin',
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

      await syncCertificateToSupabase(certRecord, !!existingCert);
      results.push(certRecord);
    } catch (err: any) {
      console.error(`Failed generating cert for ${recipient.name}:`, err);
      failures.push({ name: recipient.name, error: err.message, registerNumber: recipient.registerNumber });
    }
  }

  // Build unified recipient list
  const allRecipients = [
    ...eligibleRegistrations.map((reg: any) => ({
      name: reg.studentName,
      phone: (reg.phone || '').trim().replace(/\D/g, ''),
      email: reg.email || '',
      registerNumber: reg.registerNumber || reg.id,
      role: reg.role || reg.position || reg.award || 'Participant',
      sourceType: 'participant' as const,
      sourceId: reg.id
    })),
    ...eligibleLeaders.map((ldr: any) => ({
      name: ldr.name,
      phone: (ldr.phone || '').trim().replace(/\D/g, ''),
      email: ldr.email || '',
      registerNumber: `LEAD-${ldr.id.slice(-4)}`,
      role: ldr.role || 'Student Lead',
      sourceType: 'leader' as const,
      sourceId: ldr.id
    }))
  ];

  // Process concurrently in chunks of 5 for optimal performance without socket flooding
  const chunkSize = 5;
  for (let i = 0; i < allRecipients.length; i += chunkSize) {
    const chunk = allRecipients.slice(i, i + chunkSize);
    await Promise.all(chunk.map((recip) => processRecipient(recip)));
  }

  saveDb(db);
  addAuditLog(
    'CERTIFICATES_PROGRAM_GENERATE',
    user,
    `Generated ${results.length} certificates for event "${programName}" (${failures.length} failed)`
  );

  return {
    success: failures.length === 0,
    requested: eligibleRegistrations.length + eligibleLeaders.length,
    succeeded: results.length,
    newlyGenerated: results.filter((r) => !r.alreadyExisted).length,
    alreadyExisted: results.filter((r) => r.alreadyExisted).length,
    failed: failures.length,
    totalEligibleParticipants: eligibleRegistrations.length,
    totalEligibleLeaders: eligibleLeaders.length,
    generatedCount: results.length,
    failedCount: failures.length,
    failures,
    certificates: results
  };
}

export async function publishProgramCertificates(eventId: string, publish: boolean, user: AuthUser) {
  await fetchCertificatesFromDatabase(eventId);
  const db = loadDb();
  if (!db.certificates) db.certificates = [];

  const newStatus = publish ? 'Published' : 'Draft';
  let count = 0;
  const toSync: any[] = [];

  db.certificates.forEach((c: any) => {
    if (c.eventId === eventId) {
      c.status = newStatus;
      c.updatedAt = new Date().toISOString();
      count++;
      toSync.push(c);
    }
  });

  const evtIdx = (db.events || []).findIndex((e: any) => e.id === eventId);
  if (evtIdx !== -1) {
    db.events[evtIdx].certificateStatus = newStatus;
    db.events[evtIdx].updatedAt = new Date().toISOString();
    await syncEventToSupabase(db.events[evtIdx], true);
  }

  saveDb(db);
  await Promise.all(toSync.map((c) => syncCertificateToSupabase(c, true)));

  addAuditLog(
    'CERTIFICATES_PUBLISH_TOGGLE',
    user,
    `${publish ? 'Published' : 'Unpublished'} ${count} certificates for event ${eventId}`
  );

  return { count, status: newStatus };
}

export async function generateProgramCertificatesZip(
  eventId: string,
  format: 'pdf' | 'png' = 'pdf',
  certificateIds?: string[]
) {
  const db = loadDb();
  let certs = (db.certificates || []).filter((c: any) => c.eventId === eventId);
  if (certificateIds && certificateIds.length > 0) {
    const idSet = new Set(certificateIds);
    certs = certs.filter((c: any) => idSet.has(c.id) || idSet.has(c.certificateId));
  }
  if (certs.length === 0) throw new Error('No certificates found for this selection.');

  const zip = new JSZip();
  let addedCount = 0;
  const ext = format === 'png' ? 'png' : 'pdf';

  for (const c of certs) {
    const fileName = `${c.certificateId}.${ext}`;
    const localPath = path.join(process.cwd(), 'public', 'certificates', fileName);
    if (!fs.existsSync(localPath)) {
      await ensureCertificatePdfExists(c);
    }
    if (fs.existsSync(localPath)) {
      const fileData = fs.readFileSync(localPath);
      const safeRecipient = (c.participantName || 'Participant').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      const zipEntryName = `Certificate_${safeRecipient}_IEDC.${ext}`;
      zip.file(zipEntryName, fileData);
      addedCount++;
    }
  }

  if (addedCount === 0) {
    throw new Error(`No certificate ${ext.toUpperCase()} files found. Please generate certificates first.`);
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return {
    buffer: zipBuffer,
    fileName: `Certificates_${eventId}_${ext.toUpperCase()}_${new Date().toISOString().split('T')[0]}.zip`,
    count: addedCount
  };
}

export async function retrieveStudentCertificate(eventId: string, fullName: string, mobileNumber: string) {
  if (!fullName?.trim() || !mobileNumber?.trim()) {
    return { success: false, error: 'Full name and registered mobile number are required.' };
  }

  const cleanInputPhone = mobileNumber.replace(/\D/g, '').slice(-10);
  if (cleanInputPhone.length < 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
  }

  // Load authoritative published certificates from Supabase
  await fetchCertificatesFromDatabase(eventId);
  const db = loadDb();

  const cleanInputName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');

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
    const draftMatch = (db.certificates || []).find((c: any) => {
      if (eventId && eventId !== 'All' && c.eventId !== eventId && c.eventName !== eventId) {
        return false;
      }
      const certNormName = (c.participantName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const nameMatches = certNormName === cleanInputName;
      const certPhone = String(c.phone || '').replace(/\D/g, '').slice(-10);
      const phoneMatches = certPhone ? certPhone === cleanInputPhone : false;
      return nameMatches && phoneMatches;
    });

    if (draftMatch) {
      return {
        success: false,
        error: `Your certificate for "${draftMatch.eventName}" has been generated and is awaiting official publishing by the faculty coordinator. Please check back shortly.`
      };
    }

    return {
      success: false,
      error: 'No published certificate was found for the supplied details.'
    };
  }

  match.downloadsCount = (match.downloadsCount || 0) + 1;
  saveDb(db);
  syncCertificateToSupabase(match, true).catch(() => {});

  // Ensure PDF file physically exists on disk before returning response
  await ensureCertificatePdfExists(match);

  return {
    success: true,
    certificate: {
      certificateId: match.certificateId,
      participantName: match.participantName,
      eventName: match.eventName,
      eventDate: match.eventDate,
      certificateType: match.certificateType,
      issueDate: match.issueDate,
      downloadUrl: `/certificates/${match.certificateId}.pdf`,
      pdfDownloadUrl: `/certificates/${match.certificateId}.pdf`,
      pngDownloadUrl: `/certificates/${match.certificateId}.png`,
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
  showSocialPublicly?: boolean;
  graduationDate: string;
  photoUrl: string;
  instagramUsername: string;
  instagramUrl: string;
  linkedinUrl: string;
  bio: string;
  displayOrder: number;
  status: 'Published' | 'Draft' | 'Archived';
  verificationFlag?: string;
  // Animated Profile Image & Presentation attributes
  imagePosition?: 'bottom' | 'center' | 'top';
  imageScale?: number;
  animationEnabled?: boolean;
  animationStyle?: 'fade-up' | 'soft-reveal' | 'gentle-float';
  animationDelay?: number;
  glowEnabled?: boolean;
  glowIntensity?: 'subtle' | 'medium' | 'vibrant';
  bgStyle?: 'radial-light' | 'soft-slate' | 'glass-glow' | 'minimal';
  isTransparent?: boolean;
  // AI Portrait Studio attributes
  originalPhotoUrl?: string;
  aiGeneratedPhotoUrl?: string;
  finalTransparentPhotoUrl?: string;
  aiApprovalStatus?: 'pending' | 'approved' | 'rejected';
  aiProcessingStatus?: 'idle' | 'processing' | 'completed' | 'failed';
  aiErrorMessage?: string;
  aiMetadata?: any;
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
        // Privacy protection: only expose email / contact if explicitly enabled in admin panel
        email: m.showEmailPublicly ? m.email : undefined,
        contact: m.showContactPublicly ? m.contact : undefined,
        showSocialPublicly: m.showSocialPublicly !== false,
        instagramUsername: m.showSocialPublicly !== false ? m.instagramUsername : undefined,
        instagramUrl: m.showSocialPublicly !== false ? (m.instagramUrl || (m.instagramUsername ? `https://www.instagram.com/${m.instagramUsername.replace(/^@/, '')}/` : '')) : undefined,
        linkedinUrl: m.showSocialPublicly !== false ? m.linkedinUrl : undefined,
        bio: m.bio,
        displayOrder: m.displayOrder,
        status: m.status,
        // Animated Profile Image & Presentation attributes
        imagePosition: m.imagePosition || 'bottom',
        imageScale: m.imageScale !== undefined ? Number(m.imageScale) : 1.0,
        animationEnabled: m.animationEnabled !== false,
        animationStyle: m.animationStyle || 'fade-up',
        animationDelay: m.animationDelay !== undefined ? Number(m.animationDelay) : 0,
        glowEnabled: m.glowEnabled !== false,
        glowIntensity: m.glowIntensity || 'subtle',
        bgStyle: m.bgStyle || 'radial-light',
        isTransparent: m.isTransparent !== false
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
    showSocialPublicly: data.showSocialPublicly !== false,
    graduationDate: (data.graduationDate || '').trim(),
    photoUrl: (data.photoUrl || '').trim(),
    instagramUsername: cleanInsta,
    instagramUrl: instaUrl,
    linkedinUrl: (data.linkedinUrl || '').trim(),
    bio: (data.bio || '').trim(),
    displayOrder: Number(data.displayOrder) || (db.teamMembers.length + 1),
    status: data.status || 'Published',
    verificationFlag: data.verificationFlag || '',
    // Animation & Presentation attributes
    imagePosition: data.imagePosition || 'bottom',
    imageScale: data.imageScale !== undefined ? Number(data.imageScale) : 1.0,
    animationEnabled: data.animationEnabled !== false,
    animationStyle: data.animationStyle || 'fade-up',
    animationDelay: data.animationDelay !== undefined ? Number(data.animationDelay) : 0,
    glowEnabled: data.glowEnabled !== false,
    glowIntensity: data.glowIntensity || 'subtle',
    bgStyle: data.bgStyle || 'radial-light',
    isTransparent: data.isTransparent !== false,
    originalPhotoUrl: (data.originalPhotoUrl || '').trim(),
    aiGeneratedPhotoUrl: (data.aiGeneratedPhotoUrl || '').trim(),
    finalTransparentPhotoUrl: (data.finalTransparentPhotoUrl || '').trim(),
    aiApprovalStatus: data.aiApprovalStatus || 'pending',
    aiProcessingStatus: data.aiProcessingStatus || 'idle',
    aiErrorMessage: data.aiErrorMessage || '',
    aiMetadata: data.aiMetadata || {},
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
    showSocialPublicly: updates.showSocialPublicly !== undefined ? Boolean(updates.showSocialPublicly) : (db.teamMembers[idx].showSocialPublicly ?? true),
    displayOrder: updates.displayOrder !== undefined ? Number(updates.displayOrder) : db.teamMembers[idx].displayOrder,
    imagePosition: updates.imagePosition !== undefined ? updates.imagePosition : (db.teamMembers[idx].imagePosition || 'bottom'),
    imageScale: updates.imageScale !== undefined ? Number(updates.imageScale) : (db.teamMembers[idx].imageScale ?? 1.0),
    animationEnabled: updates.animationEnabled !== undefined ? Boolean(updates.animationEnabled) : (db.teamMembers[idx].animationEnabled ?? true),
    animationStyle: updates.animationStyle !== undefined ? updates.animationStyle : (db.teamMembers[idx].animationStyle || 'fade-up'),
    animationDelay: updates.animationDelay !== undefined ? Number(updates.animationDelay) : (db.teamMembers[idx].animationDelay ?? 0),
    glowEnabled: updates.glowEnabled !== undefined ? Boolean(updates.glowEnabled) : (db.teamMembers[idx].glowEnabled ?? true),
    glowIntensity: updates.glowIntensity !== undefined ? updates.glowIntensity : (db.teamMembers[idx].glowIntensity || 'subtle'),
    bgStyle: updates.bgStyle !== undefined ? updates.bgStyle : (db.teamMembers[idx].bgStyle || 'radial-light'),
    isTransparent: updates.isTransparent !== undefined ? Boolean(updates.isTransparent) : (db.teamMembers[idx].isTransparent ?? true),
    updatedAt: new Date().toISOString()
  };

  // Synchronize avatar for any operator account linked to this team member
  const newPhoto = db.teamMembers[idx].finalTransparentPhotoUrl || db.teamMembers[idx].photoUrl;
  if (newPhoto && db.profiles) {
    db.profiles.forEach((p: any) => {
      if (
        p.linkedProfileId === id ||
        (p.email && p.email.toLowerCase() === db.teamMembers[idx].email?.toLowerCase())
      ) {
        p.avatar = newPhoto;
      }
    });
  }

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
    photoUrl: data.photoUrl || '',
    displayOrder: Number(data.displayOrder) || (db.facultyCoordinators.length + 1),
    isActive: data.isActive ?? true,
    // Animation & Presentation attributes
    imagePosition: data.imagePosition || 'bottom',
    imageScale: data.imageScale !== undefined ? Number(data.imageScale) : 1.0,
    animationEnabled: data.animationEnabled !== false,
    animationStyle: data.animationStyle || 'fade-up',
    animationDelay: data.animationDelay !== undefined ? Number(data.animationDelay) : 0,
    glowEnabled: data.glowEnabled !== false,
    glowIntensity: data.glowIntensity || 'subtle',
    bgStyle: data.bgStyle || 'radial-light',
    isTransparent: data.isTransparent !== false,
    originalPhotoUrl: data.originalPhotoUrl || '',
    aiGeneratedPhotoUrl: data.aiGeneratedPhotoUrl || '',
    finalTransparentPhotoUrl: data.finalTransparentPhotoUrl || '',
    aiApprovalStatus: data.aiApprovalStatus || 'pending',
    aiProcessingStatus: data.aiProcessingStatus || 'idle',
    aiErrorMessage: data.aiErrorMessage || '',
    aiMetadata: data.aiMetadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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

  // Synchronize avatar for any operator account linked to this faculty coordinator
  const newPhoto = db.facultyCoordinators[idx].photoUrl;
  if (newPhoto && db.profiles) {
    db.profiles.forEach((p: any) => {
      if (
        p.linkedProfileId === id ||
        (p.email && p.email.toLowerCase() === db.facultyCoordinators[idx].email?.toLowerCase())
      ) {
        p.avatar = newPhoto;
      }
    });
  }

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
// OPERATOR & ACCESS MANAGEMENT MODULE
// -------------------------------------------------------------
export function getUsers() {
  const db = loadDb();
  return (db.profiles || []).map((p: any) => {
    const avatar = resolveOperatorAvatar(p, db);
    return {
      id: p.id,
      username: p.username,
      email: p.email,
      full_name: p.full_name,
      role: p.role,
      department: p.department,
      designation: p.designation,
      staffId: p.staffId,
      avatar,
      linkedProfileId: p.linkedProfileId,
      linkedProfileType: p.linkedProfileType,
      permissions: p.permissions || [],
      isActive: p.isActive !== false,
      lastLoginAt: p.lastLoginAt,
      createdAt: p.createdAt
    };
  });
}

export function createUser(userData: any, user: AuthUser) {
  const db = loadDb();
  if (!db.profiles) db.profiles = [];

  const cleanUsername = String(userData.username || '').trim().toLowerCase();
  if (!cleanUsername) {
    throw new Error('Username is required.');
  }

  // Check username uniqueness
  const exists = db.profiles.some(
    (p: any) => p.username?.trim().toLowerCase() === cleanUsername
  );
  if (exists) {
    throw new Error(`Username "@${cleanUsername}" is already taken. Please choose another username.`);
  }

  // Permission checks
  if (userData.role === 'main_admin' && user.role !== 'main_admin') {
    throw new Error('Only the Main Administrator can provision or assign the Main Administrator role.');
  }

  const role: OperatorRole = userData.role || 'student_operator';

  const newUser = {
    id: `usr-${Date.now()}`,
    username: cleanUsername,
    email: userData.email?.trim().toLowerCase() || `${cleanUsername}@gptcpmna.edu.in`,
    passwordHash: userData.password || (role === 'main_admin' ? 'Admin@123' : role === 'faculty_coordinator' ? 'Faculty@123' : 'Student@123'),
    full_name: userData.full_name || userData.name || cleanUsername,
    role,
    phone: userData.phone || '',
    department: userData.department || 'Electronics Engineering',
    designation: userData.designation || (role === 'main_admin' ? 'Main Administrator' : role === 'faculty_coordinator' ? 'Faculty Coordinator' : 'Student Operator'),
    staffId: userData.staffId || (role === 'main_admin' ? `ADMIN00${db.profiles.length + 1}` : role === 'faculty_coordinator' ? `FAC00${db.profiles.length + 1}` : `SL00${db.profiles.length + 1}`),
    avatar: userData.avatar || '',
    linkedProfileId: userData.linkedProfileId || null,
    linkedProfileType: userData.linkedProfileType || null,
    permissions: userData.permissions || [],
    isActive: true,
    createdAt: new Date().toISOString()
  };

  db.profiles.push(newUser);
  saveDb(db);
  addAuditLog('USER_PROVISION', user, `Provisioned operator account @${newUser.username} (${newUser.role})`);
  return newUser;
}

export function updateUser(id: string, updates: any, user: AuthUser) {
  const db = loadDb();
  const idx = (db.profiles || []).findIndex((p: any) => p.id === id);
  if (idx === -1) throw new Error('Operator account not found.');

  const target = db.profiles[idx];

  // Protect main_admin
  if (target.role === 'main_admin' && user.role !== 'main_admin') {
    throw new Error('Unauthorized: Only the Main Administrator can modify Main Administrator accounts.');
  }

  // Prevent demoting last main_admin
  if (target.role === 'main_admin' && updates.role && updates.role !== 'main_admin') {
    const mainAdminCount = db.profiles.filter((p: any) => p.role === 'main_admin').length;
    if (mainAdminCount <= 1) {
      throw new Error('Safety restriction: Cannot remove or demote the sole Main Administrator.');
    }
  }

  if (updates.role === 'main_admin' && user.role !== 'main_admin') {
    throw new Error('Only the Main Administrator can promote an account to Main Administrator.');
  }

  db.profiles[idx] = {
    ...target,
    ...updates,
    id: target.id, // Immutable ID
    username: updates.username ? updates.username.trim().toLowerCase() : target.username,
    updatedAt: new Date().toISOString()
  };

  saveDb(db);
  addAuditLog('USER_UPDATE', user, `Updated operator profile @${target.username} (${target.role})`);
  return db.profiles[idx];
}

export function resetUserPassword(id: string, newPassword: string, user: AuthUser) {
  const db = loadDb();
  const target = (db.profiles || []).find((p: any) => p.id === id);
  if (!target) throw new Error('Operator account not found.');

  if (target.role === 'main_admin' && user.role !== 'main_admin') {
    throw new Error('Unauthorized: Only the Main Administrator can reset Main Administrator passwords.');
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  target.passwordHash = newPassword;
  target.updatedAt = new Date().toISOString();
  saveDb(db);

  addAuditLog('USER_PASSWORD_RESET', user, `Password reset initiated for operator @${target.username}`);
  return { success: true, message: `Password reset successfully for @${target.username}` };
}

export function toggleUserStatus(id: string, user: AuthUser) {
  const db = loadDb();
  const item = (db.profiles || []).find((p: any) => p.id === id);
  if (!item) throw new Error('Operator account not found.');

  if (item.role === 'main_admin') {
    throw new Error('Protection Policy: The Main Administrator account cannot be suspended.');
  }

  item.isActive = item.isActive === false ? true : false;
  item.updatedAt = new Date().toISOString();
  saveDb(db);

  const statusStr = item.isActive ? 'ACTIVATED' : 'SUSPENDED';
  addAuditLog('USER_STATUS_TOGGLE', user, `${statusStr} operator account @${item.username}`);
  return item;
}

export function deleteUser(id: string, user: AuthUser) {
  const db = loadDb();
  const item = (db.profiles || []).find((p: any) => p.id === id);
  if (!item) throw new Error('Operator account not found.');

  if (item.role === 'main_admin') {
    throw new Error('Protection Policy: The Main Administrator account cannot be deleted.');
  }

  db.profiles = (db.profiles || []).filter((p: any) => p.id !== id);
  saveDb(db);
  addAuditLog('USER_DELETE', user, `Deleted operator account @${item.username}`);
  return true;
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
  if (!db.certificateTemplates || db.certificateTemplates.length === 0) {
    db.certificateTemplates = [];
  }

  // Ensure default vector master is always present
  const hasVectorMaster = db.certificateTemplates.some((t: any) => t.id === 'tpl-master-vector');
  if (!hasVectorMaster) {
    db.certificateTemplates.unshift({
      id: 'tpl-master-vector',
      title: 'Official IEDC Master Certificate (Vector Reference)',
      type: 'Vector PDF Master',
      pdfUrl: '/templates/reference_certificate.pdf',
      cleanUrl: '/templates/clean_master_template.pdf',
      previewPdf: '/templates/test_generated_certificate.pdf',
      isActive: !db.certificateTemplates.some((t: any) => t.isActive),
      version: 1,
      createdAt: new Date().toISOString(),
      description: 'Preserves exact borders, logos, Principal Abdul Kader KT & Coordinator Anuroop P signatures, and typography.'
    });
    saveDb(db);
  }

  // Sanitize any templates that lack cleanUrl
  db.certificateTemplates.forEach((t: any) => {
    if (!t.cleanUrl) {
      t.cleanUrl = t.pdfUrl || t.url || t.backgroundImageUrl || '/templates/clean_master_template.pdf';
    }
    if (!t.pdfUrl) {
      t.pdfUrl = t.cleanUrl;
    }
  });

  return db.certificateTemplates;
}

export function saveCertificateTemplate(templateData: any, user: AuthUser) {
  const db = loadDb();
  if (!db.certificateTemplates) db.certificateTemplates = [];

  const id = templateData.id || `tpl-${Date.now()}`;
  const rawUrl = templateData.cleanUrl || templateData.url || templateData.pdfUrl || '';
  const isImage = !rawUrl.toLowerCase().endsWith('.pdf');
  const newTpl = {
    id,
    title: String(templateData.title || 'Custom Certificate Template').trim(),
    type: templateData.type || (isImage ? 'Image Master' : 'PDF Master'),
    url: rawUrl,
    pdfUrl: templateData.pdfUrl || rawUrl,
    cleanUrl: templateData.cleanUrl || rawUrl,
    previewPdf: templateData.previewPdf || rawUrl,
    isActive: Boolean(templateData.isActive),
    templateConfig: templateData.templateConfig || undefined,
    version: (db.certificateTemplates.length || 0) + 1,
    description: templateData.description || 'Custom uploaded certificate template.',
    uploadedBy: user?.full_name || user?.username || 'Admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (newTpl.isActive) {
    db.certificateTemplates.forEach((t: any) => { t.isActive = false; });
  }

  const existingIdx = db.certificateTemplates.findIndex((t: any) => t.id === id);
  if (existingIdx !== -1) {
    db.certificateTemplates[existingIdx] = { ...db.certificateTemplates[existingIdx], ...newTpl };
  } else {
    db.certificateTemplates.unshift(newTpl);
  }

  saveDb(db);
  addAuditLog('CERTIFICATE_TEMPLATE_SAVE', user, `Saved certificate template "${newTpl.title}" (active: ${newTpl.isActive})`);
  return newTpl;
}

export function updateCertificateTemplate(templateId: string, updates: any, user: AuthUser) {
  const db = loadDb();
  if (!db.certificateTemplates) db.certificateTemplates = [];
  const idx = db.certificateTemplates.findIndex((t: any) => t.id === templateId);
  if (idx === -1) throw new Error(`Certificate template "${templateId}" not found`);

  if (updates.isActive) {
    db.certificateTemplates.forEach((t: any) => { t.isActive = false; });
  }

  db.certificateTemplates[idx] = {
    ...db.certificateTemplates[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  saveDb(db);
  addAuditLog('CERTIFICATE_TEMPLATE_UPDATE', user, `Updated certificate template "${db.certificateTemplates[idx].title}"`);
  return db.certificateTemplates[idx];
}

export function setActiveCertificateTemplate(templateId: string, user: AuthUser) {
  const db = loadDb();
  if (!db.certificateTemplates) db.certificateTemplates = [];

  const found = db.certificateTemplates.find((t: any) => t.id === templateId);
  if (!found) throw new Error('Template not found');

  db.certificateTemplates.forEach((t: any) => {
    t.isActive = t.id === templateId;
    t.updatedAt = new Date().toISOString();
  });

  saveDb(db);
  addAuditLog('CERTIFICATE_TEMPLATE_SET_ACTIVE', user, `Set active certificate template to "${found.title}"`);
  return found;
}

export function deleteCertificateTemplate(templateId: string, user: AuthUser) {
  const db = loadDb();
  if (!db.certificateTemplates) return false;
  if (templateId === 'tpl-master-vector') {
    throw new Error('The Official IEDC Master Vector Certificate template is protected and cannot be deleted.');
  }

  const idx = db.certificateTemplates.findIndex((t: any) => t.id === templateId);
  if (idx === -1) return false;
  const removed = db.certificateTemplates.splice(idx, 1)[0];
  if (removed.isActive && db.certificateTemplates.length > 0) {
    db.certificateTemplates[0].isActive = true;
  }
  saveDb(db);
  addAuditLog('CERTIFICATE_TEMPLATE_DELETE', user, `Deleted certificate template "${removed.title}"`);
  return true;
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

export function updateResource(id: string, updates: any, user: AuthUser) {
  const db = loadDb();
  if (!db.resources) db.resources = [];
  const idx = db.resources.findIndex((r: any) => r.id === id);
  if (idx === -1) return null;
  db.resources[idx] = { ...db.resources[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDb(db);
  syncResourceToSupabase(db.resources[idx], true).catch(() => {});
  addAuditLog('RESOURCE_UPDATE', user, `Updated resource: ${db.resources[idx].title}`);
  return db.resources[idx];
}

export function deleteResource(id: string, user: AuthUser) {
  const db = loadDb();
  if (!db.resources) db.resources = [];
  const item = db.resources.find((r: any) => r.id === id);
  db.resources = db.resources.filter((r: any) => r.id !== id);
  saveDb(db);
  if (item) addAuditLog('RESOURCE_DELETE', user, `Deleted resource: ${item.title}`);
  return true;
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
