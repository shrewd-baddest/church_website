import { useEffect, useState } from "react";
import activitiesService from "../../../api/activitiesServices";
import { Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw } from "lucide-react";

interface Event {
  id: number;
  title: string;
  description: string;
  date_time: string;
  venue: string;
  fare: string | number | null;
  is_active: boolean;
}

const emptyForm = { title: "", description: "", date_time: "", venue: "", fare: "" };

function formatDateForInput(iso: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(0, 16);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return iso.slice(0, 16); }
}

export default function SemesterActivitiesAdmin() {
  const [events, setEvents] = useState<Event[]>([]);
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
      const data = await activitiesService.getSemester();
      setEvents(data || []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to load events";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.date_time || !form.venue) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        date_time: new Date(form.date_time).toISOString(),
      };
      if (editingId) {
        await activitiesService.updateSemester(editingId, payload);
      } else {
        await activitiesService.createSemester(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to save event";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(e: Event) {
    setForm({
      title: e.title,
      description: e.description || "",
      date_time: formatDateForInput(e.date_time),
      venue: e.venue,
      fare: e.fare ? String(e.fare) : "",
    });
    setEditingId(e.id);
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this event?")) return;
    setError(null);
    try {
      await activitiesService.deleteSemester(id);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to delete";
      setError(msg);
    }
  }

  async function toggleActive(e: Event) {
    setError(null);
    try {
      if (e.is_active) {
        await activitiesService.deactivateSemester(e.id);
      } else {
        await activitiesService.activateSemester(e.id);
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
          <h2 className="text-2xl font-bold text-slate-800">Semester Events</h2>
          <p className="text-sm text-slate-500 mt-1">Manage one-off semester events shown on the public activities page.</p>
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
              {editingId ? "Edit Event" : "Add New Event"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder='e.g. "Youth Retreat"'
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.date_time}
                  onChange={(e) => setForm({ ...form, date_time: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Venue</label>
                <input
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  placeholder='e.g. "Retreat Center"'
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
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional event description..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors">
                  {saving ? "Saving..." : editingId ? "Update" : "Add Event"}
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
          ) : events.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <p className="text-slate-400 text-sm mb-2">No semester events yet.</p>
              <p className="text-slate-300 text-xs">Use the form to add your first event — it will appear on the public page immediately.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((e) => {
                const dt = new Date(e.date_time);
                const isPast = dt < new Date();
                return (
                  <div key={e.id} className={`bg-white rounded-xl border ${e.is_active ? "border-slate-200" : "border-slate-100 bg-slate-50/50"} p-4 flex items-center gap-4 transition-all hover:shadow-sm`}>
                    <div className={`w-2 h-10 rounded-full shrink-0 ${isPast ? "bg-slate-200" : e.is_active ? "bg-indigo-400" : "bg-slate-200"}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        {isPast && <span className="text-[10px] font-semibold text-slate-300 bg-slate-100 px-2 py-0.5 rounded">Past</span>}
                        {!e.is_active && <span className="text-[10px] font-semibold text-slate-300 bg-slate-100 px-2 py-0.5 rounded">Inactive</span>}
                      </div>
                      <h4 className="font-semibold text-slate-800">{e.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>{dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span>{e.venue}</span>
                        {e.fare && <span className="font-semibold text-emerald-600">KES {Number(e.fare).toLocaleString()}</span>}
                      </div>
                      {e.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{e.description}</p>}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleActive(e)} title={e.is_active ? "Deactivate" : "Activate"}
                        className={`p-2 rounded-lg transition-colors ${e.is_active ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50" : "text-slate-300 hover:text-emerald-500 hover:bg-emerald-50"}`}>
                        {e.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => startEdit(e)} title="Edit"
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(e.id)} title="Delete"
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
