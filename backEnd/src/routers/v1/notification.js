

import {Router} from "express"
import { createNotification, deleteNotification, updateNotification , getNotification } from "../../controllers/events/index.js";

const router = Router()

router.post("/", createNotification);
router.get("/", getNotification);
router.put("/", updateNotification);
router.delete("/", deleteNotification);


export default router;
