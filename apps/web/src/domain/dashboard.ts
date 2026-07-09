import type { Branch, DashboardStats, Student, TrialLead, UserSession } from '../types';

interface CalculateDashboardStatsInput {
  activeBranch: Branch;
  currentSession: UserSession;
  students: Student[];
  trials: TrialLead[];
}

export function calculateDashboardStats({
  activeBranch,
  currentSession,
  students,
  trials,
}: CalculateDashboardStatsInput): DashboardStats {
  const scopedBranch = currentSession.role === 'MANAGER' && currentSession.branch
    ? currentSession.branch
    : activeBranch;

  const targetStudents = students.filter((student) => student.branch === scopedBranch);
  const targetTrials = trials.filter((trial) => trial.branch === scopedBranch);
  const total = targetStudents.length;
  const active = targetStudents.filter((student) => student.status === 'ACTIVE').length;
  const inactive = targetStudents.filter((student) => student.status === 'INACTIVE').length;
  const examEligible = targetStudents.filter((student) => student.examEligible && student.status === 'ACTIVE').length;
  const trialRev = targetTrials.filter((trial) => trial.status === 'PAID' || trial.status === 'JOINED').length * 500;
  const monthlyFees = targetStudents.length * 3600;
  const pendingFees = targetStudents.reduce((sum, student) => sum + student.outstandingBalance, 0);
  const paidTrials = targetTrials.filter((trial) => trial.status === 'PAID').length;
  const avgAttendance = targetStudents.length > 0
    ? Math.round(targetStudents.reduce((sum, student) => sum + student.attendanceRate, 0) / targetStudents.length)
    : 0;
  const today = new Date();
  const feesDueThisWeek = targetStudents.filter((student) => {
    if (student.status !== 'ACTIVE') {
      return false;
    }

    const dueDate = new Date(student.feeDueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && student.outstandingBalance > 0;
  }).length;
  const overdueCount = targetStudents.filter((student) => {
    const dueDate = new Date(student.feeDueDate);
    return dueDate < today && student.outstandingBalance > 0 && student.status === 'ACTIVE';
  }).length;

  return {
    total,
    active,
    inactive,
    examEligible,
    trialRev,
    monthlyFees,
    pendingFees,
    paidTrials,
    avgAttendance,
    feesDueThisWeek,
    overdueCount,
  };
}