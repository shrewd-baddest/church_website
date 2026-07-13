import React from 'react';
import { useApp } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SACRAMENTAL_CATEGORIES } from '../pages/data';
import type { SacramentalCategory } from '../pages/data';
import {
    FaSearch, FaStar, FaShoppingCart, FaFilter,
    FaChevronLeft, FaChevronRight, FaTrash, FaCheckCircle
} from 'react-icons/fa';
import apiService from '../../Landing/services/api';
import TestimonialsSection from '../components/TestimonialsSection';
import ProjectHero from '../components/ProjectHero';
import ProjectPageHeader from '../components/ProjectPageHeader';

/* ───────────────────────────────────────────────
   SACRAMENTAL SUBCATEGORIES that exist in the DB
   These are the `category` column values stored
   for products that belong to the sacramentals
   section. The admin can also set category =
   "sacramentals" so we accept both.
─────────────────────────────────────────────── */
const SACRAMENTAL_SUBCATS = new Set([
    'rosaries', 'bibles', 'chains', 'crucifixes', 'statues', 'candles', 'sacramentals'
]);

/* ───────────────────────────────────────────────
   HERO SLIDER
─────────────────────────────────────────────── */
interface SliderImg { url: string; message?: string; title?: string; id?: number | string }

const HeroSlider: React.FC<{
    images: SliderImg[];
    isAdmin?: boolean;
    onDelete?: (id: number | string) => void;
}> = ({ images, isAdmin, onDelete }) => {
    const [idx, setIdx] = React.useState(0);
    const len = images.length;

    const next = React.useCallback(() => setIdx(p => (p + 1) % len), [len]);
    const prev = React.useCallback(() => setIdx(p => (p - 1 + len) % len), [len]);

    React.useEffect(() => {
        if (len <= 1) return;
        const t = setInterval(next, 5500);
        return () => clearInterval(t);
    }, [len, next]);

    if (!len) return null;

    return (
        <div className="relative w-full h-[240px] sm:h-[320px] md:h-[420px] lg:h-[520px] overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl">
            {images.map((img, i) => (
                <div
                    key={i}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${i === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                    <img
                        src={img.url}
                        alt={img.title || img.message || 'slide'}
                        className="w-full h-full object-cover"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/25 to-transparent" />

                    {/* Text */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 md:p-12">
                        {img.title && (
                            <p className="text-white/70 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-1">
                                {img.title}
                            </p>
                        )}
                        {img.message && (
                            <h2 className="text-white text-lg sm:text-2xl md:text-4xl font-black leading-tight drop-shadow-lg max-w-2xl">
                                {img.message}
                            </h2>
                        )}
                        <div className="mt-4 h-1 w-10 sm:w-16 bg-blue-400 rounded-full" />
                        <a
                            href="#sacramentals"
                            className="mt-4 inline-block px-6 py-2.5 bg-white text-blue-700 font-bold text-sm rounded-xl shadow-lg hover:bg-blue-50 transition-colors"
                        >
                            Shop Now
                        </a>
                    </div>

                    {/* Admin delete */}
                    {isAdmin && img.id && onDelete && (
                        <button
                            onClick={() => onDelete(img.id!)}
                            className="absolute top-3 right-3 z-20 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
                        >
                            <FaTrash size={10} /> Delete Image
                        </button>
                    )}
                </div>
            ))}

            {/* Nav Arrows */}
            {len > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white rounded-full p-2 sm:p-3 shadow-lg transition-all hover:scale-110"
                    >
                        <FaChevronLeft size={14} />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white rounded-full p-2 sm:p-3 shadow-lg transition-all hover:scale-110"
                    >
                        <FaChevronRight size={14} />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-3 sm:bottom-5 right-4 sm:right-8 z-20 flex gap-1.5">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIdx(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

/* ───────────────────────────────────────────────
   TRUST STRIP
─────────────────────────────────────────────── */
const TrustStrip: React.FC = () => null;

/* ───────────────────────────────────────────────
   CATEGORY FILTER BAR
─────────────────────────────────────────────── */
const CategoryFilterBar: React.FC<{
    selected: SacramentalCategory;
    onChange: (c: SacramentalCategory) => void;
    counts: Record<string, number>;
}> = ({ selected, onChange, counts }) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return (
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {SACRAMENTAL_CATEGORIES.map(cat => {
                const count = cat.id === 'all' ? total : (counts[cat.id] || 0);
                const active = selected === cat.id;
                return (
                    <button
                        key={cat.id}
                        id={`filter-cat-${cat.id}`}
                        onClick={() => onChange(cat.id)}
                        className={`
                            flex items-center gap-1.5 whitespace-nowrap px-4 sm:px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex-shrink-0 min-h-[44px]
                            ${active
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-105'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                            }
                        `}
                    >
                        {cat.icon && <span>{cat.icon}</span>}
                        <span className="hidden sm:inline">{cat.label}</span>
                        <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

/* ───────────────────────────────────────────────
   PREMIUM PRODUCT CARD
─────────────────────────────────────────────── */
interface Product {
    id?: any;
    name: string;
    price: number | string;
    description?: string;
    desc?: string;
    image_url?: string;
    img?: string;
    category?: string;
    subcategory?: string;
    stock?: number;
}

const ProductCard: React.FC<{ product: Product; onAdd: () => void }> = ({ product, onAdd }) => {
    const navigate = useNavigate();
    const [adding, setAdding] = React.useState(false);
    const image = product.image_url || product.img;
    const desc = product.description || product.desc || '';
    const inStock = product.stock == null || Number(product.stock) > 0;

    const handleAdd = () => {
        if (!inStock) return;
        setAdding(true);
        onAdd();
        setTimeout(() => setAdding(false), 1300);
    };

    return (
        <div
            className="group bg-white rounded-xl border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden flex flex-col cursor-pointer"
            onClick={() => { if (product.id) navigate(`/product/${product.id}`); }}
        >
            {/* Image */}
            <div className="relative aspect-square bg-gradient-to-br from-blue-50 to-slate-50 overflow-hidden">
                {image ? (
                    <img
                        src={image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                )}
                {/* Subcategory badge */}
                {product.subcategory && product.subcategory !== 'sacramentals' && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm text-blue-700 text-[8px] font-black uppercase tracking-wider rounded-md shadow-sm">
                        {product.subcategory}
                    </span>
                )}
                {/* Out of stock overlay */}
                {!inStock && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-rose-600 font-black text-[10px] bg-white px-2 py-0.5 rounded-full shadow-md border border-rose-100">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-2.5 sm:p-3 gap-1">
                <h3 className="font-bold text-slate-800 text-[11px] sm:text-xs leading-tight line-clamp-2 min-h-[28px]">
                    {product.name}
                </h3>

                {/* Stars + rating count */}
                <div className="flex items-center gap-1">
                    <div className="flex gap-px">
                        {[1,2,3,4,5].map(s => <FaStar key={s} size={8} className="text-amber-400" />)}
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">(128)</span>
                </div>

                {/* Price */}
                <div className="mt-auto pt-1">
                    <span className="text-sm sm:text-base font-black text-slate-900">
                        KSh {Number(product.price).toLocaleString()}
                    </span>
                </div>

                {/* Add to Cart */}
                <button
                    id={`add-cart-${product.id || product.name}`}
                    onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                    disabled={adding || !inStock}
                    className={`
                        w-full mt-1 py-2 flex items-center justify-center gap-1.5 min-h-[36px]
                        text-[10px] sm:text-xs font-bold rounded-lg transition-all duration-300 select-none
                        ${adding
                            ? 'bg-emerald-500 text-white scale-95'
                            : inStock
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:scale-95'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }
                    `}
                >
                    {adding ? (
                        <><FaCheckCircle size={10} /> Added!</>
                    ) : (
                        <>Add to Cart</>
                    )}
                </button>
            </div>
        </div>
    );
};

/* ───────────────────────────────────────────────
   PROCESS GUIDE
─────────────────────────────────────────────── */

const ProcessGuide: React.FC = () => null;


/* ───────────────────────────────────────────────
   SKELETON LOADER
─────────────────────────────────────────────── */
const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
        <div className="aspect-square bg-slate-200" />
        <div className="p-2.5 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-3/4" />
            <div className="h-2 bg-slate-100 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded w-1/3 mt-1" />
            <div className="h-7 bg-slate-200 rounded-lg mt-1" />
        </div>
    </div>
);

/* ───────────────────────────────────────────────
   MAIN SACRAMENTALS PAGE
─────────────────────────────────────────────── */
export const Sacramentals = () => {
    const { products: dbProducts, addToCart, sacCategory, setSacCategory, setIsCartOpen, isAdmin, isLoading } = useApp();
    const navigate = useNavigate();
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    const [sortBy, setSortBy] = React.useState<'none' | 'price-asc' | 'price-desc' | 'name'>('none');
    const productsRef = React.useRef<HTMLDivElement>(null);
    const [sliderImgs, setSliderImgs] = React.useState<SliderImg[]>([]);
    const [sliderLoading, setSliderLoading] = React.useState(true);

    // Debounce search (300ms)
    React.useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    // Auto-scroll to products when filtering
    React.useEffect(() => {
        if ((debouncedSearch || sacCategory !== 'all' || sortBy !== 'none') && productsRef.current) {
            productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [debouncedSearch, sacCategory, sortBy]);

    /* ── Load admin-uploaded slider images from API ── */
    React.useEffect(() => {
        let mounted = true;
        setSliderLoading(true);
        apiService.getSacramentalsSliderImages('sacramentals')
            .then(data => {
                if (!mounted) return;
                if (Array.isArray(data) && data.length > 0) {
                    setSliderImgs(data.map(d => ({
                        id: d.id,
                        url: d.url || d.image_url,
                        title: d.title,
                        message: d.message,
                    })));
                } else {
                    setSliderImgs([]);
                }
            })
            .catch(() => { if (mounted) setSliderImgs([]); })
            .finally(() => { if (mounted) setSliderLoading(false); });
        return () => { mounted = false; };
    }, []);

    /* ── Delete slider image (admin only) ── */
    const handleDeleteSliderImage = async (id: number | string) => {
        if (!window.confirm('Delete this slide image?')) return;
        await apiService.deleteSacramentalsSliderImage(id);
        setSliderImgs(prev => prev.filter(img => img.id !== id));
    };

    /* ── Filter DB products ── */
    const sourceProducts = React.useMemo(() => {
        return (dbProducts || [])
            .filter(p => {
                const cat = (p.category || '').toLowerCase();
                return cat === 'sacramentals' || SACRAMENTAL_SUBCATS.has(cat) || SACRAMENTAL_SUBCATS.has(p.subcategory?.toLowerCase());
            })
            .map(p => ({
                id: p.id || `db-${p.name}`,
                name: p.name,
                price: Number(p.price) || 0,
                description: p.description || p.desc || '',
                image_url: p.image_url || p.img || '',
                subcategory: (p.subcategory || p.category || 'sacramentals').toLowerCase(),
                category: (p.category || 'sacramentals').toLowerCase(),
                stock: p.stock ?? 50,
            }));
    }, [dbProducts]);

    /* ── Category counts ── */
    const categoryCounts = React.useMemo(() => {
        const c: Record<string, number> = {};
        SACRAMENTAL_CATEGORIES.forEach(cat => { if (cat.id !== 'all') c[cat.id] = 0; });
        sourceProducts.forEach(p => {
            const sub = (p.subcategory || p.category || '').toLowerCase();
            if (sub && sub in c) c[sub]++;
        });
        return c;
    }, [sourceProducts]);

    /* ── Final filtered + sorted list ── */
    const filtered = React.useMemo(() => {
        let result = sourceProducts.filter(p => {
            const sub = p.subcategory || p.category || '';
            const matchCat = sacCategory === 'all' || sub === sacCategory;
            const term = debouncedSearch.toLowerCase();
            const matchSearch = !term
                || (p.name || '').toLowerCase().includes(term)
                || (p.description || '').toLowerCase().includes(term);
            return matchCat && matchSearch;
        });

        // Sort
        if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
        else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
        else if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));

        return result;
    }, [sourceProducts, sacCategory, debouncedSearch, sortBy]);

    /* ── Add to cart ── */
    const handleAddToCart = (product: typeof sourceProducts[0]) => {
        addToCart({
            item: { ...product, img: product.image_url },
            price: Number(product.price) || 0,
            category: 'sacramentals',
        });
    };

    const hasFilters = sacCategory !== 'all' || debouncedSearch.trim() || sortBy !== 'none';
    const activeCategoryLabel = SACRAMENTAL_CATEGORIES.find(c => c.id === sacCategory)?.label || '';

    return (
        <div className="w-full bg-slate-50 min-h-screen pb-20 text-slate-800 font-sans">

            {/* ══════════ HERO ── Dark Premium Grid Design ══════════ */}
            <ProjectHero>
                <div className="px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
                    {sliderLoading ? (
                        <div className="w-full h-[240px] sm:h-[320px] md:h-[420px] lg:h-[520px] rounded-2xl md:rounded-3xl bg-slate-800 animate-pulse" />
                    ) : (
                        <HeroSlider
                            images={sliderImgs}
                            isAdmin={isAdmin}
                            onDelete={handleDeleteSliderImage}
                        />
                    )}
                </div>

                <ProjectPageHeader
                    badge="✦ Holy Items ✦"
                    title={<>Sacramentals &amp;{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Devotionals</span></>}
                    subtitle="Sacred items handpicked to aid your spiritual journey and daily devotion."
                >
                </ProjectPageHeader>
            </ProjectHero>

            {/* ══════════ SEARCH + FILTER PANEL ══════════ */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 relative z-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white/90 backdrop-blur-md rounded-2xl shadow-md border border-blue-50 p-3 sm:p-4 space-y-3"
                >
                    {/* Search + Sort row */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm" />
                            <input
                                id="sacramentals-search"
                                type="text"
                                placeholder="Search by name or description…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-9 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition font-semibold text-slate-700 placeholder:text-slate-400"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg text-lg leading-none transition-colors"
                                >×</button>
                            )}
                        </div>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as typeof sortBy)}
                            className="px-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition cursor-pointer"
                        >
                            <option value="none">Sort</option>
                            <option value="price-asc">Price: Low → High</option>
                            <option value="price-desc">Price: High → Low</option>
                            <option value="name">Name: A → Z</option>
                        </select>
                    </div>

                    {/* Category Filters */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <FaFilter className="text-blue-500 flex-shrink-0 text-xs sm:text-sm" />
                        <CategoryFilterBar
                            selected={sacCategory}
                            onChange={setSacCategory}
                            counts={categoryCounts}
                        />
                    </div>
                </motion.div>
            </div>

            {/* ══════════ PRODUCT SECTION ══════════ */}
            <motion.section
                ref={productsRef}
                id="sacramentals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-6 sm:pb-10"
            >
                {/* Results bar */}
                <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
                    <p className="text-xs sm:text-sm text-slate-500 font-semibold">
                        {isLoading
                            ? 'Loading items…'
                            : filtered.length > 0
                                ? `${filtered.length} item${filtered.length > 1 ? 's' : ''}${sacCategory !== 'all' ? ` in "${activeCategoryLabel}"` : ''}`
                                : 'No items found'
                        }
                    </p>
                    {hasFilters && !isLoading && (
                        <button
                            onClick={() => { setSacCategory('all'); setSearch(''); setDebouncedSearch(''); setSortBy('none'); }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="grid gap-2.5 sm:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid gap-2.5 sm:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {filtered.map(product => (
                            <ProductCard
                                key={product.id || product.name}
                                product={product}
                                onAdd={() => handleAddToCart(product)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
                        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-blue-50 rounded-full flex items-center justify-center text-3xl sm:text-4xl mb-4 shadow-inner">
                            🔍
                        </div>
                        <p className="text-slate-700 font-black text-base sm:text-lg mb-1">No items found</p>
                        <p className="text-slate-400 text-xs sm:text-sm max-w-xs">
                            {debouncedSearch
                                ? `No results for "${debouncedSearch}"`
                                : 'Try adjusting your search or selecting a different category.'
                            }
                        </p>
                        <button
                            onClick={() => { setSacCategory('all'); setSearch(''); setDebouncedSearch(''); setSortBy('none'); }}
                            className="mt-4 sm:mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition"
                        >
                            Show All Items
                        </button>
                    </div>
                )}
            </motion.section>

            {/* ── VIEW CART LINK ── */}
            <div className="flex justify-center pb-4 px-4">
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition underline underline-offset-2"
                >
                    <FaShoppingCart size={12} /> View your cart
                </button>
            </div>

            {/* ── TESTIMONIALS ── */}
            <TestimonialsSection variant="blue" />

        </div>
    );
};

// Re-export legacy components used by other pages
export const CategoryHero: React.FC<{
    category: 'sacramentals' | 'tshirts' | 'chairs' | 'instruments' | 'other';
    overrideBanner?: { img: string; title: string; subtitle: string };
}> = ({ category, overrideBanner }) => {
    const banner = overrideBanner;
    if (!banner?.img) return null;
    return (
        <div
            className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden bg-cover bg-center shadow-lg mb-6"
            style={{ backgroundImage: `url(${banner.img})` }}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
                <h2 className="text-xl sm:text-3xl font-black">{banner.title}</h2>
                <p className="text-sm text-white/80 mt-1">{banner.subtitle}</p>
            </div>
        </div>
    );
};

export const TrustBar: React.FC<{
    category: 'sacramentals' | 'tshirts' | 'chairs' | 'instruments' | 'other';
}> = () => null;



export interface SliderImage { url: string; message?: string; }
export const ImageSlider: React.FC<{ images: (string | SliderImage)[] }> = ({ images }) => {
    const imgs: SliderImg[] = images.map(i => typeof i === 'string' ? { url: i } : { url: i.url, message: i.message });
    return <HeroSlider images={imgs} />;
};