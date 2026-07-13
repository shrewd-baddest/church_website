import { useEffect, useState } from "react";
import apiService from "../../Landing/services/api";
import { Plus, Pencil, Trash2, RefreshCcw, X, Loader2, Tag } from "lucide-react";

interface Props { typeFilter?: "sale" | "hire" }

export default function CategoryManager(props: Props) {
  const { typeFilter } = props;
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", type: typeFilter || "sale" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await apiService.fetchTableData("categories", false);
      setCategories(Array.isArray(data) ? data : []);
    } catch { setCategories([]); }
    finally { setLoading(false); }
  };

  const display = categories.filter((c: any) => !typeFilter || c.type === typeFilter);

  const openForm = (cat?: any) => {
    if (cat) {
      setEditing(cat);
      setForm({ name: cat.name || "", type: cat.type || typeFilter || "sale" });
    } else {
      setEditing(null);
      setForm({ name: "", type: typeFilter || "sale" });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await apiService.updateRecord("categories", editing.id, form);
      } else {
        await apiService.createRecord("categories", form);
      }
      apiService.clearCache("categories");
      setShowForm(false);
      loadCategories();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await apiService.deleteRecord("categories", id);
      apiService.clearCache("categories");
      loadCategories();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Tag size={22} className="text-blue-600" /> {typeFilter === 'hire' ? 'Hire Categories' : 'Sale Categories'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {typeFilter === 'hire' ? 'Categories for chairs & instruments (hire)' : 'Categories for sacramentals & t-shirts (sale)'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md">
            <Plus size={16} /> Add Category
          </button>
          <button onClick={loadCategories} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <RefreshCcw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {display.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Tag size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No categories yet</p>
          <p className="text-sm mt-1">Add your first category above.</p>
        </div>
      ) : (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {display.map((cat: any) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-800">{cat.name || cat.label}</h3>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${cat.type === 'hire' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {cat.type === 'hire' ? 'Hire' : 'Sale'}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openForm(cat)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 text-lg">{editing ? "Edit Category" : `Add ${typeFilter === 'hire' ? 'Hire' : 'Sale'} Category`}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category Name</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={typeFilter === 'hire' ? 'e.g. Chairs' : 'e.g. Candles'} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {!typeFilter && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="sale">Buy / Sale</option>
                  <option value="hire">Hire</option>
                </select>
              </div>
              )}
              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all">
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
