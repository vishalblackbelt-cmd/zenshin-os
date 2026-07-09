import { Filter, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import type { Branch, Student, UserSession } from '../../types';

interface StudentsSectionProps {
  activeBranch: Branch;
  currentSession: UserSession;
  students: Student[];
  onOpenAddStudent: () => void;
  onOpenBillingModal: (student: Student, type: 'CHARGE' | 'PAYMENT') => void;
  onOpenStudentDetail: (studentId: string) => Promise<void>;
}

export function StudentsSection({ activeBranch, currentSession, students, onOpenAddStudent, onOpenBillingModal, onOpenStudentDetail }: StudentsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [beltFilter, setBeltFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const canManage = currentSession.role === 'OWNER' || currentSession.role === 'MANAGER';
  const scopedBranch = currentSession.role === 'MANAGER' && currentSession.branch ? currentSession.branch : activeBranch;
  const filteredStudents = students.filter((student) => {
    if (student.branch !== scopedBranch) return false;
    if (beltFilter !== 'All' && student.currentBelt !== beltFilter) return false;
    if (statusFilter !== 'All' && student.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return [student.name, student.id, student.parentName, student.mobile].some((value) => value.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72"><Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by ID, name, parent..." className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-2 pl-9 pr-4 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]" /></div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs"><Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" /><select value={beltFilter} onChange={(event) => setBeltFilter(event.target.value)} className="bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-1.5 px-3 text-xs text-[var(--text-primary)] focus:outline-none">{['All', 'White Belt', 'Yellow Belt', 'Green Belt', 'Brown Belt', 'Black Belt'].map((belt) => <option key={belt} value={belt}>{belt === 'All' ? 'All Belts' : belt}</option>)}</select></div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-1.5 px-3 text-xs text-[var(--text-primary)] focus:outline-none"><option value="All">All Statuses</option><option value="ACTIVE">Active Only</option><option value="INACTIVE">Suspended Only</option></select>
          {canManage && <button onClick={onOpenAddStudent} className="ml-auto px-4 py-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-slate-950 text-xs font-bold rounded-lg hover:scale-105 transition-all shadow-md flex items-center gap-1.5"><Plus className="w-3.5 h-3.5 stroke-[3px]" />Enroll Student</button>}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border-glow)]"><div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-muted)] text-[var(--text-muted)] text-xs font-bold">{['ID', 'Student Details', 'Age / Group', 'Belt Rank', 'Dojo Branch', 'Attendance %', 'Financial Status', 'Audit Status', 'Actions'].map((heading) => <th key={heading} className="py-4 px-5">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[var(--border-muted)] text-xs font-semibold">{filteredStudents.map((student) => { const isOverdue = new Date(student.feeDueDate) < new Date() && student.outstandingBalance > 0; return <tr key={student.id} className="hover:bg-[var(--bg-secondary)]/50 transition-all cursor-pointer" onClick={() => void onOpenStudentDetail(student.id)}><td className="py-3.5 px-5 font-mono text-[var(--accent-secondary)]">{student.id}</td><td className="py-3.5 px-5"><p className="text-sm font-bold text-[var(--text-primary)]">{student.name}</p><p className="text-[10px] text-[var(--text-muted)]">Parent: {student.parentName} ({student.mobile})</p></td><td className="py-3.5 px-5"><span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">{student.age} yrs / {student.category}</span></td><td className="py-3.5 px-5"><div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-slate-700"></span><span>{student.currentBelt}</span></div></td><td className="py-3.5 px-5 text-[var(--text-muted)]">{student.branch}</td><td className="py-3.5 px-5"><div className="flex items-center gap-2"><div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className={`h-full ${student.attendanceRate >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${student.attendanceRate}%` }}></div></div><span className="font-mono">{student.attendanceRate}%</span></div></td><td className="py-3.5 px-5">{student.outstandingBalance > 0 ? <div><span className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] ${isOverdue ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-amber-500/20 text-amber-300 border border-amber-500/20'}`}>₹{student.outstandingBalance} unpaid</span><p className="text-[9px] text-[var(--text-muted)] mt-1">Due: {student.feeDueDate}</p></div> : <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Paid Settled</span>}</td><td className="py-3.5 px-5">{student.status === 'ACTIVE' ? <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400">ACTIVE</span> : <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-400 font-bold border border-red-500/20">SUSPENDED</span>}</td><td className="py-3.5 px-5 text-center" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-center gap-1.5">{canManage && <ActionButton label="Pay" className="bg-emerald-600 hover:bg-emerald-700 text-slate-950" onClick={() => onOpenBillingModal(student, 'PAYMENT')} />}{canManage && <ActionButton label="Charge" className="bg-slate-800 hover:bg-[var(--border-glow)] border border-[var(--border-muted)] text-[var(--text-primary)]" onClick={() => onOpenBillingModal(student, 'CHARGE')} />}</div></td></tr>; })}{filteredStudents.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-[var(--text-muted)]">No students matching selection criteria.</td></tr>}</tbody></table></div></div>
    </div>
  );
}

function ActionButton({ label, className, onClick }: { label: string; className: string; onClick: () => void }) {
  return <button onClick={onClick} className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${className}`}>{label}</button>;
}