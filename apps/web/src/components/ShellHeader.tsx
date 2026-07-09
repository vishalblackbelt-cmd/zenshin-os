import { Lock, LogOut, Moon, Settings, Sun } from 'lucide-react';
import type { Branch, SystemSettings, UserSession } from '../types';

interface ShellHeaderProps {
  currentSession: UserSession;
  activeBranch: Branch;
  availableBranches: Branch[];
  theme: 'dark' | 'red';
  settings: SystemSettings;
  onToggleTheme: () => void;
  onLogout: () => void;
  onBranchChange: (branch: Branch) => void;
}

export function ShellHeader({
  currentSession,
  activeBranch,
  availableBranches,
  theme,
  settings,
  onToggleTheme,
  onLogout,
  onBranchChange
}: ShellHeaderProps) {
  return (
    <header className="border-b border-[var(--border-muted)] bg-[var(--bg-secondary)] py-4 px-6 sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg shadow-violet-500/10">
            <span className="font-extrabold text-lg text-slate-900 font-mono tracking-tighter">禅</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">ZENSHIN OS</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/20">
                v1.3 RC-1
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Shotokan Karate Academy ERP Portal</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {currentSession.role === 'OWNER' && (
            <button
              onClick={() => {
                alert(`Settings Configs:\nGrace Period: ${settings.maxGracePeriod} days\nReactivation Fee: ₹${settings.reactivationCharge}\nConfigure directly under the Accounting Ledger tab.`);
              }}
              className="p-2.5 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all hover:text-[var(--text-primary)]"
              title="System settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-lg border border-[var(--border-muted)]">
            {availableBranches.map((branch) => {
              const isLocked = currentSession.role === 'MANAGER' && currentSession.branch !== branch;
              return (
                <button
                  key={branch}
                  disabled={isLocked}
                  onClick={() => onBranchChange(branch)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeBranch === branch
                      ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-muted)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  } ${isLocked ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  <span>{branch} Dojo</span>
                  {isLocked && <Lock className="w-3 h-3 text-red-500" />}
                </button>
              );
            })}
          </div>

          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all hover:text-[var(--text-primary)]"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-orange-400" />}
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-muted)]">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <div className="text-right">
              <p className="text-xs font-semibold text-[var(--text-primary)]">{currentSession.name}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">{currentSession.role} Mode</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2.5 rounded-lg border border-[var(--border-muted)] hover:bg-red-500/10 hover:text-red-400 text-[var(--text-muted)] transition-all flex items-center justify-center gap-1.5"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-bold">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
