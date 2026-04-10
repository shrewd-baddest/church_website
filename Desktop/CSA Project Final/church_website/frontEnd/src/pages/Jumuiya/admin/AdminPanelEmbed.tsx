import React, { useState } from 'react';
import { FaInfoCircle, FaUserTie, FaUsers, FaCalendarAlt, FaImages, FaBell } from 'react-icons/fa';
import type { JumuiyaData } from '../data/jumuiyaData';
import AdminNotifications from './AdminNotifications';
import AdminAbout from './AdminAbout';
import AdminOfficials from './AdminOfficials';
import AdminMembers from './AdminMembers';
import AdminActivities from './AdminActivities';
import AdminGallery from './AdminGallery';

interface AdminPanelEmbedProps {
    jumuiya: JumuiyaData;
}

type AdminTab = 'notifications' | 'about' | 'officials' | 'members' | 'activities' | 'gallery';

const AdminPanelEmbed: React.FC<AdminPanelEmbedProps> = ({ jumuiya }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('notifications');

    const tabs = [
        { id: 'notifications' as AdminTab, label: 'Notifications', icon: <FaBell /> },
        { id: 'about' as AdminTab, label: 'About', icon: <FaInfoCircle /> },
        { id: 'officials' as AdminTab, label: 'Officials', icon: <FaUserTie /> },
        { id: 'members' as AdminTab, label: 'Members', icon: <FaUsers /> },
        { id: 'activities' as AdminTab, label: 'Activities', icon: <FaCalendarAlt /> },
        { id: 'gallery' as AdminTab, label: 'Gallery', icon: <FaImages /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'notifications':
                return <AdminNotifications selectedId={jumuiya.id} />;
            case 'about':
                return <AdminAbout selectedId={jumuiya.id} />;
            case 'officials':
                return <AdminOfficials selectedId={jumuiya.id} />;
            case 'members':
                return <AdminMembers />;
            case 'activities':
                return <AdminActivities selectedId={jumuiya.id} />;
            case 'gallery':
                return <AdminGallery selectedId={jumuiya.id} />;
            default:
                return <AdminAbout selectedId={jumuiya.id} />;
        }
    };

    return (
        <div className="admin-panel-embed">
            <nav className="admin-embed-tabs" style={{ 
                display: 'flex', 
                gap: '8px', 
                marginBottom: '24px', 
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '12px',
                overflowX: 'auto',
                scrollbarWidth: 'none'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeTab === tab.id ? 'var(--jumuiya-color)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </nav>

            <div className="admin-embed-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminPanelEmbed;
