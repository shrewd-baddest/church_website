import { Users, History, Calendar, Award } from 'lucide-react';
import type { ElectionTerm } from '../../../hooks/useTerms';

interface DashboardStatsProps {
 officialsCount: number;
 archivedCount: number;
 currentTerm: ElectionTerm | null;
 displayTerm?: string;
}

export function DashboardStats({ officialsCount, archivedCount, currentTerm, displayTerm }: DashboardStatsProps) {
 const stats = [
 {
 label: 'Active Officials',
 value: officialsCount,
 icon: Users,
 color: 'bg-blue-50 text-blue-600',
 },
 {
 label: 'Archived Records',
 value: archivedCount,
 icon: History,
 color: 'bg-purple-50 text-purple-600',
 },
 {
 label: 'Current Term',
 value: officialsCount > 0 ? (displayTerm || currentTerm?.year || 'None') : 'None',
 icon: Calendar,
 color: 'bg-green-50 text-green-600',
 },
 {
 label: 'Current Status',
 value: currentTerm ? 'Active Cycle' : 'In-between',
 icon: Award,
 color: 'bg-orange-50 text-orange-600',
 },
 ];

 return (
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
 {stats.map((stat) => (
 <div key={stat.label} className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-4 transition-colors">
 <div className={`p-2 sm:p-3 rounded-lg ${stat.color} `}>
 <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
 </div>
 <div className="min-w-0">
 <p className="text-[10px] sm:text-sm font-medium text-gray-500 truncate">{stat.label}</p>
 <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
 </div>
 </div>
 ))}
 </div>
 );
}
