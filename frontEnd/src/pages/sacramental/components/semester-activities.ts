/**
 * Semester Activities Component
 * Displays upcoming and past semester activities
 */

import { DOMHelpers } from '../../backend/utils/dom-helpers';
import { DateHelpers } from '../../backend/utils/date-helpers';
import { SemesterActivity, ActivityStatus } from '../../types';

export class SemesterActivities {
    private container: HTMLElement;
    private activities: SemesterActivity[];

    constructor(containerId: string, activities: SemesterActivity[]) {
        const element = document.getElementById(containerId);
        if (!element) {
            throw new Error(`Container with id "${containerId}" not found`);
        }
        this.container = element;
        this.activities = activities.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    render(): void {
        this.container.innerHTML = '';
        this.container.className = 'csa-choir-activities csa-choir-section';

        const containerDiv = DOMHelpers.createElement('div', 'csa-choir-container');

        const title = DOMHelpers.createElement('h2', 'csa-choir-activities__title');
        title.textContent = 'Semester Activities';

        const list = DOMHelpers.createElement('div', 'csa-choir-activities__list');

        this.activities.forEach(activity => {
            const card = this.createActivityCard(activity);
            list.appendChild(card);
        });

        DOMHelpers.appendChildren(containerDiv, [title, list]);
        this.container.appendChild(containerDiv);
    }

    private createActivityCard(activity: SemesterActivity): HTMLElement {
        const card = DOMHelpers.createElement('div', 'csa-choir-card csa-choir-activities__card');

        const header = DOMHelpers.createElement('div', 'csa-choir-activities__header');

        const titleContainer = DOMHelpers.createElement('div', 'csa-choir-activities__title-container');

        const title = DOMHelpers.createElement('h3', 'csa-choir-activities__card-title');
        title.textContent = activity.title;

        const badge = this.createStatusBadge(activity.status);

        DOMHelpers.appendChildren(titleContainer, [title, badge]);

        const date = DOMHelpers.createElement('div', 'csa-choir-activities__date');
        date.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      ${DateHelpers.formatDate(activity.date)}
    `;

        header.appendChild(titleContainer);

        const description = DOMHelpers.createElement('p', 'csa-choir-activities__description');
        description.textContent = activity.description;

        const footer = DOMHelpers.createElement('div', 'csa-choir-activities__footer');

        if (activity.location) {
            const location = DOMHelpers.createElement('div', 'csa-choir-activities__location');
            location.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        ${activity.location}
      `;
            footer.appendChild(location);
        }

        footer.appendChild(date);

        DOMHelpers.appendChildren(card, [header, description, footer]);

        return card;
    }

    private createStatusBadge(status?: ActivityStatus): HTMLElement {
        const safeStatus = status || 'Upcoming';
        const badge = DOMHelpers.createElement('span', `csa-choir-badge csa-choir-badge--${safeStatus.toLowerCase()}`);
        badge.textContent = safeStatus;
        return badge;
    }

    destroy(): void {
        DOMHelpers.clearElement(this.container);
    }
}
