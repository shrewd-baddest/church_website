

import {Router} from "express"
import { createNotification, deleteNotification, updateNotification } from "../../controllers/events/index.js";

const router = Router()

router.post("/", createNotification);
router.put("/", updateNotification);
router.delete("/", deleteNotification);


export default router;
