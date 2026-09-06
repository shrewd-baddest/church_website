import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../../api/axiosInstance';
import { UPLOAD_BASE } from '../../../api/config';
import { jumuiyaList } from '../../Jumuiya/data/jumuiyaData';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  X, 
  Plus, 
  CheckCircle2, 
  Loader2,
  Edit2,
  Save
} from 'lucide-react';

interface GalleryImage {
  id: number;
  image_url: string;
  event_name: string;
  module_id?: string;
  category?: string;
  description?: string;
  upload_date?: string;
  is_spotlight?: boolean;
  moderation_status?: string;
}

interface Props {
  jumuiyaId?: string;
  jumuiyaInfo?: { name: string; slug?: string; color?: string; saintImage?: string };
}

const EXPLORE_FIELDS = [
  { key: 'explore_jumuiya_image', label: 'Jumuiya', hint: 'Fellowship card' },
  { key: 'explore_activities_image', label: 'Activities', hint: 'Engagement card' },
  { key: 'explore_projects_image', label: 'Projects', hint: 'Growth card' },
  { key: 'explore_officials_image', label: 'Officials', hint: 'Leadership card' },
  { key: 'explore_background_image', label: 'Section Background', hint: 'Full-width backdrop' },
];

const EXPLORE_DEFAULTS: Record<string, string> = {
  explore_jumuiya_image: '/images/biblestudy.webp',
  explore_activities_image: '/images/eucharist.webp',
  explore_projects_image: '/images/church.jpg',
  explore_officials_image: '/images/st-thomas-icon.jpg',
  explore_background_image: '/images/christ.webp',
};

export default function GalleryManager({ jumuiyaId, jumuiyaInfo }: Props = {}) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Patron saint photo state
  const defaultSaintImage = jumuiyaList.find(j => j.id === jumuiyaId)?.saintImage || '';
  const [saintImage, setSaintImage] = useState(jumuiyaInfo?.saintImage || defaultSaintImage);
  const [saintUploading, setSaintUploading] = useState(false);

  // Explore Our Community images state
  const [exploreImages, setExploreImages] = useState<Record<string, string>>({});
  const [exploreLoading, setExploreLoading] = useState(true);
  const [exploreSaving, setExploreSaving] = useState(false);
  const [exploreUploading, setExploreUploading] = useState<string | null>(null);
  const [exploreUploadProgress, setExploreUploadProgress] = useState<Record<string, number>>({});
  const exploreFileRef = useRef<HTMLInputElement>(null);
  const exploreTargetKeyRef = useRef<string>('');

  useEffect(() => {
    if (jumuiyaId) return;
    let active = true;
    apiClient
      .get('/settings')
      .then(({ data }) => {
        if (!active) return;
        const next: Record<string, string> = {};
        EXPLORE_FIELDS.forEach(f => {
          if (data?.[f.key]) next[f.key] = data[f.key];
        });
        setExploreImages(next);
      })
      .catch(() => {
        // keep empty state so defaults are shown
      })
      .finally(() => {
        if (active) setExploreLoading(false);
      });
    return () => {
      active = false;
    };
  }, [jumuiyaId]);

  useEffect(() => {
    const fallback = jumuiyaList.find(j => j.id === jumuiyaId)?.saintImage || '';
    setSaintImage(jumuiyaInfo?.saintImage || fallback);
  }, [jumuiyaId, jumuiyaInfo?.saintImage]);

  const isJumuiya = !!jumuiyaId;
  const categories = isJumuiya
    ? ['Family Prayer Meeting', 'Events', 'Trips']
    : ['general', 'Hero Slider', 'gallery-grid', 'teaser'];
  const [uploadCategory, setUploadCategory] = useState(categories[0]);
  const [activeTab, setActiveTab] = useState('All');
  const [editItem, setEditItem] = useState<GalleryImage | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [dynamicSlidesEnabled, setDynamicSlidesEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hero_dynamic_enabled')
      return saved !== 'false'
    }
    return true
  });

  useEffect(() => {
    loadImages();
  }, [jumuiyaId]);

  useEffect(() => {
    if (!jumuiyaId) {
      localStorage.setItem('hero_dynamic_enabled', String(dynamicSlidesEnabled))
      apiClient.put('/settings', { hero_dynamic_enabled: String(dynamicSlidesEnabled) })
        .catch(() => {})
    }
  }, [dynamicSlidesEnabled, jumuiyaId]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (jumuiyaId) params.module_id = jumuiyaId;
      const { data } = await apiClient.get('/hub-gallery', { params });
      const items = data?.items || [];
      setImages(items);
    } catch (err) {
      console.error('Failed to load gallery:', err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    if (newFiles.length + selectedFiles.length > 10) {
      alert("Maximum 10 photos can be uploaded at once.");
      return;
    }
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [selectedFiles]);

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaintImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !jumuiyaId) return;
    setSaintUploading(true);
    try {
      const { uploadFile } = await import('../../../api/axiosInstance');
      const res = await uploadFile([file]);
      const url = res?.data?.[0]?.url || res?.data?.url || '';
      if (url) {
        await apiClient.patch(`/jumuiya-data/${encodeURIComponent(jumuiyaId)}/saint-image`, { saint_image: url });
        setSaintImage(url);
      }
    } catch (err) {
      console.error('Failed to upload saint image:', err);
    } finally {
      setSaintUploading(false);
    }
  };

  const handleExploreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleExploreUpload(exploreTargetKeyRef.current, file);
    if (exploreFileRef.current) exploreFileRef.current.value = '';
  };

  const handleExploreUpload = async (key: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    setExploreUploading(key);
    setExploreUploadProgress(p => ({ ...p, [key]: 0 }));
    try {
      // Use the dedicated landscape-optimised upload endpoint (900×500 crop)
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/settings/upload-explore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setExploreUploadProgress(prev => ({ ...prev, [key]: Math.round((e.loaded / e.total!) * 100) }));
        },
      });
      const url = res?.data?.data?.url || res?.data?.url || '';
      if (url) {
        setExploreImages(prev => ({ ...prev, [key]: url }));
      } else {
        alert('Upload succeeded but no URL returned');
      }
    } catch (err) {
      console.error('Failed to upload explore image:', err);
      alert('Failed to upload image');
    } finally {
      setExploreUploading(null);
      setExploreUploadProgress(p => ({ ...p, [key]: 0 }));
    }
  };


  const handleExploreSave = async () => {
    setExploreSaving(true);
    try {
      const payload: Record<string, string> = {};
      EXPLORE_FIELDS.forEach(f => {
        payload[f.key] = exploreImages[f.key] || EXPLORE_DEFAULTS[f.key] || '';
      });
      await apiClient.put('/settings', payload);
      alert('Explore Our Community images saved');
    } catch (err) {
      console.error('Failed to save explore images:', err);
      alert('Failed to save images');
    } finally {
      setExploreSaving(false);
    }
  };

  const handleDeleteImage = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this photo from the gallery?')) return;
    try {
      await apiClient.delete(`/hub-gallery/${id}`);
      setImages(prev => prev.filter(img => img.id !== id));
    } catch (err) {
      alert('Failed to delete image');
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploadStatus('uploading');
    setUploadProgress(0);
    let completed = 0;
    try {
      const { uploadFile: uploadFileFn } = await import('../../../api/axiosInstance');
      void uploadFileFn; // imported for potential future use

      for (const file of selectedFiles) {
        const formData = new FormData();
        let fileToUpload = file;
        if (file.size >= 200 * 1024 && file.type.startsWith('image/')) {
          const { resizeImage } = await import('../../../utils/imageOptimization');
          const blob = await resizeImage(file, 1200, 1200);
          fileToUpload = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
        }
        formData.append('files', fileToUpload);
        formData.append('eventName', file.name.replace(/\.[^.]+$/, ''));
        formData.append('description', '');
        formData.append('moduleId', jumuiyaId || 'general');
        formData.append('category', uploadCategory);
        await apiClient.post('/hub-gallery/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        completed++;
        setUploadProgress(Math.round((completed / selectedFiles.length) * 100));
      }
      await loadImages();
      setSelectedFiles([]);
      setUploadStatus('success');
      setUploadProgress(100);
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (err) {
      alert('Upload failed');
      setUploadStatus('idle');
      setUploadProgress(0);
    }
  };

  const saveEdit = async () => {
    if (!editItem) return;
    setEditSaving(true);
    try {
      await apiClient.patch(`/hub-gallery/${editItem.id}`, {
        event_name: editItem.event_name,
        description: editItem.description,
        module_id: editItem.module_id,
        category: editItem.category,
      });
      setImages(prev => prev.map(img => img.id === editItem.id ? editItem : img));
      setEditItem(null);
    } catch (err) {
      alert('Failed to update image details');
    } finally {
      setEditSaving(false);
    }
  };

  const filteredImages = activeTab === 'All'
    ? images
    : images.filter(img => (img.category || 'general') === activeTab);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Edit Modal Overlay */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-lg text-slate-800">Edit Photo Details</h3>
              <button onClick={() => setEditItem(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Section</label>
                <select
                  value={editItem.category || ''}
                  onChange={e => setEditItem({ ...editItem, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select Section...</option>
                  {categories.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Event Name</label>
                <input
                  type="text"
                  value={editItem.event_name || ''}
                  onChange={e => setEditItem({ ...editItem, event_name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="E.g. Sunday Mass"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                <textarea
                  value={editItem.description || ''}
                  onChange={e => setEditItem({ ...editItem, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  placeholder="Description text..."
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setEditItem(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                disabled={editSaving}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={editSaving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200"
              >
                {editSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">
            {jumuiyaInfo ? `${jumuiyaInfo.name} Gallery` : 'Gallery Manager'}
          </h2>
          <p className="text-slate-700 text-xs mt-0.5">
            {jumuiyaInfo ? `Manage photos for ${jumuiyaInfo.name}` : 'Manage public photos and visual media for the church website.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-100">
            {images.length} Photos in Gallery
          </div>
          {!jumuiyaId && (
            <label className="relative inline-flex items-center cursor-pointer px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={dynamicSlidesEnabled}
                onChange={(e) => setDynamicSlidesEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-200 peer-checked:bg-amber-500 rounded-full transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform after:duration-200 peer-checked:after:translate-x-full" />
              <span className="ml-3 text-xs font-bold text-slate-700 whitespace-nowrap">
                Dynamic Slides (Activities + Products)
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Explore Our Community (global gallery only) */}
      {!jumuiyaId && (
        <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-2xl border border-amber-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block" />
                Explore Our Community
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Change the images shown in the "Explore Our Community" section on the homepage.
              </p>
            </div>
            <button
              onClick={handleExploreSave}
              disabled={exploreSaving || exploreLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 hover:-translate-y-0.5 transition-all shadow-md shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exploreSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {exploreSaving ? 'Saving...' : 'Save Images'}
            </button>
          </div>

          {exploreLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-amber-500" />
              <span className="ml-3 text-xs font-bold text-slate-600">Loading section images...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {EXPLORE_FIELDS.map(field => {
                const current = exploreImages[field.key] || EXPLORE_DEFAULTS[field.key] || '';
                const uploading = exploreUploading === field.key;
                return (
                  <div key={field.key} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="relative h-28 bg-slate-100">
                      {current ? (
                        <img
                          src={current}
                          alt={field.label}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon size={28} />
                        </div>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                          <Loader2 size={18} className="animate-spin text-white mb-1" />
                          <span className="text-white text-[9px] font-bold">
                            {exploreUploadProgress[field.key] > 0 ? `${exploreUploadProgress[field.key]}%` : 'Uploading...'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col gap-2">
                      <div>
                        <p className="text-[11px] font-bold text-slate-800">{field.label}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">{field.hint}</p>
                      </div>
                      <input
                        type="url"
                        value={current}
                        onChange={e => setExploreImages(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder="Image URL"
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-300"
                      />
                      <button
                        onClick={() => { exploreTargetKeyRef.current = field.key; exploreFileRef.current?.click(); }}
                        disabled={uploading}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                      >
                        {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <input
            ref={exploreFileRef}
            type="file"
            accept="image/*"
            onChange={handleExploreFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Patron Saint Photo (only for jumuiya-specific galleries) */}
      {jumuiyaId && (
        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-indigo-500 rounded-full inline-block" />
            Patron Saint Photo
          </h3>
          <div className="flex items-center gap-6">
            <div className="w-[150px] h-[150px] rounded-2xl bg-white overflow-hidden border-4 border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.12)] shrink-0">
              {saintImage ? (
                <img
                  src={saintImage}
                  alt="Patron Saint"
                  className="w-full h-full object-cover transition-all duration-600"
                  onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                  style={{ opacity: saintImage ? 1 : 0 }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                  <ImageIcon size={32} className="mb-1 opacity-40" />
                  <span className="text-[10px] font-bold">No Photo</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 mb-1">
                {saintImage ? 'Current photo' : 'No patron saint photo set'}
              </p>
              <p className="text-xs text-slate-400 mb-3">
                Upload a photo of the patron saint for {jumuiyaInfo?.name || 'this Jumuiya'}.
              </p>
              <label className="relative cursor-pointer inline-block">
                <input type="file" accept="image/*" className="hidden" onChange={handleSaintImageUpload} disabled={saintUploading} />
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 hover:-translate-y-0.5 transition-all shadow-md shadow-indigo-200">
                  {saintUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {saintUploading ? 'Uploading...' : saintImage ? 'Replace Photo' : 'Upload Photo'}
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
              <Upload size={14} className="text-blue-600" />
              Upload New Media
            </h3>

            <div
              className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${dragActive
                ? 'border-blue-500 bg-blue-50/50 scale-[0.98]'
                : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
                accept="image/*"
              />
              
              <div className="py-8 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <p className="text-slate-700 font-bold text-xs mb-0.5">Drop photos here</p>
                <p className="text-slate-700 text-[11px]">or click to browse your files</p>
                <div className="mt-3 flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 rounded-full text-[9px] font-bold text-slate-700 uppercase tracking-widest">
                  Max 10 files • JPG, PNG, GIF
                </div>
              </div>
            </div>

            {/* Selected Files Preview & Settings */}
            {selectedFiles.length > 0 && (
              <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 border-t border-slate-100 pt-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Upload To Section</label>
                  <select
                    value={uploadCategory}
                    onChange={e => setUploadCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {categories.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                  <span>Selected ({selectedFiles.length})</span>
                  <button onClick={() => setSelectedFiles([])} className="text-rose-500 hover:text-rose-600">Clear All</button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 group">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0">
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{file.name}</p>
                        <p className="text-[9px] text-slate-700">{(file.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSelectedFile(i); }}
                        className="p-1.5 text-slate-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                {uploadStatus === 'uploading' && uploadProgress > 0 && (
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                <button
                  onClick={handleUpload}
                  disabled={uploadStatus === 'uploading'}
                  className={`w-full py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 ${
                    uploadStatus === 'uploading'
                      ? 'bg-slate-100 text-slate-700 cursor-not-allowed'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5'
                  }`}
                >
                  {uploadStatus === 'uploading' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Uploading...
                    </>
                  ) : uploadStatus === 'success' ? (
                    <>
                      <CheckCircle2 size={18} />
                      Done!
                    </>
                  ) : (
                    'Start Upload'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="xl:col-span-2">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[600px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon size={18} className="text-indigo-600" />
                Live Grid
              </h3>

              {/* Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-xl self-start sm:self-auto overflow-x-auto">
                {['All', ...categories].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
                <Loader2 size={32} className="text-slate-200 animate-spin mb-3" />
                <p className="text-slate-700 font-bold text-xs">Synchronizing with server...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                {filteredImages.map((image) => (
                  <div key={image.id} className="group relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 aspect-square flex flex-col">
                    <div className="relative flex-1 overflow-hidden">
                      <img
                        src={image.image_url?.startsWith('http') ? image.image_url : `${UPLOAD_BASE}${image.image_url}`}
                        alt={image.event_name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      {/* Badge */}
                      {image.category && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] uppercase tracking-widest font-black text-white">
                          {image.category}
                        </div>
                      )}

                      {/* Overlay actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="absolute top-3 right-3 flex gap-2">
                          <button
                            onClick={() => setEditItem(image)}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-lg"
                            title="Edit Details"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all shadow-lg"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-white font-bold text-xs truncate mb-1">{image.event_name}</p>
                          {image.description && (
                            <p className="text-slate-300 text-[10px] leading-snug line-clamp-2">
                              {image.description}
                            </p>
                          )}
                          <p className="text-slate-400 text-[9px] uppercase tracking-widest font-black mt-1">
                            {image.category || 'Church Event'} &bull; {image.upload_date ? new Date(image.upload_date).toLocaleDateString() : 'Recent'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty States Placeholder */}
                {images.length === 0 && (
                  <div className="col-span-full border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-200 py-10">
                     <ImageIcon size={40} className="mb-3 opacity-20" />
                     <p className="text-slate-700 font-bold text-xs">No images in your gallery yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
