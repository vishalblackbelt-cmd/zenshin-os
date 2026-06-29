import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Activity, 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  Check, 
  Settings, 
  RefreshCw, 
  MessageSquare, 
  UserPlus, 
  Clock, 
  AlertTriangle, 
  Info,
} from 'lucide-react';
import {
  API_BASE_URL,
  DEFAULT_BRANCHES,
  INITIAL_AUDIT,
  INITIAL_LEDGER,
  INITIAL_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_TIMELINE,
  INITIAL_TRIALS,
} from './constants';
import { initializeClientStorage, loadFromStorage, saveToStorage } from './storage';
import { LoginScreen } from './components/LoginScreen';
import { NavigationTabs } from './components/NavigationTabs';
import { Modals } from './components/Modals';
import { ShellHeader } from './components/ShellHeader';
import type {
  AppTab,
  AttendanceStatus,
  AuditLog,
  Branch,
  LedgerEntry,
  ManagedUser,
  Role,
  Student,
  SystemSettings,
  TimelineEvent,
  TrialLead,
  TrialStatus,
  UserFormState,
  UserSession,
} from './types';


initializeClientStorage();

export default function App() {
  const createInitialUserForm = (session: UserSession | null): UserFormState => ({
    name: '',
    email: '',
    password: '',
    role: session?.role === 'MANAGER' ? 'INSTRUCTOR' : 'MANAGER',
    branch: session?.branch ?? DEFAULT_BRANCHES[0]
  });

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'red'>(() => {
    return (localStorage.getItem('zenshin-theme') as 'dark' | 'red') || 'dark';
  });

  // User auth state
  const [currentSession, setCurrentSession] = useState<UserSession | null>(() => {
    return loadFromStorage<UserSession | null>('zenshin-session', null);
  });

  // Login UI states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginPending, setLoginPending] = useState(false);

  // DB States
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [trials, setTrials] = useState<TrialLead[]>(INITIAL_TRIALS);
  const [ledger, setLedger] = useState<LedgerEntry[]>(INITIAL_LEDGER);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(INITIAL_TIMELINE);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>(DEFAULT_BRANCHES);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [userFormMode, setUserFormMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>(() => createInitialUserForm(currentSession));

  // Router simulation
  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard');

  // Filter and UI States
  const [activeBranch, setActiveBranch] = useState<Branch>('Sirifort');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [beltFilter, setBeltFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddTrial, setShowAddTrial] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingStudentId, setBillingStudentId] = useState('');
  const [billingType, setBillingType] = useState<'CHARGE' | 'PAYMENT'>('PAYMENT');
  const [billingAmount, setBillingAmount] = useState(3600);
  const [billingDesc, setBillingDesc] = useState('');
  const [showReceipt, setShowReceipt] = useState<LedgerEntry | null>(null);

  // Quick batch attendance state
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceBatch, setAttendanceBatch] = useState('Kids (5:00 PM)');
  const [batchAttendanceState, setBatchAttendanceState] = useState<Record<string, AttendanceStatus>>({});

  // WhatsApp simulation toast
  const [whatsappToast, setWhatsappToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  useEffect(() => {
    saveToStorage('zenshin-session', currentSession);
  }, [currentSession]);

  useEffect(() => {
    localStorage.setItem('zenshin-theme', theme);
    const body = document.body;
    if (theme === 'red') {
      body.classList.add('theme-red');
    } else {
      body.classList.remove('theme-red');
    }
  }, [theme]);

  // Trigger WhatsApp Simulated Notification
  const triggerWhatsappAlert = (text: string) => {
    setWhatsappToast({ message: text, visible: true });
    setTimeout(() => {
      setWhatsappToast(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  const resetAppData = () => {
    setStudents(INITIAL_STUDENTS);
    setTrials(INITIAL_TRIALS);
    setLedger(INITIAL_LEDGER);
    setAuditLogs(INITIAL_AUDIT);
    setTimeline(INITIAL_TIMELINE);
    setSettings(INITIAL_SETTINGS);
    setManagedUsers([]);
    setAvailableRoles([]);
    setAvailableBranches(DEFAULT_BRANCHES);
    setSelectedStudent(null);
    setShowReceipt(null);
  };

  const formatDate = (value: string | Date) => new Date(value).toISOString().split('T')[0];
  const formatTimestamp = (value: string | Date) => new Date(value).toISOString().replace('T', ' ').substring(0, 19);

  const mapStudent = (student: any): Student => ({
    id: student.id,
    name: student.name,
    age: student.age,
    category: student.category,
    parentName: student.parentName,
    mobile: student.mobile,
    branch: student.branch?.name ?? student.branch,
    joiningDate: formatDate(student.joiningDate),
    currentBelt: student.currentBelt,
    status: student.status,
    feeDueDate: formatDate(student.feeDueDate),
    examEligible: student.examEligible,
    outstandingBalance: student.outstandingBalance,
    attendanceRate: student.attendanceRate
  });

  const mapTrial = (trial: any): TrialLead => ({
    id: trial.id,
    name: trial.name,
    mobile: trial.mobile,
    branch: trial.branch?.name ?? trial.branch,
    status: trial.status,
    paidAmount: trial.paidAmount,
    createdAt: formatDate(trial.createdAt)
  });

  const mapLedgerEntry = (entry: any): LedgerEntry => ({
    id: entry.id,
    studentId: entry.studentId,
    studentName: entry.student?.name ?? '',
    type: entry.type,
    amount: entry.amount,
    description: entry.description,
    createdAt: formatTimestamp(entry.createdAt)
  });

  const mapAuditLog = (entry: any): AuditLog => ({
    id: entry.id,
    timestamp: formatTimestamp(entry.timestamp),
    actor: entry.actor,
    role: entry.role,
    action: entry.action,
    details: entry.details,
    branch: entry.branch?.name ?? 'GLOBAL'
  });

  const mapTimelineEvent = (entry: any): TimelineEvent => ({
    id: entry.id,
    studentId: entry.studentId,
    date: formatDate(entry.date),
    type: entry.type,
    description: entry.description
  });

  const mapReceipt = (receipt: any): LedgerEntry => ({
    id: receipt.receiptId,
    studentId: receipt.studentId,
    studentName: receipt.studentName,
    type: 'PAYMENT',
    amount: receipt.amount,
    description: receipt.description,
    createdAt: formatTimestamp(receipt.transactionDate)
  });

  const mapManagedUser = (user: any): ManagedUser => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    branch: user.branch,
    branchId: user.branchId,
    createdAt: formatTimestamp(user.createdAt),
    updatedAt: formatTimestamp(user.updatedAt)
  });

  const refreshAccessToken = async () => {
    if (!currentSession?.refreshToken) {
      throw new Error('Session expired. Please sign in again.');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: currentSession.refreshToken })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Session refresh failed.');
    }

    const nextSession = currentSession ? { ...currentSession, accessToken: payload.accessToken } : null;
    setCurrentSession(nextSession);
    saveToStorage('zenshin-session', nextSession);

    return payload.accessToken as string;
  };

  const apiRequest = async <T,>(path: string, init?: RequestInit, allowRetry = true): Promise<T> => {
    const headers = new Headers(init?.headers);
    headers.set('Accept', 'application/json');

    if (init?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (currentSession?.accessToken) {
      headers.set('Authorization', `Bearer ${currentSession.accessToken}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers
    });

    const payload = response.status === 204 ? null : await response.json().catch(() => null);

    if ((response.status === 401 || response.status === 403) && allowRetry && currentSession?.refreshToken) {
      const nextAccessToken = await refreshAccessToken();
      const retryHeaders = new Headers(init?.headers);
      retryHeaders.set('Accept', 'application/json');
      if (init?.body && !retryHeaders.has('Content-Type')) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${nextAccessToken}`);

      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: retryHeaders
      });
      const retryPayload = retryResponse.status === 204 ? null : await retryResponse.json().catch(() => null);

      if (!retryResponse.ok) {
        throw new Error(retryPayload?.error || 'Request failed.');
      }

      return retryPayload as T;
    }

    if (!response.ok) {
      throw new Error(payload?.error || 'Request failed.');
    }

    return payload as T;
  };

  const loadAppData = async () => {
    if (!currentSession) {
      resetAppData();
      return;
    }

    try {
      const [studentsPayload, ledgerPayload, settingsPayload] = await Promise.all([
        apiRequest<any[]>('/api/students'),
        apiRequest<any[]>('/api/billing/ledger'),
        apiRequest<SystemSettings>('/api/billing/settings')
      ]);

      setStudents(studentsPayload.map(mapStudent));
      setLedger(ledgerPayload.map(mapLedgerEntry));
      setSettings(settingsPayload);

      if (currentSession.role === 'OWNER' || currentSession.role === 'MANAGER') {
        const [trialsPayload, auditPayload, usersPayload, rolesPayload, branchesPayload] = await Promise.all([
          apiRequest<any[]>('/api/trials'),
          apiRequest<any[]>('/api/audit'),
          apiRequest<any[]>('/api/users'),
          apiRequest<Role[]>('/api/users/meta/roles'),
          apiRequest<Branch[]>('/api/users/meta/branches')
        ]);

        setTrials(trialsPayload.map(mapTrial));
        setAuditLogs(auditPayload.map(mapAuditLog));
        setManagedUsers(usersPayload.map(mapManagedUser));
        setAvailableRoles(rolesPayload);
        setAvailableBranches(branchesPayload.length > 0 ? branchesPayload : DEFAULT_BRANCHES);
      } else {
        setTrials(INITIAL_TRIALS);
        setAuditLogs(INITIAL_AUDIT);
        setManagedUsers([]);
        setAvailableRoles([]);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to load application data.');
    }
  };

  const openStudentDetail = async (studentId: string) => {
    try {
      const studentPayload = await apiRequest<any>(`/api/students/${studentId}`);
      setSelectedStudent(mapStudent(studentPayload));
      setTimeline((studentPayload.timelineEvents || []).map(mapTimelineEvent));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to load student details.');
    }
  };

  const openLatestReceipt = async () => {
    const latestPayment = [...ledger].reverse().find((item) => item.type === 'PAYMENT');

    if (!latestPayment) {
      alert('No payment receipt is available yet.');
      return;
    }

    try {
      const receipt = await apiRequest<any>(`/api/billing/ledger/${latestPayment.id}/receipt`);
      setShowReceipt(mapReceipt(receipt));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to load receipt.');
    }
  };

  const deleteStudent = async (student: Student) => {
    try {
      await apiRequest(`/api/students/${student.id}`, {
        method: 'DELETE'
      });
      await loadAppData();
      setSelectedStudent(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete student.');
    }
  };

  const suspendStudent = async (student: Student) => {
    try {
      await apiRequest(`/api/students/${student.id}/suspend`, {
        method: 'POST'
      });
      await loadAppData();
      await openStudentDetail(student.id);
      alert('Student suspended successfully.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to suspend student.');
    }
  };

  const clearClientLogView = () => {
    setAuditLogs(INITIAL_AUDIT);
    setTimeline(INITIAL_TIMELINE);
  };

  const resetUserAdminForm = () => {
    setEditingUserId(null);
    setUserFormMode('create');
    setUserForm(createInitialUserForm(currentSession));
  };

  const startEditUser = (user: ManagedUser) => {
    setEditingUserId(user.id);
    setUserFormMode('edit');
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      branch: user.branch ?? currentSession?.branch ?? 'Sirifort'
    });
    setCurrentTab('users');
  };

  useEffect(() => {
    if (currentSession?.branch) {
      setActiveBranch(currentSession.branch);
    }

    setUserForm(createInitialUserForm(currentSession));
    setEditingUserId(null);
    setUserFormMode('create');

    void loadAppData();
  }, [currentSession?.id]);

  useEffect(() => {
    if ((currentTab === 'trials' || currentTab === 'audit' || currentTab === 'users') && !(currentSession?.role === 'OWNER' || currentSession?.role === 'MANAGER')) {
      setCurrentTab('dashboard');
    }
  }, [currentSession?.role, currentTab]);

  // Check RBAC Permissions
  const canPerform = (requiredRoles: Role[]) => {
    return currentSession ? requiredRoles.includes(currentSession.role) : false;
  };

  // Filters students by current active branch and permissions
  const getFilteredStudents = () => {
    // If manager, enforce branch lockdown
    const branchToFilter = currentSession?.role === 'MANAGER' && currentSession?.branch 
      ? currentSession.branch 
      : activeBranch;

    return students.filter(s => {
      // Branch filter
      if (s.branch !== branchToFilter) return false;
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesId = s.id.toLowerCase().includes(query);
        const matchesParent = s.parentName.toLowerCase().includes(query);
        const matchesPhone = s.mobile.includes(query);
        if (!matchesName && !matchesId && !matchesParent && !matchesPhone) return false;
      }
      // Belt Filter
      if (beltFilter !== 'All' && s.currentBelt !== beltFilter) return false;
      // Status Filter
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      
      return true;
    });
  };

  // ==========================================
  // HANDLERS
  // ==========================================

  // Daily Cron Job Simulation Trigger
  const runCronJobSimulation = async () => {
    try {
      const result = await apiRequest<{ results: { suspensions: number; friendlyReminders: number; overdueReminders: number } }>('/api/cron/trigger', {
        method: 'POST'
      });
      await loadAppData();
      alert(`Financial Discipline Engine execution finished!\nSuspensions Triggered: ${result.results.suspensions}\nFriendly Reminders: ${result.results.friendlyReminders}\nOverdue Reminders: ${result.results.overdueReminders}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to execute cron simulation.');
    }
  };

  // Add new student
  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await apiRequest('/api/students', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.get('name'),
          age: formData.get('age'),
          category: formData.get('category'),
          parentName: formData.get('parentName'),
          mobile: formData.get('mobile'),
          branchName: formData.get('branch'),
          currentBelt: formData.get('belt'),
          feeDueDate: formData.get('dueDate')
        })
      });
      await loadAppData();
      setShowAddStudent(false);
      e.currentTarget.reset();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to enroll student.');
    }
  };

  // Add new Trial Lead
  const handleAddTrial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await apiRequest('/api/trials', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.get('name'),
          mobile: formData.get('mobile'),
          branchName: formData.get('branch'),
          payMandatory: formData.get('payMandatory')
        })
      });
      await loadAppData();
      setShowAddTrial(false);
      e.currentTarget.reset();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to register trial lead.');
    }
  };

  // Update Trial Lead status (mandating ₹500 fee verification for JOINED status)
  const updateTrialStatus = async (trialId: string, newStatus: TrialStatus) => {
    try {
      await apiRequest(`/api/trials/${trialId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      await loadAppData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update trial status.');
    }
  };

  // Open billing log window
  const openBillingModal = (student: Student, type: 'CHARGE' | 'PAYMENT') => {
    setBillingStudentId(student.id);
    setBillingType(type);
    setBillingAmount(type === 'CHARGE' ? 3600 : student.outstandingBalance);
    setBillingDesc(type === 'CHARGE' ? 'Monthly Tuition Fee - June 2026' : 'Tuition Fee Payment');
    setShowBillingModal(true);
  };

  // Submit new ledger item
  const handleAddLedgerEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === billingStudentId);
    if (!student) return;

    try {
      const entry = await apiRequest<any>('/api/billing/ledger', {
        method: 'POST',
        body: JSON.stringify({
          studentId: student.id,
          type: billingType,
          amount: billingAmount,
          description: billingDesc
        })
      });

      await loadAppData();
      setShowBillingModal(false);

      if (billingType === 'PAYMENT') {
        const receipt = await apiRequest<any>(`/api/billing/ledger/${entry.id}/receipt`);
        setShowReceipt(mapReceipt(receipt));
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to record ledger entry.');
    }
  };

  // Quick attendance checkboxes loader
  useEffect(() => {
    // Fill initial batch list status based on current students
    const initialBatchState: Record<string, AttendanceStatus> = {};
    students
      .filter(s => s.branch === activeBranch && s.status === 'ACTIVE') // Suspended students hidden from register!
      .forEach(s => {
        initialBatchState[s.id] = 'PRESENT';
      });
    setBatchAttendanceState(initialBatchState);
  }, [activeBranch, attendanceBatch, students]);

  // Submit batch attendance
  const submitBatchAttendance = async () => {
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    const records = Object.entries(batchAttendanceState).map(([studentId, status]) => {
      if (status === 'PRESENT') presentCount++;
      if (status === 'LATE') lateCount++;
      if (status === 'ABSENT') absentCount++;

      return { studentId, status };
    });

    try {
      await apiRequest('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({
          date: attendanceDate,
          batch: attendanceBatch,
          records
        })
      });
      await loadAppData();
      alert(`Success!\nBatch Attendance recorded.\nPresent: ${presentCount}\nLate: ${lateCount}\nAbsent: ${absentCount}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to submit attendance.');
    }
  };

  // Toggle settings panel
  const handleUpdateSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canPerform(['OWNER'])) {
      alert('Unauthorized! Only system Owners can mutate discipline configs.');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const newSettings: SystemSettings = {
      maxGracePeriod: parseInt(formData.get('maxGracePeriod') as string) || 10,
      reactivationCharge: parseInt(formData.get('reactivationCharge') as string) || 1000
    };
    try {
      await apiRequest('/api/billing/settings', {
        method: 'PUT',
        body: JSON.stringify(newSettings)
      });
      await loadAppData();
      alert('System settings updated successfully!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update settings.');
    }
  };

  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const payload = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        branchName: userForm.role === 'OWNER' ? null : userForm.branch,
        ...(userFormMode === 'create' ? { password: userForm.password } : {})
      };

      const user = await apiRequest<ManagedUser>(
        userFormMode === 'create' ? '/api/users' : `/api/users/${editingUserId}`,
        {
          method: userFormMode === 'create' ? 'POST' : 'PUT',
          body: JSON.stringify(payload)
        }
      );

      if (currentSession && user.id === currentSession.id) {
        setCurrentSession({
          ...currentSession,
          email: user.email,
          name: user.name,
          role: user.role,
          branch: user.branch
        });
      }

      await loadAppData();
      resetUserAdminForm();
      alert(userFormMode === 'create' ? 'User account created successfully.' : 'User account updated successfully.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save user account.');
    }
  };

  const deleteManagedUser = async (user: ManagedUser) => {
    try {
      await apiRequest(`/api/users/${user.id}`, {
        method: 'DELETE'
      });

      if (editingUserId === user.id) {
        resetUserAdminForm();
      }

      await loadAppData();
      alert('User account deleted successfully.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete user account.');
    }
  };

  const resetManagedUserPassword = async (user: ManagedUser) => {
    const nextPassword = window.prompt(`Enter a new password for ${user.email}. Minimum 8 characters.`);

    if (!nextPassword) {
      return;
    }

    try {
      await apiRequest(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password: nextPassword })
      });
      alert('Password reset successfully.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to reset password.');
    }
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginPending(true);
    setLoginError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setLoginError(payload.error || 'Login failed.');
        return;
      }

      const sessionData: UserSession = {
        id: payload.user.id,
        email: payload.user.email,
        name: payload.user.name,
        role: payload.user.role,
        branch: payload.user.branch,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken
      };

      setCurrentSession(sessionData);
      saveToStorage('zenshin-session', sessionData);
      setLoginEmail('');
      setLoginPassword('');
      setLoginError('');

      const newLog: AuditLog = {
        id: 'A' + Math.floor(Math.random() * 10000),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: sessionData.name,
        role: sessionData.role,
        action: 'LOGIN',
        details: `${sessionData.role} logged in successfully.`,
        branch: sessionData.branch || 'GLOBAL'
      };
      setAuditLogs(prev => [newLog, ...prev]);
    } catch {
      setLoginError('Unable to reach the API. Confirm the backend is running and reachable.');
    } finally {
      setLoginPending(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('zenshin-session');
    setCurrentSession(null);
    resetAppData();
    resetUserAdminForm();
  };

  // ==========================================
  // RENDER UTILS
  // ==========================================
  
  // Calculate dashboard stats
  const getStats = () => {
    const targetStudents = students.filter(s => currentSession?.role === 'MANAGER' && currentSession?.branch 
      ? s.branch === currentSession.branch 
      : s.branch === activeBranch
    );

    const targetTrials = trials.filter(t => currentSession?.role === 'MANAGER' && currentSession?.branch
      ? t.branch === currentSession.branch
      : t.branch === activeBranch
    );

    const total = targetStudents.length;
    const active = targetStudents.filter(s => s.status === 'ACTIVE').length;
    const inactive = targetStudents.filter(s => s.status === 'INACTIVE').length;
    const examEligible = targetStudents.filter(s => s.examEligible && s.status === 'ACTIVE').length;
    
    // Sum financials
    const trialRev = targetTrials.filter(t => t.status === 'PAID' || t.status === 'JOINED').length * 500;
    const monthlyFees = targetStudents.length * 3600; // Expected
    const pendingFees = targetStudents.reduce((acc, curr) => acc + curr.outstandingBalance, 0);
    const paidTrials = targetTrials.filter(t => t.status === 'PAID').length;
    
    // Average attendance
    const avgAttendance = targetStudents.length > 0
      ? Math.round(targetStudents.reduce((acc, curr) => acc + curr.attendanceRate, 0) / targetStudents.length)
      : 0;

    // Fees due this week (within next 7 days or overdue but active)
    const today = new Date();
    const feesDueThisWeek = targetStudents.filter(s => {
      if (s.status !== 'ACTIVE') return false;
      const dueDate = new Date(s.feeDueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && s.outstandingBalance > 0;
    }).length;

    const overdueCount = targetStudents.filter(s => {
      const dueDate = new Date(s.feeDueDate);
      return dueDate < today && s.outstandingBalance > 0 && s.status === 'ACTIVE';
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
      overdueCount
    };
  };

  const stats = getStats();
  const navigationTabs = [
    { id: 'dashboard' as const, label: 'Analytics Dashboard', icon: Activity },
    { id: 'students' as const, label: 'Student Directory', icon: Users },
    { id: 'attendance' as const, label: 'Kiosk Attendance', icon: Calendar },
    { id: 'trials' as const, label: 'Trial Leads Funnel', icon: UserPlus, privileged: true },
    { id: 'billing' as const, label: 'Accounting Ledger', icon: DollarSign },
    { id: 'users' as const, label: 'User Admin', icon: Settings, privileged: true },
    { id: 'audit' as const, label: 'System Audit Logs', icon: Shield, privileged: true }
  ].filter((tab) => !tab.privileged || canPerform(['OWNER', 'MANAGER']));

  if (!currentSession) {
    return (
      <LoginScreen
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'red' : 'dark'))}
        loginEmail={loginEmail}
        loginPassword={loginPassword}
        loginError={loginError}
        loginPending={loginPending}
        onEmailChange={setLoginEmail}
        onPasswordChange={setLoginPassword}
        onSubmit={handleLoginSubmit}
      />
    );
  }

  return (
    <div className="min-h-screen text-slate-100 flex flex-col antialiased">
      
      {/* ==========================================
          WHATSAPP FLOATING BANNER (SIMULATION)
         ========================================== */}
      {whatsappToast.visible && (
        <div className="fixed top-6 right-6 z-50 max-w-md w-full glass-card border border-emerald-500/30 bg-emerald-950/80 p-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 scale-100 animate-pulse">
          <div className="flex gap-3">
            <div className="bg-emerald-500 text-slate-900 rounded-full p-2 h-fit flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Meta API WhatsApp Message Mock</span>
                <span className="text-xs text-slate-400">Just Now</span>
              </div>
              <p className="text-slate-200 text-sm mt-1 leading-relaxed">
                {whatsappToast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          HEADER SECTION (NAVBAR & BRANCH SWITCHER)
         ========================================== */}
      <ShellHeader
        currentSession={currentSession}
        activeBranch={activeBranch}
        theme={theme}
        settings={settings}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'red' : 'dark'))}
        onLogout={handleLogout}
        onBranchChange={setActiveBranch}
      />

      {/* ==========================================
          NAVIGATION TABS
         ========================================== */}
      <NavigationTabs
        tabs={navigationTabs}
        currentTab={currentTab}
        canAccessPrivileged={canPerform(['OWNER', 'MANAGER'])}
        onTabChange={setCurrentTab}
      />

      {/* ==========================================
          MAIN CONTENT WORKSPACE
         ========================================== */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">

        {/* Global warnings / Overdue banners */}
        {stats.overdueCount > 0 && (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-200">Suspension Overdue Warnings Detected</p>
                <p className="text-xs text-amber-400">
                  There are {stats.overdueCount} active students with unpaid invoices past due. Trigger the Discipline cron to suspend students after {settings.maxGracePeriod} grace days.
                </p>
              </div>
            </div>
            <button 
              onClick={runCronJobSimulation}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/10 flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Simulate Discipline Cron
            </button>
          </div>
        )}

        {/* TAB 1: ANALYTICS DASHBOARD */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top overview Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-all">
                <div className="absolute right-4 top-4 p-3 rounded-xl bg-[var(--border-glow)] text-[var(--accent-primary)]">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Active Members</p>
                <h3 className="text-3xl font-extrabold text-[var(--text-primary)] mt-2">{stats.active}</h3>
                <p className="text-xs text-emerald-400 mt-2 font-semibold">Total registered: {stats.total}</p>
              </div>

              <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-all">
                <div className="absolute right-4 top-4 p-3 rounded-xl bg-red-500/10 text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Suspended Members</p>
                <h3 className="text-3xl font-extrabold text-red-500 mt-2">{stats.inactive}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-2 font-semibold">Blocked from dojo portals</p>
              </div>

              <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-all">
                <div className="absolute right-4 top-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <DollarSign className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Trial Revenue</p>
                <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">₹{stats.trialRev}</h3>
                <p className="text-xs text-emerald-500 mt-2 font-semibold">₹500 lead mandatories collected</p>
              </div>

              <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-all">
                <div className="absolute right-4 top-4 p-3 rounded-xl bg-amber-500/10 text-amber-400">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Pending Ledger Balance</p>
                <h3 className="text-3xl font-extrabold text-amber-400 mt-2">₹{stats.pendingFees}</h3>
                <p className="text-xs text-amber-500 mt-2 font-semibold">{stats.feesDueThisWeek} students due this week</p>
              </div>

            </div>

            {/* Quick Metrics Bar graphs & Visual charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Financial disciplines chart */}
              <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Tuition Collection Health</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Expected Monthly Revenue vs. Ledger Pending Balances</p>
                </div>

                <div className="my-6 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Total Uncollected Receivables</span>
                      <span className="text-amber-400">₹{stats.pendingFees} / ₹{stats.monthlyFees}</span>
                    </div>
                    <div className="w-full bg-[var(--border-muted)] h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round((stats.pendingFees / (stats.monthlyFees || 1)) * 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Trial Conversion Target</span>
                      <span className="text-emerald-400">
                        {trials.filter(t => t.status === 'JOINED').length} converted / {trials.length} total leads
                      </span>
                    </div>
                    <div className="w-full bg-[var(--border-muted)] h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-[var(--accent-secondary)] h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round((trials.filter(t => t.status === 'JOINED').length / (trials.length || 1)) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between border-t border-[var(--border-muted)] pt-4 text-xs font-semibold text-[var(--text-muted)]">
                  <span>Branch: {activeBranch} Dojo</span>
                  <span>Average Dojo Attendance: <strong className="text-[var(--text-primary)]">{stats.avgAttendance}%</strong></span>
                </div>
              </div>

              {/* Suspended notification list / Warnings */}
              <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Suspended Accounts ({stats.inactive})
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Locked out of Dojo portals and registers</p>
                </div>

                <div className="my-4 divide-y divide-[var(--border-muted)] max-h-[160px] overflow-y-auto scrollbar-thin">
                  {students.filter(s => s.status === 'INACTIVE' && s.branch === activeBranch).map(student => (
                    <div key={student.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{student.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">{student.id} | Due: {student.feeDueDate}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-red-500 font-bold font-mono">₹{student.outstandingBalance}</span>
                        <p className="text-[9px] text-[var(--text-muted)]">Suspended</p>
                      </div>
                    </div>
                  ))}
                  {students.filter(s => s.status === 'INACTIVE' && s.branch === activeBranch).length === 0 && (
                    <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                      No suspended members in {activeBranch} dojo. Excellent work!
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setCurrentTab('billing')}
                  className="w-full py-2 bg-[var(--border-muted)] hover:bg-[var(--border-glow)] rounded-lg text-xs font-semibold transition-all text-center border border-[var(--border-muted)]"
                >
                  Manage Suspension Reactivations
                </button>
              </div>

            </div>

            {/* Quick Actions Panel */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Quick Operations Hub</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="p-4 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-tertiary)] hover:border-[var(--accent-primary)] hover:bg-[var(--border-glow)] text-center transition-all group"
                >
                  <Plus className="w-6 h-6 mx-auto text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] mb-2" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">Enroll Student</span>
                </button>

                <button
                  onClick={() => setShowAddTrial(true)}
                  className="p-4 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-tertiary)] hover:border-[var(--accent-secondary)] hover:bg-cyan-500/10 text-center transition-all group"
                >
                  <UserPlus className="w-6 h-6 mx-auto text-[var(--text-muted)] group-hover:text-[var(--accent-secondary)] mb-2" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">Register Lead</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('attendance');
                  }}
                  className="p-4 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-tertiary)] hover:border-emerald-500 hover:bg-emerald-500/10 text-center transition-all group"
                >
                  <Calendar className="w-6 h-6 mx-auto text-[var(--text-muted)] group-hover:text-emerald-400 mb-2" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">Dojo Attendance</span>
                </button>

                <button
                  onClick={runCronJobSimulation}
                  className="p-4 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-tertiary)] hover:border-amber-500 hover:bg-amber-500/10 text-center transition-all group"
                >
                  <RefreshCw className="w-6 h-6 mx-auto text-[var(--text-muted)] group-hover:text-amber-400 mb-2" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">Execute Cron Engine</span>
                </button>

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: STUDENT DIRECTORY REGISTER */}
        {currentTab === 'students' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Filters panel */}
            <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
              
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by ID, name, parent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 pl-9 pr-4 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                
                {/* Belt filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <select
                    value={beltFilter}
                    onChange={(e) => setBeltFilter(e.target.value)}
                    className="bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-1.5 px-3 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="All">All Belts</option>
                    <option value="White Belt">White Belt</option>
                    <option value="Yellow Belt">Yellow Belt</option>
                    <option value="Green Belt">Green Belt</option>
                    <option value="Brown Belt">Brown Belt</option>
                    <option value="Black Belt">Black Belt</option>
                  </select>
                </div>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-1.5 px-3 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Suspended Only</option>
                </select>

                {/* Add Student Button - OWNER/MANAGER only */}
                {canPerform(['OWNER', 'MANAGER']) && (
                  <button
                    onClick={() => setShowAddStudent(true)}
                    className="ml-auto px-4 py-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-slate-950 text-xs font-bold rounded-lg hover:scale-105 transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                    Enroll Student
                  </button>
                )}

              </div>

            </div>

            {/* Students Table */}
            <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border-glow)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-muted)] text-[var(--text-muted)] text-xs font-bold">
                      <th className="py-4 px-5">ID</th>
                      <th className="py-4 px-5">Student Details</th>
                      <th className="py-4 px-5">Age / Group</th>
                      <th className="py-4 px-5">Belt Rank</th>
                      <th className="py-4 px-5">Dojo Branch</th>
                      <th className="py-4 px-5">Attendance %</th>
                      <th className="py-4 px-5">Financial Status</th>
                      <th className="py-4 px-5">Audit Status</th>
                      <th className="py-4 px-5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-muted)] text-xs font-semibold">
                    {getFilteredStudents().map(student => {
                      const isOverdue = new Date(student.feeDueDate) < new Date() && student.outstandingBalance > 0;
                      return (
                        <tr 
                          key={student.id} 
                          className="hover:bg-[var(--bg-secondary)]/50 transition-all cursor-pointer"
                          onClick={() => {
                            void openStudentDetail(student.id);
                          }}
                        >
                          <td className="py-3.5 px-5 font-mono text-[var(--accent-secondary)]">{student.id}</td>
                          <td className="py-3.5 px-5">
                            <div>
                              <p className="text-sm font-bold text-[var(--text-primary)]">{student.name}</p>
                              <p className="text-[10px] text-[var(--text-muted)]">Parent: {student.parentName} ({student.mobile})</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                              {student.age} yrs / {student.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-slate-700"></span>
                              <span>{student.currentBelt}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-[var(--text-muted)]">{student.branch}</td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${student.attendanceRate >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: `${student.attendanceRate}%` }}
                                ></div>
                              </div>
                              <span className="font-mono">{student.attendanceRate}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            {student.outstandingBalance > 0 ? (
                              <div>
                                <span className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] ${
                                  isOverdue ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-amber-500/20 text-amber-300 border border-amber-500/20'
                                }`}>
                                  ₹{student.outstandingBalance} unpaid
                                </span>
                                <p className="text-[9px] text-[var(--text-muted)] mt-1">Due: {student.feeDueDate}</p>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                Paid Settled
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5">
                            {student.status === 'ACTIVE' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-400 font-bold border border-red-500/20">
                                SUSPENDED
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Log Payment action */}
                              {canPerform(['OWNER', 'MANAGER']) && (
                                <button
                                  onClick={() => openBillingModal(student, 'PAYMENT')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-slate-950 rounded text-[10px] font-bold transition-all"
                                  title="Log Payment"
                                >
                                  Pay
                                </button>
                              )}
                              {/* Log Charge action */}
                              {canPerform(['OWNER', 'MANAGER']) && (
                                <button
                                  onClick={() => openBillingModal(student, 'CHARGE')}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-[var(--border-glow)] border border-[var(--border-muted)] rounded text-[10px] font-bold text-[var(--text-primary)] transition-all"
                                  title="Add Charge"
                                >
                                  Charge
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {getFilteredStudents().length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-[var(--text-muted)]">
                          No students matching selection criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: KIOSK ATTENDANCE REGISTER */}
        {currentTab === 'attendance' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Batch Select and submit header */}
            <div className="glass-card p-5 rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Quick Dojo Kiosk Register</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Mark daily class attendance. Note: Suspended students are automatically excluded from registry logs.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* Select Date */}
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-1.5 px-3 text-xs text-[var(--text-primary)] focus:outline-none"
                  />

                  {/* Select Batch */}
                  <select
                    value={attendanceBatch}
                    onChange={(e) => setAttendanceBatch(e.target.value)}
                    className="bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-1.5 px-3 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="Kids (5:00 PM)">Kids Batch (5:00 PM)</option>
                    <option value="Teens (6:00 PM)">Teens Batch (6:00 PM)</option>
                    <option value="Adults (7:00 PM)">Mixed Adults Batch (7:00 PM)</option>
                  </select>

                  <button
                    onClick={submitBatchAttendance}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-[var(--accent-secondary)] text-slate-950 font-bold text-xs rounded-lg hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 stroke-[3px]" />
                    Submit Attendance
                  </button>

                </div>

              </div>
            </div>

            {/* Attendance checklist Grid */}
            <div className="glass-card rounded-2xl p-6 border border-[var(--border-glow)]">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students
                  .filter(s => s.branch === activeBranch && s.status === 'ACTIVE') // Hide Suspended from register!
                  .map(student => {
                    const currentStatus = batchAttendanceState[student.id] || 'PRESENT';
                    return (
                      <div 
                        key={student.id} 
                        className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                          currentStatus === 'PRESENT' 
                            ? 'bg-emerald-950/20 border-emerald-500/30' 
                            : currentStatus === 'LATE' 
                            ? 'bg-amber-950/20 border-amber-500/30' 
                            : 'bg-red-950/20 border-red-500/30'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">{student.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono">{student.id} | {student.currentBelt}</p>
                        </div>
                        <div className="flex gap-1.5">
                          {/* Present Button */}
                          <button
                            onClick={() => setBatchAttendanceState(prev => ({ ...prev, [student.id]: 'PRESENT' }))}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                              currentStatus === 'PRESENT' 
                                ? 'bg-emerald-500 text-slate-950 font-extrabold shadow' 
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--border-glow)]'
                            }`}
                          >
                            Present
                          </button>
                          {/* Late Button */}
                          <button
                            onClick={() => setBatchAttendanceState(prev => ({ ...prev, [student.id]: 'LATE' }))}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                              currentStatus === 'LATE' 
                                ? 'bg-amber-500 text-slate-950 font-extrabold shadow' 
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--border-glow)]'
                            }`}
                          >
                            Late
                          </button>
                          {/* Absent Button */}
                          <button
                            onClick={() => setBatchAttendanceState(prev => ({ ...prev, [student.id]: 'ABSENT' }))}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                              currentStatus === 'ABSENT' 
                                ? 'bg-red-500 text-slate-950 font-extrabold shadow' 
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--border-glow)]'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    );
                  })}
                
                {students.filter(s => s.branch === activeBranch && s.status === 'ACTIVE').length === 0 && (
                  <div className="col-span-full py-12 text-center text-[var(--text-muted)] text-sm">
                    No active student registers found. Ensure students are enrolled and not suspended.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: TRIAL LEADS CONVERSION FUNNEL */}
        {currentTab === 'trials' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Trials header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Mandatory Trial Lead Funnel (₹500)</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  All prospective trial leads must register with a ₹500 fee before dojo admission. Conversions to JOINED require verified payment.
                </p>
              </div>

              {canPerform(['OWNER', 'MANAGER']) && (
                <button
                  onClick={() => setShowAddTrial(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-slate-950 text-xs font-bold rounded-lg hover:scale-105 transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                  Add Trial Lead
                </button>
              )}
            </div>

            {/* Trial stages layout grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              
              {/* Funnel Stage 1: NEW */}
              <div className="glass-card p-4 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-secondary)] flex flex-col gap-3 min-h-[300px]">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--border-muted)]">
                  <span className="text-xs font-bold text-blue-400">1. NEW LEADS</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300">
                    {trials.filter(t => t.branch === activeBranch && t.status === 'NEW').length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] scrollbar-thin">
                  {trials.filter(t => t.branch === activeBranch && t.status === 'NEW').map(t => (
                    <div key={t.id} className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-muted)] flex flex-col gap-2">
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{t.name}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-mono">Mob: {t.mobile}</p>
                      </div>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => updateTrialStatus(t.id, 'PAID')}
                          className="px-2 py-1 bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold"
                        >
                          Collect ₹500
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funnel Stage 2: PAID */}
              <div className="glass-card p-4 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-secondary)] flex flex-col gap-3 min-h-[300px]">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--border-muted)]">
                  <span className="text-xs font-bold text-amber-400">2. PAID TRIALS</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">
                    {trials.filter(t => t.branch === activeBranch && t.status === 'PAID').length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] scrollbar-thin">
                  {trials.filter(t => t.branch === activeBranch && t.status === 'PAID').map(t => (
                    <div key={t.id} className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-muted)] flex flex-col gap-2">
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{t.name}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-mono">Mob: {t.mobile}</p>
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded mt-1 inline-block">
                          ₹500 Verified
                        </span>
                      </div>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => updateTrialStatus(t.id, 'TRIAL_COMPLETED')}
                          className="px-2 py-1 bg-amber-600/20 border border-amber-500/20 text-amber-400 rounded text-[9px] font-bold"
                        >
                          Trial Done
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funnel Stage 3: TRIAL_COMPLETED */}
              <div className="glass-card p-4 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-secondary)] flex flex-col gap-3 min-h-[300px]">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--border-muted)]">
                  <span className="text-xs font-bold text-[var(--accent-primary)]">3. COMPLETED</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300">
                    {trials.filter(t => t.branch === activeBranch && t.status === 'TRIAL_COMPLETED').length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] scrollbar-thin">
                  {trials.filter(t => t.branch === activeBranch && t.status === 'TRIAL_COMPLETED').map(t => (
                    <div key={t.id} className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-muted)] flex flex-col gap-2">
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{t.name}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-mono">Mob: {t.mobile}</p>
                      </div>
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => updateTrialStatus(t.id, 'JOINED')}
                          className="px-2 py-1 bg-emerald-600 text-slate-950 rounded text-[9px] font-bold"
                        >
                          Convert
                        </button>
                        <button
                          onClick={() => updateTrialStatus(t.id, 'LOST')}
                          className="px-2 py-1 bg-red-600/20 border border-red-500/20 text-red-400 rounded text-[9px] font-bold"
                        >
                          Lost
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funnel Stage 4: JOINED */}
              <div className="glass-card p-4 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-secondary)] flex flex-col gap-3 min-h-[300px]">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--border-muted)]">
                  <span className="text-xs font-bold text-emerald-400">4. CONVERTED</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
                    {trials.filter(t => t.branch === activeBranch && t.status === 'JOINED').length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] scrollbar-thin">
                  {trials.filter(t => t.branch === activeBranch && t.status === 'JOINED').map(t => (
                    <div key={t.id} className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-muted)] flex flex-col gap-2 opacity-70">
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{t.name}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-mono">Mob: {t.mobile}</p>
                        <span className="text-[8px] bg-emerald-500/25 text-emerald-400 px-1 py-0.5 rounded mt-1 inline-block">
                          Active Student
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funnel Stage 5: LOST */}
              <div className="glass-card p-4 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-secondary)] flex flex-col gap-3 min-h-[300px]">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--border-muted)]">
                  <span className="text-xs font-bold text-red-500">5. LOST LEADS</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-300">
                    {trials.filter(t => t.branch === activeBranch && t.status === 'LOST').length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] scrollbar-thin">
                  {trials.filter(t => t.branch === activeBranch && t.status === 'LOST').map(t => (
                    <div key={t.id} className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-muted)] flex flex-col gap-2 opacity-70">
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{t.name}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-mono">Mob: {t.mobile}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 5: ACCOUNTING LEDGER & SETTINGS */}
        {currentTab === 'billing' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Billing Overview Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Financial Discipline Config Settings - OWNER Only */}
              <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Discipline Engine Parameters</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    System rules for overdue suspensions and reactivation charges.
                  </p>
                </div>

                <form onSubmit={handleUpdateSettings} className="my-6 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">Max Grace Period (Days)</label>
                    <input
                      type="number"
                      name="maxGracePeriod"
                      defaultValue={settings.maxGracePeriod}
                      disabled={!canPerform(['OWNER'])}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      Grace days after fee due date before suspension triggers automatically.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">Reactivation Penalty Fee (₹)</label>
                    <input
                      type="number"
                      name="reactivationCharge"
                      defaultValue={settings.reactivationCharge}
                      disabled={!canPerform(['OWNER'])}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      Mandatory unlock penalty charged upon auto-suspension.
                    </p>
                  </div>

                  {canPerform(['OWNER']) && (
                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-slate-950 font-bold text-xs rounded-lg hover:scale-[1.02] transition-all shadow"
                    >
                      Save Parameters
                    </button>
                  )}
                </form>

                <div className="border-t border-[var(--border-muted)] pt-3 text-[10px] text-[var(--text-muted)] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                  <span>Only system Owners can update global parameters.</span>
                </div>
              </div>

              {/* Ledger ledger history table */}
              <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-center border-b border-[var(--border-muted)] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">Tuition Ledger Journal</h3>
                    <p className="text-xs text-[var(--text-muted)]">Historical timeline of dojo charges and payment logs</p>
                  </div>
                  <button 
                    onClick={() => {
                      void openLatestReceipt();
                    }}
                    className="px-3 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs rounded-lg font-bold transition-all"
                  >
                    View Last Receipt
                  </button>
                </div>

                <div className="my-4 overflow-y-auto max-h-[300px] divide-y divide-[var(--border-muted)] scrollbar-thin">
                  {ledger.filter(item => {
                    const student = students.find(s => s.id === item.studentId);
                    return student && student.branch === activeBranch;
                  }).map(item => (
                    <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--text-primary)]">{item.studentName}</span>
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">{item.studentId}</span>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold font-mono text-sm ${item.type === 'CHARGE' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {item.type === 'CHARGE' ? '+' : '-'} ₹{item.amount}
                        </span>
                        <p className="text-[9px] text-[var(--text-muted)] font-mono">{item.createdAt}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--border-muted)] pt-3 flex justify-between text-xs text-[var(--text-muted)] font-semibold">
                  <span>Audit verification checked</span>
                  <span>Branch: {activeBranch} Dojo Journal</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {currentTab === 'users' && canPerform(['OWNER', 'MANAGER']) && (
          <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6 animate-fadeIn">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-[var(--border-muted)] pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">System User Administration</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {currentSession.role === 'OWNER'
                      ? 'Manage owners, managers, and dojo-facing accounts across all branches.'
                      : 'Manage accounts assigned to your branch only.'}
                  </p>
                </div>
                {userFormMode === 'edit' && (
                  <button
                    onClick={resetUserAdminForm}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-bold"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                {userFormMode === 'create' && (
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Initial Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={userForm.password}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Use a temporary password and rotate it after first login.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Role</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value as Role }))}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    >
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Assigned Branch</label>
                    <select
                      value={userForm.role === 'OWNER' ? '' : userForm.branch}
                      disabled={userForm.role === 'OWNER' || currentSession.role === 'MANAGER'}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, branch: e.target.value as Branch }))}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] disabled:opacity-60"
                    >
                      {userForm.role === 'OWNER' ? (
                        <option value="">Global owner access</option>
                      ) : (
                        availableBranches.map((branch) => (
                          <option key={branch} value={branch}>{branch}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-slate-950 font-bold text-xs rounded-lg hover:scale-[1.02] transition-all shadow-lg"
                >
                  {userFormMode === 'create' ? 'Create User Account' : 'Save Account Changes'}
                </button>
              </form>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border-glow)]">
              <div className="px-6 py-4 border-b border-[var(--border-muted)] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Active User Accounts</h3>
                  <p className="text-xs text-[var(--text-muted)]">{managedUsers.length} managed identities currently available in your scope.</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--bg-tertiary)] border border-[var(--border-muted)] text-[var(--text-muted)]">
                  Branch scope: {currentSession.branch ?? 'GLOBAL'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-muted)] text-[var(--text-muted)] text-xs font-bold">
                      <th className="py-4 px-5">Identity</th>
                      <th className="py-4 px-5">Role</th>
                      <th className="py-4 px-5">Branch</th>
                      <th className="py-4 px-5">Last Updated</th>
                      <th className="py-4 px-5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-muted)] text-xs font-semibold">
                    {managedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[var(--bg-secondary)]/50 transition-all">
                        <td className="py-3.5 px-5">
                          <div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{user.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-mono">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--bg-tertiary)] border border-[var(--border-muted)] text-[var(--text-primary)]">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-[var(--text-muted)]">{user.branch ?? 'GLOBAL'}</td>
                        <td className="py-3.5 px-5 font-mono text-[10px] text-[var(--text-muted)]">{user.updatedAt}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => startEditUser(user)}
                              className="px-2.5 py-1 rounded bg-[var(--bg-tertiary)] border border-[var(--border-muted)] text-[var(--text-primary)] text-[10px] font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                void resetManagedUserPassword(user);
                              }}
                              className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold"
                            >
                              Reset Password
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete account for ${user.email}?`)) {
                                  void deleteManagedUser(user);
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-red-950/20 border border-red-500/20 text-red-400 text-[10px] font-bold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {managedUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-[var(--text-muted)]">
                          No managed user accounts are currently available in this scope.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SYSTEM AUDIT LOGS */}
        {currentTab === 'audit' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Audit Logs list */}
            <div className="glass-card p-6 rounded-2xl border border-[var(--border-glow)]">
              <div className="flex justify-between items-center border-b border-[var(--border-muted)] pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">System Administrative Audit Logs</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Tamper-proof chronological log of administrative operations, cron simulations, and WhatsApp actions.
                  </p>
                </div>
                <button
                  onClick={clearClientLogView}
                  className="px-3.5 py-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 text-xs border border-red-500/20 rounded-lg font-bold transition-all"
                >
                  Reset Log State
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[500px] scrollbar-thin">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-muted)] hover:border-[var(--border-glow)] transition-all">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-muted)] font-mono text-[9px] font-bold text-[var(--accent-secondary)]">
                          {log.id}
                        </span>
                        <span className="text-xs font-bold text-[var(--text-primary)]">{log.actor}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">({log.role})</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">{log.timestamp}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <div className="flex gap-2 items-center">
                        <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                          log.action.includes('SUSPEND') || log.action.includes('FAILED')
                            ? 'bg-red-500/10 text-red-400'
                            : log.action.includes('RECEIV') || log.action.includes('REACTIV')
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-violet-500/10 text-violet-400'
                        }`}>
                          {log.action}
                        </span>
                        <p className="text-[var(--text-muted)]">{log.details}</p>
                      </div>

                      <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--border-muted)] px-1.5 py-0.5 rounded font-mono uppercase">
                        {log.branch}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      <Modals
        currentSessionRole={currentSession.role}
        selectedStudent={selectedStudent}
        timeline={timeline}
        showAddStudent={showAddStudent}
        showAddTrial={showAddTrial}
        showBillingModal={showBillingModal}
        showReceipt={showReceipt}
        students={students}
        billingStudentId={billingStudentId}
        billingType={billingType}
        billingAmount={billingAmount}
        billingDesc={billingDesc}
        attendanceDate={attendanceDate}
        attendanceBatch={attendanceBatch}
        batchAttendanceState={batchAttendanceState}
        userFormMode={userFormMode}
        editingUserId={editingUserId}
        userForm={userForm}
        availableBranches={availableBranches}
        availableRoles={availableRoles}
        settings={settings}
        onCloseStudent={() => setSelectedStudent(null)}
        onSetSelectedStudent={setSelectedStudent}
        onSetShowAddStudent={setShowAddStudent}
        onSetShowAddTrial={setShowAddTrial}
        onSetShowBillingModal={setShowBillingModal}
        onSetShowReceipt={setShowReceipt}
        onAddStudentSubmit={handleAddStudent}
        onAddTrialSubmit={handleAddTrial}
        onAddLedgerSubmit={handleAddLedgerEntry}
        onSaveUser={handleUserSubmit}
        onUserFieldChange={(next) => setUserForm((prev) => ({ ...prev, ...next }))}
        onDeleteStudent={deleteStudent}
        onSuspendStudent={suspendStudent}
        onResetReceipt={() => setShowReceipt(null)}
        onTriggerWhatsapp={triggerWhatsappAlert}
        onSetBillingType={setBillingType}
        onSetBillingAmount={setBillingAmount}
        onSetBillingDesc={setBillingDesc}
        onSetAttendanceDate={setAttendanceDate}
        onSetAttendanceBatch={setAttendanceBatch}
        onSetBatchAttendanceState={setBatchAttendanceState}
      />

      {/* ==========================================
          FOOTER BRAND DETAILS
         ========================================== */}
      <footer className="border-t border-[var(--border-muted)] bg-[var(--bg-secondary)] py-6 px-6 text-center text-xs text-[var(--text-muted)] transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Shotokan Karate Academy. All rights reserved.</p>
          <div className="flex items-center gap-4 justify-center">
            <span>DDA Sirifort Sports Complex (New Delhi)</span>
            <span>•</span>
            <span>Asiad Karate Academy (Asiad Village)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
