/**
 * Practice Schedule Component
 * Displays all active practice schedules
 */

import { DOMHelpers } from '../../backend/utils/dom-helpers.js';
import { DateHelpers } from '../../backend/utils/date-helpers.js';
import { PracticeSchedule } from '../../types.js';

export class PracticeScheduleList {
    private container: HTMLElement;
    private schedules: PracticeSchedule[];

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
        this.container.className = 'csa-choir-schedule csa-choir-section';

        const containerDiv = DOMHelpers.createElement('div', 'csa-choir-container');

        const title = DOMHelpers.createElement('h2', 'csa-choir-schedule__title');
        title.textContent = 'Practice Schedule';

        const grid = DOMHelpers.createElement('div', 'csa-choir-grid csa-choir-grid--2-cols');

        this.schedules.forEach(schedule => {
            const card = this.createScheduleCard(schedule);
            grid.appendChild(card);
        });

        DOMHelpers.appendChildren(containerDiv, [title, grid]);
        this.container.appendChild(containerDiv);
    }

    private createScheduleCard(schedule: PracticeSchedule): HTMLElement {
        const card = DOMHelpers.createElement('div', 'csa-choir-card csa-choir-schedule__card');

        card.innerHTML = `
      <div class="csa-choir-schedule__day">${schedule.day}</div>
      <div class="csa-choir-schedule__time">
        ${DateHelpers.formatTime(schedule.startTime)} - ${DateHelpers.formatTime(schedule.endTime)}
      </div>
      <div class="csa-choir-schedule__location">
        <svg class="csa-choir-schedule__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        ${schedule.location}
      </div>
    `;

        return card;
    }

    destroy(): void {
        DOMHelpers.clearElement(this.container);
    }
}
