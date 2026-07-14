import { useEffect, useState } from "react";
import apiService from "../../Landing/services/api";
import { Plus, Pencil, Trash2, RefreshCcw, X, Loader2, Tag, FolderOpen } from "lucide-react";
import PanelHeader from "../components/PanelHeader";
import EmptyState from "../components/EmptyState";

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

  const typeColors: Record<string, string> = {
    sale: 'bg-blue-100 text-blue-700',
    hire: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="space-y-4">
      <PanelHeader
        title={typeFilter === 'hire' ? 'Hire Categories' : 'Sale Categories'}
        subtitle={typeFilter === 'hire' ? 'Categories for chairs & instruments (hire)' : 'Categories for sacramentals & t-shirts (sale)'}
        icon={Tag}
        onRefresh={loadCategories}
        loading={loading}
        actions={
          <button onClick={() => openForm()} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-200">
            <Plus size={13} /> Add
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-xl border border-slate-200">
          <Loader2 size={16} className="animate-spin text-blue-600 mr-2" />
          <span className="text-xs font-medium text-slate-500">Loading categories...</span>
        </div>
      ) : display.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No categories yet" subtitle={`Add your first ${typeFilter === 'hire' ? 'hire' : 'sale'} category.`} action={
          <button onClick={() => openForm()} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-200">
            <Plus size={13} /> Add Category
          </button>
        } />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {display.map((cat: any) => (
            <div key={cat.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <Tag size={14} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">{cat.name || cat.label}</h3>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${typeColors[cat.type] || 'bg-slate-100 text-slate-600'}`}>
                      {cat.type === 'hire' ? 'Hire' : 'Sale'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openForm(cat)} className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-all"><Pencil size={11} /></button>
                  <button onClick={() => handleDelete(cat.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-all"><Trash2 size={11} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  {editing ? <Pencil size={13} /> : <Tag size={13} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{editing ? "Edit Category" : `Add ${typeFilter === 'hire' ? 'Hire' : 'Sale'} Category`}</h3>
                  <p className="text-[10px] text-slate-400">{editing ? "Update details" : "Create a new category"}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"><X size={14} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category Name</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={typeFilter === 'hire' ? 'e.g. Chairs' : 'e.g. Candles'} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
              </div>
              {!typeFilter && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                    <option value="sale">Buy / Sale</option>
                    <option value="hire">Hire</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowForm(false)} className="px-3.5 py-1.5 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-all text-xs">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg transition-all text-xs flex items-center gap-1.5 shadow-sm shadow-blue-200">
                {saving ? <><Loader2 size={11} className="animate-spin" /> Saving...</> : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
