// Base URL for the API endpoints - using proxy
import { apiClient } from "../api/axiosInstance";

/**
 * ApiService class provides methods to interact with the backend API.
 * It handles fetching, creating, and deleting records for various tables.
 */
class ApiService {
  private cacheGet<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const cacheKey = `csa_cache_${key}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < ttlMs) return data;
      }
    } catch { /* ignore corrupt cache */ }
    return fetcher().then(data => {
      try { localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() })); } catch { /* quota */ }
      return data;
    });
  }
  /**
   * Fetches data from a specified table.
   * @param tableName - The name of the table to fetch data from.
   * @returns A promise that resolves to an array of records.
   */
 async fetchTableData(tableName: string, bypassCache = false): Promise<any[]> {
  const CACHE_KEY = `csa_cache_${tableName}`;

  // Attempt local cache first if not bypassing
  if (!bypassCache) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  }

  try {
    const response = await apiClient.get(`/${tableName}`);
    const rawData = response.data;

    // Case 1: API already returns array
    if (Array.isArray(rawData)) {
      if (!bypassCache) localStorage.setItem(CACHE_KEY, JSON.stringify(rawData));
      return rawData;
    }

    // Case 2: API returns { data: [...] }
    if (Array.isArray(rawData?.data)) {
      if (!bypassCache) localStorage.setItem(CACHE_KEY, JSON.stringify(rawData.data));
      return rawData.data;
    }

    // fallback safe return
    return [];
  } catch (error) {
    console.warn(`Error fetching ${tableName}:`, error);

    return [];
  }
}

  /**
   * Creates a new record in the specified table.
   * @param tableName - The name of the table to create the record in.
   * @param data - The data for the new record.
   * @returns A promise that resolves to the created record.
   */
  async createRecord(tableName: string, data: Record<string, any>): Promise<any> {
    try {
      const response = await apiClient.post(`/${tableName}`, data);
      this.clearCache(tableName);
      return response.data;
    } catch (error) {
      console.error(`Error creating record in ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a record from the specified table by ID.
   * @param tableName - The name of the table to delete the record from.
   * @param id - The ID of the record to delete.
   * @returns A promise that resolves to the response from the server.
   */
  async deleteRecord(tableName: string, id: string | number): Promise<any> {
    try {
      const response = await apiClient.delete(`/${tableName}/${id}`);
      this.clearCache(tableName);
      return response.data;
    } catch (error) {
      console.error(`Error deleting record from ${tableName}:`, error);
      throw error;
    }
  }

  async updateRecord(tableName: string, id: string | number, data: Record<string, any>): Promise<any> {
    try {
      const response = await apiClient.patch(`/${tableName}/${id}`, data);
      this.clearCache(tableName);
      return response.data;
    } catch (error) {
      console.error(`Error updating record in ${tableName}:`, error);
      throw error;
    }
  }

  // Specific methods for different tables

  /**
   * Fetches all members.
   */
  async getMembers(): Promise<any[]> {
    return this.fetchTableData('members');
  }

  /**
   * Fetches all events.
   */
  async getEvents(): Promise<any[]> {
    return this.fetchTableData('events');
  }

  /**
   * Fetches all contributions.
   */
  async getContributions(): Promise<any[]> {
    return this.fetchTableData('contributions');
  }

  /**
   * Fetches all roles.
   */
  async getRoles(): Promise<any[]> {
    return this.fetchTableData('roles');
  }

  /**
   * Fetches all sub-groups.
   */
  async getSubGroups(): Promise<any[]> {
    return this.fetchTableData('sub_groups');
  }
  
  /**
   * Fetches all members (admin only)
   */
  async getAdminMembers(): Promise<any[]> {
    const response = await apiClient.get('/authentication/list-all-memebrs');
    return response.data;
  }

  /**
   * Fetches roles and permissions (admin only)
   */
  async getAdminRoles(): Promise<any> {
    const response = await apiClient.get('/authentication/list-roles-permissions');
    return response.data;
  }

  /**
   * Updates a member's roles
   */
  async updateMemberRoles(memberId: string, roleNames: string[]): Promise<any> {
    const response = await apiClient.post('/authentication/update-user-roles', {
      member_id: memberId,
      role_names: roleNames
    });
    return response.data;
  }

  /** Fetches all available roles (active) */
  async getRolesList(): Promise<any[]> {
    const response = await apiClient.get('/roles');
    return response.data?.data || [];
  }

  /** Fetches role assignments with optional status filter */
  async getRoleAssignments(status?: string): Promise<any[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get('/assignments', { params });
    return response.data?.data || [];
  }

  /** Assigns a role to a member (creates pending assignment) */
  async assignRole(member_id: string, role_id: number): Promise<any> {
    const response = await apiClient.post('/assignments', { member_id, role_id });
    return response.data;
  }

  /** Approves a pending role assignment */
  async approveAssignment(id: number): Promise<any> {
    const response = await apiClient.patch(`/assignments/${id}/approve`);
    return response.data;
  }

  /** Rejects a pending role assignment */
  async rejectAssignment(id: number): Promise<any> {
    const response = await apiClient.patch(`/assignments/${id}/reject`);
    return response.data;
  }

  /** Revokes an approved role assignment (sets status to 'revoked') */
  async revokeAssignment(id: number): Promise<any> {
    const response = await apiClient.patch(`/assignments/${id}/revoke`);
    return response.data;
  }

  /** Reactivates a revoked role assignment (sets status back to 'approved') */
  async activateAssignment(id: number): Promise<any> {
    const response = await apiClient.patch(`/assignments/${id}/activate`);
    return response.data;
  }

  /** Permanently deletes a role assignment */
  async deleteAssignment(id: number): Promise<any> {
    const response = await apiClient.delete(`/assignments/${id}`);
    return response.data;
  }

  /**
   * Fetches all member roles.
   */
  async getMemberRoles(): Promise<any[]> {
    return this.fetchTableData('member_roles');
  }

  /**
   * Fetches all event attendance records.
   */
  async getEventAttendance(): Promise<any[]> {
    return this.fetchTableData('event_subgroup_attendance');
  }

  /**
   * Fetches all officials from the correct /officials/list endpoint.
   * Always bypasses cache to ensure fresh data (images, updates) are reflected.
   */
  async getOfficials(bypassCache = false): Promise<any[]> {
    const CACHE_KEY = 'csa_cache_officials';

    if (!bypassCache) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try { return JSON.parse(cached); } catch { /* ignore */ }
      }
    }

    try {
      const response = await apiClient.get('/officials/list');
      const data = response.data?.data || response.data || [];
      if (Array.isArray(data)) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Error fetching officials:', error);
      return [];
    }
  }

  /**
   * Fetches all projects.
   */
  async getProjects(): Promise<any[]> {
    return this.fetchTableData('projects');
  }

  /**
   * Fetches all activities.
   */
  async getActivities(): Promise<any[]> {
    return this.fetchTableData('activities');
  }

  async getWeeklyActivities(): Promise<any[]> {
    // bypass the inner fetchTableData cache so only useCachedData manages caching
    return this.fetchTableData('activities/weekly', true);
  }

  async getSemesterActivities(): Promise<any[]> {
    // bypass the inner fetchTableData cache so only useCachedData manages caching
    return this.fetchTableData('activities/semester', true);
  }

  /** Fetch public-safe settings (includes semester_default_image). Cached for 5 minutes. */
  async getPublicSettings(): Promise<Record<string, string>> {
    return this.cacheGet('settings', 300_000, async () => {
      try {
        const { data } = await apiClient.get('/settings');
        return data || {};
      } catch {
        return {};
      }
    });
  }

  /**
   * Fetches all gallery items.
   */
  async getGallery(): Promise<any[]> {
    return this.cacheGet('gallery_all', 120_000, async () => {
      try {
        const { data } = await apiClient.get('/hub-gallery');
        return data?.items || [];
      } catch {
        return [];
      }
    });
  }

  async getSacramentalsSliderImages(section: string = 'sacramentals'): Promise<any[]> {
    return this.cacheGet(`slider_${section}`, 300_000, async () => {
      try {
        const response = await apiClient.get(`/slider-images?section=${encodeURIComponent(section)}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching sacramentals slider images:', error);
        return [];
      }
    });
  }

  async getHeroSlides(): Promise<{ slides: any[]; dynamic_enabled: boolean }> {
    return this.cacheGet('hero_slides', 300_000, async () => {
      try {
        const { data } = await apiClient.get('/hero-slides');
        return data || { slides: [], dynamic_enabled: false };
      } catch (error) {
        console.error('Error fetching hero slides:', error);
        return { slides: [], dynamic_enabled: false };
      }
    });
  }

  private clearSliderCache() {
    Object.keys(localStorage).forEach(k => { if (k.startsWith('csa_cache_slider_')) localStorage.removeItem(k); });
  }

  async createSacramentalsSliderImage(payload: Record<string, any>): Promise<any> {
    const response = await apiClient.post('/slider-images', payload);
    this.clearSliderCache();
    return response.data;
  }

  async updateSacramentalsSliderImage(id: string | number, payload: Record<string, any>): Promise<any> {
    const response = await apiClient.patch(`/slider-images/${id}`, payload);
    this.clearSliderCache();
    return response.data;
  }

  async deleteSacramentalsSliderImage(id: string | number): Promise<any> {
    const response = await apiClient.delete(`/slider-images/${id}`);
    this.clearSliderCache();
    return response.data;
  }

  /**
   * Fetches a single official by their ID.
   * @param id - The ID of the official.
   */
  async getOfficialById(id: string | number): Promise<any> {
    try {
      const response = await apiClient.get(`/officials/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching official ${id}:`, error);
      throw error;
    }
  }

  /**
   * Fetches the election history of officials.
   */
  async getOfficialHistory(): Promise<any[]> {
    try {
      const response = await apiClient.get('/officials/history');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching officials history:', error);
      return [];
    }
  }

  /**
   * Creates a new gallery item.
   * @param galleryData - The data for the new gallery item.
   */
  async addGalleryItem(galleryData: Record<string, any>): Promise<any> {
    return this.createRecord('gallery', galleryData);
  }

  /**
   * Fetches all jumuiya groups.
   */
  async getJumuiya(): Promise<any[]> {
    return this.fetchTableData('jumuiya');
  }

  /**
   * Pools all data from all tables in the database.
   */
  async poolAllData(): Promise<Record<string, any[]>> {
    try {
      const response = await apiClient.get('/all');
      return response.data;
    } catch (error) {
      console.error('Error pooling all data:', error);
      throw error;
    }
  }

  // Create methods

  /**
   * Creates a new member.
   */
  async createMember(memberData: Record<string, any>): Promise<any> {
    return this.createRecord('members', memberData);
  }

  /**
   * Creates a new event.
   */
  async createEvent(eventData: Record<string, any>): Promise<any> {
    return this.createRecord('events', eventData);
  }

  /**
   * Creates a new contribution.
   */
  async createContribution(contributionData: Record<string, any>): Promise<any> {
    return this.createRecord('contributions', contributionData);
  }

  // Delete methods

  /**
   * Deletes a member by ID.
   */
  async deleteMember(memberId: string | number): Promise<any> {
    return this.deleteRecord('members', memberId);
  }

  /**
   * Deletes an event by ID.
   */
  async deleteEvent(eventId: string | number): Promise<any> {
    return this.deleteRecord('events', eventId);
  }

  /**
   * Deletes a contribution by ID.
   */
  async deleteContribution(contributionId: string | number): Promise<any> {
    return this.deleteRecord('contributions', contributionId);
  }

   async getPendingPayments(): Promise<any[]> {
     const response = await apiClient.get(`/jumuiya-members/pending-payments`);
     return response.data;
   }

   async settlePendingPayment(id: string | number, settledBy = ''): Promise<any> {
     const response = await apiClient.patch(`/jumuiya-members/pending-payments/${id}/settle`, { settled_by: settledBy });
     this.clearCache('pending_payments');
     return response.data;
   }

   async cancelPendingPayment(id: string | number): Promise<any> {
     const response = await apiClient.patch(`/jumuiya-members/pending-payments/${id}/cancel`);
     this.clearCache('pending_payments');
     return response.data;
   }

   async batchSettlePendingPayments(jumuiyaId: string, settledBy = ''): Promise<any> {
     const response = await apiClient.post(`/jumuiya-members/pending-payments/batch-settle`, { jumuiya_id: jumuiyaId, settled_by: settledBy });
     this.clearCache('pending_payments');
     return response.data;
   }

   async getDonations(): Promise<any[]> {
     const response = await apiClient.get(`/donations`);
     return response.data;
   }

  /**
   * Clears the local cache for a specific table.
   */
  clearCache(tableName: string): void {
    const CACHE_KEY = `csa_cache_${tableName}`;
    localStorage.removeItem(CACHE_KEY);

    // Clear related aggregated caches to prevent stale data delays across the app
    if (tableName.startsWith('hub_') || tableName.includes('community')) {
      localStorage.removeItem('community_modules_cache');
    }
    if (tableName.includes('jumuiya')) {
      localStorage.removeItem('jumuiya_data');
    }
    if (tableName === 'products' || tableName === 'projects') {
      // Any specific product caches if we add them later
    }
  }

  /**
   * Clears all CSA related caches.
   */
  clearAllCache(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('csa_cache_')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Clears only officials-related caches.
   */
  clearOfficialsCache(): void {
    localStorage.removeItem('csa_cache_officials');
    localStorage.removeItem('csa_cache_jumuiya_officials');
    localStorage.removeItem('csa_cache_jumuiya-officials');
    Object.keys(localStorage).forEach(key => {
      if (
        key.startsWith('csa_cache_official_') ||
        key.startsWith('csa_cache_jumuiya_official_')
      ) {
        localStorage.removeItem(key);
      }
    });
  }

  // --- STK PUSH METHODS ---
  async initiateStkPush(phoneNumber: string, amount: number, items: any[]): Promise<any> {
    try {
      const response = await apiClient.post('/stkPush/initiate/guest', {
        phone: phoneNumber,
        amount,
        items
      });
      return response.data;
    } catch (error) {
      console.error('Error initiating STK push:', error);
      throw error;
    }
  }

  async checkStkStatus(checkoutId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/stkPush/check/${checkoutId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking STK status:', error);
      throw error;
    }
  }

  async getCategoryCards(): Promise<any[]> {
    return this.cacheGet('category_cards', 300_000, async () => {
      try {
        const response = await apiClient.get('/category-cards');
        return response.data;
      } catch (error) {
        console.error('Error fetching category cards:', error);
        return [];
      }
    });
  }

  async upsertCategoryCard(payload: { category: string; image_url: string; label: string; tag?: string }): Promise<any> {
    const response = await apiClient.post('/category-cards', payload);
    localStorage.removeItem('csa_cache_category_cards');
    return response.data;
  }

  async deleteCategoryCard(category: string): Promise<any> {
    const response = await apiClient.delete(`/category-cards/${category}`);
    localStorage.removeItem('csa_cache_category_cards');
    return response.data;
  }

  async getTestimonials(approvedOnly = false): Promise<any[]> {
    const cacheKey = approvedOnly ? 'testimonials_approved' : 'testimonials_all';
    return this.cacheGet(cacheKey, 120_000, async () => {
      const params = approvedOnly ? { approved: 'true' } : {};
      const response = await apiClient.get('/testimonials', { params });
      return response.data;
    });
  }

  private clearTestimonialsCache() {
    localStorage.removeItem('csa_cache_testimonials_approved');
    localStorage.removeItem('csa_cache_testimonials_all');
  }

  async createTestimonial(payload: { name: string; role?: string; text: string; rating?: number; approved?: boolean }): Promise<any> {
    const response = await apiClient.post('/testimonials', payload);
    this.clearTestimonialsCache();
    return response.data;
  }

  async approveTestimonial(id: number | string): Promise<any> {
    const response = await apiClient.patch(`/testimonials/${id}/approve`);
    this.clearTestimonialsCache();
    return response.data;
  }

  async deleteTestimonial(id: number | string): Promise<any> {
    const response = await apiClient.delete(`/testimonials/${id}`);
    this.clearTestimonialsCache();
    return response.data;
  }

}

export default new ApiService();
