import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
 X, Filter, Trash2, RotateCcw,
 Download, Image as ImageIcon, Phone, Calendar, Award as AwardIcon, Check, Pencil, MessageSquareHeart
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../../../utils/customToast';
import { apiClient } from '../../../api/axiosInstance';
import { useHistory } from '../../../hooks/useHistory';
import { useTerms } from '../../../hooks/useTerms';
import { CATEGORY_COLORS, DEFAULT_AVATAR, DEFAULT_CLOSING_TRIBUTE, JUMUIYA_OPTIONS, JUMUIYA_COLORS, GROUP_OPTIONS, GROUP_COLORS } from '../constants/adminConstants';
import { UPLOAD_BASE, API_HISTORY, API_JUMUIYA_HISTORY, API_GROUP_HISTORY } from '../../../utils/officialsApi';
import { ConfirmDialog, type AffectedOfficial } from './ConfirmDialog';

// Community chair/vice-chair roles stored at the CSA level (the `officials`
// table) keyed by the group category used in the groups archive. These are
// merged into the groups history view for display only — restore/delete here
// operate on group_officials, so CSA rows must stay read-only.
const GROUP_TO_CSA_CATEGORY: Record<string, string> = {
  'Choir': 'Choir Officials',
  'Dancers': 'Liturgical Dancers',
};

interface HistoryModalProps {
 isOpen: boolean;
 onClose: () => void;
 activeOfficials: any[];
 activeTerm?: string;
 mode?: 'csa' | 'jumuiya' | 'groups';
 onEdit?: (official: any) => void;
}

export function HistoryModal({ isOpen, onClose, activeOfficials, activeTerm, mode = 'csa', onEdit }: HistoryModalProps) {
 const [termFilter, setTermFilter] = useState('all');
 const [categoryFilter, setCategoryFilter] = useState('all');
 const limit = 60;
 const queryClient = useQueryClient();

 // Per-term closing tribute (CSA only) — edited here, shown on the public history page
 const [closingDraft, setClosingDraft] = useState('');
 const [savingClosing, setSavingClosing] = useState(false);

 const handleSaveClosing = async () => {
   if (!termFilter || termFilter === 'all') return;
   setSavingClosing(true);
   try {
     await apiClient.put(`${API_HISTORY}/${termFilter}/closing-message`, { message: closingDraft });
     showSuccessToast('Tribute Saved', 'This closing message will appear under the term on the public history page.');
     queryClient.invalidateQueries({ queryKey: ['history'] });
   } catch (e: any) {
     showErrorToast('Save Failed', e.response?.data?.message || e.message || 'Could not save the message.');
   } finally {
     setSavingClosing(false);
   }
 };

 const getPhotoUrl = (photo: string | null | undefined) => {
 if (!photo) return DEFAULT_AVATAR;
 if (photo.startsWith('http') || photo.startsWith('data:') || photo.startsWith('blob:')) return photo;
 return `${UPLOAD_BASE}${photo.startsWith('/') ? '' : '/'}${photo}`;
 };

  const { terms } = useTerms();
  const { 
    history, meta, isLoading, restoreOfficials, deleteArchived, 
    bulkDelete, isRestoring, isBulkDeleting, isDeleting 
   } = useHistory({ 
    termId: termFilter === 'all' ? undefined : termFilter,
    onlyArchived: true,
    page: 1,
    limit,
    mode,
    category: (mode === 'jumuiya' || mode === 'groups') && categoryFilter !== 'all' ? categoryFilter : undefined,
  });

  // Merge CSA-level community chairs into the groups archive (display only).
  const [csaMerged, setCsaMerged] = useState<any[]>([]);
  useEffect(() => {
    if (!isOpen || mode !== 'groups') {
      setCsaMerged([]);
      return;
    }
    let cancelled = false;
    const validCsaCats = Object.values(GROUP_TO_CSA_CATEGORY);
    apiClient
      .get('/officials/term', { params: { only_archived: 'true', limit: 300 } })
      .then((res) => {
        if (cancelled) return;
        const rows = (Array.isArray(res.data?.data) ? res.data.data : []) as any[];
        setCsaMerged(
          rows
            .filter((o) => validCsaCats.includes(o.category))
            .map((o) => ({ ...o, id: `csa-${o.id}`, isCsa: true }))
        );
      })
      .catch(() => { if (!cancelled) setCsaMerged([]); });
    return () => { cancelled = true; };
  }, [isOpen, mode]);

  const displayedHistory = useMemo(() => {
    if (mode !== 'groups') return history;
    const matchesCategory = (o: any) => {
      if (categoryFilter === 'all') return true;
      if (o.category === categoryFilter) return true;
      if (o.isCsa && GROUP_TO_CSA_CATEGORY[categoryFilter] === o.category) return true;
      return false;
    };
    const matchesTerm = (o: any) => {
      if (termFilter === 'all') return true;
      if (o.isCsa) return String(o.election_term_id) === String(termFilter);
      return true; // group_officials rows are already term-filtered server-side
    };
    const combined = [...history, ...csaMerged].filter((o) => matchesCategory(o) && matchesTerm(o));
    const seen = new Set<string>();
    return combined.filter((o) => {
      const normPos = (o.position || '').toLowerCase().replace(/coordinator/g, 'chairperson').replace(/assistant /g, 'vice ');
      const key = `${(o.name || '').toLowerCase().trim()}_${o.election_term_id || o.term_of_service}_${normPos}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [history, csaMerged, categoryFilter, termFilter, mode]);

 useEffect(() => {
   if (!isOpen || mode !== 'csa') return;
   setClosingDraft(termFilter !== 'all' ? ((history[0] as any)?.closing_message || '') : '');
 }, [isOpen, mode, termFilter, history]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant: 'danger' | 'info' | 'success' | 'warning';
    affectedItems: AffectedOfficial[];
    onConfirm: () => Promise<void>;
  } | null>(null);

 if (!isOpen) return null;

 const toggleSelect = (id: number) => {
 setSelectedIds(prev => 
 prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
 );
 };

  const handleRestore = (ids: number[]) => {
  const officialsToRestore = history.filter(o => ids.includes(o.id));
  if (officialsToRestore.length === 0) return;

  const firstRestoreTerm = officialsToRestore[0].term_name || officialsToRestore[0].term_of_service;
  const allSameTerm = officialsToRestore.every(o => (o.term_name || o.term_of_service) === firstRestoreTerm);

  if (!allSameTerm) {
  showErrorToast("Restore Error", "Please only restore officials from a single term at a time.");
  return;
  }

  if (mode === 'csa' && activeOfficials.length > 0) {
  if (activeTerm && firstRestoreTerm && activeTerm !== firstRestoreTerm) {
  showErrorToast("Restore Error", `Please archive current officials from [${activeTerm}] before restoring officials from [${firstRestoreTerm}]`);
  return;
  }
  if (!activeTerm) {
  showErrorToast("Restore Error", "Please archive current officials before restoring historical records to maintain data consistency.");
  return;
  }
  }

  const affectedItems: AffectedOfficial[] = officialsToRestore.map(o => ({
    id: o.id,
    name: o.name,
    photoUrl: getPhotoUrl(o.photo),
    role: o.position,
    category: o.category
  }));

  setConfirmConfig({
    title: 'Restore Officials',
    message: `Are you sure you want to restore ${ids.length} official(s)? This will return them to active service on the main page.`,
    confirmText: 'Restore',
    variant: 'success',
    affectedItems,
    onConfirm: async () => {
      await restoreOfficials(ids);
      setSelectedIds([]);
    }
  });
  };

 const handleDownloadArchive = () => {
 if (!termFilter || termFilter === 'all') {
 showErrorToast('Download Error', 'Please select a specific term to download.');
 return;
 }
 const currentTermObj = terms.find(t => t.id.toString() === termFilter);
 const termOfService = currentTermObj ? currentTermObj.name : '';
 
  const historyBase = mode === 'jumuiya' ? API_JUMUIYA_HISTORY : mode === 'groups' ? API_GROUP_HISTORY : API_HISTORY;
 const url = `${historyBase}/${termFilter}/export?term_of_service=${encodeURIComponent(termOfService)}`;
 window.open(url, '_blank');
 };

  const handleDelete = (id: number) => {
  const officialToDelete = history.find(o => o.id === id);
  if (!officialToDelete) return;

  const affectedItems: AffectedOfficial[] = [{
    id: officialToDelete.id,
    name: officialToDelete.name,
    photoUrl: getPhotoUrl(officialToDelete.photo),
    role: officialToDelete.position,
    category: officialToDelete.category
  }];

  setConfirmConfig({
    title: 'Delete Official Record',
    message: 'Are you sure you want to permanently delete this archived official record? This action is permanent and cannot be undone.',
    confirmText: 'Delete Permanently',
    variant: 'danger',
    affectedItems,
    onConfirm: async () => {
      await deleteArchived(id);
    }
  });
  };

  const handleBulkDeleteAction = () => {
  const officialsToDelete = history.filter(o => selectedIds.includes(o.id));
  if (officialsToDelete.length === 0) return;

  const affectedItems: AffectedOfficial[] = officialsToDelete.map(o => ({
    id: o.id,
    name: o.name,
    photoUrl: getPhotoUrl(o.photo),
    role: o.position,
    category: o.category
  }));

  setConfirmConfig({
    title: 'Delete Selected Records',
    message: `Are you sure you want to permanently delete the ${selectedIds.length} selected archived official record(s)? This action is permanent and cannot be undone.`,
    confirmText: 'Delete Selected',
    variant: 'danger',
    affectedItems,
    onConfirm: async () => {
      await bulkDelete(selectedIds);
      setSelectedIds([]);
    }
  });
  };

  const handleBulkDelete = (ids: number[]) => {
  const officialsToDelete = history.filter(o => ids.includes(o.id));
  if (officialsToDelete.length === 0) return;

  const affectedItems: AffectedOfficial[] = officialsToDelete.map(o => ({
    id: o.id,
    name: o.name,
    photoUrl: getPhotoUrl(o.photo),
    role: o.position,
    category: o.category
  }));

  setConfirmConfig({
    title: 'Delete All Term Records',
    message: `Are you sure you want to permanently delete all ${ids.length} archived official record(s) for this term? This action is permanent and cannot be undone.`,
    confirmText: 'Delete All',
    variant: 'danger',
    affectedItems,
    onConfirm: async () => {
      await bulkDelete(ids);
      if (ids.length === selectedIds.length) setSelectedIds([]);
    }
  });
  };

 return (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
 <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden transition-colors">
 {/* Header */}
 <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 ">
 <div>
 <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
 <RotateCcw className="w-6 h-6 text-indigo-600 " />
 Archived Officials History
 </h3>
 <p className="text-sm text-gray-500 mt-1">View and manage records from previous election cycles</p>
 </div>
 <button onClick={onClose} className="p-2 hover:bg-white :bg-gray-700 rounded-full transition-colors border border-transparent hover:border-gray-200 :border-gray-600 shadow-sm">
 <X className="w-6 h-6 text-gray-400 " />
 </button>
 </div>

 {/* Toolbar */}
 <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-4 bg-white ">
 <div className="flex-1 min-w-[200px] relative">
 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 " />
 <select 
 value={termFilter} 
 onChange={e => setTermFilter(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-gray-50 hover:bg-white :bg-gray-900 transition-colors text-sm font-medium text-gray-900 "
 >
 <option value="all">All Terms</option>
  {terms
  .filter(t => mode === 'csa' ? Number(t.archived_csa_count || 0) > 0 : mode === 'groups' ? Number(t.archived_group_count || 0) > 0 : Number(t.archived_jumuiya_count || 0) > 0)
  .map(t => (
  <option key={t.id} value={t.id}>{t.year}</option>
  ))}
  </select>
  </div>

  {mode === 'jumuiya' || mode === 'groups' ? (
  <div className="flex-1 min-w-[200px] relative">
  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 " />
  <select 
  value={categoryFilter} 
  onChange={e => setCategoryFilter(e.target.value)}
  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-gray-50 hover:bg-white :bg-gray-900 transition-colors text-sm font-medium text-gray-900 "
  >
  <option value="all">{mode === 'groups' ? 'All Groups' : 'All Jumuiyas'}</option>
  {(mode === 'groups' ? GROUP_OPTIONS : JUMUIYA_OPTIONS).map(j => (
  <option key={j} value={j}>{j}</option>
  ))}
  </select>
  </div>
  ) : null}

 <div className="flex items-center gap-2">
 {!termFilter || termFilter === 'all' ? (
 <div className="text-xs text-gray-500 italic bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 ">
 Select a specific term to enable "Restore All" / "Delete All"
 </div>
 ) : (
 <>
 <button 
 onClick={handleDownloadArchive}
 className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-green-50 text-green-700 rounded-xl text-[11px] sm:text-sm font-bold hover:bg-green-100 :bg-green-900/30 transition-all border border-green-100 active:scale-95 flex-1 sm:flex-none"
 title="Download records as XLSX"
 >
 <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
 <span>Download</span>
 </button>
 <div className="h-6 w-px bg-gray-200 mx-1"></div>
 <button 
 onClick={() => handleRestore(history.map(o => o.id))} 
 disabled={isRestoring || history.length === 0}
 className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-indigo-600 text-white rounded-xl text-[11px] sm:text-sm font-bold hover:bg-indigo-700 :bg-indigo-600 transition-all shadow-md active:scale-95 disabled:opacity-50 flex-1 sm:flex-none"
 title="Restore all officials in this term"
 >
 <RotateCcw className="w-3.5 h-3.5 sm:w-4 h-4" />
 <span>Restore All</span>
 </button>
 <button 
 onClick={() => handleBulkDelete(history.map(o => o.id))}
 disabled={isBulkDeleting || history.length === 0}
 className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[11px] sm:text-sm font-bold hover:bg-red-100 :bg-red-900/30 transition-all border border-red-100 active:scale-95 disabled:opacity-50 flex-1 sm:flex-none"
 title="Delete all officials in this term"
 >
 <Trash2 className="w-3.5 h-3.5 sm:w-4 h-4" />
 <span>Delete All</span>
 </button>
 </>
 )}

 {selectedIds.length > 0 && (
 <>
 <div className="h-6 w-px bg-gray-200 mx-1"></div>
 <button 
 onClick={() => handleRestore(selectedIds)}
 disabled={isRestoring}
 className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-200 :bg-indigo-900/50 transition-all active:scale-95 disabled:opacity-50"
 >
 Restore Selected ({selectedIds.length})
 </button>
 <button 
 onClick={handleBulkDeleteAction}
 disabled={isBulkDeleting}
 className="p-2 text-red-600 hover:bg-red-50 :bg-red-900/30 rounded-xl transition-all disabled:opacity-50"
 title="Delete Selected"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 </div>
 </div>

 {/* Closing Tribute Editor (CSA only) */}
 {mode === 'csa' && termFilter !== 'all' && !isLoading && history.length > 0 && (
 <div className="px-4 py-3 border-b border-gray-100 bg-indigo-50/40">
   <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1.5">
     <MessageSquareHeart className="w-3.5 h-3.5" />
     Closing Tribute — appears under this term's cards on the public history page
   </label>
   <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 mt-1.5">
     <textarea
       value={closingDraft}
       onChange={(e) => setClosingDraft(e.target.value)}
       rows={2}
       maxLength={1000}
       placeholder={DEFAULT_CLOSING_TRIBUTE}
       className="flex-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white placeholder:italic placeholder:text-gray-400"
     />
     <button
       onClick={handleSaveClosing}
       disabled={savingClosing}
       className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm w-full sm:w-auto"
     >
       {savingClosing ? 'Saving...' : 'Save Tribute'}
     </button>
   </div>
 </div>
 )}

 {/* Content */}
 <div className="flex-1 overflow-auto bg-gray-50/30 p-6">
  {isLoading ? (
  <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
  <p className="font-medium animate-pulse ">Loading archive data...</p>
  </div>
  ) : displayedHistory.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-200 ">
 <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
 <p className="font-medium">No archived records found</p>
 <p className="text-sm">Try changing the term filter or check back later</p>
 </div>
 ) : (
  <div className="grid grid-cols-1 gap-4">
   {displayedHistory.map((o, idx) => (
  <div key={o.id} className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md flex items-center gap-4 group ${!o.isCsa && selectedIds.includes(o.id) ? 'border-indigo-300 ring-2 ring-indigo-50 bg-indigo-50/10 ' : 'border-gray-200 '}`}>
  <div className="flex flex-col items-center gap-1 shrink-0">
  <div className="text-xs font-bold text-gray-400">{idx + 1}</div>
  <div className="relative flex items-center">
  {o.isCsa ? (
  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100">CSA</span>
  ) : (
  <input 
  type="checkbox" 
  checked={selectedIds.includes(o.id)}
  onChange={() => toggleSelect(o.id)}
  className="peer w-5 h-5 opacity-0 absolute cursor-pointer"
  />
  )}
  {!o.isCsa && (
  <div className={`w-5 h-5 border-2 rounded-lg bg-white transition-all flex items-center justify-center ${selectedIds.includes(o.id) ? 'border-indigo-600' : 'border-gray-300'}`}>
    <Check className={`w-4 h-4 text-indigo-600 transition-all duration-200 stroke-[3] ${selectedIds.includes(o.id) ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
  </div>
  )}
  </div>
  </div>
 
 <div className="relative shrink-0">
 <img 
 src={getPhotoUrl(o.photo)} 
 alt={o.name} 
 className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm"
 onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
 />
 <div className="absolute -top-1 -right-1 p-1 bg-white rounded-full shadow-sm">
 <div className="w-3 h-3 rounded-full bg-gray-400 "></div>
 </div>
 </div>

 <div className="flex-1 min-w-0">
 <h4 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 :text-indigo-400 transition-colors">{o.name}</h4>
 <div className="flex flex-wrap items-center gap-3 mt-1">
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${mode === 'csa' ? (CATEGORY_COLORS[o.category] || 'from-gray-500 to-gray-600 shadow-sm') : mode === 'groups' ? (GROUP_COLORS[o.category] || 'from-teal-500 to-teal-600') : (JUMUIYA_COLORS[o.category] || 'from-indigo-500 to-indigo-600')}`}>
 {o.category}
 </span>
 <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 ">
 <AwardIcon className="w-3 h-3 text-indigo-500" />
 {o.position}
 </div>
 <div className="flex items-center gap-1 text-xs text-gray-400 ">
 <Calendar className="w-3 h-3" />
 {o.term_name || o.term_of_service || 'Unknown Term'}
 </div>
 </div>
 {o.contact && (
 <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded-lg">
 <Phone className="w-3 h-3" />
 {o.contact}
 </div>
 )}
 </div>

  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
  {!o.isCsa && onEdit && (
  <button 
  onClick={() => onEdit(o)}
  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
  title="Edit"
  >
  <Pencil className="w-4 h-4" />
  </button>
  )}
  {!o.isCsa && (
  <button 
  onClick={() => handleRestore([o.id])}
  className="p-2 text-indigo-600 hover:bg-indigo-50 :bg-indigo-900/50 rounded-lg transition-all"
  title="Restore"
  >
  <RotateCcw className="w-4 h-4" />
  </button>
  )}
  {!o.isCsa && (
  <button 
  onClick={() => handleDelete(o.id)}
  className="p-2 text-red-600 hover:bg-red-50 :bg-red-900/30 rounded-lg transition-all"
  title="Delete Permanently"
  >
  <Trash2 className="w-4 h-4" />
  </button>
  )}
  </div>
 </div>
 ))}
 </div>
 )}
 </div>

  <ConfirmDialog
    isOpen={confirmConfig !== null}
    title={confirmConfig?.title || ''}
    message={confirmConfig?.message || ''}
    confirmText={confirmConfig?.confirmText}
    cancelText={confirmConfig?.cancelText}
    variant={confirmConfig?.variant}
    isLoading={isRestoring || isDeleting || isBulkDeleting}
    affectedItems={confirmConfig?.affectedItems || []}
    onConfirm={async () => {
      if (confirmConfig) {
        await confirmConfig.onConfirm();
        setConfirmConfig(null);
      }
    }}
    onClose={() => setConfirmConfig(null)}
  />
  </div>
  </div>
 );
}
