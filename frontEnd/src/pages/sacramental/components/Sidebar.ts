/**
 * Sidebar Component
 * Handles navigation logic, active state highlighting, and mobile toggle
 */

export class Sidebar {
    private containerId: string;
    private sections: { id: string, label: string }[];

    constructor(containerId: string) {
        this.containerId = containerId;
        // Simplified labels to match the clean reference style
        this.sections = [
            { id: 'choir-announcements', label: 'Announcements' },
            { id: 'registration', label: 'Registration' },
            { id: 'choir-schedule', label: 'Schedule' },
            { id: 'choir-activities', label: 'Activities' },
            { id: 'choir-officials', label: 'Officials' },
            { id: 'choir-music-classes', label: 'Music Classes' },
            { id: 'choir-social', label: 'Channels' }
        ];
    }

    public render(): void {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Sidebar container '${this.containerId}' not found.`);
            return;
        }

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'csa-choir-sidebar-overlay';
        overlay.id = 'sidebar-overlay';
        container.appendChild(overlay);

        // Sidebar
        const sidebar = document.createElement('nav');
        sidebar.className = 'csa-choir-sidebar';
        sidebar.id = 'choir-sidebar-nav';

        // 1. Logo Section
        const logoContainer = document.createElement('div');
        logoContainer.className = 'csa-choir-sidebar__logo-container';

        const logoIcon = document.createElement('div');
        logoIcon.className = 'csa-choir-sidebar__logo-icon';
        logoIcon.innerHTML = '✝'; // Cross symbol

        const logoText = document.createElement('h2');
        logoText.className = 'csa-choir-sidebar__logo-text';
        logoText.textContent = 'Choir';

        logoContainer.appendChild(logoIcon);
        logoContainer.appendChild(logoText);
        sidebar.appendChild(logoContainer);

        // 2. Navigation List
        const navList = document.createElement('ul');
        navList.className = 'csa-choir-nav';

        this.sections.forEach(section => {
            const targetEl = document.getElementById(section.id);
            if (targetEl) {
                const li = document.createElement('li');
                li.className = 'csa-choir-nav-item';

                const a = document.createElement('a');
                a.className = 'csa-choir-nav-link';
                a.href = `#${section.id}`;
                a.dataset.target = section.id;

                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.scrollToSection(section.id);
                    this.closeMobileMenu();
                });

                // Text only, centered
                const label = document.createElement('span');
                label.textContent = section.label;

                a.appendChild(label);
                li.appendChild(a);
                navList.appendChild(li);
            }
        });

        sidebar.appendChild(navList);

        // 3. Footer Action
        const footer = document.createElement('div');
        footer.className = 'csa-choir-sidebar__footer';

        const backBtn = document.createElement('a');
        backBtn.href = '../admin.html';
        backBtn.className = 'csa-choir-back-btn';
        backBtn.textContent = '⚙';
        backBtn.title = 'Admin Dashboard';

        footer.appendChild(backBtn);
        sidebar.appendChild(footer);

        container.appendChild(sidebar);

        // Mobile Toggle
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'csa-choir-mobile-toggle';
        toggleBtn.innerHTML = '☰';
        toggleBtn.ariaLabel = 'Toggle Menu';
        toggleBtn.onclick = () => this.toggleMobileMenu();
        document.body.appendChild(toggleBtn);

        overlay.addEventListener('click', () => this.closeMobileMenu());

        this.setupScrollSpy();
    }

    private scrollToSection(id: string): void {
        const element = document.getElementById(id);
        if (element) {
            const offset = 20;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    private toggleMobileMenu(): void {
        const sidebar = document.getElementById('choir-sidebar-nav');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleBtn = document.querySelector('.csa-choir-mobile-toggle');

        if (sidebar && overlay) {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('open');

            if (sidebar.classList.contains('open')) {
                toggleBtn!.innerHTML = '✕';
            } else {
                toggleBtn!.innerHTML = '☰';
            }
        }
    }

    private closeMobileMenu(): void {
        const sidebar = document.getElementById('choir-sidebar-nav');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleBtn = document.querySelector('.csa-choir-mobile-toggle');

        if (sidebar && overlay) {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            toggleBtn!.innerHTML = '☰';
        }
    }

    private setupScrollSpy(): void {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.setActiveLink(entry.target.id);
                }
            });
        }, observerOptions);

        this.sections.forEach(section => {
            const el = document.getElementById(section.id);
            if (el) {
                observer.observe(el);
            }
        });
    }

    private setActiveLink(id: string): void {
        const links = document.querySelectorAll('.csa-choir-nav-link');
        links.forEach(link => link.classList.remove('active'));

        const activeLink = document.querySelector(`.csa-choir-nav-link[data-target="${id}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    public init(): void {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.render());
        } else {
            this.render();
        }
    }
}
