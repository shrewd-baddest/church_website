import connectToMongoDb, { connectDb } from "./Configs/dbConfig.js";
import { serverConfig } from "./Configs/serverConfigs.js";
import { app } from "./app.js";
import logger from "./logger/winston.js";

const PORT = serverConfig.PORT || 3001;
const HOST = serverConfig.HOST || "0.0.0.0";

// function that initiate express server , it waits for postgree db and mongo db to connect then runs the server at defined port
const initServer = async () => {
  try {
    await connectDb();

    // Optional Mongo
    try {
      await connectToMongoDb();
      process.env.mongoConnected = "true";
    } catch (mongoError) {
      process.env.mongoConnected = "false";
      logger.warn(
        "MongoDB unavailable, questions feature disabled:",
        mongoError.message,
      );
    }

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

// Step 1: Define signals to listen for
const signals = ["SIGINT", "SIGTERM", "SIGHUP"];

// Step 2: Flag to track shutdown state
let isShuttingDown = false;

// Step 3: Shutdown handler
const shutDown = (signal) => {
  if (isShuttingDown) return; // Prevent multiple calls
  isShuttingDown = true;
  logger.debug(`Received ${signal}. Shutting down gracefully...`);
  // Close server, release resources, etc.
  // Example: server.close(() => { ... });

  // Exit with code 0 (success)
  process.exit(0);
};

// Step 4: Attach listeners for each signal

signals.forEach((sig) => {
  process.on(sig, () => shutDown(sig));
});

initServer();
