import { HubMessenger } from '../services/HubMessenger.js';

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
    private baseUrl = '/community-view/data';
    private CACHE_KEY = 'csa_hub_modules_cache';
    
    // Default fallback content to ensure UI is never blank
    private mockModules: HubModule[] = [
        {
            id: 'choir',
            title: 'St. Cecilia Choir',
            description: 'Join our liturgical choir and lead the congregation in sacred worship through music.',
            path: '/community-view/choir',
            color: '#2c3e50',
            icon: 'fas fa-music'
        },
        {
            id: 'dancers',
            title: 'Liturgical Dancers',
            description: 'Express faith through graceful movements and traditional praise dances during Mass.',
            path: '/community-view/dancers',
            color: '#e67e22',
            icon: 'fas fa-child'
        },
        {
            id: 'charismatic',
            title: 'Charismatic Group',
            description: 'Deepen your spiritual life through exuberant prayer, worship, and fellowship.',
            path: '/community-view/charismatic',
            color: '#c0392b',
            icon: 'fas fa-fire'
        }
    ];

    constructor(containerId: string) {
        this.containerId = containerId;
    }

    async init(): Promise<void> {
        // 1. Instantly show loading state or cached content
        const cached = this.getCachedData();
        if (cached) {
            // Render cached silently (no banner) while we fetch fresh data
            this.render(cached, false); 
        } else {
            this.showLoading();
        }

        // 2. Fetch fresh data
        try {
            HubMessenger.notifyModuleLoaded(null);
            this.showSyncingStatus();

            const response = await fetch(this.baseUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const modules: HubModule[] = await response.json();
            
            if (modules && modules.length > 0) {
                this.saveToCache(modules);
                this.render(modules); // Banner disappears here as isCached will be false
            } else if (!cached) {
                this.showEmpty();
            }
        } catch (error) {
            console.error('Community Hub Fetch Error:', error);
            
            // 3. Fallback logic: Use cache -> Use Mock -> Show Error
            if (cached) {
                console.info('Using cached data after fetch failure');
                this.render(cached, true); // Now show the banner because fetch failed
            } else {
                console.info('Using mock fallback data');
                this.render(this.mockModules, false, true);
            }
        } finally {
            const spinner = (window as any)._hubSpinner;
            if (spinner) {
                spinner.remove();
                delete (window as any)._hubSpinner;
            }
        }
    }

    private showLoading(): void {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${Array(3).fill(0).map(() => `
                    <div class="bg-gray-100 rounded-2xl p-6 h-64 animate-pulse">
                        <div class="w-16 h-16 bg-gray-200 rounded-2xl mb-6"></div>
                        <div class="w-2/3 h-6 bg-gray-200 rounded mb-4"></div>
                        <div class="w-full h-4 bg-gray-200 rounded mb-2"></div>
                        <div class="w-5/6 h-4 bg-gray-200 rounded"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    private showEmpty(): void {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="csa-choir-text-center w-full py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                <i class="fas fa-folder-open text-gray-300 text-5xl mb-4"></i>
                <h3 class="text-xl font-bold text-gray-500">No ministries found</h3>
                <p class="text-gray-400">We couldn't find any active ministry modules at the moment.</p>
                <button onclick="window.location.reload()" class="csa-choir-btn csa-choir-btn--primary csa-choir-mt-md">
                    <i class="fas fa-sync-alt mr-2"></i> Refresh
                </button>
            </div>
        `;
    }

    private showSyncingStatus(): void {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const spinner = document.createElement('div');
        spinner.id = 'hub-syncing-indicator';
        spinner.style.position = 'fixed';
        spinner.style.right = '20px';
        spinner.style.top = '20px';
        spinner.style.display = 'flex';
        spinner.style.alignItems = 'center';
        spinner.style.gap = '8px';
        spinner.style.background = 'rgba(255, 255, 255, 0.9)';
        spinner.style.padding = '8px 12px';
        spinner.style.borderRadius = '99px';
        spinner.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        spinner.style.fontSize = '12px';
        spinner.style.color = '#666';
        spinner.style.zIndex = '9999';
        spinner.innerHTML = '<i class="fas fa-sync fa-spin"></i> Syncing...';
        
        document.body.appendChild(spinner);
        (window as any)._hubSpinner = spinner;
    }


    private render(modules: HubModule[], isCached = false, isMock = false): void {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = ''; 

        // Add a small indicator if data is not fresh
        if (isMock || isCached) {
            const status = document.createElement('div');
            status.className = 'w-full mb-6 py-2 px-4 rounded-lg text-sm flex items-center gap-2 ' + 
                              (isMock ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200');
            status.innerHTML = `
                <i class="fas ${isMock ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                <span>${isMock ? 'Offline Mode: Showing default ministries.' : 'Showing previously saved content.'}</span>
                <button onclick="window.location.reload()" class="ml-auto underline font-bold">Try Refresh</button>
            `;
            container.appendChild(status);
        }

        modules.forEach(mod => {
            const card = this.createModuleCard(mod);
            container.appendChild(card);
        });
    }

    private createModuleCard(mod: HubModule): HTMLElement {
        const a = document.createElement('a');
        a.className = 'csa-hub-card csa-hub-card--glow';
        a.href = 'javascript:void(0)';
        a.onclick = (e) => {
            e.preventDefault();
            HubMessenger.requestParentNavigate(mod.id);
        };

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
                <span class="csa-hub-btn-portal">
                    Explore Portal 
                    <i class="fas fa-arrow-right"></i>
                </span>
            </div>
        `;

        return a;
    }

    private saveToCache(data: HubModule[]): void {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: data
            }));
        } catch (e) {
            console.error('Failed to save hub cache', e);
        }
    }

    private getCachedData(): HubModule[] | null {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                // Optional: Check if cache is too old (e.g., 24 hours)
                return parsed.data;
            }
        } catch (e) {
            console.error('Failed to parse hub cache', e);
        }
        return null;
    }
}

