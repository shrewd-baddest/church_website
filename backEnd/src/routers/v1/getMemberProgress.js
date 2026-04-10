
import {Router} from "express"
import { getMemberProgress , getMemberSummary } from "../../controllers/member/index.js";


const router = Router()

router.get("/progress", getMemberProgress);
router.get("/summary", getMemberSummary);


export default router;
