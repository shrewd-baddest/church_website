import React from 'react';
import { useApp } from '../../../context/AppContext';
import { motion } from 'framer-motion';
import { HireModal } from '../components/HireModal';
import { HeroSlider, useSliderImages } from '../components/HeroSlider';

import { FaStar, FaChevronLeft, FaChevronRight, FaTrash, FaCheckCircle } from 'react-icons/fa';
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
                        <div className="mt-4 h-1 w-10 sm:w-16 bg-emerald-400 rounded-full" />
                        <a href="#instruments" className="mt-4 inline-block px-6 py-2.5 bg-white text-emerald-700 font-bold text-sm rounded-xl shadow-lg hover:bg-emerald-50 transition-colors">View Available</a>
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







const InstrumentCard: React.FC<{
    instrument: any;
    onHire: (item: { id: number; name: string; category: string; price: number; quantity: number }) => void;
}> = ({ instrument, onHire }) => {
    const [qty, setQty] = React.useState(1);
    const image = instrument.image_url || instrument.img;
    const stock = instrument.stock != null ? Number(instrument.stock) : null;
    const inStock = stock == null || stock > 0;
    const price = Number(instrument.price) || 0;

    const handleHire = () => {
        if (!inStock || qty < 1) return;
        onHire({ id: instrument.id, name: instrument.name, category: 'instruments', price, quantity: qty });
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
            {/* Image */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-emerald-50 to-slate-100 overflow-hidden">
                {image ? (
                    <img src={image} alt={instrument.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
                            <FaStar size={32} className="text-emerald-300" />
                        </div>
                    </div>
                )}
                {stock != null && (
                    <span className={`absolute top-3 left-3 px-3 py-1.5 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-lg ${
                        stock > 5 ? 'bg-emerald-500' : stock > 0 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}>
                        {stock > 0 ? `${stock} Available` : 'Unavailable'}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6 flex flex-col flex-1">
                <h3 className="text-lg font-black text-slate-800 mb-2">{instrument.name}</h3>

                <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">
                    {instrument.description || instrument.desc || 'Professional-grade equipment for your worship events.'}
                </p>

                {/* Features */}
                {(instrument.features || instrument.feature_list) && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {(instrument.features || instrument.feature_list || []).slice(0, 4).map((feat: string, i: number) => (
                            <span key={i} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                {feat}
                            </span>
                        ))}
                    </div>
                )}

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                    <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => <FaStar key={s} size={12} className="text-amber-400" />)}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">(48)</span>
                </div>

                {/* Price */}
                <div className="bg-emerald-50 rounded-2xl p-4 mb-4">
                    <p className="text-xs text-slate-500 font-semibold">Daily rental rate</p>
                    <p className="text-2xl font-black text-slate-900">
                        KES {price.toLocaleString()}
                        <span className="text-xs font-bold text-slate-400"> /day</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Hourly rates also available</p>
                </div>

                {/* Quantity + Hire */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setQty(q => Math.max(1, q - 1))}
                            className="w-9 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors"
                        >-</button>
                        <input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-12 h-10 text-center text-sm font-bold border-x border-slate-200 focus:outline-none"
                        />
                        <button
                            onClick={() => setQty(q => Math.min(stock || 999, q + 1))}
                            className="w-9 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors"
                        >+</button>
                    </div>
                    <button
                        onClick={handleHire}
                        disabled={!inStock}
                        className={`flex-1 h-10 rounded-2xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                            inStock
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:shadow-xl active:scale-95'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        Hire
                    </button>
                </div>
            </div>
        </div>
    );
};

export const Instruments = () => {
    const { products, isLoading, addToHire, isHireModalOpen, setHireModalOpen } = useApp();
    const { sliderImgs, sliderLoading, isAdmin, deleteSlide } = useSliderImages('instruments');

    const instruments = React.useMemo(() => {
        return products.filter(p => p.category?.toLowerCase() === 'instruments');
    }, [products]);

    return (
        <div className="w-full bg-slate-50 min-h-screen pb-20 text-slate-800 font-sans">

            {isHireModalOpen && <HireModal onClose={() => setHireModalOpen(false)} />}

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
                    badge="Worship Equipment"
                    title={<>Musical{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Instruments</span></>}
                    subtitle="Professional-grade organs, pianos, speakers and microphones — elevate your worship experience. Daily and hourly rental available."
                >
                </ProjectPageHeader>
            </ProjectHero>

            {/* ══════════ INSTRUMENTS SHOWCASE ══════════ */}
            <motion.section
                id="instruments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 relative z-20 pb-10 sm:pb-16"
            >
                {instruments.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {instruments.map(inst => (
                            <InstrumentCard
                                key={inst.id || inst.name}
                                instrument={inst}
                                onHire={(item) => {
                                    addToHire(item);
                                    setHireModalOpen(true);
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-3xl shadow-xl border border-emerald-50">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaStar size={32} className="text-emerald-300" />
                        </div>
                        <p className="text-slate-700 font-black text-lg mb-1">Instruments Coming Soon</p>
                        <p className="text-slate-400 text-sm max-w-xs mx-auto">We're expanding our collection. Check back soon for professional worship equipment available for hire.</p>
                    </div>
                )}
            </motion.section>

            {/* Pricing Summary */}
            {instruments.length > 0 && (
                <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 pb-10">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white">
                        <h3 className="text-xl font-black mb-4">Rental Pricing</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {instruments.map(inst => (
                                <div key={inst.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                                    <p className="font-bold text-sm">{inst.name}</p>
                                    <p className="text-2xl font-black mt-1">KES {Number(inst.price).toLocaleString()}<span className="text-sm font-bold text-white/60"> /day</span></p>
                                    <p className="text-xs text-white/50 mt-1">Hourly: KES {Math.round(Number(inst.price) / 8).toLocaleString()}/hr</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Testimonials */}
            <TestimonialsSection />

            {/* Faith Footer */}
            <div className="text-center py-10 text-sm text-emerald-700 italic px-4">
                "Praise Him with sounding cymbals; praise Him with loud clashing cymbals!" — Psalm 150:5
            </div>

        </div>
    );
};
