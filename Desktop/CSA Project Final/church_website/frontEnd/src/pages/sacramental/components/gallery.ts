/**
 * Gallery Component
 * Displays choir event photos in a responsive grid with lightbox functionality
 */

interface GalleryPhoto {
    id: string;
    filename: string;
    eventName: string;
    description: string;
    uploadDate: string;
    imageUrl: string;
}

export class Gallery {
    private containerId: string;
    private photos: GalleryPhoto[] = [];
    private currentPhotoIndex: number = 0;

    constructor(containerId: string) {
        this.containerId = containerId;
    }

    async init(): Promise<void> {
        await this.fetchPhotos();
        this.render();
    }

    private async fetchPhotos(): Promise<void> {
        try {
            const response = await fetch('/api/choir/gallery');
            if (!response.ok) throw new Error('Failed to fetch gallery photos');
            this.photos = await response.json();
        } catch (error) {
            console.error('Error fetching gallery photos:', error);
            this.photos = [];
        }
    }

    private render(): void {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        if (this.photos.length === 0) {
            container.innerHTML = `
                <div class="gallery-section">
                    <div class="csa-choir-container">
                        <h2 class="gallery-title">Event Gallery</h2>
                        <p class="gallery-empty">No photos yet. Check back soon for event photos!</p>
                    </div>
                </div>
            `;
            return;
        }

        const galleryHTML = `
            <div class="gallery-section">
                <div class="csa-choir-container">
                    <h2 class="gallery-title">Event Gallery</h2>
                    <p class="gallery-subtitle">Capturing our memorable moments and celebrations</p>
                    <div class="gallery-grid">
                        ${this.photos.map((photo, index) => `
                            <div class="gallery-item" data-index="${index}">
                                <img src="${photo.imageUrl}" alt="${photo.eventName}" loading="lazy">
                                <div class="gallery-item-overlay">
                                    <h3 class="gallery-item-title">${photo.eventName}</h3>
                                    ${photo.description ? `<p class="gallery-item-desc">${photo.description}</p>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Lightbox Modal -->
            <div class="gallery-lightbox" id="gallery-lightbox">
                <button class="lightbox-close" aria-label="Close">&times;</button>
                <button class="lightbox-prev" aria-label="Previous">&#10094;</button>
                <button class="lightbox-next" aria-label="Next">&#10095;</button>
                <div class="lightbox-content">
                    <img src="" alt="" id="lightbox-image">
                    <div class="lightbox-info">
                        <h3 id="lightbox-title"></h3>
                        <p id="lightbox-description"></p>
                        <p class="lightbox-date" id="lightbox-date"></p>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = galleryHTML;
        this.attachEventListeners();
    }

    private attachEventListeners(): void {
        // Gallery item click handlers
        const galleryItems = document.querySelectorAll('.gallery-item');
        galleryItems.forEach((item) => {
            item.addEventListener('click', () => {
                const index = parseInt(item.getAttribute('data-index') || '0');
                this.openLightbox(index);
            });
        });

        // Lightbox controls
        const lightbox = document.getElementById('gallery-lightbox');
        const closeBtn = document.querySelector('.lightbox-close');
        const prevBtn = document.querySelector('.lightbox-prev');
        const nextBtn = document.querySelector('.lightbox-next');

        closeBtn?.addEventListener('click', () => this.closeLightbox());
        prevBtn?.addEventListener('click', () => this.navigateLightbox(-1));
        nextBtn?.addEventListener('click', () => this.navigateLightbox(1));

        // Close on background click
        lightbox?.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.closeLightbox();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const lightbox = document.getElementById('gallery-lightbox');
            if (lightbox?.classList.contains('active')) {
                if (e.key === 'Escape') this.closeLightbox();
                if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
                if (e.key === 'ArrowRight') this.navigateLightbox(1);
            }
        });
    }

    private openLightbox(index: number): void {
        this.currentPhotoIndex = index;
        this.updateLightbox();
        const lightbox = document.getElementById('gallery-lightbox');
        lightbox?.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    private closeLightbox(): void {
        const lightbox = document.getElementById('gallery-lightbox');
        lightbox?.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    private navigateLightbox(direction: number): void {
        this.currentPhotoIndex += direction;

        // Wrap around
        if (this.currentPhotoIndex < 0) {
            this.currentPhotoIndex = this.photos.length - 1;
        } else if (this.currentPhotoIndex >= this.photos.length) {
            this.currentPhotoIndex = 0;
        }

        this.updateLightbox();
    }

    private updateLightbox(): void {
        const photo = this.photos[this.currentPhotoIndex];
        if (!photo) return;

        const image = document.getElementById('lightbox-image') as HTMLImageElement;
        const title = document.getElementById('lightbox-title');
        const description = document.getElementById('lightbox-description');
        const date = document.getElementById('lightbox-date');

        if (image) image.src = photo.imageUrl;
        if (image) image.alt = photo.eventName;
        if (title) title.textContent = photo.eventName;
        if (description) description.textContent = photo.description;
        if (date) {
            const uploadDate = new Date(photo.uploadDate);
            date.textContent = `Uploaded on ${uploadDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`;
        }

        // Update navigation button visibility
        const prevBtn = document.querySelector('.lightbox-prev') as HTMLButtonElement;
        const nextBtn = document.querySelector('.lightbox-next') as HTMLButtonElement;

        if (prevBtn) prevBtn.style.display = this.photos.length > 1 ? 'block' : 'none';
        if (nextBtn) nextBtn.style.display = this.photos.length > 1 ? 'block' : 'none';
    }
}
