import { useState, useEffect } from 'react';
import apiService from '../../Landing/services/api';
import { MessageSquare, Trash2, Search, Calendar, User, Mail, RefreshCcw, Loader2 } from 'lucide-react';

export default function AdminSuggestions() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchTableData('suggestions');
      // Sort by date descending
      const sortedData = (Array.isArray(data) ? data : []).sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setSuggestions(sortedData);
    } catch (err: any) {
      console.error('Error fetching suggestions:', err);
      setError(err.message || 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this suggestion?')) {
      try {
        await apiService.deleteRecord('suggestions', id);
        loadSuggestions();
      } catch (err: any) {
        alert('Failed to delete suggestion: ' + err.message);
      }
    }
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.suggestion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header section with glassmorphism */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full blur-3xl -mr-32 -mt-32 opacity-40 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">User Suggestions</h2>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-xs">Manage community feedback and ideas</p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={loadSuggestions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin text-indigo-600' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Global search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search suggestions, names, or emails..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
        />
      </div>

      {loading && suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
          <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-500 font-bold">Connecting to database...</p>
        </div>
      ) : filteredSuggestions.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredSuggestions.map((item) => (
            <div key={item.id} className="bg-white hover:bg-slate-50 transition-all duration-300 rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group">
              <div className="p-6 md:p-8 flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
                    <MessageSquare size={24} />
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                
                <p className="text-slate-800 text-lg font-medium leading-relaxed mb-8 italic">
                  "{item.suggestion}"
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-50 pt-6">
                  <div className="flex items-center gap-3 text-slate-600">
                    <User size={16} className="text-slate-400" />
                    <span className="text-sm font-bold truncate">{item.name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-sm font-medium truncate">{item.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 flex items-center justify-center rounded-3xl mb-6">
            <MessageSquare size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No suggestions found</h3>
          <p className="text-slate-500 mt-2">When users share ideas, they'll appear here.</p>
        </div>
      )}
    </div>
  );
}
