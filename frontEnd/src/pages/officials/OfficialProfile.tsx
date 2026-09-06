import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaPhoneAlt, FaWhatsapp, FaEnvelope, FaArrowLeft, FaCheckCircle, FaStar } from 'react-icons/fa';
import { POSITION_INFO, DEFAULT_POSITION_INFO, getAvatarForCategory } from './constants/positionInfo';
import { getSafeImageUrl } from '../../api/config';

import apiService from '../../services/api'
import { useSocket } from '../../context/SocketContext'
import PageLoader from '../../assets/Layouts/PageLoader'

const CATEGORY_COLORS: Record<string, string> = {    'Executive': 'from-purple-600 to-purple-800',
    'Jumuiya Coordinators': 'from-blue-600 to-blue-800',
    'Bible Coordinators': 'from-green-600 to-green-800',
    'Rosary': 'from-pink-600 to-pink-800',
    'Rosary Coordinators': 'from-pink-600 to-pink-800',
    'Pamphlet Managers': 'from-orange-600 to-orange-800',
    'Project Managers': 'from-indigo-600 to-indigo-800',
    'Liturgist': 'from-cyan-600 to-cyan-800',
    'Liturgists': 'from-cyan-600 to-cyan-800',
    'Choir Officials': 'from-red-600 to-red-800',
    'Instrument Managers': 'from-blue-600 to-blue-800',
    'Liturgical Dancers': 'from-violet-600 to-violet-800',
    'Catechist': 'from-yellow-600 to-yellow-800',
};

const CATEGORY_HEX: Record<string, string> = {
    'Executive': '#7c3aed',
    'Jumuiya Coordinators': '#2563eb',
    'Bible Coordinators': '#16a34a',
    'Rosary': '#db2777',
    'Rosary Coordinators': '#db2777',
    'Pamphlet Managers': '#ea580c',
    'Project Managers': '#4f46e5',
    'Liturgist': '#0891b2',
    'Liturgists': '#0891b2',
    'Choir Officials': '#dc2626',
    'Instrument Managers': '#2563eb',
    'Liturgical Dancers': '#7c3aed',
    'Catechist': '#ca8a04',
};



const OfficialProfile: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const [official, setOfficial] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [relatedOfficials, setRelatedOfficials] = useState<any[]>([]);
    const [photoOpen, setPhotoOpen] = useState(false);

    const fetchOfficialDetails = async () => {
        if (!id) return;

        const loadRelated = async (cat: string) => {
            try {
                let officialsList: any = [];
                const cachedList = localStorage.getItem('csa_cache_officials');
                if (cachedList) {
                    try { officialsList = JSON.parse(cachedList); } catch(e) {}
                }
                
                if (!officialsList || !Array.isArray(officialsList) || officialsList.length === 0) {
                    const fetched = await apiService.getOfficials() as any;
                    const maybeData = fetched && typeof fetched === 'object' ? fetched.data : undefined;
                    officialsList = Array.isArray(fetched) ? fetched : (Array.isArray(maybeData) ? maybeData : []);
                }
                
                if (Array.isArray(officialsList)) {
                    const related = officialsList.filter((o: any) => (o.category || 'Other') === cat && String(o.id) !== String(id));
                    setRelatedOfficials(related);
                }
            } catch (e) {}
        };
        
        let foundInCache = false;
        let currentCategory = '';
        // 1. Check if official exists in the bulk cache (common when navigating from list)
        try {
            const cachedList = localStorage.getItem('csa_cache_officials');
            if (cachedList) {
                const officials = JSON.parse(cachedList);
                if (Array.isArray(officials)) {
                    const match = officials.find((o: any) => String(o.id) === String(id));
                    if (match) {
                        setOfficial(match);
                        currentCategory = match.category || 'Other';
                        loadRelated(currentCategory);
                        setLoading(false);
                        foundInCache = true;
                    }
                }
            }
        } catch (e) {}

        // 2. Check individual cache as fallback
        if (!foundInCache) {
            try {
                const singleCache = localStorage.getItem(`csa_cache_official_${id}`);
                if (singleCache) {
                    const parsed = JSON.parse(singleCache);
                    setOfficial(parsed);
                    currentCategory = parsed.category || 'Other';
                    loadRelated(currentCategory);
                    setLoading(false);
                    foundInCache = true;
                }
            } catch (e) {}
        }

        if (!foundInCache) setLoading(true);

        try {
            const data = await apiService.getOfficialById(id);
            if (data) {
                setOfficial(data);
                localStorage.setItem(`csa_cache_official_${id}`, JSON.stringify(data));
                const newCategory = data.category || 'Other';
                if (newCategory !== currentCategory) {
                    loadRelated(newCategory);
                }
            } else {
                if (!foundInCache) setError('Official not found');
            }
        } catch (err) {
            if (!foundInCache) setError('Failed to load official details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on profile change
        fetchOfficialDetails();
    }, [id]);

    useEffect(() => {
        if (!socket) {
            // Fallback: poll every 15s for unauthorized/guest viewers
            const interval = setInterval(() => {
                fetchOfficialDetails();
            }, 15000);
            return () => clearInterval(interval);
        }

        const handleUpdate = () => {
            fetchOfficialDetails();
        };

        socket.on('officialsUpdated', handleUpdate);
        return () => {
            socket.off('officialsUpdated', handleUpdate);
        };
    }, [socket, id]);

    if (loading) return <PageLoader message="Loading official profile" fullScreen />;

    if (error || !official) return (
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Official profile could not be loaded'}</h2>
            <button onClick={() => navigate(-1)} className="px-6 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition-colors">Go Back</button>
        </div>
    );

    const category = official.category || 'Other';
    const posInfo = POSITION_INFO[official.position] || DEFAULT_POSITION_INFO;
    const color = CATEGORY_HEX[category] || '#6366f1';
    const gradient = CATEGORY_COLORS[category] || 'from-indigo-600 to-indigo-800';
    const themeGradient = `bg-gradient-to-br ${gradient}`;

    return (
        <div className="h-full bg-white">
            {/* Header / Hero Section */}
            <div className={`relative min-h-[480px] sm:h-[450px] ${themeGradient} overflow-hidden flex flex-col`}>
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                   <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                   <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/2"></div>
                </div>
                
                <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex-1 flex flex-col pt-20 sm:pt-32">
                    <Link 
                        to="/officials"
                        className="flex items-center gap-2 text-white/90 hover:text-white transition-colors w-fit mb-6 sm:mb-8 cursor-pointer group no-underline"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
                        <span className="font-bold">Back to Officials</span>
                    </Link>
                    
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-12 mt-auto pb-10 sm:pb-16">
                        <div
                            className={`relative group shrink-0 ${official.photo ? 'cursor-pointer' : ''}`}
                            onClick={official.photo ? () => setPhotoOpen(true) : undefined}
                            title={official.photo ? 'View full photo' : undefined}
                        >
                            <div className="absolute -inset-1 bg-white/30 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <img
                                src={official.photo ? getSafeImageUrl(official.photo) : getAvatarForCategory(official.category)}
                                alt={official.name}
                                loading="lazy"
                                className={`relative w-36 h-36 sm:w-52 sm:h-52 rounded-full object-cover border-4 border-white shadow-2xl transition-transform duration-300 ${official.photo ? 'group-hover:scale-[1.03]' : ''}`}
                            />
                            {official.photo && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                    <span className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold border-2 border-white/40">⤢</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="text-center md:text-left text-white flex-1 pb-2">
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3 mb-4">
                                <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-white/30">
                                    {category}
                                </span>
                                <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-white/30">
                                    {official.term_of_service || '2024–2026'}
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-6xl font-black mb-2 drop-shadow-lg leading-tight">{official.name}</h1>
                            <p className="text-lg sm:text-2xl font-bold text-white/90 flex items-center justify-center md:justify-start gap-3 italic">{official.position}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-8 space-y-16">
                        {/* About Role */}
                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-gray-100" style={{ backgroundColor: `${color}10`, color: color }}>
                                    {posInfo.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 border-b-4 border-current pb-1" style={{ borderColor: `${color}40`, color: '#1e293b'}}>About the Role</h3>
                            </div>
                            <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 italic text-gray-600 text-lg leading-relaxed shadow-inner">
    <p className="relative z-10">{posInfo.description}</p>
</div>
                        </section>

                        {/* Responsibilities */}
                        <section>
                            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                                <span className="w-2 h-8 rounded-full" style={{ backgroundColor: color }}></span>
                                Key Responsibilities
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {posInfo.responsibilities.map((res: string, idx: number) => (
                                    <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <FaCheckCircle className="flex-shrink-0 text-xl mt-1" style={{ color }} />
                                        <p className="text-gray-700 font-medium leading-snug">{res}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="lg:col-span-4 space-y-10">
                        {/* Contact Card */}
                        <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl p-8 overflow-hidden relative">
                            <h4 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider">Connect with Official</h4>
                            <div className="space-y-4">
                                {official.contact && (
                                    <a href={`tel:${official.contact}`} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <FaPhoneAlt style={{ color }} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Direct Call</p>
                                            <p className="font-bold text-gray-900">{official.contact}</p>
                                        </div>
                                    </a>
                                )}
                                {official.contact && (
                                    <a href={`https://wa.me/${official.contact.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-[#25D366]/5 hover:bg-[#25D366]/10 transition-colors group border border-[#25D366]/10">
                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <FaWhatsapp className="text-[#25D366]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#25D366] font-bold uppercase tracking-tight">WhatsApp</p>
                                            <p className="font-bold text-gray-900">Start chat</p>
                                        </div>
                                    </a>
                                )}
                                {official.email && (
                                    <a href={`mailto:${official.email}`} className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors group border border-blue-100">
                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <FaEnvelope className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600 font-bold uppercase tracking-tight">Email Address</p>
                                            <p className="font-bold text-gray-900 truncate max-w-[180px]">{official.email}</p>
                                        </div>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Core Qualities */}
                        <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                            <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <FaStar className="text-yellow-400" /> Key Qualities
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {posInfo.qualities.map((q: string, idx: number) => (
                                    <span key={idx} className="px-4 py-2 bg-white/10 rounded-xl text-sm font-bold border border-white/5 backdrop-blur-sm">
                                        {q}
                                    </span>
                                ))}
                            </div>
<p className="mt-8 text-sm text-white/70 font-medium">These qualities are essential for upholding the mission and integrity of this role within the CSA.</p>
                        </div>
                    </div>
                </div>

                {/* Related Officials Section */}
                {relatedOfficials.length > 0 && (
                    <div className="mt-20 border-t border-gray-100 pt-16">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <span className="w-2 h-8 rounded-full" style={{ backgroundColor: color }}></span>
                                Other {category} Officials Profiles
                            </h3>
                        </div>
                        <div className="flex overflow-x-auto pb-8 -mx-6 px-6 gap-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {relatedOfficials.map((rel: any) => (
                                <Link 
                                    to={`/officials/${rel.id}`} 
                                    key={rel.id}
                                    className="snap-start shrink-0 bg-white border border-gray-300 rounded-xl p-3 flex items-center gap-3 shadow-md hover:shadow-lg hover:border-purple-300 transition-all min-w-[200px] max-w-[260px] no-underline group"
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200 relative shadow-inner">
                                        <img 
                                            src={rel.photo ? getSafeImageUrl(rel.photo) : getAvatarForCategory(rel.category)}
                                            alt={rel.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors truncate">{rel.name}</h4>
                                        <p className="text-xs font-semibold mt-0.5 truncate" style={{ color: color }}>{rel.position}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-purple-600 pr-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <style>{`
                            .hide-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
                    </div>
                )}
            </div>

            {/* Full photo viewer — rectangular, generous size */}
            {photoOpen && official.photo && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
                    style={{ animation: 'opFadeIn 0.2s ease-out' }}
                    onClick={() => setPhotoOpen(false)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setPhotoOpen(false); }}
                    tabIndex={0}
                    ref={(el) => { if (el) el.focus({ preventScroll: true }); }}
                >
                    <button
                        onClick={() => setPhotoOpen(false)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 hover:scale-110 active:scale-95 transition-all duration-150 text-xl font-bold backdrop-blur-md"
                    >
                        ×
                    </button>
                    <div
                        className="relative max-w-3xl"
                        style={{ animation: 'opZoomIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={getSafeImageUrl(official.photo)}
                            alt={official.name}
                            className="max-h-[82vh] max-w-full w-auto rounded-lg shadow-2xl object-contain"
                        />
                        <p className="text-center text-white/80 text-sm font-semibold mt-4">{official.name} — {official.position}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfficialProfile;
