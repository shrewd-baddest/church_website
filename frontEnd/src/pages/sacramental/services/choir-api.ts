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
} from '../../types';

import {
    choirConfig,
    practiceSchedules,
    musicClasses
} from '../../backend/community-hub/data/mock-data';

export class ChoirApiService {
    private static baseUrl = '/api';

    /**
     * Get choir configuration
     */
    static async getConfig(): Promise<ApiResponse<ChoirConfig>> {
        try {
            return {
                success: true,
                data: choirConfig
            };
        } catch (error) {
            return { success: false, error: 'Failed to fetch choir configuration' };
        }
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
        try {
            const response = await fetch(`${this.baseUrl}/officials`);
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: 'Failed to fetch officials' };
        }
    }

    /**
     * Get practice schedules
     */
    static async getSchedules(): Promise<ApiResponse<PracticeSchedule[]>> {
        try {
            return {
                success: true,
                data: practiceSchedules.filter(s => s.isActive)
            };
        } catch (error) {
            return { success: false, error: 'Failed to fetch schedules' };
        }
    }

    /**
     * Get semester activities
     */
    static async getActivities(): Promise<ApiResponse<SemesterActivity[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/activities`);
            const data = await response.json();
            const mapped = data.map((act: any) => ({
                ...act,
                date: new Date(act.date)
            }));
            return { success: true, data: mapped };
        } catch (error) {
            return { success: false, error: 'Failed to fetch activities' };
        }
    }

    /**
     * Get music classes
     */
    static async getMusicClasses(): Promise<ApiResponse<MusicClass[]>> {
        try {
            return {
                success: true,
                data: musicClasses
            };
        } catch (error) {
            return { success: false, error: 'Failed to fetch music classes' };
        }
    }

    /**
     * Get announcements
     */
    static async getAnnouncements(): Promise<ApiResponse<Announcement[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/announcements`);
            const data = await response.json();
            const mapped = data.map((ann: any) => ({
                ...ann,
                date: new Date(ann.date)
            }));
            return { success: true, data: mapped };
        } catch (error) {
            return { success: false, error: 'Failed to fetch announcements' };
        }
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
