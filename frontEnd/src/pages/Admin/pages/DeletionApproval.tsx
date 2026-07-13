import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../../api/axiosInstance';
import { Loader2, Shield, CheckCircle, XCircle, Trash2, User } from 'lucide-react';

export default function DeletionApproval() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    apiClient.get(`/officials/deletion-approval/${token}`)
      .then(res => { setRequest(res.data.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.message || 'Invalid or expired link'); setLoading(false); });
  }, [token]);

  const handleRespond = async (action: 'approve' | 'reject') => {
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/officials/deletion-approval/${token}/respond`, { action });
      setResultMsg(res.data.message);
      if (res.data.deleted) {
        setResultMsg('Official has been deleted.');
      }
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
          <p className="text-slate-500 mb-6">{resultMsg}</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = (v: boolean | null) => {
    if (v === true) return <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold"><CheckCircle size={14} /> Approved</span>;
    if (v === false) return <span className="inline-flex items-center gap-1 text-rose-500 text-xs font-bold"><XCircle size={14} /> Rejected</span>;
    return <span className="text-slate-300 text-xs">Pending</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 max-w-lg w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
            <Trash2 size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Deletion Approval</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {request?.your_role} Review
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-slate-200 rounded-xl">
              <User size={20} className="text-slate-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">{request?.official_name}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{request?.official_position}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Requested by <strong className="text-slate-700">{request?.initiator_name}</strong>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <p className="text-xs font-bold text-slate-400 mb-1">Chairperson</p>
            {statusBadge(request?.chair_approved)}
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <p className="text-xs font-bold text-slate-400 mb-1">Secretary</p>
            {statusBadge(request?.secretary_approved)}
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <p className="text-xs font-bold text-slate-400 mb-1">Coordinator</p>
            {statusBadge(request?.coordinator_approved)}
          </div>
        </div>

        <p className="text-slate-600 text-sm mb-6 text-center">
          {request?.approvals_received} of {request?.approvals_required} approvals received. Two approvals are required to delete this official.
        </p>

        {!request?.has_responded && request?.status === 'pending' ? (
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
        ) : (
          <p className="text-center text-sm text-slate-400 font-medium">
            {request?.status !== 'pending' ? 'This request has already been resolved.' : 'You have already responded to this request.'}
          </p>
        )}
      </div>
    </div>
  );
}
