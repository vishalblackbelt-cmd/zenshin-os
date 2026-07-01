import { useState } from 'react';
import { X } from 'lucide-react';
import { getErrorMessage } from '../../api/errors';
import type { Branch, CreateStudentInput } from '../../types';

interface AddStudentModalProps {
  availableBranches: Branch[];
  onClose: () => void;
  onSubmit: (input: CreateStudentInput) => Promise<void>;
}

export function AddStudentModal({ availableBranches, onClose, onSubmit }: AddStudentModalProps) {
  const [formState, setFormState] = useState<CreateStudentInput>({
    name: '',
    age: 10,
    category: 'Kids',
    parentName: '',
    mobile: '',
    branchName: availableBranches[0] ?? 'Sirifort',
    currentBelt: 'White Belt',
    feeDueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  });

  const updateField = <K extends keyof CreateStudentInput>(key: K, value: CreateStudentInput[K]) => setFormState((previous) => ({ ...previous, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-muted)] rounded-2xl p-6 shadow-2xl animate-scaleUp">
        <div className="flex justify-between items-center border-b border-[var(--border-muted)] pb-3 mb-4">
          <h3 className="text-base font-bold text-[var(--text-primary)]">Enroll New Karate Student</h3>
          <button onClick={onClose} className="p-1 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={async (event) => { event.preventDefault(); try { await onSubmit(formState); } catch (error) { alert(getErrorMessage(error, 'Failed to enroll student.')); } }} className="space-y-4 text-xs">
          <LabeledInput label="Student Full Name" value={formState.name} onChange={(value) => updateField('name', value)} />
          <div className="grid grid-cols-2 gap-4">
            <LabeledInput label="Age (Years)" type="number" value={String(formState.age)} onChange={(value) => updateField('age', Number(value) || 0)} />
            <LabeledSelect label="Dojo Category" value={formState.category} onChange={(value) => updateField('category', value)} options={['Kids', 'Teens', 'Adults']} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <LabeledSelect label="Dojo Branch" value={formState.branchName} onChange={(value) => updateField('branchName', value as Branch)} options={availableBranches} />
            <LabeledSelect label="Initial Belt Rank" value={formState.currentBelt} onChange={(value) => updateField('currentBelt', value)} options={['White Belt', 'Yellow Belt', 'Green Belt', 'Brown Belt', 'Black Belt']} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <LabeledInput label="Parent Name" value={formState.parentName} onChange={(value) => updateField('parentName', value)} />
            <LabeledInput label="Mobile Contact" type="tel" value={formState.mobile} onChange={(value) => updateField('mobile', value)} />
          </div>
          <LabeledInput label="Fee Due Date" type="date" value={formState.feeDueDate} onChange={(value) => updateField('feeDueDate', value)} />
          <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-slate-950 font-bold text-xs rounded-lg hover:scale-[1.02] transition-all shadow-lg">Enroll Member & Charge Monthly Tuition</button>
        </form>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <div><label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">{label}</label><input type={type} required value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" /></div>;
}

function LabeledSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <div><label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">{label}</label><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>;
}