import connectToMongoDb, { connectDb } from "./Configs/dbConfig.js";
import { serverConfig } from "./Configs/serverConfigs.js";
import { app } from "./app.js";
import logger from "./logger/winston.js";

const PORT = serverConfig.PORT || 3001;
const HOST = serverConfig.HOST || "0.0.0.0";

// function that initiate express server , it waits for postgree db and mongo db to connect then runs the server at defined port
const initServer = async () => {
  try {
    // asynchronous operation to connect to remote databases
    await connectDb();
    await connectToMongoDb();

    app.listen(PORT, () => {
      logger.info(`⚙️  Server is running on ${PORT}`);
      logger.debug("Server running. Listening for shutdown signals...");
    });
  } catch (error) {
    logger.error(
      "Failed to connect to the database. Server not started. " +
        error?.message,
      ` ${error?.stack}`,
    );
  }
};

// Graceful shutdown handling
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
