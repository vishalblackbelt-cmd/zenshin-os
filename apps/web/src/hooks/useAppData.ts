import { useEffect, useState } from 'react';
import {
  DEFAULT_BRANCHES,
  INITIAL_AUDIT,
  INITIAL_LEDGER,
  INITIAL_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_TIMELINE,
  INITIAL_TRIALS,
} from '../constants';
import type {
  AuditLog,
  Branch,
  LedgerEntry,
  ManagedUser,
  Role,
  Student,
  SystemSettings,
  TimelineEvent,
  TrialLead,
  UserSession,
} from '../types';
import type { WebApiClient } from '../api/client';
import {
  mapAuditLog,
  mapLedgerEntry,
  mapManagedUser,
  mapStudent,
  mapTimelineEvent,
  mapTrial,
} from '../api/mappers';

interface UseAppDataOptions {
  apiClient: WebApiClient;
  currentSession: UserSession | null;
}

export function useAppData({ apiClient, currentSession }: UseAppDataOptions) {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [trials, setTrials] = useState<TrialLead[]>(INITIAL_TRIALS);
  const [ledger, setLedger] = useState<LedgerEntry[]>(INITIAL_LEDGER);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(INITIAL_TIMELINE);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>(DEFAULT_BRANCHES);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const resetAppData = () => {
    setStudents(INITIAL_STUDENTS);
    setTrials(INITIAL_TRIALS);
    setLedger(INITIAL_LEDGER);
    setAuditLogs(INITIAL_AUDIT);
    setTimeline(INITIAL_TIMELINE);
    setSettings(INITIAL_SETTINGS);
    setManagedUsers([]);
    setAvailableBranches(DEFAULT_BRANCHES);
    setAvailableRoles([]);
    setSelectedStudent(null);
  };

  const loadAppData = async () => {
    if (!currentSession) {
      resetAppData();
      return;
    }

    const [studentsPayload, ledgerPayload, settingsPayload] = await Promise.all([
      apiClient.listStudents(),
      apiClient.listLedger(),
      apiClient.getSettings(),
    ]);

    setStudents(studentsPayload.map(mapStudent));
    setLedger(ledgerPayload.map(mapLedgerEntry));
    setSettings(settingsPayload);

    if (currentSession.role === 'OWNER' || currentSession.role === 'MANAGER') {
      const [trialsPayload, auditPayload, usersPayload, rolesPayload, branchesPayload] = await Promise.all([
        apiClient.listTrials(),
        apiClient.listAuditLogs(),
        apiClient.listManagedUsers(),
        apiClient.listAvailableRoles(),
        apiClient.listAvailableBranches(),
      ]);

      setTrials(trialsPayload.map(mapTrial));
      setAuditLogs(auditPayload.map(mapAuditLog));
      setManagedUsers(usersPayload.map(mapManagedUser));
      setAvailableRoles(rolesPayload);
      setAvailableBranches(branchesPayload.length > 0 ? branchesPayload : DEFAULT_BRANCHES);
      return;
    }

    setTrials(INITIAL_TRIALS);
    setAuditLogs(INITIAL_AUDIT);
    setManagedUsers([]);
    setAvailableRoles([]);
  };

  const openStudentDetail = async (studentId: string) => {
    const studentPayload = await apiClient.getStudent(studentId);
    setSelectedStudent(mapStudent(studentPayload));
    setTimeline((studentPayload.timelineEvents || []).map(mapTimelineEvent));
  };

  useEffect(() => {
    void loadAppData();
  }, [currentSession?.id]);

  return {
    students,
    trials,
    ledger,
    auditLogs,
    timeline,
    settings,
    managedUsers,
    availableBranches,
    availableRoles,
    selectedStudent,
    setSelectedStudent,
    setAuditLogs,
    setTimeline,
    resetAppData,
    loadAppData,
    openStudentDetail,
  };
}