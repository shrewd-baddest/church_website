import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Activity, Layers, Users, ArrowRight } from 'lucide-react';
import { apiClient } from '../../../../api/axiosInstance';

const EXPLORE_SETTING_KEYS: Record<string, string> = {
  jumuiya: 'explore_jumuiya_image',
  activities: 'explore_activities_image',
  projects: 'explore_projects_image',
  officials: 'explore_officials_image',
  background: 'explore_background_image',
};

const SETTINGS_CACHE_KEY = 'cs_explore_settings';
const SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Shimmer skeleton shown while a card image is loading */
const ImageSkeleton: React.FC = () => (
  <div
    className="absolute inset-0 w-full h-full"
    style={{
      background: 'linear-gradient(90deg, #e2e2e2 25%, #efefef 50%, #e2e2e2 75%)',
      backgroundSize: '200% 100%',
      animation: 'cs-shimmer 1.4s infinite',
    }}
  />
);

const CommunitySection: React.FC = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<Record<string, string>>({});
  const [loadedCards, setLoadedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;

    // Try sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(SETTINGS_CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached) as { data: Record<string, string>; ts: number };
        if (Date.now() - ts < SETTINGS_CACHE_TTL) {
          setImages(data);
          return; // Skip network request entirely
        }
      }
    } catch {
      // Ignore parse errors
    }

    apiClient
      .get('/settings')
      .then(({ data }) => {
        if (!active) return;
        const next: Record<string, string> = {};
        Object.entries(EXPLORE_SETTING_KEYS).forEach(([field, key]) => {
          if (data?.[key]) next[field] = data[key];
        });
        setImages(next);
        // Cache for subsequent renders this session
        try {
          sessionStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({ data: next, ts: Date.now() }));
        } catch {
          // sessionStorage may be unavailable in private mode
        }
      })
      .catch(() => {
        // keep defaults when settings are unavailable
      });
    return () => {
      active = false;
    };
  }, []);

  const handleImageLoad = (title: string) => {
    setLoadedCards(prev => ({ ...prev, [title]: true }));
  };

  const handleImageError = (title: string) => {
    // Still mark as "loaded" to clear the skeleton even if image fails
    setLoadedCards(prev => ({ ...prev, [title]: true }));
  };

  const categories = [
    {
      title: 'Jumuiya',
      label: 'Fellowship',
      description: 'Local parish small groups that meet in faith, prayer, and friendship.',
      icon: <Grid size={22} />,
      accent: '#2563eb',
      link: '/jumuiya',
      image: images.jumuiya || '/images/biblestudy.webp',
    },
    {
      title: 'Activities',
      label: 'Engagement',
      description: 'Prayer meetings, retreats, and community events throughout the year.',
      icon: <Activity size={22} />,
      accent: '#059669',
      link: '/activities',
      image: images.activities || '/images/eucharist.webp',
    },
    {
      title: 'Projects',
      label: 'Growth',
      description: 'Development and outreach initiatives that serve our wider community.',
      icon: <Layers size={22} />,
      accent: '#d97706',
      link: '/projects',
      image: images.projects || '/images/church.jpg',
    },
    {
      title: 'Officials',
      label: 'Leadership',
      description: 'The dedicated leaders who guide and serve the parish family.',
      icon: <Users size={22} />,
      accent: '#7c3aed',
      link: '/officials',
      image: images.officials || '/images/st-thomas-icon.jpg',
    },
  ];

  return (
    <>
      {/* Shimmer keyframe — injected once into the document */}
      <style>{`
        @keyframes cs-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      <section className="py-20 md:py-28 bg-stone-900 relative overflow-hidden" id="explore">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${images.background || '/images/christ.webp'}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/85 via-stone-900/70 to-stone-900/85" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
              Explore Our Community
            </h2>
            <p className="text-stone-300 font-medium text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              Faith, service, and friendship come together through the groups and
              ministries that make our parish home.
            </p>
            <div className="mt-7 flex items-center gap-3 text-stone-400">
              <span className="h-px w-10 bg-white/30" />
              <span className="text-xs italic font-serif text-stone-300">Four ways to belong</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((item) => {
              const isLoaded = loadedCards[item.title] ?? false;
              return (
                <button
                  key={item.title}
                  onClick={() => navigate(item.link)}
                  className="group relative text-left bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Themed image header */}
                  <div className="relative h-44 overflow-hidden bg-stone-200">
                    {/* Skeleton shimmer shown until image loads */}
                    {!isLoaded && <ImageSkeleton />}

                    <img
                      src={item.image}
                      alt={item.title}
                      width={400}
                      height={176}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      onLoad={() => handleImageLoad(item.title)}
                      onError={() => handleImageError(item.title)}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                      style={{
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 0.5s ease, transform 0.7s ease',
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/10 to-transparent" />
                  </div>

                  {/* Body */}
                  <div className="p-7">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase mb-3"
                      style={{ backgroundColor: `${item.accent}14`, color: item.accent }}
                    >
                      {item.label}
                    </span>

                    <h3 className="text-xl font-bold text-stone-800 mb-2 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-stone-500 font-medium text-sm leading-relaxed">
                      {item.description}
                    </p>

                    <div
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                      style={{ color: item.accent }}
                    >
                      View Details
                      <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default CommunitySection;
