import React from 'react';
import { RefreshCcw } from 'lucide-react';

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function PanelHeader({ title, subtitle, icon: Icon, actions, onRefresh, loading }: PanelHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
            <Icon size={15} />
          </div>
        )}
        <div>
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
