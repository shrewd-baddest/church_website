import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/axiosInstance';
import { toast } from 'react-hot-toast';
import { FaCheck, FaTimes, FaTrash, FaSearch, FaUsers, FaCheckCircle, FaClock, FaTimesCircle, FaDownload, FaFilter, FaPhone, FaEnvelope, FaGraduationCap, FaMars, FaVenus } from 'react-icons/fa';
import '../../Jumuiya/admin/Admin.css';

interface Props {
  color: string;
}

const CommunityAdminMembers: React.FC<Props> = ({ color }) => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['community-admin-members', moduleId, statusFilter, search],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const res = await apiClient.get(`/community-enrollment/${moduleId}`, { params });
      return res.data;
    },
    enabled: !!moduleId,
    staleTime: 30000,
  });

  const enrollments = data?.enrollments || [];
  const stats = data?.stats || { total: 0, approved: 0, pending: 0, rejected: 0 };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) => {
      return await apiClient.patch(`/community-enrollment/${moduleId}/${id}`, { status, rejectionReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-admin-members', moduleId] });
      toast.success('Status updated');
      setRejectModal(null);
      setRejectReason('');
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/community-enrollment/${moduleId}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-admin-members', moduleId] });
      toast.success('Member removed');
    },
  });

  const handleExport = () => {
    if (!enrollments.length) return;
    const headers = ['Name', 'Reg No', 'Phone', 'Gender', 'Course', 'Year', 'Voice Type', 'Status', 'Joined'];
    const rows = enrollments.map((m: any) => [
      m.full_name, m.reg_number || m.member_id || m.memberId || '', m.phone, m.gender || '', m.course || '', m.year_of_study || '',
      m.voice_type || '', m.status, m.joined_at || m.enrolled_at || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${moduleId}-members.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!');
  };

  return (
    <div className="admin-members">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: <FaUsers size={14} />, bg: `${color}12`, textColor: color },
          { label: 'Approved', value: stats.approved, icon: <FaCheckCircle size={14} />, bg: '#10b98115', textColor: '#10b981' },
          { label: 'Pending', value: stats.pending, icon: <FaClock size={14} />, bg: '#f59e0b15', textColor: '#f59e0b' },
          { label: 'Rejected', value: stats.rejected, icon: <FaTimesCircle size={14} />, bg: '#ef444415', textColor: '#ef4444' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl p-3 sm:p-4 text-center" style={{ background: stat.bg, border: `1px solid ${color}10` }}>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span style={{ color: stat.textColor }}>{stat.icon}</span>
              <span className="text-xl sm:text-2xl font-black" style={{ color: stat.textColor }}>{stat.value}</span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Search + Filter + Export */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                statusFilter === s ? 'text-white shadow-md' : 'text-slate-500 bg-white border border-slate-200 hover:border-slate-300'
              }`}
              style={statusFilter === s ? { background: color } : {}}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <FaDownload size={11} /> Export
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: color }} />
        </div>
      ) : enrollments.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {enrollments.map((m: any) => {
            const initials = (m.full_name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            const status = (m.status || 'Pending').toLowerCase();
            return (
              <div
                key={m.id}
                className="relative rounded-2xl p-4 sm:p-5 bg-white border border-slate-100 hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                <div className="absolute top-0 left-0 right-0 h-1" style={{
                  background: status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b',
                }} />

                <div className="flex items-start gap-3 mt-1">
                  <div
                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 shadow-md ring-2 transition-transform group-hover:scale-105 flex items-center justify-center font-black text-sm sm:text-lg text-white"
                    style={{ ringColor: `${color}20`, background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{m.full_name}</h3>
                    <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-md mt-1 ${
                      status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      status === 'rejected' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {m.status || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Member Details */}
                <div className="mt-3 space-y-1.5">
                  {(m.reg_number || m.member_id || m.memberId) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <span className="text-[10px] font-black uppercase text-slate-400">Reg No:</span>
                      <span className="font-bold text-slate-800">{m.reg_number || m.member_id || m.memberId}</span>
                    </div>
                  )}
                  {m.gender && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {m.gender === 'Male' ? <FaMars size={10} className="text-blue-500" /> : <FaVenus size={10} className="text-pink-500" />}
                      <span>{m.gender}</span>
                    </div>
                  )}
                  {m.course && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <FaGraduationCap size={10} style={{ color }} />
                      <span className="truncate">{m.course} {m.year_of_study ? `· ${m.year_of_study}` : ''}</span>
                    </div>
                  )}
                  {m.phone && (
                    <a href={`tel:${m.phone}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors">
                      <FaPhone size={10} style={{ color }} />
                      <span>{m.phone}</span>
                    </a>
                  )}
                  {m.email && m.email !== 'N/A' && (
                    <a href={`mailto:${m.email}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors truncate">
                      <FaEnvelope size={10} style={{ color }} />
                      <span className="truncate">{m.email}</span>
                    </a>
                  )}
                  {m.voice_type && m.voice_type !== 'None' && (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${color}10`, color }}>
                      Voice: {m.voice_type}
                    </span>
                  )}
                  {m.music_level && m.music_level !== 'None' && (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      Level: {m.music_level}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3 sm:mt-4 pt-3 border-t border-slate-100">
                  {status !== 'approved' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: m.id, status: 'Approved' })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all cursor-pointer"
                    >
                      <FaCheck size={11} /> Approve
                    </button>
                  )}
                  {status !== 'rejected' && (
                    <button
                      onClick={() => setRejectModal({ id: m.id, name: m.full_name })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all cursor-pointer"
                    >
                      <FaTimes size={11} /> Reject
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm(`Remove ${m.full_name} from this community?`)) {
                        deleteMutation.mutate(m.id);
                      }
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-100 transition-all cursor-pointer shrink-0"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl" style={{ background: `${color}06`, border: `1px dashed ${color}25` }}>
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: `${color}10` }}>
            <FaUsers style={{ color: `${color}40` }} size={28} />
          </div>
          <p className="font-semibold text-slate-400 text-sm">
            {search || statusFilter !== 'all' ? 'No members match your filters.' : 'No members enrolled yet.'}
          </p>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-800 mb-2">Reject Enrollment</h3>
            <p className="text-sm text-slate-500 mb-4">
              Rejecting <strong>{rejectModal.name}</strong>'s enrollment. Optionally provide a reason:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none resize-none h-24"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatusMutation.mutate({ id: rejectModal.id, status: 'Rejected', rejectionReason })}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-all cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityAdminMembers;
