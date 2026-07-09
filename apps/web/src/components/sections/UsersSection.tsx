import { useEffect, useState, type ReactNode } from 'react';
import { getErrorMessage } from '../../api/errors';
import { DEFAULT_BRANCHES } from '../../constants';
import type { Branch, ManagedUser, Role, UserAccountInput, UserFormState, UserSession } from '../../types';

interface UsersSectionProps {
  availableBranches: Branch[];
  availableRoles: Role[];
  currentSession: UserSession;
  managedUsers: ManagedUser[];
  onDeleteUser: (user: ManagedUser) => Promise<void>;
  onResetUserPassword: (user: ManagedUser, password: string) => Promise<void>;
  onSaveUser: (mode: 'create' | 'edit', editingUserId: string | null, input: UserAccountInput) => Promise<ManagedUser>;
}

export function UsersSection({ availableBranches, availableRoles, currentSession, managedUsers, onDeleteUser, onResetUserPassword, onSaveUser }: UsersSectionProps) {
  const createInitialUserForm = (): UserFormState => ({ name: '', email: '', password: '', role: currentSession.role === 'MANAGER' ? 'INSTRUCTOR' : 'MANAGER', branch: currentSession.branch ?? availableBranches[0] ?? DEFAULT_BRANCHES[0] });
  const [userFormMode, setUserFormMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>(createInitialUserForm);

  useEffect(() => {
    setUserForm(createInitialUserForm());
    setUserFormMode('create');
    setEditingUserId(null);
  }, [currentSession.id, availableBranches.join(','), availableRoles.join(',')]);

  const resetForm = () => {
    setEditingUserId(null);
    setUserFormMode('create');
    setUserForm(createInitialUserForm());
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6 animate-fadeIn">
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-muted)] pb-4 mb-4"><div><h3 className="text-base font-bold text-[var(--text-primary)]">System User Administration</h3><p className="text-xs text-[var(--text-muted)] mt-1">{currentSession.role === 'OWNER' ? 'Manage owners, managers, and dojo-facing accounts across all branches.' : 'Manage accounts assigned to your branch only.'}</p></div>{userFormMode === 'edit' && <button onClick={resetForm} className="px-3 py-1.5 rounded-lg border border-[var(--border-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-bold">Cancel Edit</button>}</div>
        <form onSubmit={async (event) => { event.preventDefault(); try { const input: UserAccountInput = { name: userForm.name, email: userForm.email, role: userForm.role, branchName: userForm.role === 'OWNER' ? null : userForm.branch, ...(userFormMode === 'create' ? { password: userForm.password } : {}) }; await onSaveUser(userFormMode, editingUserId, input); resetForm(); alert(userFormMode === 'create' ? 'User account created successfully.' : 'User account updated successfully.'); } catch (error) { alert(getErrorMessage(error, 'Failed to save user account.')); } }} className="space-y-4 text-xs">
          <Field label="Full Name"><input type="text" required value={userForm.name} onChange={(event) => setUserForm((previous) => ({ ...previous, name: event.target.value }))} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" /></Field>
          <Field label="Email Address"><input type="email" required value={userForm.email} onChange={(event) => setUserForm((previous) => ({ ...previous, email: event.target.value }))} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" /></Field>
          {userFormMode === 'create' && <Field label="Initial Password"><input type="password" required minLength={8} value={userForm.password} onChange={(event) => setUserForm((previous) => ({ ...previous, password: event.target.value }))} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]" /><p className="text-[10px] text-[var(--text-muted)] mt-1">Use a temporary password and rotate it after first login.</p></Field>}
          <div className="grid grid-cols-2 gap-4"><Field label="Role"><select value={userForm.role} onChange={(event) => setUserForm((previous) => ({ ...previous, role: event.target.value as Role }))} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]">{availableRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select></Field><Field label="Assigned Branch"><select value={userForm.role === 'OWNER' ? '' : userForm.branch} disabled={userForm.role === 'OWNER' || currentSession.role === 'MANAGER'} onChange={(event) => setUserForm((previous) => ({ ...previous, branch: event.target.value as Branch }))} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 px-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] disabled:opacity-60">{userForm.role === 'OWNER' ? <option value="">Global owner access</option> : availableBranches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}</select></Field></div>
          <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-slate-950 font-bold text-xs rounded-lg hover:scale-[1.02] transition-all shadow-lg">{userFormMode === 'create' ? 'Create User Account' : 'Save Account Changes'}</button>
        </form>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border-glow)]">
        <div className="px-6 py-4 border-b border-[var(--border-muted)] flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-base font-bold text-[var(--text-primary)]">Active User Accounts</h3><p className="text-xs text-[var(--text-muted)]">{managedUsers.length} managed identities currently available in your scope.</p></div><span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--bg-tertiary)] border border-[var(--border-muted)] text-[var(--text-muted)]">Branch scope: {currentSession.branch ?? 'GLOBAL'}</span></div>
        <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-muted)] text-[var(--text-muted)] text-xs font-bold">{['Identity', 'Role', 'Branch', 'Last Updated', 'Actions'].map((heading) => <th key={heading} className="py-4 px-5">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[var(--border-muted)] text-xs font-semibold">{managedUsers.map((user) => <tr key={user.id} className="hover:bg-[var(--bg-secondary)]/50 transition-all"><td className="py-3.5 px-5"><p className="text-sm font-bold text-[var(--text-primary)]">{user.name}</p><p className="text-[10px] text-[var(--text-muted)] font-mono">{user.email}</p></td><td className="py-3.5 px-5"><span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--bg-tertiary)] border border-[var(--border-muted)] text-[var(--text-primary)]">{user.role}</span></td><td className="py-3.5 px-5 text-[var(--text-muted)]">{user.branch ?? 'GLOBAL'}</td><td className="py-3.5 px-5 font-mono text-[10px] text-[var(--text-muted)]">{user.updatedAt}</td><td className="py-3.5 px-5"><div className="flex items-center justify-center gap-2"><button onClick={() => { setEditingUserId(user.id); setUserFormMode('edit'); setUserForm({ name: user.name, email: user.email, password: '', role: user.role, branch: user.branch ?? currentSession.branch ?? 'Sirifort' }); }} className="px-2.5 py-1 rounded bg-[var(--bg-tertiary)] border border-[var(--border-muted)] text-[var(--text-primary)] text-[10px] font-bold">Edit</button><button onClick={async () => { const nextPassword = window.prompt(`Enter a new password for ${user.email}. Minimum 8 characters.`); if (!nextPassword) return; try { await onResetUserPassword(user, nextPassword); alert('Password reset successfully.'); } catch (error) { alert(getErrorMessage(error, 'Failed to reset password.')); } }} className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold">Reset Password</button><button onClick={async () => { if (!confirm(`Delete account for ${user.email}?`)) return; try { await onDeleteUser(user); if (editingUserId === user.id) resetForm(); alert('User account deleted successfully.'); } catch (error) { alert(getErrorMessage(error, 'Failed to delete user account.')); } }} className="px-2.5 py-1 rounded bg-red-950/20 border border-red-500/20 text-red-400 text-[10px] font-bold">Delete</button></div></td></tr>)}{managedUsers.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-[var(--text-muted)]">No managed user accounts are currently available in this scope.</td></tr>}</tbody></table></div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">{label}</label>{children}</div>;
}