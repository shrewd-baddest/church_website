/**
 * Date Helper Utilities
 * Specialized functions for formatting dates in the community hub
 */
export class DateHelpers {
    /**
     * Format a date into a localized string
     */
    static format(date: any, formatOptions: any = { month: 'long', day: 'numeric', year: 'numeric' }) {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString(undefined, formatOptions);
    }

    static formatDate(date: any) {
        return this.format(date);
    }

    static getNextOccurrence(dayOfWeek: any, timeStr: any) {
        if (!timeStr) return new Date();
        const [hours, minutes] = timeStr.split(':').map(Number);
        const now = new Date();
        const next = new Date(now);
        
        const daysUntilNext = (dayOfWeek + 7 - now.getDay()) % 7;
        next.setDate(now.getDate() + daysUntilNext);
        next.setHours(hours || 0, minutes || 0, 0, 0);
        
        if (next < now) {
            next.setDate(next.getDate() + 7);
        }
        
        return next;
    }

    static formatTime(timeStr: any) {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
             const h = parseInt(parts[0], 10);
             const ampm = h >= 12 ? 'PM' : 'AM';
             const hours = h % 12 || 12;
             return `${hours}:${parts[1]} ${ampm}`;
        }
        return timeStr;
    }

    static calculateCountdown(targetDate: any) {
        const now = new Date();
        const difference = new Date(targetDate).getTime() - now.getTime();
        
        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        
        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        };
    }
}
