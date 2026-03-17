/**
 * Gallery Section Component
 * 
 * This component displays a photo gallery of church events and activities
 */

import React, { useState, useEffect } from 'react';
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {galleryItems.map((item) => (
              <div 
                key={item.id} 
                className="relative group cursor-pointer overflow-hidden rounded-lg"
                onClick={() => setSelectedImage(item)}
              >
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-32 md:h-48 object-cover transition-transform duration-300 group-hover:scale-110"
<<<<<<< HEAD
=======
                    onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = 'https://picsum.photos/400/300?random=' + item.id; }}
>>>>>>> origin/main
                  />
                ) : (
                  <div className="w-full h-32 md:h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs md:text-sm">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-end">
                  <div className="p-2 md:p-3 w-full">
                    <h4 className="text-white font-semibold text-xs md:text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 truncate">
                      {item.title}
                    </h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
<<<<<<< HEAD
=======
                  onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = 'https://picsum.photos/800/600?random=' + selectedImage.id; }}
>>>>>>> origin/main
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
