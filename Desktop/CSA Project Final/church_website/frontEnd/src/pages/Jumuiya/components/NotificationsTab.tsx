import React from 'react';
import type { Notification } from '../data/jumuiyaData';
import { FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaExclamationCircle, FaBellSlash } from 'react-icons/fa';
import './TabsSystem.css';

interface NotificationsTabProps {
    notifications: Notification[];
    jumuiyaColor: string;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ notifications, jumuiyaColor }) => {
    const sortedNotifications = [...notifications].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'info': return <FaInfoCircle />;
            case 'warning': return <FaExclamationTriangle />;
            case 'success': return <FaCheckCircle />;
            case 'urgent': return <FaExclamationCircle />;
            default: return <FaInfoCircle />;
        }
    };

    const getTypeColor = (type: Notification['type']) => {
        switch (type) {
            case 'info': return 'var(--info)';
            case 'warning': return 'var(--warning)';
            case 'success': return 'var(--success)';
            case 'urgent': return 'var(--urgent)';
            default: return 'var(--info)';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="tab-system-content" style={{ '--jumuiya-color': jumuiyaColor } as React.CSSProperties}>
            <div className="tab-header-wrap">
                <div className="header-text">
                    <h1 className="page-title">Community Updates</h1>
                    <p className="page-description">Stay informed about the latest happenings and important announcements in our Jumuiya.</p>
                </div>
                <div className="badge success">{notifications.length} Announcements</div>
            </div>

            {notifications.length === 0 ? (
                <div className="empty-tab-state glass-card">
                    <FaBellSlash className="empty-icon" />
                    <h3>No notifications yet</h3>
                    <p>When there are new updates, they will appear here.</p>
                </div>
            ) : (
                <div className="tab-grid">
                    {sortedNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className="tab-card notif-card animate-fade"
                            style={{ '--notif-color': getTypeColor(notification.type) } as React.CSSProperties}
                        >
                            <div className="notif-icon-wrap">
                                {getIcon(notification.type)}
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{notification.title}</h3>
                            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                                {notification.message}
                            </p>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: '12px',
                                borderTop: '1px solid var(--border-light)',
                                fontSize: '0.8rem',
                                color: 'var(--text-muted)',
                                fontWeight: 500
                            }}>
                                <span>{formatDate(notification.date)}</span>
                                <span className="badge info" style={{ fontSize: '0.65rem' }}>{notification.postedBy}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsTab;
