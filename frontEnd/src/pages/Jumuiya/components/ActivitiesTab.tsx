import React, { useState, useEffect } from 'react';
import { FaPray, FaHandHoldingHeart, FaBook, FaFire, FaUsers, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaHistory } from "react-icons/fa";
import './TabsSystem.css';

interface ActivitiesTabProps {
    jumuiyaColor: string;
}

interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
}

const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ jumuiyaColor }) => {
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

    const allActivities = [
        {
            id: 1,
            title: 'Weekly Prayer Meeting',
            date: '2026-02-25',
            time: '6:00 PM - 8:00 PM',
            location: 'Parish Hall',
            type: 'Prayer',
            description: 'Join us for our weekly prayer and fellowship session.'
        },
        {
            id: 2,
            title: 'Community Outreach',
            date: '2026-03-02',
            time: '9:00 AM - 3:00 PM',
            location: 'Local Community Center',
            type: 'Service',
            description: 'Reaching out to the less fortunate in our community.'
        },
        {
            id: 3,
            title: 'Bible Study Session',
            date: '2026-03-05',
            time: '5:30 PM - 7:30 PM',
            location: 'Parish Library',
            type: 'Study',
            description: 'Deep dive into Scripture and faith discussions.'
        },
        {
            id: 4,
            title: 'Youth Retreat',
            date: '2026-03-15',
            time: 'All Day',
            location: 'Retreat Center',
            type: 'Retreat',
            description: 'Spiritual renewal retreat for young members.'
        },
        {
            id: 5,
            title: 'Charity Drive',
            date: '2026-03-22',
            time: '10:00 AM - 2:00 PM',
            location: 'Parish Grounds',
            type: 'Service',
            description: 'Collecting donations for the needy in our community.'
        },
    ];

    const getActivityTypeDetails = (type: string) => {
        const details: Record<string, { color: string; icon: React.ReactNode }> = {
            'Prayer': { color: '#9333ea', icon: <FaPray /> },
            'Service': { color: '#16a34a', icon: <FaHandHoldingHeart /> },
            'Study': { color: '#2563eb', icon: <FaBook /> },
            'Retreat': { color: '#dc2626', icon: <FaFire /> },
            'Fellowship': { color: '#f59e0b', icon: <FaUsers /> }
        };
        return details[type] || { color: '#6b7280', icon: <FaCalendarAlt /> };
    };

    const sortedActivities = [...allActivities].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const today = new Date().toISOString().split('T')[0];
    const upcomingActivities = sortedActivities.filter(a => a.date >= today);
    const featuredActivity = upcomingActivities.length > 0 ? upcomingActivities[0] : null;

    useEffect(() => {
        if (!featuredActivity) return;

        const calculateTimeRemaining = () => {
            const eventDate = new Date(featuredActivity.date).getTime();
            const now = new Date().getTime();
            const difference = eventDate - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeRemaining({ days, hours, minutes, seconds, total: difference });
            } else {
                setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
            }
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000);
        return () => clearInterval(interval);
    }, [featuredActivity]);

    return (
        <div className="tab-system-content" style={{ '--jumuiya-color': jumuiyaColor } as React.CSSProperties}>
            <div className="tab-header-wrap">
                <div className="header-text">
                    <h1 className="page-title">Jumuiya Activities</h1>
                    <p className="page-description">Join us in our upcoming spiritual gatherings, service missions, and community events.</p>
                </div>
            </div>

            {featuredActivity && (
                <div className="animate-fade" style={{ marginBottom: 'var(--space-3xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ width: '40px', height: '1px', background: 'var(--jumuiya-color)' }}></div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--jumuiya-color)', letterSpacing: '1px' }}>Next Big Event</span>
                    </div>

                    <div className="tab-card glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-2xl)', padding: 'var(--space-2xl)' }}>
                        <div>
                            <div className="badge info" style={{ marginBottom: '16px', background: `${getActivityTypeDetails(featuredActivity.type).color}15`, color: getActivityTypeDetails(featuredActivity.type).color }}>
                                {getActivityTypeDetails(featuredActivity.type).icon} <span style={{ marginLeft: '6px' }}>{featuredActivity.type}</span>
                            </div>
                            <h2 style={{ fontSize: '2.25rem', marginBottom: '16px', lineHeight: '1.1' }}>{featuredActivity.title}</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '1.1rem' }}>{featuredActivity.description}</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                                    <FaCalendarAlt style={{ color: 'var(--jumuiya-color)' }} />
                                    <span>{new Date(featuredActivity.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                                    <FaClock style={{ color: 'var(--jumuiya-color)' }} />
                                    <span>{featuredActivity.time}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                                    <FaMapMarkerAlt style={{ color: 'var(--jumuiya-color)' }} />
                                    <span>{featuredActivity.location}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '24px', background: 'var(--bg-soft)', borderRadius: 'var(--rm)', padding: 'var(--space-xl)' }}>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--jumuiya-color)', lineHeight: '1' }}>{timeRemaining?.days || 0}</div>
                                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, marginTop: '4px', opacity: 0.6 }}>Days</div>
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 300, opacity: 0.3 }}>:</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--jumuiya-color)', lineHeight: '1' }}>{String(timeRemaining?.hours || 0).padStart(2, '0')}</div>
                                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, marginTop: '4px', opacity: 0.6 }}>Hrs</div>
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 300, opacity: 0.3 }}>:</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--jumuiya-color)', lineHeight: '1' }}>{String(timeRemaining?.minutes || 0).padStart(2, '0')}</div>
                                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, marginTop: '4px', opacity: 0.6 }}>Min</div>
                                </div>
                            </div>
                            <div className="activity-date-badge" style={{ transform: 'scale(1.5)' }}>
                                <div className="date-month" style={{ background: 'var(--jumuiya-color)' }}>{new Date(featuredActivity.date).toLocaleString('default', { month: 'short' })}</div>
                                <div className="date-day">{new Date(featuredActivity.date).getDate()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="animate-fade">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', opacity: 0.6 }}>
                    <FaHistory />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Timeline of Events</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                <div className="activity-carousel">
                    {sortedActivities.map((activity) => {
                        const { color, icon } = getActivityTypeDetails(activity.type);
                        const isPast = new Date(activity.date) < new Date(today);

                        return (
                            <div key={activity.id} className="tab-card activity-card-premium" style={{ opacity: isPast ? 0.6 : 1, borderTop: `4px solid ${color}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div className="activity-date-badge">
                                        <div className="date-month" style={{ background: color }}>{new Date(activity.date).toLocaleString('default', { month: 'short' })}</div>
                                        <div className="date-day">{new Date(activity.date).getDate()}</div>
                                    </div>
                                    <div className="badge" style={{ background: `${color}15`, color: color }}>
                                        {icon}
                                    </div>
                                </div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{activity.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px', flex: 1 }}>{activity.description}</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaClock /> {activity.time}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><FaMapMarkerAlt /> {activity.location}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ActivitiesTab;
