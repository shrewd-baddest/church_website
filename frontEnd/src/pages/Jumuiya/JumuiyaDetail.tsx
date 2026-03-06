import React, { useState } from 'react';
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
import { FaInfoCircle, FaUserTie, FaUsers, FaCalendarAlt, FaUserPlus, FaShareAlt, FaBars, FaBell, FaTshirt, FaArrowLeft } from "react-icons/fa";
import './JumuiyaDetail.css';

type TabType = 'about' | 'officials' | 'registration' | 'channels' | 'members' | 'activities' | 'notifications' | 'tshirts';

const JumuiyaDetail: React.FC = () => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('about');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { getJumuiyaById } = useData();

    // The ID in the data is 'st-anthony', but the URL might be /jumuiya/st-anthony
    // The previous getJumuiyaByName handled some normalization. Let's assume the URL param matches the ID for now, 
    // or replicate the simple logic if needed. 
    // DataContext's getJumuiyaById expects the exact ID.
    // Let's stick to the previous logic of normalizing if needed, but the data IDs are 'st-anthony', 'st-augustine' etc.

    // Helper to find by fuzzy name if needed, or just strict ID.
    // The previous getJumuiyaByName did: jumuiyaList.find(j => j.id === name.toLowerCase().replace(/\s+/g, '-'));
    // Let's implement that simple logic here using the list if we had it, or just pass the transformed name to getById

    const jumuiyaId = name ? name.toLowerCase().replace(/\s+/g, '-') : '';
    const jumuiya = getJumuiyaById(jumuiyaId);

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
        { id: 'notifications' as TabType, label: 'Notifications', icon: <FaBell /> },
        { id: 'tshirts' as TabType, label: 'T-Shirts', icon: <FaTshirt /> },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'about':
                return <AboutTab jumuiya={jumuiya} onNavigateBack={() => navigate('/')} onNavigateToRegistration={() => setActiveTab('registration')} />;
            case 'officials':
                return <OfficialsTab
                    officials={jumuiya.officials}
                    termOfOffice={jumuiya.termOfOffice}
                    formerOfficials={jumuiya.formerOfficials}
                    jumuiyaColor={jumuiya.color}
                />;
            case 'members':
                return <MembersTab jumuiyaName={jumuiya.name} jumuiyaColor={jumuiya.color} />
            case 'registration':
                return <RegistrationTab jumuiyaName={jumuiya.name} jumuiyaColor={jumuiya.color} />;
            case 'activities':
                return <ActivitiesTab jumuiyaColor={jumuiya.color} />;
            case 'channels':
                return <ChannelsTab socialMedia={jumuiya.socialMedia} gallery={jumuiya.gallery} />;
            case 'notifications':
                return <NotificationsTab notifications={jumuiya.notifications || []} jumuiyaColor={jumuiya.color} />;
            case 'tshirts':
                return <TshirtsTab jumuiyaId={jumuiya.id} jumuiyaColor={jumuiya.color} orders={jumuiya.tshirtOrders || []} />;
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

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default JumuiyaDetail;
