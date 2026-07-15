import { useEffect, useState } from "react";
import activitiesService from "../../../api/activitiesServices";
import { Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface Activity {
  id: number;
  day: string;
  time: string;
  activity: string;
  venue: string;
  fare: string | number | null;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = { day: "Monday", time: "", activity: "", venue: "", fare: "" };

export default function WeeklyActivitiesAdmin() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await activitiesService.getWeekly();
      setActivities(data || []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to load activities";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.day || !form.time || !form.activity || !form.venue) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await activitiesService.updateWeekly(editingId, form);
      } else {
        await activitiesService.createWeekly(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to save activity";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(a: Activity) {
    setForm({ day: a.day, time: a.time, activity: a.activity, venue: a.venue, fare: a.fare ? String(a.fare) : "" });
    setEditingId(a.id);
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this activity?")) return;
    setError(null);
    try {
      await activitiesService.deleteWeekly(id);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to delete";
      setError(msg);
    }
  }

  async function toggleActive(a: Activity) {
    setError(null);
    try {
      if (a.is_active) {
        await activitiesService.deactivateWeekly(a.id);
      } else {
        await activitiesService.activateWeekly(a.id);
      }
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to toggle";
      setError(msg);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Weekly Activities</h2>
          <p className="text-sm text-slate-500 mt-1">Manage the recurring weekly schedule shown on the public activities page.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-4">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              {editingId ? <Pencil size={16} /> : <Plus size={16} />}
              {editingId ? "Edit Activity" : "Add New Activity"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Day</label>
                <select
                  value={form.day}
                  onChange={(e) => setForm({ ...form, day: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  required
                >
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Activity Name</label>
                <input
                  value={form.activity}
                  onChange={(e) => setForm({ ...form, activity: e.target.value })}
                  placeholder='e.g. "Rosary Prayers", "Choir Practice"'
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Time</label>
                <input
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder='e.g. "6:00 PM" or "18:00"'
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Venue</label>
                <input
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  placeholder='e.g. "Parish Hall"'
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Fare (KES)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.fare}
                  onChange={(e) => setForm({ ...form, fare: e.target.value })}
                  placeholder='e.g. "500" — leave empty for free'
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors">
                  {saving ? "Saving..." : editingId ? "Update" : "Add Activity"}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="xl:col-span-2">
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">Loading...</div>
          ) : activities.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <p className="text-slate-400 text-sm mb-2">No weekly activities yet.</p>
              <p className="text-slate-300 text-xs">Use the form to add your first activity — it will appear on the public page immediately.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className={`bg-white rounded-xl border ${a.is_active ? "border-slate-200" : "border-slate-100 bg-slate-50/50"} p-4 flex items-center gap-4 transition-all hover:shadow-sm`}>
                  <div className={`w-2 h-10 rounded-full shrink-0 ${a.is_active ? "bg-emerald-400" : "bg-slate-200"}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{a.day}</span>
                      {!a.is_active && <span className="text-[10px] font-semibold text-slate-300 bg-slate-100 px-2 py-0.5 rounded">Inactive</span>}
                    </div>
                    <h4 className="font-semibold text-slate-800">{a.activity}</h4>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                      <span>{a.time}</span>
                      <span>{a.venue}</span>
                      {a.fare && <span className="font-semibold text-emerald-600">KES {Number(a.fare).toLocaleString()}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(a)} title={a.is_active ? "Deactivate" : "Activate"}
                      className={`p-2 rounded-lg transition-colors ${a.is_active ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50" : "text-slate-300 hover:text-emerald-500 hover:bg-emerald-50"}`}>
                      {a.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => startEdit(a)} title="Edit"
                      className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(a.id)} title="Delete"
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
