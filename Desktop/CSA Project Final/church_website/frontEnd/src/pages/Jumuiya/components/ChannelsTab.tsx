import React, { useState } from 'react';
import type { SocialMedia, GalleryImage } from '../data/jumuiyaData';
import { FaFacebook, FaTwitter, FaInstagram, FaWhatsapp, FaYoutube, FaEnvelope, FaGlobe, FaTiktok, FaImages, FaArrowLeft, FaArrowRight, FaTimes, FaShareAlt } from "react-icons/fa";
import './TabsSystem.css';

interface ChannelsTabProps {
    socialMedia: SocialMedia[];
    gallery: GalleryImage[];
}

const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('facebook')) return <FaFacebook />;
    if (p.includes('twitter') || p.includes('x')) return <FaTwitter />;
    if (p.includes('instagram')) return <FaInstagram />;
    if (p.includes('whatsapp')) return <FaWhatsapp />;
    if (p.includes('youtube')) return <FaYoutube />;
    if (p.includes('email') || p.includes('mail')) return <FaEnvelope />;
    if (p.includes('tiktok')) return <FaTiktok />;
    return <FaGlobe />;
};

const ChannelsTab: React.FC<ChannelsTabProps> = ({ socialMedia, gallery }) => {
    const [selectedAlbum, setSelectedAlbum] = useState<GalleryImage | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const openAlbum = (album: GalleryImage) => {
        setSelectedAlbum(album);
    };

    const closeAlbum = () => {
        setSelectedAlbum(null);
    };

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
    };

    const closeLightbox = () => {
        setLightboxIndex(null);
    };

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedAlbum && selectedAlbum.images && lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev !== null && prev < (selectedAlbum.images?.length || 0) - 1 ? prev + 1 : 0));
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedAlbum && selectedAlbum.images && lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : (selectedAlbum.images?.length || 0) - 1));
        }
    };

    return (
        <div className="tab-system-content">
            <div className="tab-header-wrap">
                <div className="header-text">
                    <h1 className="page-title">Connect & Explore</h1>
                    <p className="page-description">
                        Follow our official channels and dive into our community's shared memories and celebrations.
                    </p>
                </div>
            </div>

            {/* Social Media Section */}
            <div className="animate-fade" style={{ marginBottom: 'var(--space-3xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', opacity: 0.6 }}>
                    <FaShareAlt />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Social Channels</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>
                <div className="tab-grid">
                    {socialMedia.map((channel, index) => (
                        <a
                            key={index}
                            href={channel.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tab-card animate-fade"
                            style={{ display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none', color: 'inherit' }}
                        >
                            <div className="notif-icon-wrap" style={{ marginBottom: 0, background: 'var(--bg-soft)', color: 'var(--jumuiya-color)' }}>
                                {getPlatformIcon(channel.platform)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{channel.platform}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Follow our updates</div>
                            </div>
                            <FaArrowRight style={{ color: 'var(--jumuiya-color)', opacity: 0.5 }} />
                        </a>
                    ))}
                </div>
            </div>

            {/* Gallery Section */}
            <div className="animate-fade">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', opacity: 0.6 }}>
                    <FaImages />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Community Gallery</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                <div className="gallery-grid-premium">
                    {gallery.map(album => (
                        <div
                            key={album.id}
                            className="gallery-item-premium tab-card"
                            onClick={() => openAlbum(album)}
                            style={{ padding: 0 }}
                        >
                            <img src={album.url} alt={album.caption} />
                            <div className="gallery-overlay-premium">
                                <div style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>{album.caption}</div>
                                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FaImages /> {album.images?.length || 0} Photos
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Album Modal */}
            {selectedAlbum && (
                <div className="lightbox-overlay" onClick={closeAlbum}>
                    <div className="tab-card glass-card" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '1000px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedAlbum.caption}</h2>
                            <button className="btn-premium" onClick={closeAlbum} style={{ padding: '8px', background: 'var(--bg-soft)', borderRadius: '50%' }}>
                                <FaTimes />
                            </button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                            {selectedAlbum.images?.map((img, index) => (
                                <div
                                    key={index}
                                    className="gallery-item-premium"
                                    onClick={() => openLightbox(index)}
                                    style={{ height: '150px' }}
                                >
                                    <img src={img} alt={`${selectedAlbum.caption} ${index + 1}`} loading="lazy" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxIndex !== null && selectedAlbum && selectedAlbum.images && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <button className="btn-premium" onClick={prevImage} style={{ position: 'absolute', left: '20px', zIndex: 2001, background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                        <FaArrowLeft />
                    </button>
                    <div className="lightbox-img-wrap" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                        <img
                            src={selectedAlbum.images[lightboxIndex]}
                            alt={`${selectedAlbum.caption} ${lightboxIndex + 1}`}
                        />
                        <div style={{ position: 'absolute', bottom: '-40px', width: '100%', textAlign: 'center', color: 'white', fontWeight: 600 }}>
                            {selectedAlbum.caption} ({lightboxIndex + 1} / {selectedAlbum.images.length})
                        </div>
                    </div>
                    <button className="btn-premium" onClick={nextImage} style={{ position: 'absolute', right: '20px', zIndex: 2001, background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                        <FaArrowRight />
                    </button>
                    <button className="btn-premium" onClick={closeLightbox} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 2001, background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                        <FaTimes />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChannelsTab;
