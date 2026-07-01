import { useEffect, useState } from 'react';
import { Activity, Calendar, DollarSign, Settings, Shield, UserPlus, Users } from 'lucide-react';
import { INITIAL_AUDIT } from './constants';
import { getErrorMessage } from './api/errors';
import { useApiClient } from './api/client';
import { calculateDashboardStats } from './domain/dashboard';
import { useAppData } from './hooks/useAppData';
import { useAppMutations } from './hooks/useAppMutations';
import { useSessionState } from './hooks/useSessionState';
import { useThemePreference } from './hooks/useThemePreference';
import { LoginScreen } from './components/LoginScreen';
import { Modals } from './components/Modals.tsx';
import { NavigationTabs } from './components/NavigationTabs';
import { ShellHeader } from './components/ShellHeader';
import { WhatsappToast } from './components/WhatsappToast';
import { AuditSection } from './components/sections/AuditSection';
import { AttendanceSection } from './components/sections/AttendanceSection';
import { BillingSection } from './components/sections/BillingSection';
import { DashboardSection } from './components/sections/DashboardSection';
import { StudentsSection } from './components/sections/StudentsSection';
import { TrialsSection } from './components/sections/TrialsSection';
import { UsersSection } from './components/sections/UsersSection';
import type { AppTab, Branch, CreateLedgerEntryInput, LedgerEntry, Student } from './types';

export default function App() {
  const { theme, toggleTheme } = useThemePreference();
  const { currentSession, setCurrentSession, logout } = useSessionState();
  const apiClient = useApiClient({ currentSession, setCurrentSession });
  const {
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
    resetAppData,
    loadAppData,
    openStudentDetail,
  } = useAppData({ apiClient, currentSession });
  const mutations = useAppMutations({ apiClient, currentSession, setCurrentSession, ledger, loadAppData, openStudentDetail, setSelectedStudent });

  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard');
  const [activeBranch, setActiveBranch] = useState<Branch>('Sirifort');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddTrial, setShowAddTrial] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingStudentId, setBillingStudentId] = useState('');
  const [billingType, setBillingType] = useState<'CHARGE' | 'PAYMENT'>('PAYMENT');
  const [showReceipt, setShowReceipt] = useState<LedgerEntry | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginPending, setLoginPending] = useState(false);
  const [whatsappToast, setWhatsappToast] = useState({ message: '', visible: false });

  useEffect(() => {
    if (currentSession?.branch) {
      setActiveBranch(currentSession.branch);
    }
  }, [currentSession?.branch]);

  useEffect(() => {
    if ((currentTab === 'trials' || currentTab === 'audit' || currentTab === 'users') && !(currentSession?.role === 'OWNER' || currentSession?.role === 'MANAGER')) {
      setCurrentTab('dashboard');
    }
  }, [currentSession?.role, currentTab]);

  const triggerWhatsappAlert = (message: string) => {
    setWhatsappToast({ message, visible: true });
    window.setTimeout(() => setWhatsappToast((previous) => ({ ...previous, visible: false })), 5000);
  };

  const handleLogout = () => {
    logout();
    resetAppData();
    setCurrentTab('dashboard');
    setShowReceipt(null);
  };

  if (!currentSession) {
    return (
      <LoginScreen
        theme={theme}
        onToggleTheme={toggleTheme}
        loginEmail={loginEmail}
        loginPassword={loginPassword}
        loginError={loginError}
        loginPending={loginPending}
        onEmailChange={setLoginEmail}
        onPasswordChange={setLoginPassword}
        onSubmit={async (event) => {
          event.preventDefault();
          setLoginPending(true);
          setLoginError('');
          try {
            const session = await apiClient.login({ email: loginEmail, password: loginPassword });
            setCurrentSession(session);
            setLoginEmail('');
            setLoginPassword('');
          } catch (error) {
            setLoginError(getErrorMessage(error, 'Unable to reach the API. Confirm the backend is running and reachable.'));
          } finally {
            setLoginPending(false);
          }
        }}
      />
    );
  }

  const stats = calculateDashboardStats({ activeBranch, currentSession, students, trials });
  const navigationTabs = [
    { id: 'dashboard' as const, label: 'Analytics Dashboard', icon: Activity },
    { id: 'students' as const, label: 'Student Directory', icon: Users },
    { id: 'attendance' as const, label: 'Kiosk Attendance', icon: Calendar },
    { id: 'trials' as const, label: 'Trial Leads Funnel', icon: UserPlus, privileged: true },
    { id: 'billing' as const, label: 'Accounting Ledger', icon: DollarSign },
    { id: 'users' as const, label: 'User Admin', icon: Settings, privileged: true },
    { id: 'audit' as const, label: 'System Audit Logs', icon: Shield, privileged: true },
  ].filter((tab) => !tab.privileged || currentSession.role === 'OWNER' || currentSession.role === 'MANAGER');

  return (
    <div className="min-h-screen text-slate-100 flex flex-col antialiased">
      <WhatsappToast message={whatsappToast.message} visible={whatsappToast.visible} />
      <ShellHeader currentSession={currentSession} activeBranch={activeBranch} availableBranches={availableBranches} theme={theme} settings={settings} onToggleTheme={toggleTheme} onLogout={handleLogout} onBranchChange={setActiveBranch} />
      <NavigationTabs tabs={navigationTabs} currentTab={currentTab} canAccessPrivileged={currentSession.role === 'OWNER' || currentSession.role === 'MANAGER'} onTabChange={setCurrentTab} />

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        {currentTab === 'dashboard' && <DashboardSection activeBranch={activeBranch} settings={settings} stats={stats} students={students} trials={trials} onOpenAddStudent={() => setShowAddStudent(true)} onOpenAddTrial={() => setShowAddTrial(true)} onOpenAttendance={() => setCurrentTab('attendance')} onOpenBilling={() => setCurrentTab('billing')} onRunCron={async () => { try { const result = await mutations.runCronJobSimulation(); alert(`Financial Discipline Engine execution finished!\nSuspensions Triggered: ${result.suspensions}\nFriendly Reminders: ${result.friendlyReminders}\nOverdue Reminders: ${result.overdueReminders}`); } catch (error) { alert(getErrorMessage(error, 'Failed to execute cron simulation.')); } }} />}
        {currentTab === 'students' && <StudentsSection activeBranch={activeBranch} currentSession={currentSession} students={students} onOpenAddStudent={() => setShowAddStudent(true)} onOpenBillingModal={(student, type) => { setBillingStudentId(student.id); setBillingType(type); setShowBillingModal(true); }} onOpenStudentDetail={async (studentId) => { try { await openStudentDetail(studentId); } catch (error) { alert(getErrorMessage(error, 'Failed to load student details.')); } }} />}
        {currentTab === 'attendance' && <AttendanceSection activeBranch={activeBranch} students={students} onSubmitAttendance={mutations.submitAttendance} />}
        {currentTab === 'trials' && <TrialsSection activeBranch={activeBranch} canManage={currentSession.role === 'OWNER' || currentSession.role === 'MANAGER'} trials={trials} onOpenAddTrial={() => setShowAddTrial(true)} onUpdateTrialStatus={mutations.updateTrialStatus} />}
        {currentTab === 'billing' && <BillingSection activeBranch={activeBranch} canManageSettings={currentSession.role === 'OWNER'} ledger={ledger} settings={settings} students={students} onUpdateSettings={mutations.updateSettings} onViewLatestReceipt={async () => { try { setShowReceipt(await mutations.fetchLatestReceipt()); } catch (error) { alert(getErrorMessage(error, 'Failed to load receipt.')); } }} />}
        {currentTab === 'users' && (currentSession.role === 'OWNER' || currentSession.role === 'MANAGER') && <UsersSection availableBranches={availableBranches} availableRoles={availableRoles} currentSession={currentSession} managedUsers={managedUsers} onSaveUser={mutations.saveUser} onDeleteUser={mutations.deleteManagedUser} onResetUserPassword={async (user, password) => mutations.resetManagedUserPassword(user.id, password)} />}
        {currentTab === 'audit' && <AuditSection auditLogs={auditLogs} onReset={() => setAuditLogs(INITIAL_AUDIT)} />}
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
        availableBranches={availableBranches}
        onCloseStudent={() => setSelectedStudent(null)}
        onSetShowAddStudent={setShowAddStudent}
        onSetShowAddTrial={setShowAddTrial}
        onSetShowBillingModal={setShowBillingModal}
        onSetShowReceipt={setShowReceipt}
        onAddStudentSubmit={mutations.addStudent}
        onAddTrialSubmit={mutations.addTrial}
        onAddLedgerSubmit={async (input: CreateLedgerEntryInput) => {
          const receipt = await mutations.createLedgerEntry(input);
          if (receipt) {
            setShowReceipt(receipt);
          }
        }}
        onDeleteStudent={async (student: Student) => { try { await mutations.deleteStudent(student); } catch (error) { alert(getErrorMessage(error, 'Failed to delete student.')); } }}
        onSuspendStudent={async (student: Student) => { try { await mutations.suspendStudent(student); alert('Student suspended successfully.'); } catch (error) { alert(getErrorMessage(error, 'Failed to suspend student.')); } }}
        onResetReceipt={() => setShowReceipt(null)}
        onTriggerWhatsapp={triggerWhatsappAlert}
      />
    </div>
  );
}