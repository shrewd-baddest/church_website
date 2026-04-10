import { api as tableApi } from "../api.js"
import authRoutes from "./Authorization.js"
import QuestionsRoutes from "./GenerateQuestions.js"
import uploadMedia from "./mediaRoutes.js"
import memberProgressRoute from "./getMemberProgress.js"
import JumuiComparisonRoutes from "./JumuiComparisonRoutes.js"
import notificationRoutes from "./notification.js"
import {Router} from "express"
import verifyToken from "../../middleWares/Tokens.js"

const router = Router()

router.use("/authentication", authRoutes);
router.use("/questions", verifyToken, QuestionsRoutes);
router.use("/files" ,verifyToken, uploadMedia)
router.use("/member"  ,verifyToken, memberProgressRoute)
router.use("/notifications" ,verifyToken, notificationRoutes)
router.use("/csa"  ,verifyToken, JumuiComparisonRoutes)
router.use("/", tableApi);

export default router;