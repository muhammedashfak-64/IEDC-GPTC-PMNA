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

  // Computer Engineering / Science
  if (clean.includes('comp') || clean.includes('cs') || clean === 'cse' || clean === 'ct') {
    return 'Computer Engineering';
  }
  // Electronics
  if (clean.includes('electron') || clean === 'ec' || clean === 'ece') {
    return 'Electronics Engineering';
  }
  // Electrical / EEE
  if (clean.includes('electr') || clean === 'eee' || clean === 'ee') {
    return 'Electrical and Electronics Engineering';
  }
  // Civil
  if (clean.includes('civil') || clean === 'ce') {
    return 'Civil Engineering';
  }
  // Mechanical
  if (clean.includes('mech') || clean === 'me') {
    return 'Mechanical Engineering';
  }

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

  // Process all configured departments
  const allDepts = Array.from(
    new Set([
      ...COLLEGE_DEPARTMENTS,
      ...Object.keys(rawConfig.classes || {})
        .map((k) => parseClassKey(k).department)
        .filter(Boolean)
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
        (r: any) => r.status === 'Confirmed' || r.status === 'Attended'
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
    (r: any) => r.status === 'Confirmed' || r.status === 'Attended'
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

  const totalCapacity = totalInternalSeats + extMaxSeats;
  const totalConfirmed = internalConfirmed + extConfirmed;

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
