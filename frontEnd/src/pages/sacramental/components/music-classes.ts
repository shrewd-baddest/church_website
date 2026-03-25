/**
 * Music Classes Component
 * Displays available music classes with enrollment
 */

import { DOMHelpers } from '../../backend/utils/dom-helpers.js';
import { ChoirApiService } from '../services/choir-api.js';
import { MusicClass } from '../../types.js';

export class MusicClasses {
    private container: HTMLElement;
    private classes: MusicClass[];

    constructor(containerId: string, classes: MusicClass[]) {
        const element = document.getElementById(containerId);
        if (!element) {
            throw new Error(`Container with id "${containerId}" not found`);
        }
        this.container = element;
        this.classes = classes;
    }

    render(): void {
        this.container.innerHTML = '';
        this.container.className = 'csa-choir-music-classes csa-choir-section';

        const containerDiv = DOMHelpers.createElement('div', 'csa-choir-container');

        const title = DOMHelpers.createElement('h2', 'csa-choir-music-classes__title');
        title.textContent = 'Music Classes';

        const subtitle = DOMHelpers.createElement('p', 'csa-choir-music-classes__subtitle');
        subtitle.textContent = 'Enhance your musical skills with our structured classes';

        const grid = DOMHelpers.createElement('div', 'csa-choir-grid csa-choir-grid--3-cols');

        this.classes.forEach(musicClass => {
            const card = this.createClassCard(musicClass);
            grid.appendChild(card);
        });

        DOMHelpers.appendChildren(containerDiv, [title, subtitle, grid]);
        this.container.appendChild(containerDiv);
    }

    private createClassCard(musicClass: MusicClass): HTMLElement {
        const card = DOMHelpers.createElement('div', 'csa-choir-card csa-choir-music-classes__card');

        const header = DOMHelpers.createElement('div', 'csa-choir-music-classes__header');

        const title = DOMHelpers.createElement('h3', 'csa-choir-music-classes__class-title');
        title.textContent = musicClass.title;

        const badge = DOMHelpers.createElement('span', `csa-choir-badge csa-choir-badge--skill-${(musicClass.skillLevel || 'Beginner').toLowerCase()}`);
        badge.textContent = musicClass.skillLevel || 'Beginner';

        DOMHelpers.appendChildren(header, [title, badge]);

        const description = DOMHelpers.createElement('p', 'csa-choir-music-classes__description');
        description.textContent = musicClass.description;

        const schedule = DOMHelpers.createElement('div', 'csa-choir-music-classes__schedule');
        schedule.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      ${musicClass.schedule}
    `;

        const enrollBtn = DOMHelpers.createElement('button', 'csa-choir-btn csa-choir-btn--primary csa-choir-btn--full-width', {
            'data-class-id': musicClass.id
        });
        enrollBtn.textContent = 'Enroll Now';
        enrollBtn.addEventListener('click', () => this.showEnrollmentModal(musicClass));

        DOMHelpers.appendChildren(card, [header, description, schedule, enrollBtn]);

        return card;
    }

    private showEnrollmentModal(musicClass: MusicClass): void {
        const modalOverlay = DOMHelpers.createElement('div', 'csa-choir-modal-overlay');
        const modal = DOMHelpers.createElement('div', 'csa-choir-modal');

        modal.innerHTML = `
            <div class="csa-choir-modal__header">
                <h3>Enroll: ${musicClass.title}</h3>
                <button class="csa-choir-modal__close">&times;</button>
            </div>
            <form class="csa-choir-modal__form">
                <div class="csa-choir-form-group">
                    <label class="csa-choir-label">Full Name</label>
                    <input type="text" name="fullName" class="csa-choir-input" required placeholder="Your full name">
                </div>
                <div class="csa-choir-form-group">
                    <label class="csa-choir-label">Email</label>
                    <input type="email" name="email" class="csa-choir-input" required placeholder="your.email@example.com">
                </div>
                <div class="csa-choir-form-group">
                    <label class="csa-choir-label">Phone Number</label>
                    <input type="tel" name="phone" class="csa-choir-input" required placeholder="e.g. 0712345678">
                </div>
                <button type="submit" class="csa-choir-btn csa-choir-btn--primary csa-choir-btn--full-width">
                    Submit Enrollment
                </button>
            </form>
        `;

        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);

        const closeBtn = modal.querySelector('.csa-choir-modal__close');
        closeBtn?.addEventListener('click', () => modalOverlay.remove());

        modalOverlay.addEventListener('click', (e: any) => {
            if (e.target === modalOverlay) modalOverlay.remove();
        });

        const form = modal.querySelector('form');
        form?.addEventListener('submit', async (e: any) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
            const originalText = submitBtn.textContent;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="csa-choir-loading"></span> Submitting...';

            const formData = new FormData(form);
            const enrollmentData = {
                classId: musicClass.id,
                fullName: formData.get('fullName') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string
            };

            const response = await ChoirApiService.enrollInClass(enrollmentData);

            if (response.success) {
                modal.innerHTML = `
                    <div class="csa-choir-modal__success">
                        <div class="csa-choir-success-icon">✓</div>
                        <h3>Successfully Enrolled!</h3>
                        <p>You have joined <strong>${musicClass.title}</strong>.</p>
                        <button class="csa-choir-btn csa-choir-btn--secondary csa-choir-btn--full-width">Close</button>
                    </div>
                `;
                const closeSuccess = modal.querySelector('button');
                closeSuccess?.addEventListener('click', () => {
                    modalOverlay.remove();
                    const mainEnrollBtn = this.container.querySelector(`[data-class-id="${musicClass.id}"]`) as HTMLButtonElement;
                    if (mainEnrollBtn) {
                        mainEnrollBtn.textContent = '✓ Enrolled';
                        mainEnrollBtn.disabled = true;
                        mainEnrollBtn.classList.remove('csa-choir-btn--primary');
                        mainEnrollBtn.classList.add('csa-choir-btn--secondary');
                    }
                });
            } else {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                alert(response.error || 'Failed to enroll. Please try again.');
            }
        });
    }

    destroy(): void {
        DOMHelpers.clearElement(this.container);
    }
}
