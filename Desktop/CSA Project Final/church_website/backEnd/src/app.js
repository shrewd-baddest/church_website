import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import multer from 'multer';

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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize Backend Data Service
BackendDataService.init();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  handler: (req, res, next, options) => {
    res.status(options.statusCode || 429).json({
      error: `There are too many requests. You are only allowed ${options.max
        } requests per ${options.windowMs / 60000} minutes`,
    });
  },
});

app.use(limiter);
app.use(morganMiddleware);


// Static Files
app.use(express.static(path.join(__dirname, "../../frontEnd/public")));
app.use(express.static(path.join(__dirname, "../../frontEnd/src/pages/sacramental/public")));
app.use("/community-assets/backend",express.static(path.join(__dirname, "../../frontEnd/src/pages/sacramental/dist/backend"),),);
app.use("/community-assets", express.static(path.join(__dirname, "../../frontEnd/src/pages/sacramental")),);
app.use("/localFileUploads", express.static(path.join(process.cwd(), "localFileUploads")));
app.use("/uploads", express.static(path.join(process.cwd(), "localFileUploads")));


// Routes
app.get('/', (_req, res) => res.redirect('/community-hub'));
app.use("/authentication", apiRoutes);
app.use("/api/officials", officialsRouter);
app.use("/api/jumuiya-officials", jumuiyaOfficialsRouter);
app.use("/api", api);
app.use("/community-hub", hubRouter);
app.use("/questions", apiRoutes);
app.use("/files" , apiRoutes)







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






export { app };
