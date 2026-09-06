import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCommunityData } from './context/CommunityDataContext';
import type { CommunityModule } from './context/CommunityDataContext';
import { apiClient } from '../../api/axiosInstance';
import CommunityAboutTab from './components/tabs/CommunityAboutTab';
import CommunityOfficialsTab from './components/tabs/CommunityOfficialsTab';
import CommunityMembersTab from './components/tabs/CommunityMembersTab';
import CommunityChannelsTab from './components/tabs/CommunityChannelsTab';
import CommunityActivitiesTab from './components/tabs/CommunityActivitiesTab';
import CommunityTshirtsTab from './components/tabs/CommunityTshirtsTab';
import CommunitySettingsTab from './components/tabs/CommunitySettingsTab';
import CommunityNotificationsTab from './components/tabs/CommunityNotificationsTab';
import CommunityRequestTab from './components/tabs/CommunityRequestTab';
import CommunitySuggestionsTab from './components/tabs/CommunitySuggestionsTab';
import CommunityNoticeBoardTab from './components/tabs/CommunityNoticeBoardTab';
import CommunitySongsTab from './components/tabs/CommunitySongsTab';
import { FaInfoCircle, FaUserTie, FaUsers, FaCalendarAlt, FaShareAlt, FaBars, FaBell, FaTshirt, FaArrowLeft, FaKey, FaTimes, FaUserPlus, FaHandPaper, FaCommentDots, FaBullhorn, FaMusic } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import '../Jumuiya/JumuiyaDetail.css';

type TabType = 'about' | 'songs' | 'noticeboard' | 'officials' | 'activities' | 'members' | 'channels' | 'tshirts' | 'suggestions' | 'settings' | 'request';

const MINISTRY_COLORS: Record<string, string> = {
  choir: '#1e40af',
  dancers: '#f97316',
  charismatic: '#7c3aed',
  'st-francis': '#1d4ed8',
  youth: '#6d28d9',
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

const TAB_ICONS: Record<TabType, React.ReactNode> = {
  about: <FaInfoCircle />,
  songs: <FaMusic />,
  noticeboard: <FaBullhorn />,
  officials: <FaUserTie />,
  activities: <FaCalendarAlt />,
  members: <FaUsers />,
  channels: <FaShareAlt />,
  tshirts: <FaTshirt />,
  suggestions: <FaCommentDots />,
  settings: <FaKey />,
  request: <FaHandPaper />,
};

const TAB_LABELS: Record<TabType, string> = {
  about: 'About',
  songs: 'Songbook',
  noticeboard: 'Notice Board',
  officials: 'Officials',
  activities: 'Activities',
  members: 'Members',
  channels: 'Channels',
  tshirts: 'T-Shirts',
  suggestions: 'Suggestions',
  settings: 'Settings',
  request: 'Request',
};

const DEFAULT_TAB_ORDER: TabType[] = ['about', 'noticeboard', 'officials', 'activities', 'members', 'channels', 'tshirts', 'suggestions'];


const GROUP_ROLES_BY_MODULE: Record<string, string[]> = {
  choir: ['choir_chairperson', 'choir_vice_chair', 'choir_vice_secretary', 'choir_secretary', 'choir_treasurer', 'choir_project_coordinator', 'choir_male_representative', 'choir_female_representative'],
  dancers: ['dance_chair', 'dance_vice_chair'],
  charismatic: ['charismatic_chair', 'charismatic_vice_chair'],
  'st-francis': ['st_francis_chair', 'st_francis_vice_chair', 'st_francis_secretary', 'st_francis_treasurer'],
  mentorship: ['mentorship_chair', 'mentorship_vice_chair'],
};

const CommunityDetail: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getModuleById } = useCommunityData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('about');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const moduleIdClean = moduleId ? moduleId.toLowerCase().replace(/[^a-z0-9-]/g, '-') : '';

  const contextFallback = moduleIdClean ? getModuleById(moduleIdClean) : undefined;

  const { data: serverModuleData, isLoading } = useQuery({
    queryKey: ['community', moduleIdClean],
    queryFn: async () => {
      const res = await apiClient.get(`/community-view/${moduleIdClean}`);
      if (res.data?.isMissing || res.data?.isServerError) throw new Error('Not available');
      return res.data;
    },
    initialData: () => contextFallback,
    retry: 1,
    staleTime: 300000,
  });

  const moduleData: CommunityModule | undefined = serverModuleData || contextFallback;

  const detailColor = MINISTRY_COLORS[moduleIdClean || ''] || moduleData?.color || '#7c2d12';

  const isGlobalAdmin = user?.role === 'admin' || (Array.isArray(user?.role) && user.role.includes('admin'));
  const groupRoles = moduleIdClean ? (GROUP_ROLES_BY_MODULE[moduleIdClean] || []) : [];
  const userRoles = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];
  const isGroupOfficial = groupRoles.length > 0 && userRoles.some(r => groupRoles.includes(r));
  // Query user's enrolled communities to verify membership in this specific module
  const { data: myCommunities = [] } = useQuery<any[]>({
    queryKey: ['my-communities', user?.email, user?.member_id],
    queryFn: async () => {
      const res = await apiClient.get('/community-enrollment/my-communities');
      return res.data?.communities || [];
    },
    enabled: !!user,
    staleTime: 60000,
  });

  const isEnrolledMember = Array.isArray(myCommunities) && myCommunities.some(
    (c: any) =>
      c.module_id === moduleIdClean &&
      (c.status || '').toLowerCase() === 'approved'
  );

  // Consider user a member if they are a group official, global admin, or verified approved enrolled member
  const isMember = isGlobalAdmin || isGroupOfficial || isEnrolledMember;
  const isAdmin = isGlobalAdmin || isGroupOfficial;

  const setTabWithUrl = (tab: TabType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const tabOrder: TabType[] = moduleIdClean === 'choir'
    ? ['about', 'songs', 'noticeboard', 'officials', 'activities', 'members', 'channels', 'tshirts', 'suggestions']
    : DEFAULT_TAB_ORDER;

  // Sync activeTab with URL query parameter (e.g. ?tab=members)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as TabType;
    if (tabParam && (tabOrder.includes(tabParam) || tabParam === 'settings' || tabParam === 'request')) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);


  const renderTabContent = () => {
    if (!moduleData) return null;

    switch (activeTab) {
      case 'about':
        return <CommunityAboutTab module={moduleData} color={detailColor} onNavigateBack={() => navigate('/community')} onQuickLink={(tab) => setTabWithUrl(tab)} />;
      case 'songs':
        return <CommunitySongsTab moduleId={moduleIdClean} color={detailColor} />;
      case 'noticeboard':
        return <CommunityNoticeBoardTab module={moduleData} color={detailColor} />;
      case 'officials':
        return <CommunityOfficialsTab module={moduleData} color={detailColor} isAdmin={isAdmin} />;
      case 'members':
        return <CommunityMembersTab moduleId={moduleIdClean} moduleName={moduleData.title} color={detailColor} isAdmin={isAdmin} />;
      case 'activities':
        return <CommunityActivitiesTab moduleId={moduleIdClean} color={detailColor} module={moduleData} />;
      case 'channels':
        return <CommunityChannelsTab moduleId={moduleIdClean} module={moduleData} color={detailColor} isMember={isMember} />;
      case 'tshirts':
        return <CommunityTshirtsTab moduleId={moduleIdClean} moduleName={moduleData.title} color={detailColor} />;
      case 'suggestions':
        return <CommunitySuggestionsTab moduleId={moduleIdClean} moduleName={moduleData.title} color={detailColor} module={moduleData} />;
      case 'settings':
        return <CommunitySettingsTab moduleId={moduleIdClean} module={moduleData} color={detailColor} isAdmin={isAdmin} />;
      case 'request':
        return <CommunityRequestTab moduleId={moduleIdClean} moduleName={moduleData.title} color={detailColor} module={moduleData} />;
      default:
        return null;
    }
  };

  if (!moduleData && isLoading) {
    return (
      <div className="detail-page" style={{ '--jumuiya-color': detailColor } as React.CSSProperties}>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/60">Loading ministry…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="detail-page" style={{ '--jumuiya-color': detailColor } as React.CSSProperties}>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-8 rounded-3xl shadow-xl max-w-md" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${detailColor}, black 15%), color-mix(in srgb, ${detailColor}, black 25%))`, border: `1px solid color-mix(in srgb, ${detailColor}, transparent 60%)` }}>
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white mb-4" style={{ background: `rgba(255, 255, 255, 0.15)` }}>
              <FaInfoCircle size={28} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Ministry Not Found</h2>
            <p className="text-white/70 mb-6 text-sm">We could not find the community ministry you are looking for.</p>
            <button
              onClick={() => navigate('/community')}
              className="px-6 py-3 text-white rounded-2xl font-bold text-sm cursor-pointer transition-all hover:scale-[1.02] shadow-lg"
              style={{ background: `rgba(255, 255, 255, 0.2)`, border: `1px solid rgba(255, 255, 255, 0.15)` }}
            >
              <FaArrowLeft style={{ marginRight: '8px' }} /> Back to Community
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeIndex = tabOrder.indexOf(activeTab);

  return (
    <div
      className="detail-page"
      style={{
        '--jumuiya-color': detailColor,
        '--jumuiya-color-light': `${detailColor}20`,
        '--jumuiya-color-medium': `${detailColor}50`,
        '--jumuiya-color-dark': `${detailColor}dd`,
        '--bg-soft': '#f0f0f0',
      } as React.CSSProperties}
    >
      {/* Mobile Menu Toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle menu"
      >
        <FaBars />
      </button>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div
          className="sidebar-header relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${detailColor} 0%, ${detailColor}ee 40%, ${detailColor}cc 100%)`,
          }}
        >
          <div
            className="sidebar-icon relative z-10"
            style={{
              color: 'white',
              backgroundImage: `url(${moduleData.saint_image_url || moduleData.image_url || COMMUNITY_IMAGES[moduleIdClean] || DEFAULT_COMMUNITY_IMAGE})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: '3px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}
          />
          <h2 className="sidebar-title text-white drop-shadow-md relative z-10">{moduleData.title}</h2>
        </div>

        <nav className="sidebar-nav">
          {tabOrder.map((tabId, idx) => {
            const isActive = activeTab === tabId;
            return (
              <button
                key={tabId}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setTabWithUrl(tabId);
                  setIsSidebarOpen(false);
                }}
                style={isActive ? {
                  borderLeftColor: 'white',
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                } : {}}
              >
                <span
                  className="nav-icon"
                  style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.65)' }}
                >
                  {TAB_ICONS[tabId]}
                </span>
                <span className="nav-label">{TAB_LABELS[tabId]}</span>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full transition-all duration-300"
                    style={{ background: 'white' }}
                  />
                )}
              </button>
            );
          })}
          {isAdmin && (
            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => {
                setTabWithUrl('settings');
                setIsSidebarOpen(false);
              }}
              style={activeTab === 'settings' ? {
                borderLeftColor: 'white',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
              } : {}}
            >
              <span
                className="nav-icon"
                style={{ color: activeTab === 'settings' ? 'white' : 'rgba(255,255,255,0.65)' }}
              >
                {TAB_ICONS.settings}
              </span>
              <span className="nav-label">{TAB_LABELS.settings}</span>
              {activeTab === 'settings' && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full transition-all duration-300"
                  style={{ background: 'white' }}
                />
              )}
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
            <button
              className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg cursor-pointer mb-2"
              style={{ background: detailColor }}
              onClick={() => navigate(`/community/${moduleIdClean}/join`)}
            >
              <FaUserPlus size={14} /> Join This Community
            </button>
          <button
            className="btn-premium"
            onClick={() => navigate('/community')}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <FaArrowLeft style={{ marginRight: '8px' }} /> All Ministries
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content" style={{
        background: `linear-gradient(180deg, ${detailColor}06 0%, ${detailColor}03 300px, var(--bg-soft) 600px)`,
      }}>
        {/* Color accent top bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${detailColor}, ${detailColor}88, ${detailColor})` }} />

        <div className="content-wrapper animate-fade-in" key={activeTab}>
          {renderTabContent()}
        </div>
      </main>

      {isNotifOpen && (
        <div className="notif-panel-floating animate-slide-up">
          <div className="notif-panel-header" style={{ borderBottomColor: detailColor }}>
            <h3>Ministry Updates</h3>
            <button className="close-panel" onClick={() => setIsNotifOpen(false)}>
              <FaTimes />
            </button>
          </div>
          <div className="notif-panel-content">
            <CommunityNotificationsTab module={moduleData} color={detailColor} />
          </div>
        </div>
      )}


      {/* Overlay for mobile */}
      {(isSidebarOpen || (isNotifOpen && window.innerWidth < 768)) && (
        <div
          className="sidebar-overlay"
          onClick={() => {
            setIsSidebarOpen(false);
            setIsNotifOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default CommunityDetail;
