import React, { useState, useEffect, useCallback } from 'react';
import {
  FaFacebook,
  FaYoutube,
  FaWhatsapp,
  FaImages,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaArrowRight,
  FaTiktok,
  FaLock,
  FaShareAlt,
} from 'react-icons/fa';
import { apiClient } from '../../../../api/axiosInstance';
import { normalizeChannelUrl } from '../../../../utils/channelUrl';
import type { CommunityModule } from '../../context/CommunityDataContext';
import '../../../Jumuiya/components/TabsSystem.css';

interface Props {
  moduleId: string;
  module: CommunityModule;
  color: string;
  isMember?: boolean;
}

interface GalleryImage {
  id: number;
  image_url: string;
  event_name: string;
  category?: string;
}

interface Channel {
  platform: string;
  url: string;
}

const PLATFORM_CONFIG: Record<
  string,
  {
    name: string;
    icon: React.ReactNode;
    brandColor: string;
    description: string;
  }
> = {
  whatsapp: {
    name: 'WhatsApp',
    icon: <FaWhatsapp size={22} />,
    brandColor: '#25D366',
    description: 'Official community group chat',
  },
  tiktok: {
    name: 'TikTok',
    icon: <FaTiktok size={20} />,
    brandColor: '#000000',
    description: 'Follow our performances & clips',
  },
  youtube: {
    name: 'YouTube',
    icon: <FaYoutube size={22} />,
    brandColor: '#FF0000',
    description: 'Watch ministrations & recordings',
  },
  facebook: {
    name: 'Facebook',
    icon: <FaFacebook size={22} />,
    brandColor: '#1877F2',
    description: 'Follow our official page updates',
  },
};

const getPlatformDetails = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes('whatsapp')) return PLATFORM_CONFIG.whatsapp;
  if (p.includes('tiktok')) return PLATFORM_CONFIG.tiktok;
  if (p.includes('youtube')) return PLATFORM_CONFIG.youtube;
  if (p.includes('facebook')) return PLATFORM_CONFIG.facebook;
  return {
    name: platform.charAt(0).toUpperCase() + platform.slice(1),
    icon: <FaShareAlt size={20} />,
    brandColor: '#4B5563',
    description: 'Official social updates',
  };
};

// Choir and Dancers can display video platforms (TikTok, YouTube) and Facebook
const VIDEO_PLATFORM_COMMUNITIES = ['choir', 'dancers'];

const CommunityChannelsTab: React.FC<Props> = ({
  moduleId,
  module,
  color,
  isMember = false,
}) => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);

  useEffect(() => {
    // 1. Fetch community gallery
    const fetchGallery = async () => {
      try {
        const res = await apiClient.get('/hub-gallery', {
          params: { module_id: moduleId },
        });
        if (Array.isArray(res.data?.items)) {
          setGalleryImages(res.data.items);
        } else if (Array.isArray(res.data)) {
          setGalleryImages(res.data);
        }
      } catch {
        /* silent fallback to module.gallery */
      }
    };
    fetchGallery();

    // 2. Fetch configured channels for this community
    const fetchChannels = async () => {
      setIsLoadingChannels(true);
      try {
        const res = await apiClient.get(`/community-channels/${moduleId}/channels`);
        const remoteChannels = res.data?.channels;
        if (Array.isArray(remoteChannels) && remoteChannels.length > 0) {
          setChannels(remoteChannels);
        } else if (Array.isArray((module as any)?.socialMedia) && (module as any).socialMedia.length > 0) {
          setChannels((module as any).socialMedia);
        } else {
          setChannels([]);
        }
      } catch {
        if (Array.isArray((module as any)?.socialMedia)) {
          setChannels((module as any).socialMedia);
        }
      } finally {
        setIsLoadingChannels(false);
      }
    };
    fetchChannels();
  }, [moduleId, module]);

  const gallery = module.gallery || [];
  const allImages = [
    ...gallery,
    ...galleryImages.map((g) => ({
      id: String(g.id),
      url: g.image_url,
      caption: g.event_name,
      category: g.category || 'All',
    })),
  ];
  const categories = [
    'all',
    ...Array.from(new Set(allImages.map((g: any) => g.category || 'All'))),
  ];

  const filteredImages =
    filter === 'all'
      ? allImages
      : allImages.filter((g: any) => g.category === filter);

  const lightboxImages = filteredImages;
  const currentImage = selectedIdx !== null ? lightboxImages[selectedIdx] : null;

  const goNext = useCallback(() => {
    if (selectedIdx === null) return;
    setSelectedIdx((prev) => (prev! + 1) % lightboxImages.length);
  }, [selectedIdx, lightboxImages.length]);

  const goPrev = useCallback(() => {
    if (selectedIdx === null) return;
    setSelectedIdx(
      (prev) => (prev! - 1 + lightboxImages.length) % lightboxImages.length
    );
  }, [selectedIdx, lightboxImages.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (selectedIdx === null) return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') setSelectedIdx(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIdx, goNext, goPrev]);

  // Check if a WhatsApp channel has been configured by community admin
  const whatsappChannel = channels.find((ch) => {
    const p = (ch.platform || '').toLowerCase();
    return p.includes('whatsapp') || p.includes('whats app');
  });

  // Filter channels based on community type and visitor membership status:
  // - WhatsApp is ONLY visible if isMember === true.
  // - TikTok & YouTube are visible to ANY user (members + non-members), for Choir & Dancers.
  // - Facebook is visible to all visitors.
  const visibleChannels = channels.filter((ch) => {
    const p = (ch.platform || '').toLowerCase();

    if (p.includes('whatsapp') || p.includes('whats app')) {
      return isMember; // strictly restricted to community members
    }

    if (p.includes('tiktok') || p.includes('youtube')) {
      return VIDEO_PLATFORM_COMMUNITIES.includes(moduleId);
    }

    return true;
  });

  return (
    <div
      className="tab-system-content"
      style={{ '--jumuiya-color': color } as React.CSSProperties}
    >
      <div className="tab-header-wrap">
        <div className="header-text">
          <h1 className="page-title">Connect &amp; Explore</h1>
          <p className="page-description">
            Follow official community channels and dive into our shared memories and celebrations.
          </p>
        </div>
      </div>

      {/* ── Social Media Channels Section (Styled identical to Jumuiya ChannelsTab) ── */}
      <div className="animate-fade" style={{ marginBottom: 'var(--space-3xl, 3rem)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            opacity: 0.7,
          }}
        >
          <FaShareAlt />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Social Channels
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border, rgba(0,0,0,0.1))' }} />
        </div>

        {/* Public & Member Visible Channels */}
        <div className="tab-grid">
          {visibleChannels.map((channel, idx) => {
            const info = getPlatformDetails(channel.platform);
            const isWhatsApp = channel.platform.toLowerCase().includes('whatsapp');
            return (
              <a
                key={channel.platform || idx}
                href={normalizeChannelUrl(channel.platform, channel.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="tab-card animate-fade group cursor-pointer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.25s ease',
                }}
              >
                <div
                  className="notif-icon-wrap"
                  style={{
                    marginBottom: 0,
                    background: `${info.brandColor}15`,
                    color: info.brandColor,
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {info.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{info.name}</span>
                    {isWhatsApp && isMember && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        Member Group
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted, #64748b)',
                      marginTop: '2px',
                    }}
                  >
                    {info.description}
                  </div>
                </div>
                <FaArrowRight
                  style={{
                    color: info.brandColor,
                    opacity: 0.6,
                    flexShrink: 0,
                  }}
                />
              </a>
            );
          })}
        </div>

        {/* WhatsApp Notice for Non-Members */}
        {!isMember && whatsappChannel && (
          <div
            className="mt-4 p-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <FaWhatsapp size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800">
                    Official WhatsApp Group
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-200 text-amber-900">
                    <FaLock size={8} /> Members Only
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  The official WhatsApp group is reserved exclusively for enrolled community members to keep announcements focused.
                </p>
              </div>
            </div>
            <a
              href={`/community/${moduleId}?tab=request`}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition shadow-sm shrink-0 whitespace-nowrap"
            >
              Join Community
            </a>
          </div>
        )}

        {/* Empty Channels state */}
        {!isLoadingChannels && visibleChannels.length === 0 && (!whatsappChannel || isMember) && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 0',
              opacity: 0.6,
            }}
          >
            <FaShareAlt style={{ fontSize: '2rem', marginBottom: '8px', color: color }} />
            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>No social channels published yet</p>
            <p style={{ fontSize: '0.8rem', marginTop: '2px', color: 'var(--text-muted, #64748b)' }}>
              Community leadership will link official channels soon.
            </p>
          </div>
        )}
      </div>

      {/* ── Community Gallery Section ── */}
      <div className="animate-fade">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            opacity: 0.7,
          }}
        >
          <FaImages />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Community Gallery
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border, rgba(0,0,0,0.1))' }} />
        </div>

        {/* Category filters */}
        {categories.length > 2 && (
          <div className="flex gap-2 mb-5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filter === cat
                    ? 'text-white shadow-md'
                    : 'text-slate-600 bg-white border border-slate-200 hover:border-slate-300'
                }`}
                style={filter === cat ? { background: color } : {}}
              >
                {cat === 'all' ? 'All Photos' : cat}
              </button>
            ))}
          </div>
        )}

        {lightboxImages.length > 0 ? (
          <div className="columns-2 sm:columns-3 gap-3 space-y-3">
            {lightboxImages.map((img: any, i: number) => (
              <button
                key={img.id || i}
                type="button"
                onClick={() => setSelectedIdx(i)}
                className="block w-full break-inside-avoid rounded-2xl overflow-hidden group cursor-pointer relative"
              >
                <img
                  src={img.url || img.imageUrl || img.image_url}
                  alt={img.caption || 'Community memory'}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ minHeight: '120px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {img.caption && (
                  <div className="absolute bottom-0 inset-x-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-left">
                    <p className="text-white text-xs font-bold truncate">{img.caption}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div
            className="text-center py-16 rounded-3xl"
            style={{
              background: `${color}06`,
              border: `1px dashed ${color}25`,
            }}
          >
            <div
              className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{ background: `${color}10` }}
            >
              <FaImages style={{ color: `${color}60` }} size={28} />
            </div>
            <p className="font-bold text-slate-500 text-sm">No photos uploaded yet</p>
            <p className="text-slate-400 text-xs mt-1">
              Moments from fellowship and activities will be shared here soon.
            </p>
          </div>
        )}
      </div>

      {/* ── Lightbox Overlay ── */}
      {selectedIdx !== null && currentImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedIdx(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setSelectedIdx(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all z-50 cursor-pointer"
            aria-label="Close lightbox"
          >
            <FaTimes size={18} />
          </button>

          {/* Previous button */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all z-50 cursor-pointer"
              aria-label="Previous photo"
            >
              <FaChevronLeft size={20} />
            </button>
          )}

          {/* Next button */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all z-50 cursor-pointer"
              aria-label="Next photo"
            >
              <FaChevronRight size={20} />
            </button>
          )}

          {/* Image container */}
          <div
            className="max-w-4xl max-h-[80vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                currentImage.url ||
                (currentImage as any).imageUrl ||
                (currentImage as any).image_url
              }
              alt={currentImage.caption || 'Community memory'}
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
            {currentImage.caption && (
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl text-center">
                <p className="text-white text-sm font-bold">{currentImage.caption}</p>
              </div>
            )}
          </div>

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
            <span className="text-white text-xs font-bold">
              {selectedIdx + 1} / {lightboxImages.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityChannelsTab;