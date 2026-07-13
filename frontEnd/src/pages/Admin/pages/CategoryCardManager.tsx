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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-blue-600" />
          Home Page Cards
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Manage the category card images displayed on the home page.
        </p>
      </div>

      {/* Input Mode */}
      <div className="flex gap-2">
        <button
          onClick={() => setInputMode('url')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            inputMode === 'url'
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
              : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:border-slate-200'
          }`}
        >
          <LinkIcon size={14} /> Paste URL
        </button>
        <button
          onClick={() => setInputMode('file')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            inputMode === 'file'
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
              : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:border-slate-200'
          }`}
        >
          <FileImage size={14} /> Upload from PC
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-blue-600" />
        </div>
      ) : cards.length === 0 && !showNewCard ? (
        <div className="text-center py-16 text-slate-400">
          <LayoutGrid size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-500">No home cards yet</p>
          <p className="text-sm mt-1">Add your first card to appear on the home page.</p>
          <button onClick={() => setShowNewCard(true)} className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all inline-flex items-center gap-2">
            <Plus size={16} /> New Card
          </button>
        </div>
      ) : (
        <>
        {showNewCard && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-800">New Home Card</h3>
            <select
              value={newCardCategory}
              onChange={e => setNewCardCategory(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold transition-all"
              >
                Add
              </button>
              <button onClick={() => setShowNewCard(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <button onClick={() => setShowNewCard(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm">
            <Plus size={16} /> Add Card
          </button>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map(card => (
            <div key={card.category} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Card Preview */}
              <div className="relative h-48 bg-slate-100">
                {card.image_url ? (
                  <img
                    src={card.image_url}
                    alt={card.label}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <LayoutGrid size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <span className="text-white font-bold text-lg drop-shadow-sm">{card.label}</span>
                  <span className="bg-white/80 text-slate-800 text-[10px] font-semibold px-2 py-1 rounded-md">{card.tag}</span>
                </div>
              </div>

              {/* Edit Form */}
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    {inputMode === 'url' ? 'Image URL *' : 'Upload Image'}
                  </label>

                  {inputMode === 'url' ? (
                    <input
                      type="url"
                      value={card.image_url}
                      onChange={e => setCards(prev => prev.map(c => c.category === card.category ? { ...c, image_url: e.target.value } : c))}
                      placeholder="https://example.com/image.jpg"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  ) : (
                    <div
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDrop(e, card.category)}
                      onClick={() => { activeCategoryRef.current = card.category; fileInputRef.current?.click(); }}
                      className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-slate-50 transition-all"
                    >
                      {uploading === card.category ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 size={24} className="text-blue-500 animate-spin" />
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
                          <Upload size={24} className="text-slate-400" />
                          <p className="text-xs text-slate-500">Click or drag image here</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Label</label>
                    <input
                      type="text"
                      value={card.label}
                      onChange={e => setCards(prev => prev.map(c => c.category === card.category ? { ...c, label: e.target.value } : c))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Tag</label>
                    <input
                      type="text"
                      value={card.tag}
                      onChange={e => setCards(prev => prev.map(c => c.category === card.category ? { ...c, tag: e.target.value } : c))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSave(card)}
                  disabled={saving === card.category || !card.image_url.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed"
                >
                  {saving === card.category ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Plus size={16} /> Save Card</>
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
