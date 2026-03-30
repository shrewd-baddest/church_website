

import {Router} from "express"
import { getMemberSummary } from "../../controllers/member/index.js";


const router = Router()

router.use("/summary", getMemberSummary);


export default router;
