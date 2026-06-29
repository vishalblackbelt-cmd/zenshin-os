import type {
  AuditLog,
  Branch,
  LedgerEntry,
  Student,
  SystemSettings,
  TimelineEvent,
  TrialLead,
} from './types';

export const INITIAL_SETTINGS: SystemSettings = {
  maxGracePeriod: 10,
  reactivationCharge: 1000
};

export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_TRIALS: TrialLead[] = [];
export const INITIAL_LEDGER: LedgerEntry[] = [];
export const INITIAL_AUDIT: AuditLog[] = [];
export const INITIAL_TIMELINE: TimelineEvent[] = [];

export const DEFAULT_BRANCHES: Branch[] = ['Sirifort', 'Asiad'];

export const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:4000').replace(/\/$/, '');