import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroSlider } from '../components/HeroSlider';
import { ArrowUpRight, Loader2, ShoppingBag, Shirt, ArmchairIcon, Guitar, BookHeart } from 'lucide-react';
import apiService from '../../Landing/services/api';
import { useProjectsData } from '../context/ProjectsProvider';

const CATEGORIES = [
  { id: 'sacramentals', label: 'Sacramentals', path: '/sacramentals', tag: '15 items', icon: <ShoppingBag size={18} />, desc: 'Sacred items for your spiritual journey and daily devotion.' },
  { id: 'tshirts', label: 'T-Shirts', path: '/t-shirts', tag: 'New Arrival', icon: <Shirt size={18} />, desc: 'Show your faith with our premium CSA merchandise.' },
  { id: 'chairs', label: 'Chairs', path: '/chairs', tag: 'Rent Now', icon: <ArmchairIcon size={18} />, desc: 'Quality seating for your events and gatherings.' },
  { id: 'instruments', label: 'Instruments', path: '/instruments', tag: 'Book Now', icon: <Guitar size={18} />, desc: 'Professional musical instruments for hire.' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { y: 40, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 70, damping: 15 } },
};

const FaithFooter: React.FC = () => (
  <section className="bg-slate-50 py-10 border-t border-slate-100">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center">
      <p className="text-xs text-slate-400">
        Kirinyaga University Catholic Student Association — St. Thomas of Aquinas
      </p>
    </div>
  </section>
);

export const Home = () => {
  const ctx = useProjectsData();
  const [sliderImgs, setSliderImgs] = useState<any[]>([]);
  const [sliderLoading, setSliderLoading] = useState(true);
  const [cardImages, setCardImages] = useState<Record<string, string>>({});
  const [cardTags, setCardTags] = useState<Record<string, string>>({});
  const [cardsLoading, setCardsLoading] = useState(true);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    if (ctx.sliderImages.length > 0) {
      setSliderImgs(ctx.sliderImages);
      setSliderLoading(false);
    } else {
      apiService.getSacramentalsSliderImages().then(data => {
        if (Array.isArray(data)) setSliderImgs(data);
      }).finally(() => setSliderLoading(false));
    }

    if (ctx.categoryCards.length > 0) {
      const imgs: Record<string, string> = {};
      const tags: Record<string, string> = {};
      ctx.categoryCards.forEach((c: any) => {
        if (c.image_url) imgs[c.category] = c.image_url;
        if (c.tag) tags[c.category] = c.tag;
      });
      setCardImages(imgs);
      setCardTags(tags);
      setCardsLoading(false);
    } else {
      apiService.getCategoryCards().then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const imgs: Record<string, string> = {};
          const tags: Record<string, string> = {};
          data.forEach((c: any) => {
            if (c.image_url) imgs[c.category] = c.image_url;
            if (c.tag) tags[c.category] = c.tag;
          });
          setCardImages(imgs);
          setCardTags(tags);
        }
      }).catch(() => {}).finally(() => setCardsLoading(false));
    }
  }, [ctx.sliderImages, ctx.categoryCards]);

  const getImg = (id: string) => cardImages[id] || '';
  const getTag = (id: string) => cardTags[id] || CATEGORIES.find(c => c.id === id)?.tag || '';

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 text-slate-800 font-sans">

      {/* ══════════ Hero Header ─ Dark Premium Grid Design ══════════ */}
      <div className="bg-slate-950 text-white relative overflow-hidden shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

        {/* Subtle grid texture overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          {sliderLoading ? (
            <div className="w-full h-[240px] sm:h-[320px] md:h-[420px] lg:h-[520px] rounded-2xl md:rounded-3xl bg-slate-800 animate-pulse" />
          ) : (
            <HeroSlider images={sliderImgs} isAdmin={false} section="sacramentals" shopAnchor="#categories" />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-8 text-center relative z-10">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block text-[10px] sm:text-xs font-black uppercase tracking-[0.32em] text-blue-400 bg-blue-500/10 px-5 py-2.5 rounded-full border border-blue-500/20 mb-4"
          >
            KYU CSA Store
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight"
          >
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Catholic Store
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-5 sm:gap-8"
          >
            {[
              { label: 'Kirinyaga University', sub: 'KYU', icon: '🎓' },
              { label: 'Catholic Student Association', sub: 'CSA', icon: '✝️' },
              { label: 'St. Thomas of Aquinas', sub: 'Patron Saint', icon: '📖' },
            ].map((brand, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center">
                  <span className="text-[10px] font-black text-blue-300">{brand.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-black text-white">{brand.sub}</p>
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{brand.label}</p>
                </div>
              </div>
            ))}
            <NavLink to="/devotions" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookHeart size={14} className="text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">Daily Spiritual Life</p>
                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Prayer & Reflection</p>
              </div>
            </NavLink>
          </motion.div>
        </div>
      </div>

      {/* ══════════ Category Cards Grid (overlapping hero) ══════════ */}
      <div id="categories" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <motion.div className="text-center mb-8 sm:mb-10">
          <span className="inline-block text-[10px] sm:text-xs font-black text-blue-600 bg-blue-100 px-4 py-1.5 rounded-full uppercase tracking-widest mb-3">
            Our Collections
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800">Browse by Category</h2>
        </motion.div>

        {cardsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-wrap justify-center gap-6"
          >
            {CATEGORIES.slice(0, 3).map(cat => (
              <motion.div key={cat.id} variants={cardVariants} className="w-full max-w-[360px] sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)]">
                <NavLink
                  to={cat.path}
                  className="group relative flex flex-col h-full w-full bg-white rounded-[2.5rem] border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out overflow-hidden hover:-translate-y-3"
                >
                  <div className="h-56 relative overflow-hidden shrink-0">
                    <img
                      src={getImg(cat.id)}
                      alt={cat.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    <span className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                      {getTag(cat.id)}
                    </span>
                    <div className="absolute top-4 right-4 w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg text-white">
                      {cat.icon}
                    </div>
                    <div className="absolute bottom-4 left-6 right-6">
                      <h3 className="text-xl font-black text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors">
                        {cat.label}
                      </h3>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow font-medium">
                      {cat.desc}
                    </p>
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-end text-blue-600 group-hover:text-blue-700 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 flex items-center justify-center text-blue-600">
                        <ArrowUpRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </NavLink>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* 4th card centered below */}
        {!cardsLoading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, type: 'spring', stiffness: 70, damping: 15 }}
            className="mt-6 flex justify-center"
          >
            <div className="w-full max-w-[360px]">
              <NavLink
                to={CATEGORIES[3].path}
                className="group relative flex flex-col h-full w-full bg-white rounded-[2.5rem] border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out overflow-hidden hover:-translate-y-3"
              >
                <div className="h-56 relative overflow-hidden shrink-0">
                  <img
                    src={getImg(CATEGORIES[3].id)}
                    alt={CATEGORIES[3].label}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <span className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    {getTag(CATEGORIES[3].id)}
                  </span>
                  <div className="absolute top-4 right-4 w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg text-white">
                    {CATEGORIES[3].icon}
                  </div>
                  <div className="absolute bottom-4 left-6 right-6">
                    <h3 className="text-xl font-black text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors">
                      {CATEGORIES[3].label}
                    </h3>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow font-medium">
                    {CATEGORIES[3].desc}
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-end text-blue-600 group-hover:text-blue-700 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 flex items-center justify-center text-blue-600">
                      <ArrowUpRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </NavLink>
            </div>
          </motion.div>
        )}
      </div>

      <FaithFooter />

    </div>
  );
};
