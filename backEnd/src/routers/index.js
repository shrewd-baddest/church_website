

import authRoutes from "./v1/Authorization.js"
import generateQuestions from "./v1/GenerateQuestions.js"
import uploadMedia from "./v1/mediaRoutes.js"
import memberProgressRoute from "./v1/getMemberProgress.js"
import memberSummaryRoute from "./v1/getMemberSummary.js"
import JumuiComparisonRoutes from "./v1/JumuiComparisonRoutes.js"
import {Router} from "express"

const router = Router()

router.use("/v1" , authRoutes)
router.use("/v1" , generateQuestions)
router.use("/v1" , uploadMedia)

router.use("/v1", memberProgressRoute);
router.use("/v1", memberSummaryRoute);
router.use("/v1", JumuiComparisonRoutes);

export default router;
