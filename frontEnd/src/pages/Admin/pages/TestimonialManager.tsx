import { useState, useEffect, useCallback } from 'react';
import { Star, Plus, Trash2, Loader2, MessageCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import apiService from '../../Landing/services/api';
import { toast } from 'react-hot-toast';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  text: string;
  rating: number;
  reference: string;
  approved: boolean;
  created_at: string;
}

type Filter = 'all' | 'pending' | 'approved';

export default function TestimonialManager() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>('pending');
  const [form, setForm] = useState({ name: '', role: '', text: '', rating: 5, reference: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getTestimonials();
      setTestimonials(Array.isArray(data) ? data : []);
    } catch {
      setTestimonials([]);
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) {
      toast.error('Name and testimonial text are required');
      return;
    }
    setSaving(true);
    try {
      await apiService.createTestimonial({ ...form, approved: true });
      toast.success('Testimonial added and approved!');
      setForm({ name: '', role: '', text: '', rating: 5, reference: '' });
      setShowForm(false);
      load();
    } catch {
      toast.error('Failed to save testimonial');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (t: Testimonial) => {
    try {
      await apiService.approveTestimonial(t.id);
      toast.success('Testimonial approved');
      setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, approved: true } : x));
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleDelete = async (t: Testimonial) => {
    if (!window.confirm(`Delete testimonial from "${t.name}"?`)) return;
    try {
      await apiService.deleteTestimonial(t.id);
      toast.success('Testimonial deleted');
      setTestimonials(prev => prev.filter(x => x.id !== t.id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const pending = testimonials.filter(t => !t.approved);
  const approved = testimonials.filter(t => t.approved);

  const filteredList = filter === 'all' ? testimonials : filter === 'pending' ? pending : approved;

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Testimonials
          </h1>
          <p className="text-slate-500 font-medium mt-0.5 text-xs">
            Review and approve customer testimonials. Only approved ones appear on public pages.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-xs"
        >
          <Plus size={16} /> {showForm ? 'Cancel' : 'Add Testimonial'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Grace Wanjiku"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Role</label>
              <input
                type="text"
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                placeholder="Parishioner"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Order/Hire Reference (optional)</label>
            <input
              type="text"
              value={form.reference}
              onChange={e => setForm(p => ({ ...p, reference: e.target.value }))}
              placeholder="CSA-2026-0001"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Testimonial *</label>
            <textarea
              value={form.text}
              onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
              placeholder="The communion set I ordered was beautiful..."
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Rating</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, rating: s }))}
                  className={`p-1 rounded-lg transition-all ${s <= form.rating ? 'text-amber-400 scale-110' : 'text-slate-200'}`}
                >
                  <Star size={16} fill={s <= form.rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs disabled:cursor-not-allowed"
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save & Publish'}
          </button>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {(['pending', 'approved', 'all'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
              filter === f
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300'
            }`}
          >
            {f === 'pending' && <Clock size={12} className="inline mr-1" />}
            {f === 'approved' && <CheckCircle size={12} className="inline mr-1" />}
            {f === 'all' && <MessageCircle size={12} className="inline mr-1" />}
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pending.length > 0 && (
              <span className="ml-1 bg-amber-400 text-white text-[9px] px-1 py-0.5 rounded-full">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={18} className="animate-spin text-blue-600" />
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <MessageCircle size={32} className="mx-auto mb-2 opacity-40" />
          <p className="font-bold text-slate-500">
            {filter === 'pending' ? 'No pending testimonials' : filter === 'approved' ? 'No approved testimonials' : 'No testimonials yet'}
          </p>
          <p className="text-sm">
            {filter === 'pending' ? 'Customer submissions will appear here.' : 'Add your first customer feedback above.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredList.map(t => (
            <div key={t.id} className={`bg-white rounded-xl p-3 shadow-sm border transition-all ${
              !t.approved ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {!t.approved && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full mb-2 uppercase tracking-wider">
                      <Clock size={10} /> Pending Review
                    </span>
                  )}
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < t.rating ? 'text-amber-400' : 'text-slate-200'} fill={i < t.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 mb-1 italic">"{t.text}"</p>
                  <p className="font-bold text-slate-800 text-xs">{t.name}</p>
                  {t.role && <p className="text-[11px] text-slate-400">{t.role}</p>}
                  {t.reference && <p className="text-[10px] text-slate-500 font-mono">Ref: {t.reference}</p>}
                  <p className="text-[9px] text-slate-300">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!t.approved && (
                    <button
                      onClick={() => handleApprove(t)}
                      className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Approve"
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(t)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
