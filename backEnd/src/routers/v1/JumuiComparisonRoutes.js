



import {Router} from "express"
import { getJumuiComparison } from "../../controllers/jumuyiaComparison/index.js";


const router = Router()

router.get("/jumuiya-comparison", getJumuiComparison);


export default router;
