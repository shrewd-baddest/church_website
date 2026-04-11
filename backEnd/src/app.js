import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import cors from "cors";
import apiRoutes from "./routers/index.js";
import morganMiddleware from "./logger/morgan.js";
import { BackendDataService } from "./services/backend-data.js";
import { rateLimit } from "express-rate-limit";
import requestIp from "request-ip";
import corsOptions from "./Configs/corsConfigs.js";
import { Server } from "socket.io";
import cookieParser from "cookie-parser"
import { errorHandler } from "./middlewares/error.middlewares.js";
import { initializeSocketIO, setSocketInstance } from "./socket/index.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// app midlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// create app using httserver so we can add a socket on top of the serve , unlike the http server
const httpServer = createServer(app);

const io = new Server(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin:process.env.CORS_ORIGIN,
    credentials: true,
  },
});

initializeSocketIO(io)
setSocketInstance(io);

// this is the best way to to get the actual ip adress of a device even if the server is behind a proxy
//rather than getting the proxy ip adress , usefull in fare shairing of resorces
app.use(requestIp.mw());

app.use(cors(corsOptions));

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.clientIp;
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode || 429).json({
      error: `There are too many requests. You are only allowed ${options.max
      } requests per ${options.windowMs / 60000} minutes`,
    });
  },
});

// app.use(limiter);
app.use(morganMiddleware);

app.use("/api", apiRoutes)

// Organized Static Route for locally uploaded media files
app.use("/uploads", express.static(path.join(__dirname, "../localFileUploads")));


// Initialize Backend Data Service
BackendDataService.init();




app.use(errorHandler)

export { httpServer };
