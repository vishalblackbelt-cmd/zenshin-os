import { mapManagedUser, mapReceipt } from '../api/mappers';
import type { WebApiClient } from '../api/client';
import type {
  AttendanceSubmissionInput,
  CreateLedgerEntryInput,
  CreateStudentInput,
  CreateTrialInput,
  LedgerEntry,
  ManagedUser,
  Student,
  SystemSettings,
  TrialStatus,
  UserAccountInput,
  UserSession,
} from '../types';

interface UseAppMutationsOptions {
  apiClient: WebApiClient;
  currentSession: UserSession | null;
  setCurrentSession: (session: UserSession | null | ((previous: UserSession | null) => UserSession | null)) => void;
  ledger: LedgerEntry[];
  loadAppData: () => Promise<void>;
  openStudentDetail: (studentId: string) => Promise<void>;
  setSelectedStudent: (student: Student | null) => void;
}

export function useAppMutations({
  apiClient,
  currentSession,
  setCurrentSession,
  ledger,
  loadAppData,
  openStudentDetail,
  setSelectedStudent,
}: UseAppMutationsOptions) {
  const runCronJobSimulation = async () => {
    const result = await apiClient.triggerCron();
    await loadAppData();
    return result.results;
  };

  const addStudent = async (input: CreateStudentInput) => {
    await apiClient.createStudent(input);
    await loadAppData();
  };

  const addTrial = async (input: CreateTrialInput) => {
    await apiClient.createTrial(input);
    await loadAppData();
  };

  const updateTrialStatus = async (trialId: string, status: TrialStatus) => {
    await apiClient.updateTrialStatus(trialId, status);
    await loadAppData();
  };

  const deleteStudent = async (student: Student) => {
    await apiClient.deleteStudent(student.id);
    await loadAppData();
    setSelectedStudent(null);
  };

  const suspendStudent = async (student: Student) => {
    await apiClient.suspendStudent(student.id);
    await loadAppData();
    await openStudentDetail(student.id);
  };

  const createLedgerEntry = async (input: CreateLedgerEntryInput) => {
    const entry = await apiClient.createLedgerEntry(input);
    await loadAppData();

    if (input.type !== 'PAYMENT') {
      return null;
    }

    const receipt = await apiClient.getReceipt(entry.id);
    return mapReceipt(receipt);
  };

  const fetchLatestReceipt = async () => {
    const latestPayment = [...ledger].reverse().find((item) => item.type === 'PAYMENT');

    if (!latestPayment) {
      throw new Error('No payment receipt is available yet.');
    }

    const receipt = await apiClient.getReceipt(latestPayment.id);
    return mapReceipt(receipt);
  };

  const submitAttendance = async (input: AttendanceSubmissionInput) => {
    await apiClient.submitAttendance(input);
    await loadAppData();
  };

  const updateSettings = async (nextSettings: SystemSettings) => {
    await apiClient.updateSettings(nextSettings);
    await loadAppData();
  };

  const saveUser = async (mode: 'create' | 'edit', editingUserId: string | null, input: UserAccountInput): Promise<ManagedUser> => {
    const payload = mode === 'create'
      ? await apiClient.createUser(input)
      : await apiClient.updateUser(editingUserId!, input);

    const user = mapManagedUser(payload);

    if (currentSession && user.id === currentSession.id) {
      setCurrentSession({
        ...currentSession,
        email: user.email,
        name: user.name,
        role: user.role,
        branch: user.branch,
      });
    }

    await loadAppData();
    return user;
  };

  const deleteManagedUser = async (user: ManagedUser) => {
    await apiClient.deleteUser(user.id);
    await loadAppData();
  };

  const resetManagedUserPassword = async (userId: string, password: string) => {
    await apiClient.resetUserPassword(userId, password);
  };

  return {
    runCronJobSimulation,
    addStudent,
    addTrial,
    updateTrialStatus,
    deleteStudent,
    suspendStudent,
    createLedgerEntry,
    fetchLatestReceipt,
    submitAttendance,
    updateSettings,
    saveUser,
    deleteManagedUser,
    resetManagedUserPassword,
  };
}