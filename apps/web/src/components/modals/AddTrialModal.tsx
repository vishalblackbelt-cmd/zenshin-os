import { useState } from 'react';
import { X } from 'lucide-react';
import { getErrorMessage } from '../../api/errors';
import type { Branch, CreateTrialInput } from '../../types';

interface AddTrialModalProps {
  availableBranches: Branch[];
  onClose: () => void;
  onSubmit: (input: CreateTrialInput) => Promise<void>;
}

export function AddTrialModal({ availableBranches, onClose, onSubmit }: AddTrialModalProps) {
  const [formState, setFormState] = useState<CreateTrialInput>({ name: '', mobile: '', branchName: availableBranches[0] ?? 'Sirifort', payMandatory: 'yes' });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl animate-scaleUp">
        <div className="flex justify-between items-center border-b border-[var(--border-muted)] pb-3 mb-4">
          <h3 className="text-base font-bold text-[var(--text-primary)]">Add Dojo Trial Lead</h3>
          <button onClick={onClose} className="p-1 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={async (event) => { event.preventDefault(); try { await onSubmit(formState); } catch (error) { alert(getErrorMessage(error, 'Failed to register trial lead.')); } }} className="space-y-4 text-xs">
          <InputField label="Lead Student Name" value={formState.name} onChange={(value) => setFormState((previous) => ({ ...previous, name: value }))} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Mobile Contact" value={formState.mobile} onChange={(value) => setFormState((previous) => ({ ...previous, mobile: value }))} />
            <SelectField label="Target Dojo Branch" value={formState.branchName} onChange={(value) => setFormState((previous) => ({ ...previous, branchName: value as Branch }))} options={availableBranches} />
          </div>
          <SelectField label="Collect Mandatory ₹500 Trial Fee?" value={formState.payMandatory} onChange={(value) => setFormState((previous) => ({ ...previous, payMandatory: value as 'yes' | 'no' }))} options={['yes', 'no']} labels={{ yes: 'Yes, ₹500 tuition fee received', no: 'No, register as unpaid lead' }} />
          <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-slate-950 font-bold text-xs rounded-lg hover:scale-[1.02] transition-all shadow-lg">Register Trial Lead</button>
        </form>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">{label}</label><input required value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" /></div>;
}

function SelectField({ label, value, onChange, options, labels = {} }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) {
  return <div><label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">{label}</label><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]">{options.map((option) => <option key={option} value={option}>{labels[option] ?? option}</option>)}</select></div>;
}