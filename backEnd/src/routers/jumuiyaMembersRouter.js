import express from 'express';
import verifyToken from '../middlewares/Tokens.js';
import {
  getAllJumuiyaMembers,
  getAllMembersAcrossJumuiyas,
  createJumuiyaMember,
  updateJumuiyaMember,
  deleteJumuiyaMember,
  getUnregisteredMembers,
  bulkJoinJumuiya,
  getRegisteredJumuiyaMembers,
  getAllRegisteredMembers,
  manualRegisterMember,
  unregisterJumuiyaMember,
  registerWithPayment,
  bulkRegisterWithPayment,
  getJumuiyaLookup,
  sendStampCard,
  getAnalytics,
  getPayments,
  updatePaymentStatus,
  getCohortAnalytics,
  getJumuiyaProgression,
  getYearlyContribution,
  getSemesterHistory,
} from '../controllers/jumuiyaMembersController.js';
import {
  getPendingMigrationMembers,
  migrateToAssociates,
  getAssociatesList,
  exportAssociates,
  undoMigration,
} from '../controllers/associatesController.js';


const router = express.Router();

router.get('/', getAllJumuiyaMembers);
router.get('/all', getAllMembersAcrossJumuiyas);
router.get('/registered', getRegisteredJumuiyaMembers);
router.get('/registered/all', getAllRegisteredMembers);
router.get('/analytics', getAnalytics);
router.get('/analytics/cohorts', getCohortAnalytics);
router.get('/analytics/jumuiya-progression', getJumuiyaProgression);
router.get('/analytics/yearly-contribution', getYearlyContribution);
router.get('/semester-history', getSemesterHistory);
router.get('/payments', getPayments);
router.patch('/payments/:id/status', updatePaymentStatus);
router.post('/registered/manual', manualRegisterMember);
router.get('/unregistered', getUnregisteredMembers);
router.get('/lookup', getJumuiyaLookup);
router.post('/', createJumuiyaMember);
router.post('/bulk-join', bulkJoinJumuiya);
router.post('/bulk-register-with-payment', bulkRegisterWithPayment);
router.post('/register-with-payment', registerWithPayment);
router.post('/send-stamp-card', sendStampCard);
router.put('/:id', verifyToken, updateJumuiyaMember);
router.delete('/:id', deleteJumuiyaMember);
router.delete('/unregister/:id', unregisterJumuiyaMember);

// ── Associates (alumni) routes ──
router.get('/associates/pending', getPendingMigrationMembers);
router.post('/associates/migrate', migrateToAssociates);
router.get('/associates/list', getAssociatesList);
router.get('/associates/export', exportAssociates);
router.post('/associates/undo', undoMigration);

export default router;
