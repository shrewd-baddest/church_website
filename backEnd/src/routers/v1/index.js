

import authRoutes from "./Authorization.js"
import QuestionsRoutes from "./GenerateQuestions.js"
import uploadMedia from "./mediaRoutes.js"
import memberProgressRoute from "./getMemberProgress.js"
import JumuiComparisonRoutes from "./JumuiComparisonRoutes.js"
import notificationRoutes from "./notification.js"
import {Router} from "express"

const router = Router()

router.use("/authentication", authRoutes);
router.use("/questions", QuestionsRoutes);
router.use("/files" , uploadMedia)
router.use("/member"  , memberProgressRoute)
router.use("/notifications" , notificationRoutes)
router.use("/csa"  , JumuiComparisonRoutes)

export default router;