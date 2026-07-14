import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
    id: number;
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContainerProps {
    toasts: ToastMessage[];
    onDismiss?: (id: number) => void;
}

const typeStyles: Record<string, { bg: string, border: string, icon: any, iconColor: string }> = {
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-600' },
    error:   { bg: 'bg-rose-50',    border: 'border-rose-200',    icon: XCircle,     iconColor: 'text-rose-600' },
    info:    { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: Info,        iconColor: 'text-blue-600' },
    warning: { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: AlertCircle, iconColor: 'text-amber-600' },
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2.5 w-full max-w-md px-4 pointer-events-none">
            {toasts.map((toast) => {
                const style = typeStyles[toast.type || 'info'];
                const Icon = style.icon;
                return (
                    <div
                        key={toast.id}
                        className={`${style.bg} ${style.border} border rounded-2xl shadow-xl px-5 py-4 flex items-start gap-3 pointer-events-auto animate-in slide-in-from-top-2 fade-in duration-300`}
                    >
                        <Icon size={20} className={`${style.iconColor} shrink-0 mt-0.5`} />
                        <p className="text-sm font-semibold text-slate-800 leading-relaxed flex-1">{toast.message}</p>
                        {onDismiss && (
                            <button onClick={() => onDismiss(toast.id)} className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-all shrink-0">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
