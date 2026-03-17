import connectToMongoDb, { connectDb } from "./Configs/dbConfig.js";
import { serverConfig } from "./Configs/serverConfigs.js";
import { app } from "./app.js";
import logger from "./logger/winston.js";

// function that initiate express server , it waits for postgres db then attempts mongo
const initServer = async () => {
  try {
    await connectDb();
    
    // Optional Mongo
    try {
      await connectToMongoDb();
      process.env.mongoConnected = 'true';
    } catch (mongoError) {
      process.env.mongoConnected = 'false';
      logger.warn('MongoDB unavailable, questions feature disabled:', mongoError.message);
    }

    app.listen( serverConfig.PORT , serverConfig.HOST , () => {
      logger.info("⚙️  Server is running!");
    });
  } catch (error) {
    logger.error("Database connection failed:", error.message);
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
