import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from './context/DataContext';
import AboutTab from './components/AboutTab';
import OfficialsTab from './components/OfficialsTab';
import MembersTab from './components/MembersTab';
import ActivitiesTab from './components/ActivitiesTab';
import RegistrationTab from './components/RegistrationTab';
import ChannelsTab from './components/ChannelsTab';
import NotificationsTab from './components/NotificationsTab';
import TshirtsTab from './components/TshirtsTab';
import { FaInfoCircle, FaUserTie, FaUsers, FaCalendarAlt, FaUserPlus, FaShareAlt, FaBars, FaBell, FaTshirt, FaArrowLeft, FaCog } from "react-icons/fa";
import { useAuth } from '../../context/AuthContext';
import { useJumuiyaOfficials } from '../../hooks/useJumuiyaOfficials';
import { useTerms } from '../../hooks/useTerms';
import './JumuiyaDetail.css';
import AdminPanelEmbed from './admin/AdminPanelEmbed';
import { FaTimes } from 'react-icons/fa';

type TabType = 'about' | 'officials' | 'registration' | 'channels' | 'members' | 'activities' | 'tshirts' | 'admin';

const JumuiyaDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('about');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { getJumuiyaById } = useData();
    const { } = useAuth();
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [hasNewNotif, setHasNewNotif] = useState(true); // Initial state for demo
    const isAdmin = true; // Hardcoded to true for development purposes as requested

    // The ID in the data is 'st-anthony', but the URL might be /jumuiya/st-anthony
    // The previous getJumuiyaByName handled some normalization. Let's assume the URL param matches the ID for now, 
    // or replicate the simple logic if needed. 
    // DataContext's getJumuiyaById expects the exact ID.
    // Let's stick to the previous logic of normalizing if needed, but the data IDs are 'st-anthony', 'st-augustine' etc.

    // Helper to find by fuzzy name if needed, or just strict ID.
    // The previous getJumuiyaByName did: jumuiyaList.find(j => j.id === name.toLowerCase().replace(/\s+/g, '-'));
    // Let's implement that simple logic here using the list if we had it, or just pass the transformed name to getById

    const jumuiyaId = id ? id.toLowerCase().replace(/[^a-z0-9]/g, '-') : '';
    const jumuiya = getJumuiyaById(jumuiyaId);

    // Fetch dynamic officials from backend
    const { officials: dynamicOfficials } = useJumuiyaOfficials({ category: jumuiya?.name });
    const { currentTerm } = useTerms();

    // Derive term info dynamically
    const dynamicTerm = (() => {
        // Preference 1: Explicitly set term in the first official's record from backend
        const recordWithTerm = dynamicOfficials?.find(o => !!o.term_of_service);
        if (recordWithTerm?.term_of_service) {
             const parts = recordWithTerm.term_of_service.split('-');
             return { 
                 startYear: parts[0] || recordWithTerm.term_of_service, 
                 endYear: parts[1] || '' 
             };
        }
        // Preference 2: Use the global current term from backend
        if (currentTerm?.year) {
             const parts = currentTerm.year.split('-');
             return { 
                 startYear: parts[0] || currentTerm.year, 
                 endYear: parts[1] || '' 
             };
        }
        // Fallback: use hardcoded if nothing else available
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
                name: 'Pending Election',
                position: 'Chairperson',
                email: '',
                phone: '',
                image: jumuiya?.saintImage
            },
            {
                id: 'p2',
                name: 'Pending Election',
                position: 'Secretary',
                email: '',
                phone: '',
                image: jumuiya?.saintImage
            },
            {
                id: 'p3',
                name: 'Pending Election',
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
                    <button className="btn-premium primary" onClick={() => navigate('/')} style={{ margin: '0 auto' }}>
                        <FaArrowLeft style={{ marginRight: '8px' }} /> Back to Jumuiyas
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'about' as TabType, label: 'About', icon: <FaInfoCircle /> },
        { id: 'officials' as TabType, label: 'Officials', icon: <FaUserTie /> },
        { id: 'members' as TabType, label: 'Members', icon: <FaUsers /> },
        { id: 'registration' as TabType, label: 'Registration', icon: <FaUserPlus /> },
        { id: 'activities' as TabType, label: 'Activities', icon: <FaCalendarAlt /> },
        { id: 'channels' as TabType, label: 'Channels', icon: <FaShareAlt /> },
        { id: 'tshirts' as TabType, label: 'T-Shirts', icon: <FaTshirt /> },
        ...(isAdmin ? [{ id: 'admin' as TabType, label: 'Admin', icon: <FaCog className="animate-spin-slow" /> }] : []),
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'about':
                return <AboutTab jumuiya={jumuiya} onNavigateBack={() => navigate('/')} />;
            case 'officials':

                return <OfficialsTab
                    officials={displayedOfficials}
                    termOfOffice={dynamicTerm}
                    formerOfficials={jumuiya.formerOfficials}
                    jumuiyaColor={jumuiya.color}
                    isAdmin={isAdmin}
                />;
            case 'members':
                return <MembersTab jumuiyaName={jumuiya.name} jumuiyaColor={jumuiya.color} />
            case 'registration':
                return <RegistrationTab jumuiyaName={jumuiya.name} jumuiyaColor={jumuiya.color} />;
            case 'activities':
                return <ActivitiesTab jumuiyaColor={jumuiya.color} />;
            case 'channels':
                return <ChannelsTab socialMedia={jumuiya.socialMedia} gallery={jumuiya.gallery} />;
            case 'tshirts':
                return <TshirtsTab jumuiyaId={jumuiya.id} jumuiyaColor={jumuiya.color} orders={jumuiya.tshirtOrders || []} />;
            case 'admin':
                return <AdminPanelEmbed jumuiya={jumuiya} />;
            default:
                return null;
        }
    };

    return (
        <div
            className="detail-page"
            style={{
                '--jumuiya-color': jumuiya.color,
                '--jumuiya-color-light': `${jumuiya.color}20`,
                '--jumuiya-color-medium': `${jumuiya.color}50`,
                '--jumuiya-color-dark': `${jumuiya.color}dd`,
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
                        onClick={() => navigate('/')}
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
                            <NotificationsTab notifications={jumuiya.notifications || []} jumuiyaColor={jumuiya.color} />
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
