

import authRoutes from "./v1/Authorization.js"
import generateQuestions from "./v1/GenerateQuestions.js"
import uploadMedia from "./v1/mediaRoutes.js"
import communityView from "./communityRouter.js"
import {Router} from "express"

const route = Router()

route.use("/v1" , authRoutes)
route.use("/v1" , generateQuestions)
route.use("/v1" , uploadMedia)
route.use("/" , communityView)

export default route