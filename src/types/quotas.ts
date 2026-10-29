export const COLLEGE_DEPARTMENTS = [
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical and Electronics Engineering',
  'Electronics Engineering'
] as const;

export const COLLEGE_ACADEMIC_YEARS = [
  'First Year',
  'Second Year',
  'Third Year'
] as const;

export type CollegeDepartment = typeof COLLEGE_DEPARTMENTS[number];
export type CollegeAcademicYear = typeof COLLEGE_ACADEMIC_YEARS[number];

export type ProgramParticipationType =
  | 'Single Class'
  | 'Selected Classes'
  | 'Entire College'
  | 'Statewide'
  | 'Custom Allocation';

export interface ClassQuotaItem {
  department: string;
  academicYear: string;
  enabled: boolean;
  maxSeats: number;
}

export interface ExternalQuotaConfig {
  enabled: boolean;
  maxSeats: number;
}

export interface ReallocationAuditEntry {
  id: string;
  timestamp: string;
  sourceClass: string; // e.g., "Mechanical Engineering__Third Year" or "External"
  destinationClass: string; // e.g., "Electronics Engineering__First Year" or "External"
  seatsTransferred: number;
  previousSourceQuota: number;
  newSourceQuota: number;
  previousDestQuota: number;
  newDestQuota: number;
  reason?: string;
  adminUser?: string;
}

export interface AutoReallocationConfig {
  enabled: boolean;
  releaseAt?: string;
  targetMode?: 'waitlist_order' | 'proportional';
  allowCrossCategory?: boolean;
}

export interface ProgramQuotaConfig {
  participationType: ProgramParticipationType;
  singleClass?: {
    department: string;
    academicYear: string;
    maxSeats: number;
  };
  classes: Record<string, ClassQuotaItem>; // Key: `${department}__${academicYear}`
  externalQuota: ExternalQuotaConfig;
  waitlistEnabled: boolean;
  autoReallocation?: AutoReallocationConfig;
  reallocationLogs: ReallocationAuditEntry[];
  registrationStartDate?: string;
  registrationClosingDate?: string;
  classClosingDates?: Record<string, string>;
  externalClosingDate?: string;
}

export interface ClassQuotaStat {
  key: string;
  department: string;
  academicYear: string;
  enabled: boolean;
  maxSeats: number;
  confirmedCount: number;
  attendedCount: number;
  remainingSeats: number;
  waitlistCount: number;
  status: 'OPEN' | 'LIMITED' | 'FULL' | 'DISABLED' | 'WAITLIST_AVAILABLE';
  isWarning: boolean;
}

export interface ExternalQuotaStat {
  enabled: boolean;
  maxSeats: number;
  confirmedCount: number;
  remainingSeats: number;
  waitlistCount: number;
  status: 'OPEN' | 'LIMITED' | 'FULL' | 'DISABLED' | 'WAITLIST_AVAILABLE';
}

export interface EventQuotaSummary {
  eventId: string;
  participationType: ProgramParticipationType;
  totalInternalSeats: number;
  internalConfirmed: number;
  internalRemaining: number;
  totalExternalSeats: number;
  externalConfirmed: number;
  externalRemaining: number;
  waitlistCount: number;
  totalConfirmed: number;
  totalCapacity: number;
  isStatewide: boolean;
  classes: Record<string, ClassQuotaStat>;
  externalQuota: ExternalQuotaStat;
  waitlistEnabled: boolean;
}
