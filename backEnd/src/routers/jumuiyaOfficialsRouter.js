import express from 'express';
import { 
  getAllJumuiyaOfficials,
  getJumuiyaOfficialById,
  createJumuiyaOfficial,
  updateJumuiyaOfficial,
  deleteJumuiyaOfficial,
  archiveCurrentJumuiyaOfficials,
  getJumuiyaOfficialsByTerm,
  restoreArchivedJumuiyaOfficials,
  exportJumuiyaOfficials,
  exportArchivedJumuiyaOfficials,
  deleteArchivedJumuiyaOfficial,
  bulkDeleteArchivedJumuiyaOfficials
} from '../controllers/jumuiyaOfficialsController.js';
import { createFile } from '../controllers/mediaController.js';

const router = express.Router();

// Archive & Restore routes
router.post('/archive', archiveCurrentJumuiyaOfficials);
router.post('/restore', restoreArchivedJumuiyaOfficials);
router.get('/term/:termId', getJumuiyaOfficialsByTerm);
router.get('/term/:termId/export', exportArchivedJumuiyaOfficials);
router.delete('/term', bulkDeleteArchivedJumuiyaOfficials);
router.delete('/term/:id', deleteArchivedJumuiyaOfficial);

// Basic CRUD routes for Jumuiya Officials
router.get('/', getAllJumuiyaOfficials);
router.get('/list', getAllJumuiyaOfficials);
router.get('/export', exportJumuiyaOfficials);
router.post('/', createFile, createJumuiyaOfficial);
router.get('/:id', getJumuiyaOfficialById);
router.put('/:id',createFile, updateJumuiyaOfficial);
router.delete('/:id', deleteJumuiyaOfficial);

export default router;
