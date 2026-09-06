import { useEffect, useMemo, useState, useCallback } from "react";
import { useCachedData } from "../../../hooks/useCachedData";
import { apiClient } from "../../../api/axiosInstance";
import { getSafeImageUrl } from "../../../api/config";
import { uploadFile } from "../../../api/axiosInstance";
import { ShoppingBag, Plus, Pencil, Trash2, X, Loader2, MessageCircle, Save } from "lucide-react";
import PanelHeader from "../components/PanelHeader";
import EmptyState from "../components/EmptyState";
import Skeleton from "../../../components/Skeleton";
import { toast } from 'react-hot-toast';

type Product = {
  id?: string | number;
  name: string;
  description?: string;
  category?: string;
  price?: number | string;
  stock?: number;
  image_url?: string;
  is_hireable?: boolean;
  created_at?: string;
};

type ProductForm = Omit<Product, 'id' | 'created_at'> & {
  imageFile?: File | null;
  imagePreview?: string;
};

interface Props { categoryFilter?: string[]; readOnly?: boolean }

const allCats = ['sacramentals', 'tshirts', 'chairs', 'instruments'];

const ProductsPanel = ({ categoryFilter, readOnly }: Props) => {
  const activeCategories = categoryFilter || allCats;
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: products = [], loading, refetch: loadProducts, setData: setProducts } = useCachedData<Product[]>(
    'csa_cache_products_manager',
    async () => {
      try {
        const response = await apiClient.get('/products');
        const data = response.data;
        return Array.isArray(data) ? data : [];
      } catch {
        toast.error('Failed to load products');
        return [];
      }
    },
    []
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | number | null>(null);
  const defaultForm = (): ProductForm => ({
    name: '',
    description: '',
    category: activeCategories[0],
    price: 0,
    stock: 50,
    image_url: '',
    is_hireable: false,
    imageFile: null,
    imagePreview: '',
  });
  const [form, setForm] = useState<ProductForm>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // WhatsApp contact number for cash-on-pickup
  const isPurchase = activeCategories.includes('sacramentals');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  useEffect(() => {
    if (!isPurchase) return;
    apiClient.get('/settings').then(res => {
      setWhatsappPhone(res.data?.cash_phone || '');
    }).catch(() => {});
  }, [isPurchase]);

  const saveWhatsappPhone = useCallback(async () => {
    setSavingWhatsapp(true);
    try {
      await apiClient.put('/settings', { cash_phone: whatsappPhone });
      localStorage.setItem('csa_cash_phone', whatsappPhone);
    } catch { console.warn('Failed to save WhatsApp number'); } finally {
      setSavingWhatsapp(false);
    }
  }, [whatsappPhone]);

  const filteredProducts = useMemo(() => {
    const pool = activeCategories.length === 4
      ? products
      : products.filter((p) => p.category && activeCategories.includes(p.category));
    if (selectedCategory === 'all') return pool;
    return pool.filter(
      (p) => p.category?.toLowerCase() === selectedCategory
    );
  }, [products, selectedCategory, activeCategories]);

  const openProductForm = (product?: Product) => {
    if (product) {
      setIsEditing(true);
      setCurrentProductId(product.id ?? null);
      setForm({
        name: product.name ?? '',
        description: product.description ?? '',
        category: product.category ?? 'sacramentals',
        price: product.price ?? 0,
        stock: product.stock ?? 50,
        image_url: product.image_url ?? '',
        is_hireable: product.is_hireable ?? false,
        imageFile: null,
        imagePreview: product.image_url ?? '',
      });
    } else {
      setIsEditing(false);
      setCurrentProductId(null);
      setForm(defaultForm());
    }
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setErrorMessage('');
    setForm(defaultForm());
    setCurrentProductId(null);
    setIsEditing(false);
  };

  const handleFormChange = (field: keyof ProductForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      setForm((prev) => ({ ...prev, imageFile: null, imagePreview: '' }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageFile: file, imagePreview: previewUrl }));
    if (!file.type.startsWith('image/')) return;
    setUploadingImage(true);
    try {
      const response = await uploadFile(file);
      const result = response.data?.data || response.data;
      const url = result?.secure_url || result?.url || result?.path || result?.image_url || '';
      if (url) {
        setForm((prev) => ({ ...prev, image_url: url, imageFile: null }));
      }
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!form.name.trim()) {
      setErrorMessage('Product name is required.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      let imageUrl = form.image_url || '';

      if (form.imageFile) {
        try {
          const uploadResponse = await uploadFile(form.imageFile);
          const uploadedResult = uploadResponse.data?.data || uploadResponse.data;
          imageUrl = uploadedResult?.secure_url || uploadedResult?.url || uploadedResult?.path || uploadedResult?.image_url || imageUrl;
        } catch (uploadErr) {
          console.warn('Image upload failed, saving product without image:', uploadErr);
        }
      }

      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || '',
        category: form.category?.toLowerCase() || 'sacramentals',
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        image_url: imageUrl,
        is_hireable: form.is_hireable ?? false,
      };

      if (isEditing && currentProductId !== null) {
        const response = await apiClient.patch(`/products/${currentProductId}`, payload);
        const updated = response.data;
        setProducts((prev) => prev.map((item) => (item.id === currentProductId ? updated : item)));
      } else {
        const response = await apiClient.post('/products', payload);
        const created = response.data;
        setProducts((prev) => [created, ...prev]);
      }

      localStorage.removeItem('csa_cache_products');
      closeModal();
    } catch (err) {
      console.error('Failed to save product', err);
      setErrorMessage((err as any)?.response?.data?.error || (err as any)?.message || 'Unable to save product at this time.');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string | number) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await apiClient.delete(`/products/${id}`);
      localStorage.removeItem('csa_cache_products');
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete product', err);
      setErrorMessage('Could not delete the product.');
    }
  };

  const categoryColors: Record<string, string> = {
    sacramentals: 'bg-blue-100 text-blue-700',
    tshirts: 'bg-amber-100 text-amber-700',
    chairs: 'bg-sky-100 text-sky-700',
    instruments: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className="space-y-4">
      <PanelHeader
        title={`${activeCategories.length === 4 ? 'Products' : `${activeCategories[0].charAt(0).toUpperCase() + activeCategories[0].slice(1)} Products`}`}
        subtitle={activeCategories.length === 4 ? 'Create, edit, and manage products.' : `Manage ${activeCategories.join(' & ')} products.`}
        icon={ShoppingBag}
        onRefresh={loadProducts}
        loading={loading}
        actions={
          !readOnly && (
            <button onClick={() => openProductForm()} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-200">
              <Plus size={13} /> Add
            </button>
          )
        }
      />

      {isPurchase && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <MessageCircle size={13} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-800">WhatsApp Contact for Cash Orders</p>
              <p className="text-[10px] text-emerald-600">Shown in cart for customers to message sales.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <input type="tel" value={whatsappPhone} onChange={e => setWhatsappPhone(e.target.value)} placeholder="254712345678" className="w-36 px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-[11px] font-semibold text-emerald-900 placeholder:text-emerald-300 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" />
            <button onClick={saveWhatsappPhone} disabled={savingWhatsapp} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-[11px] font-bold transition-all">
              {savingWhatsapp ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
              Save
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {['all', ...activeCategories].map((category) => (
          <button key={category} type="button" onClick={() => setSelectedCategory(category)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedCategory === category ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}>
            {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No products found" subtitle={selectedCategory !== 'all' ? `No products in "${selectedCategory}".` : 'Add your first product.'} action={
          !readOnly ? (
            <button onClick={() => openProductForm()} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-200">
              <Plus size={13} /> Add Product
            </button>
          ) : undefined
        } />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden relative">
                {product.image_url ? (
                  <img src={getSafeImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={22} className="text-slate-700" />
                  </div>
                )}
                <div className="absolute top-1.5 right-1.5">
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${categoryColors[product.category as string] || 'bg-slate-100 text-slate-800'}`}>
                    {product.category || 'General'}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">{product.name}</h3>
                <p className="text-[10px] text-slate-700 line-clamp-2 leading-relaxed">{product.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-800">KES {Number(product.price || 0).toLocaleString()}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${(product.stock ?? 0) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                    {(product.stock ?? 0) > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
                {!readOnly && (
                  <div className="flex gap-1.5 pt-1.5 border-t border-slate-100">
                    <button onClick={() => openProductForm(product)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
                      <Pencil size={10} /> Edit
                    </button>
                    <button onClick={() => deleteProduct(product.id as string | number)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all">
                      <Trash2 size={10} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  {isEditing ? <Pencil size={14} /> : <ShoppingBag size={14} />}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">{isEditing ? 'Edit Product' : 'New Product'}</h2>
                  <p className="text-[10px] text-slate-700">Fill in the details</p>
                </div>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:text-slate-800 hover:bg-slate-100 transition-all">
                <X size={14} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Name</label>
                  <input value={form.name} onChange={(e) => handleFormChange('name', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" placeholder="Product name" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Category</label>
                  <select value={form.category} onChange={(e) => handleFormChange('category', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                    {activeCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Price (KES)</label>
                  <input type="number" value={form.price} onChange={(e) => handleFormChange('price', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => handleFormChange('stock', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" placeholder="50" />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Description</label>
                  <textarea value={form.description} onChange={(e) => handleFormChange('description', e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-none" placeholder="Short description" />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1.5 px-3 bg-blue-50 rounded-lg">
                <input type="checkbox" checked={form.is_hireable ?? false} onChange={(e) => handleFormChange('is_hireable', e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs font-medium text-blue-700">Hireable (rental item)</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Image</label>
                <div className="flex flex-col gap-2">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)} className="block w-full text-xs text-slate-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" disabled={uploadingImage} />
                  {uploadingImage && <p className="text-[10px] text-blue-600 font-medium flex items-center gap-1.5"><Loader2 size={10} className="animate-spin" /> Uploading...</p>}
                  {(form.imagePreview || form.image_url) ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200">
                      <img src={form.imagePreview?.startsWith('blob:') ? form.imagePreview : getSafeImageUrl(form.imagePreview || form.image_url)} alt="Preview" className="h-28 w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-24 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-700">
                      No image
                    </div>
                  )}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="mx-4 mb-3 px-3 py-2 bg-rose-50 rounded-lg text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <X size={12} className="shrink-0" /> {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
              <button type="button" onClick={closeModal} className="px-3.5 py-1.5 border border-slate-200 text-slate-800 font-bold rounded-lg hover:bg-slate-100 transition-all text-xs">Cancel</button>
              <button type="button" onClick={handleSaveProduct} disabled={saving || uploadingImage} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg transition-all text-xs flex items-center gap-1.5 shadow-sm shadow-blue-200">
                {saving ? <><Loader2 size={11} className="animate-spin" /> {isEditing ? 'Saving...' : 'Creating...'}</> : isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPanel;
