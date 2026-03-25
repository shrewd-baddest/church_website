/**
 * Choir Landing Page
 * Main page assembling all choir module components
 */

import { HeroSection } from '../components/hero-section.js';
import { NextPracticeCountdown } from '../components/next-practice-countdown.js';
import { Announcements } from '../components/announcements.js';
import { PracticeScheduleList } from '../components/practice-schedule.js';
import { ChoirOfficials } from '../components/choir-officials.js';
import { MusicClasses } from '../components/music-classes.js';
import { SemesterActivities } from '../components/semester-activities.js';
import { SocialMediaLinks } from '../components/social-media.js';
import { ChoirApiService } from '../services/choir-api.js';

export class ChoirLandingPage {
    private components: Array<{ destroy: () => void }> = [];

    async init(): Promise<void> {
        try {
            const [
                configResponse,
                schedulesResponse,
                officialsResponse,
                activitiesResponse,
                classesResponse,
                announcementsResponse
            ] = await Promise.all([
                ChoirApiService.getConfig(),
                ChoirApiService.getSchedules(),
                ChoirApiService.getOfficials(),
                ChoirApiService.getActivities(),
                ChoirApiService.getMusicClasses(),
                ChoirApiService.getAnnouncements()
            ]);

            if (!configResponse.success || !configResponse.data) {
                throw new Error('Failed to load choir configuration');
            }

            const config = configResponse.data;
            const schedules = schedulesResponse.data || [];
            const officials = officialsResponse.data || [];
            const activities = activitiesResponse.data || [];
            const classes = classesResponse.data || [];
            const announcements = announcementsResponse.data || [];

            // Update page title and sidebar dynamically
            document.title = `${config.name} - Catholic Student Association`;
            const sidebarLogo = document.querySelector('.csa-choir-sidebar__logo-text');
            if (sidebarLogo) {
                sidebarLogo.textContent = config.name;
            }

            // Generate social media links dynamically from config
            const socialMediaLinks = [];
            if (config.socials) {
                if (config.socials.youtube) socialMediaLinks.push({ platform: 'YouTube' as const, url: config.socials.youtube, iconClass: 'csa-choir-icon--youtube' });
                if (config.socials.tiktok) socialMediaLinks.push({ platform: 'TikTok' as const, url: config.socials.tiktok, iconClass: 'csa-choir-icon--tiktok' });
                if (config.socials.whatsapp) socialMediaLinks.push({ platform: 'WhatsApp' as const, url: config.socials.whatsapp, iconClass: 'csa-choir-icon--whatsapp' });
            } else if (config.name.includes("Choir")) {
                // Fallback for choir
                socialMediaLinks.push(
                    { platform: 'YouTube' as const, url: 'https://youtube.com/@st.thomasaquinaschoir-kiri3835?si=uyVSSCfg9fMYvAKi', iconClass: 'csa-choir-icon--youtube' },
                    { platform: 'TikTok' as const, url: 'https://www.tiktok.com/@stthomasaquinaskyu?_r=1&_t=ZS-93ke5caJ979', iconClass: 'csa-choir-icon--tiktok' },
                    { platform: 'WhatsApp' as const, url: 'https://chat.whatsapp.com/LocdRbR6Huo0QiXy9MYalD?mode=gi_t', iconClass: 'csa-choir-icon--whatsapp' }
                );
            }

            const hero = new HeroSection('choir-hero', config);
            hero.render();
            this.components.push(hero);

            if (schedules.length > 0) {
                const countdown = new NextPracticeCountdown('choir-next-practice', schedules);
                countdown.render();
                this.components.push(countdown);
            }

            if (announcements.length > 0) {
                const announcementsComponent = new Announcements('choir-announcements', announcements);
                announcementsComponent.render();
                this.components.push(announcementsComponent);
            }



            if (schedules.length > 0) {
                const schedule = new PracticeScheduleList('choir-schedule', schedules);
                schedule.render();
                this.components.push(schedule);
            }

            if (officials.length > 0) {
                const officialsComponent = new ChoirOfficials('choir-officials', officials);
                officialsComponent.render();
                this.components.push(officialsComponent);
            }

            if (classes.length > 0) {
                const musicClasses = new MusicClasses('choir-music-classes', classes);
                musicClasses.render();
                this.components.push(musicClasses);
            }

            if (activities.length > 0) {
                const semesterActivities = new SemesterActivities('choir-activities', activities);
                semesterActivities.render();
                this.components.push(semesterActivities);
            }

            if (socialMediaLinks.length > 0) {
                const socialMedia = new SocialMediaLinks('choir-social', socialMediaLinks);
                socialMedia.render();
                this.components.push(socialMedia);
            }

        } catch (error) {
            console.error('Failed to initialize choir landing page:', error);
            this.showError();
        }
    }

    private showError(): void {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'csa-choir-container csa-choir-section';
        errorContainer.innerHTML = `
      <div class="csa-choir-alert csa-choir-alert--error">
        <strong>Error:</strong> Failed to load choir information. Please refresh the page.
      </div>
    `;
        document.body.appendChild(errorContainer);
    }

    destroy(): void {
        this.components.forEach(component => component.destroy());
        this.components = [];
    }
}
