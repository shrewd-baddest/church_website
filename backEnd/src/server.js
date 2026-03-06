import express, { json } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { auth } from "./routers/Authorization.js";
import { testDb } from "./Configs/dbConfig.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ;

app.use(cors());
app.use(express.json());

app.use("/authentication", auth);

process.on('exit', (code) => {
  console.log(`Process exiting with code: ${code}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

try {
  await testDb();
  const server = app.listen(PORT, () => {
    console.log(`server is running in port ${PORT}`);
  });

  server.on('close', () => {
    console.log('Server listener closed');
  });

  server.on('error', (err) => {
    console.error('Server listener error:', err);
  });

  // Keep-alive heartbeat
  setInterval(() => {
    // console.log('Heartbeat...');
  }, 10000);

} catch (error) {
  console.error("Failed to start server:", error.message);
}
