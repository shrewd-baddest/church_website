import { serverConfig } from "./Configs/serverConfigs.js";
import { httpServer } from "./app.js";
import { connectDb, connectToMongoDb } from "./Configs/dbConfig.js";
import logger from "./logger/winston.js";
import { runMigration } from "./migrations/scripts/index.js";
import { startKeepAliveWorker } from "./services/keep-alive.js";

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});


const initServer = async () => {
  // Start DB connections in parallel without blocking the app server
  try {
    await connectDb();
    //  await connectToMongoDb(;
    // await runMigration();


    httpServer.listen(serverConfig.PORT, () => {
      logger.info(`⚙️  Server is running on http://localhost:${serverConfig.PORT}`);
      startKeepAliveWorker();
    });
  } catch (error) {
    logger.error("Failed to start server:", error.message);
    process.exit(1);
  }
};



// Step 1: Define signals to listen for
const signals = ["SIGINT", "SIGTERM", "SIGHUP"];
// Step 2: Flag to track shutdown state
let isShuttingDown = false;
// Step 3: Shutdown handler
const shutDown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.debug(`Received ${signal}. Shutting down gracefully...`);
  process.exit(0);
};




// Step 4: Attach listeners for each signal
signals.forEach((sig) => {
  process.on(sig, () => shutDown(sig));
});

initServer();
