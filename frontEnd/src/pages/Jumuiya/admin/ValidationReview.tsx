import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { memberService } from "../../../api/jumuiyaMemberService";
import { RefreshCw, Save, X, Edit3, Users, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  jumuiyaId: string;
}

const EditableRow = memo(({ m, onSave, onToggleActive }: {
  m: any;
  onSave: (id: string, data: any) => Promise<void>;
  onToggleActive: (id: string, active: boolean) => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: m.first_name || "",
    last_name: m.last_name || "",
    member_id: m.member_id || "",
    gender: m.gender || "",
    phone: m.phone || "",
    email: m.email || "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(m.member_id, form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    await onToggleActive(m.member_id, !m.is_active);
  };

  return (
    <tr className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${!m.is_active ? "bg-slate-50 opacity-70" : ""}`}>
      <td className="py-2.5 px-3">
        {editing ? (
          <div className="flex gap-2 items-center">
            <input value={form.first_name} onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))}
              className="w-20 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" placeholder="First" />
            <input value={form.last_name} onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))}
              className="w-20 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" placeholder="Last" />
          </div>
        ) : (
          <span className="text-sm text-slate-700 font-medium">{m.first_name} {m.last_name}</span>
        )}
      </td>
      <td className="py-2.5 px-3">
        {editing ? (
          <input value={form.member_id} onChange={(e) => setForm(f => ({ ...f, member_id: e.target.value }))}
            className="w-28 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
        ) : (
          <span className="text-xs text-slate-600 font-mono">{m.member_id}</span>
        )}
      </td>
      <td className="py-2.5 px-3">
        {editing ? (
          <select value={form.gender} onChange={(e) => setForm(f => ({ ...f, gender: e.target.value }))}
            className="w-20 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Ladies</option>
          </select>
        ) : (
          <span className={`text-xs font-semibold ${m.gender === "male" ? "text-blue-600" : m.gender === "female" ? "text-pink-600" : "text-slate-400"}`}>
            {m.gender === "male" ? "M" : m.gender === "female" ? "W" : "—"}
          </span>
        )}
      </td>
      <td className="py-2.5 px-3">
        {editing ? (
          <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-24 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
        ) : (
          <span className="text-xs text-slate-500">{m.phone || "—"}</span>
        )}
      </td>
      <td className="py-2.5 px-3">
        {editing ? (
          <input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-24 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
        ) : (
          <span className="text-xs text-slate-500">{m.email || "—"}</span>
        )}
      </td>
      <td className="py-2.5 px-3">
        <button onClick={handleToggle}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
            m.is_active
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${m.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
          {m.is_active ? "Active" : "Inactive"}
        </button>
      </td>
      <td className="py-2.5 px-3">
        {editing ? (
          <div className="flex gap-1">
            <button onClick={handleSave} disabled={saving}
              className="p-1 rounded text-emerald-500 hover:bg-emerald-50 transition-colors" title="Save">
              <Save size={14} className={saving ? "animate-spin" : ""} />
            </button>
            <button onClick={() => setEditing(false)}
              className="p-1 rounded text-red-400 hover:bg-red-50 transition-colors" title="Cancel">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            className="p-1 rounded text-indigo-400 hover:bg-indigo-50 transition-colors" title="Edit">
            <Edit3 size={14} />
          </button>
        )}
      </td>
    </tr>
  );
});

EditableRow.displayName = "EditableRow";

const ValidationReview: React.FC<Props> = ({ jumuiyaId }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await memberService.getMembers(jumuiyaId);
      setMembers(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  }, [jumuiyaId]);

  useEffect(() => { fetchMembers(); }, [jumuiyaId]);

  const handleSave = async (id: string, data: any) => {
    try {
      await memberService.updateMember(id, data);
      setMembers(prev => prev.map(m => m.member_id === id ? { ...m, ...data } : m));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Save failed");
    }
  };

  const handleToggleActive = async (id: string, is_active: boolean) => {
    try {
      await memberService.updateMember(id, { is_active });
      setMembers(prev => prev.map(m => m.member_id === id ? { ...m, is_active } : m));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to update status");
    }
  };

  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(m =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
      (m.member_id || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q)
    );
  }, [members, search]);

  const activeCount = members.filter(m => m.is_active !== false).length;
  const inactiveCount = members.filter(m => m.is_active === false).length;

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4" />
        <div className="h-48 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-slate-800">{members.length}</p>
          <p className="text-xs text-slate-500 font-medium">Total Members</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          <p className="text-xs text-slate-500 font-medium">Active</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-red-500">{inactiveCount}</p>
          <p className="text-xs text-slate-500 font-medium">Inactive (Flagged)</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Member Editor</h3>
          <p className="text-xs text-slate-500">Edit member details and flag inactive members. Changes propagate to all related tables.</p>
        </div>
        <div className="flex items-center gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="pl-3 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 w-48" />
          <button onClick={fetchMembers}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {members.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Users size={32} className="text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No members found.</p>
          <p className="text-slate-300 text-xs mt-1">Import or add members first.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Reg #</th>
                <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Gender</th>
                <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Phone</th>
                <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Email</th>
                <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <EditableRow key={m.member_id} m={m} onSave={handleSave} onToggleActive={handleToggleActive} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ValidationReview;
