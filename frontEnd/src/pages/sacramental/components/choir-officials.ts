/**
 * Choir Officials Component
 * Displays choir leadership team
 */

import { DOMHelpers } from '../../backend/utils/dom-helpers';
import { ChoirOfficial } from '../../types';

export class ChoirOfficials {
    private container: HTMLElement;
    private officials: ChoirOfficial[];

    constructor(containerId: string, officials: ChoirOfficial[]) {
        const element = document.getElementById(containerId);
        if (!element) {
            throw new Error(`Container with id "${containerId}" not found`);
        }
        this.container = element;
        this.officials = officials;
    }

    render(): void {
        this.container.innerHTML = '';
        this.container.className = 'csa-choir-officials csa-choir-section';

        const containerDiv = DOMHelpers.createElement('div', 'csa-choir-container');

        const title = DOMHelpers.createElement('h2', 'csa-choir-officials__title');
        title.textContent = 'Choir Officials';

        const grid = DOMHelpers.createElement('div', 'csa-choir-grid csa-choir-grid--4-cols');

        this.officials.forEach(official => {
            const card = this.createOfficialCard(official);
            grid.appendChild(card);
        });

        DOMHelpers.appendChildren(containerDiv, [title, grid]);
        this.container.appendChild(containerDiv);
    }

    private createOfficialCard(official: ChoirOfficial): HTMLElement {
        const card = DOMHelpers.createElement('div', 'csa-choir-official-card');

        const imageContainer = DOMHelpers.createElement('div', 'csa-choir-official-card__photo-container');

        const image = DOMHelpers.createElement('img', 'csa-choir-official-card__photo', {
            src: official.photoUrl || this.getPlaceholderImage(),
            alt: `${official.name} - ${official.role}`,
            loading: 'lazy'
        });

        imageContainer.appendChild(image);

        const name = DOMHelpers.createElement('h3', 'csa-choir-official-card__name');
        name.textContent = official.name;

        const role = DOMHelpers.createElement('p', 'csa-choir-official-card__role');
        role.textContent = official.role;

        const contactContainer = this.createContactSection(official);

        DOMHelpers.appendChildren(card, [imageContainer, name, role]);

        if (contactContainer) {
            card.appendChild(contactContainer);
        }

        return card;
    }

    private createContactSection(official: ChoirOfficial): HTMLElement | null {
        if (!official.email && !official.phoneNumber) return null;

        const container = DOMHelpers.createElement('div', 'csa-choir-official-card__contact');

        if (official.email) {
            const emailLink = DOMHelpers.createElement('a', 'csa-choir-btn csa-choir-btn--email', {
                href: `mailto:${official.email}`,
                title: `Email ${official.name}`
            });
            emailLink.innerHTML = `📧 <span>${official.email}</span>`;
            container.appendChild(emailLink);
        }

        if (official.phoneNumber) {
            const callLink = DOMHelpers.createElement('a', 'csa-choir-btn csa-choir-btn--call', {
                href: `tel:${official.phoneNumber}`,
                title: `Call ${official.name}`
            });
            callLink.innerHTML = `📞 <span>${official.phoneNumber}</span>`;
            container.appendChild(callLink);
        }

        return container;
    }

    private getPlaceholderImage(): string {
        return 'https://via.placeholder.com/150/c0c0c0/ffffff?text=User';
    }

    destroy(): void {
        DOMHelpers.clearElement(this.container);
    }
}
