/**
 * Choir API Service Layer
 * Placeholder service for backend integration
 * Replace mock implementations with actual API calls
 */

import {
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

export class ChoirApiService {
    private static baseUrl = '/api';
    private static get hubUrl() {
        return window.location.pathname;
    }

    private static cachedData: any = null;

    /**
     * Fetch all module data at once and cache
     */
    private static async fetchHubData() {
        if (!this.cachedData) {
            try {
                // Ensure Accept header asks for JSON
                const response = await fetch(this.hubUrl, { headers: { 'Accept': 'application/json' } });
                if (response.ok) {
                    this.cachedData = await response.json();
                } else {
                    this.cachedData = {};
                }
            } catch (e) {
                console.error('Failed to fetch hub data:', e);
                this.cachedData = {};
            }
        }
        return this.cachedData;
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
        return { success: true, data: data.officials || [] };
    }

    /**
     * Get practice schedules
     */
    static async getSchedules(): Promise<ApiResponse<PracticeSchedule[]>> {
        const data = await this.fetchHubData();
        // Return schedules if backend provides it, else fallback for Choir only
        if (data.schedules) return { success: true, data: data.schedules };
        
        if (data.title && data.title.includes('Choir')) {
            return { success: true, data: practiceSchedules.filter(s => s.isActive) };
        }
        return { success: true, data: [] };
    }

    /**
     * Get semester activities
     */
    static async getActivities(): Promise<ApiResponse<SemesterActivity[]>> {
        const data = await this.fetchHubData();
        const activities = data.activities || [];
        const mapped = activities.map((act: any) => ({
            ...act,
            date: new Date(act.date)
        }));
        return { success: true, data: mapped };
    }

    /**
     * Get music classes
     */
    static async getMusicClasses(): Promise<ApiResponse<MusicClass[]>> {
        const data = await this.fetchHubData();
        if (data.classes) return { success: true, data: data.classes };
        
        if (data.title && data.title.includes('Choir')) {
            return { success: true, data: musicClasses };
        }
        return { success: true, data: [] };
    }

    /**
     * Get announcements
     */
    static async getAnnouncements(): Promise<ApiResponse<Announcement[]>> {
        const data = await this.fetchHubData();
        const announcements = data.announcements || [];
        const mapped = announcements.map((ann: any) => ({
            ...ann,
            date: new Date(ann.date)
        }));
        return { success: true, data: mapped };
    }

    /**
     * Submit class enrollment
     */
    static async enrollInClass(enrollmentData: { classId: string, fullName: string, email: string, phone: string }): Promise<ApiResponse<{ enrollmentId: string }>> {
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
