

import authRoutes from "./v1/Authorization.js"
import generateQuestions from "./v1/GenerateQuestions.js"
import uploadMedia from "./v1/mediaRoutes.js"
import hubView from "./hubRouter.js"
import {Router} from "express"

const route = Router()

route.use("/v1" , authRoutes)
route.use("/v1" , generateQuestions)
route.use("/v1" , uploadMedia)
route.use("/" , hubView)

export default route