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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <Icon size={20} />
          </div>
        )}
        <div>
          <h3 className="text-lg font-black text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
