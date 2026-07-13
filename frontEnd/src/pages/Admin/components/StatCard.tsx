import React from 'react';

interface StatCardProps {
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
  label: string;
  value: string | number;
  sublabel?: string;
}

export default function StatCard({ icon: Icon, iconBg = 'bg-blue-100', iconColor = 'text-blue-600', label, value, sublabel }: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`${iconBg} p-3 rounded-xl ${iconColor}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-slate-800 mt-0.5">{value}</p>
          {sublabel && <p className="text-[11px] text-slate-400 mt-0.5">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}
