
import React, { useState, useEffect } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
  Heart,
  Smile,
  Send,
  Calendar,
  Search,
} from 'lucide-react';
import { apiClient } from '../../../../../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';

interface GalleryItem {
  id: number;
  image_url: string;
  description: string;
  event_name: string;
  upload_date: string;
  module_id: string;
  is_anniversary?: boolean;
}



const GallerySection: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [theme, setTheme] = useState('default');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());

  // Toggle Like Logic
  const toggleLike = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setLikedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const { data } = await apiClient.get('/gallery');
        setItems(data.items || []);
        setTheme(data.theme || 'default');
      } catch (error) {
        console.error("Failed to load gallery:", error);
      } finally {
        setLoading(false);
      }
    };
    loadGallery();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.module_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const nextImage = () => {
    if (selectedIdx !== null) {
      setSelectedIdx((selectedIdx + 1) % filteredItems.length);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-16 pb-32 transition-colors duration-1000 ${theme === 'Christmas' ? 'bg-slate-50' : 'bg-white'}`}>
      <div className="container mx-auto px-6">
        {/* Gallery Header - Sharp & Authoritative */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-slate-50 border border-slate-100/80 text-slate-400 text-[9px] font-black tracking-[0.4em] uppercase mb-6 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Parish Chronicles
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
             The Living <span className="text-primary">Heritage</span>
          </h1>

          {/* Premium Smart Search Station - Minimalist Overhaul */}
          <div className="mt-8 relative z-20 max-w-4xl mx-auto flex flex-col items-center gap-8">
            {/* Unified Search Entry */}
            <div className="w-full max-w-2xl bg-white/90 backdrop-blur-2xl shadow-[0_30px_70px_-20px_rgba(0,0,0,0.08)] rounded-[2.2rem] border-2 border-primary/10 flex items-center p-2 focus-within:border-primary/40 transition-all">
              <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center transition-all shrink-0 ${searchTerm ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-300'}`}>
                <Search size={18} strokeWidth={2.5} className={searchTerm ? 'animate-pulse' : ''} />
              </div>

              <input 
                type="text" 
                placeholder="Search the Parish Chronicles..."
                className="flex-1 self-stretch bg-transparent border-none outline-none px-6 text-slate-700 font-bold placeholder:text-slate-300/80 placeholder:italic text-sm tracking-tight"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <AnimatePresence>
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={() => setSearchTerm('')}
                    className="w-12 h-12 bg-slate-50/80 rounded-[1.5rem] text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center shrink-0 mr-1"
                  >
                    <X size={14} strokeWidth={3} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Grouped Floating Chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {['All', 'general', 'choir', 'youth', 'jumuiya'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all relative border ${
                    filterCategory === cat 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Improved Masonry Grid - High-End Feed Style */}
        <div className="flex flex-col md:grid md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10 max-w-[1400px] mx-auto">
          {filteredItems.map((item, index) => (
            <motion.div 
              layout
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group flex flex-col bg-white md:rounded-[3.5rem] rounded-[2.5rem] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] border border-slate-50 transition-all duration-700 md:cursor-zoom-in"
              onClick={() => {
                setSelectedIdx(index);
              }}
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-6 md:hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary">
                    <Camera size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Memory from</p>
                    <h4 className="text-xs font-black text-slate-900">{item.module_id === 'general' ? 'Parish Archives' : `${item.module_id} Group`}</h4>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter italic">
                   {item.upload_date ? new Date(item.upload_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Heritage'}
                </div>
              </div>

              {/* Visual Component */}
              <div className="relative overflow-hidden aspect-[4/5] md:aspect-auto mx-4 md:mx-0 rounded-[2rem] md:rounded-none border border-slate-100/50 md:border-none shadow-sm md:shadow-none">
                <img 
                  src={item.image_url} 
                  alt={item.event_name}
                  className="w-full h-full object-cover transition-transform duration-[2500ms] group-hover:scale-105 rounded-[2rem] md:rounded-none"
                />
                
                {item.is_anniversary && (
                  <div className="absolute top-6 left-6 px-4 py-2 bg-primary/95 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg flex items-center gap-2 backdrop-blur-md z-10">
                    <Smile size={12} />
                    Anniversary
                  </div>
                )}

                {/* Desktop-only Hover Overlay */}
                <div className="absolute inset-0 bg-slate-900/0 md:group-hover:bg-slate-900/60 md:backdrop-blur-[2px] transition-all duration-500 opacity-0 md:group-hover:opacity-100 hidden md:flex flex-col justify-end p-10">
                  <div className="flex items-center gap-3 text-white/60 text-[9px] font-black uppercase tracking-widest mb-3">
                    <Calendar size={12} />
                    {item.upload_date ? new Date(item.upload_date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Heritage'}
                  </div>
                  <h3 className="text-3xl font-black text-white leading-tight mb-4">{item.event_name}</h3>
                  <p className="text-white/80 text-sm font-medium leading-relaxed line-clamp-3 mb-6">
                    {item.description}
                  </p>
                  <div className="w-12 h-1 bg-primary/80 rounded-full"></div>
                </div>
              </div>

              {/* Mobile Footer */}
              <div className="p-7 md:hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{item.event_name}</h3>
                  <button 
                    onClick={(e) => toggleLike(e, item.id)}
                    className={`transition-all duration-300 ${likedItems.has(item.id) ? 'text-primary scale-110' : 'text-slate-300 hover:text-primary'}`}
                  >
                    <Heart size={22} fill={likedItems.has(item.id) ? "currentColor" : "none"} />
                  </button>
                </div>
                <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-2 mb-6">
                  {item.description}
                </p>
                <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
                   <div className="flex-1 h-12 bg-slate-50 rounded-2xl flex items-center px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                     Join the reflection...
                   </div>
                   <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                      <MessageSquare size={18} />
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

        {/* Chronicle Explorer - 95% Canvas Logic */}
        <AnimatePresence>
          {selectedIdx !== null && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-0 md:p-6"
            >
               {/* Master Floating Canvas - Centered Museum Grade Hub */}
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.95, opacity: 0 }}
                 className="w-full h-full md:w-[95vw] md:h-[95vh] bg-blue-50/80 backdrop-blur-3xl md:rounded-[4rem] border-white/20 md:border md:shadow-[0_60px_120px_-30px_rgba(30,58,138,0.2)] flex flex-col relative overflow-hidden"
               >
                  {/* Top Navigation Strip */}
                  <div className="absolute top-10 left-10 right-10 flex items-center justify-between z-[140]">
                    <button 
                      onClick={() => setSelectedIdx(null)}
                      className="flex items-center gap-4 text-slate-500 hover:text-slate-900 transition-all group pointer-events-auto"
                    >
                      <div className="w-12 h-12 rounded-full border border-slate-200 bg-white/50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-lg border-white">
                        <ChevronLeft size={20} />
                      </div>
                      <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.5em]">Gallery Hub</span>
                    </button>

                    <button 
                      onClick={nextImage}
                      className="flex items-center gap-4 text-slate-400 hover:text-slate-900 transition-all group pointer-events-auto"
                    >
                      <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.5em]">Next Archive</span>
                      <div className="w-12 h-12 rounded-full border border-slate-200 bg-white/50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-lg border-white">
                        <ChevronRight size={20} />
                      </div>
                    </button>
                  </div>

                  {/* Centered Centered Witness Testimony - Top Horizontal Center */}
                  <div className="absolute top-28 left-0 right-0 flex justify-center z-[130] pointer-events-none px-6">
                    <motion.div 
                      key={filteredItems[selectedIdx].id}
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="max-w-[500px] w-full bg-white/40 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] p-6 shadow-xl pointer-events-auto"
                    >
                       <div className="flex flex-col items-center text-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg">
                            <MessageSquare size={18} />
                          </div>
                          <p className="text-[15px] text-slate-900 font-medium italic leading-relaxed">
                            "This day remains etched in our hearts as a testament of our collective faith and spirit."
                          </p>
                          <div className="flex items-center gap-3">
                             <span className="w-4 h-px bg-slate-300"></span>
                             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Elder Witness Reflection</span>
                             <span className="w-4 h-px bg-slate-300"></span>
                          </div>
                       </div>
                    </motion.div>
                  </div>

                  {/* Main Visual Stage - Raw 95% Focus */}
                  <div className="w-full h-full flex items-center justify-center p-8 md:p-24 z-[110]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={filteredItems[selectedIdx].id}
                          initial={{ opacity: 0, scale: 1.05 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 100, damping: 20 }}
                          className="w-full h-full flex items-center justify-center"
                        >
                           <img 
                              src={filteredItems[selectedIdx].image_url} 
                              className="w-full h-full object-contain"
                              alt="Raw Chronicle"
                           />
                        </motion.div>
                      </AnimatePresence>
                  </div>

                  {/* Centered Centered Metadata & Carousel Hub - Bottom Alignment */}
                  <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-10 z-[140] pointer-events-none px-6">
                     
                     {/* Metadata Command Strip - Thinner & Centered */}
                     <motion.div 
                        layoutId="metadata_strip"
                        className="w-full max-w-[1300px] bg-white/30 backdrop-blur-3xl border border-white/30 shadow-2xl rounded-[2.5rem] p-4 flex flex-col md:flex-row items-center justify-between gap-10 pointer-events-auto"
                      >
                        <AnimatePresence mode="wait">
                          <motion.div 
                            key={filteredItems[selectedIdx].id}
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -40, opacity: 0 }}
                            className="flex items-center gap-8 px-6 flex-1 min-w-0"
                          >
                             <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-lg">
                                <Camera size={26} />
                             </div>
                             <div className="min-w-0 text-left">
                                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-2 truncate">
                                  {filteredItems[selectedIdx].event_name}
                                </h2>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-blue-600">
                                   <span>{filteredItems[selectedIdx].module_id} Group</span>
                                   <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                   <span className="text-slate-400">{new Date(filteredItems[selectedIdx].upload_date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                                </div>
                             </div>
                          </motion.div>
                        </AnimatePresence>

                        <div className="flex items-center gap-6 px-10 shrink-0">
                           <button 
                             onClick={(e) => toggleLike(e, filteredItems[selectedIdx].id)}
                             className={`flex items-center gap-4 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                               likedItems.has(filteredItems[selectedIdx].id) 
                               ? 'bg-rose-600 text-white shadow-lg' 
                               : 'bg-white/80 text-slate-500 hover:text-rose-600'
                             }`}
                           >
                              <Heart size={20} fill={likedItems.has(filteredItems[selectedIdx].id) ? "currentColor" : "none"} />
                              Acknowledge
                           </button>
                           <button className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                              <Send size={24} />
                           </button>
                        </div>
                     </motion.div>

                     {/* Digital Folder Carousel - Centered Below */}
                     <div className="w-full max-w-5xl flex items-end justify-center gap-6 overflow-x-auto hide-scrollbar pointer-events-auto pb-4 px-10">
                        {filteredItems.slice(0, 10).map((thum, idx) => (
                           <div key={thum.id} className="flex flex-col items-center gap-4">
                              <motion.div
                                onClick={() => setSelectedIdx(idx)}
                                animate={{ 
                                  scale: selectedIdx === idx ? 1.4 : 0.85, 
                                  opacity: selectedIdx === idx ? 1 : 0.4,
                                  y: selectedIdx === idx ? -15 : 0
                                }}
                                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                className={`rounded-[1.2rem] md:rounded-[2rem] overflow-hidden cursor-pointer border-[4px] relative shrink-0 shadow-xl ${
                                   selectedIdx === idx ? 'border-blue-500 w-28 h-20 md:w-52 md:h-36 z-[160]' : 'border-white/50 w-16 h-12 md:w-24 md:h-16'
                                }`}
                              >
                                 <img src={thum.image_url} className="w-full h-full object-cover" />
                                 {selectedIdx === idx && (
                                    <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay" />
                                 )}
                              </motion.div>
                              
                              {selectedIdx === idx && (
                                <motion.div 
                                  layoutId="dot_indicator"
                                  className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)] ring-4 ring-white relative active-dot"
                                />
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};

export default GallerySection;
