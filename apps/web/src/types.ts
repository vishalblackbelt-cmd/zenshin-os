export type Role = 'OWNER' | 'MANAGER' | 'INSTRUCTOR' | 'PARENT' | 'STUDENT';
export type Branch = 'Sirifort' | 'Asiad';
export type TrialStatus = 'NEW' | 'PAID' | 'TRIAL_COMPLETED' | 'JOINED' | 'LOST';
export type StudentStatus = 'ACTIVE' | 'INACTIVE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';
export type ThemeMode = 'dark' | 'red';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
  branch: Branch | null;
  accessToken: string;
  refreshToken: string;
}

export interface Student {
  id: string;
  name: string;
  age: number;
  category: string;
  parentName: string;
  mobile: string;
  branch: Branch;
  joiningDate: string;
  currentBelt: string;
  status: StudentStatus;
  feeDueDate: string;
  examEligible: boolean;
  outstandingBalance: number;
  attendanceRate: number;
}

export interface TrialLead {
  id: string;
  name: string;
  mobile: string;
  branch: Branch;
  status: TrialStatus;
  paidAmount: number;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  studentId: string;
  studentName: string;
  type: 'CHARGE' | 'PAYMENT';
  amount: number;
  description: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: Role;
  action: string;
  details: string;
  branch: Branch | 'GLOBAL';
}

export interface TimelineEvent {
  id: string;
  studentId: string;
  date: string;
  type: string;
  description: string;
}

export interface SystemSettings {
  maxGracePeriod: number;
  reactivationCharge: number;
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  branch: Branch | null;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserFormState {
  name: string;
  email: string;
  password: string;
  role: Role;
  branch: Branch;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateStudentInput {
  name: string;
  age: number;
  category: string;
  parentName: string;
  mobile: string;
  branchName: Branch;
  currentBelt: string;
  feeDueDate: string;
}

export interface CreateTrialInput {
  name: string;
  mobile: string;
  branchName: Branch;
  payMandatory: 'yes' | 'no';
}

export interface CreateLedgerEntryInput {
  studentId: string;
  type: 'CHARGE' | 'PAYMENT';
  amount: number;
  description: string;
}

export interface AttendanceRecordInput {
  studentId: string;
  status: AttendanceStatus;
}

export interface AttendanceSubmissionInput {
  date: string;
  batch: string;
  records: AttendanceRecordInput[];
}

export interface UserAccountInput {
  name: string;
  email: string;
  role: Role;
  branchName: Branch | null;
  password?: string;
}

export interface DashboardStats {
  total: number;
  active: number;
  inactive: number;
  examEligible: number;
  trialRev: number;
  monthlyFees: number;
  pendingFees: number;
  paidTrials: number;
  avgAttendance: number;
  feesDueThisWeek: number;
  overdueCount: number;
}

export type AppTab = 'dashboard' | 'students' | 'attendance' | 'trials' | 'billing' | 'users' | 'audit';

export interface NavigationTabConfig {
  id: AppTab;
  label: string;
  privileged?: boolean;
}