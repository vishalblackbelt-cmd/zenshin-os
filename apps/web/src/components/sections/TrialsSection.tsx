import { Plus } from 'lucide-react';
import { getErrorMessage } from '../../api/errors';
import type { Branch, TrialLead, TrialStatus } from '../../types';

interface TrialsSectionProps {
  activeBranch: Branch;
  canManage: boolean;
  trials: TrialLead[];
  onOpenAddTrial: () => void;
  onUpdateTrialStatus: (trialId: string, status: TrialStatus) => Promise<void>;
}

const TRIAL_COLUMNS: Array<{ title: string; color: string; status: TrialStatus }> = [
  { title: '1. NEW LEADS', color: 'text-blue-400', status: 'NEW' },
  { title: '2. PAID TRIALS', color: 'text-amber-400', status: 'PAID' },
  { title: '3. COMPLETED', color: 'text-[var(--accent-primary)]', status: 'TRIAL_COMPLETED' },
  { title: '4. CONVERTED', color: 'text-emerald-400', status: 'JOINED' },
  { title: '5. LOST LEADS', color: 'text-red-500', status: 'LOST' },
];

export function TrialsSection({ activeBranch, canManage, trials, onOpenAddTrial, onUpdateTrialStatus }: TrialsSectionProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">Mandatory Trial Lead Funnel (₹500)</h3>
          <p className="text-xs text-[var(--text-muted)]">All prospective trial leads must register with a ₹500 fee before dojo admission.</p>
        </div>
        {canManage && <button onClick={onOpenAddTrial} className="px-4 py-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-slate-950 text-xs font-bold rounded-lg hover:scale-105 transition-all shadow-md flex items-center gap-1.5"><Plus className="w-3.5 h-3.5 stroke-[3px]" />Add Trial Lead</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {TRIAL_COLUMNS.map((column) => {
          const scopedTrials = trials.filter((trial) => trial.branch === activeBranch && trial.status === column.status);
          return (
            <div key={column.status} className="glass-card p-4 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-secondary)] flex flex-col gap-3 min-h-[300px]">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border-muted)]"><span className={`text-xs font-bold ${column.color}`}>{column.title}</span><span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)]">{scopedTrials.length}</span></div>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] scrollbar-thin">{scopedTrials.map((trial) => <TrialCard key={trial.id} trial={trial} onUpdateTrialStatus={onUpdateTrialStatus} />)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrialCard({ trial, onUpdateTrialStatus }: { trial: TrialLead; onUpdateTrialStatus: (trialId: string, status: TrialStatus) => Promise<void> }) {
  const actions = getTrialActions(trial.status);

  return (
    <div className={`p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-muted)] flex flex-col gap-2 ${trial.status === 'JOINED' || trial.status === 'LOST' ? 'opacity-70' : ''}`}>
      <div>
        <p className="text-xs font-bold text-[var(--text-primary)]">{trial.name}</p>
        <p className="text-[9px] text-[var(--text-muted)] font-mono">Mob: {trial.mobile}</p>
        {trial.status === 'PAID' && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded mt-1 inline-block">₹500 Verified</span>}
        {trial.status === 'JOINED' && <span className="text-[8px] bg-emerald-500/25 text-emerald-400 px-1 py-0.5 rounded mt-1 inline-block">Active Student</span>}
      </div>
      {actions.length > 0 && <div className="flex flex-wrap gap-1 justify-end">{actions.map((action) => <button key={action.label} onClick={async () => { try { await onUpdateTrialStatus(trial.id, action.nextStatus); } catch (error) { alert(getErrorMessage(error, 'Failed to update trial status.')); } }} className={action.className}>{action.label}</button>)}</div>}
    </div>
  );
}

function getTrialActions(status: TrialStatus) {
  if (status === 'NEW') return [{ label: 'Collect ₹500', nextStatus: 'PAID' as TrialStatus, className: 'px-2 py-1 bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold' }];
  if (status === 'PAID') return [{ label: 'Trial Done', nextStatus: 'TRIAL_COMPLETED' as TrialStatus, className: 'px-2 py-1 bg-amber-600/20 border border-amber-500/20 text-amber-400 rounded text-[9px] font-bold' }];
  if (status === 'TRIAL_COMPLETED') return [{ label: 'Convert', nextStatus: 'JOINED' as TrialStatus, className: 'px-2 py-1 bg-emerald-600 text-slate-950 rounded text-[9px] font-bold' }, { label: 'Lost', nextStatus: 'LOST' as TrialStatus, className: 'px-2 py-1 bg-red-600/20 border border-red-500/20 text-red-400 rounded text-[9px] font-bold' }];
  return [];
}