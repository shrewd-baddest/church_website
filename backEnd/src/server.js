import { serverConfig } from "./Configs/serverConfigs.js";
import { app } from "./app.js";
import { connectDb, connectToMongoDb } from "./Configs/dbConfig.js";
import logger from "./logger/winston.js";

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});


const initServer = async () => {
  // Start DB connections in parallel without blocking the app server
  try {
    connectDb().catch(err => logger.error("Postgres connection failed (continuing anyway):", err.message));
    // connectToMongoDb().catch(err => logger.error("MongoDB connection failed (continuing anyway):", err.message));

    app.listen(serverConfig.PORT, () => {
      logger.info(`⚙️  Server is running on http://localhost:${serverConfig.PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error.message);
  }
};

const signals = ["SIGINT", "SIGTERM", "SIGHUP"];
let isShuttingDown = false;

const shutDown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.debug(`Received ${signal}. Shutting down gracefully...`);
  process.exit(0);
};

signals.forEach((sig) => {
  process.on(sig, () => shutDown(sig));
});

initServer();
