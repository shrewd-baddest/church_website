import { apiClient } from "./axiosInstance";

/** Clear public page localStorage caches so admin changes appear immediately */
function clearPublicCache() {
  const keys = [
    "csa_cache_activities/semester",
    "csa_cache_activities/weekly",
    "csa_cache_public_activities",
  ];
  keys.forEach((k) => localStorage.removeItem(k));
}

const activitiesService = {
  // ── Weekly (public read, admin write) ──────────────────
  getWeekly: async () => {
    const res = await apiClient.get("/activities/weekly");
    return res.data.data || [];
  },

  createWeekly: async (data) => {
    const res = await apiClient.post("/admin/activities/weekly", data);
    clearPublicCache();
    return res.data.data;
  },

  updateWeekly: async (id, data) => {
    const res = await apiClient.patch(`/admin/activities/weekly/${id}`, data);
    clearPublicCache();
    return res.data.data;
  },

  deleteWeekly: async (id) => {
    const res = await apiClient.delete(`/admin/activities/weekly/${id}`);
    clearPublicCache();
    return res.data.data;
  },

  activateWeekly: async (id) => {
    const res = await apiClient.post(`/admin/activities/weekly/${id}/activate`);
    clearPublicCache();
    return res.data.data;
  },

  deactivateWeekly: async (id) => {
    const res = await apiClient.post(`/admin/activities/weekly/${id}/deactivate`);
    clearPublicCache();
    return res.data.data;
  },

  reorderWeekly: async (items) => {
    const res = await apiClient.post("/admin/activities/weekly/reorder", { items });
    clearPublicCache();
    return res.data.data;
  },

  // ── Semester (public read, admin write) ────────────────
  getSemester: async () => {
    const res = await apiClient.get("/activities/semester");
    return res.data.data || [];
  },

  createSemester: async (data) => {
    const res = await apiClient.post("/admin/activities/semester", data);
    clearPublicCache();
    return res.data.data;
  },

  updateSemester: async (id, data) => {
    const res = await apiClient.patch(`/admin/activities/semester/${id}`, data);
    clearPublicCache();
    return res.data.data;
  },

  deleteSemester: async (id) => {
    const res = await apiClient.delete(`/admin/activities/semester/${id}`);
    clearPublicCache();
    return res.data.data;
  },

  activateSemester: async (id) => {
    const res = await apiClient.post(`/admin/activities/semester/${id}/activate`);
    clearPublicCache();
    return res.data.data;
  },

  deactivateSemester: async (id) => {
    const res = await apiClient.post(`/admin/activities/semester/${id}/deactivate`);
    clearPublicCache();
    return res.data.data;
  },

  // ── Bookings ────────────────────────────────────
  bookActivity: async (activity_type, activity_id, phone) => {
    const res = await apiClient.post("/activities/book", { activity_type, activity_id, phone });
    return res.data;
  },

  payBooking: async (id, phone, amount) => {
    const res = await apiClient.post(`/activities/book/${id}/pay`, { phone, amount });
    return res.data;
  },

  getMyBookings: async () => {
    const res = await apiClient.get("/activities/my-bookings");
    return res.data.data || [];
  },

  getAllBookings: async () => {
    const res = await apiClient.get("/admin/activities/bookings");
    return res.data.data || [];
  },

  exportBookingsCSV: async () => {
    const res = await apiClient.get("/admin/activities/bookings/export", { responseType: "blob" });
    return res.data;
  },
};

export default activitiesService;
