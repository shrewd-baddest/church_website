import React from 'react';
import type { Official, FormerOfficial, TermOfOffice } from '../data/jumuiyaData';
import { FaEnvelope, FaWhatsapp, FaCalendarCheck, FaHistory } from 'react-icons/fa';
import './TabsSystem.css';

interface OfficialsTabProps {
    officials: Official[];
    termOfOffice?: TermOfOffice;
    formerOfficials?: FormerOfficial[];
    jumuiyaColor: string;
}

const Avatar: React.FC<{ name: string; image?: string; size?: 'xs' | 'sm' | 'md' }> = ({ name, image, size = 'md' }) => {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const sizePx = size === 'xs' ? '32px' : size === 'sm' ? '40px' : '64px';
    const fontSize = size === 'xs' ? '0.65rem' : size === 'sm' ? '0.85rem' : '1.2rem';

    if (image) {
        return (
            <div className={`official-portrait-wrap`} style={{ width: sizePx, height: sizePx }}>
                <img src={image} alt={name} />
            </div>
        );
    }
    return (
        <div
            style={{
                width: sizePx,
                height: sizePx,
                borderRadius: '50%',
                background: 'var(--jumuiya-color)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: fontSize
            }}
        >
            {initials}
        </div>
    );
};

const OfficialsTab: React.FC<OfficialsTabProps> = ({ officials, termOfOffice, formerOfficials, jumuiyaColor }) => {
    return (
        <div className="tab-system-content" style={{ '--jumuiya-color': jumuiyaColor } as React.CSSProperties}>
            <div className="tab-header-wrap">
                <div className="header-text">
                    <h1 className="page-title">Leadership Team</h1>
                    <p className="page-description">Meet the dedicated leaders who guide and serve our Jumuiya community.</p>
                </div>
                {termOfOffice && (
                    <div className="leadership-pill animate-fade">
                        <FaCalendarCheck style={{ color: 'var(--jumuiya-color)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>Current Term</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{termOfOffice.startYear} – {termOfOffice.endYear}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="tab-grid">
                {officials.map(official => (
                    <div key={official.id} className="tab-card animate-fade" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Avatar name={official.name} image={official.image} size="md" />
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{official.name}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>{official.position}</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <a href={`mailto:${official.email}`} className="btn-premium" style={{ padding: '6px', background: 'var(--bg-soft)', color: 'var(--text-secondary)' }}>
                                    <FaEnvelope />
                                </a>
                                <a href={`tel:${official.phone}`} className="btn-premium" style={{ padding: '6px', background: 'var(--bg-soft)', color: '#25d366' }}>
                                    <FaWhatsapp />
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {formerOfficials && formerOfficials.length > 0 && (
                <div style={{ marginTop: 'var(--space-3xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', opacity: 0.6 }}>
                        <FaHistory />
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Leadership History</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {(() => {
                            const groups = formerOfficials.reduce<Record<string, FormerOfficial[]>>((acc, f) => {
                                acc[f.yearsServed] = acc[f.yearsServed] ? [...acc[f.yearsServed], f] : [f];
                                return acc;
                            }, {});

                            return Object.entries(groups)
                                .sort(([a], [b]) => b.localeCompare(a))
                                .map(([years, members]) => (
                                    <div key={years} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                        <div className="badge info" style={{ height: 'fit-content', background: 'var(--bg-soft)', color: 'var(--jumuiya-color)', fontWeight: 800 }}>
                                            {years}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1 }}>
                                            {members.map(f => (
                                                <div key={f.id} className="leadership-pill" style={{ padding: '4px 12px 4px 4px', gap: '8px' }}>
                                                    <Avatar name={f.name} image={f.image} size="xs" />
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{f.name}</span>
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{f.position}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ));
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfficialsTab;
