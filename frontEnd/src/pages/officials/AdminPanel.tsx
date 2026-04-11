import { useState, useMemo } from 'react';
import { Download, Share2, History, LayoutDashboard, Search, Archive, Check } from 'lucide-react';

import { useOfficials } from '../../hooks/useOfficials';
import type { Official } from '../../hooks/useOfficials';
import { useJumuiyaOfficials } from '../../hooks/useJumuiyaOfficials';
import { useTerms } from '../../hooks/useTerms';
import { API_BASE, API_JUMUIYA_BASE } from '../../utils/officialsApi';

import { DashboardStats } from './components/DashboardStats';
import { OfficialsTable } from './components/OfficialsTable';
import { OfficialFormSection } from './components/OfficialFormSection';
import { EditOfficialModal } from './components/EditOfficialModal';
import { ArchiveModal } from './components/ArchiveModal';
import { HistoryModal } from './components/HistoryModal';
import { ShareModal } from './components/ShareModal';

export default function AdminPanel() {
  // Queries & Mutations
  const { 
    officials, isLoading: isLoadingOfficials, 
    addOfficial, isAdding, 
    updateOfficial, isUpdating, 
    deleteOfficial, isDeleting 
  } = useOfficials();

  const { 
    terms, currentTerm, archiveOfficials, isArchiving 
  } = useTerms();

  const jumuiyaApi = useJumuiyaOfficials({ termId: currentTerm?.id });


  // Local UI State
  const [adminMode, setAdminMode] = useState<'csa' | 'jumuiya'>(() => {
    return (localStorage.getItem('admin_mode') as 'csa' | 'jumuiya') || 'csa';
  });

  const handleModeChange = (mode: 'csa' | 'jumuiya') => {
    setAdminMode(mode);
    localStorage.setItem('admin_mode', mode);
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOfficial, setEditingOfficial] = useState<Official | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  const [downloadFields, setDownloadFields] = useState({
    name: true,
    category: true,
    position: true,
    contact: true,
  });

  // Derived State
  const activeOfficialsList = adminMode === 'csa' ? officials : (jumuiyaApi.officials as Official[]);
  const isListLoading = adminMode === 'csa' ? isLoadingOfficials : jumuiyaApi.isLoading;
  const isListAdding = adminMode === 'csa' ? isAdding : jumuiyaApi.isAdding;
  const isListDeleting = adminMode === 'csa' ? isDeleting : jumuiyaApi.isDeleting;
  const isListUpdating = adminMode === 'csa' ? isUpdating : jumuiyaApi.isUpdating;

  const displayTerm = useMemo(() => {
    // Combine both lists to find the most recent term of service
    const allAdded = [...officials, ...(jumuiyaApi.officials as Official[])];
    if (allAdded.length > 0) {
      const termStrings = Array.from(new Set(allAdded.map(o => o.term_of_service).filter(Boolean)));
      if (termStrings.length > 0) return termStrings[0];
    }
    return currentTerm?.year || currentTerm?.name || '';
  }, [officials, jumuiyaApi.officials, currentTerm]);

  const jumuiyaCountMap = useMemo(() => {
    if (adminMode !== 'jumuiya') return {};
    return activeOfficialsList.reduce((acc: Record<string, number>, official) => {
      const cat = official.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
  }, [activeOfficialsList, adminMode]);

  // Handlers
  const handleDownload = async () => {
    const selectedFields = Object.entries(downloadFields)
      .filter(([_, v]) => v)
      .map(([k, _]) => k)
      .join(',');

    const baseUrl = adminMode === 'csa' ? API_BASE : API_JUMUIYA_BASE;
    const url = `${baseUrl}/export?fields=${selectedFields}${displayTerm ? `&term_of_service=${displayTerm}` : ''}`;
    window.open(url, '_blank');
  };

  const handleDelete = async (official: Official) => {
    if (window.confirm(`Are you sure you want to delete ${official.name}?`)) {
      if (adminMode === 'csa') {
        await deleteOfficial(official.id);
      } else {
        await jumuiyaApi.deleteOfficial(official.id);
      }
    }
  };

  const handleAdd = async (fd: FormData) => {
    if (adminMode === 'csa') {
       await addOfficial(fd);
    } else {
       await jumuiyaApi.addOfficial(fd);
    }
  };

  const handleUpdate = async (id: number, fd: FormData) => {
    if (adminMode === 'csa') {
       await updateOfficial({id, formData: fd});
    } else {
       await jumuiyaApi.updateOfficial({id, formData: fd});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <LayoutDashboard className="w-10 h-10 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-500 font-medium mt-1">Church Symbols Association Official Management System</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-white text-gray-700 font-bold rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all active:scale-95 text-xs sm:text-base"
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              <span>History</span>
            </button>
            <button 
              onClick={() => setIsArchiveOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 text-sm sm:text-base"
            >
              <Archive className="w-5 h-5" />
              <span className="xs:hidden">Archive</span>
              <span className="hidden xs:inline">Archive Term</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <DashboardStats 
          officialsCount={activeOfficialsList.length} 
          archivedCount={adminMode === 'csa' 
            ? Number(currentTerm?.archived_csa_count || 0) 
            : Number(currentTerm?.archived_jumuiya_count || 0)
          } 
          currentTerm={currentTerm} 
          displayTerm={displayTerm}
        />

        {/* Mode Switcher */}
        <div className="flex items-center justify-center mb-8">
           <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-1 overflow-hidden transition-colors">
              <button 
                onClick={() => handleModeChange('csa')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${adminMode === 'csa' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                 CSA Officials
              </button>
              <button 
                onClick={() => handleModeChange('jumuiya')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${adminMode === 'jumuiya' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                 Jumuiya Officials
              </button>
           </div>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-8">
          
          {/* Form Section */}
          <OfficialFormSection 
            onSubmit={handleAdd}
            isSubmitting={isListAdding}
            displayTerm={displayTerm}
            officialsExist={activeOfficialsList.length > 0}
            mode={adminMode}
            allOfficials={activeOfficialsList}
          />

          {/* Table Controls (Search & Export) */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6 transition-colors">
            <div className="relative flex-1 max-w-full xl:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text"
                placeholder="Search officials..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-gray-900 transition-all outline-none font-medium"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 xl:gap-8 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {Object.entries(downloadFields).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={value} 
                        onChange={e => setDownloadFields({...downloadFields, [key]: e.target.checked})}
                        className="peer w-5 h-5 opacity-0 absolute cursor-pointer" 
                      />
                      <div className={`w-5 h-5 border-2 rounded-md bg-white transition-all flex items-center justify-center ${value ? 'border-blue-600' : 'border-gray-300'}`}>
                        <Check className={`w-4 h-4 text-blue-600 transition-all duration-200 stroke-[3] ${value ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tight group-hover:text-gray-900 transition-colors">{key}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button 
                  onClick={handleDownload}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 hover:bg-green-100 transition-all text-xs sm:text-sm active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                  <span className="hidden xs:inline sm:hidden md:inline">XLSX</span>
                </button>
                <button 
                  onClick={() => setIsShareOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-100 hover:bg-blue-100 transition-all text-xs sm:text-sm active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          {isListLoading ? (
            <div className="bg-white rounded-2xl h-64 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Syncing officials list...</p>
            </div>
          ) : (
            <OfficialsTable 
              officials={activeOfficialsList}
              searchTerm={searchTerm}
              onEdit={setEditingOfficial}
              onDelete={handleDelete}
              isDeleting={isListDeleting}
              displayTerm={displayTerm}
              mode={adminMode}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <EditOfficialModal 
        isOpen={!!editingOfficial}
        onClose={() => setEditingOfficial(null)}
        official={editingOfficial}
        onUpdate={handleUpdate}
        isUpdating={isListUpdating}
        mode={adminMode}
        allOfficials={activeOfficialsList}
        displayTerm={displayTerm}
        officialsExist={activeOfficialsList.length > 0}
      />

      <ArchiveModal 
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={archiveOfficials}
        isArchiving={isArchiving}
        officialsCount={activeOfficialsList.length}
        electionTerms={terms}
        currentTerm={currentTerm}
        mode={adminMode}
        jumuiyaCountMap={jumuiyaCountMap}
        activeTerm={displayTerm}
      />

      <HistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        activeOfficials={activeOfficialsList}
        activeTerm={displayTerm}
        mode={adminMode}
      />

      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        officials={activeOfficialsList}
        mode={adminMode}
      />
    </div>
  );
}
