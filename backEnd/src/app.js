import express, { json } from "express";
import cors from "cors";
import authRoute from "./routers/index.js";
import logger from "./logger/winston.js";


const app = express();

app.use(cors());
app.use(express.json());


//include versioning to avoid break  the app in feuture adaptation
app.use("/authentication" , authRoute )

// Catch handled rejections normally
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Catch exceptions not in promises
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1); // Exit with failure code
});





export  {app}