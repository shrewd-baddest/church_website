import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCommunityData } from './context/CommunityDataContext';
import type { CommunityModule, PracticeSchedule } from './context/CommunityDataContext';
import { apiClient } from '../../api/axiosInstance';
import { toast } from 'react-hot-toast';
import CommunityModal from './components/CommunityModal';

// ─── Next Practice Countdown (Choir-specific) ────────────────────────────────
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseT(t: string) {
    const [h, m] = t.split(':').map(Number);
    return { h: h || 0, m: m || 0 };
}
function fmt12(t: string) {
    if (!t) return '';
    const { h, m } = parseT(t);
    const ap = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`;
}
function getWindows(schedules: PracticeSchedule[], now: Date) {
    return schedules.map(s => {
        const dayIdx = DAY_NAMES.indexOf(s.day);
        const st = parseT(s.startTime);
        const et = parseT(s.endTime);
        let daysUntil = (dayIdx - now.getDay() + 7) % 7;
        const start = new Date(now);
        start.setDate(now.getDate() + daysUntil);
        start.setHours(st.h, st.m, 0, 0);
        const end = new Date(start);
        end.setHours(et.h, et.m, 0, 0);
        if (end <= now) { start.setDate(start.getDate() + 7); end.setDate(end.getDate() + 7); }
        return { s, start, end };
    });
}

const PracticeCountdown: React.FC<{ schedules: PracticeSchedule[] }> = ({ schedules }) => {
    const [, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(id);
    }, []);

    const now = new Date();
    const windows = getWindows(schedules, now);
    const inProgress = windows.find(w => now >= w.start && now < w.end);

    if (inProgress) {
        const remaining = Math.max(0, inProgress.end.getTime() - now.getTime());
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        return (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                <div className="text-green-700 font-black text-lg mb-1">🎵 Practice In Progress!</div>
                <div className="text-green-600 font-semibold">{inProgress.s.day} · {inProgress.s.location}</div>
                <div className="text-green-500 text-sm mt-1">Ends in <strong>{mins}m {secs}s</strong></div>
            </div>
        );
    }

    const sorted = [...windows].sort((a, b) => a.start.getTime() - b.start.getTime());
    const next = sorted[0];
    const diff = next.start.getTime() - now.getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
            <div className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2 text-center">Next Practice</div>
            <div className="text-center mb-4">
                <div className="font-extrabold text-slate-800 text-lg">{next.s.day}</div>
                <div className="text-slate-500 text-sm">{fmt12(next.s.startTime)} – {fmt12(next.s.endTime)}</div>
                <div className="text-slate-400 text-xs mt-1">📍 {next.s.location}</div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
                {[['DAYS', days], ['HRS', hours], ['MIN', minutes], ['SEC', seconds]].map(([label, val]) => (
                    <div key={label as string} className="bg-white border border-indigo-100 rounded-xl p-2 shadow-sm">
                        <div className="text-2xl font-black text-indigo-600 tabular-nums">{String(val).padStart(2, '0')}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
// ─────────────────────────────────────────────────────────────────────────────

const CommunityDetail: React.FC = () => {
    const { moduleId } = useParams<{ moduleId: string }>();
    const navigate = useNavigate();
    const { getModuleById } = useCommunityData();

    type TabType = 'about' | 'announcements' | 'officials' | 'activities' | 'gallery' | 'classes' | 'schedules';
    const [activeTab, setActiveTab] = useState<TabType>('about');
    const [showRegistration, setShowRegistration] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', experience: '', voiceType: '', musicLevel: 'Beginner' });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingPayment, setPendingPayment] = useState<{ amount: number; description: string; type: 'Join' | 'Subscription' | 'Uniform' | 'Class' }>({ amount: 0, description: '', type: 'Join' });

    // Robust Fee Parser
    const parseFee = (val: any): number => {
        if (typeof val === 'number') return val;
        if (!val || typeof val !== 'string') return 0;
        if (val.toLowerCase().includes('free') || val.toLowerCase().includes('none')) return 0;
        const match = val.match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
    };

    const enrollMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const endpoint = moduleData?.registrationEndpoint || '/api/enrollments';
            return await apiClient.post(endpoint, {
                full_name: data.name,
                class_id: selectedClassId || moduleId,
                voice_type: moduleId === 'choir' ? data.voiceType : data.phone,
                music_level: moduleId === 'choir' ? data.musicLevel : data.email,
                status: 'Pending',
            });
        },
        onSuccess: () => {
            toast.success('Registration submitted successfully!');
            setShowRegistration(false);
            setShowSuccessModal(true);
            setSelectedClassId(null);
            setFormData({ name: '', phone: '', email: '', experience: '', voiceType: '', musicLevel: 'Beginner' });
        },
        onError: () => {
            toast.error('Failed to submit application. Please try again.');
        }
    });

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Smart Fee Logic: Check Registration + Subscription (or Class fee)
        let amount = 0;
        let pType: 'Join' | 'Class' = 'Join';
        let desc = `Joining ${moduleData?.title}`;

        if (selectedClassId) {
            const cls = moduleData?.musicClasses?.find(c => c.id === selectedClassId);
            amount = parseFee(cls?.fee);
            pType = 'Class';
            desc = `Class Enrollment: ${cls?.title}`;
        } else {
            const regNum = parseFee(moduleData?.fees?.registration);
            const subNum = parseFee(moduleData?.fees?.subscription);
            amount = regNum + subNum;
        }

        if (amount <= 0) {
            enrollMutation.mutate(formData);
        } else {
            setPendingPayment({ amount, description: desc, type: pType });
            setShowPaymentModal(true);
        }
    };

    const initiateSpecificPayment = (amt: number, desc: string, type: 'Subscription' | 'Uniform') => {
        setPendingPayment({ amount: amt, description: desc, type });
        setShowPaymentModal(true);
    };

    const handleConfirmPayment = () => {
        if (!formData.phone || formData.phone.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }

        // Trigger STK Push logic here
        toast.promise(
            apiClient.post('/api/payment/stkpush', {
                phoneNumber: formData.phone,
                amount: pendingPayment.amount,
                description: pendingPayment.description
            }),
            {
                loading: 'Initiating M-Pesa Payment...',
                success: (_res) => {
                    if (pendingPayment.type === 'Join' || pendingPayment.type === 'Class') {
                        enrollMutation.mutate(formData);
                    }
                    setShowPaymentModal(false);
                    return 'STK Push sent! Please check your phone.';
                },
                error: 'Failed to initiate payment. Check your internet.'
            }
        );
    };

    const openClassEnrollment = (classId: string) => {
        setSelectedClassId(classId);
        setShowRegistration(true);
        setActiveTab('about');
        window.scrollTo({ top: 500, behavior: 'smooth' });
    };

    const { data: serverModuleData, isLoading, isError } = useQuery({
        queryKey: ['community', moduleId],
        queryFn: async () => {
            const res = await apiClient.get(`/community-view/${moduleId}`);
            if (res.data?.isMissing || res.data?.isServerError) throw new Error('Not available');
            return res.data;
        },
        retry: 1,
        staleTime: 300000
    });

    const contextFallback = moduleId ? getModuleById(moduleId) : undefined;
    const moduleData: CommunityModule | undefined = serverModuleData || contextFallback;

    const isChoir = moduleId === 'choir';

    const availableTabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'about', label: 'About', icon: 'fas fa-info-circle' },
        { id: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn' },
        ...(moduleData?.musicClasses?.length ? [{ id: 'classes' as TabType, label: 'Classes', icon: 'fas fa-graduation-cap' }] : []),
        ...(moduleData?.practiceSchedules?.length ? [{ id: 'schedules' as TabType, label: moduleData.scheduleLabel || 'Schedule', icon: 'fas fa-clock' }] : []),
        { id: 'officials', label: 'Leadership', icon: 'fas fa-users' },
        { id: 'activities', label: 'Activities', icon: 'fas fa-calendar-alt' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' }
    ];

    if (isLoading && !contextFallback) {
        return (
            <div className="w-full bg-slate-50 min-h-[80vh] flex items-center justify-center">
                <div className="animate-spin text-blue-600"><i className="fas fa-circle-notch text-4xl"></i></div>
            </div>
        );
    }

    if (!moduleData) {
        return (
            <div className="w-full bg-gray-50 flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md">
                    <i className="fas fa-exclamation-triangle text-4xl text-orange-400 mb-4"></i>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Ministry Not Found</h2>
                    <p className="text-gray-500 mb-6">We could not find the community ministry you are looking for.</p>
                    <button onClick={() => navigate('/community')} className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium">Back to Community</button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-50 min-h-[80vh] pb-16 animate-fade-in">
            {/* Hero */}
            <div className="w-full pt-16 pb-24 px-4 md:px-8 relative overflow-hidden"
                style={{ backgroundColor: moduleData.color && moduleData.color !== '#ffffff' ? moduleData.color : '#2c3e50' }}>
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl border border-white/40 text-white flex-shrink-0">
                        <i className={`${moduleData.icon || 'fas fa-users'} text-5xl drop-shadow-lg`}></i>
                    </div>
                    <div className="text-center md:text-left text-white">
                        <Link to="/community" className="text-white text-sm font-semibold mb-3 flex items-center gap-1 w-fit mx-auto md:mx-0 bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-full border border-white/20 transition">
                            <i className="fas fa-chevron-left text-xs"></i> Back to Community
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight drop-shadow-lg">{moduleData.title}</h1>
                        <p className="text-lg text-white/90 max-w-2xl drop-shadow-md">{moduleData.description}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-12 relative z-20">
                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 mb-8 flex flex-wrap gap-2 justify-center md:justify-start">
                    {availableTabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm ${activeTab === tab.id
                                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                            <i className={tab.icon}></i> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* ABOUT TAB */}
                        {activeTab === 'about' && (
                            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-fade-in relative">
                                {isError && <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Offline Mode</div>}
                                <h2 className="text-3xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">Welcome to {moduleData.title}</h2>
                                <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line mb-8">{moduleData.story || moduleData.about || moduleData.description}</p>

                                {/* Agenda – Non-Choir groups */}
                                {moduleData.agenda && moduleData.agenda.length > 0 && (
                                    <div className="mb-10">
                                        <h3 className="text-xl font-extrabold text-slate-700 mb-4 flex items-center gap-2">
                                            <i className="fas fa-list-check text-blue-500"></i> Our Mission & Agenda
                                        </h3>
                                        <ul className="space-y-3">
                                            {moduleData.agenda.map((item, i) => (
                                                <li key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm flex-shrink-0">{i + 1}</span>
                                                    <span className="text-slate-700 font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Registration CTA */}
                                <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl shadow-sm">
                                    <h3 className="text-2xl font-extrabold text-blue-900 mb-2">{selectedClassId ? 'Class Enrollment' : 'Ready to join?'}</h3>
                                    <p className="text-blue-700/80 mb-6 font-medium">
                                        {selectedClassId ? 'Enrolling into a specialized music class.' : "We're always looking for dedicated members."}
                                    </p>

                                    {!showRegistration ? (
                                        <button onClick={() => setShowRegistration(true)} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition hover:-translate-y-0.5">
                                            <i className="fas fa-file-signature mr-2"></i> Join this Ministry
                                        </button>
                                    ) : (
                                        <form onSubmit={handleRegisterSubmit} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-blue-50 relative">
                                            {enrollMutation.isPending && (
                                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                                                    <div className="animate-spin text-blue-600"><i className="fas fa-circle-notch text-3xl"></i></div>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-bold text-slate-800 text-lg">Enrollment Form</h4>
                                                <button type="button" onClick={() => { setShowRegistration(false); setSelectedClassId(null); }} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times"></i></button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="block text-sm font-semibold text-slate-600 mb-1">Full Name</label>
                                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" placeholder="John Doe" /></div>
                                                <div><label className="block text-sm font-semibold text-slate-600 mb-1">Phone Number</label>
                                                    <input required type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" placeholder="+254..." /></div>
                                            </div>

                                            {/* Choir-specific fields */}
                                            {isChoir && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div><label className="block text-sm font-semibold text-slate-600 mb-1">Voice Type</label>
                                                        <select required value={formData.voiceType} onChange={e => setFormData({ ...formData, voiceType: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400">
                                                            <option value="">Select Voice</option>
                                                            <option>Soprano</option><option>Alto</option><option>Tenor</option><option>Bass</option>
                                                        </select></div>
                                                    <div><label className="block text-sm font-semibold text-slate-600 mb-1">Skill Level</label>
                                                        <select value={formData.musicLevel} onChange={e => setFormData({ ...formData, musicLevel: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400">
                                                            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                                                        </select></div>
                                                </div>
                                            )}

                                            <div><label className="block text-sm font-semibold text-slate-600 mb-1">Email (Optional)</label>
                                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none" /></div>
                                            <div><label className="block text-sm font-semibold text-slate-600 mb-1">Notes / Experience</label>
                                                <textarea value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none resize-none" placeholder="Tell us briefly why you want to join..."></textarea></div>
                                            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition">Submit Application</button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* CLASSES TAB (Choir-specific) */}
                        {activeTab === 'classes' && (
                            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-fade-in">
                                <h2 className="text-3xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">Music Classes</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {moduleData.musicClasses?.map(mc => (
                                        <div key={mc.id} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="text-xl font-bold text-slate-800">{mc.title}</h3>
                                                <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-600 px-2 py-1 rounded">{mc.skillLevel}</span>
                                            </div>
                                            <p className="text-slate-600 text-sm mb-4">{mc.description}</p>
                                            {mc.instructor && <div className="text-xs text-slate-400 mb-1"><i className="fas fa-user-tie mr-1"></i> {mc.instructor}</div>}
                                            <div className="flex items-center gap-2 text-slate-500 text-sm mb-5"><i className="far fa-clock"></i> {mc.schedule}</div>
                                            <button onClick={() => openClassEnrollment(mc.id)} className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
                                                <i className="fas fa-plus mr-1"></i> Join Class
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SCHEDULES TAB */}
                        {activeTab === 'schedules' && (
                            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-fade-in">
                                <h2 className="text-3xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">{moduleData.scheduleLabel || 'Schedule'}</h2>
                                <div className="space-y-4">
                                    {moduleData.practiceSchedules?.map(ps => (
                                        <div key={ps.id} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-100 transition">
                                            <div>
                                                <h3 className="text-2xl font-extrabold text-slate-800">{ps.day}</h3>
                                                <p className="text-slate-500 font-medium mt-1">📍 {ps.location}</p>
                                            </div>
                                            <div className="text-lg font-black text-blue-600 bg-blue-50 px-5 py-3 rounded-xl border border-blue-100">
                                                {fmt12(ps.startTime)} – {fmt12(ps.endTime)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ANNOUNCEMENTS TAB */}
                        {activeTab === 'announcements' && (
                            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-fade-in relative">
                                {isError && <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Offline Mode</div>}
                                <h2 className="text-3xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">Latest Announcements</h2>
                                {moduleData.announcements && moduleData.announcements.length > 0 ? (
                                    <div className="space-y-4">
                                        {moduleData.announcements.map((ann: any) => (
                                            <div key={ann.id} className="p-6 border-l-4 border-l-amber-400 bg-amber-50/30 rounded-r-2xl shadow-sm hover:shadow-md transition">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-xl font-bold text-slate-800">{ann.announcement_title || ann.title}</h3>
                                                    <span className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                                                        {new Date(ann.announcement_date || ann.date || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <p className="text-slate-700 leading-relaxed">{ann.announcement_content || ann.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-center py-8">No new announcements at this time.</p>
                                )}
                            </div>
                        )}

                        {/* OFFICIALS TAB */}
                        {activeTab === 'officials' && (
                            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-fade-in relative">
                                {isError && <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Offline Mode</div>}
                                <h2 className="text-3xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">Our Leadership</h2>
                                {moduleData.officials && moduleData.officials.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {moduleData.officials.map((official: any) => (
                                            <div key={official.id} className="flex items-center gap-4 p-5 border border-slate-100 rounded-2xl hover:shadow-lg transition bg-slate-50/50 hover:bg-white group">
                                                {official.photo_url || official.photoUrl ? (
                                                    <img src={official.photo_url || official.photoUrl} alt={official.name} className="w-16 h-16 rounded-full object-cover shadow" />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xl">
                                                        {official.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition">{official.name}</h3>
                                                    <p className="text-sm font-semibold text-slate-500 mb-2">{official.role}</p>
                                                    <div className="flex gap-3">
                                                        {official.email && <a href={`mailto:${official.email}`} className="text-blue-500 hover:text-blue-700 text-sm"><i className="fas fa-envelope mr-1"></i>Email</a>}
                                                        {(official.phoneNumber || official.phone) && <a href={`tel:${official.phoneNumber || official.phone}`} className="text-green-500 hover:text-green-700 text-sm"><i className="fas fa-phone mr-1"></i>Call</a>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-center py-8">No officials have been listed yet.</p>
                                )}
                            </div>
                        )}

                        {/* ACTIVITIES TAB */}
                        {activeTab === 'activities' && (
                            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-fade-in relative">
                                {isError && <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Offline Mode</div>}
                                <h2 className="text-3xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">Upcoming Activities</h2>
                                {moduleData.activities && moduleData.activities.length > 0 ? (
                                    <div className="space-y-4">
                                        {moduleData.activities.map((activity: any) => (
                                            <div key={activity.id} className="flex flex-col md:flex-row p-6 border border-slate-100 rounded-2xl bg-white shadow-sm hover:border-blue-100 transition">
                                                <div className="md:w-44 mb-3 md:mb-0 md:border-r border-slate-100 md:pr-6">
                                                    <span className={`text-xs font-bold uppercase block mb-1 ${activity.status === 'Upcoming' ? 'text-orange-500' : 'text-green-500'}`}>
                                                        {activity.status || 'Event'}
                                                    </span>
                                                    <span className="font-bold text-slate-700">{activity.date}</span>
                                                </div>
                                                <div className="md:pl-6 flex-grow">
                                                    <h3 className="text-lg font-bold text-slate-800 mb-1">{activity.title}</h3>
                                                    <p className="text-slate-600 text-sm">{activity.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-center py-8">No activities scheduled right now. Join us at our regular meetings!</p>
                                )}
                            </div>
                        )}

                        {/* GALLERY TAB */}
                        {activeTab === 'gallery' && (
                            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-fade-in relative">
                                {isError && <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Offline Mode</div>}
                                <h2 className="text-3xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">Photo Gallery</h2>
                                {moduleData.gallery && moduleData.gallery.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {moduleData.gallery.map((img: any) => (
                                            <div key={img.id} className="group relative rounded-2xl overflow-hidden aspect-video shadow-sm hover:shadow-xl transition cursor-zoom-in">
                                                <img src={img.url || img.imageUrl || img.image_url} alt={img.caption || img.eventName} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition">
                                                    <p className="text-white font-medium text-sm">{img.caption || img.eventName}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-400">
                                        <i className="fas fa-camera text-5xl mb-4 block"></i>
                                        <p>Photos will appear here soon.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">

                        {/* Practice Countdown - Choir only */}
                        {isChoir && moduleData.practiceSchedules && moduleData.practiceSchedules.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
                                <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                                    <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl"><i className="fas fa-hourglass-half text-xl"></i></div>
                                    <h3 className="text-xl font-black text-indigo-900">Next Practice</h3>
                                </div>
                                <PracticeCountdown schedules={moduleData.practiceSchedules} />
                            </div>
                        )}

                        {/* Meeting / Training Schedule (sidebar) */}
                        <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100 relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 text-slate-50 opacity-50 scale-150"><i className="far fa-clock text-9xl"></i></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
                                    <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl"><i className="far fa-calendar-check text-xl"></i></div>
                                    <h3 className="text-xl font-black text-indigo-900">{moduleData.scheduleLabel || 'Meeting Time'}</h3>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                                    <i className="fas fa-map-marker-alt text-indigo-400 mt-1"></i>
                                    <p className="text-slate-700 font-semibold leading-relaxed">{(moduleData as any).training || moduleData.meetingSchedule || 'Contact parish office for schedule.'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Financial Information */}
                        {moduleData.fees && (moduleData.fees.registration || moduleData.fees.subscription || moduleData.fees.uniform) && (
                            <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100 relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 text-slate-50 opacity-40 scale-125"><i className="fas fa-coins text-9xl"></i></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
                                        <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl"><i className="fas fa-wallet text-xl"></i></div>
                                        <h3 className="text-xl font-black text-emerald-900">Ministry Fees</h3>
                                    </div>
                                    <ul className="space-y-4 text-slate-700">
                                        {moduleData.fees.registration !== undefined && (
                                            <li className="flex justify-between items-center border-b border-slate-50 pb-3">
                                                <span className="text-slate-500 font-medium">Registration</span>
                                                <span className="font-bold text-slate-800">
                                                    {moduleData.fees.registration === 0 || moduleData.fees.registration === 'Free' ? <span className="text-emerald-600">Free</span> : `Ksh ${moduleData.fees.registration}`}
                                                </span>
                                            </li>
                                        )}
                                        {moduleData.fees.subscription !== undefined && (
                                            <li className="flex justify-between items-center border-b border-slate-50 pb-3 gap-4">
                                                <div className="flex-grow">
                                                    <span className="text-slate-500 font-medium block">Subscription</span>
                                                    <span className="font-bold text-slate-800">
                                                        {moduleData.fees.subscription === 0 || moduleData.fees.subscription === 'None' ? <span className="text-emerald-600">Free</span> : `Ksh ${moduleData.fees.subscription}`}
                                                    </span>
                                                </div>
                                                {moduleData.fees.subscription !== 0 && moduleData.fees.subscription !== 'None' && (
                                                    <button 
                                                        onClick={() => initiateSpecificPayment(Number(moduleData.fees?.subscription), `Subscription for ${moduleData.title}`, 'Subscription')}
                                                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black hover:bg-emerald-200 transition"
                                                    >
                                                        PAY NOW
                                                    </button>
                                                )}
                                            </li>
                                        )}
                                        {moduleData.fees.uniform && (
                                            <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-xs font-bold text-emerald-600 block uppercase tracking-wider">Uniform</span>
                                                        <span className="text-sm text-slate-700 font-medium">{moduleData.fees.uniform}</span>
                                                    </div>
                                                    {moduleData.fees.uniform.includes('Ksh') && (
                                                        <button 
                                                            onClick={() => {
                                                                const amt = parseFee(moduleData.fees?.uniform);
                                                                initiateSpecificPayment(amt, `Uniform for ${moduleData.title}`, 'Uniform');
                                                            }}
                                                            className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black hover:bg-indigo-200 transition"
                                                        >
                                                            ORDER
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Contact CTA */}
                        <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-8 text-white text-center shadow-xl shadow-blue-500/20 sticky top-4">
                            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                                <i className="fas fa-paper-plane text-xl"></i>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Need more info?</h3>
                            <p className="text-blue-100 mb-5 text-sm">Contact the ministry coordinator for detailed inquiries.</p>
                            <a href="mailto:info@church.com" className="block px-6 py-3 bg-white text-blue-600 rounded-full font-black shadow-lg hover:scale-105 transition-all">
                                Contact Coordinator
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <CommunityModal 
                isOpen={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)}
                title="Welcome Aboard!"
                type="success"
            >
                <p className="mb-4">Your application to join <strong>{moduleData.title}</strong> has been received by our coordinators.</p>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
                    <i className="fas fa-info-circle text-emerald-500 mt-1"></i>
                    <p className="text-sm text-emerald-700">Please attend our next meeting on <strong>{moduleData.meetingSchedule}</strong> for a brief orientation.</p>
                </div>
            </CommunityModal>

            {/* Payment Modal / STK Push Confirmation */}
            <CommunityModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title={pendingPayment.type === 'Join' ? 'New Membership' : pendingPayment.description}
                type="info"
            >
                <div className="space-y-4 mb-6">
                    <p className="text-slate-600">Please confirm your payment of <strong>Ksh {pendingPayment.amount}</strong>.</p>
                    
                    {pendingPayment.type === 'Join' && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm space-y-2">
                           <div className="flex justify-between"><span>Registration</span> <span>{moduleData.fees?.registration || 'Free'}</span></div>
                           <div className="flex justify-between font-bold text-slate-900 pt-2 border-t"><span>Total Due</span> <span>Ksh {pendingPayment.amount}</span></div>
                        </div>
                    )}
                </div>

                <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 mb-6">
                    <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                        <i className="fas fa-mobile-alt"></i> M-Pesa STK Push
                    </h4>
                    <p className="text-sm text-blue-700">Enter phone number for M-Pesa prompt:</p>
                    <input 
                        type="tel" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full mt-3 p-3 bg-white border border-blue-200 rounded-2xl outline-none text-blue-900 font-bold"
                        placeholder="07..."
                    />
                </div>
                <button 
                    onClick={handleConfirmPayment}
                    className="w-full py-4 bg-emerald-600 text-white font-black rounded-[1.5rem] shadow-xl hover:bg-emerald-700 transition"
                >
                    Pay Ksh {pendingPayment.amount} Now
                </button>
            </CommunityModal>
        </div>
    );
};

export default CommunityDetail;
