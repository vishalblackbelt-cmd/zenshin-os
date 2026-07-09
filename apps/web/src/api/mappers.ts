import type {
  AuditLog,
  Branch,
  LedgerEntry,
  ManagedUser,
  Student,
  TimelineEvent,
  TrialLead,
  UserSession,
} from '../types';

export function formatDate(value: string | Date): string {
  return new Date(value).toISOString().split('T')[0];
}

export function formatTimestamp(value: string | Date): string {
  return new Date(value).toISOString().replace('T', ' ').substring(0, 19);
}

export function mapSession(payload: any): UserSession {
  return {
    id: payload.user.id,
    email: payload.user.email,
    name: payload.user.name,
    role: payload.user.role,
    branch: payload.user.branch,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  };
}

export function mapStudent(student: any): Student {
  return {
    id: student.id,
    name: student.name,
    age: student.age,
    category: student.category,
    parentName: student.parentName,
    mobile: student.mobile,
    branch: (student.branch?.name ?? student.branch) as Branch,
    joiningDate: formatDate(student.joiningDate),
    currentBelt: student.currentBelt,
    status: student.status,
    feeDueDate: formatDate(student.feeDueDate),
    examEligible: student.examEligible,
    outstandingBalance: student.outstandingBalance,
    attendanceRate: student.attendanceRate,
  };
}

export function mapTrial(trial: any): TrialLead {
  return {
    id: trial.id,
    name: trial.name,
    mobile: trial.mobile,
    branch: (trial.branch?.name ?? trial.branch) as Branch,
    status: trial.status,
    paidAmount: trial.paidAmount,
    createdAt: formatDate(trial.createdAt),
  };
}

export function mapLedgerEntry(entry: any): LedgerEntry {
  return {
    id: entry.id,
    studentId: entry.studentId,
    studentName: entry.student?.name ?? '',
    type: entry.type,
    amount: entry.amount,
    description: entry.description,
    createdAt: formatTimestamp(entry.createdAt),
  };
}

export function mapAuditLog(entry: any): AuditLog {
  return {
    id: entry.id,
    timestamp: formatTimestamp(entry.timestamp),
    actor: entry.actor,
    role: entry.role,
    action: entry.action,
    details: entry.details,
    branch: (entry.branch?.name ?? 'GLOBAL') as AuditLog['branch'],
  };
}

export function mapTimelineEvent(entry: any): TimelineEvent {
  return {
    id: entry.id,
    studentId: entry.studentId,
    date: formatDate(entry.date),
    type: entry.type,
    description: entry.description,
  };
}

export function mapReceipt(receipt: any): LedgerEntry {
  return {
    id: receipt.receiptId,
    studentId: receipt.studentId,
    studentName: receipt.studentName,
    type: 'PAYMENT',
    amount: receipt.amount,
    description: receipt.description,
    createdAt: formatTimestamp(receipt.transactionDate),
  };
}

export function mapManagedUser(user: any): ManagedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    branch: user.branch,
    branchId: user.branchId,
    createdAt: formatTimestamp(user.createdAt),
    updatedAt: formatTimestamp(user.updatedAt),
  };
}