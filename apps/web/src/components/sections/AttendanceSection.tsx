import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../api/errors';
import type { AttendanceStatus, AttendanceSubmissionInput, Branch, Student } from '../../types';

interface AttendanceSectionProps {
  activeBranch: Branch;
  students: Student[];
  onSubmitAttendance: (input: AttendanceSubmissionInput) => Promise<void>;
}

export function AttendanceSection({ activeBranch, students, onSubmitAttendance }: AttendanceSectionProps) {
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceBatch, setAttendanceBatch] = useState('Kids (5:00 PM)');
  const [batchAttendanceState, setBatchAttendanceState] = useState<Record<string, AttendanceStatus>>({});
  const activeStudents = students.filter((student) => student.branch === activeBranch && student.status === 'ACTIVE');

  useEffect(() => {
    const initialState: Record<string, AttendanceStatus> = {};
    activeStudents.forEach((student) => { initialState[student.id] = 'PRESENT'; });
    setBatchAttendanceState(initialState);
  }, [activeBranch, attendanceBatch, students]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="glass-card p-5 rounded-2xl"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h3 className="text-base font-bold text-[var(--text-primary)]">Quick Dojo Kiosk Register</h3><p className="text-xs text-[var(--text-muted)]">Mark daily class attendance. Suspended students are automatically excluded.</p></div><div className="flex flex-wrap items-center gap-3"><input type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} className="bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-1.5 px-3 text-xs text-[var(--text-primary)] focus:outline-none" /><select value={attendanceBatch} onChange={(event) => setAttendanceBatch(event.target.value)} className="bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-lg py-1.5 px-3 text-xs text-[var(--text-primary)] focus:outline-none"><option value="Kids (5:00 PM)">Kids Batch (5:00 PM)</option><option value="Teens (6:00 PM)">Teens Batch (6:00 PM)</option><option value="Adults (7:00 PM)">Mixed Adults Batch (7:00 PM)</option></select><button onClick={async () => { const records = Object.entries(batchAttendanceState).map(([studentId, status]) => ({ studentId, status })); try { await onSubmitAttendance({ date: attendanceDate, batch: attendanceBatch, records }); const summary = records.reduce((counts, record) => ({ ...counts, [record.status]: counts[record.status] + 1 }), { PRESENT: 0, LATE: 0, ABSENT: 0 }); alert(`Success!\nBatch Attendance recorded.\nPresent: ${summary.PRESENT}\nLate: ${summary.LATE}\nAbsent: ${summary.ABSENT}`); } catch (error) { alert(getErrorMessage(error, 'Failed to submit attendance.')); } }} className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-[var(--accent-secondary)] text-slate-950 font-bold text-xs rounded-lg hover:scale-105 transition-all shadow-lg flex items-center gap-2"><Check className="w-4 h-4 stroke-[3px]" />Submit Attendance</button></div></div></div>
      <div className="glass-card rounded-2xl p-6 border border-[var(--border-glow)]"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{activeStudents.map((student) => { const currentStatus = batchAttendanceState[student.id] || 'PRESENT'; return <div key={student.id} className={`p-4 rounded-xl border transition-all flex items-center justify-between ${currentStatus === 'PRESENT' ? 'bg-emerald-950/20 border-emerald-500/30' : currentStatus === 'LATE' ? 'bg-amber-950/20 border-amber-500/30' : 'bg-red-950/20 border-red-500/30'}`}><div><p className="text-sm font-bold text-[var(--text-primary)]">{student.name}</p><p className="text-[10px] text-[var(--text-muted)] font-mono">{student.id} | {student.currentBelt}</p></div><div className="flex gap-1.5">{(['PRESENT', 'LATE', 'ABSENT'] as AttendanceStatus[]).map((status) => <button key={status} onClick={() => setBatchAttendanceState((previous) => ({ ...previous, [student.id]: status }))} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${currentStatus === status ? selectedClassName(status) : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--border-glow)]'}`}>{status === 'PRESENT' ? 'Present' : status === 'LATE' ? 'Late' : 'Absent'}</button>)}</div></div>; })}{activeStudents.length === 0 && <div className="col-span-full py-12 text-center text-[var(--text-muted)] text-sm">No active student registers found. Ensure students are enrolled and not suspended.</div>}</div></div>
    </div>
  );
}

function selectedClassName(status: AttendanceStatus) {
  if (status === 'PRESENT') return 'bg-emerald-500 text-slate-950 font-extrabold shadow';
  if (status === 'LATE') return 'bg-amber-500 text-slate-950 font-extrabold shadow';
  return 'bg-red-500 text-slate-950 font-extrabold shadow';
}