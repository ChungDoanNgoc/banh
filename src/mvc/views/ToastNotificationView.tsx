import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  toast: { message: string; type: 'success' | 'error' } | null;
  onClose: () => void;
}

export const ToastNotificationView: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 border ${
      isSuccess 
        ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' 
        : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
    }`}>
      {isSuccess ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
      )}
      <span className="font-medium text-xs sm:text-sm">{toast.message}</span>
      <button 
        onClick={onClose}
        className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4 opacity-70" />
      </button>
    </div>
  );
};
