import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../pages/Landing/services/api';
import { FaArrowLeft, FaCheckCircle, FaSearch } from 'react-icons/fa';

interface GalleryItem {
  id: number;
  title: string;
  description: string;
  image_url: string;
  category: string;
  event_date: string;
}

const GalleryPage: React.FC = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    loadGallery();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filterCategory]);

  const loadGallery = async () => {
    try {
      const data = await apiService.getGallery();
      let filtered = data.filter((item: GalleryItem) => item.image_url);

      if (filterCategory) {
        filtered = filtered.filter((item: GalleryItem) => item.category === filterCategory);
      }

      filtered.sort((a: GalleryItem, b: GalleryItem) => {
        const dateA = a.event_date ? new Date(a.event_date).getTime() : 0;
        const dateB = b.event_date ? new Date(b.event_date).getTime() : 0;
        return dateB - dateA;
      });

      setGalleryItems(filtered);
    } catch (err) {
      console.error('Error loading gallery:', err);
      setError('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(galleryItems.map(item => item.category).filter(Boolean)));

  // Group by date
  const groupedGallery = galleryItems.reduce((acc, item) => {
    const dateStr = item.event_date 
      ? new Date(item.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
      : 'Other Dates';
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(item);
    return acc;
  }, {} as Record<string, GalleryItem[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500 font-medium animate-pulse">Loading photos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p>{error}</p>
          <button onClick={loadGallery} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* Detail-Oriented Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
            <FaArrowLeft className="text-xl" />
          </Link>
          <h1 className="text-xl font-medium text-gray-700 tracking-wide hidden sm:block">Photo Gallery</h1>
        </div>
        
        <div className="flex-1 max-w-xl px-4 hidden md:block">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-12 pr-4 text-gray-700 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all appearance-none outline-none font-medium"
            >
              <option value="">Search your photos (All Categories)</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-50 transition">
             Home
           </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 py-6 max-w-[2000px] mx-auto">
        {Object.keys(groupedGallery).length === 0 ? (
           <div className="flex flex-col items-center justify-center pt-20 text-gray-400">
             <div className="text-6xl mb-4">📸</div>
             <p className="text-lg">No photos found</p>
           </div>
        ) : (
          Object.entries(groupedGallery).map(([date, items]) => (
            <div key={date} className="mb-10">
              <h2 className="text-lg font-medium text-gray-700 mb-4 px-1 sticky top-16 bg-white/95 backdrop-blur z-30 py-2">
                {date}
              </h2>
              {/* Masonry Layout Container */}
              <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="break-inside-avoid relative group cursor-pointer"
                    onClick={() => setSelectedImage(item)}
                  >
                    <img 
                      src={item.image_url} 
                      alt={item.title} 
                      className="w-full rounded-lg bg-gray-100 object-cover hover:shadow-md transition-shadow duration-200"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg flex items-start p-3">
                       <FaCheckCircle className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xl drop-shadow-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modern Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200"
        >
          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-10">
             <button 
               onClick={() => setSelectedImage(null)}
               className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition"
             >
               <FaArrowLeft className="text-xl" /> 
             </button>
             <div className="text-white/90 text-sm font-medium">
               {selectedImage.event_date ? new Date(selectedImage.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
             </div>
             <div className="w-10"></div>
          </div>

          <img 
            src={selectedImage.image_url} 
            alt={selectedImage.title}
            className="max-w-full max-h-full object-contain select-none"
          />

          {/* Bottom Info */}
          {(selectedImage.title || selectedImage.description) && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
              <h3 className="text-lg font-medium tracking-wide">{selectedImage.title}</h3>
              <p className="text-sm text-white/70 mt-1 max-w-3xl">{selectedImage.description}</p>
              {selectedImage.category && (
                <span className="inline-block mt-3 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm shadow-sm ring-1 ring-white/30">
                  {selectedImage.category}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
