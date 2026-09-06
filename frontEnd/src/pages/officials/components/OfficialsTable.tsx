import React from 'react';
import { Edit2, Trash2, Phone, ChevronDown, ChevronRight, Search } from 'lucide-react';
import type { Official } from '../../../hooks/useOfficials';
import { CATEGORY_ORDER, CATEGORY_COLORS, POSITION_RANK, DEFAULT_AVATAR, JUMUIYA_OPTIONS, JUMUIYA_COLORS, JUMUIYA_ROLES, GROUP_OPTIONS, GROUP_COLORS, POSITIONS_BY_GROUP, GROUP_POSITION_RANK } from '../constants/adminConstants';
import { UPLOAD_BASE } from '../../../utils/officialsApi';

interface OfficialsTableProps {
  officials: Official[];
  searchTerm: string;
  onSearchChange?: (val: string) => void;
  onEdit: (official: Official) => void;
  onDelete: (official: Official) => void;
  isDeleting: number | boolean;
  displayTerm?: string;
  mode?: 'csa' | 'jumuiya' | 'groups';
}

export function OfficialsTable({ officials, searchTerm, onSearchChange, onEdit, onDelete, isDeleting, displayTerm, mode = 'csa' }: OfficialsTableProps) {
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null);

  const filteredOfficials = React.useMemo(() => {
  const q = searchTerm.trim().toLowerCase();
  const filtered = officials.filter(o => {
  if (!q) return true;
  return (
  (o.name || '').toLowerCase().includes(q) ||
  (o.category || '').toLowerCase().includes(q) ||
  (o.position || '').toLowerCase().includes(q)
  );
  });

  const grouped: Record<string, Official[]> = {};
  filtered.forEach(o => {
  const rawCategory = o.category || 'Other';
  const c = rawCategory === 'Rosary' ? 'Rosary Coordinators' : rawCategory === 'Liturgist' ? 'Liturgists' : rawCategory;
  (grouped[c] ||= []).push(o);
  });

  Object.keys(grouped).forEach(cat => {
  if (mode === 'csa') {
  grouped[cat].sort((a, b) => (POSITION_RANK[a.position] ?? 9999) - (POSITION_RANK[b.position] ?? 9999));
  } else if (mode === 'jumuiya') {
  grouped[cat].sort((a, b) => (JUMUIYA_ROLES.indexOf(a.position)) - (JUMUIYA_ROLES.indexOf(b.position)));
  } else {
  grouped[cat].sort((a, b) => (GROUP_POSITION_RANK[cat]?.[a.position] ?? 9999) - (GROUP_POSITION_RANK[cat]?.[b.position] ?? 9999));
  }
  });

  const sorted: Official[] = [];
  const orderedCategories = mode === 'csa' ? CATEGORY_ORDER : mode === 'jumuiya' ? JUMUIYA_OPTIONS : GROUP_OPTIONS;
  
  orderedCategories.forEach(cat => {
  if (grouped[cat]) sorted.push(...grouped[cat]);
  });
  Object.keys(grouped).forEach(cat => {
  if (!orderedCategories.includes(cat)) sorted.push(...grouped[cat]);
  });

  return sorted;
  }, [officials, searchTerm, mode]);

 const getPhotoUrl = (photo: string | null | undefined) => {
 if (!photo) return DEFAULT_AVATAR;
 if (photo.startsWith('http') || photo.startsWith('data:') || photo.startsWith('blob:')) return photo;
 return `${UPLOAD_BASE}${photo.startsWith('/') ? '' : '/'}${photo}`;
 };

 const renderTableRows = (officialsList: Official[]) => {
 if (officialsList.length === 0) {
 return (
 <tr>
 <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic bg-gray-50/50 ">
 No officials found.
 </td>
 </tr>
 );
 }
 return officialsList.map((o) => (
 <tr key={o.id} className="hover:bg-gray-50 :bg-gray-700/50 transition-colors group">
 <td className="px-6 py-4">
 <div className="flex items-center gap-4">
 <div className="relative">
 <img 
 src={getPhotoUrl(o.photo)} 
 alt={o.name} 
 className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
 onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
 />
 <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${o.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
 </div>
 <div>
 <div className="font-bold text-gray-900 group-hover:text-blue-600 :text-blue-400 transition-colors">{o.name}</div>
  <span className={`inline-block px-2.5 py-0.5 mt-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${mode === 'csa' ? (CATEGORY_COLORS[o.category] || 'from-gray-500 to-gray-600') : mode === 'jumuiya' ? (JUMUIYA_COLORS[o.category] || 'from-indigo-500 to-indigo-600') : (GROUP_COLORS[o.category] || 'from-teal-500 to-teal-600')}`}>
 {o.category}
 </span>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="text-sm font-semibold text-gray-700 ">{o.position}</div>
 {o.term_of_service && (
 <div className="text-xs text-gray-500 mt-0.5">{o.term_of_service}</div>
 )}
 </td>
 <td className="px-6 py-4">
 {o.contact ? (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200 ">
 <Phone className="w-3 h-3 text-gray-500 " />
 {o.contact}
 </span>
 ) : (
 <span className="text-gray-400 italic text-xs">No contact</span>
 )}
 </td>
 <td className="px-6 py-4 text-center">
 <div className="flex items-center justify-center gap-1.5">
 <button 
 onClick={() => onEdit(o)} 
 className="p-1.5 text-blue-600 hover:bg-blue-50 :bg-blue-900/30 rounded-md transition-all active:scale-90"
 title="Edit"
 >
 <Edit2 className="w-4 h-4" />
 </button>
 <button 
 onClick={() => onDelete(o)} 
 disabled={isDeleting === o.id}
 className="p-1.5 text-red-600 hover:bg-red-50 :bg-red-900/30 rounded-md transition-all disabled:opacity-50 active:scale-90"
 title="Delete"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ));
 };

 const renderTableHeader = () => (
 <thead>
 <tr className="bg-gray-50 text-gray-600 text-[10px] sm:text-xs uppercase tracking-wider">
 <th className="px-4 sm:px-6 py-4 font-bold border-b w-2/5">Official</th>
 <th className="px-4 sm:px-6 py-4 font-bold border-b w-1/4 text-center">Position</th>
 <th className="px-4 sm:px-6 py-4 font-bold border-b w-1/4 text-center">Contact</th>
 <th className="px-4 sm:px-6 py-4 font-bold border-b text-center w-[10%]">Actions</th>
 </tr>
 </thead>
 );

 return (
 <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-100 transition-colors">
 <div className="bg-blue-600 p-6 text-white text-center">
 <h2 className="text-2xl font-bold">
 Current Officials ({filteredOfficials.length}) {officials.length > 0 && displayTerm && `- ${displayTerm}`}
 </h2>
 </div>

 {onSearchChange && (
   <div className="p-4 bg-white border-b border-gray-100">
     <div className="relative max-w-md mx-auto xl:mx-0">
       <input 
         type="text"
         placeholder="Search officials..."
         value={searchTerm}
         onChange={e => onSearchChange(e.target.value)}
         className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-gray-900 transition-all outline-none font-medium"
       />
       <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 -mt-1 w-5 h-5 text-gray-400 pointer-events-none" />
     </div>
   </div>
 )}

  <div className="overflow-x-auto scrollbar-hide flex-1">
  {mode === 'csa' ? (
  <table className="w-full text-left border-collapse min-w-[700px]">
  {renderTableHeader()}
  <tbody className="divide-y divide-gray-100 ">
  {renderTableRows(filteredOfficials)}
  </tbody>
  </table>
  ) : (
  <div className="flex flex-col">
  {(mode === 'jumuiya' ? JUMUIYA_OPTIONS : GROUP_OPTIONS).map((catName) => {
  const catOfficials = filteredOfficials.filter(o => o.category === catName);
  const isExpanded = expandedCategory === catName;
  const hasResults = catOfficials.length > 0;
  const shouldExpand = (searchTerm && hasResults) ? true : isExpanded;
  const catColor = mode === 'jumuiya' ? (JUMUIYA_COLORS[catName] || 'from-indigo-500 to-indigo-600') : (GROUP_COLORS[catName] || 'from-teal-500 to-teal-600');
  const roleLimit = mode === 'jumuiya' ? JUMUIYA_ROLES.length : (POSITIONS_BY_GROUP[catName]?.length || 0);

  if (searchTerm && !hasResults) return null;

  return (
  <div key={catName} className="border-b border-gray-100 last:border-0">
  <button 
  onClick={() => setExpandedCategory(shouldExpand ? null : catName)}
  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 :bg-gray-700 transition-colors text-left"
  >
  <div className="flex items-center gap-3">
  {shouldExpand ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
  <div className="font-bold text-gray-900 w-32 sm:w-auto">{catName}</div>
  </div>
  <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold text-white bg-gradient-to-r shadow-sm ${catColor}`}>
  {catOfficials.length} / {roleLimit} Roles
  </span>
  </button>
  {shouldExpand && (
  <div className="bg-white border-t border-gray-100 overflow-x-auto">
  <table className="w-full text-left border-collapse min-w-[700px]">
  {renderTableHeader()}
  <tbody className="divide-y divide-gray-100 ">
  {renderTableRows(catOfficials)}
  </tbody>
  </table>
  </div>
  )}
  </div>
  );
  })}
  {filteredOfficials.length === 0 && (
  <div className="px-6 py-12 text-center text-gray-500 italic bg-gray-50/50 ">
  No officials found matching your search.
  </div>
  )}
  </div>
  )}
  </div>
 </div>
 );
}
