import React from 'react';
import { useApp } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shirt } from 'lucide-react';
import { HeroSlider, useSliderImages } from '../components/HeroSlider';

import { FaStar, FaCheckCircle, FaChevronLeft, FaChevronRight, FaTrash } from 'react-icons/fa';
import TestimonialsSection from '../components/TestimonialsSection';
import ProjectHero from '../components/ProjectHero';
import ProjectPageHeader from '../components/ProjectPageHeader';

const TSHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

interface SliderImg { url: string; message?: string; title?: string; id?: number | string }

const HeroSliderComponent: React.FC<{
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
                <div key={i} className={`absolute inset-0 transition-all duration-700 ease-in-out ${i === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <img src={img.url} alt={img.title || img.message || 'slide'} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/25 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 md:p-12">
                        {img.title && <p className="text-white/70 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-1">{img.title}</p>}
                        {img.message && <h2 className="text-white text-lg sm:text-2xl md:text-4xl font-black leading-tight drop-shadow-lg max-w-2xl">{img.message}</h2>}
                        <div className="mt-4 h-1 w-10 sm:w-16 bg-blue-400 rounded-full" />
                        <a href="#tshirts" className="mt-4 inline-block px-6 py-2.5 bg-white text-blue-700 font-bold text-sm rounded-xl shadow-lg hover:bg-blue-50 transition-colors">Shop Now</a>
                    </div>
                    {isAdmin && img.id && onDelete && (
                        <button onClick={() => onDelete(img.id!)} className="absolute top-3 right-3 z-20 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-lg transition">
                            <FaTrash size={10} /> Delete
                        </button>
                    )}
                </div>
            ))}
            {len > 1 && (
                <>
                    <button onClick={prev} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white rounded-full p-2 sm:p-3 shadow-lg transition-all hover:scale-110"><FaChevronLeft size={14} /></button>
                    <button onClick={next} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white rounded-full p-2 sm:p-3 shadow-lg transition-all hover:scale-110"><FaChevronRight size={14} /></button>
                    <div className="absolute bottom-3 sm:bottom-5 right-4 sm:right-8 z-20 flex gap-1.5">
                        {images.map((_, i) => (
                            <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};







export const Tshirts = () => {
    const { products, addToCart, setIsCartOpen } = useApp();
    const [selectedSize, setSelectedSize] = React.useState<string>('');
    const [adding, setAdding] = React.useState(false);
    const { sliderImgs, sliderLoading, isAdmin: sliderIsAdmin, deleteSlide } = useSliderImages('tshirts');

    const product = React.useMemo(() => {
        const dbProduct = products.find(p => p.category?.toLowerCase() === 'tshirts');
        if (dbProduct) return { ...dbProduct, sizes: dbProduct.sizes || TSHIRT_SIZES };
        return null;
    }, [products]);

    if (!product) {
        return (
            <div className="w-full bg-slate-50 min-h-screen pb-20 text-slate-800 font-sans flex items-center justify-center">
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shirt size={32} className="text-blue-300" />
                    </div>
                    <p className="text-slate-700 font-black text-lg mb-1">No T-Shirts Available</p>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto">T-shirts coming soon. Check back later.</p>
                </div>
            </div>
        );
    }

    const image = product.image_url || product.img;
    const stock = product.stock != null ? Number(product.stock) : 50;
    const inStock = stock > 0;

    const handleAddToCart = () => {
        if (!inStock) return;
        if (TSHIRT_SIZES.length > 0 && !selectedSize) {
            alert('Please select a size first!');
            return;
        }
        setAdding(true);
        addToCart({ item: { ...product, img: product.image_url }, price: Number(product.price) || 0, category: 'tshirts', size: selectedSize });
        setTimeout(() => setAdding(false), 1300);
    };

    return (
        <div className="w-full bg-slate-50 min-h-screen pb-20 text-slate-800 font-sans">

            {/* ══════════ HERO ── Dark Premium Grid Design ══════════ */}
            <ProjectHero>
                <div className="px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
                    {sliderLoading ? (
                        <div className="w-full h-[240px] sm:h-[320px] md:h-[420px] lg:h-[520px] rounded-2xl md:rounded-3xl bg-slate-800 animate-pulse" />
                    ) : (
                        <HeroSliderComponent images={sliderImgs} isAdmin={sliderIsAdmin} onDelete={deleteSlide} />
                    )}
                </div>

                <ProjectPageHeader
                    badge="KYU CSA Apparel"
                    title={<>Official{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">CSA T-Shirt</span></>}
                    subtitle="The official KYU Catholic Student Association polo shirt — pure grey with a smart black collar. Wear your faith and community pride."
                >
                </ProjectPageHeader>
            </ProjectHero>

            {/* ══════════ SHOWCASE CARD ══════════ */}
            <motion.section
                id="tshirts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 relative z-20 pb-10 sm:pb-16"
            >
                <div className="bg-white rounded-3xl shadow-xl border border-blue-50 overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-0">

                        {/* Left: Product Image */}
                        <div className="relative bg-gradient-to-br from-blue-50 to-slate-100 aspect-square md:aspect-auto md:min-h-[480px] flex items-center justify-center overflow-hidden">
                            {image ? (
                                <img src={image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-48 h-48 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10h12V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
                                    </svg>
                                </div>
                            )}
                            <span className="absolute top-4 left-4 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">KYU CSA Official</span>
                            {!inStock && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="text-rose-600 font-black text-sm bg-white px-4 py-2 rounded-full shadow-lg border border-rose-100">Out of Stock</span>
                                </div>
                            )}
                        </div>

                        {/* Right: Product Details */}
                        <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                            <div className="space-y-5">
                                <div>
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-widest">CSA Merchandise</span>
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mt-3">{product.name}</h2>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map(s => <FaStar key={s} size={14} className="text-amber-400" />)}
                                    </div>
                                    <span className="text-sm text-slate-400 font-medium">(128 reviews)</span>
                                </div>

                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Official CSA polo shirt — pure grey with a smart black collar. Premium fabric, comfortable fit. Perfect for campus events, church gatherings, and everyday wear. Show your KYU Catholic Student Association pride.
                                </p>

                                {/* Features */}
                                <div className="grid grid-cols-2 gap-2">
                                    {['Premium Cotton', 'Black Collar', 'All Sizes S-XXL', 'Pickup at KYU'].map((feat, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <FaCheckCircle size={10} className="text-blue-500 shrink-0" />
                                            {feat}
                                        </div>
                                    ))}
                                </div>

                                {/* Price */}
                                <div className="bg-blue-50 rounded-2xl p-4">
                                    <p className="text-xs text-slate-500 font-semibold mb-1">Price per shirt</p>
                                    <p className="text-3xl font-black text-slate-900">
                                        KES {Number(product.price).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1">Pickup at KYU campus — no delivery</p>
                                </div>

                                {/* Size Selector */}
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-2 block">Select Size *</label>
                                    <div className="flex flex-wrap gap-2">
                                        {TSHIRT_SIZES.map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`min-w-[48px] h-11 px-3 text-sm font-bold rounded-xl border-2 transition-all duration-200 ${
                                                    selectedSize === size
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedSize && (
                                        <p className="text-xs text-blue-600 font-semibold mt-2">Size {selectedSize} selected</p>
                                    )}
                                </div>

                                {/* Add to Cart */}
                                <button
                                    onClick={handleAddToCart}
                                    disabled={adding || !inStock}
                                    className={`w-full py-4 rounded-2xl font-black text-base transition-all duration-300 ${
                                        adding
                                            ? 'bg-emerald-500 text-white scale-95'
                                            : inStock
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-xl active:scale-95'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    {adding ? (
                                        <span className="flex items-center justify-center gap-2"><FaCheckCircle size={16} /> Added to Cart!</span>
                                    ) : (
                                        'Add to Cart'
                                    )}
                                </button>

                                {/* View Cart */}
                                <button onClick={() => setIsCartOpen(true)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors text-sm">
                                    View Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Testimonials */}
            <TestimonialsSection variant="blue" />

        </div>
    );
};
