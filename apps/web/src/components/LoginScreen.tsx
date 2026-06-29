import { AlertTriangle, Moon, Sun } from 'lucide-react';
import type { FormEventHandler } from 'react';

interface LoginScreenProps {
  theme: 'dark' | 'red';
  onToggleTheme: () => void;
  loginEmail: string;
  loginPassword: string;
  loginError: string;
  loginPending: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function LoginScreen({
  theme,
  onToggleTheme,
  loginEmail,
  loginPassword,
  loginError,
  loginPending,
  onEmailChange,
  onPasswordChange,
  onSubmit
}: LoginScreenProps) {
  return (
    <div className="min-h-screen text-slate-100 flex flex-col items-center justify-center p-6 antialiased bg-[var(--bg-primary)] animate-fadeIn">
      <div className="absolute top-6 right-6">
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-lg border border-[var(--border-muted)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all hover:text-[var(--text-primary)]"
        >
          {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-orange-400" />}
        </button>
      </div>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-[var(--border-glow)] flex flex-col gap-6 shadow-2xl relative overflow-hidden transition-all duration-300">
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[var(--accent-primary)] opacity-10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[var(--accent-secondary)] opacity-10 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg shadow-violet-500/20 mb-2 animate-bounce">
            <span className="font-extrabold text-2xl text-slate-900 font-mono tracking-tighter">禅</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-black tracking-wider text-[var(--text-primary)]">ZENSHIN OS</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/20">
                v1.3 RC-1
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">Shotokan Karate Academy ERP Portal</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {loginError && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-950/20 text-red-400 text-xs font-semibold flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">User ID / Email</label>
            <input
              type="text"
              required
              placeholder="owner@zenshin.com"
              value={loginEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent-primary)] transition-all font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent-primary)] transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loginPending}
            className="w-full py-3 bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 active:scale-[0.98] text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-violet-500/20 glow-btn"
          >
            {loginPending ? 'Signing In...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="border-t border-[var(--border-muted)] pt-4 text-center">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Default Seed Accounts</span>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-[var(--text-muted)] font-semibold">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-muted)] p-2 rounded-lg">
              <p className="text-[var(--text-primary)] font-bold">System Owner</p>
              <code className="text-amber-400">owner@zenshin.com</code>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-muted)] p-2 rounded-lg">
              <p className="text-[var(--text-primary)] font-bold">Sirifort Manager</p>
              <code className="text-amber-400">sirifort@zenshin.com</code>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-muted)] p-2 rounded-lg">
              <p className="text-[var(--text-primary)] font-bold">Asiad Manager</p>
              <code className="text-amber-400">asiad@zenshin.com</code>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-muted)] p-2 rounded-lg">
              <p className="text-[var(--text-primary)] font-bold">Instructor</p>
              <code className="text-amber-400">instructor@zenshin.com</code>
            </div>
          </div>
          <p className="text-[9px] text-[var(--text-muted)] mt-3">Credentials are created only when <code className="text-amber-400 font-bold">DEFAULT_SEED_PASSWORD</code> is configured.</p>
        </div>
      </div>
    </div>
  );
}