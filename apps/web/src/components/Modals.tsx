import { AddStudentModal } from './modals/AddStudentModal';
import { AddTrialModal } from './modals/AddTrialModal';
import { BillingEntryModal } from './modals/BillingEntryModal';
import { ReceiptModal } from './modals/ReceiptModal';
import { StudentDetailDrawer } from './modals/StudentDetailDrawer';
import type {
  Branch,
  CreateLedgerEntryInput,
  CreateStudentInput,
  CreateTrialInput,
  LedgerEntry,
  Role,
  Student,
  TimelineEvent,
} from '../types';

interface ModalsProps {
  currentSessionRole: Role;
  selectedStudent: Student | null;
  timeline: TimelineEvent[];
  showAddStudent: boolean;
  showAddTrial: boolean;
  showBillingModal: boolean;
  showReceipt: LedgerEntry | null;
  students: Student[];
  billingStudentId: string;
  billingType: 'CHARGE' | 'PAYMENT';
  availableBranches: Branch[];
  onCloseStudent: () => void;
  onSetShowAddStudent: (value: boolean) => void;
  onSetShowAddTrial: (value: boolean) => void;
  onSetShowBillingModal: (value: boolean) => void;
  onSetShowReceipt: (value: LedgerEntry | null) => void;
  onAddStudentSubmit: (input: CreateStudentInput) => Promise<void>;
  onAddTrialSubmit: (input: CreateTrialInput) => Promise<void>;
  onAddLedgerSubmit: (input: CreateLedgerEntryInput) => Promise<void>;
  onDeleteStudent: (student: Student) => Promise<void>;
  onSuspendStudent: (student: Student) => Promise<void>;
  onResetReceipt: () => void;
  onTriggerWhatsapp: (message: string) => void;
}

export function Modals({
  currentSessionRole,
  selectedStudent,
  timeline,
  showAddStudent,
  showAddTrial,
  showBillingModal,
  showReceipt,
  students,
  billingStudentId,
  billingType,
  availableBranches,
  onCloseStudent,
  onSetShowAddStudent,
  onSetShowAddTrial,
  onSetShowBillingModal,
  onSetShowReceipt,
  onAddStudentSubmit,
  onAddTrialSubmit,
  onAddLedgerSubmit,
  onDeleteStudent,
  onSuspendStudent,
  onResetReceipt,
  onTriggerWhatsapp,
}: ModalsProps) {
  const billingStudent = students.find((student) => student.id === billingStudentId) ?? null;

  return (
    <>
      {selectedStudent && <StudentDetailDrawer currentSessionRole={currentSessionRole} selectedStudent={selectedStudent} timeline={timeline} onClose={onCloseStudent} onDeleteStudent={onDeleteStudent} onSuspendStudent={onSuspendStudent} />}
      {showAddStudent && <AddStudentModal availableBranches={availableBranches} onClose={() => onSetShowAddStudent(false)} onSubmit={async (input) => { await onAddStudentSubmit(input); onSetShowAddStudent(false); }} />}
      {showAddTrial && <AddTrialModal availableBranches={availableBranches} onClose={() => onSetShowAddTrial(false)} onSubmit={async (input) => { await onAddTrialSubmit(input); onSetShowAddTrial(false); }} />}
      {showBillingModal && billingStudent && <BillingEntryModal student={billingStudent} initialType={billingType} onClose={() => onSetShowBillingModal(false)} onSubmit={async (input) => { await onAddLedgerSubmit(input); onSetShowBillingModal(false); }} />}
      {showReceipt && <ReceiptModal receipt={showReceipt} onClose={() => { onSetShowReceipt(null); onResetReceipt(); }} onShareWhatsapp={onTriggerWhatsapp} />}
    </>
  );
}