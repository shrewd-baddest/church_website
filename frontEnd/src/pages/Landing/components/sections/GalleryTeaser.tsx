import React, { useEffect, useState } from 'react';
import { Camera, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { fetchGalleryTeaser } from '../../../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface GalleryItem {
  id: number;
  image_url: string;
  description: string;
  event_name: string;
}

const GalleryTeaser: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTeaser = async () => {
      try {
        const { data } = await fetchGalleryTeaser();
        setItems(data);
      } catch (error) {
        console.error("Failed to load gallery teaser:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTeaser();
  }, []);

  if (loading) return null; // Or a subtle shimmer

  const avatarUrl = "https://files.vecteezy.com/system/resource/files/25217923/Kids037_copy.png?response-content-disposition=attachment%3Bfilename%3Dvecteezy_happy-child-with-bag-cute-boy-cartoon-character-3d-rendering_25217923.png&Expires=1775893357&Signature=lwkShtjlLznZ-RpkIzAO3kt5HPUvh60tj2k3Gk6dUxsPx3hJQbejbF057ga1MiQHtlqSQJsRR9lxpgJgCTct2sdCwzopAA4D7sYdeAjESfffOUZobd69EA5IfdXoI7zuB4VWmGIiKtta6MX~qOpE5Eb6UnLzlNQFUIOrM5Al3DF~SutdErckWUe-wj-Sw9r0hDVNG7-Ytx8RsoqtPKHCh2CiakHE7rnkFOF3nnaGaX2KfLuNoG9xop1LNfwQiBKZfbIKlM5ppnfIa~XcMba1g-~hrvxC2x4u9mrjT1riMerMoFK43k~Hi3M7caLc-rCtaAtR4gI8bmqMxk5-Q6HXIg__&Key-Pair-Id=K3714PYOSHV3HB";

  return (
    <section className="py-24 md:py-32 bg-white relative overflow-hidden" id="gallery">
      {/* Precision Background Accent */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_10%_20%,rgba(0,0,0,0.01)_0%,transparent_100%)] pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase mb-8 mx-auto md:mx-0">
              <Camera size={12} className="text-primary/40" />
              Living Memories
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
              Capturing Our <span className="text-primary/80 font-serif italic">Journey</span>
            </h2>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">
              Every smile and celebration preserved in our communal memory. 
              View the full story of our faith in action.
            </p>
          </div>
          
          <button 
            onClick={() => navigate('/gallery')}
            className="group flex items-center gap-4 bg-slate-900 text-white px-10 py-5 rounded-full font-black text-xs tracking-widest uppercase transition-all duration-500 hover:bg-primary hover:shadow-[0_20px_40px_-10px_rgba(var(--primary-rgb),0.3)] mx-auto md:mx-0"
          >
            Access Full Gallery
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-24 relative mt-40 md:mt-0">
          {/* Playful Floating Avatar - GPU Accelerated High Performance */}
          <motion.div 
            className="absolute hidden lg:block left-[44%] top-1/2 -translate-y-1/2 z-20 pointer-events-none will-change-transform"
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 3, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <img 
              src={avatarUrl} 
              alt="Happy Community"
              className="w-56 h-auto drop-shadow-[0_30px_50px_rgba(0,0,0,0.12)] selection:bg-transparent"
            />
            
            {/* Joy to Love Bloom Animation (Desktop) */}
            {[1, 2, 3].map((i) => (
              <motion.span
                key={`em-d-${i}`}
                className="absolute top-0 left-1/2 text-2xl"
                initial={{ opacity: 0, scale: 0, x: -12, y: 0 }}
                whileInView={{ 
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.2, 1],
                  x: i === 1 ? -60 : i === 2 ? 0 : 60,
                  y: i === 1 ? -80 : i === 2 ? -120 : -80,
                }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  delay: i * 0.4,
                  repeatDelay: 2
                }}
              >
                {i === 2 ? '❤️' : '😄'}
              </motion.span>
            ))}
          </motion.div>

          {/* Mobile Avatar - Centered in the new space between header and pushed cards */}
          <motion.div 
            className="absolute lg:hidden right-1/2 translate-x-1/2 -top-24 w-32 h-32 z-20 pointer-events-none will-change-transform"
            initial={{ y: 20 }}
            animate={{ 
              y: [10, -10, 10],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <img 
              src={avatarUrl} 
              alt="Happy Community"
              className="w-full h-auto drop-shadow-2xl"
            />

            {/* Joy to Love Bloom Animation (Mobile) */}
            {[1, 2, 3].map((i) => (
              <motion.span
                key={`em-m-${i}`}
                className="absolute top-0 left-1/2 text-2xl"
                initial={{ opacity: 0, scale: 0, x: -10, y: 0 }}
                whileInView={{ 
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.2, 1],
                  x: i === 1 ? -50 : i === 2 ? 0 : 50,
                  y: i === 1 ? -60 : i === 2 ? -100 : -60,
                }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity, 
                  delay: i * 0.3,
                  repeatDelay: 1.5,
                  ease: "circOut"
                }}
              >
                {i === 2 ? '❤️' : '😄'}
              </motion.span>
            ))}
          </motion.div>

          {items.map((item, index) => (
            <div 
              key={item.id}
              onClick={() => navigate('/gallery')}
              className={`group relative p-3 bg-white border border-slate-100 rounded-[3rem] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_60px_100px_-20px_rgba(0,0,0,0.08)] cursor-pointer ${
                index === 1 ? 'md:translate-y-16' : ''
              }`}
            >
              <div className="relative aspect-[4/3] md:aspect-[16/10] rounded-[2.5rem] overflow-hidden">
                {/* Image */}
                <img 
                  src={item.image_url} 
                  alt={item.event_name}
                  className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                />
                
                {/* Overlay Gradient: Deep Blend */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>

                {/* Content */}
                <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-all duration-700">
                  <div className="flex items-center gap-3 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-8 h-px bg-white/40"></div>
                    <span className="text-white/60 text-[9px] font-black tracking-widest uppercase">Parish Spotlight</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
                    {item.event_name}
                  </h3>
                  <p className="text-white/70 font-medium text-sm leading-relaxed line-clamp-2 max-w-sm">
                     {item.description}
                  </p>
                </div>

                {/* Precision Border Overlay */}
                <div className="absolute inset-0 border border-white/10 rounded-[2.5rem] pointer-events-none"></div>
              </div>

              {/* Hover Indicator: Centered Play/View Look */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100 border border-white/20">
                <ImageIcon size={24} className="text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GalleryTeaser;
