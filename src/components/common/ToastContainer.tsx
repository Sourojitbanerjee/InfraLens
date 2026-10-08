import React from 'react';
import { useInfra } from '../../context/InfraContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useInfra();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icon = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
          info: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
        }[toast.type];

        const borderStyle = {
          success: 'border-emerald-500/30 bg-[#0A1612]',
          warning: 'border-amber-500/30 bg-[#19140A]',
          error: 'border-rose-500/30 bg-[#1A0A0E]',
          info: 'border-cyan-500/30 bg-[#09151F]',
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border ${borderStyle} text-slate-100 shadow-2xl text-xs font-mono transition-all animate-in fade-in slide-in-from-bottom-2`}
          >
            <div className="flex items-center gap-2.5 mr-2">
              {icon}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
