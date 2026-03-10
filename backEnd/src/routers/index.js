

import v1authRoutes from "./v1/Authorization.js"
import {Router} from "express"

const authRoute = Router()

authRoute.use("/v1" , v1authRoutes)

export default authRoute