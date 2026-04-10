

import morgan from "morgan";
import logger from "./winston.js";

const stream = {
  // Use the http severity
  write: (message) => {
    if (logger && logger.http) {
      logger.http(message.trim());
    } else {
      console.log(`[HTTP] ${message.trim()}`);
    }
  },
};

const skip = () => {
  const env = process.env.NODE_ENV || "development";
  return env !== "development";
};

const morganMiddleware = morgan(":remote-addr :method :url :status - :response-time ms", { stream, skip });

export default morganMiddleware;
