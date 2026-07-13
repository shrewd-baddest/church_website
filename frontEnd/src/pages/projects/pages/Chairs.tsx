import React from 'react';
import { useApp } from '../../../context/AppContext';
import { motion } from 'framer-motion';
import { HireModal } from '../components/HireModal';
import { HeroSlider, useSliderImages } from '../components/HeroSlider';

import { FaStar, FaChevronLeft, FaChevronRight, FaTrash, FaCheckCircle, FaChair } from 'react-icons/fa';
import TestimonialsSection from '../components/TestimonialsSection';
import ProjectHero from '../components/ProjectHero';
import ProjectPageHeader from '../components/ProjectPageHeader';

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
                        <div className="mt-4 h-1 w-10 sm:w-16 bg-amber-400 rounded-full" />
                        <a href="#chairs" className="mt-4 inline-block px-6 py-2.5 bg-white text-amber-700 font-bold text-sm rounded-xl shadow-lg hover:bg-amber-50 transition-colors">View Available</a>
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







const CHAIR_PRICE = 10;

export const Chairs = () => {
    const { products, isLoading, addToHire, isHireModalOpen, setHireModalOpen } = useApp();
    const [chairQty, setChairQty] = React.useState(1);
    const { sliderImgs, sliderLoading, isAdmin, deleteSlide } = useSliderImages('chairs');

    const product = React.useMemo(() => {
        return products.find(p => p.category?.toLowerCase() === 'chairs');
    }, [products]);

    const image = product?.image_url || product?.img;
    const stock = product?.stock != null ? Number(product.stock) : 0;
    const price = Number(product?.price) || CHAIR_PRICE;
    const name = product?.name || 'Event Chairs';

    const handleHire = () => {
        if (chairQty < 1) return;
        addToHire({ id: product?.id || 0, name, category: 'chairs', price, quantity: chairQty });
        setHireModalOpen(true);
    };

    return (
        <div className="w-full bg-slate-50 min-h-screen pb-20 text-slate-800 font-sans">

            {isHireModalOpen && <HireModal onClose={() => setHireModalOpen(false)} showEventDate={false} />}

            {/* ══════════ HERO ── Dark Premium Grid Design ══════════ */}
            <ProjectHero>
                <div className="px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
                    {sliderLoading ? (
                        <div className="w-full h-[240px] sm:h-[320px] md:h-[420px] lg:h-[520px] rounded-2xl md:rounded-3xl bg-slate-800 animate-pulse" />
                    ) : (
                        <HeroSliderComponent images={sliderImgs} isAdmin={isAdmin} onDelete={deleteSlide} />
                    )}
                </div>

                <ProjectPageHeader
                    badge="Event Rentals"
                    title={<>Premium{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Event Chairs</span></>}
                    subtitle="Durable, clean plastic chairs for weddings, celebrations, and community gatherings — pickup at KYU campus."
                >
                </ProjectPageHeader>
            </ProjectHero>

            {/* ══════════ SHOWCASE SECTION ══════════ */}
            <motion.section
                id="chairs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 relative z-20 pb-10 sm:pb-16"
            >
                {/* Main showcase card */}
                <div className="bg-white rounded-3xl shadow-xl border border-amber-50 overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-0">

                        {/* Left: Product Image */}
                        <div className="relative bg-gradient-to-br from-amber-50 to-slate-100 aspect-square md:aspect-auto md:min-h-[480px] flex items-center justify-center overflow-hidden">
                            {image ? (
                                <img src={image} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-48 h-48 bg-amber-100 rounded-full flex items-center justify-center">
                                    <FaChair size={64} className="text-amber-300" />
                                </div>
                            )}
                            {stock > 0 && (
                                <span className="absolute top-4 left-4 px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                                    {stock} Available
                                </span>
                            )}
                        </div>

                        {/* Right: Details */}
                        <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                            <div className="space-y-5">
                                <div>
                                    <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-widest">Hire Service</span>
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mt-3">{name}</h2>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map(s => <FaStar key={s} size={14} className="text-amber-400" />)}
                                    </div>
                                    <span className="text-sm text-slate-400 font-medium">(64 reviews)</span>
                                </div>

                                <p className="text-slate-500 text-sm leading-relaxed">
                                    High-quality, durable plastic chairs perfect for any event. Clean, sturdy, and available in bulk. Whether it's a wedding, church gathering, or community celebration — we have you covered.
                                </p>

                                {/* Features */}
                                <div className="grid grid-cols-2 gap-2">
                                    {['Spotlessly Cleaned', 'Stackable Design', 'Weather Resistant', 'Bulk Available'].map((feat, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <FaCheckCircle size={10} className="text-amber-500 shrink-0" />
                                            {feat}
                                        </div>
                                    ))}
                                </div>

                                {/* Pricing Box */}
                                <div className="bg-amber-50 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500 font-semibold">Rental rate</p>
                                            <p className="text-3xl font-black text-slate-900">
                                                KES {Number(price).toLocaleString()}
                                                <span className="text-sm font-bold text-slate-400"> /chair/day</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold">
                                        <span>{stock > 0 ? `${stock} chairs in stock` : 'Checking availability...'}</span>
                                        <span>Pickup only</span>
                                    </div>
                                </div>

                                {/* Quantity + Hire Button */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Number of chairs needed
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200 transition-all">
                                                <button
                                                    type="button"
                                                    onClick={() => setChairQty(q => Math.max(1, q - 10))}
                                                    className="w-11 h-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-lg transition-colors"
                                                >-</button>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={chairQty}
                                                    onChange={e => setChairQty(Math.max(1, parseInt(e.target.value) || 1))}
                                                    placeholder="e.g. 50"
                                                    className="flex-1 h-12 text-center text-base font-bold text-slate-800 border-x border-slate-200 outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setChairQty(q => Math.min(999, q + 10))}
                                                    className="w-11 h-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-lg transition-colors"
                                                >+</button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleHire}
                                            className="h-12 px-8 rounded-xl font-black text-base bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 hover:shadow-xl active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                                        >
                                            Hire
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 text-center">Pickup at KYU campus. No delivery.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Testimonials */}
            <TestimonialsSection variant="blue" />

            {/* Faith Footer */}
            <div className="text-center py-10 text-sm text-amber-700 italic px-4">
                "Let all things be done decently and in order." — 1 Corinthians 14:40
            </div>

        </div>
    );
};
