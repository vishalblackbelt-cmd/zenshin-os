import { Clock, MessageSquare, X } from 'lucide-react';
import type React from 'react';
import type {
  AttendanceStatus,
  Branch,
  LedgerEntry,
  Role,
  Student,
  SystemSettings,
  TimelineEvent,
  UserFormState,
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
  billingAmount: number;
  billingDesc: string;
  attendanceDate: string;
  attendanceBatch: string;
  batchAttendanceState: Record<string, AttendanceStatus>;
  userFormMode: 'create' | 'edit';
  editingUserId: string | null;
  userForm: UserFormState;
  availableBranches: Branch[];
  availableRoles: Role[];
  settings: SystemSettings;
  onCloseStudent: () => void;
  onSetSelectedStudent: (student: Student | null) => void;
  onSetShowAddStudent: (value: boolean) => void;
  onSetShowAddTrial: (value: boolean) => void;
  onSetShowBillingModal: (value: boolean) => void;
  onSetShowReceipt: (value: LedgerEntry | null) => void;
  onAddStudentSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onAddTrialSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onAddLedgerSubmit: (event: React.FormEvent) => void;
  onSaveUser: (event: React.FormEvent<HTMLFormElement>) => void;
  onUserFieldChange: (next: Partial<UserFormState>) => void;
  onDeleteStudent: (student: Student) => void;
  onSuspendStudent: (student: Student) => void;
  onResetReceipt: () => void;
  onTriggerWhatsapp: (message: string) => void;
  onSetBillingType: (type: 'CHARGE' | 'PAYMENT') => void;
  onSetBillingAmount: (amount: number) => void;
  onSetBillingDesc: (value: string) => void;
  onSetAttendanceDate: (value: string) => void;
  onSetAttendanceBatch: (value: string) => void;
  onSetBatchAttendanceState: (updater: React.SetStateAction<Record<string, AttendanceStatus>>) => void;
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
  billingAmount,
  billingDesc,
  userFormMode: _userFormMode,
  userForm: _userForm,
  availableBranches,
  availableRoles: _availableRoles,
  settings: _settings,
  onCloseStudent,
  onSetSelectedStudent: _onSetSelectedStudent,
  onSetShowAddStudent,
  onSetShowAddTrial,
  onSetShowBillingModal,
  onSetShowReceipt: _onSetShowReceipt,
  onAddStudentSubmit,
  onAddTrialSubmit,
  onAddLedgerSubmit,
  onDeleteStudent,
  onSuspendStudent,
  onResetReceipt,
  onTriggerWhatsapp,
  onSetBillingType,
  onSetBillingAmount,
  onSetBillingDesc,
  onSetAttendanceDate: _onSetAttendanceDate,
  onSetAttendanceBatch: _onSetAttendanceBatch,
  onSetBatchAttendanceState: _onSetBatchAttendanceState
}: ModalsProps) {
  return (
    <>
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex justify-end transition-all">
          <div className="w-full max-w-lg bg-[var(--bg-secondary)] border-l border-[var(--border-muted)] h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl animate-slideLeft">
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-[var(--border-muted)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--accent-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-muted)] px-2 py-0.5 rounded">
                      {selectedStudent.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${selectedStudent.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {selectedStudent.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mt-1.5">{selectedStudent.name}</h2>
                  <p className="text-xs text-[var(--text-muted)]">{selectedStudent.branch} Dojo Member</p>
                </div>

                <button onClick={onCloseStudent} className="p-1.5 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

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
                  <p className={`font-bold mt-0.5 font-mono ${new Date(selectedStudent.feeDueDate) < new Date() && selectedStudent.outstandingBalance > 0 ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
                    {selectedStudent.feeDueDate}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase">Ledger Balance</p>
                  <p className={`font-extrabold mt-0.5 font-mono text-sm ${selectedStudent.outstandingBalance > 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                    ₹{selectedStudent.outstandingBalance}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Student Historical Timeline
                </h4>

                <div className="border-l border-[var(--border-muted)] pl-4 ml-2 space-y-4">
                  {timeline.filter((event) => event.studentId === selectedStudent.id).map((event) => (
                    <div key={event.id} className="relative text-xs">
                      <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[var(--accent-primary)] ring-4 ring-[var(--bg-secondary)]"></span>
                      <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-mono">
                        <span>{event.date}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-muted)]">{event.type}</span>
                      </div>
                      <p className="text-[var(--text-primary)] font-semibold mt-1">{event.description}</p>
                    </div>
                  ))}
                  {timeline.filter((event) => event.studentId === selectedStudent.id).length === 0 && (
                    <div className="text-center py-6 text-[var(--text-muted)] italic">No historical timeline recorded yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-muted)] pt-4 flex gap-2">
              {selectedStudent.status === 'INACTIVE' && (
                <button
                  onClick={() => alert('Manual reactivation is now governed by the backend billing flow. Clear the outstanding balance using a payment entry and the system will reactivate the student automatically.')}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold text-xs transition-all shadow"
                >
                  Reactivation Via Ledger Only
                </button>
              )}

              {selectedStudent.status === 'ACTIVE' && (currentSessionRole === 'OWNER' || currentSessionRole === 'MANAGER') && (
                <button
                  onClick={() => onSuspendStudent(selectedStudent)}
                  className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow"
                >
                  Suspend Student
                </button>
              )}

              {(currentSessionRole === 'OWNER' || currentSessionRole === 'MANAGER') && (
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${selectedStudent.name}?`)) {
                      onDeleteStudent(selectedStudent);
                    }
                  }}
                  className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-900/30 text-xs transition-all"
                  title="Remove Student Profile"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center border-b border-[var(--border-muted)] pb-3 mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Enroll New Karate Student</h3>
              <button onClick={() => onSetShowAddStudent(false)} className="p-1 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={onAddStudentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Student Full Name</label>
                <input type="text" name="name" required placeholder="e.g. Priyansh Malik" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Age (Years)</label>
                  <input type="number" name="age" required min={4} max={65} placeholder="e.g. 10" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Dojo Category</label>
                  <select name="category" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]">
                    <option value="Kids">Kids Group</option>
                    <option value="Teens">Teens Group</option>
                    <option value="Adults">Adults Group</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Dojo Branch</label>
                  <select name="branch" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]">
                    {availableBranches.map((branch) => <option key={branch} value={branch}>{branch} Dojo</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Initial Belt Rank</label>
                  <select name="belt" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]">
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
                  <input type="text" name="parentName" required placeholder="Father/Mother name" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Mobile Contact</label>
                  <input type="tel" name="mobile" required placeholder="10 digit phone" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Enrollment Date</label>
                  <input type="date" name="joiningDate" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Fee Due Date</label>
                  <input type="date" name="dueDate" defaultValue={new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]} required className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-slate-950 font-bold text-xs rounded-lg hover:scale-[1.02] transition-all shadow-lg">
                Enroll Member & Charge Monthly Tuition
              </button>
            </form>
          </div>
        </div>
      )}

      {showAddTrial && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center border-b border-[var(--border-muted)] pb-3 mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Add Dojo Trial Lead</h3>
              <button onClick={() => onSetShowAddTrial(false)} className="p-1 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={onAddTrialSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Lead Student Name</label>
                <input type="text" name="name" required placeholder="e.g. Kabir Goel" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Mobile Contact</label>
                  <input type="tel" name="mobile" required placeholder="10-digit number" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Target Dojo Branch</label>
                  <select name="branch" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]">
                    {availableBranches.map((branch) => <option key={branch} value={branch}>{branch} Dojo</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Collect Mandatory ₹500 Trial Fee?</label>
                <select name="payMandatory" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]">
                  <option value="yes">Yes, ₹500 tuition fee received</option>
                  <option value="no">No, register as unpaid lead</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-slate-950 font-bold text-xs rounded-lg hover:scale-[1.02] transition-all shadow-lg">
                Register Trial Lead
              </button>
            </form>
          </div>
        </div>
      )}

      {showBillingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center border-b border-[var(--border-muted)] pb-3 mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">{billingType === 'CHARGE' ? 'Create Student Tuition Charge' : 'Record Student Payment'}</h3>
              <button onClick={() => onSetShowBillingModal(false)} className="p-1 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={onAddLedgerSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Karate Student</label>
                <input type="text" disabled value={students.find((student) => student.id === billingStudentId)?.name || ''} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none opacity-60" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Transaction Type</label>
                  <select value={billingType} onChange={(e) => onSetBillingType(e.target.value as 'CHARGE' | 'PAYMENT')} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]">
                    <option value="PAYMENT">Payment (Credit)</option>
                    <option value="CHARGE">Charge (Debit)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Amount (₹)</label>
                  <input type="number" required value={billingAmount} onChange={(e) => onSetBillingAmount(parseInt(e.target.value) || 0)} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] font-mono font-bold" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Description / Memo</label>
                <input type="text" required value={billingDesc} onChange={(e) => onSetBillingDesc(e.target.value)} placeholder="e.g. Monthly Tuition Fee - June 2026" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" />
              </div>
              <button type="submit" className={`w-full py-2.5 text-slate-950 font-bold text-xs rounded-lg hover:scale-[1.02] transition-all shadow-lg ${billingType === 'PAYMENT' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {billingType === 'CHARGE' ? 'Log Charge Invoices' : 'Generate Invoice Receipt'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-200">
            <div className="text-center border-b border-dashed border-slate-700 pb-4 mb-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400">Tuition Invoice Receipt</h2>
              <h3 className="text-lg font-bold mt-1">Zenshin Karate Academy</h3>
              <p className="text-[10px] text-slate-400">DDA Sirifort Sports Complex, New Delhi</p>
            </div>
            <div className="space-y-3 text-xs font-semibold">
              <div className="flex justify-between"><span className="text-slate-400">Receipt ID:</span><span className="font-mono">{showReceipt.id}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Student Name:</span><span>{showReceipt.studentName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Student ID:</span><span className="font-mono">{showReceipt.studentId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Description:</span><span>{showReceipt.description}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Transaction Date:</span><span className="font-mono">{showReceipt.createdAt}</span></div>
              <div className="border-t border-dashed border-slate-700 pt-3 flex justify-between items-center">
                <span className="text-slate-400 text-sm font-bold">Paid Total:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">₹{showReceipt.amount}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  onTriggerWhatsapp(`💬 Simulated Whatsapp to Parent: Receipt ${showReceipt.id} generated. Amount ₹${showReceipt.amount} successfully paid for ${showReceipt.studentName}. Thank you!`);
                  alert('Receipt share simulated over WhatsApp!');
                }}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Share WhatsApp
              </button>
              <button onClick={onResetReceipt} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}