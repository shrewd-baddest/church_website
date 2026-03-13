import { useState, useEffect } from 'react'
import apiService from '../services/api'

interface GalleryItem {
  id: number
  title: string
  description: string
  image_url: string
  category: string
  event_date: string
}

function ImageSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch images from database on mount
  useEffect(() => {
    loadGalleryImages()
  }, [])

  const loadGalleryImages = async () => {
    try {
      const data = await apiService.getGallery()
      // Sort by date (newest first), filter out items without images
      const sortedData = data
        .filter((item: GalleryItem) => item.image_url)
        .sort((a: GalleryItem, b: GalleryItem) => {
          const dateA = a.event_date ? new Date(a.event_date).getTime() : 0
          const dateB = b.event_date ? new Date(b.event_date).getTime() : 0
          return dateB - dateA
        })
      setSlides(sortedData)
    } catch (error) {
      console.error('Error loading gallery images:', error)
      setSlides([])
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    if (slides.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }
  }

  const prevSlide = () => {
    if (slides.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Auto-play functionality
  useEffect(() => {
    if (slides.length > 0) {
      const interval = setInterval(() => {
        nextSlide()
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [slides.length])

  // Default fallback images
  const defaultSlides = [
    "https://picsum.photos/1200/800?random=1",
    "https://picsum.photos/1200/800?random=2",
    "https://picsum.photos/1200/800?random=3"
  ]

  // Get current image to display
  const getCurrentImage = (): string => {
    if (slides.length > 0 && slides[currentSlide]) {
      return slides[currentSlide].image_url
    }
    return defaultSlides[currentSlide % defaultSlides.length]
  }

  if (loading) {
    return (
      <section className="relative h-[300px] md:h-[600px] overflow-hidden bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative h-[300px] md:h-[500px] lg:h-[600px] overflow-hidden">
      <div className="relative w-full h-full">
        <img 
          src={getCurrentImage()} 
          alt={slides[currentSlide]?.title || `CSA Image ${currentSlide + 1}`} 
          className="w-full h-full object-cover transition-opacity duration-500"
          onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = `https://picsum.photos/1200/800?random=${currentSlide + 1}`; }}
        />
        {/* Navigation Buttons - Hidden on very small screens, visible on mobile */}
        <button 
          onClick={prevSlide} 
          className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-1.5 md:p-2 rounded-full transition-all duration-300 hover:scale-110"
          aria-label="Previous slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-6 md:h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button 
          onClick={nextSlide} 
          className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-1.5 md:p-2 rounded-full transition-all duration-300 hover:scale-110"
          aria-label="Next slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-6 md:h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Indicators */}
        <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {(slides.length > 0 ? slides : defaultSlides).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 hover:scale-110 ${
                index === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      {/* Text Overlay */}
      <div className="absolute inset-0 flex flex-col justify-center items-center text-white bg-gradient-to-b from-black/70 via-black/50 to-black/70 px-3 md:px-4 text-center">
        <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-3 md:mb-6 drop-shadow-xl tracking-tight">
          St Thomas Aquinas - CSA
        </h1>
        <p className="text-sm md:text-xl lg:text-2xl italic font-light max-w-xs md:max-w-2xl lg:max-w-3xl leading-relaxed">
          "To one who has faith, no explanation is necessary. To one without faith, no explanation is possible."
        </p>
      </div>
    </section>
  )
}

export default ImageSlider
