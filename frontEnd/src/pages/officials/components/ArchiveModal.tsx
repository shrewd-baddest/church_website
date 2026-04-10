import React, { useState } from 'react';
import { AlertTriangle, Calendar, Info, CheckCircle2, Check } from 'lucide-react';
import type { ElectionTerm } from '../../../hooks/useTerms';
import { JUMUIYA_OPTIONS } from '../constants/adminConstants';

interface ArchiveModalProps {
 isOpen: boolean;
 onClose: () => void;
 onConfirm: (payload: any) => Promise<void>;
 isArchiving: boolean;
 officialsCount: number;
 electionTerms: ElectionTerm[];
 currentTerm: ElectionTerm | null;
 mode?: 'csa' | 'jumuiya';
 jumuiyaCountMap?: Record<string, number>;
 activeTerm?: string;
}

export function ArchiveModal({ 
 isOpen, 
 onClose, 
 onConfirm, 
 isArchiving, 
 officialsCount, 
 currentTerm,
 mode = 'csa',
 jumuiyaCountMap = {},
 activeTerm
}: ArchiveModalProps) {
 const [useExistingTerm, setUseExistingTerm] = useState(true);
 const [termName, setTermName] = useState('');
 const [termYear, setTermYear] = useState('');
 const [termStartDate, setTermStartDate] = useState(new Date().toISOString().split('T')[0]);
 const [termEndDate] = useState('');
 const [termDescription] = useState('');
 const [confirmed, setConfirmed] = useState(false);
 const [selectedJumuiya, setSelectedJumuiya] = useState('all');

 React.useEffect(() => {
 if (isOpen) {
 const inferredYear = activeTerm || currentTerm?.year || new Date().getFullYear().toString();
 const inferredName = activeTerm ? `${activeTerm} Committee` : (currentTerm?.name || `${inferredYear} Committee`);
 
 setTermYear(inferredYear);
 setTermName(inferredName);

 if (activeTerm && currentTerm && activeTerm !== currentTerm.year.toString()) {
 setUseExistingTerm(false);
 } else {
 setUseExistingTerm(true);
 }
 }
 }, [isOpen, currentTerm, activeTerm]);

 if (!isOpen) return null;

 const handleSubmit = async () => {
 if (!useExistingTerm && (!termName || !termYear || !termStartDate)) return;
 
 const payload: any = {};
 if (useExistingTerm) {
 payload.election_term_id = currentTerm?.id;
 } else {
 payload.name = termName;
 payload.year = termYear;
 payload.start_date = termStartDate;
 if (termEndDate) payload.end_date = termEndDate;
 if (termDescription) payload.description = termDescription;
 }

 if (mode === 'jumuiya') {
 payload.isJumuiya = true;
 if (selectedJumuiya !== 'all') {
 payload.category = selectedJumuiya;
 }
 }

 await onConfirm(payload);
 onClose();
 };

 const isInvalid = (!useExistingTerm && (!termName || !termYear || !termStartDate)) || !confirmed || isArchiving;
 
 const displayCount = mode === 'jumuiya' && selectedJumuiya !== 'all' 
 ? (jumuiyaCountMap[selectedJumuiya] || 0) 
 : officialsCount;

 return (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
 <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] transition-colors text-center">
 <div className="bg-amber-50 p-6 border-b border-amber-100 flex items-start gap-4 text-left">
 <div className="p-3 bg-amber-100 rounded-xl text-amber-600 ">
 <AlertTriangle className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-xl font-bold text-gray-900 ">Archive Current Officials</h3>
 <p className="text-sm text-gray-600 mt-1">
 This will move <span className="font-bold text-amber-700 ">{displayCount}</span> active officials to history. They will no longer appear on the main page.
 </p>
 </div>
 </div>

 <div className="p-6 overflow-y-auto space-y-6 text-left">
 {mode === 'jumuiya' && (
 <section className="space-y-3">
 <h4 className="font-bold text-gray-900 ">Target Jumuiya</h4>
 <select
 value={selectedJumuiya}
 onChange={(e) => setSelectedJumuiya(e.target.value)}
 className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 "
 >
 <option value="all">All Jumuiyas ({officialsCount} officials)</option>
 {JUMUIYA_OPTIONS.map(j => (
 <option key={j} value={j}>{j} ({jumuiyaCountMap[j] || 0} officials)</option>
 ))}
 </select>
 </section>
 )}

 <section className="space-y-4">
 <h4 className="flex items-center gap-2 font-bold text-gray-900 ">
 <Calendar className="w-5 h-5 text-blue-600 " />
 Target Election Term
 </h4>
 
 <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-xl border border-gray-200 ">
 <button 
 onClick={() => setUseExistingTerm(true)}
 className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${useExistingTerm ? 'bg-white shadow-sm text-blue-600 ' : 'text-gray-500 hover:text-gray-700 :text-gray-300'}`}
 >
 Existing Term
 </button>
 <button 
 onClick={() => setUseExistingTerm(false)}
 className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${!useExistingTerm ? 'bg-white shadow-sm text-blue-600 ' : 'text-gray-500 hover:text-gray-700 :text-gray-300'}`}
 >
 New Term
 </button>
 </div>

 {useExistingTerm ? (
 <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
 <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
 <Info className="w-4 h-4" />
 Active Term: {currentTerm?.name || 'None'}
 </div>
 <p className="text-xs text-blue-600 mt-1 ml-6">
 Officials will be archived under the currently active {currentTerm?.year || termYear} cycle.
 </p>
 {currentTerm && activeTerm && currentTerm.year !== activeTerm && (
 <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
 <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
 <p className="text-xs text-amber-800 ">
 <strong>Term Mismatch Detected:</strong> Your official records are tagged with <span className="font-bold underline">{activeTerm}</span>, but the system's global "Active Term" is currently set to <span className="font-bold underline">{currentTerm.year}</span>. 
 <br /><br />
 To keep records clean, use <strong>"New Term"</strong> above to archive them under the correct {activeTerm} period.
 </p>
 </div>
 )}
 </div>
 ) : (
 <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
 <div className="space-y-1">
 <label className="text-xs font-bold text-gray-500 uppercase px-1">Term Name *</label>
 <input 
 type="text" 
 value={termName} 
 onChange={e => setTermName(e.target.value)} 
 placeholder="e.g. 2024-2025 Committee" 
 className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 " 
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1">
 <label className="text-xs font-bold text-gray-500 uppercase px-1">Year *</label>
 <input 
 type="text" 
 value={termYear} 
 onChange={e => setTermYear(e.target.value)} 
 className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 " 
 />
 </div>
 <div className="space-y-1">
 <label className="text-xs font-bold text-gray-500 uppercase px-1">Start Date *</label>
 <input 
 type="date" 
 value={termStartDate} 
 onChange={e => setTermStartDate(e.target.value)} 
 className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 " 
 />
 </div>
 </div>
 </div>
 )}
 </section>

 <label className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-white :bg-gray-900 transition-colors group">
 <div className="relative flex items-center mt-0.5">
 <input 
 type="checkbox" 
 checked={confirmed} 
 onChange={e => setConfirmed(e.target.checked)} 
 className="peer w-5 h-5 opacity-0 absolute cursor-pointer" 
 />
 <div className={`w-5 h-5 border-2 rounded-md bg-white transition-all flex items-center justify-center ${confirmed ? 'border-blue-600' : 'border-gray-300'}`}>
   <Check className={`w-4 h-4 text-blue-600 transition-all duration-200 stroke-[3] ${confirmed ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
 </div>
 </div>
 <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 :text-gray-100 transition-colors">
 I acknowledge that this action is permanent and will move all current officials to the history records.
 </span>
 </label>
 </div>

 <div className="p-6 border-t border-gray-100 flex gap-3">
 <button 
 onClick={onClose} 
 className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 :bg-gray-600 transition-colors"
 >
 Cancel
 </button>
 <button 
 onClick={handleSubmit} 
 disabled={isInvalid} 
 className={`flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${isInvalid ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 :bg-blue-600 active:scale-[0.98]'}`}
 >
 {isArchiving ? (
 <>
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
 Archiving...
 </>
 ) : (
 <>
 <CheckCircle2 className="w-5 h-5" />
 Confirm Archive
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 );
}
