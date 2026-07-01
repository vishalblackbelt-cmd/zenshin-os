import type { Dispatch, SetStateAction } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { saveToStorage } from '../storage';
import type {
  AttendanceSubmissionInput,
  Branch,
  CreateLedgerEntryInput,
  CreateStudentInput,
  CreateTrialInput,
  LoginCredentials,
  Role,
  SystemSettings,
  TrialStatus,
  UserAccountInput,
  UserSession,
} from '../types';
import { mapSession } from './mappers';

export interface WebApiClient {
  login(credentials: LoginCredentials): Promise<UserSession>;
  listStudents(): Promise<any[]>;
  getStudent(studentId: string): Promise<any>;
  deleteStudent(studentId: string): Promise<void>;
  suspendStudent(studentId: string): Promise<void>;
  createStudent(input: CreateStudentInput): Promise<void>;
  listTrials(): Promise<any[]>;
  createTrial(input: CreateTrialInput): Promise<void>;
  updateTrialStatus(trialId: string, status: TrialStatus): Promise<void>;
  listLedger(): Promise<any[]>;
  createLedgerEntry(input: CreateLedgerEntryInput): Promise<any>;
  getReceipt(ledgerEntryId: string): Promise<any>;
  getSettings(): Promise<SystemSettings>;
  updateSettings(input: SystemSettings): Promise<void>;
  submitAttendance(input: AttendanceSubmissionInput): Promise<void>;
  triggerCron(): Promise<{ results: { suspensions: number; friendlyReminders: number; overdueReminders: number } }>;
  listAuditLogs(): Promise<any[]>;
  listManagedUsers(): Promise<any[]>;
  listAvailableRoles(): Promise<Role[]>;
  listAvailableBranches(): Promise<Branch[]>;
  createUser(input: UserAccountInput): Promise<any>;
  updateUser(userId: string, input: UserAccountInput): Promise<any>;
  deleteUser(userId: string): Promise<void>;
  resetUserPassword(userId: string, password: string): Promise<void>;
}

interface UseApiClientOptions {
  currentSession: UserSession | null;
  setCurrentSession: Dispatch<SetStateAction<UserSession | null>>;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: unknown; message?: unknown } | undefined;

    if (typeof data?.error === 'string' && data.error.trim()) {
      return data.error;
    }

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function useApiClient({ currentSession, setCurrentSession }: UseApiClientOptions): WebApiClient {
  const refreshAccessToken = async (): Promise<string> => {
    if (!currentSession?.refreshToken) {
      throw new Error('Session expired. Please sign in again.');
    }

    try {
      const { data } = await axios.post<{ accessToken: string }>(
        '/api/auth/refresh',
        { refreshToken: currentSession.refreshToken },
        {
          baseURL: API_BASE_URL,
          headers: { Accept: 'application/json' },
        }
      );

      const nextSession = { ...currentSession, accessToken: data.accessToken };
      setCurrentSession(nextSession);
      saveToStorage('zenshin-session', nextSession);

      return data.accessToken;
    } catch (error) {
      setCurrentSession(null);
      saveToStorage('zenshin-session', null);
      throw new Error(getApiErrorMessage(error, 'Session refresh failed.'));
    }
  };

  const request = async <T,>(
    path: string,
    config?: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; data?: unknown },
    allowRetry = true
  ): Promise<T> => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (currentSession?.accessToken) {
      headers.Authorization = `Bearer ${currentSession.accessToken}`;
    }

    try {
      const response = await axios.request<T>({
        baseURL: API_BASE_URL,
        url: path,
        method: config?.method ?? 'GET',
        data: config?.data,
        headers,
      });

      return response.data;
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;

      if ((status === 401 || status === 403) && allowRetry && currentSession?.refreshToken) {
        const nextAccessToken = await refreshAccessToken();
        const retryHeaders: Record<string, string> = {
          ...headers,
          Authorization: `Bearer ${nextAccessToken}`,
        };

        try {
          const retryResponse = await axios.request<T>({
            baseURL: API_BASE_URL,
            url: path,
            method: config?.method ?? 'GET',
            data: config?.data,
            headers: retryHeaders,
          });

          return retryResponse.data;
        } catch (retryError) {
          throw new Error(getApiErrorMessage(retryError, 'Request failed.'));
        }
      }

      throw new Error(getApiErrorMessage(error, 'Request failed.'));
    }
  };

  return {
    async login(credentials) {
      try {
        const { data } = await axios.post('/api/auth/login', credentials, {
          baseURL: API_BASE_URL,
          headers: { Accept: 'application/json' },
        });

        return mapSession(data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Login failed.'));
      }
    },
    listStudents: () => request<any[]>('/api/students'),
    getStudent: (studentId) => request<any>(`/api/students/${studentId}`),
    deleteStudent: (studentId) => request<void>(`/api/students/${studentId}`, { method: 'DELETE' }),
    suspendStudent: (studentId) => request<void>(`/api/students/${studentId}/suspend`, { method: 'POST' }),
    createStudent: (input) => request<void>('/api/students', { method: 'POST', data: input }),
    listTrials: () => request<any[]>('/api/trials'),
    createTrial: (input) => request<void>('/api/trials', { method: 'POST', data: input }),
    updateTrialStatus: (trialId, status) => request<void>(`/api/trials/${trialId}/status`, { method: 'PUT', data: { status } }),
    listLedger: () => request<any[]>('/api/billing/ledger'),
    createLedgerEntry: (input) => request<any>('/api/billing/ledger', { method: 'POST', data: input }),
    getReceipt: (ledgerEntryId) => request<any>(`/api/billing/ledger/${ledgerEntryId}/receipt`),
    getSettings: () => request<SystemSettings>('/api/billing/settings'),
    updateSettings: (input) => request<void>('/api/billing/settings', { method: 'PUT', data: input }),
    submitAttendance: (input) => request<void>('/api/attendance', { method: 'POST', data: input }),
    triggerCron: () => request<{ results: { suspensions: number; friendlyReminders: number; overdueReminders: number } }>('/api/cron/trigger', { method: 'POST' }),
    listAuditLogs: () => request<any[]>('/api/audit'),
    listManagedUsers: () => request<any[]>('/api/users'),
    listAvailableRoles: () => request<Role[]>('/api/users/meta/roles'),
    listAvailableBranches: () => request<Branch[]>('/api/users/meta/branches'),
    createUser: (input) => request<any>('/api/users', { method: 'POST', data: input }),
    updateUser: (userId, input) => request<any>(`/api/users/${userId}`, { method: 'PUT', data: input }),
    deleteUser: (userId) => request<void>(`/api/users/${userId}`, { method: 'DELETE' }),
    resetUserPassword: (userId, password) => request<void>(`/api/users/${userId}/reset-password`, { method: 'POST', data: { password } }),
  };
}