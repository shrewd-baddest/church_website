import express, { json } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { auth } from "./routers/Authorization.js";
import { testDb } from "./Configs/dbConfig.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/authentication", auth);

const initServer = async () => {
  try {
    await testDb();
    app.listen(PORT, () => {
      console.log(`server is running in port ${PORT}`);
    });
  } catch (error) {
    console.error(error.message);
  }
};

initServer();
