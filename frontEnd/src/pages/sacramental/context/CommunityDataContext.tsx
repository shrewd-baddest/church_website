import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../../../api/axiosInstance';

export interface Official {
    id: string;
    name: string;
    role: string;
    photoUrl?: string;
    email?: string;
    phoneNumber?: string;
}

export interface Activity {
    id: string;
    title: string;
    date: string;
    description: string;
    status: 'Upcoming' | 'Completed' | 'Ongoing';
}

export interface GalleryImage {
    id: string;
    url: string;
    caption: string;
    imageUrl?: string; 
}

export interface Announcement {
    id: string;
    title?: string;
    announcement_title?: string;
    content?: string;
    announcement_content?: string;
    date?: string;
    announcement_date?: string;
}

export interface MusicClass {
    id: string;
    title: string;
    instructor?: string;
    schedule: string;
    description: string;
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
    fee?: number;
}

export interface PracticeSchedule {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    location: string;
}

export interface CommunityModule {
    id: string;
    title: string;
    description: string;
    path: string;
    color: string;
    icon: string;
    iconColor?: string;
    about?: string;
    scheduleLabel?: string;
    meetingSchedule?: string;
    officials?: Official[];
    activities?: Activity[];
    gallery?: GalleryImage[];
    announcements?: Announcement[];
    musicClasses?: MusicClass[];
    practiceSchedules?: PracticeSchedule[];
    agenda?: string[];
    fees?: {
        registration?: number | string;
        subscription?: number | string;
        uniform?: string;
    };
    story?: string;
    registrationEndpoint?: string;
    saint_image_url?: string;
    image_url?: string;
    history_pdf_url?: string;
    pdf_url?: string;
}

const initialModules: CommunityModule[] = [
    {
        id: 'choir',
        title: 'St. Thomas Aquinas Choir',
        description: 'Join our liturgical choir and lead the congregation in sacred worship through music.',
        path: '/community/choir',
        color: '#2c3e50',
        icon: 'fas fa-music',
        scheduleLabel: 'Practice Schedule',
        registrationEndpoint: '/enrollments',
        about: 'The Choir is dedicated to uplifting the spirits of the congregation through carefully selected hymns and chants. We sing at the Sunday 10 AM Mass and during special events.',
        meetingSchedule: 'Tuesdays 6PM–8PM @ Church Hall · Saturdays 1PM–4PM @ LH 32',
        practiceSchedules: [
            { id: '1', day: 'Tuesday', startTime: '18:00', endTime: '20:00', location: 'Church Hall' },
            { id: '2', day: 'Saturday', startTime: '13:00', endTime: '16:00', location: 'LH 32' }
        ],
        musicClasses: [
            { id: '1', title: 'Sight Reading', instructor: 'Dr. Music', schedule: 'Mondays 4PM', description: 'Learn to read music notes and understand basic music theory.', skillLevel: 'Beginner' }
        ],
        officials: [
            { id: '1', name: 'John Doe', role: 'Choir Master', email: 'john@choir.com' },
            { id: '2', name: 'Jane Smith', role: 'Secretary', phoneNumber: '+1234567890' }
        ],
        activities: [
            { id: '1', title: 'Easter Concert', date: '2027-04-12', description: 'Annual Easter Sunday concert.', status: 'Upcoming' },
            { id: '2', title: 'Vocal Training', date: 'Every Saturday', description: 'Weekly vocal coaching for new members.', status: 'Ongoing' }
        ],
        fees: { registration: 20, subscription: 50, uniform: 'White shirt + Black trousers' }
    },
    {
        id: 'dancers',
        title: 'Liturgical Dancers',
        description: 'Express faith through graceful movements and traditional praise dances during Mass.',
        path: '/community/dancers',
        color: '#e67e22',
        icon: 'fas fa-child',
        scheduleLabel: 'Training Schedule',
        registrationEndpoint: '/enrollments',
        about: 'Our liturgical dancers add a profound layer of prayer through bodily expression. We welcome members of all ages to express their love for God through cultural and liturgical dance.',
        meetingSchedule: 'Every Saturday, 4:00 PM – 6:30 PM — School Compound',
        agenda: [
            'Express faith through cultural and liturgical dance',
            'Perform during Sunday Mass, feast days, and parish events',
            'Foster unity through shared movement and prayer',
            'Train new members in sacred choreography'
        ],
        activities: [
            { id: '1', title: 'Kerugoya Parish Visit', date: '2025-02-10', description: 'Visiting Kerugoya Parish on the 15th for a joint celebration.', status: 'Upcoming' }
        ],
        fees: { registration: 0, subscription: 20, uniform: 'Orange T-shirt (Ksh 600) — Mandatory' }
    },
    {
        id: 'charismatic',
        title: 'Charismatic Prayer Group',
        description: 'Deepen your spiritual life through exuberant prayer, worship, and healing.',
        path: '/community/charismatic',
        color: '#2ecc71',
        icon: 'fas fa-fire-alt',
        scheduleLabel: 'Meeting Schedule',
        registrationEndpoint: '/enrollments',
        about: 'The Charismatic Prayer Group focuses on prayer, praise, healing and experiencing the Holy Spirit in our daily lives. All are welcome to join us in an environment of faith and miracles.',
        meetingSchedule: 'Every Saturday, 5:00 PM – 6:30 PM — Parish Hall',
        agenda: [
            'Pray for the sick and afflicted through the Holy Spirit',
            'Lead praise and worship sessions during parish retreats',
            'Conduct weekly bible study and faith sharing',
            'Outreach to spiritual seekers and the vulnerable'
        ],
        fees: { registration: 0, subscription: 0 }
    },
    {
        id: 'st-francis',
        title: 'St. Francis of Assisi',
        description: 'Build bonds of love and support through simplicity, charity, and care for creation.',
        path: '/community/st-francis',
        color: '#2980b9',
        icon: 'fas fa-dove',
        scheduleLabel: 'Prayer Schedule',
        registrationEndpoint: '/enrollments',
        about: 'The St. Francis of Assisi community serves the marginalized, cares for the environment, and promotes peace within our parish and the broader world. We are inspired by the radical simplicity of our patron saint.',
        meetingSchedule: 'Every Sunday, 5:00 PM – 6:30 PM — LH 21',
        announcements: [
            { id: '1', title: 'Visiting Shubukia Shrine', content: 'We will be going to Shubukia Shrine on 15th March for prayers.', date: '2026-02-11' }
        ],
        agenda: [
            'Serve the poor and marginalized in our community',
            'Care for the environment through clean-up campaigns',
            'Promote peace and reconciliation in the parish',
            'Organize charity fundraisers and food drives'
        ],
        fees: { registration: 20, subscription: 20 },
        officials: [
            { id: '1', name: 'Karanja', role: 'Chairperson', email: 'kara@gmail.com', phoneNumber: '073254635632' }
        ]
    },
    {
        id: 'youth',
        title: 'Mentorship Program',
        description: 'Empowering individuals to grow in faith, career guidance, and life skills through structured mentorship.',
        path: '/community/youth',
        color: '#8e44ad',
        icon: 'fas fa-users',
        scheduleLabel: 'Mentorship Sessions',
        registrationEndpoint: '/enrollments',
        about: 'The Mentorship Program connects young Christians with experienced mentors to guide them in spiritual growth, professional development, and personal maturity.',
        meetingSchedule: 'Every Sunday, 3:00 PM – 5:00 PM — Parish Hall',
        fees: { registration: 0, subscription: 0 }
    }
];

interface CommunityContextType {
    modules: CommunityModule[];
    getModuleById: (id: string) => CommunityModule | undefined;
    isLoading: boolean;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const getStoredModules = (): CommunityModule[] => {
        const cached = localStorage.getItem('community_modules_cache');
        if (!cached) return initialModules;

        try {
            const parsed = JSON.parse(cached) as CommunityModule[];
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialModules;
        } catch (error) {
            console.error('Failed to parse cached community modules:', error);
            return initialModules;
        }
    };

    const [modules, setModules] = useState<CommunityModule[]>(getStoredModules);
    const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('community_modules_cache'));

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const response = await apiClient.get('/community-view/data');
                if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                    setModules(response.data);
                    localStorage.setItem('community_modules_cache', JSON.stringify(response.data));
                }
            } catch (error) {
                console.error("Failed to fetch community modules, using fallback data.", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchModules();
    }, []);

    const getModuleById = (id: string) => {
        return modules.find(m => m.id === id);
    };

    return (
        <CommunityContext.Provider value={{ modules, getModuleById, isLoading }}>
            {children}
        </CommunityContext.Provider>
    );
};

export const useCommunityData = () => {
    const context = useContext(CommunityContext);
    if (context === undefined) {
        throw new Error('useCommunityData must be used within a CommunityProvider');
    }
    return context;
};
