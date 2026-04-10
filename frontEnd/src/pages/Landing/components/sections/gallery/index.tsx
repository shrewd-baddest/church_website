/**
 * Gallery Section Component
 * 
 * This component displays a photo gallery of church events and activities
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../../services/api';

interface GalleryItem {
  id: number;
  title: string;
  description: string;
  image_url: string;
  category: string;
  event_date: string;
}

const GallerySection: React.FC = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      console.log('Fetching gallery...');
      const data = await apiService.getGallery();
      console.log('Gallery data:', data);
      setGalleryItems(data);
    } catch (err) {
      console.error('Error loading gallery:', err);
      setError('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div id="gallery" className="py-8 md:py-16 bg-white">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <p className="text-gray-500">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="gallery" className="py-8 md:py-16 bg-white">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div id="gallery" className="py-8 md:py-16 bg-white">
      <div className="container mx-auto px-3 md:px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 md:mb-4">Photo Gallery</h2>
        <p className="text-center text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
          Capturing moments from our church community
        </p>
        
        {galleryItems.length === 0 ? (
          <p className="text-center text-gray-500">No gallery items found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {galleryItems.map((item) => (
              <div 
                key={item.id} 
                className="flex flex-col bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl group cursor-pointer border border-gray-100"
                onClick={() => setSelectedImage(item)}
              >
                <div className="relative overflow-hidden aspect-[4/3]">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <span className="text-slate-400 text-sm font-medium">No Image</span>
                    </div>
                  )}
                  {/* Subtle category badge */}
                  {item.category && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="text-slate-900 font-bold text-base mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-slate-500 text-sm line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-auto pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                    <span>{item.event_date ? new Date(item.event_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Event'}</span>
                    <span className="text-blue-500 group-hover:translate-x-1 transition-transform">View Details →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link 
            to="/gallery" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-blue-600 hover:shadow-blue-500/20 transform hover:-translate-y-1 transition-all duration-300 group"
          >
            View All Photos
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* Lightbox */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-2 md:p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="max-w-4xl w-full bg-white rounded-lg overflow-hidden relative max-h-[90vh] overflow-y-auto">
              {selectedImage.image_url && (
                <img 
                  src={selectedImage.image_url} 
                  alt={selectedImage.title}
                  className="w-full max-h-48 md:max-h-96 object-contain"
                />
              )}
              <div className="p-3 md:p-4">
                <h3 className="text-lg md:text-xl font-bold mb-2">{selectedImage.title}</h3>
                {selectedImage.description && (
                  <p className="text-gray-600 mb-2 text-sm md:text-base">{selectedImage.description}</p>
                )}
                {selectedImage.category && (
                  <p className="text-sm text-blue-600 mb-2">Category: {selectedImage.category}</p>
                )}
                {selectedImage.event_date && (
                  <p className="text-sm text-gray-500">
                    {new Date(selectedImage.event_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button 
                className="absolute top-2 md:top-4 right-2 md:right-4 text-gray-500 hover:text-gray-700 text-xl md:text-2xl bg-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center"
                onClick={() => setSelectedImage(null)}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GallerySection;
