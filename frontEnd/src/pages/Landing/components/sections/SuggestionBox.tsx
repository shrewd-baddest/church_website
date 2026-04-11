import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, User, Mail, Sparkles, Heart, Star } from 'lucide-react';
import apiService from '../../services/api';

const SuggestionBox: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    suggestion: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.suggestion.trim()) return;

    setStatus('submitting');
    
    const submissionData: Record<string, string> = {
      suggestion: formData.suggestion.trim()
    };
    
    if (formData.name.trim()) submissionData.name = formData.name.trim();
    if (formData.email.trim()) submissionData.email = formData.email.trim();

    try {
      await apiService.createRecord('suggestions', submissionData);
      setStatus('success');
      setFormData({ name: '', email: '', suggestion: '' });
      
      setTimeout(() => {
        setStatus('idle');
        setIsOpen(false);
      }, 4000);
    } catch (error: unknown) {
      console.error('Error submitting suggestion:', error);
      setStatus('error');
      const msg = error instanceof Error ? error.message : 'Failed to submit suggestion. Please try again.';
      setErrorMessage((error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? msg);
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <section className="pt-4 md:pt-6 pb-20 bg-slate-50 relative" id="suggestions">
      {/* Dynamic Background Elements - Subtler blurs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/20 rounded-full blur-3xl -ml-48 -mb-48 opacity-60"></div>
      
      {/* Floating Decorative Elements - Moved very high on mobile to avoid overlap */}
      <div className="absolute -top-2 md:top-10 left-4 md:left-10 text-primary/10 -rotate-12 animate-bounce direction-alternate-reverse duration-[3000ms]">
        <Heart size={36} fill="currentColor" />
      </div>
      <div className="absolute bottom-10 right-4 md:right-10 text-amber-500/5 rotate-12 animate-pulse">
        <Star size={48} fill="currentColor" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Header Card with Faded Gradient Border */}
          <div className="p-[1.5px] rounded-[1.8rem] bg-gradient-to-r from-primary/20 via-slate-200/50 to-indigo-400/20 shadow-md transition-all duration-500 hover:shadow-lg">
            <div 
              onClick={() => setIsOpen(!isOpen)}
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
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                    Help us Grow
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

          {/* Form Content - Compact and High Contrast */}
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
                        <label htmlFor="name" className="flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-wider ml-1">
                          <User size={12} className="text-primary" />
                          NAME (OPTIONAL)
                        </label>
                        <input
                          type="text"
                          id="name"
                          placeholder="Your name"
                          className="w-full px-5 py-3.5 rounded-xl bg-white border-2 border-slate-200 focus:border-primary/40 outline-none transition-all duration-300 placeholder:text-slate-400 font-bold text-slate-900 text-sm focus:shadow-sm"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          disabled={status === 'submitting'}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-wider ml-1">
                          <Mail size={12} className="text-primary" />
                          EMAIL (OPTIONAL)
                        </label>
                        <input
                          type="email"
                          id="email"
                          placeholder="your@email.com"
                          className="w-full px-5 py-3.5 rounded-xl bg-white border-2 border-slate-200 focus:border-primary/40 outline-none transition-all duration-300 placeholder:text-slate-400 font-bold text-slate-900 text-sm focus:shadow-sm"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={status === 'submitting'}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="suggestion" className="flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-wider ml-1">
                        <MessageSquare size={12} className="text-primary" />
                        MESSAGE
                      </label>
                      <textarea
                        id="suggestion"
                        required
                        placeholder="Tell us what's on your mind..."
                        rows={4}
                        className="w-full px-5 py-4 rounded-xl bg-white border-2 border-slate-200 focus:border-primary/40 outline-none transition-all duration-300 placeholder:text-slate-400 font-bold text-slate-900 text-sm resize-none focus:shadow-sm"
                        value={formData.suggestion}
                        onChange={(e) => setFormData({ ...formData, suggestion: e.target.value })}
                        disabled={status === 'submitting'}
                      ></textarea>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={status === 'submitting' || !formData.suggestion.trim()}
                        className="w-full group relative overflow-hidden px-6 py-4 bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white rounded-xl font-black tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-3"
                      >
                        {status === 'submitting' ? (
                          <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span>SEND SUGGESTION</span>
                            <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </>
                        )}
                      </button>

                      {status === 'error' && errorMessage && (
                        <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                          {errorMessage}
                        </div>
                      )}
                    </div>
                  </form>
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
