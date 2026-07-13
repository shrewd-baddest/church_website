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
  getOfficialsByTerm,
  restoreArchivedOfficials,
  exportOfficials,
  exportArchivedOfficials,
  deleteArchivedOfficial,
  bulkDeleteArchivedOfficials,
  clearAllOfficials,
  respondDeletionApproval,
  getDeletionApprovalInfo,
} from '../../controllers/officialsController.js';

import { uploadMiddleware } from '../../middlewares/uploadMiddleware.js';
import verifyToken from '../../middlewares/Tokens.js';

const router = express.Router();

// Election Term Routes
router.get('/terms', getAllElectionTerms);
router.get('/terms/current', getCurrentElectionTerm);
router.post('/terms', verifyToken, createElectionTerm);
router.put('/terms/:id', verifyToken, updateElectionTerm);
router.delete('/terms/:id', verifyToken, deleteElectionTerm);

// Archive & Restore routes
router.post('/archive', verifyToken, archiveCurrentOfficials);
router.post('/restore', verifyToken, restoreArchivedOfficials);
router.get('/term', getOfficialsByTerm);
router.get('/term/:termId', getOfficialsByTerm);
router.get('/term/:termId/export', exportArchivedOfficials);
router.delete('/term', bulkDeleteArchivedOfficials);
router.delete('/term/:officialId', deleteArchivedOfficial);

// Clear all (admin utility)
router.delete('/clear-all', verifyToken, clearAllOfficials);

// Deletion approval routes (before generic :id routes)
router.post('/deletion-approval/:token/respond', respondDeletionApproval);
router.get('/deletion-approval/:token', getDeletionApprovalInfo);

// Basic CRUD routes for Officials
router.get('/list', getAllOfficials); 
router.get('/export', exportOfficials);
router.get('/:id', getOfficialById);
router.post('/', verifyToken, uploadMiddleware, createOfficial);
router.put('/:id', verifyToken, uploadMiddleware, updateOfficial);
router.delete('/:id', verifyToken, deleteOfficial);

export default router;
