import type { AuditLog } from '../../types';

interface AuditSectionProps {
  auditLogs: AuditLog[];
  onReset: () => void;
}

export function AuditSection({ auditLogs, onReset }: AuditSectionProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="glass-card p-6 rounded-2xl border border-[var(--border-glow)]">
        <div className="flex justify-between items-center border-b border-[var(--border-muted)] pb-4 mb-4"><div><h3 className="text-base font-bold text-[var(--text-primary)]">System Administrative Audit Logs</h3><p className="text-xs text-[var(--text-muted)]">Tamper-proof chronological log of administrative operations, cron simulations, and WhatsApp actions.</p></div><button onClick={onReset} className="px-3.5 py-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 text-xs border border-red-500/20 rounded-lg font-bold transition-all">Reset Log State</button></div>
        <div className="space-y-3 overflow-y-auto max-h-[500px] scrollbar-thin">{auditLogs.map((log) => <div key={log.id} className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-muted)] hover:border-[var(--border-glow)] transition-all"><div className="flex justify-between items-start gap-2"><div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-muted)] font-mono text-[9px] font-bold text-[var(--accent-secondary)]">{log.id}</span><span className="text-xs font-bold text-[var(--text-primary)]">{log.actor}</span><span className="text-[10px] text-[var(--text-muted)]">({log.role})</span></div><span className="text-[10px] font-mono text-[var(--text-muted)]">{log.timestamp}</span></div><div className="mt-2 flex items-center justify-between text-xs"><div className="flex gap-2 items-center"><span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${log.action.includes('SUSPEND') || log.action.includes('FAILED') ? 'bg-red-500/10 text-red-400' : log.action.includes('RECEIV') || log.action.includes('REACTIV') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-violet-500/10 text-violet-400'}`}>{log.action}</span><p className="text-[var(--text-muted)]">{log.details}</p></div><span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--border-muted)] px-1.5 py-0.5 rounded font-mono uppercase">{log.branch}</span></div></div>)}</div>
      </div>
    </div>
  );
}