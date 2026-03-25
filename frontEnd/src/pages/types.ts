export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface ChoirConfig {
    name: string;
    description: string;
    themeColor: string;
    logoUrl?: string;
    socials?: Record<string, string>;
}

export interface ChoirOfficial {
    id: string;
    name: string;
    position?: string;
    role?: string;
    imageUrl?: string;
    photoUrl?: string;
    bio?: string;
    email?: string;
    phoneNumber?: string;
}

export interface PracticeSchedule {
    id: string;
    day: string;
    time?: string;
    startTime?: string;
    endTime?: string;
    location: string;
    isActive: boolean;
}

export interface SemesterActivity {
    id: string;
    title: string;
    date: Date | string;
    description: string;
    location: string;
    status: ActivityStatus;
}

export type ActivityStatus = 'Upcoming' | 'Past' | 'Ongoing';

export interface SocialMediaLink {
    platform: 'YouTube' | 'TikTok' | 'WhatsApp';
    url: string;
    iconClass: string;
}

export interface MusicClass {
    id: string;
    name?: string;
    title?: string;
    instructor: string;
    schedule: string;
    description: string;
    skillLevel?: string;
}

export interface NextPractice {
    id?: string;
    date: Date;
    dayName?: string;
    time?: string;
    location: string;
    title?: string;
    countdown?: any;
}

export interface Announcement {
    id: string;
    title: string;
    content?: string;
    message?: string;
    date: Date | string;
    priority?: 'low' | 'medium' | 'high';
}

export interface ChoirRegistration {
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    phoneNumber?: string;
    voiceType?: VoiceType;
    voicePart?: string;
    fullName?: string;
    registrationNumber?: string;
    skillLevel?: SkillLevel;
    hasAgreed?: boolean;
    timestamp?: Date;
}

export type VoiceType = 'Soprano' | 'Alto' | 'Tenor' | 'Bass';
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface RegistrationFormState {
    data?: any;
    errors: Array<{ field: string, message: string }>;
    isSubmitting: boolean;
    serverMessage?: { type: 'success' | 'error', text: string } | null;
}
