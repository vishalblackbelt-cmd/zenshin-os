import { Info } from 'lucide-react';
import { getErrorMessage } from '../../api/errors';
import type { Branch, LedgerEntry, Student, SystemSettings } from '../../types';

interface BillingSectionProps {
  activeBranch: Branch;
  canManageSettings: boolean;
  ledger: LedgerEntry[];
  settings: SystemSettings;
  students: Student[];
  onUpdateSettings: (settings: SystemSettings) => Promise<void>;
  onViewLatestReceipt: () => Promise<void>;
}

export function BillingSection({ activeBranch, canManageSettings, ledger, settings, students, onUpdateSettings, onViewLatestReceipt }: BillingSectionProps) {
  const scopedLedger = ledger.filter((item) => students.find((student) => student.id === item.studentId)?.branch === activeBranch);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div><h3 className="text-base font-bold text-[var(--text-primary)]">Discipline Engine Parameters</h3><p className="text-xs text-[var(--text-muted)] mt-1">System rules for overdue suspensions and reactivation charges.</p></div>
          <form onSubmit={async (event) => { event.preventDefault(); const formData = new FormData(event.currentTarget); try { await onUpdateSettings({ maxGracePeriod: parseInt(String(formData.get('maxGracePeriod')), 10) || 10, reactivationCharge: parseInt(String(formData.get('reactivationCharge')), 10) || 1000 }); alert('System settings updated successfully!'); } catch (error) { alert(getErrorMessage(error, 'Failed to update configuration settings.')); } }} className="my-6 space-y-4">
            <SettingsField label="Max Grace Period (Days)" name="maxGracePeriod" defaultValue={settings.maxGracePeriod} disabled={!canManageSettings} help="Grace days after fee due date before suspension triggers automatically." />
            <SettingsField label="Reactivation Penalty Fee (₹)" name="reactivationCharge" defaultValue={settings.reactivationCharge} disabled={!canManageSettings} help="Mandatory unlock penalty charged upon auto-suspension." />
            {canManageSettings && <button type="submit" className="w-full py-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-slate-950 font-bold text-xs rounded-lg hover:scale-[1.02] transition-all shadow">Save Parameters</button>}
          </form>
          <div className="border-t border-[var(--border-muted)] pt-3 text-[10px] text-[var(--text-muted)] flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-[var(--accent-secondary)]" /><span>Only system Owners can update global parameters.</span></div>
        </div>

        <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-[var(--border-muted)] pb-3"><div><h3 className="text-base font-bold text-[var(--text-primary)]">Tuition Ledger Journal</h3><p className="text-xs text-[var(--text-muted)]">Historical timeline of dojo charges and payment logs</p></div><button onClick={() => void onViewLatestReceipt()} className="px-3 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs rounded-lg font-bold transition-all">View Last Receipt</button></div>
          <div className="my-4 overflow-y-auto max-h-[300px] divide-y divide-[var(--border-muted)] scrollbar-thin">{scopedLedger.map((item) => <div key={item.id} className="py-3 flex justify-between items-center text-xs"><div><div className="flex items-center gap-2"><span className="font-bold text-[var(--text-primary)]">{item.studentName}</span><span className="font-mono text-[10px] text-[var(--text-muted)]">{item.studentId}</span></div><p className="text-[10px] text-[var(--text-muted)] mt-0.5">{item.description}</p></div><div className="text-right"><span className={`font-bold font-mono text-sm ${item.type === 'CHARGE' ? 'text-red-400' : 'text-emerald-400'}`}>{item.type === 'CHARGE' ? '+' : '-'} ₹{item.amount}</span><p className="text-[9px] text-[var(--text-muted)] font-mono">{item.createdAt}</p></div></div>)}</div>
          <div className="border-t border-[var(--border-muted)] pt-3 flex justify-between text-xs text-[var(--text-muted)] font-semibold"><span>Audit verification checked</span><span>Branch: {activeBranch} Dojo Journal</span></div>
        </div>
      </div>
    </div>
  );
}

function SettingsField({ label, name, defaultValue, disabled, help }: { label: string; name: string; defaultValue: number; disabled: boolean; help: string }) {
  return <div><label className="text-xs font-bold text-[var(--text-muted)] block mb-1">{label}</label><input type="number" name={name} defaultValue={defaultValue} disabled={disabled} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" /><p className="text-[10px] text-[var(--text-muted)] mt-1">{help}</p></div>;
}