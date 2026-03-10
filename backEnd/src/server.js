import express from "express";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import cors from "cors";
import { auth } from "./routers/Authorization.js";
import { api } from "./routers/api.js";
import { connectDb } from "./Configs/dbConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/authentication", auth);
app.use("/api", api);

const initServer = async () => {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`server is running in port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server due to DB connection error:", error.message);
    process.exit(1);
  }
};

initServer();
