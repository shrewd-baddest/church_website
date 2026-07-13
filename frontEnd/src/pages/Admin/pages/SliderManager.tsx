import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Image, Plus, Trash2, GripVertical, Upload, Eye, Edit2, Save, X, Loader2, Link as LinkIcon, FileImage, RefreshCw } from 'lucide-react';
import apiService from '../../Landing/services/api';
import { uploadFile } from '../../../api/axiosInstance';
import { toast } from 'react-hot-toast';

interface SliderImage {
  id: number | string;
  section: string;
  url: string;
  image_url?: string;
  title: string;
  message: string;
  position: number;
}

interface Props { sectionFilter?: string[] }

const ALL_SECTIONS = [
  { id: 'sacramentals', label: 'Sacramentals', icon: '✝️' },
  { id: 'tshirts', label: 'T-Shirts', icon: '👕' },
  { id: 'chairs', label: 'Chairs', icon: '🪑' },
  { id: 'instruments', label: 'Instruments', icon: '🎸' },
];

export default function SliderManager({ sectionFilter }: Props) {
  const SECTIONS = sectionFilter
    ? ALL_SECTIONS.filter(s => sectionFilter.includes(s.id))
    : ALL_SECTIONS;
  const [activeSection, setActiveSection] = useState(SECTIONS[0]?.id || 'sacramentals');
  const [slides, setSlides] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', message: '', image_url: '' });
  const [newSlide, setNewSlide] = useState({ image_url: '', title: '', message: '' });
  const [inputMode, setInputMode] = useState<'url' | 'file'>('url');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSlides = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getSacramentalsSliderImages(activeSection);
      setSlides(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load slider images');
      setSlides([]);
    } finally {
      setLoading(false);
    }
  }, [activeSection]);

  useEffect(() => { loadSlides(); }, [loadSlides]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setUploadingFile(true);
    setUploadProgress(0);
    try {
      const response = await uploadFile(file, {
        onProgress: setUploadProgress,
      });
      const result = response.data;
      const imageUrl = result?.data?.url || result?.url;
      if (imageUrl) {
        setNewSlide(p => ({ ...p, image_url: imageUrl }));
        toast.success('Image uploaded!');
      } else {
        toast.error('Upload succeeded but no URL returned');
      }
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleAdd = async () => {
    if (!newSlide.image_url.trim()) {
      toast.error('Image URL is required');
      return;
    }
    setAdding(true);
    try {
      const result = await apiService.createSacramentalsSliderImage({
        section: activeSection,
        image_url: newSlide.image_url,
        title: newSlide.title,
        message: newSlide.message,
      });
      // Clear cache for this section so frontend fetches fresh data
      apiService.clearCache(`slider-images?section=${activeSection}`);
      apiService.clearCache('slider-images');
      setSlides(prev => [...prev, result]);
      setNewSlide({ image_url: '', title: '', message: '' });
      toast.success('Slide added!');
    } catch {
      toast.error('Failed to add slide');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm('Delete this slide image?')) return;
    try {
      await apiService.deleteSacramentalsSliderImage(id);
      // Clear cache for this section
      apiService.clearCache(`slider-images?section=${activeSection}`);
      apiService.clearCache('slider-images');
      setSlides(prev => prev.filter(s => s.id !== id));
      toast.success('Slide deleted');
    } catch {
      toast.error('Failed to delete slide');
    }
  };

  const startEdit = (slide: SliderImage) => {
    setEditingId(slide.id);
    setEditForm({ title: slide.title || '', message: slide.message || '', image_url: slide.url || slide.image_url || '' });
  };

  const handleSave = async (id: number | string) => {
    try {
      const result = await apiService.updateSacramentalsSliderImage(id, {
        title: editForm.title,
        message: editForm.message,
        image_url: editForm.image_url,
      });
      // Clear cache for this section
      apiService.clearCache(`slider-images?section=${activeSection}`);
      apiService.clearCache('slider-images');
      setSlides(prev => prev.map(s => s.id === id ? { ...s, ...result } : s));
      setEditingId(null);
      toast.success('Slide updated');
    } catch {
      toast.error('Failed to update slide');
    }
  };

  const activeSectionLabel = SECTIONS.find(s => s.id === activeSection)?.label || activeSection;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Image className="w-8 h-8 text-blue-600" />
          Slider Image Manager
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Manage hero slider images for each product category.
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 flex-wrap">
        {SECTIONS.map(sec => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeSection === sec.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            <span className="text-lg">{sec.icon}</span>
            {sec.label}
            {activeSection === sec.id && (
              <span className="bg-white/25 text-xs px-2 py-0.5 rounded-full">{slides.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Add New Slide */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Add New Slide — {activeSectionLabel}
        </h2>

        {/* Input Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setInputMode('url')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              inputMode === 'url'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:border-slate-200'
            }`}
          >
            <LinkIcon size={14} />
            Paste URL
          </button>
          <button
            onClick={() => setInputMode('file')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              inputMode === 'file'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:border-slate-200'
            }`}
          >
            <FileImage size={14} />
            Upload from PC
          </button>
        </div>

        {/* URL Input Mode */}
        {inputMode === 'url' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Image URL *</label>
              <input
                type="url"
                value={newSlide.image_url}
                onChange={e => setNewSlide(p => ({ ...p, image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Title (optional)</label>
              <input
                type="text"
                value={newSlide.title}
                onChange={e => setNewSlide(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. New Collection"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Subtitle / Message (optional)</label>
              <input
                type="text"
                value={newSlide.message}
                onChange={e => setNewSlide(p => ({ ...p, message: e.target.value }))}
                placeholder="e.g. Explore our latest arrivals"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
          </div>
        )}

        {/* File Upload Mode */}
        {inputMode === 'file' && (
          <div className="space-y-4">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              {uploadingFile ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="text-blue-500 animate-spin" />
                  <p className="text-sm text-slate-600 font-medium">
                    {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Compressing & uploading...'}
                  </p>
                  {uploadProgress > 0 && (
                    <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload size={32} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-bold text-slate-700">Click to browse or drag & drop</p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP — up to 5MB</p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Title (optional)</label>
                <input
                  type="text"
                  value={newSlide.title}
                  onChange={e => setNewSlide(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. New Collection"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Subtitle / Message (optional)</label>
                <input
                  type="text"
                  value={newSlide.message}
                  onChange={e => setNewSlide(p => ({ ...p, message: e.target.value }))}
                  placeholder="e.g. Explore our latest arrivals"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {newSlide.image_url && (
          <div className="relative h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <img
              src={newSlide.image_url}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {newSlide.title && (
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                {newSlide.title}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={adding || uploadingFile || !newSlide.image_url.trim()}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors flex items-center gap-2 text-sm"
        >
          {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {adding ? 'Adding...' : 'Add Slide'}
        </button>
      </div>

      {/* Existing Slides */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Current Slides — {activeSectionLabel}
            <span className="text-sm font-normal text-slate-400">({slides.length} images)</span>
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 mt-3 text-sm">Loading slides...</p>
          </div>
        ) : slides.length === 0 ? (
          <div className="p-12 text-center">
            <Image className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No slider images for {activeSectionLabel}</p>
            <p className="text-slate-400 text-sm mt-1">Add one above to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {slides.map((slide, idx) => (
              <div key={slide.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors group">
                {/* Drag handle */}
                <div className="text-slate-300 group-hover:text-slate-500 cursor-grab">
                  <GripVertical size={18} />
                </div>

                {/* Thumbnail */}
                <div className="w-28 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                  <img
                    src={slide.url || slide.image_url}
                    alt={slide.title || `Slide ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60"><rect fill="%23e2e8f0" width="100" height="60"/><text x="50" y="35" text-anchor="middle" fill="%2394a3b8" font-size="12">No Image</text></svg>'; }}
                  />
                </div>

                {/* Info / Edit */}
                {editingId === slide.id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="url"
                      value={editForm.image_url}
                      onChange={e => setEditForm(p => ({ ...p, image_url: e.target.value }))}
                      placeholder="Image URL"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="Title"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                      type="text"
                      value={editForm.message}
                      onChange={e => setEditForm(p => ({ ...p, message: e.target.value }))}
                      placeholder="Message"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 md:col-span-2"
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{slide.title || '(No title)'}</p>
                    <p className="text-xs text-slate-500 truncate">{slide.message || '(No message)'}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">{slide.url || slide.image_url}</p>
                  </div>
                )}

                {/* Position badge */}
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg flex-shrink-0">
                  #{idx + 1}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {editingId === slide.id ? (
                    <>
                      <button
                        onClick={() => handleSave(slide.id)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="Save"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(slide)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(slide.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
