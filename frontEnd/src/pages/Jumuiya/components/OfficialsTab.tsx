import React from 'react';
import type { Official, FormerOfficial, TermOfOffice } from '../data/jumuiyaData';
import { FaCalendarCheck, FaHistory, FaArrowRight, FaPhoneAlt, FaWhatsapp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './TabsSystem.css';

interface OfficialsTabProps {
    officials: Official[];
    termOfOffice?: TermOfOffice;
    formerOfficials?: FormerOfficial[];
    jumuiyaColor: string;
    isAdmin?: boolean;
}

const Avatar: React.FC<{ name: string; image?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ name, image, size = 'md' }) => {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const fontSize = size === 'xs' ? '0.65rem' : size === 'sm' ? '0.85rem' : '1.2rem';

    if (image) {
        return (
            <div className="w-full h-full">
                <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
        );
    }
    return (
        <div
            className="w-full h-full flex items-center justify-center font-bold"
            style={{
                background: 'var(--jumuiya-color)',
                color: 'white',
                fontSize: size === 'lg' ? '2.5rem' : fontSize
            }}
        >
            {initials}
        </div>
    );
};

const OfficialsTab: React.FC<OfficialsTabProps> = ({ officials, termOfOffice, formerOfficials, jumuiyaColor, isAdmin }) => {
    const navigate = useNavigate();

    return (
        <div className="tab-system-content" style={{ '--jumuiya-color': jumuiyaColor } as React.CSSProperties}>
            <div className="tab-header-wrap">
                <div className="header-text">
                    <h1 className="page-title">Leadership Team</h1>
                    <p className="page-description">Meet the dedicated leaders who guide and serve our Jumuiya community.</p>
                </div>
                <div className="flex gap-4 items-center flex-wrap">
                    {termOfOffice && (
                        <div className="leadership-pill animate-fade">
                            <FaCalendarCheck style={{ color: 'var(--jumuiya-color)' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>Current Term</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{termOfOffice.startYear} – {termOfOffice.endYear}</span>
                            </div>
                        </div>
                    )}
                    {isAdmin && (
                        <button
                            className="btn-premium primary animate-fade-in"
                            onClick={() => navigate('/admin/officials')}
                            style={{
                                background: 'var(--jumuiya-color)',
                                color: 'white',
                                gap: '12px',
                                padding: '12px 24px',
                                borderRadius: '16px',
                                boxShadow: `0 10px 20px -5px ${jumuiyaColor}50`
                            }}
                        >
                            Manage Officials <FaArrowRight />
                        </button>
                    )}
                </div>
            </div>

            {/* Premium Officials Grid */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mt-8">
                {officials.length === 0 ? (
                    <div className="w-full text-center py-20 bg-white/50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500 text-lg italic">No members listed in the current leadership team.</p>
                    </div>
                ) : (
                    officials.map(official => (
                        <article 
                            key={official.id} 
                            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.35rem)] xl:w-[calc(25%-1.5rem)] max-w-[320px] border border-gray-100"
                        >
                            {/* Photo Container */}
                            <div className="relative h-48 sm:h-56 bg-gray-100 overflow-hidden">
                                <Avatar name={official.name} image={official.image} size="lg" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>

                            {/* Content */}
                            <div className="p-5 text-center">
                                <h3 className="font-bold text-lg text-gray-900 group-hover:text-[var(--jumuiya-color)] transition-colors truncate">
                                    {official.name}
                                </h3>
                                <p className="text-sm font-semibold mt-2 px-3 py-1 bg-[var(--jumuiya-color)]/10 text-[var(--jumuiya-color)] rounded-full inline-block">
                                    {official.position}
                                </p>

                                {/* Contact Actions */}
                                <div className="mt-5 pt-4 border-t border-gray-50 flex justify-center gap-3">
                                    {official.phone && (
                                        <>
                                            <a
                                                href={`tel:${official.phone.replace(/[^+0-9]/g, '')}`}
                                                className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 hover:bg-[var(--jumuiya-color)] hover:text-white flex items-center justify-center transition-all shadow-sm"
                                                title="Call Official"
                                            >
                                                <FaPhoneAlt size={14} />
                                            </a>
                                            <a
                                                href={`https://wa.me/${official.phone.replace(/[^+0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-xl bg-gray-50 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all shadow-sm"
                                                title="WhatsApp"
                                            >
                                                <FaWhatsapp size={18} />
                                            </a>
                                        </>
                                    )}
                                    {official.email && (
                                        <a
                                            href={`mailto:${official.email}`}
                                            className="w-10 h-10 rounded-xl bg-gray-50 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                                            title="Email Official"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>

            {/* Leadership History */}
            {formerOfficials && formerOfficials.length > 0 && (
                <div className="mt-20">
                    <div className="flex items-center gap-4 mb-8 opacity-60">
                        <FaHistory />
                        <span className="text-xs font-black uppercase tracking-widest">Leadership History</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    <div className="space-y-10">
                        {(() => {
                            const groups = formerOfficials.reduce<Record<string, FormerOfficial[]>>((acc, f) => {
                                acc[f.yearsServed] = acc[f.yearsServed] ? [...acc[f.yearsServed], f] : [f];
                                return acc;
                            }, {});

                            return Object.entries(groups)
                                .sort(([a], [b]) => b.localeCompare(a))
                                .map(([years, members]) => (
                                    <div key={years} className="flex flex-col md:flex-row gap-6">
                                        <div className="md:w-32 flex-shrink-0">
                                            <span className="px-4 py-1.5 bg-[var(--jumuiya-color)]/10 text-[var(--jumuiya-color)] font-bold rounded-lg text-sm sticky top-24">
                                                {years}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 flex-1">
                                            {members.map(f => (
                                                <div key={f.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow min-w-[200px]">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                                        <Avatar name={f.name} image={f.image} size="sm" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900">{f.name}</h4>
                                                        <p className="text-xs text-gray-500">{f.position}</p>
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
