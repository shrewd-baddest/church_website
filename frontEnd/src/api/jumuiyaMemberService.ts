import { apiClient } from "./axiosInstance";
import { withCache, invalidateCache } from "./apiCache";

const BASE = (jumuiyaId: string) => `/jumuiya-members/${jumuiyaId}`;

export { invalidateCache as invalidateMemberCache };

export const memberService = {
  // ── Seasons ──
  createSeason: (jumuiyaId: string, data: any) => {
    invalidateCache(`seasons:${jumuiyaId}`);
    return apiClient.post(`${BASE(jumuiyaId)}/seasons`, data).then(r => r.data);
  },

  getSeasons: (jumuiyaId: string) =>
    withCache(`seasons:${jumuiyaId}`, () =>
      apiClient.get(`${BASE(jumuiyaId)}/seasons`).then(r => r.data)
    ),

  updateSeason: (jumuiyaId: string, id: number, data: any) => {
    invalidateCache(`seasons:${jumuiyaId}`);
    return apiClient.patch(`${BASE(jumuiyaId)}/seasons/${id}`, data).then(r => r.data);
  },

  deleteSeason: (jumuiyaId: string, id: number) => {
    invalidateCache(`seasons:${jumuiyaId}`);
    return apiClient.delete(`${BASE(jumuiyaId)}/seasons/${id}`).then(r => r.data);
  },

  // ── Imports ──
  importMembers: (jumuiyaId: string, data: { members: any[]; season_id?: number; file_name?: string }) => {
    invalidateCache(`members:${jumuiyaId}`);
    invalidateCache(`imports:${jumuiyaId}`);
    invalidateCache(`stats:${jumuiyaId}`);
    invalidateCache('all-members');
    return apiClient.post(`${BASE(jumuiyaId)}/import-members`, data).then(r => r.data);
  },

  getImports: (jumuiyaId: string) =>
    withCache(`imports:${jumuiyaId}`, () =>
      apiClient.get(`${BASE(jumuiyaId)}/imports`).then(r => r.data)
    ),

  getImportStatus: (jumuiyaId: string, importId: number) =>
    apiClient.get(`${BASE(jumuiyaId)}/import-status/${importId}`).then(r => r.data),

  updateImportStatus: (jumuiyaId: string, importId: number, data: { status: string; notes?: string }) =>
    apiClient.patch(`${BASE(jumuiyaId)}/import-status/${importId}`, data).then(r => r.data),

  // ── Validation ──
  validateImportData: (jumuiyaId: string, members: any[]) =>
    apiClient.post(`${BASE(jumuiyaId)}/validate-import`, { members }).then(r => r.data),

  // ── Groups ──
  createGroups: (jumuiyaId: string, data: { groups: any[]; season_id?: number }) => {
    invalidateCache(`groups:${jumuiyaId}:`);
    return apiClient.post(`${BASE(jumuiyaId)}/create-groups`, data).then(r => r.data);
  },

  getGroups: (jumuiyaId: string, params?: { season_id?: number }) =>
    withCache(`groups:${jumuiyaId}:${params?.season_id ?? ''}`, () =>
      apiClient.get(`${BASE(jumuiyaId)}/groups`, { params }).then(r => r.data)
    ),

  updateGroup: (jumuiyaId: string, groupId: number, data: any) => {
    invalidateCache(`groups:${jumuiyaId}:`);
    return apiClient.patch(`${BASE(jumuiyaId)}/groups/${groupId}`, data).then(r => r.data);
  },

  deleteGroup: (jumuiyaId: string, groupId: number) => {
    invalidateCache(`groups:${jumuiyaId}:`);
    return apiClient.delete(`${BASE(jumuiyaId)}/groups/${groupId}`).then(r => r.data);
  },

  getGroupMembers: (jumuiyaId: string, groupId: number) =>
    withCache(`group-members:${jumuiyaId}:${groupId}`, () =>
      apiClient.get(`${BASE(jumuiyaId)}/groups/${groupId}/members`).then(r => r.data)
    ),

  // ── Distribution ──
  autoDistribute: (jumuiyaId: string, data: { season_id?: number; strategy?: string; import_id?: number }) => {
    invalidateCache(`members:${jumuiyaId}`);
    invalidateCache(`stats:${jumuiyaId}`);
    invalidateCache(`groups:${jumuiyaId}:`);
    return apiClient.post(`${BASE(jumuiyaId)}/auto-distribute`, data).then(r => r.data);
  },

  reassignMember: (jumuiyaId: string, groupId: number, memberId: number) => {
    invalidateCache(`group-members:${jumuiyaId}:`);
    invalidateCache(`members:${jumuiyaId}`);
    return apiClient.patch(`${BASE(jumuiyaId)}/groups/${groupId}/reassign`, { member_id: memberId }).then(r => r.data);
  },

  // ── Members ──
  getMembers: (jumuiyaId: string) =>
    withCache(`members:${jumuiyaId}`, () =>
      apiClient.get(`${BASE(jumuiyaId)}/members`).then(r => r.data)
    ),

  // ── Statistics ──
  getStatistics: (jumuiyaId: string) =>
    withCache(`stats:${jumuiyaId}`, () =>
      apiClient.get(`${BASE(jumuiyaId)}/statistics`).then(r => r.data)
    ),

  getBatchStatistics: () =>
    withCache('batch-stats', () =>
      apiClient.get(`/jumuiya-members/stats/batch`).then(r => r.data)
    ),

  getCsaAllocations: (jumuiyaId: string, params?: { academic_year?: string }) =>
    withCache(`csa-allocations:${jumuiyaId}:${params?.academic_year ?? ''}`, () =>
      apiClient.get(`${BASE(jumuiyaId)}/csa-allocations`, { params }).then(r => r.data)
    ),

  getDistributionHistory: (jumuiyaId: string) =>
    withCache(`dist-history:${jumuiyaId}`, () =>
      apiClient.get(`${BASE(jumuiyaId)}/distribution-history`).then(r => r.data)
    ),

  // ── Individual record update / delete (for fixing validation errors) ──
  updateImportRecord: (jumuiyaId: string, recordId: number, data: any) => {
    invalidateCache(`imports:${jumuiyaId}`);
    return apiClient.patch(`${BASE(jumuiyaId)}/import-records/${recordId}`, data).then(r => r.data);
  },
  deleteImportRecord: (jumuiyaId: string, recordId: number) => {
    invalidateCache(`imports:${jumuiyaId}`);
    return apiClient.delete(`${BASE(jumuiyaId)}/import-records/${recordId}`).then(r => r.data);
  },

  // ── CSA-Level (centralized admission & distribution) ──
  csaImportMembers: (data: { members: any[]; season_id?: number; file_name?: string; academic_year?: string }) => {
    invalidateCache('csa-pending:');
    invalidateCache('csa-stats:');
    invalidateCache('all-members');
    return apiClient.post(`/jumuiya-members/csa/import-members`, data).then(r => r.data);
  },

  csaGetPendingMembers: (params?: { academic_year?: string; gender?: string }) =>
    withCache(`csa-pending:${params?.academic_year ?? ''}:${params?.gender ?? ''}`, () =>
      apiClient.get(`/jumuiya-members/csa/pending-members`, { params }).then(r => r.data)
    ),

  csaGetJumuiyaStats: (params?: { academic_year?: string }) =>
    withCache(`csa-stats:${params?.academic_year ?? ''}`, () =>
      apiClient.get(`/jumuiya-members/csa/jumuiya-stats`, { params }).then(r => r.data)
    ),

  csaValidateMembers: (data: { members: any[] }) =>
    apiClient.post(`/jumuiya-members/csa/validate-members`, data).then(r => r.data),

  csaDistributePreview: (data?: { strategy?: string; academic_year?: string }) =>
    withCache(`csa-preview:${data?.strategy ?? ''}:${data?.academic_year ?? ''}`, () =>
      apiClient.post(`/jumuiya-members/csa/distribute-preview`, data || {}).then(r => r.data)
    ),

  csaDistributeMembers: (data?: { strategy?: string; academic_year?: string }) => {
    invalidateCache('csa-pending:');
    invalidateCache('csa-stats:');
    invalidateCache('csa-jumuiya-list:');
    invalidateCache('registered-members');
    invalidateCache('all-members');
    invalidateCache('stats:');
    return apiClient.post(`/jumuiya-members/csa/distribute`, data || {}).then(r => r.data);
  },

  // ── Coordinator Approval Workflow ──
  csaSubmitForApproval: (data?: { academic_year?: string }) => {
    invalidateCache('csa-active-batches');
    invalidateCache('csa-pending:');
    return apiClient.post(`/jumuiya-members/csa/submit-for-approval`, data || {}).then(r => r.data);
  },

  csaGetApprovals: (jumuiyaId: string) =>
    withCache(`csa-approvals:${jumuiyaId}`, () =>
      apiClient.get(`/jumuiya-members/csa/approvals/${jumuiyaId}`).then(r => r.data)
    ),

  csaReviewApproval: (id: number, data: { status: 'approved' | 'rejected'; rejection_reason?: string }) => {
    invalidateCache('csa-approvals:');
    invalidateCache('csa-active-batches');
    return apiClient.patch(`/jumuiya-members/csa/approvals/${id}/review`, data).then(r => r.data);
  },

  csaBatchReviewApprovals: (jumuiyaId: string, data: { status: 'approved' | 'rejected'; rejection_reason?: string }) => {
    invalidateCache(`csa-approvals:${jumuiyaId}`);
    invalidateCache('csa-active-batches');
    return apiClient.post(`/jumuiya-members/csa/approvals/${jumuiyaId}/batch-review`, data).then(r => r.data);
  },

  csaGetActiveBatches: () =>
    withCache('csa-active-batches', () =>
      apiClient.get(`/jumuiya-members/csa/approval-status/active`).then(r => r.data)
    ),

  csaGetApprovalStatus: (batchId: number) =>
    withCache(`csa-approval-status:${batchId}`, () =>
      apiClient.get(`/jumuiya-members/csa/approval-status/${batchId}`).then(r => r.data)
    ),

  csaFinalizeDistribution: (batchId: number) => {
    invalidateCache('csa-active-batches');
    invalidateCache('csa-approval-status:');
    invalidateCache('csa-jumuiya-list:');
    invalidateCache('registered-members');
    invalidateCache('stats:');
    return apiClient.post(`/jumuiya-members/csa/finalize/${batchId}`).then(r => r.data);
  },

  csaGetJumuiyaMemberList: (jumuiyaId: string, params?: { batch_id?: number; academic_year?: string }) =>
    withCache(`csa-jumuiya-list:${jumuiyaId}:${params?.batch_id ?? ''}:${params?.academic_year ?? ''}`, () =>
      apiClient.get(`/jumuiya-members/csa/jumuiya-list/${jumuiyaId}`, { params }).then(r => r.data)
    ),

  csaGetRejectedMembers: () =>
    withCache('csa-rejected-members', () =>
      apiClient.get(`/jumuiya-members/csa/rejected-members`).then(r => r.data)
    ),

  csaUpdateRejectedMember: (id: number, data: any) => {
    invalidateCache('csa-rejected-members');
    return apiClient.patch(`/jumuiya-members/csa/rejected-members/${id}`, data).then(r => r.data);
  },

  csaDeleteRejectedMember: (id: number) => {
    invalidateCache('csa-rejected-members');
    invalidateCache('csa-pending:');
    return apiClient.delete(`/jumuiya-members/csa/rejected-members/${id}`).then(r => r.data);
  },

  // ── All Registered Members (across all jumuiyas, for CSA Secretary) ──
  getAllRegisteredMembers: () =>
    withCache('registered-members', () =>
      apiClient.get(`/jumuiya-members/registered/all`).then(r => r.data)
    ),

  manualRegisterMember: (data: { member_id: string; jumuiya_id: string; semesters?: string[]; serial_no?: number; amount?: number }) => {
    invalidateCache('registered-members');
    invalidateCache('analytics');
    invalidateCache('batch-stats');
    invalidateCache('stats:');
    return apiClient.post(`/jumuiya-members/registered/manual`, data).then(r => r.data);
  },

  // ── All Members (across all jumuiyas) ──
  getAllMembersAcrossJumuiyas: () =>
    withCache('all-members', () =>
      apiClient.get(`/jumuiya-members/all`).then(r => r.data)
    ),

  updateMember: (id: string, data: any) => {
    invalidateCache('registered-members');
    invalidateCache('all-members');
    invalidateCache('members:');
    invalidateCache('stats:');
    invalidateCache('analytics');
    return apiClient.put(`/jumuiya-members/${encodeURIComponent(id)}`, data).then(r => r.data);
  },

  deleteMember: (id: string) => {
    invalidateCache('registered-members');
    invalidateCache('all-members');
    invalidateCache('members:');
    invalidateCache('stats:');
    invalidateCache('batch-stats');
    invalidateCache('analytics');
    return apiClient.delete(`/jumuiya-members/${encodeURIComponent(id)}`).then(r => r.data);
  },

  // ── Export ──
  exportMembers: (jumuiyaId: string) =>
    apiClient.get(`${BASE(jumuiyaId)}/export/members`).then(r => r.data),

  exportAssignments: (jumuiyaId: string) =>
    apiClient.get(`${BASE(jumuiyaId)}/export/assignments`).then(r => r.data),

  // ── Member Lookup (for official registration) ──
  lookupMemberByRegNumber: (search: string) =>
    apiClient.get(`/jumuiya-members/lookup/reg-number/${encodeURIComponent(search)}`).then(r => r.data),

  // ── Associates (alumni) ──
  migrateToAssociates: (data: { member_ids: string[]; migrated_by?: string }) => {
    invalidateCache('associates-pending:');
    invalidateCache('associates-list:');
    invalidateCache('members:');
    invalidateCache('all-members');
    invalidateCache('stats:');
    return apiClient.post(`/jumuiya-members/associates/migrate`, data).then(r => r.data);
  },

  exportAssociates: (params?: { graduation_year?: number; jumuiya_id?: string }) =>
    apiClient.get(`/jumuiya-members/associates/export`, { params }).then(r => r.data),

  undoAssociateMigration: (memberId: string) => {
    invalidateCache('associates-list:');
    invalidateCache('members:');
    invalidateCache('all-members');
    return apiClient.post(`/jumuiya-members/associates/undo`, { member_id: memberId }).then(r => r.data);
  },

  // ── Stamp Card ──
  sendStampCard: (data: { email: string; pdfBase64: string; memberName: string; jumuiyaName: string }) =>
    apiClient.post(`/jumuiya-members/send-stamp-card`, data).then(r => r.data),

  // ── Registration with Payment ──
  registerWithPayment: (data: { member_id: string; jumuiya_id: string; phoneNumber: string; amount: number }) => {
    invalidateCache('payments:');
    invalidateCache('registered-members');
    invalidateCache('analytics');
    return apiClient.post(`/jumuiya-members/register-with-payment`, data).then(r => r.data);
  },

  bulkRegisterWithPayment: (data: { member_ids: string[]; jumuiya_id: string; phoneNumber: string; amount: number }) => {
    invalidateCache('payments:');
    invalidateCache('registered-members');
    invalidateCache('analytics');
    return apiClient.post(`/jumuiya-members/bulk-register-with-payment`, data).then(r => r.data);
  },

  // ── Analytics ──
  getAnalytics: () =>
    withCache('analytics', () =>
      apiClient.get(`/jumuiya-members/analytics`).then(r => r.data)
    ),

  getCohortAnalytics: () =>
    withCache('cohort-analytics', () =>
      apiClient.get(`/jumuiya-members/analytics/cohorts`).then(r => r.data)
    ),

  getJumuiyaProgression: (params?: { from?: number; to?: number }) =>
    withCache(`jumuiya-progression:${params?.from ?? ''}:${params?.to ?? ''}`, () =>
      apiClient.get(`/jumuiya-members/analytics/jumuiya-progression`, { params }).then(r => r.data)
    ),

  getYearlyContribution: (params?: { year?: number }) =>
    withCache(`yearly-contribution:${params?.year ?? ''}`, () =>
      apiClient.get(`/jumuiya-members/analytics/yearly-contribution`, { params }).then(r => r.data)
    ),

  getPayments: (params?: { status?: string }) =>
    withCache(`payments:${params?.status ?? ''}`, () =>
      apiClient.get(`/jumuiya-members/payments`, { params }).then(r => r.data)
    ),

  updatePaymentStatus: (id: number, data: { status: string; mpesa_receipt?: string }) => {
    invalidateCache('payments:');
    return apiClient.patch(`/jumuiya-members/payments/${id}/status`, data).then(r => r.data);
  },

  // ── Associates ──
  getAssociatesPending: (params?: { jumuiya_id?: string }) =>
    withCache(`associates-pending:${params?.jumuiya_id ?? ''}`, () =>
      apiClient.get(`/jumuiya-members/associates/pending`, { params }).then(r => r.data)
    ),

  getAssociatesList: (params?: { jumuiya_id?: string; graduation_year?: number }) =>
    withCache(`associates-list:${params?.jumuiya_id ?? ''}:${params?.graduation_year ?? ''}`, () =>
      apiClient.get(`/jumuiya-members/associates/list`, { params }).then(r => r.data)
    ),

  // ── Semester History ──
  getSemesterHistory: (params?: { from_year?: number; to_year?: number }) =>
    withCache(`semester-history:${params?.from_year ?? ''}:${params?.to_year ?? ''}`, () =>
      apiClient.get(`/jumuiya-members/semester-history`, { params }).then(r => r.data)
    ),
};
