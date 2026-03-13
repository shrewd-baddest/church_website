

import authRoutes from "./v1/Authorization.js"
import generateQuestions from "./v1/GenerateQuestions.js"
import {Router} from "express"

const route = Router()

route.use("/v1" , authRoutes)
route.use("/v1" , generateQuestions)

export default route