import { Router } from 'express';
import * as hubController from '../controllers/hubController.js';

const router = Router();

router.get('/debug-router', (req, res) => res.send('ROUTER IS WORKING'));
router.get('/', hubController.getIndex);
router.get('/data', hubController.getHubData);
router.get('/choir', hubController.getModule);
router.get('/dancers', hubController.getModule);
router.get('/st-francis', hubController.getModule);
router.get('/charismatic', hubController.getModule);
router.get('/charismatic-prayer-group', hubController.getModule);

export default router;
