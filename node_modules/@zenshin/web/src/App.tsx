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
  X, 
  Trash2, 
  Settings, 
  RefreshCw, 
  MessageSquare, 
  UserPlus, 
  Clock, 
  AlertTriangle, 
  Sun, 
  Moon,
  Info,
  Lock
} from 'lucide-react';


// ==========================================
// TYPES & INTERFACES
// ==========================================

export type Role = 'OWNER' | 'MANAGER' | 'INSTRUCTOR' | 'PARENT' | 'STUDENT';
export type Branch = 'Sirifort' | 'Asiad';
export type TrialStatus = 'NEW' | 'PAID' | 'TRIAL_COMPLETED' | 'JOINED' | 'LOST';
export type StudentStatus = 'ACTIVE' | 'INACTIVE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface UserSession {
  id: string;
  name: string;
  role: Role;
  branch: Branch | null; // null for global OWNER
}

export interface Student {
  id: string; // ZD0001, AD0001, etc.
  name: string;
  age: number;
  category: string; // Kids, Teens, Adults
  parentName: string;
  mobile: string;
  branch: Branch;
  joiningDate: string;
  currentBelt: string;
  status: StudentStatus;
  feeDueDate: string;
  examEligible: boolean;
  outstandingBalance: number;
  attendanceRate: number; // e.g. 85 for 85%
}

export interface TrialLead {
  id: string;
  name: string;
  mobile: string;
  branch: Branch;
  status: TrialStatus;
  paidAmount: number; // Must track ₹500
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
  maxGracePeriod: number; // default 10 days
  reactivationCharge: number; // default ₹1000
}

// ==========================================
// MOCK INITIAL DATA & PERSISTENCE LAYER
// ==========================================

const INITIAL_SETTINGS: SystemSettings = {
  maxGracePeriod: 10,
  reactivationCharge: 1000
};

const INITIAL_STUDENTS: Student[] = [
  {
    id: 'ZD0001',
    name: 'Aarav Sharma',
    age: 12,
    category: 'Kids',
    parentName: 'Ramesh Sharma',
    mobile: '9876543210',
    branch: 'Sirifort',
    joiningDate: '2025-01-15',
    currentBelt: 'Yellow Belt',
    status: 'ACTIVE',
    feeDueDate: '2026-06-25',
    examEligible: true,
    outstandingBalance: 0,
    attendanceRate: 92
  },
  {
    id: 'ZD0002',
    name: 'Kabir Mehta',
    age: 8,
    category: 'Kids',
    parentName: 'Sanjay Mehta',
    mobile: '9811223344',
    branch: 'Sirifort',
    joiningDate: '2025-03-10',
    currentBelt: 'White Belt',
    status: 'INACTIVE', // Suspended
    feeDueDate: '2026-06-05', // 15 days overdue (more than 10 day grace)
    examEligible: false,
    outstandingBalance: 4600, // ₹3600 fee + ₹1000 reactivation fee
    attendanceRate: 65
  },
  {
    id: 'AD0001',
    name: 'Rohan Verma',
    age: 16,
    category: 'Teens',
    parentName: 'Alok Verma',
    mobile: '9988776655',
    branch: 'Asiad',
    joiningDate: '2024-09-01',
    currentBelt: 'Green Belt',
    status: 'ACTIVE',
    feeDueDate: '2026-06-18', // 2 days overdue (within grace period)
    examEligible: true,
    outstandingBalance: 3600,
    attendanceRate: 88
  },
  {
    id: 'AD0002',
    name: 'Ananya Goel',
    age: 24,
    category: 'Adults',
    parentName: 'Rajesh Goel',
    mobile: '9555667788',
    branch: 'Asiad',
    joiningDate: '2023-11-20',
    currentBelt: 'Brown Belt',
    status: 'ACTIVE',
    feeDueDate: '2026-07-05',
    examEligible: true,
    outstandingBalance: 0,
    attendanceRate: 95
  }
];

const INITIAL_TRIALS: TrialLead[] = [
  { id: 'T001', name: 'Ishaan Gupta', mobile: '9123456789', branch: 'Sirifort', status: 'PAID', paidAmount: 500, createdAt: '2026-06-15' },
  { id: 'T002', name: 'Meera Sen', mobile: '9234567890', branch: 'Asiad', status: 'NEW', paidAmount: 0, createdAt: '2026-06-18' },
  { id: 'T003', name: 'Dev Malik', mobile: '9345678901', branch: 'Sirifort', status: 'JOINED', paidAmount: 500, createdAt: '2026-06-10' },
  { id: 'T004', name: 'Riya Singhal', mobile: '9456789012', branch: 'Asiad', status: 'LOST', paidAmount: 0, createdAt: '2026-06-08' }
];

const INITIAL_LEDGER: LedgerEntry[] = [
  { id: 'L001', studentId: 'ZD0001', studentName: 'Aarav Sharma', type: 'CHARGE', amount: 3600, description: 'Monthly Fee - June 2026', createdAt: '2026-06-01 08:00:00' },
  { id: 'L002', studentId: 'ZD0001', studentName: 'Aarav Sharma', type: 'PAYMENT', amount: 3600, description: 'Cash Payment Received', createdAt: '2026-06-02 17:30:00' },
  
  { id: 'L003', studentId: 'ZD0002', studentName: 'Kabir Mehta', type: 'CHARGE', amount: 3600, description: 'Monthly Fee - June 2026', createdAt: '2026-06-01 08:00:00' },
  { id: 'L004', studentId: 'ZD0002', studentName: 'Kabir Mehta', type: 'CHARGE', amount: 1000, description: 'Reactivation Fee (Suspension)', createdAt: '2026-06-15 00:01:00' },

  { id: 'L005', studentId: 'AD0001', studentName: 'Rohan Verma', type: 'CHARGE', amount: 3600, description: 'Monthly Fee - June 2026', createdAt: '2026-06-01 08:00:00' },
  
  { id: 'L006', studentId: 'AD0002', studentName: 'Ananya Goel', type: 'CHARGE', amount: 3600, description: 'Monthly Fee - June 2026', createdAt: '2026-06-01 08:00:00' },
  { id: 'L007', studentId: 'AD0002', studentName: 'Ananya Goel', type: 'PAYMENT', amount: 3600, description: 'UPI Payment Received', createdAt: '2026-06-01 10:15:00' }
];

const INITIAL_AUDIT: AuditLog[] = [
  { id: 'A001', timestamp: '2026-06-20 02:00:00', actor: 'Vikram Singh', role: 'OWNER', action: 'LOGIN', details: 'Owner logged in successfully.', branch: 'GLOBAL' },
  { id: 'A002', timestamp: '2026-06-19 18:30:00', actor: 'Anjali Sen', role: 'MANAGER', action: 'ATTENDANCE_MARKED', details: 'Attendance marked for Sirifort Kids batch.', branch: 'Sirifort' },
  { id: 'A003', timestamp: '2026-06-15 00:01:00', actor: 'CRON_SYSTEM', role: 'OWNER', action: 'STUDENT_SUSPENDED', details: 'Student ZD0002 suspended automatically due to 10-day overdue payment.', branch: 'Sirifort' },
  { id: 'A004', timestamp: '2026-06-15 00:01:00', actor: 'CRON_SYSTEM', role: 'OWNER', action: 'WHATSAPP_REMOVED', details: 'Suspended student ZD0002 removed from whatsapp lists.', branch: 'Sirifort' }
];

const INITIAL_TIMELINE: TimelineEvent[] = [
  { id: 'E001', studentId: 'ZD0002', date: '2026-05-31', type: 'FRIENDLY_REMINDER_SENT', description: 'Friendly Reminder sent: Fee due on 2026-06-05' },
  { id: 'E002', studentId: 'ZD0002', date: '2026-06-10', type: 'OVERDUE_REMINDER_SENT', description: 'Overdue Warning sent: Fee overdue by 5 days' },
  { id: 'E003', studentId: 'ZD0002', date: '2026-06-15', type: 'STUDENT_SUSPENDED', description: 'Student status updated to Suspended (INACTIVE) & Reactivation fee of ₹1000 charged' },
  { id: 'E004', studentId: 'ZD0001', date: '2026-06-02', type: 'PAYMENT_RECEIVED', description: 'Fee payment of ₹3600 recorded' }
];

// Helper to seed localStorage
function loadFromStorage<T>(key: string, initial: T): T {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'red'>(() => {
    return (localStorage.getItem('zenshin-theme') as 'dark' | 'red') || 'dark';
  });

  // User auth state
  const [currentSession, setCurrentSession] = useState<UserSession>(() => {
    return loadFromStorage<UserSession>('zenshin-session', {
      id: 'U001',
      name: 'Sensei Vikram Singh',
      role: 'OWNER',
      branch: null // Global
    });
  });

  // DB States
  const [students, setStudents] = useState<Student[]>(() => loadFromStorage('zenshin-students', INITIAL_STUDENTS));
  const [trials, setTrials] = useState<TrialLead[]>(() => loadFromStorage('zenshin-trials', INITIAL_TRIALS));
  const [ledger, setLedger] = useState<LedgerEntry[]>(() => loadFromStorage('zenshin-ledger', INITIAL_LEDGER));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadFromStorage('zenshin-audit', INITIAL_AUDIT));
  const [timeline, setTimeline] = useState<TimelineEvent[]>(() => loadFromStorage('zenshin-timeline', INITIAL_TIMELINE));
  const [settings, setSettings] = useState<SystemSettings>(() => loadFromStorage('zenshin-settings', INITIAL_SETTINGS));

  // Router simulation
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'students' | 'attendance' | 'trials' | 'billing' | 'audit'>('dashboard');

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

  // Sync to local storage
  useEffect(() => {
    saveToStorage('zenshin-students', students);
  }, [students]);

  useEffect(() => {
    saveToStorage('zenshin-trials', trials);
  }, [trials]);

  useEffect(() => {
    saveToStorage('zenshin-ledger', ledger);
  }, [ledger]);

  useEffect(() => {
    saveToStorage('zenshin-audit', auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    saveToStorage('zenshin-timeline', timeline);
  }, [timeline]);

  useEffect(() => {
    saveToStorage('zenshin-settings', settings);
  }, [settings]);

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

  // Log audit event helper
  const logAudit = (action: string, details: string, branch: Branch | 'GLOBAL') => {
    const newLog: AuditLog = {
      id: 'A' + Math.floor(Math.random() * 10000),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: currentSession.name,
      role: currentSession.role,
      action,
      details,
      branch
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Log timeline event helper
  const logTimeline = (studentId: string, type: string, description: string) => {
    const newEvent: TimelineEvent = {
      id: 'E' + Math.floor(Math.random() * 10000),
      studentId,
      date: new Date().toISOString().split('T')[0],
      type,
      description
    };
    setTimeline(prev => [newEvent, ...prev]);
  };

  // Check RBAC Permissions
  const canPerform = (requiredRoles: Role[]) => {
    return requiredRoles.includes(currentSession.role);
  };

  // Filters students by current active branch and permissions
  const getFilteredStudents = () => {
    // If manager, enforce branch lockdown
    const branchToFilter = currentSession.role === 'MANAGER' && currentSession.branch 
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

  // Generate Unique Student ID
  const generateStudentId = (branch: Branch) => {
    const prefix = branch === 'Sirifort' ? 'ZD' : 'AD';
    const count = students.filter(s => s.branch === branch).length + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  };

  // ==========================================
  // HANDLERS
  // ==========================================

  // Daily Cron Job Simulation Trigger
  const runCronJobSimulation = () => {
    let suspensionCount = 0;
    let friendlyReminders = 0;
    let overdueReminders = 0;

    const today = new Date();
    const updatedStudents = students.map(student => {
      const dueDate = new Date(student.feeDueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days until due date
      
      let updatedStatus = student.status;
      let updatedBalance = student.outstandingBalance;

      // Suspension logic: 10 days after due date (i.e. diffDays <= -10)
      if (diffDays <= -settings.maxGracePeriod && student.status === 'ACTIVE') {
        updatedStatus = 'INACTIVE';
        // Add ₹1000 reactivation fee and log charges
        const chargeAmount = settings.reactivationCharge;
        updatedBalance += chargeAmount;
        
        suspensionCount++;

        // Add ledger entry
        const ledgerId = 'L' + Math.floor(Math.random() * 10000);
        const newLedger: LedgerEntry = {
          id: ledgerId,
          studentId: student.id,
          studentName: student.name,
          type: 'CHARGE',
          amount: chargeAmount,
          description: `Reactivation Charge (Suspended ${Math.abs(diffDays)} days overdue)`,
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        
        setTimeout(() => {
          setLedger(prev => [...prev, newLedger]);
          logTimeline(student.id, 'STUDENT_SUSPENDED', `Suspended automatically. Reactivation fee of ₹${chargeAmount} charged.`);
          logAudit('STUDENT_SUSPENDED', `Student ${student.name} (${student.id}) suspended automatically.`, student.branch);
          logAudit('WHATSAPP_REMOVED', `Suspended student ${student.id} removed from broadcasts.`, student.branch);
          
          // Send simulated suspension whatsapp
          triggerWhatsappAlert(`🚨 Whatsapp Alert to ${student.parentName} (${student.mobile}): Student ${student.name} (${student.id}) is SUSPENDED due to fees overdue by ${Math.abs(diffDays)} days. Access blocked. Reactivation fee of ₹${chargeAmount} applies.`);
        }, 100);

      } else if (diffDays === 5 && student.status === 'ACTIVE') {
        friendlyReminders++;
        setTimeout(() => {
          logTimeline(student.id, 'FRIENDLY_REMINDER_SENT', `Friendly reminder sent. Fees due in 5 days.`);
          logAudit('FRIENDLY_REMINDER_SENT', `Friendly WhatsApp alert generated for ${student.id}.`, student.branch);
          triggerWhatsappAlert(`💬 Whatsapp Friendly Alert to ${student.parentName} (${student.mobile}): Reminder that ₹3600 tuition fees for ${student.name} is due in 5 days (${student.feeDueDate}).`);
        }, 100);

      } else if (diffDays === -5 && student.status === 'ACTIVE') {
        overdueReminders++;
        setTimeout(() => {
          logTimeline(student.id, 'OVERDUE_REMINDER_SENT', `Overdue warning sent. Fees overdue by 5 days.`);
          logAudit('OVERDUE_REMINDER_SENT', `Overdue WhatsApp warning generated for ${student.id}.`, student.branch);
          triggerWhatsappAlert(`⚠️ Whatsapp Overdue Alert to ${student.parentName} (${student.mobile}): WARNING: tuition fees for ${student.name} is overdue by 5 days. Please settle outstanding to avoid suspension.`);
        }, 100);
      }

      return {
        ...student,
        status: updatedStatus,
        outstandingBalance: updatedBalance
      };
    });

    setStudents(updatedStudents);
    logAudit('CRON_SIMULATION_RUN', `Manual Financial Discipline Engine Cron completed. Suspensions: ${suspensionCount}, Friendly: ${friendlyReminders}, Overdue: ${overdueReminders}`, 'GLOBAL');
    
    alert(`Financial Discipline Engine execution finished!\nSuspensions Triggered: ${suspensionCount}\nFriendly Reminders: ${friendlyReminders}\nOverdue Reminders: ${overdueReminders}`);
  };

  // Add new student
  const handleAddStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const branchVal = formData.get('branch') as Branch;
    const studentId = generateStudentId(branchVal);
    
    const newStudent: Student = {
      id: studentId,
      name: formData.get('name') as string,
      age: parseInt(formData.get('age') as string) || 10,
      category: formData.get('category') as string,
      parentName: formData.get('parentName') as string,
      mobile: formData.get('mobile') as string,
      branch: branchVal,
      joiningDate: formData.get('joiningDate') as string || new Date().toISOString().split('T')[0],
      currentBelt: formData.get('belt') as string,
      status: 'ACTIVE',
      feeDueDate: formData.get('dueDate') as string,
      examEligible: true,
      outstandingBalance: 3600, // Monthly charge
      attendanceRate: 100
    };

    setStudents(prev => [...prev, newStudent]);
    
    // Create initial monthly ledger charge
    const chargeEntry: LedgerEntry = {
      id: 'L' + Math.floor(Math.random() * 10000),
      studentId: studentId,
      studentName: newStudent.name,
      type: 'CHARGE',
      amount: 3600,
      description: 'First Month Membership Tuition Fee',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    
    setLedger(prev => [...prev, chargeEntry]);
    logTimeline(studentId, 'STUDENT_JOINED', 'Student enrolled and membership started.');
    logAudit('STUDENT_ADD', `Enrolled new student ${newStudent.name} with ID ${studentId}.`, branchVal);
    setShowAddStudent(false);
  };

  // Add new Trial Lead
  const handleAddTrial = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newTrial: TrialLead = {
      id: 'T' + Math.floor(Math.random() * 1000),
      name: formData.get('name') as string,
      mobile: formData.get('mobile') as string,
      branch: formData.get('branch') as Branch,
      status: formData.get('payMandatory') === 'yes' ? 'PAID' : 'NEW',
      paidAmount: formData.get('payMandatory') === 'yes' ? 500 : 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTrials(prev => [...prev, newTrial]);
    logAudit('TRIAL_ADD', `Added trial lead ${newTrial.name} for branch ${newTrial.branch}. Status: ${newTrial.status}.`, newTrial.branch);
    setShowAddTrial(false);
  };

  // Update Trial Lead status (mandating ₹500 fee verification for JOINED status)
  const updateTrialStatus = (trialId: string, newStatus: TrialStatus) => {
    const trial = trials.find(t => t.id === trialId);
    if (!trial) return;

    if (newStatus === 'JOINED' && trial.status !== 'PAID') {
      alert('⚠️ Lead cannot convert to JOINED status. The ₹500 mandatory trial fee must be PAID first!');
      return;
    }

    setTrials(prev => prev.map(t => {
      if (t.id === trialId) {
        let updatedPaid = t.paidAmount;
        if (newStatus === 'PAID') updatedPaid = 500;
        return { ...t, status: newStatus, paidAmount: updatedPaid };
      }
      return t;
    }));

    logAudit('TRIAL_UPDATE', `Updated trial lead ${trial.name} status to ${newStatus}.`, trial.branch);
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
  const handleAddLedgerEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === billingStudentId);
    if (!student) return;

    const entryId = 'L' + Math.floor(Math.random() * 10000);
    const newEntry: LedgerEntry = {
      id: entryId,
      studentId: student.id,
      studentName: student.name,
      type: billingType,
      amount: billingAmount,
      description: billingDesc,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    // Calculate new outstanding balance
    const updatedStudents = students.map(s => {
      if (s.id === student.id) {
        let currentBalance = s.outstandingBalance;
        if (billingType === 'CHARGE') {
          currentBalance += billingAmount;
        } else {
          currentBalance -= billingAmount;
        }

        // Reactivation checks
        let newStatus = s.status;
        if (s.status === 'INACTIVE' && currentBalance === 0) {
          newStatus = 'ACTIVE';
          setTimeout(() => {
            logTimeline(s.id, 'STUDENT_REACTIVATED', `Student reactivated. Balance settled to ₹0.`);
            logAudit('STUDENT_REACTIVATED', `Student ${s.name} (${s.id}) reactivated. Outstanding balance resolved.`, s.branch);
            logAudit('WHATSAPP_RESTORED', `Reactivated student ${s.id} restored to whatsapp broadcasts.`, s.branch);
            triggerWhatsappAlert(`🎉 Whatsapp Alert to ${s.parentName} (${s.mobile}): Welcome back! Student ${s.name} (${s.id}) reactivation complete. All services and portal access restored.`);
          }, 100);
        }

        return {
          ...s,
          outstandingBalance: currentBalance,
          status: newStatus
        };
      }
      return s;
    });

    setLedger(prev => [...prev, newEntry]);
    setStudents(updatedStudents);
    logAudit(billingType === 'CHARGE' ? 'CHARGE_LOGGED' : 'PAYMENT_RECEIVED', 
             `${billingType} of ₹${billingAmount} recorded for ${student.id} (${billingDesc})`, student.branch);
    logTimeline(student.id, billingType === 'CHARGE' ? 'CHARGE_LOGGED' : 'PAYMENT_RECEIVED', 
                `${billingType} of ₹${billingAmount} recorded: ${billingDesc}`);

    setShowBillingModal(false);

    if (billingType === 'PAYMENT') {
      setShowReceipt(newEntry);
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
  const submitBatchAttendance = () => {
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    Object.entries(batchAttendanceState).forEach(([studentId, status]) => {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      if (status === 'PRESENT') presentCount++;
      if (status === 'LATE') lateCount++;
      if (status === 'ABSENT') absentCount++;

      // Update individual student attendance Rate
      setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          const currentRate = s.attendanceRate;
          const newRate = status === 'ABSENT' 
            ? Math.max(50, Math.round(currentRate * 0.95)) 
            : Math.min(100, Math.round(currentRate * 1.02 || 100));
          return { ...s, attendanceRate: newRate };
        }
        return s;
      }));
    });

    logAudit('ATTENDANCE_MARKED', 
             `Batch Attendance submitted for ${attendanceBatch} on ${attendanceDate}. Present: ${presentCount}, Late: ${lateCount}, Absent: ${absentCount}`, 
             activeBranch);
    alert(`Success!\nBatch Attendance recorded.\nPresent: ${presentCount}\nLate: ${lateCount}\nAbsent: ${absentCount}`);
  };

  // Toggle settings panel
  const handleUpdateSettings = (e: React.FormEvent<HTMLFormElement>) => {
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
    setSettings(newSettings);
    logAudit('SETTINGS_CHANGED', `Financial Discipline Settings modified: Grace Period = ${newSettings.maxGracePeriod} days, Reactivation = ₹${newSettings.reactivationCharge}`, 'GLOBAL');
    alert('System settings updated successfully!');
  };

  // Quick switch mock profiles
  const switchUserSession = (role: Role) => {
    let name = 'Sensei Vikram Singh';
    let branch: Branch | null = null;
    if (role === 'MANAGER') {
      name = 'Anjali Sen (Sirifort Manager)';
      branch = 'Sirifort';
    } else if (role === 'INSTRUCTOR') {
      name = 'Coach Karan Dev';
      branch = 'Sirifort';
    } else if (role === 'PARENT') {
      name = 'Ramesh Sharma (Aarav\'s Parent)';
      branch = 'Sirifort';
    } else if (role === 'STUDENT') {
      name = 'Aarav Sharma (Student)';
      branch = 'Sirifort';
    }
    setCurrentSession({ id: 'U' + Math.floor(Math.random() * 1000), name, role, branch });
    logAudit('SESSION_SWITCH', `Switched active login role to ${role}`, branch || 'GLOBAL');
  };

  // ==========================================
  // RENDER UTILS
  // ==========================================
  
  // Calculate dashboard stats
  const getStats = () => {
    const targetStudents = students.filter(s => currentSession.role === 'MANAGER' && currentSession.branch 
      ? s.branch === currentSession.branch 
      : s.branch === activeBranch
    );

    const targetTrials = trials.filter(t => currentSession.role === 'MANAGER' && currentSession.branch
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
      <header className="border-b border-[var(--border-muted)] bg-[var(--bg-secondary)] py-4 px-6 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg shadow-violet-500/10">
              <span className="font-extrabold text-lg text-slate-900 font-mono tracking-tighter">禅</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">ZENSHIN OS</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/20">
                  v1.3 RC-1
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Shotokan Karate Academy ERP Portal</p>
            </div>
          </div>

          {/* Interactive controls */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Global Settings Trigger - OWNER Only */}
            {currentSession.role === 'OWNER' && (
              <button 
                onClick={() => {
                  alert(`Settings Configs:\nGrace Period: ${settings.maxGracePeriod} days\nReactivation Fee: ₹${settings.reactivationCharge}\nConfigure directly under the Accounting Ledger tab.`);
                }}
                className="p-2.5 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all hover:text-[var(--text-primary)]"
                title="System settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Quick Role Switcher for Testing */}
            <div className="flex items-center gap-1.5 border border-[var(--border-muted)] bg-[var(--bg-tertiary)] p-1 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] px-2 font-mono">RBAC Test:</span>
              {(['OWNER', 'MANAGER', 'INSTRUCTOR', 'PARENT'] as Role[]).map(r => (
                <button
                  key={r}
                  onClick={() => switchUserSession(r)}
                  className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all ${
                    currentSession.role === r 
                      ? 'bg-[var(--accent-primary)] text-slate-950 shadow-md' 
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Branch Switcher (Locked if Manager) */}
            <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-lg border border-[var(--border-muted)]">
              {(['Sirifort', 'Asiad'] as Branch[]).map(b => {
                const isLocked = currentSession.role === 'MANAGER' && currentSession.branch !== b;
                return (
                  <button
                    key={b}
                    disabled={isLocked}
                    onClick={() => setActiveBranch(b)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeBranch === b 
                        ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-muted)]' 
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    } ${isLocked ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <span>{b} Dojo</span>
                    {isLocked && <Lock className="w-3 h-3 text-red-500" />}
                  </button>
                );
              })}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'red' : 'dark')}
              className="p-2.5 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all hover:text-[var(--text-primary)]"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-orange-400" />}
            </button>

            {/* Logged in indicator */}
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-muted)]">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <div className="text-right">
                <p className="text-xs font-semibold text-[var(--text-primary)]">{currentSession.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] font-mono">{currentSession.role} Mode</p>
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* ==========================================
          NAVIGATION TABS
         ========================================== */}
      <nav className="bg-[var(--bg-tertiary)] border-b border-[var(--border-muted)] px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto scrollbar-none gap-6">
          {[
            { id: 'dashboard', label: 'Analytics Dashboard', icon: Activity },
            { id: 'students', label: 'Student Directory', icon: Users },
            { id: 'attendance', label: 'Kiosk Attendance', icon: Calendar },
            { id: 'trials', label: 'Trial Leads Funnel', icon: UserPlus },
            { id: 'billing', label: 'Accounting Ledger', icon: DollarSign },
            { id: 'audit', label: 'System Audit Logs', icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={`py-4 px-1 flex items-center gap-2 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                  isActive 
                    ? 'border-[var(--accent-primary)] text-[var(--text-primary)] font-bold' 
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent-primary)]' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

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
                          onClick={() => setSelectedStudent(student)}
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
                      if (ledger.length > 0) {
                        setShowReceipt(ledger[ledger.length - 1]);
                      }
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
                  onClick={() => {
                    setAuditLogs(INITIAL_AUDIT);
                    setTimeline(INITIAL_TIMELINE);
                  }}
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

      {/* ==========================================
          MODALS & DRAWERS
         ========================================== */}
      
      {/* 1. STUDENT DETAIL & HISTORICAL TIMELINE DRAWER */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex justify-end transition-all">
          <div className="w-full max-w-lg bg-[var(--bg-secondary)] border-l border-[var(--border-muted)] h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl animate-slideLeft">
            
            <div className="space-y-6">
              
              {/* Drawer Header */}
              <div className="flex justify-between items-start border-b border-[var(--border-muted)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--accent-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-muted)] px-2 py-0.5 rounded">
                      {selectedStudent.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      selectedStudent.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {selectedStudent.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mt-1.5">{selectedStudent.name}</h2>
                  <p className="text-xs text-[var(--text-muted)]">{selectedStudent.branch} Dojo Member</p>
                </div>
                
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-muted)] text-xs">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase">Parent / Contact</p>
                  <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedStudent.parentName}</p>
                  <p className="font-mono text-[var(--text-muted)] mt-0.5">{selectedStudent.mobile}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase">Age Group</p>
                  <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedStudent.age} years ({selectedStudent.category})</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase">Joining Date</p>
                  <p className="font-bold text-[var(--text-primary)] mt-0.5 font-mono">{selectedStudent.joiningDate}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase">Current Rank</p>
                  <p className="font-bold text-yellow-400 mt-0.5">{selectedStudent.currentBelt}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase">Next Fee Due Date</p>
                  <p className={`font-bold mt-0.5 font-mono ${
                    new Date(selectedStudent.feeDueDate) < new Date() && selectedStudent.outstandingBalance > 0 ? 'text-red-400' : 'text-[var(--text-primary)]'
                  }`}>{selectedStudent.feeDueDate}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase">Ledger Balance</p>
                  <p className={`font-extrabold mt-0.5 font-mono text-sm ${selectedStudent.outstandingBalance > 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                    ₹{selectedStudent.outstandingBalance}
                  </p>
                </div>
              </div>

              {/* Historical Timeline events */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Student Historical Timeline
                </h4>
                
                <div className="border-l border-[var(--border-muted)] pl-4 ml-2 space-y-4">
                  {timeline.filter(e => e.studentId === selectedStudent.id).map(e => (
                    <div key={e.id} className="relative text-xs">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[var(--accent-primary)] ring-4 ring-[var(--bg-secondary)]"></span>
                      <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-mono">
                        <span>{e.date}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-muted)]">
                          {e.type}
                        </span>
                      </div>
                      <p className="text-[var(--text-primary)] font-semibold mt-1">{e.description}</p>
                    </div>
                  ))}
                  {timeline.filter(e => e.studentId === selectedStudent.id).length === 0 && (
                    <div className="text-center py-6 text-[var(--text-muted)] italic">
                      No historical timeline recorded yet.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="border-t border-[var(--border-muted)] pt-4 flex gap-2">
              {/* Reactivate button: Only if suspended (INACTIVE) and outstanding fees == 0 */}
              {selectedStudent.status === 'INACTIVE' && (
                <button
                  onClick={() => {
                    if (selectedStudent.outstandingBalance > 0) {
                      alert(`⚠️ Cannot Reactivate!\nOutstanding balance is ₹${selectedStudent.outstandingBalance}.\nAccording to the Financial Discipline Engine, reactivation is blocked until the ledger balance is zero. Settle remaining fees first.`);
                    } else {
                      // Reactivate student
                      setStudents(prev => prev.map(s => {
                        if (s.id === selectedStudent.id) {
                          return { ...s, status: 'ACTIVE' };
                        }
                        return s;
                      }));
                      setSelectedStudent(prev => prev ? { ...prev, status: 'ACTIVE' } : null);
                      logTimeline(selectedStudent.id, 'STUDENT_REACTIVATED', 'Student reactivated. Account successfully restored.');
                      logAudit('STUDENT_REACTIVATED', `Student ${selectedStudent.name} (${selectedStudent.id}) reactivated.`, selectedStudent.branch);
                      logAudit('WHATSAPP_RESTORED', `Reactivated student ${selectedStudent.id} restored to whatsapp broadcasts.`, selectedStudent.branch);
                      triggerWhatsappAlert(`🎉 Whatsapp Alert to ${selectedStudent.parentName} (${selectedStudent.mobile}): Welcome back! Student ${selectedStudent.name} (${selectedStudent.id}) reactivation complete. All services and portal access restored.`);
                      alert('Student reactivated successfully!');
                    }
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold text-xs transition-all shadow"
                >
                  Verify & Reactivate Block
                </button>
              )}
              
              {canPerform(['OWNER', 'MANAGER']) && (
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${selectedStudent.name}?`)) {
                      setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
                      logAudit('STUDENT_DELETE', `Deleted student record ${selectedStudent.name} (${selectedStudent.id})`, selectedStudent.branch);
                      setSelectedStudent(null);
                    }
                  }}
                  className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-900/30 text-xs transition-all"
                  title="Remove Student Profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 2. ENROLL STUDENT MODAL */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl animate-scaleUp">
            
            <div className="flex justify-between items-center border-b border-[var(--border-muted)] pb-3 mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Enroll New Karate Student</h3>
              <button 
                onClick={() => setShowAddStudent(false)}
                className="p-1 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4 text-xs">
              
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Student Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Priyansh Malik"
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Age (Years)</label>
                  <input
                    type="number"
                    name="age"
                    required
                    min={4}
                    max={65}
                    placeholder="e.g. 10"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Dojo Category</label>
                  <select
                    name="category"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="Kids">Kids Group</option>
                    <option value="Teens">Teens Group</option>
                    <option value="Adults">Adults Group</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Dojo Branch</label>
                  <select
                    name="branch"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="Sirifort">Sirifort Dojo</option>
                    <option value="Asiad">Asiad Dojo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Initial Belt Rank</label>
                  <select
                    name="belt"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="White Belt">White Belt</option>
                    <option value="Yellow Belt">Yellow Belt</option>
                    <option value="Green Belt">Green Belt</option>
                    <option value="Brown Belt">Brown Belt</option>
                    <option value="Black Belt">Black Belt</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Parent Name</label>
                  <input
                    type="text"
                    name="parentName"
                    required
                    placeholder="Father/Mother name"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    placeholder="10 digit phone"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Enrollment Date</label>
                  <input
                    type="date"
                    name="joiningDate"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Fee Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    defaultValue={new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]}
                    required
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-slate-950 font-bold text-xs rounded-lg hover:scale-[1.02] transition-all shadow-lg"
              >
                Enroll Member & Charge Monthly Tuition
              </button>

            </form>
          </div>
        </div>
      )}

      {/* 3. ADD TRIAL LEAD MODAL */}
      {showAddTrial && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl animate-scaleUp">
            
            <div className="flex justify-between items-center border-b border-[var(--border-muted)] pb-3 mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Add Dojo Trial Lead</h3>
              <button 
                onClick={() => setShowAddTrial(false)}
                className="p-1 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTrial} className="space-y-4 text-xs">
              
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Lead Student Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Kabir Goel"
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    placeholder="10-digit number"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Target Dojo Branch</label>
                  <select
                    name="branch"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="Sirifort">Sirifort Dojo</option>
                    <option value="Asiad">Asiad Dojo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Collect Mandatory ₹500 Trial Fee?</label>
                <select
                  name="payMandatory"
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                  <option value="yes">Yes, ₹500 tuition fee received</option>
                  <option value="no">No, register as unpaid lead</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-slate-950 font-bold text-xs rounded-lg hover:scale-[1.02] transition-all shadow-lg"
              >
                Register Trial Lead
              </button>

            </form>
          </div>
        </div>
      )}

      {/* 4. BILLING DIALOG MODAL (ADD CHARGE / RECORD PAYMENT) */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl animate-scaleUp">
            
            <div className="flex justify-between items-center border-b border-[var(--border-muted)] pb-3 mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {billingType === 'CHARGE' ? 'Create Student Tuition Charge' : 'Record Student Payment'}
              </h3>
              <button 
                onClick={() => setShowBillingModal(false)}
                className="p-1 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLedgerEntry} className="space-y-4 text-xs">
              
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Karate Student</label>
                <input
                  type="text"
                  disabled
                  value={students.find(s => s.id === billingStudentId)?.name || ''}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Transaction Type</label>
                  <select
                    value={billingType}
                    onChange={(e) => setBillingType(e.target.value as any)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="PAYMENT">Payment (Credit)</option>
                    <option value="CHARGE">Charge (Debit)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={billingAmount}
                    onChange={(e) => setBillingAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Description / Memo</label>
                <input
                  type="text"
                  required
                  value={billingDesc}
                  onChange={(e) => setBillingDesc(e.target.value)}
                  placeholder="e.g. Monthly Tuition Fee - June 2026"
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 text-slate-950 font-bold text-xs rounded-lg hover:scale-[1.02] transition-all shadow-lg ${
                  billingType === 'PAYMENT' ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              >
                {billingType === 'CHARGE' ? 'Log Charge Invoices' : 'Generate Invoice Receipt'}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* 5. RECEIPT PREVIEW MODAL */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-200">
            
            <div className="text-center border-b border-dashed border-slate-700 pb-4 mb-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400">Tuition Invoice Receipt</h2>
              <h3 className="text-lg font-bold mt-1">Zenshin Karate Academy</h3>
              <p className="text-[10px] text-slate-400">DDA Sirifort Sports Complex, New Delhi</p>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400">Receipt ID:</span>
                <span className="font-mono">{showReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Student Name:</span>
                <span>{showReceipt.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Student ID:</span>
                <span className="font-mono">{showReceipt.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Description:</span>
                <span>{showReceipt.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Date:</span>
                <span className="font-mono">{showReceipt.createdAt}</span>
              </div>

              <div className="border-t border-dashed border-slate-700 pt-3 flex justify-between items-center">
                <span className="text-slate-400 text-sm font-bold">Paid Total:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">₹{showReceipt.amount}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  triggerWhatsappAlert(`💬 Simulated Whatsapp to Parent: Receipt ${showReceipt.id} generated. Amount ₹${showReceipt.amount} successfully paid for ${showReceipt.studentName}. Thank you!`);
                  alert('Receipt share simulated over WhatsApp!');
                }}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Share WhatsApp
              </button>
              <button
                onClick={() => setShowReceipt(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

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
