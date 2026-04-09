import { useState, useEffect } from 'react';
import apiService from '../../Landing/services/api';
import { 
  Heart, 
  Search, 
  RefreshCcw, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp,
  Filter
} from 'lucide-react';

export default function DonationMonitor() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDonations();
    const interval = setInterval(fetchDonations, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDonations = async () => {
    try {
      const [mpesaData, membersData] = await Promise.all([
        apiService.fetchTableData('mpesa_request'),
        apiService.fetchTableData('members')
      ]);

      const enhanced = mpesaData.map((d: any) => {
        const member = membersData.find((m: any) => m.member_id === d.user_id);
        return {
          ...d,
          donorName: member ? `${member.first_name} ${member.last_name}` : d.user_id
        };
      });

      setDonations(enhanced);
    } catch (error) {
      console.error('Failed to fetch donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDonations = donations.filter(d => {
    const matchesSearch = 
      d.checkout_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.donorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.user_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || d.status?.toLowerCase() === selectedStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: donations.reduce((acc, d) => d.status === 'paid' ? acc + Number(d.amount) : acc, 0),
    count: donations.filter(d => d.status === 'paid').length,
    pending: donations.filter(d => d.status === 'pending').length,
    failed: donations.filter(d => d.status === 'failed').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return (
          <span className="flex items-center gap-1.5 justify-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ring-emerald-200">
            <CheckCircle2 size={12} />
            Success
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 justify-center px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ring-amber-200">
            <Clock size={12} />
            Waiting
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1.5 justify-center px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ring-rose-200">
            <XCircle size={12} />
            Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 justify-center px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ring-slate-200">
            <Filter size={12} />
            {status || 'Unknown'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Heart className="text-rose-500" fill="currentColor" size={28} />
            Donation Monitor
          </h2>
          <p className="text-slate-500 text-sm mt-1">Real-time M-Pesa transaction tracking and financial analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDonations}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Received</p>
          <h3 className="text-2xl font-black text-slate-800">KES {stats.total.toLocaleString()}</h3>
          <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold mt-2">
            <TrendingUp size={12} />
            <span>FROM {stats.count} SUCCESSFUL GIFTS</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Successful</p>
          <h3 className="text-2xl font-black text-emerald-600">{stats.count}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Completed TRANSACTIONS</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pending</p>
          <h3 className="text-2xl font-black text-amber-500">{stats.pending}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Awaiting PIN entry</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Canceled / Error</p>
          <h3 className="text-2xl font-black text-rose-500">{stats.failed}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Failed attempts</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-800">Recent Transactions</h4>
            <div className="relative">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    showFilters || selectedStatus !== 'all'
                    ? 'bg-blue-50 border-blue-100 text-blue-600' 
                    : 'bg-slate-50 border-slate-100 text-slate-600'
                  }`}
                >
                    <Filter size={14} />
                    {selectedStatus === 'all' ? 'Filter' : `Status: ${selectedStatus}`}
                </button>

                {showFilters && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-10 p-2 animate-in fade-in zoom-in-95 duration-200">
                    <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Filter by Status</p>
                    {['all', 'paid', 'pending', 'failed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setSelectedStatus(status);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                          selectedStatus === status 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="capitalize">{status === 'paid' ? 'Success' : status === 'all' ? 'All Transactions' : status}</span>
                        {selectedStatus === status && <CheckCircle2 size={14} />}
                      </button>
                    ))}
                  </div>
                )}
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Donor / Number</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDonations.length > 0 ? filteredDonations.map((donation, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-slate-400">{donation.checkout_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                        {donation.donorName?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-700 block">{donation.donorName}</span>
                         {donation.donorName !== donation.user_id && (
                           <span className="text-[10px] text-slate-400 font-medium">{donation.user_id}</span>
                         )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-slate-800">KES {Number(donation.amount).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-600 font-medium">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(donation.created_at).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {getStatusBadge(donation.status)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <Heart size={48} className="text-slate-200" />
                        <p className="text-slate-400 font-medium">No donation records found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
