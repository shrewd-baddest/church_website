import React from 'react';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 mb-3">
        <Icon size={20} />
      </div>
      <h4 className="text-sm font-bold text-slate-500">{title}</h4>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
