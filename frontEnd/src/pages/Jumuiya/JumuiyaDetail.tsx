import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from './context/DataContext';
import AboutTab from './components/AboutTab';
import OfficialsTab from './components/OfficialsTab';
import MembersTab from './components/MembersTab';
import ActivitiesTab from './components/ActivitiesTab';
import RegistrationTab from './components/RegistrationTab';
import StampCard from './components/StampCard';
import ChannelsTab from './components/ChannelsTab';
import NotificationsTab from './components/NotificationsTab';
import TshirtsTab from './components/TshirtsTab';
import SettingsTab from './components/SettingsTab';
import { FaInfoCircle, FaUserTie, FaUsers, FaCalendarAlt, FaUserPlus, FaShareAlt, FaBars, FaBell, FaTshirt, FaArrowLeft, FaCog, FaKey, FaStamp } from "react-icons/fa";
import { useAuth } from '../../context/AuthContext';
import { useJumuiyaOfficials } from '../../hooks/useJumuiyaOfficials';
import { useTerms } from '../../hooks/useTerms';
import AdminPanelEmbed from './admin/AdminPanelEmbed';
import { FaTimes } from 'react-icons/fa';
import './JumuiyaDetail.css';

type TabType = 'about' | 'officials' | 'registration' | 'channels' | 'members' | 'activities' | 'tshirts' | 'allocations' | 'admin' | 'settings';

const JumuiyaDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('about');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { getJumuiyaById } = useData();
    const { user } = useAuth();
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [hasNewNotif, setHasNewNotif] = useState(true); // Initial state for demo
    const isAdmin = user?.role === 'admin';

    const jumuiyaId = id ? id.toLowerCase().replace(/[^a-z0-9]/g, '-') : '';
    const jumuiya = getJumuiyaById(jumuiyaId);
    const isMemberOfThisJumuiya = !!(user?.jumuiya_id && jumuiya?.group_id && user.jumuiya_id === jumuiya.group_id);

    // Fetch dynamic officials from backend
    const { officials: dynamicOfficials } = useJumuiyaOfficials({ category: jumuiya?.name });
    const { currentTerm } = useTerms();

    // Derive term info dynamically
    const dynamicTerm = (() => {
        // Preference 1: Explicitly set term in the first official's record from backend
        const recordWithTerm = dynamicOfficials?.find(o => !!o.term_of_service);
        if (recordWithTerm?.term_of_service) {
            const parts = recordWithTerm.term_of_service.split('-').map(p => p.trim());
            const startYear = Number(parts[0]);
            const endYear = Number(parts[1]);
            if (!Number.isNaN(startYear) && !Number.isNaN(endYear)) {
                return { startYear, endYear };
            }
        }
        // Preference 2: Use the global current term from backend
        if (currentTerm?.year) {
            const parts = currentTerm.year.split('-').map(p => p.trim());
            const startYear = Number(parts[0]);
            const endYear = Number(parts[1]);
            if (!Number.isNaN(startYear) && !Number.isNaN(endYear)) {
                return { startYear, endYear };
            }
        }
        // Fallback: use the stored term if available
        return jumuiya?.termOfOffice;
    })();

    // officials to display
    const displayedOfficials = useMemo(() => {
        if (dynamicOfficials && dynamicOfficials.length > 0) {
            return dynamicOfficials.map(doff => ({
                id: String(doff.id),
                name: doff.name,
                position: doff.position,
                email: '',
                phone: doff.contact || '',
                image: doff.photo ? (doff.photo.startsWith('http') ? doff.photo : `${window.location.origin}/${doff.photo}`) : undefined
            }));
        }

        // Generate placeholders using Patron Saint image
        return [
            {
                id: 'p1',
                name: 'Awaiting Upload',
                position: 'Chairperson',
                email: '',
                phone: '',
                image: jumuiya?.saintImage
            },
            {
                id: 'p2',
                name: 'Awaiting Upload',
                position: 'Secretary',
                email: '',
                phone: '',
                image: jumuiya?.saintImage
            },
            {
                id: 'p3',
                name: 'Awaiting Upload',
                position: 'Treasurer',
                email: '',
                phone: '',
                image: jumuiya?.saintImage
            }
        ];
    }, [dynamicOfficials, jumuiya?.saintImage]);

    if (!jumuiya) {
        return (
            <div className="error-page">
                <div className="container">
                    <h1>Jumuiya Not Found</h1>
                    <p>The requested Jumuiya could not be found.</p>
                    <button className="btn-premium primary" onClick={() => navigate('/jumuiya')} style={{ margin: '0 auto' }}>
                        <FaArrowLeft style={{ marginRight: '8px' }} /> Back to Jumuiyas
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'about' as TabType, label: 'About', icon: <FaInfoCircle /> },
        { id: 'officials' as TabType, label: 'Officials', icon: <FaUserTie /> },
        ...(isMemberOfThisJumuiya ? [
          { id: 'members' as TabType, label: 'Members', icon: <FaUsers /> },
          { id: 'registration' as TabType, label: 'Registration', icon: <FaUserPlus /> },
          { id: 'stampcard' as TabType, label: 'Stamp Card', icon: <FaStamp /> },
        ] : []),
        { id: 'activities' as TabType, label: 'Activities', icon: <FaCalendarAlt /> },
        { id: 'channels' as TabType, label: 'Channels', icon: <FaShareAlt /> },
        { id: 'tshirts' as TabType, label: 'T-Shirts', icon: <FaTshirt /> },
        ...(isAdmin ? [{ id: 'admin' as TabType, label: 'Admin', icon: <FaCog className="animate-spin-slow" /> }] : []),
        ...(user ? [{ id: 'settings' as TabType, label: 'Settings', icon: <FaKey /> }] : []),
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'about':
                return <AboutTab jumuiya={jumuiya} onNavigateBack={() => navigate('/jumuiya')} />;
            case 'officials':
                return <OfficialsTab
                    officials={displayedOfficials}
                    termOfOffice={dynamicTerm}
                    formerOfficials={jumuiya.formerOfficials}
                    jumuiyaColor={detailColor}
                    isAdmin={isAdmin} jumuiyaName={''}                />;
            case 'members':
                return <MembersTab jumuiyaName={jumuiya.name} jumuiyaColor={detailColor} jumuiyaId={jumuiya.group_id || jumuiya.id} />
            case 'registration':
                return <RegistrationTab jumuiyaName={jumuiya.name} jumuiyaId={jumuiya.group_id || jumuiya.id} jumuiyaColor={detailColor} />;
            case 'activities':
                return <ActivitiesTab jumuiyaColor={detailColor} />;
            case 'channels':
                return <ChannelsTab socialMedia={jumuiya.socialMedia || []} gallery={jumuiya.gallery} />;
            case 'tshirts':
                return <TshirtsTab jumuiyaId={jumuiya.id} jumuiyaColor={detailColor} orders={jumuiya.tshirtOrders || []} jumuiyaName={''} />;
            case 'settings':
                return <SettingsTab jumuiyaColor={detailColor} />;
            case 'stampcard':
                return <StampCard jumuiyaId={jumuiya.group_id || jumuiya.id} jumuiyaName={jumuiya.name} jumuiyaColor={detailColor} />;
            case 'admin':
                return <AdminPanelEmbed jumuiya={jumuiya} />;
            default:
                return null;
        }
    };

    useEffect(() => {
      if (!isMemberOfThisJumuiya && (activeTab === 'members' || activeTab === 'registration' || activeTab === 'stampcard')) {
        setActiveTab('about');
      }
    }, [isMemberOfThisJumuiya]);

    const detailColor = jumuiya.color || '#2c3e50';

    return (
        <div
            className="detail-page"
            style={{
                '--jumuiya-color': detailColor,
                '--jumuiya-color-light': `${detailColor}20`,
                '--jumuiya-color-medium': `${detailColor}50`,
                '--jumuiya-color-dark': `${detailColor}dd`,
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
                <div className="sidebar-header">
                    <div
                        className="sidebar-icon"
                        style={{
                            color: 'blue',
                            backgroundImage: `url(${jumuiya.saintImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                    >
                    </div>
                    <h2 className="sidebar-title">{jumuiya.name}</h2>
                </div>

                <nav className="sidebar-nav">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setIsSidebarOpen(false);
                            }}
                            style={activeTab === tab.id ? {
                                borderLeftColor: jumuiya.color,
                                color: jumuiya.color,
                                background: `linear-gradient(90deg, ${jumuiya.color}10 0%, transparent 100%)`
                            } : {}}
                        >
                            <span className="nav-icon" style={activeTab === tab.id ? { color: jumuiya.color } : {}}>{tab.icon}</span>
                            <span className="nav-label">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="btn-premium"
                        onClick={() => navigate('/jumuiya')}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        <FaArrowLeft style={{ marginRight: '8px' }} /> All Jumuiyas
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <div className="content-wrapper animate-fade-in">
                    {renderTabContent()}
                </div>
            </main>

            {/* Notification FAB */}
            <div className="notif-fab-container">
                <button 
                    className={`notif-fab ${isNotifOpen ? 'active' : ''}`}
                    onClick={() => {
                        setIsNotifOpen(!isNotifOpen);
                        setHasNewNotif(false);
                    }}
                    style={{ backgroundColor: jumuiya.color }}
                    aria-label="Notifications"
                >
                    {isNotifOpen ? <FaTimes /> : <FaBell />}
                    {!isNotifOpen && hasNewNotif && <span className="notif-badge-pulsing" />}
                </button>

                {isNotifOpen && (
                    <div className="notif-panel-floating animate-slide-up">
                        <div className="notif-panel-header" style={{ borderBottomColor: jumuiya.color }}>
                            <h3>Community Updates</h3>
                            <button className="close-panel" onClick={() => setIsNotifOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="notif-panel-content">
                            <NotificationsTab notifications={jumuiya.notifications || []} jumuiyaColor={detailColor} />
                        </div>
                    </div>
                )}
            </div>

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

export default JumuiyaDetail;
