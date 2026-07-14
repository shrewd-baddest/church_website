import { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutGrid, Plus, Trash2, Upload, Link as LinkIcon, FileImage, Loader2, RefreshCw } from 'lucide-react';
import apiService from '../../Landing/services/api';
import { uploadFile } from '../../../api/axiosInstance';
import { toast } from 'react-hot-toast';

interface Props { sectionFilter?: string[] }

const CATEGORY_LABELS: Record<string, string> = {
  sacramentals: 'Sacramentals', tshirts: 'T-Shirts', chairs: 'Chairs', instruments: 'Instruments',
};

export default function CategoryCardManager({ sectionFilter }: Props) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [inputMode, setInputMode] = useState<'url' | 'file'>('url');
  const [newCardCategory, setNewCardCategory] = useState('');
  const [showNewCard, setShowNewCard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeCategoryRef = useRef<string | null>(null);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getCategoryCards();
      const all = Array.isArray(data) ? data : [];
      setCards(sectionFilter ? all.filter((c: any) => sectionFilter.includes(c.category)) : all);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [sectionFilter]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const handleFileUpload = async (category: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setUploading(category);
    setUploadProgress(p => ({ ...p, [category]: 0 }));
    activeCategoryRef.current = category;
    try {
      const response = await uploadFile(file, {
        onProgress: (pct) => setUploadProgress(prev => ({ ...prev, [category]: pct })),
      });
      const result = response.data;
      const imageUrl = result?.data?.url || result?.url;
      if (imageUrl) {
        setCards(prev => prev.map(c => c.category === category ? { ...c, image_url: imageUrl } : c));
        toast.success('Image uploaded!');
      } else {
        toast.error('Upload succeeded but no URL returned');
      }
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(null);
      activeCategoryRef.current = null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(category, file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (card: any) => {
    if (!card.image_url.trim()) {
      toast.error('Image URL is required');
      return;
    }
    setSaving(card.category);
    try {
      await apiService.upsertCategoryCard({
        category: card.category,
        image_url: card.image_url,
        label: card.label,
        tag: card.tag,
      });
      apiService.clearCache('category-cards');
      toast.success(`${card.label} card saved!`);
    } catch {
      toast.error('Failed to save card');
    } finally {
      setSaving(null);
    }
  };

  const handleDrop = (e: React.DragEvent, category: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(category, file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-blue-600" />
          Home Page Cards
        </h1>
        <p className="text-slate-500 font-medium mt-0.5 text-xs">
          Manage the category card images displayed on the home page.
        </p>
      </div>

      {/* Input Mode */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setInputMode('url')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            inputMode === 'url'
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
              : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:border-slate-200'
          }`}
        >
          <LinkIcon size={12} /> Paste URL
        </button>
        <button
          onClick={() => setInputMode('file')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            inputMode === 'file'
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
              : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:border-slate-200'
          }`}
        >
          <FileImage size={12} /> Upload from PC
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={18} className="animate-spin text-blue-600" />
        </div>
      ) : cards.length === 0 && !showNewCard ? (
        <div className="text-center py-10 text-slate-400">
          <LayoutGrid size={32} className="mx-auto mb-2 opacity-30" />
          <p className="font-semibold text-slate-500 text-xs">No home cards yet</p>
          <p className="text-[11px] mt-1">Add your first card to appear on the home page.</p>
          <button onClick={() => setShowNewCard(true)} className="mt-3 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all inline-flex items-center gap-1.5">
            <Plus size={14} /> New Card
          </button>
        </div>
      ) : (
        <>
        {showNewCard && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs">New Home Card</h3>
            <select
              value={newCardCategory}
              onChange={e => setNewCardCategory(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select category...</option>
              {(sectionFilter || ['sacramentals', 'tshirts', 'chairs', 'instruments']).map(cat => (
                <option key={cat} value={cat} disabled={cards.some(c => c.category === cat)}>
                  {CATEGORY_LABELS[cat] || cat} {cards.some(c => c.category === cat) ? '(already added)' : ''}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!newCardCategory) return;
                  setCards(prev => [...prev, { category: newCardCategory, label: CATEGORY_LABELS[newCardCategory] || newCardCategory, tag: '', image_url: '' }]);
                  setNewCardCategory('');
                  setShowNewCard(false);
                }}
                disabled={!newCardCategory}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-bold transition-all"
              >
                Add
              </button>
              <button onClick={() => setShowNewCard(false)} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <button onClick={() => setShowNewCard(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm">
            <Plus size={14} /> Add Card
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map(card => (
            <div key={card.category} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Card Preview */}
              <div className="relative h-36 bg-slate-100">
                {card.image_url ? (
                  <img
                    src={card.image_url}
                    alt={card.label}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <LayoutGrid size={36} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                  <span className="text-white font-bold text-sm drop-shadow-sm">{card.label}</span>
                  <span className="bg-white/80 text-slate-800 text-[9px] font-semibold px-1.5 py-0.5 rounded-md">{card.tag}</span>
                </div>
              </div>

              {/* Edit Form */}
              <div className="p-3 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {inputMode === 'url' ? 'Image URL *' : 'Upload Image'}
                  </label>

                  {inputMode === 'url' ? (
                    <input
                      type="url"
                      value={card.image_url}
                      onChange={e => setCards(prev => prev.map(c => c.category === card.category ? { ...c, image_url: e.target.value } : c))}
                      placeholder="https://example.com/image.jpg"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  ) : (
                    <div
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDrop(e, card.category)}
                      onClick={() => { activeCategoryRef.current = card.category; fileInputRef.current?.click(); }}
                      className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-slate-50 transition-all"
                    >
                      {uploading === card.category ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <Loader2 size={18} className="text-blue-500 animate-spin" />
                          <p className="text-xs text-slate-600 font-medium">
                            {uploadProgress[card.category] > 0 ? `${uploadProgress[card.category]}%` : 'Compressing...'}
                          </p>
                          {uploadProgress[card.category] > 0 && (
                            <div className="w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress[card.category]}%` }} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload size={18} className="text-slate-400" />
                          <p className="text-[11px] text-slate-500">Click or drag image here</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Label</label>
                    <input
                      type="text"
                      value={card.label}
                      onChange={e => setCards(prev => prev.map(c => c.category === card.category ? { ...c, label: e.target.value } : c))}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tag</label>
                    <input
                      type="text"
                      value={card.tag}
                      onChange={e => setCards(prev => prev.map(c => c.category === card.category ? { ...c, tag: e.target.value } : c))}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSave(card)}
                  disabled={saving === card.category || !card.image_url.trim()}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs disabled:cursor-not-allowed"
                >
                  {saving === card.category ? (
                    <><Loader2 size={14} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Plus size={14} /> Save Card</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={e => { if (activeCategoryRef.current) handleFileChange(e, activeCategoryRef.current); }}
        className="hidden"
      />
    </div>
  );
}
