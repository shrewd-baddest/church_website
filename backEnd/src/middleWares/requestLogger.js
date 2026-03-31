import { logger } from "../logger/winston.js";

export const requestLogger = (req, res, next) => {
  logger.info(`📥 ${req.method} ${req.originalUrl} - ${req.ip}`);

  // Hook into response finish
  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info(
      `📤 ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};