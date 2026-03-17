/**
 * Hero Section Component
 * Main landing section with choir description and CTA
 */

import { DOMHelpers } from '../../backend/utils/dom-helpers';
import { ChoirConfig } from '../../types';

export class HeroSection {
    private container: HTMLElement;
    private config: ChoirConfig;

    constructor(containerId: string, config: ChoirConfig) {
        const element = document.getElementById(containerId);
        if (!element) {
            throw new Error(`Container with id "${containerId}" not found`);
        }
        this.container = element;
        this.config = config;
    }

    render(): void {
        this.container.innerHTML = '';
        this.container.className = 'csa-choir-hero';

        const heroContent = DOMHelpers.createElement('div', 'csa-choir-hero__content csa-choir-container');

        const heading = DOMHelpers.createElement('h1', 'csa-choir-hero__title');
        heading.textContent = this.config.name;

        const description = DOMHelpers.createElement('p', 'csa-choir-hero__description');
        description.textContent = this.config.description;

        const ctaButton = DOMHelpers.createElement('a', 'csa-choir-btn csa-choir-btn--accent csa-choir-hero__cta', {
            href: '#registration',
            'aria-label': 'Join the choir'
        });
        ctaButton.textContent = 'Join Choir';

        DOMHelpers.appendChildren(heroContent, [heading, description, ctaButton]);
        this.container.appendChild(heroContent);
    }

    destroy(): void {
        DOMHelpers.clearElement(this.container);
    }
}
