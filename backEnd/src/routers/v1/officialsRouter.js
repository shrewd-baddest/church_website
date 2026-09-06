import express from 'express';
import { 
  getAllOfficials,
  getOfficialById,
  createOfficial,
  updateOfficial,
  deleteOfficial,
  getAllElectionTerms,
  getCurrentElectionTerm,
  createElectionTerm,
  updateElectionTerm,
  deleteElectionTerm,
  archiveCurrentOfficials,
  handoverOfficials,
  lookupMember,
  getOfficialsByTerm,
  updateTermClosingMessage,
  restoreArchivedOfficials,
  exportOfficials,
  exportArchivedOfficials,
  deleteArchivedOfficial,
  bulkDeleteArchivedOfficials,
  clearAllOfficials,
} from '../../controllers/officialsController.js';

import { uploadMiddleware } from '../../middlewares/uploadMiddleware.js';
import verifyToken from '../../middlewares/Tokens.js';
import optionalAuth from '../../middlewares/optionalAuth.js';
import requireRole, { OFFICIAL_ROLES } from '../../middlewares/requireRole.js';

const router = express.Router();

// Election Term Routes
router.get('/terms', getAllElectionTerms);
router.get('/terms/current', getCurrentElectionTerm);
router.post('/terms', verifyToken, requireRole(...OFFICIAL_ROLES), createElectionTerm);
router.put('/terms/:id', verifyToken, requireRole(...OFFICIAL_ROLES), updateElectionTerm);
router.delete('/terms/:id', verifyToken, requireRole(...OFFICIAL_ROLES), deleteElectionTerm);

// Archive & Restore routes
router.post('/archive', verifyToken, requireRole(...OFFICIAL_ROLES), archiveCurrentOfficials);
router.post('/handover', verifyToken, requireRole(...OFFICIAL_ROLES), handoverOfficials);
router.post('/restore', verifyToken, requireRole(...OFFICIAL_ROLES), restoreArchivedOfficials);
router.get('/term', optionalAuth, getOfficialsByTerm);
router.get('/term/:termId', optionalAuth, getOfficialsByTerm);
router.put('/term/:termId/closing-message', verifyToken, requireRole(...OFFICIAL_ROLES), updateTermClosingMessage);
router.get('/term/:termId/export', verifyToken, requireRole(...OFFICIAL_ROLES), exportArchivedOfficials);
router.delete('/term', verifyToken, requireRole(...OFFICIAL_ROLES), bulkDeleteArchivedOfficials);
router.delete('/term/:officialId', verifyToken, requireRole(...OFFICIAL_ROLES), deleteArchivedOfficial);

// Member lookup for handover
router.get('/lookup-member/:regNumber', verifyToken, requireRole(...OFFICIAL_ROLES), lookupMember);

// Clear all (admin utility)
router.delete('/clear-all', verifyToken, requireRole(...OFFICIAL_ROLES), clearAllOfficials);

// Basic CRUD routes for Officials
router.get('/list', optionalAuth, getAllOfficials); 
router.get('/export', verifyToken, requireRole(...OFFICIAL_ROLES), exportOfficials);
router.get('/:id', optionalAuth, getOfficialById);
router.post('/', verifyToken, requireRole(...OFFICIAL_ROLES), uploadMiddleware, createOfficial);
router.put('/:id', verifyToken, requireRole(...OFFICIAL_ROLES), uploadMiddleware, updateOfficial);
router.delete('/:id', verifyToken, requireRole(...OFFICIAL_ROLES), deleteOfficial);

export default router;
