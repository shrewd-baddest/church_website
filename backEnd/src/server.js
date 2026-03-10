import { testDb } from "./Configs/dbConfig.js";
import { serverConfig } from "./Configs/serverConfigs.js";
import { app } from "./app.js";
import logger from "./logger/winston.js";


// function that initiate express server , it waits for postgree db to connect then runs the server at defined port 
const initServer = async () => {
  try {
    // asychronous operation to connect to remote postgree db
    await testDb();
    app.listen( serverConfig.PORT , serverConfig.HOST , () => {
      logger.info("⚙️  Server is running on port: " + process.env.PORT);
    });
  } catch (error) {
    logger.error("Failed to connect to the database. Server not started." + error?.message , error , ` ${error?.stack}`);
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




logger.debug("Server running. Listening for shutdown signals...");

initServer();


