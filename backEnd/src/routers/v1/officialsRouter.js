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
  bulkDeleteArchivedOfficials
} from '../../controllers/officialsController.js';

import { uploadMiddleware } from '../../middlewares/uploadMiddleware.js';

const router = express.Router();

// Election Term Routes
router.get('/terms', getAllElectionTerms);
router.get('/terms/current', getCurrentElectionTerm);
router.post('/terms', createElectionTerm);
router.put('/terms/:id', updateElectionTerm);
router.delete('/terms/:id', deleteElectionTerm);

// Archive & Restore routes
router.post('/archive', archiveCurrentOfficials);
router.post('/restore', restoreArchivedOfficials);
router.get('/term/:termId', getOfficialsByTerm);
router.get('/term/:termId/export', exportArchivedOfficials);
router.delete('/term', bulkDeleteArchivedOfficials);
router.delete('/term/:officialId', deleteArchivedOfficial);

// Basic CRUD routes for Officials
router.get('/list', getAllOfficials); 
router.get('/export', exportOfficials);
router.get('/:id', getOfficialById);
router.post('/', uploadMiddleware, createOfficial);
router.put('/:id', uploadMiddleware, updateOfficial);
router.delete('/:id', deleteOfficial);

export default router;
