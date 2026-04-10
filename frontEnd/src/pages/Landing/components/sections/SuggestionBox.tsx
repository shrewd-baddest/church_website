import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';
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
    try {
      await apiService.createRecord('suggestions', formData);
      setStatus('success');
      setFormData({ name: '', email: '', suggestion: '' });
      setTimeout(() => {
        setStatus('idle');
        setIsOpen(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error submitting suggestion:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to submit suggestion. Please try again.');
    }
  };

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden" id="suggestions">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl -mr-32 -mt-32 opacity-40"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between p-6 bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border border-white/50 cursor-pointer group hover:bg-white transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <MessageSquare size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Suggestion Box</h2>
                <p className="text-gray-500 text-sm font-medium">Click to share your ideas with us</p>
              </div>
            </div>
            <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-xl border border-white/50">
              {status === 'success' ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-500">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm border border-emerald-200">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Thank You!</h3>
                  <p className="text-gray-600 text-sm">Your suggestion has been received. We value your input!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm font-bold text-gray-700 ml-1">Name (Optional)</label>
                      <input
                        type="text"
                        id="name"
                        placeholder="Your name"
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={status === 'submitting'}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-bold text-gray-700 ml-1">Email (Optional)</label>
                      <input
                        type="email"
                        id="email"
                        placeholder="your@email.com"
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={status === 'submitting'}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="suggestion" className="block text-sm font-bold text-gray-700 ml-1">Your Suggestion</label>
                    <textarea
                      id="suggestion"
                      required
                      placeholder="Tell us what's on your mind..."
                      rows={4}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 resize-none"
                      value={formData.suggestion}
                      onChange={(e) => setFormData({ ...formData, suggestion: e.target.value })}
                      disabled={status === 'submitting'}
                    ></textarea>
                  </div>

                  {status === 'error' && (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium text-center">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'submitting' || !formData.suggestion.trim()}
                    className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {status === 'submitting' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Send Suggestion
                        <Send size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuggestionBox;
