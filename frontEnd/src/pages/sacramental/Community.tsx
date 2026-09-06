import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCommunityData } from './context/CommunityDataContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/axiosInstance';
import CommunityDetail from './CommunityDetail';
import CommunityAboutTab from './components/tabs/CommunityAboutTab';
import { FaUserTie, FaUsers, FaCalendarAlt, FaShareAlt, FaTshirt, FaCommentDots, FaChurch, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';
import { FaBars } from 'react-icons/fa';
import '../Jumuiya/JumuiyaLanding.css';

const MINISTRY_COLORS: Record<string, string> = {
  choir: '#1e40af',
  dancers: '#db2777',
  charismatic: '#7c3aed',
  'st-francis': '#047857',
  youth: '#8e44ad',
  mentorship: '#6d28d9',
};

const COMMUNITY_IMAGES: Record<string, string> = {
  choir: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
  dancers: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800',
  charismatic: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&q=80&w=800',
  'st-francis': 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=800',
  youth: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800',
  mentorship: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800',
};

const DEFAULT_COMMUNITY_IMAGE = 'https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?auto=format&fit=crop&q=80&w=800';

const TAB_ICONS: Record<string, React.ReactNode> = {
  choir: <FaUserTie />,
  dancers: <FaUsers />,
  charismatic: <FaShareAlt />,
  'st-francis': <FaBars />,
  mentorship: <FaUsers />,
};

const TAB_LABELS: Record<string, string> = {
  choir: 'Choir',
  dancers: 'Dancers',
  charismatic: 'Charismatic',
  'st-francis': 'St. Francis',
  mentorship: 'Mentorship',
};

// The community hub shows exactly these five groups. Anything else in
// hub_modules (e.g. a "General Parish" entry) is not a ministry group and is
// hidden from the grid — jumuiyas get their own dedicated card below.
const GROUP_MODULE_IDS = new Set(['choir', 'dancers', 'charismatic', 'st-francis', 'youth', 'mentorship']);

const Community: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { modules } = useCommunityData();

  // Fetch logged-in user's community enrollments
  const { data: myCommunitiesData } = useQuery({
    queryKey: ['my-communities'],
    queryFn: async () => {
      const res = await apiClient.get('/community-enrollment/my-communities');
      return res.data?.communities || [];
    },
    enabled: !!user,
    staleTime: 60000,
  });

  // Fetch system settings for the Our Jumuiyas card image
  const { data: settingsData } = useQuery({
    queryKey: ['system-settings-jumuiya-card'],
    queryFn: async () => {
      const res = await apiClient.get('/settings');
      return res.data || {};
    },
    staleTime: 60000,
  });

  const jumuiyaCardImage = settingsData?.community_jumuiya_image || settingsData?.explore_jumuiya_image || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800';

  const myCommunities: Array<{
    module_id: string;
    status: string;
    joined_at: string;
    module_title?: string;
    full_name?: string;
  }> = myCommunitiesData || [];

  // The hub is public — every visitor sees all five groups plus the
  // Jumuiyas card.
  const seenModuleKeys = new Set<string>();
  const activeModules = (modules || []).filter((m) => {
    const rawId = String(m.id || '').toLowerCase();
    const key = rawId === 'youth' || rawId === 'mentorship' ? 'mentorship' : rawId;
    if (!GROUP_MODULE_IDS.has(rawId) && !GROUP_MODULE_IDS.has(key)) return false;
    if (seenModuleKeys.has(key)) return false;
    seenModuleKeys.add(key);
    return true;
  });

  const handleCardClick = (moduleId: string) => {
    navigate(`/community/${moduleId}`);
  };

  return (
    <div className="landing-page">
      <div className="container">
        {/* Hero Section */}
        <header className="hero animate-fade-in">
          <h1 className="hero-title">Communities & Ministries</h1>
          <p className="hero-subtitle">Parish Groups & Vocations</p>
          <p className="hero-description">
            Join one of our vibrant parish ministries and grow in faith, fellowship, and service.
            Each community is a family where we pray together, support one another, and live out the Gospel.
          </p>
        </header>

        {/* Jumuiya Style Cards Grid */}
        <div className="jumuiya-grid">
          {activeModules.map((community) => {
            const image = community.saint_image_url || community.image_url || COMMUNITY_IMAGES[community.id] || DEFAULT_COMMUNITY_IMAGE;
            const color = MINISTRY_COLORS[community.id] || community.color || '#7c2d12';

            return (
              <div
                key={community.id}
                role="button"
                tabIndex={0}
                aria-label={`View ${community.title}`}
                className="jumuiya-card card-clickable animate-fade-in"
                style={{
                  ['--jumuiya-color' as any]: color,
                  cursor: 'pointer',
                  backgroundImage: `url(${image.replace(/^http:\/\//i, 'https://')})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                onClick={() => handleCardClick(community.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(community.id); }}
              >
                <div className="card-overlay" />

                {/* Card Content */}
                <div className="card-content">
                  <div className="card-header">
                    <h2 className="card-title">{community.title}</h2>
                  </div>
                  <p className="card-description">{community.description}</p>
                  <div className="card-footer">
                    <span className="card-link">Explore Ministry →</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Our Jumuiyas — dedicated link card (not a ministry group) */}
          <div
            role="button"
            tabIndex={0}
            aria-label="View Our Jumuiyas"
            className="jumuiya-card card-clickable animate-fade-in"
            style={{
              ['--jumuiya-color' as any]: '#1d4ed8',
              cursor: 'pointer',
              backgroundImage: `url(${jumuiyaCardImage.replace(/^http:\/\//i, 'https://')})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onClick={() => navigate('/jumuiya')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/jumuiya'); }}
          >
            <div className="card-overlay" />
            <div className="card-content">
              <div className="card-header">
                <h2 className="card-title">Our Jumuiyas</h2>
              </div>
              <p className="card-description">
                The seven Small Christian Communities of St. Thomas Aquinas — find your jumuiya, its leaders, and meeting schedules.
              </p>
              <div className="card-footer">
                <span className="card-link">Visit the Jumuiyas →</span>
              </div>
            </div>
          </div>
        </div>

        {/* My Communities — logged-in members see their enrollment status */}
        {user && myCommunities.length > 0 && (
          <div className="my-communities-section animate-fade-in" style={{ marginTop: '2.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>
              My Communities
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myCommunities.map((c) => {
                const color = MINISTRY_COLORS[c.module_id] || '#1e3a5f';
                const statusConfig: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
                  Approved: { icon: <FaCheckCircle size={12} />, bg: '#dcfce7', text: '#166534', label: 'Approved' },
                  Pending: { icon: <FaClock size={12} />, bg: '#fef9c3', text: '#854d0e', label: 'Pending' },
                  Rejected: { icon: <FaTimesCircle size={12} />, bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
                };
                const s = statusConfig[c.status] || statusConfig.Pending;
                return (
                  <button
                    key={c.module_id}
                    type="button"
                    onClick={() => navigate(`/community/${c.module_id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.875rem 1rem',
                      borderRadius: '14px',
                      border: `1px solid ${color}22`,
                      background: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: `${color}18`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color,
                          fontSize: '0.9rem',
                          fontWeight: 800,
                        }}
                      >
                        {c.module_id?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                          {c.module_title || c.module_id}
                        </div>
                        {c.joined_at && (
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            Joined {new Date(c.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: s.bg,
                        color: s.text,
                      }}
                    >
                      {s.icon}
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="landing-footer">
          <p>
            Interested in joining a ministry or starting a new group? Contact the Parish Coordinator at{' '}
            <a href="mailto:info@jumuiya.co.ke">info@jumuiya.co.ke</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Community;