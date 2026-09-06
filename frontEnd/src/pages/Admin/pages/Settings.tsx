import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
  Loader2,
  Clock,
  CheckCircle,
  Ban,
  ShieldOff,
  Shield,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CalendarDays,
  Lock,
  Save,
  RefreshCw,
  ArrowRightLeft,
  LogOut,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import apiService from '../../../services/api';
import { apiClient } from '../../../api/axiosInstance';
import { semesterServices, SemesterConfig } from '../../../api/semesterServices';
import { useAuth } from '../../../context/AuthContext';
import { API_HANDOVER, API_LOOKUP_MEMBER } from '../../../utils/officialsApi';
import { toast } from 'react-hot-toast';

interface Assignment {
  id: number;
  member_id: string;
  role_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  assigned_by: string;
  approved_by: string | null;
  approved_at: string | null;
  jumuiya_id: string | null;
  created_at: string;
  role_name: string;
  role_description: string;
  source_position: string | null;
  first_name: string;
  last_name: string;
  jumuiya_name: string | null;
  assigned_by_first: string | null;
  assigned_by_last: string | null;
  approved_by_first: string | null;
  approved_by_last: string | null;
}

const ROLE_PAGES_MAP: Record<string, string[]> = {
  csa_chair: ['All pages (Super Admin)'],
  csa_vice_chair: ['Suggestion Box', 'T-Shirts'],
  jumuiya_coordinator: ['Officials Management', 'Members'],
  project_manager: ['Sacramentals Banners', 'Products', 'Orders', 'Hire Requests', 'Project Management'],
  instrument_manager: ['Seats and Instruments'],
  os: ['Announcements Management', 'Weekly Activities', 'Semester Activities', 'Gallery Manager'],
  csa_secretary: ['Registered Members (all Jumuiyas)'],
  jumuiya_chairperson: ['Members (scoped to their Jumuiya)'],
  jumuiya_vice_chairperson: ['Jumuiya T-Shirts (scoped to their Jumuiya)', 'Suggestion Box (scoped to their Jumuiya)'],
  jumuiya_os: ['Gallery (scoped to their Jumuiya)'],
  jumuiya_secretary: ['Members (scoped to their Jumuiya)'],
  choir_chairperson: ['Community Management (Choir)'],
  choir_vice_chair: ['Community Management (Choir)'],
  choir_vice_secretary: ['Community Management (Choir)'],
  choir_secretary: ['Community Management (Choir)'],
  choir_treasurer: ['Community Management (Choir)'],
  choir_project_coordinator: ['Community Management (Choir Gallery)'],
  choir_male_representative: ['Community Management (Choir)'],
  choir_female_representative: ['Community Management (Choir)'],
  st_francis_chair: ['Community Management (St. Francis)'],
  st_francis_vice_chair: ['Community Management (St. Francis)'],
  st_francis_secretary: ['Community Management (St. Francis)'],
  st_francis_treasurer: ['Community Management (St. Francis)'],
  charismatic_chair: ['Community Management (Charismatic)'],
  charismatic_vice_chair: ['Community Management (Charismatic)'],
  dance_chair: ['Community Management (Dancers)'],
  dance_vice_chair: ['Community Management (Dancers)'],
  mentorship_chair: ['Community Management (Mentorship)'],
  mentorship_vice_chair: ['Community Management (Mentorship)'],
  liturgist: ['Devotions & AI'],
  treasurer: ['Donation Monitor'],
};

const CSA_ROLES = ['csa_chair', 'csa_vice_chair', 'csa_secretary', 'jumuiya_coordinator', 'os', 'project_manager', 'instrument_manager', 'treasurer', 'liturgist'];
const JUMUIYA_ROLES = ['jumuiya_chairperson', 'jumuiya_vice_chairperson', 'jumuiya_os', 'jumuiya_secretary'];
const SUBGROUP_ROLES = [
  'choir_chairperson', 'choir_vice_chair', 'choir_vice_secretary', 'choir_secretary', 'choir_treasurer',
  'choir_project_coordinator', 'choir_male_representative', 'choir_female_representative',
  'st_francis_chair', 'st_francis_vice_chair', 'st_francis_secretary', 'st_francis_treasurer',
  'charismatic_chair', 'charismatic_vice_chair',
  'dance_chair', 'dance_vice_chair',
  'mentorship_chair', 'mentorship_vice_chair',
];

type TabKey = 'csa' | 'jumuiya' | 'subgroup';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'csa', label: 'CSA' },
  { key: 'jumuiya', label: 'Jumuiya' },
  { key: 'subgroup', label: 'Sub Groups' },
];

const getPagesForRole = (roleName: string): string[] => {
  const key = (roleName || '').replace(/\s+/g, '_').toLowerCase();
  return ROLE_PAGES_MAP[key] || [`Role: ${roleName}`];
};

const ROLE_LABEL_MAP: Record<string, string> = {
  csa_chair: 'CSA Chairperson',
  csa_vice_chair: 'CSA Vice Chairperson',
  csa_secretary: 'CSA Secretary',
  jumuiya_coordinator: 'Jumuiya Coordinator',
  os: 'Organizing Secretary',
  project_manager: 'Project Manager',
  instrument_manager: 'Instrument Manager',
  treasurer: 'Treasurer',
  liturgist: 'Liturgist',
  jumuiya_chairperson: 'Jumuiya Chairperson',
  jumuiya_vice_chairperson: 'Jumuiya Vice Chairperson',
  jumuiya_os: 'Jumuiya Organizing Secretary',
  jumuiya_secretary: 'Jumuiya Secretary',
};

const getRoleDisplayName = (assignment: Assignment): string => {
  if (assignment.source_position) return assignment.source_position;
  const key = (assignment.role_name || '').toLowerCase().trim();
  return ROLE_LABEL_MAP[key] || assignment.role_name.replace(/_/g, ' ');
};

const roleBelongsToTab = (roleName: string, tab: TabKey): boolean => {
  const name = (roleName || '').toLowerCase().trim();
  if (CSA_ROLES.includes(name)) return tab === 'csa';
  if (JUMUIYA_ROLES.includes(name) || (name.startsWith('jumuiya_') && !name.includes('coordinator'))) return tab === 'jumuiya';
  if (SUBGROUP_ROLES.includes(name) || name.includes('choir') || name.includes('dance') || name.includes('charismatic') || name.includes('francis') || name.includes('mentorship')) return tab === 'subgroup';
  return tab === 'csa';
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabKey>('csa');
  const [pendingCounts, setPendingCounts] = useState<Record<TabKey, number>>({ csa: 0, jumuiya: 0, subgroup: 0 });
  const [pendingRefresh, setPendingRefresh] = useState(0);

  useEffect(() => {
    let mounted = true;
    apiService.getRoleAssignments('pending').then((assignments) => {
      if (!mounted) return;
      const counts: Record<TabKey, number> = { csa: 0, jumuiya: 0, subgroup: 0 };
      assignments.forEach((assignment) => {
        const tab = (['csa', 'jumuiya', 'subgroup'] as TabKey[]).find((key) => roleBelongsToTab(assignment.role_name, key));
        if (tab) counts[tab] += 1;
      });
      setPendingCounts(counts);
    }).catch(() => {
      if (mounted) setPendingCounts({ csa: 0, jumuiya: 0, subgroup: 0 });
    });
    return () => { mounted = false; };
  }, [pendingRefresh]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Sliders className="w-8 h-8 text-blue-600" />
            Approval Queue
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Review and approve/reject role assignments. Roles are auto-assigned when officials are added.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
            {pendingCounts[tab.key] > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                {pendingCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {(activeTab === 'csa' || activeTab === 'all') && <SemesterConfigPanel />}
      {activeTab === 'csa' && <TermHandoverPanel />}
      <ApprovalsPanel activeTab={activeTab} onChanged={() => setPendingRefresh((value) => value + 1)} />
      <ActiveRolesPanel activeTab={activeTab} />
      <RevokedRolesPanel activeTab={activeTab} />
    </div>
  );
}

function SemesterConfigPanel() {
  const { user } = useAuth();
  const isChair = (Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [])
    .some((r) => String(r).toLowerCase().trim() === 'csa_chair');

  const [semester, setSemester] = useState<SemesterConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await semesterServices.getCurrent();
        setSemester(data);
        if (data) {
          setLabel(data.label || '');
          setStartDate(data.start_date);
          setEndDate(data.end_date);
        }
      } catch {
        toast.error('Failed to load semester configuration');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!startDate || !endDate) {
      toast.error('Set both the start and end date');
      return;
    }
    if (startDate > endDate) {
      toast.error('Start date must be on or before the end date');
      return;
    }
    setSaving(true);
    try {
      const data = await semesterServices.setCurrent({ label, start_date: startDate, end_date: endDate });
      setSemester(data);
      setLabel(data.label || '');
      setStartDate(data.start_date);
      setEndDate(data.end_date);
      toast.success('Current semester updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update semester');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          Loading semester configuration...
        </div>
      </div>
    );
  }

  const displayLabel = semester ? (semester.label || 'Current Semester') : 'No semester configured';

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-indigo-500" />
          Current Semester
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          The semester window drives attendance tally periods, member semester registration, and jumuiya meeting days.
          {!isChair && <span className="flex items-center gap-1 mt-1 text-xs font-semibold text-amber-600"><Lock className="w-3 h-3" /> Only the CSA Chairperson can change this.</span>}
        </p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Label</label>
            <input
              type="text"
              value={label}
              disabled={!isChair}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 2025/2026 Semester 1"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              disabled={!isChair}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              disabled={!isChair}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
            {displayLabel}
          </span>
          {semester && (
            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">
              {semester.start_date} → {semester.end_date}
            </span>
          )}
          {isChair && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="ml-auto flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-indigo-200 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Semester
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TermHandoverPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isChair = (Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [])
    .some((r) => String(r).toLowerCase().trim() === 'csa_chair');

  const [successorRegNumber, setSuccessorRegNumber] = useState('');
  const [successorName, setSuccessorName] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [termName, setTermName] = useState('');
  const [termYear, setTermYear] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{
    successor_name: string;
    archived: { csa: number; jumuiya: number; groups: number; total: number };
    revoked_roles: number;
    term_name: string;
  } | null>(null);

  const lookupMember = useCallback((reg: string) => {
    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    if (!reg.trim()) {
      setSuccessorName('');
      setLookingUp(false);
      return;
    }
    setLookingUp(true);
    lookupTimerRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get(`${API_LOOKUP_MEMBER}/${encodeURIComponent(reg.trim())}`);
        setSuccessorName(res.data?.data?.name || '');
      } catch {
        setSuccessorName('');
      } finally {
        setLookingUp(false);
      }
    }, 400);
  }, []);

  const handleRegChange = (val: string) => {
    setSuccessorRegNumber(val);
    lookupMember(val);
  };

  if (!isChair) return null;

  const isValid = successorRegNumber.trim() && termName.trim() && termYear.trim();

  const executeHandover = async () => {
    setExecuting(true);
    try {
      const res = await apiClient.post(API_HANDOVER, {
        successor_reg_number: successorRegNumber.trim(),
        name: termName.trim(),
        year: termYear.trim(),
      });
      const d = res.data?.data;
      setResult({
        successor_name: d?.successor?.name || successorRegNumber.trim(),
        archived: d?.archived || { csa: 0, jumuiya: 0, groups: 0, total: 0 },
        revoked_roles: d?.revoked_roles || 0,
        term_name: d?.election_term?.name || termName.trim(),
      });
      toast.success('Handover complete');
      setTimeout(() => { logout(); navigate('/'); }, 6000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Handover failed');
      setConfirming(false);
      setExecuting(false);
    }
  };

  if (result) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-emerald-50/50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Handover Complete
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Leadership transferred to <span className="font-bold text-slate-700">{result.successor_name}</span> — term "{result.term_name}".
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xl font-black text-blue-700">{result.archived.csa}</p>
              <p className="text-[10px] font-bold text-blue-500 uppercase">CSA Archived</p>
            </div>
            <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
              <p className="text-xl font-black text-violet-700">{result.archived.jumuiya}</p>
              <p className="text-[10px] font-bold text-violet-500 uppercase">Jumuiya Archived</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-xl font-black text-emerald-700">{result.archived.groups}</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase">Groups Archived</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
              <p className="text-xl font-black text-rose-700">{result.revoked_roles}</p>
              <p className="text-[10px] font-bold text-rose-500 uppercase">Roles Revoked</p>
            </div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
            <div className="text-xs text-indigo-800">
              <p className="font-bold">Next steps for {result.successor_name}:</p>
              <p className="mt-1">Log in with your usual credentials → Admin panel → Officials page → add the new officials. Positions with system roles will appear in this Approval Queue.</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <LogOut className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 font-medium">You will be logged out automatically in a few seconds.</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
          >
            Log Out Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
            <ArrowRightLeft className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Term Handover</h2>
            <p className="text-xs text-slate-500 mt-0.5">Close the current term and hand leadership to a successor.</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: open ? '800px' : '0px', opacity: open ? 1 : 0 }}
      >
        <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4 max-w-md">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <ul className="text-[11px] text-amber-800 space-y-0.5 list-disc list-inside font-medium">
              <li>Archives ALL active officials — CSA, Jumuiya and Groups</li>
              <li>Revokes every old system role from the previous term</li>
              <li>Grants the <strong>CSA Chairperson</strong> role to your successor (must be a registered member)</li>
              <li>Logs you out immediately after completion</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Chairperson Reg Number *</label>
              <input
                type="text"
                value={successorRegNumber}
                onChange={(e) => handleRegChange(e.target.value)}
                placeholder="e.g. CS/0012/2022"
                disabled={executing || confirming}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
              />
              {successorRegNumber.trim() && (
                <div className="mt-1.5">
                  {lookingUp ? (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" /> Looking up...
                    </span>
                  ) : successorName ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl">
                      <UserCheck size={12} className="text-violet-600" />
                      <span className="text-xs font-bold text-violet-800">{successorName}</span>
                      <span className="text-[10px] text-violet-400 ml-1">Incoming Chairperson</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-rose-500 font-medium">No member found with this reg number</span>
                  )}
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-1">They log in with their usual reg number &amp; password and take over from there.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Term Name *</label>
              <input
                type="text"
                value={termName}
                onChange={(e) => setTermName(e.target.value)}
                placeholder="e.g. 2026/2027 Executive"
                disabled={executing || confirming}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Year *</label>
              <input
                type="text"
                value={termYear}
                onChange={(e) => setTermYear(e.target.value)}
                placeholder="e.g. 2026-2027"
                disabled={executing || confirming}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
              />
            </div>
          </div>

          {confirming ? (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-rose-800">
                Final confirmation — this cannot be undone. Hand over to "{successorName || successorRegNumber.trim()}"?
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={executeHandover}
                  disabled={executing || !isValid}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                >
                  {executing ? <Loader2 size={13} className="animate-spin" /> : <ArrowRightLeft size={13} />}
                  {executing ? 'Executing...' : 'Yes, Execute'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={executing}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              disabled={!isValid}
              className="w-full py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-violet-100"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Execute Handover
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ApprovalsPanel({ activeTab, onChanged }: { activeTab: TabKey; onChanged: () => void }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const pendingData = await apiService.getRoleAssignments('pending');
      setAssignments(Array.isArray(pendingData) ? pendingData : []);
    } catch {
      toast.error('Failed to load pending assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending, activeTab]);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await apiService.approveAssignment(id);
      toast.success('Assignment approved');
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await apiService.rejectAssignment(id);
      toast.success('Assignment rejected');
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = assignments.filter((a) => roleBelongsToTab(a.role_name, activeTab));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-white rounded-3xl border border-slate-200">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Loading approval queue...</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-6 bg-emerald-50 rounded-full">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">All caught up!</h3>
          <p className="text-slate-500">No pending {activeTab === 'all' ? '' : activeTab} role assignments need your approval.</p>
          <button
            onClick={loadPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all mt-2"
          >
            <RefreshCw size={14} />
            Refresh Queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Pending Approvals
          <span className="ml-2 px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
            {filtered.length}
          </span>
        </h2>
        <button
          onClick={loadPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left border-collapse table-fixed">
          <thead>
          <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
            <th className="px-3 py-3 w-[18%]">Member</th>
            <th className="pl-1 pr-2 py-3 w-[12%]">Role</th>
            <th className="px-3 py-3 w-[14%]">Jumuiya</th>
            <th className="px-3 py-3 w-[20%]">Pages Access</th>
            <th className="px-3 py-3 w-[12%]">Assigned By</th>
            <th className="px-3 py-3 w-[8%]">Date</th>
            <th className="px-3 py-3 w-[16%] text-right">Actions</th>
          </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
          {filtered.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-3 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-slate-600 font-bold text-xs border-2 border-white shadow-sm">
                    {a.first_name[0]}{a.last_name?.[0] ?? ''}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 truncate">{a.first_name} {a.last_name}</p>
                    <p className="text-[9px] text-slate-400 font-medium uppercase truncate">{a.member_id}</p>
                  </div>
                </div>
              </td>
              <td className="pl-1 pr-2 py-3">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 capitalize block truncate">
                  {getRoleDisplayName(a)}
                </span>
              </td>
              <td className="px-3 py-3">
                {a.jumuiya_name ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100/80 truncate max-w-full">
                    {a.jumuiya_name}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">—</span>
                )}
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1">
                  {getPagesForRole(a.role_name).map((page) => (
                    <span key={page} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-semibold rounded border border-emerald-100 leading-tight">
                      {page}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-3 py-3">
                <span className="text-[10px] text-slate-600 font-medium truncate block">
                  {a.assigned_by_first ? `${a.assigned_by_first} ${a.assigned_by_last}` : '—'}
                </span>
              </td>
              <td className="px-3 py-3">
                <span className="text-[10px] text-slate-400">
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </td>
              <td className="px-3 py-3 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleApprove(a.id)}
                    disabled={actionLoading === a.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {actionLoading === a.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(a.id)}
                    disabled={actionLoading === a.id}
                    className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl text-[10px] transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    <Ban size={11} />
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActiveRolesPanel({ activeTab }: { activeTab: TabKey }) {
  const [active, setActive] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadActive();
  }, []);

  const loadActive = async () => {
    setLoading(true);
    try {
      const data = await apiService.getRoleAssignments('approved');
      setActive(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load active role assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    setActionLoading(id);
    try {
      await apiService.revokeAssignment(id);
      toast.success('Access revoked');
      loadActive();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to revoke');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = active.filter((a) => roleBelongsToTab(a.role_name, activeTab));

  if (loading) return null;
  if (filtered.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" />
          Active Role Assignments
          <span className="ml-2 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
            {filtered.length}
          </span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Officials with approved access. You can revoke access at any time.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left border-collapse table-fixed">
          <thead>
          <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
            <th className="px-3 py-3 w-[18%]">Member</th>
            <th className="pl-1 pr-2 py-3 w-[12%]">Role</th>
            <th className="px-3 py-3 w-[14%]">Jumuiya</th>
            <th className="px-3 py-3 w-[20%]">Pages Access</th>
            <th className="px-3 py-3 w-[12%]">Approved By</th>
            <th className="px-3 py-3 w-[8%]">Approved At</th>
            <th className="px-3 py-3 w-[16%] text-right">Actions</th>
          </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
          {filtered.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-3 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center text-slate-600 font-bold text-xs border-2 border-white shadow-sm">
                    {a.first_name[0]}{a.last_name?.[0] ?? ''}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 truncate">{a.first_name} {a.last_name}</p>
                    <p className="text-[9px] text-slate-400 font-medium uppercase truncate">{a.member_id}</p>
                  </div>
                </div>
              </td>
              <td className="pl-1 pr-2 py-3">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100 capitalize block truncate">
                  {getRoleDisplayName(a)}
                </span>
              </td>
              <td className="px-3 py-3">
                {a.jumuiya_name ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100/80 truncate max-w-full">
                    {a.jumuiya_name}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">—</span>
                )}
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1">
                  {getPagesForRole(a.role_name).map((page) => (
                    <span key={page} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-semibold rounded border border-emerald-100 leading-tight">
                      {page}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-3 py-3">
                <span className="text-[10px] text-slate-600 font-medium truncate block">
                  {a.approved_by_first ? `${a.approved_by_first} ${a.approved_by_last}` : '—'}
                </span>
              </td>
              <td className="px-3 py-3">
                <span className="text-[10px] text-slate-400">
                  {a.approved_at ? new Date(a.approved_at).toLocaleDateString() : '—'}
                </span>
              </td>
              <td className="px-3 py-3 text-right">
                <button
                  onClick={() => handleRevoke(a.id)}
                  disabled={actionLoading === a.id}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-[10px] transition-all disabled:opacity-50 flex items-center gap-1 ml-auto"
                >
                  {actionLoading === a.id ? <Loader2 size={11} className="animate-spin" /> : <ShieldOff size={11} />}
                  Revoke
                </button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevokedRolesPanel({ activeTab }: { activeTab: TabKey }) {
  const [revoked, setRevoked] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadRevoked();
  }, []);

  const loadRevoked = async () => {
    setLoading(true);
    try {
      const data = await apiService.getRoleAssignments('revoked');
      setRevoked(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load revoked assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: number) => {
    setActionLoading(id);
    try {
      await apiService.activateAssignment(id);
      toast.success('Role reactivated');
      loadRevoked();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reactivate');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Permanently delete this role assignment? This cannot be undone.')) return;
    setActionLoading(id);
    try {
      await apiService.deleteAssignment(id);
      toast.success('Assignment deleted');
      setRevoked((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRevoked = revoked.filter((a) => roleBelongsToTab(a.role_name, activeTab));

  if (loading) return null;
  if (filteredRevoked.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 border-b border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Revoked Role Assignments
            <span className="ml-2 px-2.5 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded-full">
              {filteredRevoked.length}
            </span>
          </h2>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Officials whose access was revoked. Reactivate to restore or delete permanently.
        </p>
      </button>
      {expanded && (
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="px-3 py-3 w-[18%]">Member</th>
              <th className="pl-1 pr-2 py-3 w-[12%]">Role</th>
              <th className="px-3 py-3 w-[14%]">Jumuiya</th>
              <th className="px-3 py-3 w-[20%]">Pages Access</th>
              <th className="px-3 py-3 w-[13%]">Previous Approval</th>
              <th className="px-3 py-3 w-[23%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRevoked.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-rose-50 to-red-50 flex items-center justify-center text-slate-600 font-bold text-xs border-2 border-white shadow-sm">
                      {a.first_name[0]}{a.last_name?.[0] ?? ''}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{a.first_name} {a.last_name}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase truncate">{a.member_id}</p>
                    </div>
                  </div>
                </td>
                <td className="pl-1 pr-2 py-3">
                  <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-100 capitalize block truncate">
                    {getRoleDisplayName(a)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {a.jumuiya_name ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100/80 truncate max-w-full">
                      {a.jumuiya_name}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {getPagesForRole(a.role_name).map((page) => (
                      <span key={page} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-semibold rounded border border-slate-200 leading-tight">
                        {page}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="text-[10px] text-slate-600 font-medium truncate block">
                    {a.approved_by_first ? `${a.approved_by_first} ${a.approved_by_last}` : '—'}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleActivate(a.id)}
                      disabled={actionLoading === a.id}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[10px] transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      {actionLoading === a.id ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                      Reactivate
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={actionLoading === a.id}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-[10px] transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      <Trash2 size={11} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
