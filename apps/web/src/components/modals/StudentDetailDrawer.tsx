import { Clock, X } from 'lucide-react';
import type { Role, Student, TimelineEvent } from '../../types';

interface StudentDetailDrawerProps {
  currentSessionRole: Role;
  selectedStudent: Student;
  timeline: TimelineEvent[];
  onClose: () => void;
  onDeleteStudent: (student: Student) => Promise<void>;
  onSuspendStudent: (student: Student) => Promise<void>;
}

export function StudentDetailDrawer({
  currentSessionRole,
  selectedStudent,
  timeline,
  onClose,
  onDeleteStudent,
  onSuspendStudent,
}: StudentDetailDrawerProps) {
  const studentTimeline = timeline.filter((event) => event.studentId === selectedStudent.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex justify-end transition-all">
      <div className="w-full max-w-lg bg-[var(--bg-secondary)] border-l border-[var(--border-muted)] h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl animate-slideLeft">
        <div className="space-y-6">
          <div className="flex justify-between items-start border-b border-[var(--border-muted)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[var(--accent-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-muted)] px-2 py-0.5 rounded">{selectedStudent.id}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${selectedStudent.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{selectedStudent.status}</span>
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mt-1.5">{selectedStudent.name}</h2>
              <p className="text-xs text-[var(--text-muted)]">{selectedStudent.branch} Dojo Member</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-muted)] text-xs">
            <DetailItem label="Parent / Contact" value={selectedStudent.parentName} subValue={selectedStudent.mobile} />
            <DetailItem label="Age Group" value={`${selectedStudent.age} years (${selectedStudent.category})`} />
            <DetailItem label="Joining Date" value={selectedStudent.joiningDate} mono />
            <DetailItem label="Current Rank" value={selectedStudent.currentBelt} highlight="text-yellow-400" />
            <DetailItem label="Next Fee Due Date" value={selectedStudent.feeDueDate} mono highlight={new Date(selectedStudent.feeDueDate) < new Date() && selectedStudent.outstandingBalance > 0 ? 'text-red-400' : 'text-[var(--text-primary)]'} />
            <DetailItem label="Ledger Balance" value={`₹${selectedStudent.outstandingBalance}`} highlight={selectedStudent.outstandingBalance > 0 ? 'text-red-500' : 'text-emerald-400'} valueClassName="text-sm font-extrabold" />
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Student Historical Timeline</h4>
            <div className="border-l border-[var(--border-muted)] pl-4 ml-2 space-y-4">
              {studentTimeline.map((event) => (
                <div key={event.id} className="relative text-xs">
                  <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[var(--accent-primary)] ring-4 ring-[var(--bg-secondary)]"></span>
                  <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-mono">
                    <span>{event.date}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-muted)]">{event.type}</span>
                  </div>
                  <p className="text-[var(--text-primary)] font-semibold mt-1">{event.description}</p>
                </div>
              ))}
              {studentTimeline.length === 0 && <div className="text-center py-6 text-[var(--text-muted)] italic">No historical timeline recorded yet.</div>}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border-muted)] pt-4 flex gap-2">
          {selectedStudent.status === 'INACTIVE' && <button onClick={() => alert('Manual reactivation is governed by the billing flow. Clear the outstanding balance using a payment entry and the system will reactivate the student automatically.')} className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold text-xs transition-all shadow">Reactivation Via Ledger Only</button>}
          {selectedStudent.status === 'ACTIVE' && (currentSessionRole === 'OWNER' || currentSessionRole === 'MANAGER') && <button onClick={() => void onSuspendStudent(selectedStudent)} className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow">Suspend Student</button>}
          {(currentSessionRole === 'OWNER' || currentSessionRole === 'MANAGER') && <button onClick={() => { if (confirm(`Are you sure you want to delete ${selectedStudent.name}?`)) { void onDeleteStudent(selectedStudent); } }} className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-900/30 text-xs transition-all" title="Remove Student Profile"><X className="w-4 h-4" /></button>}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, subValue, mono, highlight = 'text-[var(--text-primary)]', valueClassName = 'font-bold' }: { label: string; value: string; subValue?: string; mono?: boolean; highlight?: string; valueClassName?: string }) {
  return (
    <div>
      <p className="text-[10px] text-[var(--text-muted)] uppercase">{label}</p>
      <p className={`${valueClassName} mt-0.5 ${highlight} ${mono ? 'font-mono' : ''}`}>{value}</p>
      {subValue ? <p className="font-mono text-[var(--text-muted)] mt-0.5">{subValue}</p> : null}
    </div>
  );
}