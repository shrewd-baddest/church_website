// Base URL for the API endpoints - using proxy
import { apiClient } from "../../../api/axiosInstance";

/**
 * ApiService class provides methods to interact with the backend API.
 * It handles fetching, creating, and deleting records for various tables.
 */
class ApiService {
  /**
   * Fetches data from a specified table.
   * @param tableName - The name of the table to fetch data from.
   * @returns A promise that resolves to an array of records.
   */
  async fetchTableData(tableName: string): Promise<any[]> {
    const CACHE_KEY = `csa_cache_${tableName}`;
    
    // Attempt local cache first
    const cached = localStorage.getItem(CACHE_KEY);
    const fallbackData = cached ? JSON.parse(cached) : [];

    try {
      const response = await apiClient.get(`/${tableName}`);
      return response.data;
    } catch (error) {
      console.warn(`Error fetching ${tableName}, using fallback content:`, error);
      
      // Provide high-quality mock data for the gallery if both API and Cache fail
      if (tableName === 'gallery' && fallbackData.length === 0) {
        return [
           { id: 101, title: "Sacred Choir", image_url: "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1200", description: "Lead through music." },
           { id: 102, title: "Youth Ministry", image_url: "https://images.unsplash.com/photo-1523050853063-bd80e2904760?auto=format&fit=crop&w=1200", description: "The future of our faith." }
        ];
      }
      
      return fallbackData;
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
      return response.data;
    } catch (error) {
      console.error(`Error deleting record from ${tableName}:`, error);
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
   * Fetches all officials.
   */
  async getOfficials(): Promise<any[]> {
    return this.fetchTableData('officials');
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

  /**
   * Fetches all gallery items.
   */
  async getGallery(): Promise<any[]> {
    return this.fetchTableData('gallery');
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
}

export default new ApiService();
