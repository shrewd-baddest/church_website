/**
 * Hub Landing Page
 * TypeScript component implementing the ministry grid
 */

import { ApiResponse } from '../../types.js';

interface HubModule {
    id: string;
    title: string;
    description: string;
    path: string;
    color: string;
    icon: string;
    iconColor?: string;
}

export class HubLandingPage {
    private containerId: string;
    private baseUrl = '/hub-view/data';

    constructor(containerId: string) {
        this.containerId = containerId;
    }

    async init(): Promise<void> {
        try {
            const response = await fetch(this.baseUrl);
            if (!response.ok) throw new Error('Failed to fetch hub data');
            
            const modules: HubModule[] = await response.json();
            this.render(modules);
        } catch (error) {
            console.error('Failed to initialize community hub:', error);
            this.showError();
        }
    }

    private render(modules: HubModule[]): void {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = ''; // Clear loading

        modules.forEach(mod => {
            const card = this.createModuleCard(mod);
            container.appendChild(card);
        });
    }

    private createModuleCard(mod: HubModule): HTMLElement {
        const a = document.createElement('a');
        a.className = 'csa-hub-card csa-hub-card--glow';
        
        // Always use the proxied path provided by the backend meta
        a.href = mod.path; 


        a.style.setProperty('--card-icon-color', mod.color);

        a.innerHTML = `
            <div class="csa-hub-card__icon">
                <i class="${mod.icon}"></i>
                <span class="csa-hub-card__dot"></span>
            </div>
            <div class="csa-hub-card__content">
                <span class="csa-hub-category">Ministry</span>
                <h3>${mod.title}</h3>
                <p>${mod.description}</p>
            </div>
            <div class="csa-hub-card__footer">
                <span class="csa-hub-btn-portal">Explore Portal <i class="fas fa-chevron-right"></i></span>
            </div>
        `;

        return a;
    }

    private showError(): void {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="csa-choir-alert csa-choir-alert--error">
                    <strong>Error:</strong> Failed to load the Sacred Ministries. Please refresh the page.
                </div>
            `;
        }
    }
}
