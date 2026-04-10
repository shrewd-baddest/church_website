import { Router } from 'express';
import * as hubController from '../controllers/hubController.js';

const router = Router();

router.get('/', hubController.getIndex);
router.get('/choir', hubController.getModule);
router.get('/dancers', hubController.getModule);
router.get('/charismatic-prayer-group', hubController.getModule);
router.get('/st-francis', hubController.getModule);

export const hubRouter = router;
