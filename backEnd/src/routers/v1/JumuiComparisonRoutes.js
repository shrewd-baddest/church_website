



import {Router} from "express"
import { getJumuiComparison } from "../../controllers/jumuyiaComparison/index.js";


const router = Router()

router.use("/jumui-comparison", getJumuiComparison);


export default router;
