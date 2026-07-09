import { MessageSquare } from 'lucide-react';

interface WhatsappToastProps {
  message: string;
  visible: boolean;
}

export function WhatsappToast({ message, visible }: WhatsappToastProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed top-6 right-6 z-50 max-w-md w-full glass-card border border-emerald-500/30 bg-emerald-950/80 p-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 scale-100 animate-pulse">
      <div className="flex gap-3">
        <div className="bg-emerald-500 text-slate-900 rounded-full p-2 h-fit flex items-center justify-center">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Meta API WhatsApp Message Mock</span>
            <span className="text-xs text-slate-400">Just Now</span>
          </div>
          <p className="text-slate-200 text-sm mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}