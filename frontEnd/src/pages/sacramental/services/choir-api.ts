/**
 * Choir API Service Layer
 * Placeholder service for backend integration
 * Replace mock implementations with actual API calls
 */

import type {
    ChoirRegistration,
    ChoirOfficial,
    PracticeSchedule,
    SemesterActivity,
    MusicClass,
    Announcement,
    ApiResponse,
    ChoirConfig
} from '../../types.js';

import {
    choirConfig,
    practiceSchedules,
    musicClasses
} from '../../backend/community-hub/data/mock-data.js';

// Comprehensive mock fallbacks for offline resilience
const MOCK_DATA: Record<string, any> = {
    officials: [
        { id: 1, name: "Maria Garcia", role: "Choir Director", bio: "Leading with 15 years experience.", image_url: "https://i.pravatar.cc/150?u=1" },
        { id: 2, name: "David Kim", role: "Acct Director", bio: "Passionate about harmony.", image_url: "https://i.pravatar.cc/150?u=2" }
    ],
    announcements: [
        { id: 1, title: "Grand Rehearsal", content: "Preparations for Easter Mass begin this Sunday.", date: new Date().toISOString() },
        { id: 2, title: "New Members Welcome", content: "Auditions for all voice types are now open.", date: new Date().toISOString() }
    ],
    activities: [
        { id: 1, title: "Charity Concert", description: "Singing for the community nursing home.", activity_date: new Date().toISOString(), status: 'Scheduled' },
        { id: 2, title: "Annual Retreat", description: "A weekend of prayer and fellowship.", activity_date: new Date().toISOString(), status: 'Upcoming' }
    ],
    gallery: [
        { id: 1, image_url: "https://picsum.photos/800/600?random=1", event_name: "Last Mass", description: "Joyful praise." },
        { id: 2, image_url: "https://picsum.photos/800/600?random=2", event_name: "Christmas Carol", description: "Candlelight service." }
    ]
};

export class ChoirApiService {
    private static baseUrl = '/api';
    private static get hubUrl() {
        return window.location.pathname;
    }

    private static cachedData: any = null;
    private static fetchPromise: Promise<any> | null = null;

    /**
     * Fetch all module data at once and cache
     */
    private static async fetchHubData() {
        if (this.cachedData) return this.cachedData;

        // Use cached storage if available offline
        const localCache = localStorage.getItem('csa_hub_content_cache');
        const initialData = localCache ? JSON.parse(localCache) : null;

        // If a fetch is already in progress, return its promise
        if (this.fetchPromise) return this.fetchPromise;

        this.fetchPromise = (async () => {
            try {
                const response = await fetch(this.hubUrl, { 
                    headers: { 'Accept': 'application/json' } 
                });
                
                if (response.ok) {
                    this.cachedData = await response.json();
                    localStorage.setItem('csa_hub_content_cache', JSON.stringify(this.cachedData));
                } else {
                    console.warn(`Hub fetch failed (${response.status}). Using fallback.`);
                    this.cachedData = initialData || {};
                }
            } catch (e) {
                console.error('Network error during hub fetch:', e);
                this.cachedData = initialData || {};
            } finally {
                this.fetchPromise = null;
            }
            return this.cachedData;
        })();

        return this.fetchPromise;
    }

    /**
     * Get choir configuration
     */
    static async getConfig(): Promise<ApiResponse<ChoirConfig>> {
        const data = await this.fetchHubData();
        return {
            success: true,
            data: {
                name: data.title || choirConfig.name,
                description: data.description || choirConfig.description,
                themeColor: data.color || choirConfig.themeColor,
                socials: data.socials
            }
        };
    }

    /**
     * Submit choir registration
     */
    static async submitRegistration(registration: ChoirRegistration): Promise<ApiResponse<{ registrationId: string }>> {
        try {
            const response = await fetch(`${this.baseUrl}/registrations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registration)
            });
            const data = await response.json();
            return { success: true, data: { registrationId: data.id } };
        } catch (error) {
            return { success: false, error: 'Failed to submit registration' };
        }
    }

    /**
     * Get choir officials
     */
    static async getOfficials(): Promise<ApiResponse<ChoirOfficial[]>> {
        const data = await this.fetchHubData();
        return { success: true, data: data.officials || MOCK_DATA.officials };
    }

    /**
     * Get practice schedules
     */
    static async getSchedules(): Promise<ApiResponse<PracticeSchedule[]>> {
        const data = await this.fetchHubData();
        if (data.schedules) return { success: true, data: data.schedules };
        return { success: true, data: practiceSchedules.filter(s => s.isActive) };
    }

    /**
     * Get semester activities
     */
    static async getActivities(): Promise<ApiResponse<SemesterActivity[]>> {
        const data = await this.fetchHubData();
        const activities = data.activities || MOCK_DATA.activities;
        const mapped = activities.map((act: any) => ({
            ...act,
            date: new Date(act.activity_date || act.date)
        }));
        return { success: true, data: mapped };
    }

    /**
     * Get music classes
     */
    static async getMusicClasses(): Promise<ApiResponse<MusicClass[]>> {
        const data = await this.fetchHubData();
        return { success: true, data: data.classes || musicClasses };
    }

    /**
     * Get announcements
     */
    static async getAnnouncements(): Promise<ApiResponse<Announcement[]>> {
        const data = await this.fetchHubData();
        const announcements = data.announcements || MOCK_DATA.announcements;
        const mapped = announcements.map((ann: any) => ({
            ...ann,
            date: new Date(ann.announcement_date || ann.date)
        }));
        return { success: true, data: mapped };
    }

    /**
     * Submit class enrollment
     */
    static async enrollInClass(enrollmentData: { class_id: string, full_name: string, voice_type: string, music_level: string }): Promise<ApiResponse<{ enrollmentId: string }>> {
        try {
            const response = await fetch(`${this.baseUrl}/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(enrollmentData)
            });
            const data = await response.json();
            return { success: true, data: { enrollmentId: data.id } };
        } catch (error) {
            return { success: false, error: 'Failed to enroll in class' };
        }
    }

    /**
     * Initiate M-Pesa STK Push
     */
    static async initiateStkPush(phoneNumber: string, amount: number): Promise<ApiResponse<{ checkoutID: string }>> {
        try {
            const response = await fetch(`${this.baseUrl}/payment/stkpush`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber, amount })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to initiate payment');
            return { success: true, data: { checkoutID: data.checkoutID } };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Check payment status
     */
    static async checkPaymentStatus(checkoutID: string): Promise<ApiResponse<any>> {
        try {
            const response = await fetch(`${this.baseUrl}/payment/status/${checkoutID}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to check payment status');
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
