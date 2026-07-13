import { useEffect, useMemo, useState } from "react";
import { useCachedData } from "../../../hooks/useCachedData";
import { apiClient } from "../../../api/axiosInstance";
import { getSafeImageUrl } from "../../../api/config";
import { uploadFile } from "../../../api/axiosInstance";

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

interface Props { categoryFilter?: string[] }

const allCats = ['sacramentals', 'tshirts', 'chairs', 'instruments'];

const ProductsPanel = ({ categoryFilter }: Props) => {
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

  const filteredProducts = useMemo(() => {
    const pool = activeCategories.length === 4
      ? products
      : products.filter((p) => activeCategories.includes(p.category));
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
      // preview remains, upload will retry on save
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

      // Try uploading image, but don't block product creation if it fails
      if (form.imageFile) {
        try {
          const uploadResponse = await uploadFile(form.imageFile);
          const uploadedResult = uploadResponse.data?.data || uploadResponse.data;
          imageUrl = uploadedResult?.secure_url || uploadedResult?.url || uploadedResult?.path || uploadedResult?.image_url || imageUrl;
        } catch (uploadErr) {
          console.warn('Image upload failed, saving product without image:', uploadErr);
          // Continue without image — don't block product creation
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

  return (
    <div className="p-6 space-y-6">
      <div className="admin-card-section">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="admin-panel-title">
              {activeCategories.length === 4 ? 'Product Management' : `${activeCategories[0].charAt(0).toUpperCase() + activeCategories[0].slice(1)} Products`}
            </h1>
            <p className="admin-panel-subtitle mt-1">
              {activeCategories.length === 4
                ? 'Create, edit, and remove products across all categories.'
                : `Manage ${activeCategories.join(' & ')} products.`}
            </p>
          </div>
          <button onClick={() => openProductForm()} className="admin-btn-primary">
            Add New Product
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', ...activeCategories].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? 'admin-chip-active' : 'admin-chip'}
          >
            {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-card-section text-center text-slate-500">Loading products...</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400 text-sm font-medium">
              No products found for the selected category.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                {/* Image */}
                <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={getSafeImageUrl(product.image_url)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-medium">
                      No image
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-sm font-bold text-slate-800 leading-tight line-clamp-2 flex-1">{product.name}</h3>
                    <span className="shrink-0 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{product.category || 'General'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{product.description || '—'}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-slate-800">KES {Number(product.price || 0).toLocaleString()}</span>
                    <span className="text-slate-400">Stock: {product.stock ?? '—'}</span>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button onClick={() => openProductForm(product)} className="flex-1 py-1.5 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id as string | number)}
                      className="flex-1 py-1.5 text-[11px] font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.2)]">
            <div className="flex flex-col gap-4 pb-4 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit Product' : 'New Product'}</h2>
                <p className="text-sm text-slate-500">Save product details and optionally upload a preview image.</p>
              </div>
              <button onClick={closeModal} className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                Close
              </button>
            </div>

            <div className="grid gap-4 py-6 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                Product Name
                <input
                  value={form.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                  placeholder="e.g. Handcrafted Wood Rosary"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                Category
                <select
                  value={form.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                >
                  {activeCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                Price (KES)
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => handleFormChange('price', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                  placeholder="0"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                Stock Quantity
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => handleFormChange('stock', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                  placeholder="50"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700 sm:col-span-2">
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={4}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                  placeholder="Add a short product description"
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_hireable ?? false}
                  onChange={(e) => handleFormChange('is_hireable', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                This product is hireable (rental item)
              </label>

              <label className="space-y-2 text-sm text-slate-700 sm:col-span-2">
                Image Preview
                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-slate-600"
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <p className="text-xs text-blue-600 font-medium mt-1">Uploading image...</p>}
                  {(form.imagePreview || form.image_url) ? (
                    <img
                      src={form.imagePreview?.startsWith('blob:') ? form.imagePreview : getSafeImageUrl(form.imagePreview || form.image_url)}
                      alt="Product preview"
                      className="h-40 w-full rounded-3xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="flex min-h-[160px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                      No image selected yet.
                    </div>
                  )}
                </div>
              </label>
            </div>

            {errorMessage && (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3 justify-end">
              <button type="button" onClick={closeModal} className="admin-btn-outline">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={saving || uploadingImage}
                className="admin-btn-primary disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {saving ? (isEditing ? 'Saving changes...' : 'Saving product...') : (isEditing ? 'Update product' : 'Create product')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPanel;
