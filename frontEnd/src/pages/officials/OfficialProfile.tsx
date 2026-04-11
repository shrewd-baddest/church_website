import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaPhoneAlt, FaWhatsapp, FaEnvelope, FaArrowLeft, FaCheckCircle, FaStar, FaQuoteLeft } from 'react-icons/fa';
import { POSITION_INFO, DEFAULT_POSITION_INFO } from './constants/positionInfo';

import apiService from '../Landing/services/api'
// Extract only the domain from the versioned API URI for image assets
const UPLOAD_BASE = (import.meta.env.VITE_SERVER_URI || '').split('/api')[0]

const CATEGORY_COLORS: Record<string, string> = {
    'Executive': 'from-purple-600 to-purple-800',
    'Jumuiya Coordinators': 'from-blue-600 to-blue-800',
    'Bible Coordinators': 'from-green-600 to-green-800',
    'Rosary': 'from-pink-600 to-pink-800',
    'Pamphlet Managers': 'from-orange-600 to-orange-800',
    'Project Managers': 'from-indigo-600 to-indigo-800',
    'Liturgist': 'from-cyan-600 to-cyan-800',
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
    'Pamphlet Managers': '#ea580c',
    'Project Managers': '#4f46e5',
    'Liturgist': '#0891b2',
    'Choir Officials': '#dc2626',
    'Instrument Managers': '#2563eb',
    'Liturgical Dancers': '#7c3aed',
    'Catechist': '#ca8a04',
};

const OfficialProfile: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [official, setOfficial] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOfficialDetails = async () => {
            if (!id) return;
            try {
                const data = await apiService.getOfficialById(id);
                if (data) {
                    setOfficial(data);
                } else {
                    setError('Official not found');
                }
            } catch (err) {
                setError('Failed to load official details');
            } finally {
                setLoading(false);
            }
        };
        fetchOfficialDetails();
    }, [id]);

    if (loading) return (
        <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
    );

    if (error || !official) return (
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Something went wrong'}</h2>
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
                        <div className="relative group shrink-0">
                            <div className="absolute -inset-1 bg-white/30 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <img 
                                src={official.photo ? (official.photo.startsWith('http') ? official.photo : `${UPLOAD_BASE}${official.photo}`) : 'https://via.placeholder.com/180'} 
                                alt={official.name}
                                className="relative w-36 h-36 sm:w-52 sm:h-52 rounded-full object-cover border-4 border-white shadow-2xl"
                            />
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
                            <p className="text-lg sm:text-2xl font-medium text-white/90 flex items-center justify-center md:justify-start gap-3 italic">
                                {official.position} <span className="not-italic opacity-50">/</span> {category}
                            </p>
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
                            <div className="relative p-8 rounded-3xl bg-gray-50 border border-gray-100 italic text-gray-600 text-lg leading-relaxed shadow-inner">
                                <FaQuoteLeft className="absolute top-6 left-6 text-gray-200 text-4xl -z-0" />
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
                             <div className="absolute top-0 right-0 w-32 h-32 opacity-5 translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: color }}></div>
                            
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
                             <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path d="M0 100 C 20 0 50 0 100 100" stroke="white" strokeWidth="0.1" fill="none" />
                                </svg>
                             </div>
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
                            <p className="mt-8 text-xs text-white/40 font-medium">
                                These qualities are essential for maintaining the integrity and mission of the CSA {official.position} role.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfficialProfile;
