import { useState, useEffect, useCallback } from 'react'
import apiService from '../services/api'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'

// ─── Types ───────────────────────────────────────────────────────────────────
interface GalleryItem {
  id: number
  title: string
  description: string
  image_url: string
  category: string
  event_date: string
}

// ─── Constants (outside component — never re-created on re-render) ────────────
const SLIDE_DURATION_MS = 12000   // How long each slide stays visible
const ANIM_LOCK_MS = 1500    // Matches the CSS transition duration
const MIN_SWIPE_PX = 50      // Minimum px to register as a swipe

const DEFAULT_SLIDES: GalleryItem[] = [
  {
    id: 1,
    title: "St Thomas Aquinas\n CSA Kirinyaga",
    description: "To one who has faith, no explanation is necessary. To one without faith, no explanation is possible.",
    image_url: "https://images.unsplash.com/photo-1548625361-ec853715d0dd?q=80&w=1200&auto=format&fit=crop",
    category: "welcome",
    event_date: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Vibrant Community\nFaith & Action",
    description: "Experience the thriving energy of our youth movements. Deepening spiritual connections through active service and genuine fellowship.",
    image_url: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=1200&auto=format&fit=crop",
    category: "community",
    event_date: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Sunday Mass\nDivine Worship",
    description: "Gather with us every Sunday for the breaking of the bread. A solemn, beautiful encounter with grace and community reflection.",
    image_url: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=1200&auto=format&fit=crop",
    category: "worship",
    event_date: new Date().toISOString(),
  },
  {
    id: 5,
    title: "Choir & Music\nVoices of Angels",
    description: "Join our incredibly talented choir members. Uplifting the congregation through powerful Gospel harmonies and traditional hymnals.",
    image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop",
    category: "choir",
    event_date: new Date().toISOString(),
  },
  {
    id: 6,
    title: "Retreats & Prayers\nSpiritual Renewal",
    description: "Step away from the noise of the world. Our silent retreats offer the perfect environment for reflection, prayer, and deep spiritual growth.",
    image_url: "https://images.unsplash.com/photo-1437603568260-1950d3ca6eab?q=80&w=1200&auto=format&fit=crop",
    category: "prayer",
    event_date: new Date().toISOString(),
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function enrichSlides(dbSlides: GalleryItem[]): GalleryItem[] {
  return dbSlides.map((slide, i) => ({
    ...slide,
    title: slide.title?.length > 3 ? slide.title : DEFAULT_SLIDES[i % DEFAULT_SLIDES.length].title,
    description: slide.description ? slide.description : DEFAULT_SLIDES[i % DEFAULT_SLIDES.length].description,
  }))
}

/** Guarantee at least 6 slides so navigation is always meaningful */
function buildDisplaySlides(dbSlides: GalleryItem[]): GalleryItem[] {
  const enriched = enrichSlides(dbSlides)
  if (enriched.length >= 6) return enriched
  return [...enriched, ...DEFAULT_SLIDES.slice(enriched.length)]
}

/** Fire-and-forget browser image pre-fetch */
function preloadImage(url: string) {
  const img = new Image()
  img.src = url
}

function ImageSlider() {

  const [dbSlides, setDbSlides] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const displaySlides = buildDisplaySlides(dbSlides)
  const total = displaySlides.length

  useEffect(() => {
    apiService.getGallery()
      .then((data: GalleryItem[]) => {
        const sorted = data
          .filter(item => item.image_url)
          .sort((a, b) => new Date(b.event_date ?? 0).getTime() - new Date(a.event_date ?? 0).getTime())
        setDbSlides(sorted)
      })
      .catch(() => setDbSlides([]))
      .finally(() => setLoading(false))
  }, [])

  // ── Image pre-loading: fetch next & previous images into browser cache ─────
  useEffect(() => {
    if (total === 0) return
    const nextIdx = (currentSlide + 1) % total
    const prevIdx = (currentSlide - 1 + total) % total
    preloadImage(displaySlides[nextIdx].image_url)
    preloadImage(displaySlides[prevIdx].image_url)
  }, [currentSlide, total]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-play: resets timer every time currentSlide changes ───────────────
  useEffect(() => {
    if (total === 0) return
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % total)
    }, SLIDE_DURATION_MS)
    return () => clearInterval(timer)
  }, [currentSlide, total])

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigate = useCallback((to: number) => {
    if (isAnimating || total === 0) return
    setIsAnimating(true)
    setCurrentSlide(to)
    setTimeout(() => setIsAnimating(false), ANIM_LOCK_MS)
  }, [isAnimating, total])

  const nextSlide = useCallback(() => navigate((currentSlide + 1) % total), [navigate, currentSlide, total])
  const prevSlide = useCallback(() => navigate((currentSlide - 1 + total) % total), [navigate, currentSlide, total])
  const goToSlide = useCallback((i: number) => { if (i !== currentSlide) navigate(i) }, [navigate, currentSlide])

  // ── Touch swipe ────────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX) }
  const onTouchMove = (e: React.TouchEvent) => { setTouchEnd(e.targetTouches[0].clientX) }
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const d = touchStart - touchEnd
    if (d > MIN_SWIPE_PX) nextSlide()
    if (d < -MIN_SWIPE_PX) prevSlide()
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="relative h-[60vh] md:h-[85vh] min-h-[450px] bg-gray-950 overflow-hidden flex items-center justify-center">
        {/* Animated shimmer background */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-800 to-gray-950 animate-pulse" />
        {/* Cross at center */}
        <div className="relative flex flex-col items-center gap-4 z-10">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm tracking-widest uppercase">Loading Gallery…</p>
        </div>
      </section>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section
      className="relative h-[60vh] md:h-[85vh] min-h-[450px] overflow-hidden bg-black group"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── 1. Images ─────────────────────────────────────────────────────── */}
      {displaySlides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${i === currentSlide ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}
        >
          <img
            src={slide.image_url}
            alt={slide.title.replace('\n', ' ') || `CSA Gathering ${i + 1}`}
            loading="eager"
            decoding="async"
            className={`object-cover w-full h-full transition-transform duration-[12000ms] ease-out ${i === currentSlide ? 'scale-110' : 'scale-100'}`}
          />
          {/* Centered vignette overlay — darkens edges, keeps center clear */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ))}

      {/* ── 2. Text overlays ──────────────────────────────────────────────── */}
      {displaySlides.map((slide, i) => {
        const [line1, line2] = slide.title.split('\n')
        const active = i === currentSlide
        return (
          <div
            key={`txt-${slide.id}`}
            className={`absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-8 text-center text-white pointer-events-none z-10
              transition-all duration-[1500ms] ease-out ${active ? 'opacity-100 delay-300' : 'opacity-0 delay-0'}`}
          >
            <h1 className={`mb-3 sm:mb-5 text-[26px] sm:text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight
              drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] transition-all duration-[1500ms] ease-[cubic-bezier(0.23,1,0.32,1)]
              ${active ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'}`}
            >
              {line1}
              {line2 && (
                <span className="block mt-2 text-lg sm:text-2xl md:text-4xl text-blue-300 font-bold drop-shadow-xl">
                  {line2}
                </span>
              )}
            </h1>

            <p className={`max-w-[320px] sm:max-w-lg md:max-w-2xl text-[13px] sm:text-base md:text-xl italic font-light leading-relaxed
              drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-gray-200 mx-auto
              transition-all duration-[1500ms] ease-[cubic-bezier(0.23,1,0.32,1)] delay-[400ms]
              ${active ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
            >
              "{slide.description}"
            </p>
          </div>
        )
      })}

      {/* ── 3. Desktop nav buttons — sleek edge-pinned pill capsules ──────── */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); prevSlide() }}
        aria-label="Previous slide"
        className="absolute left-0 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-center justify-center gap-1
          h-20 md:h-24 w-10 md:w-12 
          bg-white/10 hover:bg-white/20 text-white
          backdrop-blur-md border-r-0 border border-white/15
          rounded-r-none rounded-l-none rounded-tr-3xl rounded-br-3xl
          transition-all duration-500 ease-out
          opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-0
          z-40 active:scale-95 cursor-pointer shadow-[4px_0_20px_rgba(0,0,0,0.2)]"
      >
        <FaArrowLeft className="text-sm md:text-base" />
        <span className="text-[8px] font-bold tracking-[0.2em] uppercase opacity-70">Prev</span>
      </button>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); nextSlide() }}
        aria-label="Next slide"
        className="absolute right-0 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-center justify-center gap-1
          h-20 md:h-24 w-10 md:w-12
          bg-white/10 hover:bg-white/20 text-white
          backdrop-blur-md border-l-0 border border-white/15
          rounded-l-none rounded-r-none rounded-tl-3xl rounded-bl-3xl
          transition-all duration-500 ease-out
          opacity-0 group-hover:opacity-100 translate-x-full group-hover:translate-x-0
          z-40 active:scale-95 cursor-pointer shadow-[-4px_0_20px_rgba(0,0,0,0.2)]"
      >
        <FaArrowRight className="text-sm md:text-base" />
        <span className="text-[8px] font-bold tracking-[0.2em] uppercase opacity-70">Next</span>
      </button>

      {/* ── 4. Progress dots ──────────────────────────────────────────────── */}
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 z-40">
        {displaySlides.map((slide, i) => (
            <button
              key={`dot-${slide.id}`}
              type="button"
              onClick={(e) => { e.stopPropagation(); goToSlide(i) }}
              aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-500 rounded-full h-1.5 md:h-2 cursor-pointer
              ${i === currentSlide
                ? 'w-8 sm:w-10 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]'
                : 'w-2 bg-white/40 hover:bg-white/80'}`}
            />
        ))}
      </div>
    </section>
  )
}

export default ImageSlider
