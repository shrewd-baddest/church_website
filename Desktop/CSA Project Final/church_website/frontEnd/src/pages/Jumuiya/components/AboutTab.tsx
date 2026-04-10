import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import type { JumuiyaData } from '../data/jumuiyaData';
import { FaCalendarDay, FaClock, FaMapMarkerAlt, FaSignInAlt, FaUserShield, FaFilePdf } from 'react-icons/fa';
import './TabsSystem.css';

interface AboutTabProps {
    jumuiya: JumuiyaData;
    onNavigateBack: () => void;
}

const AboutTab: React.FC<AboutTabProps> = ({ jumuiya }) => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    const handleLoginClick = () => {
        navigate('/admin/officials'); // Navigate directly to the admin dashboard. ProtectedRoute will handle redirecting to login if needed.
    };

    const handleAdminLogin = () => {
        navigate('/admin/AdminLayout');
    };

    return (
        <div className="tab-system-content" style={{ '--jumuiya-color': jumuiya.color } as React.CSSProperties}>
            {/* Header with Login button */}
            <div className="tab-header-wrap animate-fade">
                <div /> {/* Spacer for flex-between if needed, or just let login follow flow */}
                <button
                    className="btn-premium"
                    onClick={handleAdminLogin}
                    style={{ background: 'var(--bg-soft)', color: 'var(--text-secondary)' }}
                >
                    {isAuthenticated ? <><FaUserShield /> Admin Panel ({user?.username})</> : <><FaSignInAlt /> Official Login</>}
                </button>
            </div>

            {/* Main Content */}
            <div className="animate-fade">
                <h1 className="page-title">{jumuiya.fullName}</h1>
                <p className="page-description">{jumuiya.description}</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-2xl)', marginTop: 'var(--space-2xl)' }}>
                    <div className="tab-card glass-card">
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{jumuiya.name} Story</h2>
                        <div style={{ lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                            <p>{jumuiya.about}</p>
                        </div>
                        {jumuiya.historyPdf && (
                            <button
                                className="btn-premium"
                                onClick={() => window.open(jumuiya.historyPdf, '_blank')}
                                style={{ marginTop: '24px', background: 'var(--bg-soft)', color: 'var(--text-primary)', width: '100%', justifyContent: 'center' }}
                            >
                                <FaFilePdf style={{ color: '#ef4444' }} /> View Full History (PDF)
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        {jumuiya.saintImage && (
                            <div className="tab-card glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                                <img
                                    src={jumuiya.saintImage}
                                    alt={`${jumuiya.name} Saint`}
                                    style={{
                                        width: '100%',
                                        height: '250px',
                                        objectFit: 'cover',
                                        borderRadius: 'var(--rm)',
                                    }}
                                />
                            </div>
                        )}

                        {/* Meeting Schedule Card */}
                        <div className="tab-card" style={{ background: 'var(--jumuiya-color)', color: 'white' }}>
                            <h3 style={{ marginBottom: '20px', fontSize: '1.25rem' }}>Regular Meetings</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <FaCalendarDay style={{ opacity: 0.8 }} />
                                    <div>
                                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Day</div>
                                        <div style={{ fontWeight: 600 }}>{jumuiya.meetingSchedule.day}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <FaClock style={{ opacity: 0.8 }} />
                                    <div>
                                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Time</div>
                                        <div style={{ fontWeight: 600 }}>{jumuiya.meetingSchedule.time}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <FaMapMarkerAlt style={{ opacity: 0.8 }} />
                                    <div>
                                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Venue</div>
                                        <div style={{ fontWeight: 600 }}>{jumuiya.meetingSchedule.venue}</div>
                                    </div>
                                </div>
                            </div>
                            <p style={{ marginTop: '20px', fontSize: '0.85rem', opacity: 0.9, fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
                                All are welcome! Come join us for prayer, fellowship, and community building.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default AboutTab;
