/**
 * Specialized validator utilities for the community hub
 */
export class Validators {
    /**
     * Common form input validations
     */
    static isRequired(value: any) {
        return value !== null && value !== undefined && value.trim() !== '';
    }

    static isEmail(value: any) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(value);
    }

    static isPhone(value: any) {
        // Simple phone regex for basic format
        const regex = /^\+?[0-9\s-]{10,15}$/;
        return regex.test(value);
    }

    static validateRegistrationForm(formData: any, isChoir: boolean = true) {
        const errors: Array<{ field: string, message: string }> = [];
        if (!this.isRequired(formData.fullName)) errors.push({ field: 'fullName', message: 'Full name is required' });
        if (!this.isPhone(formData.phoneNumber)) errors.push({ field: 'phoneNumber', message: 'Valid phone is required' });
        
        if (isChoir) {
            if (!this.isRequired(formData.voiceType)) errors.push({ field: 'voiceType', message: 'Voice type is required' });
            if (!this.isRequired(formData.skillLevel)) errors.push({ field: 'skillLevel', message: 'Skill level is required' });
        }
        
        if (!formData.hasAgreed) errors.push({ field: 'hasAgreed', message: 'You must agree to the terms' });
        return errors;
    }
}
