import type { ComponentType } from 'react';
import { AlertTriangle, Calendar, Clock, DollarSign, Plus, RefreshCw, UserPlus, Users } from 'lucide-react';
import type { Branch, DashboardStats, Student, SystemSettings, TrialLead } from '../../types';

interface DashboardSectionProps {
  activeBranch: Branch;
  settings: SystemSettings;
  stats: DashboardStats;
  students: Student[];
  trials: TrialLead[];
  onOpenAddStudent: () => void;
  onOpenAddTrial: () => void;
  onOpenAttendance: () => void;
  onOpenBilling: () => void;
  onRunCron: () => Promise<void>;
}

export function DashboardSection({ activeBranch, settings, stats, students, trials, onOpenAddStudent, onOpenAddTrial, onOpenAttendance, onOpenBilling, onRunCron }: DashboardSectionProps) {
  const inactiveStudents = students.filter((student) => student.status === 'INACTIVE' && student.branch === activeBranch);
  const joinedTrials = trials.filter((trial) => trial.status === 'JOINED').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} title="Active Members" value={stats.active} accent="text-[var(--accent-primary)]" subText={`Total registered: ${stats.total}`} subTextClass="text-emerald-400" />
        <MetricCard icon={AlertTriangle} title="Suspended Members" value={stats.inactive} accent="text-red-400" subText="Blocked from dojo portals" subTextClass="text-[var(--text-muted)]" />
        <MetricCard icon={DollarSign} title="Trial Revenue" value={`₹${stats.trialRev}`} accent="text-emerald-400" subText="₹500 lead mandatories collected" subTextClass="text-emerald-500" />
        <MetricCard icon={Clock} title="Pending Ledger Balance" value={`₹${stats.pendingFees}`} accent="text-amber-400" subText={`${stats.feesDueThisWeek} students due this week`} subTextClass="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Tuition Collection Health</h4>
            <p className="text-xs text-[var(--text-muted)] mt-1">Expected Monthly Revenue vs. Ledger Pending Balances</p>
          </div>
          <div className="my-6 space-y-4">
            <ProgressMetric label="Total Uncollected Receivables" current={`₹${stats.pendingFees}`} total={`₹${stats.monthlyFees}`} width={Math.min(100, Math.round((stats.pendingFees / (stats.monthlyFees || 1)) * 100))} className="from-amber-500 to-red-500" />
            <ProgressMetric label="Trial Conversion Target" current={`${joinedTrials} converted`} total={`${trials.length} total leads`} width={Math.min(100, Math.round((joinedTrials / (trials.length || 1)) * 100))} className="from-emerald-500 to-[var(--accent-secondary)]" />
          </div>
          <div className="flex justify-between border-t border-[var(--border-muted)] pt-4 text-xs font-semibold text-[var(--text-muted)]"><span>Branch: {activeBranch} Dojo</span><span>Average Dojo Attendance: <strong className="text-[var(--text-primary)]">{stats.avgAttendance}%</strong></span></div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" />Suspended Accounts ({stats.inactive})</h4>
            <p className="text-xs text-[var(--text-muted)] mt-1">Locked out of dojo portals and registers</p>
          </div>
          <div className="my-4 divide-y divide-[var(--border-muted)] max-h-[160px] overflow-y-auto scrollbar-thin">
            {inactiveStudents.map((student) => <div key={student.id} className="py-2.5 flex items-center justify-between text-xs"><div><p className="font-bold text-[var(--text-primary)]">{student.name}</p><p className="text-[10px] text-[var(--text-muted)] font-mono">{student.id} | Due: {student.feeDueDate}</p></div><div className="text-right"><span className="text-red-500 font-bold font-mono">₹{student.outstandingBalance}</span><p className="text-[9px] text-[var(--text-muted)]">Suspended</p></div></div>)}
            {inactiveStudents.length === 0 && <div className="text-center py-6 text-xs text-[var(--text-muted)]">No suspended members in {activeBranch} dojo. Excellent work!</div>}
          </div>
          <button onClick={onOpenBilling} className="w-full py-2 bg-[var(--border-muted)] hover:bg-[var(--border-glow)] rounded-lg text-xs font-semibold transition-all text-center border border-[var(--border-muted)]">Manage Suspension Reactivations</button>
        </div>
      </div>

      {stats.overdueCount > 0 && <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/20 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><AlertTriangle className="w-5 h-5 animate-bounce" /></div><div><p className="text-sm font-semibold text-amber-200">Suspension Overdue Warnings Detected</p><p className="text-xs text-amber-400">There are {stats.overdueCount} active students with unpaid invoices past due. Trigger the Discipline cron to suspend students after {settings.maxGracePeriod} grace days.</p></div></div><button onClick={() => void onRunCron()} className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/10 flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" />Simulate Discipline Cron</button></div>}

      <div className="glass-card p-6 rounded-2xl"><h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Quick Operations Hub</h4><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><QuickAction icon={Plus} label="Enroll Student" onClick={onOpenAddStudent} /><QuickAction icon={UserPlus} label="Register Lead" onClick={onOpenAddTrial} highlight="hover:border-[var(--accent-secondary)] hover:bg-cyan-500/10 group-hover:text-[var(--accent-secondary)]" /><QuickAction icon={Calendar} label="Dojo Attendance" onClick={onOpenAttendance} highlight="hover:border-emerald-500 hover:bg-emerald-500/10 group-hover:text-emerald-400" /><QuickAction icon={RefreshCw} label="Execute Cron Engine" onClick={() => void onRunCron()} highlight="hover:border-amber-500 hover:bg-amber-500/10 group-hover:text-amber-400" /></div></div>
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, accent, subText, subTextClass }: { icon: ComponentType<{ className?: string }>; title: string; value: string | number; accent: string; subText: string; subTextClass: string }) {
  return <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-all"><div className={`absolute right-4 top-4 p-3 rounded-xl bg-[var(--border-glow)] ${accent}`}><Icon className="w-6 h-6" /></div><p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{title}</p><h3 className={`text-3xl font-extrabold mt-2 ${accent}`}>{value}</h3><p className={`text-xs mt-2 font-semibold ${subTextClass}`}>{subText}</p></div>;
}

function ProgressMetric({ label, current, total, width, className }: { label: string; current: string; total: string; width: number; className: string }) {
  return <div><div className="flex justify-between text-xs font-bold mb-1"><span>{label}</span><span>{current} / {total}</span></div><div className="w-full bg-[var(--border-muted)] h-3 rounded-full overflow-hidden"><div className={`bg-gradient-to-r h-full rounded-full transition-all ${className}`} style={{ width: `${width}%` }}></div></div></div>;
}

function QuickAction({ icon: Icon, label, onClick, highlight = 'hover:border-[var(--accent-primary)] hover:bg-[var(--border-glow)] group-hover:text-[var(--accent-primary)]' }: { icon: ComponentType<{ className?: string }>; label: string; onClick: () => void; highlight?: string }) {
  return <button onClick={onClick} className={`p-4 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-tertiary)] text-center transition-all group ${highlight}`}><Icon className="w-6 h-6 mx-auto text-[var(--text-muted)] mb-2" /><span className="text-xs font-bold text-[var(--text-primary)]">{label}</span></button>;
}