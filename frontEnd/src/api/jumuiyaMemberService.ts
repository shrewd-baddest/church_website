import { apiClient } from "./axiosInstance";

export interface JumuiyaRosterMember {
  id: string;
  member_id?: string;
  name: string;
  first_name?: string;
  last_name?: string;
  year?: string;
  email?: string;
  phone?: string;
  gender?: string;
  course?: string;
  jumuiya_id?: string;
  jumuiya_name?: string;
  row_no?: number;
  serial_no?: number;
  is_registered?: boolean;
  is_current_jumuiya?: boolean;
  sem_1_reg?: boolean;
  sem_2_reg?: boolean;
  sem_3_reg?: boolean;
  sem_4_reg?: boolean;
  sem_5_reg?: boolean;
  sem_6_reg?: boolean;
  sem_7_reg?: boolean;
  sem_8_reg?: boolean;
  admission_year?: number;
  graduation_year?: number;
  class_of?: string | number;
  is_associate?: boolean;
}

const BASE = (jumuiyaId: string) => `/jumuiya-members/${jumuiyaId}`;

export const memberService = {
  createSeason: (jumuiyaId: string, data: any) =>
    apiClient.post(`${BASE(jumuiyaId)}/seasons`, data).then(r => r.data),

  getSeasons: (jumuiyaId: string) =>
    apiClient.get(`${BASE(jumuiyaId)}/seasons`).then(r => r.data),

  updateSeason: (jumuiyaId: string, id: number, data: any) =>
    apiClient.patch(`${BASE(jumuiyaId)}/seasons/${id}`, data).then(r => r.data),

  deleteSeason: (jumuiyaId: string, id: number) =>
    apiClient.delete(`${BASE(jumuiyaId)}/seasons/${id}`).then(r => r.data),

  importMembers: (jumuiyaId: string, data: { members: any[]; season_id?: number; file_name?: string; academic_year?: string }) =>
    apiClient.post(`${BASE(jumuiyaId)}/import-members`, data).then(r => r.data),

  getImports: (jumuiyaId: string) =>
    apiClient.get(`${BASE(jumuiyaId)}/imports`).then(r => r.data),

  getImportStatus: (jumuiyaId: string, importId: number) =>
    apiClient.get(`${BASE(jumuiyaId)}/import-status/${importId}`).then(r => r.data),

  updateImportStatus: (jumuiyaId: string, importId: number, data: { status: string; notes?: string }) =>
    apiClient.patch(`${BASE(jumuiyaId)}/import-status/${importId}`, data).then(r => r.data),

  validateImportData: (jumuiyaId: string, members: any[]) =>
    apiClient.post(`${BASE(jumuiyaId)}/validate-import`, { members }).then(r => r.data),

  createGroups: (jumuiyaId: string, data: { groups: any[]; season_id?: number }) =>
    apiClient.post(`${BASE(jumuiyaId)}/create-groups`, data).then(r => r.data),

  getGroups: (jumuiyaId: string, params?: { season_id?: number }) =>
    apiClient.get(`${BASE(jumuiyaId)}/groups`, { params }).then(r => r.data),

  updateGroup: (jumuiyaId: string, groupId: number, data: any) =>
    apiClient.patch(`${BASE(jumuiyaId)}/groups/${groupId}`, data).then(r => r.data),

  deleteGroup: (jumuiyaId: string, groupId: number) =>
    apiClient.delete(`${BASE(jumuiyaId)}/groups/${groupId}`).then(r => r.data),

  getGroupMembers: (jumuiyaId: string, groupId: number) =>
    apiClient.get(`${BASE(jumuiyaId)}/groups/${groupId}/members`).then(r => r.data),

  autoDistribute: (jumuiyaId: string, data: { season_id?: number; strategy?: string; import_id?: number }) =>
    apiClient.post(`${BASE(jumuiyaId)}/auto-distribute`, data).then(r => r.data),

  reassignMember: (jumuiyaId: string, groupId: number, memberId: number) =>
    apiClient.patch(`${BASE(jumuiyaId)}/groups/${groupId}/reassign`, { member_id: memberId }).then(r => r.data),

  getJumuiyaRoster: (jumuiya_id: string) =>
    apiClient.get(`/jumuiya-members`, { params: { jumuiya_id } }).then(r => r.data),

  getJumuiyaRegistered: (jumuiya_id: string) =>
    apiClient.get(`/jumuiya-members/registered`, { params: { jumuiya_id } }).then(r => r.data),

  getJumuiyaAssociates: (jumuiya_id: string) =>
    apiClient.get(`/jumuiya-members/associates`, { params: { jumuiya_id } }).then(r => r.data),

  getMembers: (jumuiyaId: string) =>
    apiClient.get(`${BASE(jumuiyaId)}/members`).then(r => r.data),

  getStatistics: (jumuiyaId: string) =>
    apiClient.get(`${BASE(jumuiyaId)}/statistics`).then(r => r.data),

  getBatchStatistics: () =>
    apiClient.get(`/jumuiya-members/stats/batch`).then(r => r.data),

  getCsaAllocations: (jumuiyaId: string, params?: { academic_year?: string }) =>
    apiClient.get(`${BASE(jumuiyaId)}/csa-allocations`, { params }).then(r => r.data),

  getDistributionHistory: (jumuiyaId: string) =>
    apiClient.get(`${BASE(jumuiyaId)}/distribution-history`).then(r => r.data),

  updateImportRecord: (jumuiyaId: string, recordId: number, data: any) =>
    apiClient.patch(`${BASE(jumuiyaId)}/import-records/${recordId}`, data).then(r => r.data),
  deleteImportRecord: (jumuiyaId: string, recordId: number) =>
    apiClient.delete(`${BASE(jumuiyaId)}/import-records/${recordId}`).then(r => r.data),

  csaImportMembers: (data: { members: any[]; season_id?: number; file_name?: string; academic_year?: string }) =>
    apiClient.post(`/jumuiya-members/csa/import-members`, data).then(r => r.data),

  csaGetPendingMembers: (params?: { academic_year?: string; gender?: string }) =>
    apiClient.get(`/jumuiya-members/csa/pending-members`, { params }).then(r => r.data),

  csaGetJumuiyaStats: (params?: { academic_year?: string }) =>
    apiClient.get(`/jumuiya-members/csa/jumuiya-stats`, { params }).then(r => r.data),

  csaValidateMembers: (data: { members: any[] }) =>
    apiClient.post(`/jumuiya-members/csa/validate-members`, data).then(r => r.data),

  csaDistributePreview: (data?: { strategy?: string; academic_year?: string }) =>
    apiClient.post(`/jumuiya-members/csa/distribute-preview`, data || {}).then(r => r.data),

  csaDistributeMembers: (data?: { strategy?: string; academic_year?: string }) =>
    apiClient.post(`/jumuiya-members/csa/distribute`, data || {}).then(r => r.data),

  csaSubmitForApproval: (data?: { strategy?: string; academic_year?: string }) =>
    apiClient.post(`/jumuiya-members/csa/submit-for-approval`, data || {}).then(r => r.data),

  csaGetApprovals: (jumuiyaId: string) =>
    apiClient.get(`/jumuiya-members/csa/approvals/${jumuiyaId}`).then(r => r.data),

  csaReviewApproval: (id: number, data: { status: 'approved' | 'rejected'; rejection_reason?: string }) =>
    apiClient.patch(`/jumuiya-members/csa/approvals/${id}/review`, data).then(r => r.data),

  csaBatchReviewApprovals: (jumuiyaId: string, data: { status: 'approved' | 'rejected'; rejection_reason?: string }) =>
    apiClient.post(`/jumuiya-members/csa/approvals/${jumuiyaId}/batch-review`, data).then(r => r.data),

  csaGetActiveBatches: () =>
    apiClient.get(`/jumuiya-members/csa/approval-status/active`).then(r => r.data),

  csaGetApprovalStatus: (batchId: number) =>
    apiClient.get(`/jumuiya-members/csa/approval-status/${batchId}`).then(r => r.data),

  csaFinalizeDistribution: (batchId: number) =>
    apiClient.post(`/jumuiya-members/csa/finalize/${batchId}`).then(r => r.data),

  csaGetJumuiyaMemberList: (jumuiyaId: string, params?: { batch_id?: number; academic_year?: string }) =>
    apiClient.get(`/jumuiya-members/csa/jumuiya-list/${jumuiyaId}`, { params }).then(r => r.data),

  csaGetRejectedMembers: () =>
    apiClient.get(`/jumuiya-members/csa/rejected-members`).then(r => r.data),

  csaUpdateRejectedMember: (id: number, data: { name?: string; reg_number?: string; gender?: string; phone?: string; email?: string; assign_jumuiya?: string }) =>
    apiClient.patch(`/jumuiya-members/csa/rejected-members/${id}`, data).then(r => r.data),

  csaDeleteRejectedMember: (id: number) =>
    apiClient.delete(`/jumuiya-members/csa/rejected-members/${id}`).then(r => r.data),

  getAllRegisteredMembers: () =>
    apiClient.get(`/jumuiya-members/registered/all`).then(r => r.data),

  manualRegisterMember: (data: { member_id: string; jumuiya_id: string; semesters?: string[]; serial_no?: number; amount?: number }) =>
    apiClient.post(`/jumuiya-members/registered/manual`, data).then(r => r.data),

  secretaryRegisterMember: (data: { member_id: string; jumuiya_id: string; jumuiya_name?: string; semesters?: string[]; serial_no?: number; amount?: number; registered_by?: string; registered_by_name?: string }) =>
    apiClient.post(`/jumuiya-members/secretary-register`, data).then(r => r.data),

  getPendingPayments: (params?: { jumuiya_id?: string }) =>
    apiClient.get(`/jumuiya-members/pending-payments`, { params }).then(r => r.data),

  getMyJumuiyaPendingPayments: (params: { jumuiya_id: string; status?: string }) =>
    apiClient.get(`/jumuiya-members/pending-payments/my`, { params }).then(r => r.data),

  settlePendingPayment: (id: number, data?: { settled_by?: string }) =>
    apiClient.patch(`/jumuiya-members/pending-payments/${id}/settle`, data || {}).then(r => r.data),

  cancelPendingPayment: (id: number) =>
    apiClient.patch(`/jumuiya-members/pending-payments/${id}/cancel`).then(r => r.data),

  batchSettlePendingPayments: (data: { jumuiya_id: string; settled_by?: string }) =>
    apiClient.post(`/jumuiya-members/pending-payments/batch-settle`, data).then(r => r.data),

  getAllMembersAcrossJumuiyas: () =>
    apiClient.get(`/jumuiya-members/all`).then(r => r.data),

  updateMember: (id: string, data: any) =>
    apiClient.put(`/jumuiya-members`, data, { params: { id } }).then(r => r.data),

  changeMemberReg: (id: string, newReg: string, dryRun?: boolean) =>
    apiClient.patch(`/jumuiya-members/reg-number`, { id, newReg, dryRun }).then(r => r.data),

  flagMember: (id: string, flagged: boolean) =>
    apiClient.patch(`/jumuiya-members/flag`, { flagged }, { params: { member_id: id } }).then(r => r.data),

  deleteMember: (id: string) =>
    apiClient.delete(`/jumuiya-members`, { params: { id } }).then(r => r.data),

  exportMembers: (jumuiyaId: string) =>
    apiClient.get(`${BASE(jumuiyaId)}/export/members`).then(r => r.data),

  exportAssignments: (jumuiyaId: string) =>
    apiClient.get(`${BASE(jumuiyaId)}/export/assignments`).then(r => r.data),

  lookupMemberByRegNumber: (search: string) =>
    apiClient.get(`/jumuiya-members/lookup/reg-number`, { params: { search } }).then(r => r.data),

  getAssociatesPending: (params?: { jumuiya_id?: string }) =>
    apiClient.get(`/jumuiya-members/associates/pending`, { params }).then(r => r.data),

  migrateToAssociates: (data: { member_ids: string[]; migrated_by?: string }) =>
    apiClient.post(`/jumuiya-members/associates/migrate`, data).then(r => r.data),

  getAssociatesList: (params?: { jumuiya_id?: string; graduation_year?: number }) =>
    apiClient.get(`/jumuiya-members/associates/list`, { params }).then(r => r.data),

  exportAssociates: (params?: { graduation_year?: number; jumuiya_id?: string }) =>
    apiClient.get(`/jumuiya-members/associates/export`, { params }).then(r => r.data),

  undoAssociateMigration: (memberId: string) =>
    apiClient.post(`/jumuiya-members/associates/undo`, { member_id: memberId }).then(r => r.data),

  sendStampCard: (data: { email: string; pdfBase64: string; memberName: string; jumuiyaName: string }) =>
    apiClient.post(`/jumuiya-members/send-stamp-card`, data).then(r => r.data),

  registerWithPayment: (data: { member_id: string; jumuiya_id: string; phoneNumber: string; amount: number }) =>
    apiClient.post(`/jumuiya-members/register-with-payment`, data).then(r => r.data),

  bulkRegisterWithPayment: (data: { member_ids: string[]; jumuiya_id: string; phoneNumber: string; amount: number }) =>
    apiClient.post(`/jumuiya-members/bulk-register-with-payment`, data).then(r => r.data),

  getJumuiyaLookup: () =>
    apiClient.get(`/jumuiya-members/lookup`).then(r => r.data),

  getAnalytics: () =>
    apiClient.get(`/jumuiya-members/analytics`).then(r => r.data),

  getCohortAnalytics: () =>
    apiClient.get(`/jumuiya-members/analytics/cohorts`).then(r => r.data),

  getJumuiyaProgression: (params?: { from?: number; to?: number }) =>
    apiClient.get(`/jumuiya-members/analytics/jumuiya-progression`, { params }).then(r => r.data),

  getYearlyContribution: (params?: { year?: number }) =>
    apiClient.get(`/jumuiya-members/analytics/yearly-contribution`, { params }).then(r => r.data),

  getPayments: (params?: { status?: string }) =>
    apiClient.get(`/jumuiya-members/payments`, { params }).then(r => r.data),

  updatePaymentStatus: (id: number, data: { status: string; mpesa_receipt?: string }) =>
    apiClient.patch(`/jumuiya-members/payments/${id}/status`, data).then(r => r.data),

  // ── WhatsApp Dynamic Self-Registration ──
  selfRegister: (data: {
    name: string;
    regNumber: string;
    gender: string;
    email: string;
    phone: string;
    course: string;
    jumuiya_slug: string;
    captchaToken?: string | null;
  }) => apiClient.post(`/jumuiya/self-register`, data).then(r => r.data),

  checkDuplicate: (params: { regNumber?: string; email?: string }) =>
    apiClient.get(`/jumuiya/check-duplicate`, { params }).then(r => r.data),

  getPublicJumuiyaInfo: (slug: string) =>
    apiClient.get(`/jumuiya/info/${slug}`).then(r => r.data),

  // ── Pending Self-Registrations (for Manual Admission) ──
  getPendingSelfRegistrations: (jumuiyaId: string) =>
    apiClient.get(`/jumuiya-members/${jumuiyaId}/pending-self-registrations`).then(r => r.data),
};

