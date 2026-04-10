/**
 * Announcements Component
 * Displays recent choir announcements
 */

import { DOMHelpers } from '../../backend/utils/dom-helpers';
import { DateHelpers } from '../../backend/utils/date-helpers';
import { Announcement } from '../../types';

export class Announcements {
    private container: HTMLElement;
    private announcements: Announcement[];

    constructor(containerId: string, announcements: Announcement[]) {
        const element = document.getElementById(containerId);
        if (!element) {
            throw new Error(`Container with id "${containerId}" not found`);
        }
        this.container = element;
        this.announcements = announcements.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    render(): void {
        this.container.innerHTML = '';
        this.container.className = 'csa-choir-announcements';

        const card = DOMHelpers.createElement('div', 'csa-choir-card csa-choir-announcements__card');

        const title = DOMHelpers.createElement('h3', 'csa-choir-announcements__title');
        title.textContent = 'Announcements';

        const list = DOMHelpers.createElement('div', 'csa-choir-announcements__list');

        this.announcements.forEach(announcement => {
            const item = this.createAnnouncementItem(announcement);
            list.appendChild(item);
        });

        DOMHelpers.appendChildren(card, [title, list]);
        this.container.appendChild(card);
    }

    private createAnnouncementItem(announcement: Announcement): HTMLElement {
        const item = DOMHelpers.createElement('div', 'csa-choir-announcements__item');

        const header = DOMHelpers.createElement('div', 'csa-choir-announcements__header');

        const itemTitle = DOMHelpers.createElement('h4', 'csa-choir-announcements__item-title');
        itemTitle.textContent = announcement.title;

        const priority = announcement.priority || 'low';
        const badge = DOMHelpers.createElement('span', `csa-choir-badge csa-choir-badge--priority-${priority}`);
        badge.textContent = priority.toUpperCase();

        DOMHelpers.appendChildren(header, [itemTitle, badge]);

        const message = DOMHelpers.createElement('p', 'csa-choir-announcements__message');
        message.textContent = announcement.message || announcement.content || '';

        const date = DOMHelpers.createElement('div', 'csa-choir-announcements__date');
        date.textContent = DateHelpers.formatDate(announcement.date);

        DOMHelpers.appendChildren(item, [header, message, date]);

        return item;
    }

    destroy(): void {
        DOMHelpers.clearElement(this.container);
    }
}
