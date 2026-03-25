/**
 * How to Join Section Component
 * Step-by-step guide for joining the choir
 */

import { DOMHelpers } from '../../backend/utils/dom-helpers.js';

export class HowToJoin {
    private container: HTMLElement;

    constructor(containerId: string) {
        const element = document.getElementById(containerId);
        if (!element) {
            throw new Error(`Container with id "${containerId}" not found`);
        }
        this.container = element;
    }

    render(): void {
        this.container.innerHTML = '';
        this.container.className = 'csa-choir-how-to-join csa-choir-section';

        const containerDiv = DOMHelpers.createElement('div', 'csa-choir-container');

        const title = DOMHelpers.createElement('h2', 'csa-choir-how-to-join__title');
        title.textContent = 'How to Join';

        const steps = this.createSteps();

        DOMHelpers.appendChildren(containerDiv, [title, steps]);
        this.container.appendChild(containerDiv);
    }

    private createSteps(): HTMLElement {
        const stepsContainer = DOMHelpers.createElement('div', 'csa-choir-how-to-join__steps');

        const stepsData = [
            {
                number: 1,
                title: 'Fill Registration Form',
                description: 'Complete the online registration form with your details and select your voice type.'
            },
            {
                number: 2,
                title: 'Pay Membership Fee',
                description: 'Pay the Ksh 20 membership fee to the Choir Treasurer upon approval.'
            },
            {
                number: 3,
                title: 'Await Approval',
                description: 'Your application will be reviewed by the choir leadership team within 3-5 business days.'
            },
            {
                number: 4,
                title: 'Attend Orientation',
                description: 'Once approved, attend the choir orientation session to learn about our routines and expectations.'
            },
            {
                number: 5,
                title: 'Join Practices',
                description: 'Start attending regular choir practices and become part of our musical community!'
            }
        ];

        stepsData.forEach(step => {
            const stepCard = this.createStepCard(step);
            stepsContainer.appendChild(stepCard);
        });

        return stepsContainer;
    }

    private createStepCard(step: { number: number; title: string; description: string }): HTMLElement {
        const card = DOMHelpers.createElement('div', 'csa-choir-card csa-choir-how-to-join__step');

        const numberCircle = DOMHelpers.createElement('div', 'csa-choir-how-to-join__number');
        numberCircle.textContent = step.number.toString();

        const content = DOMHelpers.createElement('div', 'csa-choir-how-to-join__content');

        const title = DOMHelpers.createElement('h3', 'csa-choir-how-to-join__step-title');
        title.textContent = step.title;

        const description = DOMHelpers.createElement('p', 'csa-choir-how-to-join__step-description');
        description.textContent = step.description;

        DOMHelpers.appendChildren(content, [title, description]);
        DOMHelpers.appendChildren(card, [numberCircle, content]);

        return card;
    }

    destroy(): void {
        DOMHelpers.clearElement(this.container);
    }
}
