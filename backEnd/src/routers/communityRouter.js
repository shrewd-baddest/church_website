import { Router } from 'express';
import * as communityController from '../controllers/communityController.js';

const router = Router();

router.get('/debug-router', (req, res) => res.send('ROUTER IS WORKING'));
router.get('/', communityController.getIndex);
router.get('/data', communityController.getHubData);
router.get('/choir', communityController.getModule);
router.get('/dancers', communityController.getModule);
router.get('/st-francis', communityController.getModule);
router.get('/charismatic', communityController.getModule);
router.get('/charismatic-prayer-group', communityController.getModule);

export default router;
