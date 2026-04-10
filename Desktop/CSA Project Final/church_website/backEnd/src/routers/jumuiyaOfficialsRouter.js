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
import upload from '../Configs/multerStorageConfig.js';

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
router.get('/export', exportJumuiyaOfficials);
router.get('/:id', getJumuiyaOfficialById);
router.post('/', upload.single('photo'), createJumuiyaOfficial);
router.put('/:id', upload.single('photo'), updateJumuiyaOfficial);
router.delete('/:id', deleteJumuiyaOfficial);

export default router;
