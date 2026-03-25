/**
 * Next Practice Countdown Component
 * Displays a live countdown to the next choir practice session.
 * Shows "Practice in Progress" when within a practice window.
 * Schedule: Tuesday 6pm–8pm, Saturday 1pm–4pm
 */

import { DOMHelpers } from '../../backend/utils/dom-helpers.js';
import { PracticeSchedule } from '../../types.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface PracticeWindow {
    schedule: PracticeSchedule;
    startDate: Date;
    endDate: Date;
}

export class NextPracticeCountdown {
    private container: HTMLElement;
    private schedules: PracticeSchedule[];
    private intervalId?: number;

    constructor(containerId: string, schedules: PracticeSchedule[]) {
        const element = document.getElementById(containerId);
        if (!element) {
            throw new Error(`Container with id "${containerId}" not found`);
        }
        this.container = element;
        this.schedules = schedules.filter(s => s.isActive);
    }

    render(): void {
        this.container.innerHTML = '';
        this.container.className = 'csa-choir-countdown';

        if (this.schedules.length === 0) {
            const msg = DOMHelpers.createElement('div', 'csa-choir-card csa-choir-text-center');
            msg.innerHTML = '<p>No upcoming practices scheduled</p>';
            this.container.appendChild(msg);
            return;
        }

        const card = DOMHelpers.createElement('div', 'csa-choir-card csa-choir-countdown__card');
        const title = DOMHelpers.createElement('h3', 'csa-choir-countdown__title');
        title.textContent = 'Next Practice';
        const body = DOMHelpers.createElement('div', 'csa-choir-countdown__body');
        body.id = 'choir-countdown-body';

        DOMHelpers.appendChildren(card, [title, body]);
        this.container.appendChild(card);

        this.tick();
        this.intervalId = window.setInterval(() => this.tick(), 1000);
    }

    private parseTime(timeStr: string): { hours: number; minutes: number } {
        const [h, m] = (timeStr || '00:00').split(':').map(Number);
        return { hours: h || 0, minutes: m || 0 };
    }

    private getWindows(): PracticeWindow[] {
        const now = new Date();
        return this.schedules.map(schedule => {
            const dayIndex = DAY_NAMES.indexOf(schedule.day);
            const startT = this.parseTime((schedule as any).startTime || (schedule as any).time || '00:00');
            const endT   = this.parseTime((schedule as any).endTime   || (schedule as any).time || '00:00');

            // Days until next occurrence (0 = today)
            let daysUntil = (dayIndex - now.getDay() + 7) % 7;

            const startDate = new Date(now);
            startDate.setDate(now.getDate() + daysUntil);
            startDate.setHours(startT.hours, startT.minutes, 0, 0);

            const endDate = new Date(startDate);
            endDate.setHours(endT.hours, endT.minutes, 0, 0);

            // If end time has already passed today, push to next week
            if (endDate <= now) {
                startDate.setDate(startDate.getDate() + 7);
                endDate.setDate(endDate.getDate() + 7);
            }

            return { schedule, startDate, endDate };
        });
    }

    private tick(): void {
        const body = document.getElementById('choir-countdown-body');
        if (!body) return;

        const now = new Date();
        const windows = this.getWindows();

        // Check if any practice is currently in progress
        const inProgress = windows.find(w => now >= w.startDate && now < w.endDate);
        if (inProgress) {
            const s = inProgress.schedule;
            const endT = this.parseTime((s as any).endTime || (s as any).time || '00:00');
            const endDate = new Date(now);
            endDate.setHours(endT.hours, endT.minutes, 0, 0);
            const remaining = Math.max(0, endDate.getTime() - now.getTime());
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);

            body.innerHTML = `
                <div class="csa-choir-countdown__in-progress">
                    <div class="csa-choir-countdown__progress-badge">🎵 Practice in Progress</div>
                    <div class="csa-choir-countdown__progress-info">
                        <strong>${s.day}</strong> &nbsp;·&nbsp; ${s.location}
                    </div>
                    <div class="csa-choir-countdown__progress-remaining">
                        Ends in <strong>${mins}m ${secs}s</strong>
                    </div>
                </div>
            `;
            return;
        }

        // Sort to find nearest upcoming practice
        windows.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        const next = windows[0];
        const diff    = next.startDate.getTime() - now.getTime();
        const days    = Math.floor(diff / 86400000);
        const hours   = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000)  / 60000);
        const seconds = Math.floor((diff % 60000)    / 1000);

        const s = next.schedule;
        const startFmt = this.formatTime12((s as any).startTime || (s as any).time || '');
        const endFmt   = this.formatTime12((s as any).endTime   || (s as any).time || '');

        body.innerHTML = `
            <div class="csa-choir-countdown__info">
                <div class="csa-choir-countdown__day">${s.day}</div>
                <div class="csa-choir-countdown__time">${startFmt} – ${endFmt}</div>
                <div class="csa-choir-countdown__location">📍 ${s.location}</div>
            </div>
            <div class="csa-choir-countdown__timer">
                <div class="csa-choir-countdown__unit">
                    <span class="csa-choir-countdown__number">${String(days).padStart(2, '0')}</span>
                    <span class="csa-choir-countdown__label">DAYS</span>
                </div>
                <div class="csa-choir-countdown__unit">
                    <span class="csa-choir-countdown__number">${String(hours).padStart(2, '0')}</span>
                    <span class="csa-choir-countdown__label">HOURS</span>
                </div>
                <div class="csa-choir-countdown__unit">
                    <span class="csa-choir-countdown__number">${String(minutes).padStart(2, '0')}</span>
                    <span class="csa-choir-countdown__label">MINUTES</span>
                </div>
                <div class="csa-choir-countdown__unit">
                    <span class="csa-choir-countdown__number">${String(seconds).padStart(2, '0')}</span>
                    <span class="csa-choir-countdown__label">SECONDS</span>
                </div>
            </div>
        `;
    }

    private formatTime12(timeStr: string): string {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    destroy(): void {
        if (this.intervalId) clearInterval(this.intervalId);
        DOMHelpers.clearElement(this.container);
    }
}
