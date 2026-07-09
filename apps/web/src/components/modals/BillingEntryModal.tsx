import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { getErrorMessage } from '../../api/errors';
import type { CreateLedgerEntryInput, Student } from '../../types';

interface BillingEntryModalProps {
  student: Student;
  initialType: 'CHARGE' | 'PAYMENT';
  onClose: () => void;
  onSubmit: (input: CreateLedgerEntryInput) => Promise<void>;
}

export function BillingEntryModal({ student, initialType, onClose, onSubmit }: BillingEntryModalProps) {
  const [entryType, setEntryType] = useState<'CHARGE' | 'PAYMENT'>(initialType);
  const [amount, setAmount] = useState(initialType === 'CHARGE' ? 3600 : student.outstandingBalance);
  const [description, setDescription] = useState(initialType === 'CHARGE' ? 'Monthly Tuition Fee - June 2026' : 'Tuition Fee Payment');

  useEffect(() => {
    setEntryType(initialType);
    setAmount(initialType === 'CHARGE' ? 3600 : student.outstandingBalance);
    setDescription(initialType === 'CHARGE' ? 'Monthly Tuition Fee - June 2026' : 'Tuition Fee Payment');
  }, [initialType, student.id, student.outstandingBalance]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl animate-scaleUp">
        <div className="flex justify-between items-center border-b border-[var(--border-muted)] pb-3 mb-4">
          <h3 className="text-base font-bold text-[var(--text-primary)]">{entryType === 'CHARGE' ? 'Create Student Tuition Charge' : 'Record Student Payment'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all"><X className="w-4 h-4" /></button>
        </div>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await onSubmit({ studentId: student.id, type: entryType, amount, description });
            } catch (error) {
              alert(getErrorMessage(error, 'Failed to record ledger entry.'));
            }
          }}
          className="space-y-4 text-xs"
        >
          <Field label="Karate Student"><input disabled value={student.name} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none opacity-60" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Transaction Type"><select value={entryType} onChange={(event) => setEntryType(event.target.value as 'CHARGE' | 'PAYMENT')} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"><option value="PAYMENT">Payment (Credit)</option><option value="CHARGE">Charge (Debit)</option></select></Field>
            <Field label="Amount (₹)"><input type="number" required value={amount} onChange={(event) => setAmount(parseInt(event.target.value, 10) || 0)} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] font-mono font-bold" /></Field>
          </div>
          <Field label="Description / Memo"><input required value={description} onChange={(event) => setDescription(event.target.value)} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" /></Field>
          <button type="submit" className={`w-full py-2.5 text-slate-950 font-bold text-xs rounded-lg hover:scale-[1.02] transition-all shadow-lg ${entryType === 'PAYMENT' ? 'bg-emerald-500' : 'bg-red-500'}`}>{entryType === 'CHARGE' ? 'Log Charge Invoices' : 'Generate Invoice Receipt'}</button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">{label}</label>{children}</div>;
}