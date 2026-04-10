import mongoose from "mongoose";
import logger from "../logger/winston.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeUnusedMulterImageFilesOnError } from "../utils/index.js";
import multer from "multer";
import  ApiError  from "../utils/ApiError.js";

/**
 *
 * @param {Error | ApiError} err
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 *
 *
 * @description This middleware is responsible to catch the errors from any request handler wrapped inside the {@link asyncHandler}
 */

// Helper: classify error type and return status + message
function classifyError(err) {
  // Default values
  let statusCode = 500;
  let message = err.message || "Something went wrong";

  // ApiError already has everything
  if (err instanceof ApiError) {
    return { statusCode: err.statusCode, message: err.message };
  }

  // Mongoose validation or cast errors
  if (err instanceof mongoose.Error) {
    return { statusCode: 400, message: "Database validation error" };
  }

  // Multer upload errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "File too large. Max size is 10MB.";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files uploaded.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = `Unexpected file field: ${err.field}. Allowed fields are 'file' or 'files'.`;
        break;
      default:
        message = "File upload error.";
    }
    return { statusCode, message };
  }

  // Fallback: generic error
  return { statusCode, message };
}

const errorHandler = (err, req, res, next) => {
  // Normalize error into ApiError
  const { statusCode, message } = classifyError(err);
  const error = err instanceof ApiError
    ? err
    : new ApiError(statusCode, message, err.errors || [], err.stack);

  // Build safe response
  const response = {
    statusCode: error.statusCode,
    message: error.message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
  };

  // Log and cleanup
  logger.error(error.message);
  try {
    removeUnusedMulterImageFilesOnError(req);
  } catch (cleanupErr) {
    logger.warn("Failed to clean up multer files", cleanupErr);
  }

  // Send response
  return res.status(error.statusCode).json(response);
};


export { errorHandler }
