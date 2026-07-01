import { MessageSquare } from 'lucide-react';
import type { LedgerEntry } from '../../types';

interface ReceiptModalProps {
  receipt: LedgerEntry;
  onClose: () => void;
  onShareWhatsapp: (message: string) => void;
}

export function ReceiptModal({ receipt, onClose, onShareWhatsapp }: ReceiptModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-200">
        <div className="text-center border-b border-dashed border-slate-700 pb-4 mb-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400">Tuition Invoice Receipt</h2>
          <h3 className="text-lg font-bold mt-1">Zenshin Karate Academy</h3>
          <p className="text-[10px] text-slate-400">DDA Sirifort Sports Complex, New Delhi</p>
        </div>

        <div className="space-y-3 text-xs font-semibold">
          <ReceiptRow label="Receipt ID:" value={receipt.id} mono />
          <ReceiptRow label="Student Name:" value={receipt.studentName} />
          <ReceiptRow label="Student ID:" value={receipt.studentId} mono />
          <ReceiptRow label="Description:" value={receipt.description} />
          <ReceiptRow label="Transaction Date:" value={receipt.createdAt} mono />
          <div className="border-t border-dashed border-slate-700 pt-3 flex justify-between items-center"><span className="text-slate-400 text-sm font-bold">Paid Total:</span><span className="text-xl font-black text-emerald-400 font-mono">₹{receipt.amount}</span></div>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={() => { onShareWhatsapp(`💬 Simulated Whatsapp to Parent: Receipt ${receipt.id} generated. Amount ₹${receipt.amount} successfully paid for ${receipt.studentName}. Thank you!`); alert('Receipt share simulated over WhatsApp!'); }} className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Share WhatsApp</button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all">Close</button>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return <div className="flex justify-between"><span className="text-slate-400">{label}</span><span className={mono ? 'font-mono' : ''}>{value}</span></div>;
}