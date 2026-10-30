import {
  COLLEGE_DEPARTMENTS,
  COLLEGE_ACADEMIC_YEARS,
  CollegeDepartment,
  CollegeAcademicYear,
  ProgramParticipationType,
  ProgramQuotaConfig,
  ClassQuotaItem,
  ClassQuotaStat,
  ExternalQuotaStat,
  EventQuotaSummary,
  ReallocationAuditEntry
} from '@/types/quotas';

export function getClassKey(dept: string, yr: string): string {
  const normDept = normalizeDepartment(dept);
  const normYr = normalizeAcademicYear(yr);
  return `${normDept}__${normYr}`;
}

export function parseClassKey(key: string): { department: string; academicYear: string } {
  const [dept, yr] = key.split('__');
  return {
    department: dept || 'General',
    academicYear: yr || 'First Year'
  };
}

export function normalizeAcademicYear(yr?: string): CollegeAcademicYear {
  if (!yr) return 'First Year';
  const clean = yr.toLowerCase().trim();
  if (clean.includes('1') || clean.includes('first')) return 'First Year';
  if (clean.includes('2') || clean.includes('second')) return 'Second Year';
  if (clean.includes('3') || clean.includes('third')) return 'Third Year';
  return 'First Year';
}

export function normalizeDepartment(dept?: string): string {
  if (!dept) return 'Electronics Engineering';
  const clean = dept.toLowerCase().trim();

  // 1. Electrical and Electronics Engineering (EEE) - Must check first before Electronics because EEE contains "electronics"
  if (clean.includes('electrical') || clean.includes('eee') || clean === 'ee') {
    return 'Electrical and Electronics Engineering';
  }

  // 2. Electronics Engineering (EC)
  if (clean.includes('electron') || clean === 'ec' || clean === 'ece') {
    return 'Electronics Engineering';
  }

  // 3. Civil Engineering
  if (clean.includes('civil') || clean === 'ce') {
    return 'Civil Engineering';
  }

  // 4. Mechanical Engineering
  if (clean.includes('mech') || clean === 'me') {
    return 'Mechanical Engineering';
  }

  // Exact match against official college departments
  const exact = COLLEGE_DEPARTMENTS.find((d) => d.toLowerCase() === clean);
  if (exact) return exact;

  return dept.trim();
}

export function isInternalParticipant(reg: {
  participationCategory?: string;
  collegeName?: string;
}): boolean {
  if (reg.participationCategory === 'External') return false;
  if (reg.participationCategory === 'Internal') return true;
  const col = (reg.collegeName || '').toLowerCase().trim();
  if (!col) return true;
  return col.includes('perinthalmanna') || col.includes('pmna');
}

export function isExternalParticipant(reg: {
  participationCategory?: string;
  collegeName?: string;
}): boolean {
  return !isInternalParticipant(reg);
}

export function createDefaultQuotaConfig(
  totalSeats = 60,
  level = 'College',
  defaultType?: ProgramParticipationType
): ProgramQuotaConfig {
  const isStatewide = level?.toLowerCase().includes('state') || defaultType === 'Statewide';
  const participationType: ProgramParticipationType =
    defaultType || (isStatewide ? 'Statewide' : 'Entire College');

  const classes: Record<string, ClassQuotaItem> = {};
  const perClassDefault = Math.max(1, Math.floor(totalSeats / 12));

  for (const dept of COLLEGE_DEPARTMENTS) {
    for (const yr of COLLEGE_ACADEMIC_YEARS) {
      const key = `${dept}__${yr}`;
      classes[key] = {
        department: dept,
        academicYear: yr,
        enabled: true,
        maxSeats: perClassDefault
      };
    }
  }

  return {
    participationType,
    singleClass: {
      department: 'Mechanical Engineering',
      academicYear: 'Second Year',
      maxSeats: 25
    },
    classes,
    externalQuota: {
      enabled: isStatewide,
      maxSeats: isStatewide ? 30 : 0
    },
    waitlistEnabled: true,
    reallocationLogs: []
  };
}

export function reconcileQuotaConfigToCapacity(
  existingConfig: ProgramQuotaConfig | undefined | null,
  totalSeats: number,
  level = 'College'
): ProgramQuotaConfig {
  const safeTotal = Math.max(1, Number(totalSeats) || 24);
  if (!existingConfig) {
    return createDefaultQuotaConfig(safeTotal, level);
  }

  const isStatewide = existingConfig.participationType === 'Statewide' || level?.toLowerCase().includes('state');
  const participationType: ProgramParticipationType =
    existingConfig.participationType || (isStatewide ? 'Statewide' : 'Entire College');

  if (participationType === 'Single Class') {
    return {
      ...existingConfig,
      participationType: 'Single Class',
      singleClass: {
        department: existingConfig.singleClass?.department || 'Civil Engineering',
        academicYear: existingConfig.singleClass?.academicYear || 'Second Year',
        maxSeats: safeTotal
      }
    };
  }

  let externalSeats = 0;
  let internalSeats = safeTotal;
  if (isStatewide && existingConfig.externalQuota?.enabled) {
    const rawExt = Number(existingConfig.externalQuota.maxSeats) || 0;
    externalSeats = Math.min(rawExt, Math.max(1, Math.floor(safeTotal / 2)));
    internalSeats = Math.max(1, safeTotal - externalSeats);
  }

  const enabledKeys: string[] = [];
  const classes: Record<string, ClassQuotaItem> = {};

  for (const dept of COLLEGE_DEPARTMENTS) {
    for (const yr of COLLEGE_ACADEMIC_YEARS) {
      const key = `${dept}__${yr}`;
      const prevItem = existingConfig.classes?.[key];
      const isEnabled = prevItem ? prevItem.enabled : true;
      if (isEnabled) enabledKeys.push(key);
      classes[key] = {
        department: dept,
        academicYear: yr,
        enabled: isEnabled,
        maxSeats: 1
      };
    }
  }

  const count = enabledKeys.length || 12;
  const basePerClass = Math.max(1, Math.floor(internalSeats / count));
  let allocated = 0;

  for (let i = 0; i < enabledKeys.length; i++) {
    const k = enabledKeys[i];
    const seats = i === enabledKeys.length - 1 ? Math.max(1, internalSeats - allocated) : basePerClass;
    classes[k].maxSeats = seats;
    allocated += seats;
  }

  return {
    ...existingConfig,
    participationType,
    classes,
    externalQuota: {
      enabled: isStatewide,
      maxSeats: externalSeats
    },
    waitlistEnabled: existingConfig.waitlistEnabled !== false,
    reallocationLogs: existingConfig.reallocationLogs || []
  };
}

export function calculateQuotaSummary(
  event: any,
  registrations: any[]
): EventQuotaSummary {
  const rawConfig: ProgramQuotaConfig =
    event.quotaConfig || createDefaultQuotaConfig(event.totalSeats, event.level);

  const eventRegs = (registrations || []).filter(
    (r: any) => r.eventId === event.id && r.status !== 'Cancelled' && r.status !== 'Rejected'
  );

  const classesSummary: Record<string, ClassQuotaStat> = {};
  let totalInternalSeats = 0;
  let internalConfirmed = 0;
  let totalWaitlist = 0;

  // Process all configured official college departments (strictly excluding non-existent departments)
  const allDepts = Array.from(
    new Set([
      ...COLLEGE_DEPARTMENTS,
      ...Object.keys(rawConfig.classes || {})
        .map((k) => parseClassKey(k).department)
        .filter((d) => Boolean(d) && !d.toLowerCase().includes('computer'))
    ])
  );

  for (const dept of allDepts) {
    for (const yr of COLLEGE_ACADEMIC_YEARS) {
      const key = `${dept}__${yr}`;
      const conf = rawConfig.classes?.[key] || {
        department: dept,
        academicYear: yr,
        enabled: true,
        maxSeats: 5
      };

      // In Single Class mode, only the selected class is enabled
      const isActuallyEnabled =
        rawConfig.participationType === 'Single Class'
          ? normalizeDepartment(rawConfig.singleClass?.department) === dept &&
            normalizeAcademicYear(rawConfig.singleClass?.academicYear) === yr
          : conf.enabled;

      const maxSeats =
        rawConfig.participationType === 'Single Class' && isActuallyEnabled
          ? Number(rawConfig.singleClass?.maxSeats) || 0
          : isActuallyEnabled
          ? Number(conf.maxSeats) || 0
          : 0;

      // Filter registrations for this class (Internal participants only)
      const classRegs = eventRegs.filter((r: any) => {
        if (!isInternalParticipant(r)) return false;

        const rDept = normalizeDepartment(r.department);
        const rYr = normalizeAcademicYear(r.academicYear);
        return rDept === dept && rYr === yr;
      });

      const confirmedList = classRegs.filter(
        (r: any) => r.status === 'Confirmed' || r.status === 'Attended' || r.status === 'Registered'
      );
      const waitlistList = classRegs.filter((r: any) => r.status === 'Waitlisted');
      const attendedList = classRegs.filter((r: any) => r.status === 'Attended');

      const confirmedCount = confirmedList.length;
      const waitlistCount = waitlistList.length;
      const attendedCount = attendedList.length;
      const remainingSeats = Math.max(0, maxSeats - confirmedCount);

      let status: ClassQuotaStat['status'] = 'OPEN';
      if (!isActuallyEnabled || maxSeats === 0) {
        status = 'DISABLED';
      } else if (remainingSeats <= 0) {
        status = rawConfig.waitlistEnabled ? 'WAITLIST_AVAILABLE' : 'FULL';
      } else if (remainingSeats <= 2) {
        status = 'LIMITED';
      }

      totalInternalSeats += maxSeats;
      internalConfirmed += confirmedCount;
      totalWaitlist += waitlistCount;

      classesSummary[key] = {
        key,
        department: dept,
        academicYear: yr,
        enabled: isActuallyEnabled,
        maxSeats,
        confirmedCount,
        attendedCount,
        remainingSeats,
        waitlistCount,
        status,
        isWarning: isActuallyEnabled && maxSeats < confirmedCount
      };
    }
  }

  // Process External Quota (Statewide or when enabled)
  const isStatewide = rawConfig.participationType === 'Statewide';
  const extConfig = rawConfig.externalQuota || { enabled: isStatewide, maxSeats: 30 };
  const extEnabled = isStatewide && extConfig.enabled;
  const extMaxSeats = extEnabled ? Number(extConfig.maxSeats) || 0 : 0;

  const externalRegs = eventRegs.filter((r: any) => isExternalParticipant(r));

  const extConfirmedList = externalRegs.filter(
    (r: any) => r.status === 'Confirmed' || r.status === 'Attended' || r.status === 'Registered'
  );
  const extWaitlistList = externalRegs.filter((r: any) => r.status === 'Waitlisted');
  const extConfirmed = extConfirmedList.length;
  const extWaitlist = extWaitlistList.length;
  const extRemaining = Math.max(0, extMaxSeats - extConfirmed);
  totalWaitlist += extWaitlist;

  let extStatus: ExternalQuotaStat['status'] = 'OPEN';
  if (!extEnabled || extMaxSeats === 0) {
    extStatus = 'DISABLED';
  } else if (extRemaining <= 0) {
    extStatus = rawConfig.waitlistEnabled ? 'WAITLIST_AVAILABLE' : 'FULL';
  } else if (extRemaining <= 5) {
    extStatus = 'LIMITED';
  }

  const externalSummary: ExternalQuotaStat = {
    enabled: extEnabled,
    maxSeats: extMaxSeats,
    confirmedCount: extConfirmed,
    remainingSeats: extRemaining,
    waitlistCount: extWaitlist,
    status: extStatus
  };

  // Authoritative total capacity: Preserve admin-configured event.totalSeats (camelCase or snake_case)
  const rawSeats = event.totalSeats !== undefined && event.totalSeats !== null ? event.totalSeats : event.total_seats;
  const totalCapacity = Number(rawSeats) > 0 ? Number(rawSeats) : totalInternalSeats + extMaxSeats;
  const totalConfirmed = internalConfirmed + extConfirmed;
  const remainingOverall = Math.max(0, totalCapacity - totalConfirmed);
  const remainingByQuotas = Math.max(0, (totalInternalSeats - internalConfirmed) + extRemaining);
  const totalRemaining = rawConfig.participationType === 'Statewide' || Object.keys(rawConfig.classes || {}).length > 0
    ? Math.min(remainingOverall, remainingByQuotas)
    : remainingOverall;

  return {
    eventId: event.id,
    participationType: rawConfig.participationType,
    totalInternalSeats,
    internalConfirmed,
    internalRemaining: Math.max(0, totalInternalSeats - internalConfirmed),
    totalExternalSeats: extMaxSeats,
    externalConfirmed: extConfirmed,
    externalRemaining: extRemaining,
    waitlistCount: totalWaitlist,
    totalConfirmed,
    totalCapacity,
    isStatewide,
    classes: classesSummary,
    externalQuota: externalSummary,
    waitlistEnabled: rawConfig.waitlistEnabled !== false
  };
}

export function validateSeatTransfer(
  quotaConfig: ProgramQuotaConfig,
  registrations: any[],
  sourceKey: string,
  destKey: string,
  seatsToTransfer: number
): { valid: boolean; error?: string; availableToTransfer?: number } {
  if (sourceKey === destKey) {
    return { valid: false, error: 'Source and destination classes must be different.' };
  }
  if (!seatsToTransfer || seatsToTransfer <= 0 || !Number.isInteger(seatsToTransfer)) {
    return { valid: false, error: 'Number of seats to transfer must be a positive integer.' };
  }

  const isSourceExternal = sourceKey === 'External';
  const isDestExternal = destKey === 'External';

  if ((isSourceExternal || isDestExternal) && !quotaConfig.autoReallocation?.allowCrossCategory) {
    // If transferring between internal and external without explicit allowCrossCategory, check participation type
    if (quotaConfig.participationType !== 'Statewide' && (isSourceExternal || isDestExternal)) {
      return { valid: false, error: 'External quota transfers are only allowed for Statewide programs.' };
    }
  }

  let sourceAllocated = 0;
  let sourceConfirmed = 0;

  if (isSourceExternal) {
    sourceAllocated = Number(quotaConfig.externalQuota?.maxSeats) || 0;
    sourceConfirmed = registrations.filter(
      (r: any) =>
        r.status !== 'Cancelled' &&
        r.status !== 'Waitlisted' &&
        r.status !== 'Rejected' &&
        (r.participationCategory === 'External' ||
          (r.collegeName && !r.collegeName.toLowerCase().includes('perinthalmanna')))
    ).length;
  } else {
    const srcConf = quotaConfig.classes?.[sourceKey];
    if (!srcConf) {
      return { valid: false, error: `Source class ${sourceKey} not found in configuration.` };
    }
    sourceAllocated = Number(srcConf.maxSeats) || 0;
    const { department, academicYear } = parseClassKey(sourceKey);
    sourceConfirmed = registrations.filter(
      (r: any) =>
        r.status !== 'Cancelled' &&
        r.status !== 'Waitlisted' &&
        r.status !== 'Rejected' &&
        r.participationCategory !== 'External' &&
        normalizeDepartment(r.department) === department &&
        normalizeAcademicYear(r.academicYear) === academicYear
    ).length;
  }

  const availableToTransfer = Math.max(0, sourceAllocated - sourceConfirmed);

  if (seatsToTransfer > availableToTransfer) {
    return {
      valid: false,
      error: `Cannot transfer ${seatsToTransfer} seats. Only ${availableToTransfer} unused seats are available (Allocated: ${sourceAllocated}, Confirmed: ${sourceConfirmed}). Reducing below confirmed registrations is strictly prohibited.`,
      availableToTransfer
    };
  }

  return { valid: true, availableToTransfer };
}

/**
 * Normalizes personal name to UPPERCASE while trimming excess spaces.
 * Strictly for student/participant/leader/recipient names.
 */
export function normalizePersonalName(name?: string): string {
  if (!name) return '';
  return name.trim().toUpperCase();
}

/**
 * Calculates the exact registration closing deadline for an event in Asia/Kolkata timezone (+05:30).
 * Rule:
 * 1. If administrator explicitly configured registrationClosingDate, use that.
 * 2. Otherwise, automatically close at 11:00 AM IST on the event/program date.
 */
export function getEventRegistrationDeadline(event: any): Date | null {
  if (!event) return null;

  // 1. Explicitly configured registration closing date/time
  if (event.registrationClosingDate) {
    const explicit = new Date(event.registrationClosingDate);
    if (!isNaN(explicit.getTime())) {
      return explicit;
    }
  }

  // 2. Default: 11:00 AM IST on event date
  if (event.date) {
    const match = String(event.date).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [_, y, m, d] = match;
      // 11:00 AM Indian Standard Time (UTC+05:30)
      return new Date(`${y}-${m}-${d}T11:00:00+05:30`);
    }
    const parsedDate = new Date(event.date);
    if (!isNaN(parsedDate.getTime())) {
      const istString = parsedDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const match2 = istString.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match2) {
        const [_, y, m, d] = match2;
        return new Date(`${y}-${m}-${d}T11:00:00+05:30`);
      }
    }
  }

  return null;
}

/**
 * Evaluates the live registration status of an event:
 * - Start date check
 * - 11:00 AM IST event date cutoff (or explicit closing date)
 * - registrationOpen flag
 * - status === 'Published'
 */
export function getEventRegistrationStatus(event: any, now: Date = new Date()): {
  isOpen: boolean;
  statusText: string;
  reason?: string;
  deadline: Date | null;
  deadlineFormatted: string;
} {
  if (!event) {
    return {
      isOpen: false,
      statusText: 'Event Not Found',
      reason: 'Event does not exist',
      deadline: null,
      deadlineFormatted: ''
    };
  }

  const deadline = getEventRegistrationDeadline(event);
  const deadlineFormatted = deadline
    ? deadline.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : '';

  if (event.status && event.status !== 'Published') {
    return {
      isOpen: false,
      statusText: 'Unpublished',
      reason: `Event is currently ${event.status}`,
      deadline,
      deadlineFormatted
    };
  }

  if (event.registrationOpen === false) {
    return {
      isOpen: false,
      statusText: 'Registration Closed',
      reason: 'Registration has been closed by administration',
      deadline,
      deadlineFormatted
    };
  }

  if (event.registrationStartDate) {
    const start = new Date(event.registrationStartDate);
    if (!isNaN(start.getTime()) && now < start) {
      const startFormatted = start.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return {
        isOpen: false,
        statusText: 'Opens Soon',
        reason: `Registration opens on ${startFormatted}`,
        deadline,
        deadlineFormatted
      };
    }
  }

  if (deadline && now >= deadline) {
    return {
      isOpen: false,
      statusText: 'Registration Closed',
      reason: `Registration closed at ${deadlineFormatted} (11:00 AM IST cutoff)`,
      deadline,
      deadlineFormatted
    };
  }

  if (typeof event.seatsAvailable === 'number' && event.seatsAvailable <= 0) {
    return {
      isOpen: false,
      statusText: 'Housefull',
      reason: 'All allocated seats have been filled',
      deadline,
      deadlineFormatted
    };
  }

  return {
    isOpen: true,
    statusText: 'Registration Open',
    reason: deadline ? `Closes on ${deadlineFormatted}` : 'Open',
    deadline,
    deadlineFormatted
  };
}
