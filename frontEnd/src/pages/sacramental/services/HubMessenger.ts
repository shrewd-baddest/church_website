/**
 * Hub Messenger Utility
 * Handles communication between the iframe hub pages and the parent React app.
 */
export class HubMessenger {
    /**
     * Notify parent of the current module being viewed.
     */
    static notifyModuleLoaded(slug: string | null): void {
        if (window.self !== window.top) {
            window.parent.postMessage({
                type: 'HUB_MODULE_LOADED',
                slug: slug || ''
            }, '*');
        }
    }

    /**
     * Request the parent to navigate to a specific hub module (updating the URL).
     */
    static requestParentNavigate(slug: string): void {
        if (window.self !== window.top) {
            window.parent.postMessage({
                type: 'HUB_NAVIGATE',
                slug: slug
            }, '*');
        } else {
            // If not in iframe, just use normal window location
            window.location.href = `/community-view/${slug}`;
        }
    }
}
