import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../api/axiosInstance';
import { Loader2, Shield, CheckCircle, XCircle, MessageSquare, Calendar } from 'lucide-react';

export default function UnmaskApproval() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiClient.get(`/suggestions/unmask/${token}`)
      .then(res => { setRequest(res.data.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.message || 'Invalid or expired link'); setLoading(false); });
  }, [token]);

  const handleRespond = async (action: 'approve' | 'reject') => {
    setSubmitting(true);
    try {
      await apiClient.post(`/suggestions/unmask/${token}/respond`, { action });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={40} className="text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <XCircle size={48} className="text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Link Expired or Invalid</h2>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Response Recorded</h2>
          <p className="text-slate-500 mb-6">Your response has been submitted. Thank you.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 max-w-lg w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Unmask Request</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {request?.role === 'chair' ? 'CSA Chair Review' : 'CSA Liturgist Review'}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 mb-8">
          <p className="text-slate-800 text-base font-medium leading-relaxed italic mb-4">
            "{request?.suggestion}"
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar size={14} />
            {new Date(request?.created_at).toLocaleDateString()}
          </div>
        </div>

        <p className="text-slate-600 text-sm mb-6">
          The CSA Vice Chair has requested to view the identity of the person who submitted this anonymous suggestion. Do you approve?
        </p>

        <div className="flex gap-3">
          <button onClick={() => handleRespond('approve')} disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm transition-all"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            Approve
          </button>
          <button onClick={() => handleRespond('reject')} disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 rounded-xl font-bold text-sm transition-all"
          >
            <XCircle size={18} />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
