import express from "express";
import cors from "cors";
import authRoute from "./routers/index.js";
import generateQuestionsRoute from "./routers/index.js";
import logger from "./logger/winston.js";
import morganMiddleware from "./logger/morgan.js";
import { rateLimit } from "express-rate-limit";
import requestIp from "request-ip";
import corsOptions from "./Configs/corsConfigs.js"

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads"));


// this is the best way to to get the actual ip adress of a device even if the server is behind a proxy 
//rather than getting the proxy ip adress usefull in fare shairing of resorces
app.use(requestIp.mw());

app.use(cors(corsOptions));

// Rate limiter to avoid misuse of the service and avoid cost spikes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req, res) => {
    return req.clientIp; // IP address from requestIp.mw(), as opposed to req.ip
  },
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 500,
      `There are too many requests. You are only allowed ${
        options.max
      } requests per ${options.windowMs / 60000} minutes`
    );
  },
});

// Apply the rate limiting middleware to all requests
app.use(limiter);



//include versioning to avoid break  the app in feuture adaptation
app.use("/authentication" , authRoute )
app.use("/questions" , generateQuestionsRoute )


// Catch handled rejections normally
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1); // Exit with failure code
});

// Catch exceptions not in promises
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1); // Exit with failure code
});



app.use(morganMiddleware);

export  {app}