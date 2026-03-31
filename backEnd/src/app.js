import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import cors from "cors";
import apiRoutes from "./routers/index.js";
import { api } from "./routers/api.js";
import { hubRouter } from "./routers/hubRouter.js";
import officialsRouter from "./routers/officialsRouter.js";
import jumuiyaOfficialsRouter from "./routers/jumuiyaOfficialsRouter.js";
import { BackendDataService } from "./services/backend-data.js";
import morganMiddleware from "./logger/morgan.js";
import { rateLimit } from "express-rate-limit";
import requestIp from "request-ip";
import corsOptions from "./Configs/corsConfigs.js";
import upload from "./Configs/multerStorageConfig.js";
import { Server } from "socket.io";
import cookieParser from "cookie-Parser"
import { errorHandler } from "./middleWares/error.middlewares.js";
import { initializeSocketIO, setSocketInstance } from "./socket/index.js";
import { requestLogger } from "./middleWares/requestLogger.js";


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
  pingTimeout: 60000, //the socket will listen for 6 second of inactivity then only then decleare as not connected
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

// set the io instance directly to the app object to avoid global use cases as follows req.app.get("io")
app.set("io", io);


// EJS Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

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
  handler: (_, __, ___, options) => {
    res.status(options.statusCode || 429).json({
      error: `There are too many requests. You are only allowed ${options.max
      } requests per ${options.windowMs / 60000} minutes`,
    });
  },
});

app.use(limiter);
app.use(morganMiddleware);

app.use("/authentication", apiRoutes);
app.use("/questions", apiRoutes);
app.use("/files" , apiRoutes)
app.use("/member"  , apiRoutes)
app.use("/csa"  , apiRoutes)




// Static Files
app.use(express.static(path.join(__dirname, "../../frontEnd/public")));
app.use(express.static(path.join(__dirname, "../../frontEnd/src/pages/sacramental/public")));
// Routes
app.get('/', (_req, res) => res.redirect('/community-hub'));
app.use("/api/officials", officialsRouter);
app.use("/api/jumuiya-officials", jumuiyaOfficialsRouter);
app.use("/api", api);
app.use("/community-hub", hubRouter);
// Gallery APIs
app.get("/api/choir/gallery", (_req, res) => {
  const gallery = BackendDataService.load("choir_gallery.json", []);
  res.json(gallery);
});
app.post("/api/choir/gallery", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const gallery = BackendDataService.load("choir_gallery.json", []);
  const newPhoto = {
    id: Date.now().toString(),
    filename: req.file.filename,
    eventName: req.body.eventName || "Untitled Event",
    description: req.body.description || "",
    uploadDate: new Date().toISOString(),
    imageUrl: `/images/gallery/${req.file.filename}`,
  };
  gallery.push(newPhoto);
  BackendDataService.save("choir_gallery.json", gallery);
  res.status(201).json(newPhoto);
});


// Initialize Backend Data Service
BackendDataService.init();



initializeSocketIO(io)
setSocketInstance(io);
app.use(requestLogger);
app.use(errorHandler)

export { app };
