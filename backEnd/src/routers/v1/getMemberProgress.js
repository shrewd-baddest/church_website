
import {Router} from "express"
import { getMemberProgress } from "../../controllers/member/index.js";

const router = Router()

router.use("/progress", getMemberProgress);


export default router;
