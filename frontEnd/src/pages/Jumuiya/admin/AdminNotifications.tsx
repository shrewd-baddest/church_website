import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { FaTrash, FaPlus, FaBell } from 'react-icons/fa';
import type { Notification } from '../data/jumuiyaData';

interface AdminNotificationsProps {
    selectedId: string;
}

const AdminNotifications: React.FC<AdminNotificationsProps> = ({ selectedId }) => {
    const { jumuiyaList, updateJumuiya } = useData();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<Notification['type']>('info');
    
    const selectedJumuiya = jumuiyaList.find(j => j.id === selectedId);
    const notifications = selectedJumuiya?.notifications || [];

    const handleAddNotification = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && message.trim() && selectedJumuiya) {
            const updatedNotifications: Notification[] = [
                {
                    id: Date.now().toString(),
                    title,
                    message,
                    type,
                    date: new Date().toISOString(),
                    postedBy: 'Admin' // Default for now
                },
                ...notifications
            ];
            updateJumuiya(selectedId, { notifications: updatedNotifications });
            setTitle('');
            setMessage('');
            setType('info');
        }
    };

    const handleDeleteNotification = (id: string) => {
        if (window.confirm('Delete this notification?') && selectedJumuiya) {
            const updatedNotifications = notifications.filter(n => n.id !== id);
            updateJumuiya(selectedId, { notifications: updatedNotifications });
        }
    };

    return (
        <div className="admin-notifications-manage" style={{ '--admin-theme-color': selectedJumuiya?.color } as React.CSSProperties}>
            <div className="admin-card">
                <h2 style={{ marginBottom: '24px' }}>Manage Notifications</h2>

                <form onSubmit={handleAddNotification} style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Announcement title..."
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                            required
                        />
                    </div>
                    
                    <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>Message</label>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Details..."
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', height: '100%' }}
                            >
                                <option value="info">Info</option>
                                <option value="success">Success</option>
                                <option value="warning">Warning</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', alignSelf: 'flex-end' }}>
                        <FaPlus /> Post Announcement
                    </button>
                </form>

                <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {notifications.length > 0 ? (
                        notifications.map((notif) => (
                            <div key={notif.id} className="glass-card" style={{ 
                                padding: '16px', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                borderLeft: `4px solid ${notif.type === 'urgent' ? '#ef4444' : notif.type === 'warning' ? '#f59e0b' : notif.type === 'success' ? '#10b981' : 'var(--jumuiya-color)'}`
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <FaBell style={{ color: 'var(--jumuiya-color)', fontSize: '0.8rem' }} />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            {new Date(notif.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span className={`badge ${notif.type}`} style={{ fontSize: '0.65rem' }}>{notif.type.toUpperCase()}</span>
                                    </div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{notif.title}</h4>
                                    <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{notif.message}</p>
                                </div>
                                <button 
                                    onClick={() => handleDeleteNotification(notif.id)}
                                    style={{ 
                                        background: 'rgba(239, 68, 68, 0.1)', 
                                        color: '#ef4444', 
                                        border: 'none', 
                                        padding: '8px', 
                                        borderRadius: '8px', 
                                        cursor: 'pointer',
                                        marginLeft: '16px'
                                    }}
                                    title="Delete notification"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No notifications posted yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminNotifications;
