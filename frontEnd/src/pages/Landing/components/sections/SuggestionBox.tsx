import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, User, Mail, Sparkles, Heart, Star, Eye, EyeOff, Clock, CheckCircle, RefreshCcw } from 'lucide-react';
import { apiClient } from '../../../../api/axiosInstance';
import { useAuth } from '../../../../context/AuthContext';

const STATUS_LABELS: Record<string, string> = { new: 'New', under_review: 'Under Review', acknowledged: 'Acknowledged', implemented: 'Implemented', closed: 'Closed' };
const STATUS_COLORS: Record<string, string> = { new: 'bg-slate-100 text-slate-600', under_review: 'bg-amber-50 text-amber-600', acknowledged: 'bg-blue-50 text-blue-600', implemented: 'bg-emerald-50 text-emerald-600', closed: 'bg-slate-100 text-slate-400' };

const SuggestionBox: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', suggestion: '' });
  const [anonymous, setAnonymous] = useState(true);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [mySuggestions, setMySuggestions] = useState<any[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      setLoadingMine(true);
      apiClient.get('/suggestions/mine')
        .then(res => setMySuggestions(res.data.data || []))
        .catch(() => {})
        .finally(() => setLoadingMine(false));
    }
  }, [isAuthenticated, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.suggestion.trim()) return;
    setStatus('submitting');
    const payload: Record<string, any> = { suggestion: formData.suggestion.trim(), is_anonymous: anonymous };
    if (formData.name.trim()) payload.name = formData.name.trim();
    if (formData.email.trim()) payload.email = formData.email.trim();
    try {
      await apiClient.post('/suggestions', payload);
      setStatus('success');
      setFormData({ name: '', email: '', suggestion: '' });
      setAnonymous(true);
      if (isAuthenticated) {
        const res = await apiClient.get('/suggestions/mine');
        setMySuggestions(res.data.data || []);
      }
      setTimeout(() => { setStatus('idle'); setIsOpen(false); }, 4000);
    } catch (error: unknown) {
      setStatus('error');
      const msg = error instanceof Error ? error.message : 'Failed to submit.';
      setErrorMessage((error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? msg);
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <section className="pt-4 md:pt-6 pb-20 bg-slate-50 relative overflow-hidden" id="suggestions">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/20 rounded-full blur-3xl -ml-48 -mb-48 opacity-60"></div>
      <div className="absolute -top-2 md:top-10 left-4 md:left-10 text-primary/10"><Heart size={36} fill="currentColor" /></div>
      <div className="absolute bottom-10 right-4 md:right-10 text-amber-500/5"><Star size={48} fill="currentColor" /></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="p-[1.5px] rounded-[1.8rem] bg-gradient-to-r from-primary/20 via-slate-200/50 to-indigo-400/20 shadow-md transition-all duration-500 hover:shadow-lg">
            <div onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center justify-between p-1.5 bg-white rounded-[1.7rem] transition-all duration-500 cursor-pointer group ${isOpen ? 'ring-2 ring-primary/5' : ''}`}
            >
              <div className="flex items-center gap-4 p-2 md:p-3">
                <div className={`p-3 rounded-2xl transition-all duration-700 ${isOpen ? 'bg-primary text-white scale-105' : 'bg-slate-50 text-primary group-hover:bg-primary/5'}`}>
                  <MessageSquare size={24} className={isOpen ? 'animate-pulse' : ''} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    Suggestion Box
                    {!isOpen && <Sparkles size={14} className="text-amber-400 animate-[bounce_2s_infinite]" />}
                  </h2>
                  <p className="text-slate-400 font-bold text-[10px] md:text-xs tracking-widest uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span> Help us Grow
                  </p>
                </div>
              </div>
              <div className="pr-4 md:pr-6">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-50 flex items-center justify-center transition-all duration-700 ${isOpen ? 'rotate-180 bg-primary/10 text-primary' : 'text-slate-300'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className={`grid transition-all duration-[1000ms] cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-4 md:mt-6 scale-100' : 'grid-rows-[0fr] opacity-0 scale-95 pointer-events-none'}`}>
            <div className="overflow-hidden">
              <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 relative overflow-hidden">
                {status === 'success' ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in slide-in-from-bottom-6 duration-700">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Transmitted!</h3>
                    <p className="text-slate-500 text-sm font-medium">Thank you for your valuable input.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <label htmlFor="name" className="flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-wider ml-1"><User size={12} className="text-primary" />NAME (OPTIONAL)</label>
                        <input type="text" id="name" placeholder="Your name" className="w-full px-5 py-3.5 rounded-xl bg-white border-2 border-slate-200 focus:border-primary/40 outline-none transition-all duration-300 placeholder:text-slate-400 font-bold text-slate-900 text-sm focus:shadow-sm"
                          value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={status === 'submitting'} />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-wider ml-1"><Mail size={12} className="text-primary" />EMAIL (OPTIONAL)</label>
                        <input type="email" id="email" placeholder="your@email.com" className="w-full px-5 py-3.5 rounded-xl bg-white border-2 border-slate-200 focus:border-primary/40 outline-none transition-all duration-300 placeholder:text-slate-400 font-bold text-slate-900 text-sm focus:shadow-sm"
                          value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={status === 'submitting'} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="suggestion" className="flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-wider ml-1"><MessageSquare size={12} className="text-primary" />MESSAGE</label>
                      <textarea id="suggestion" required placeholder="Tell us what's on your mind..." rows={4} className="w-full px-5 py-4 rounded-xl bg-white border-2 border-slate-200 focus:border-primary/40 outline-none transition-all duration-300 placeholder:text-slate-400 font-bold text-slate-900 text-sm resize-none focus:shadow-sm"
                        value={formData.suggestion} onChange={(e) => setFormData({ ...formData, suggestion: e.target.value })} disabled={status === 'submitting'} />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <button type="button" onClick={() => setAnonymous(!anonymous)}
                          className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${anonymous ? 'bg-primary' : 'bg-slate-300'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${anonymous ? 'translate-x-5' : ''}`} />
                        </button>
                        <span className="text-xs font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                          {anonymous ? <EyeOff size={13} /> : <Eye size={13} />}
                          {anonymous ? 'Anonymous' : 'Attach my identity'}
                        </span>
                      </label>
                    </div>
                    <div>
                      <button type="submit" disabled={status === 'submitting' || !formData.suggestion.trim()}
                        className="w-full group relative overflow-hidden px-6 py-4 bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white rounded-xl font-black tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-3"
                      >
                        {status === 'submitting' ? <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div> : <><span>SEND SUGGESTION</span><Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>}
                      </button>
                      {status === 'error' && errorMessage && <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center animate-in fade-in slide-in-from-bottom-2 duration-300">{errorMessage}</div>}
                    </div>
                  </form>
                )}

                {/* My Suggestions */}
                {isAuthenticated && mySuggestions.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">My Suggestions</h3>
                      <button onClick={() => { setLoadingMine(true); apiClient.get('/suggestions/mine').then(r => setMySuggestions(r.data.data || [])).finally(() => setLoadingMine(false)); }}
                        className="text-xs text-slate-400 hover:text-indigo-600 transition-colors">
                        <RefreshCcw size={14} className={loadingMine ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {mySuggestions.map((s: any) => (
                        <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm text-slate-700 font-medium italic leading-relaxed flex-1">"{s.suggestion}"</p>
                            <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[s.status] || STATUS_COLORS.new}`}>
                              {s.status === 'new' || s.status === 'under_review' ? <Clock size={11} /> : <CheckCircle size={11} />}
                              {STATUS_LABELS[s.status] || 'New'}
                            </span>
                          </div>
                          {s.admin_response && (
                            <div className="mt-2 pl-3 border-l-2 border-blue-200">
                              <p className="text-[11px] text-slate-500 font-bold">Response{s.responded_by ? ` from ${s.responded_by}` : ''}:</p>
                              <p className="text-sm text-slate-600">{s.admin_response}</p>
                            </div>
                          )}
                          <p className="text-[10px] text-slate-400 mt-2 font-bold tracking-wider">{new Date(s.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuggestionBox;
