
import multer from "multer";
import upload from "../Configs/multerStorageConfig.js"
import { UploadError } from "../errorHandler/errorClass.js";
import logger from "../logger/winston.js";


export function uploadMiddleware(req, res, next) {
  upload.fields([{ name: "file", maxCount: 1 },{ name: "files", maxCount: 10 }])(req, res, (err) => {

    console.log(err);
    

    if (err instanceof UploadError) {
      return res.status(400).json({
        success: false,
        message: err.message,
        errorCode: err.code,
      });
    }

    
    if (err instanceof multer.MulterError) {
      let friendlyMessage;
      switch (err.code) {
        case "LIMIT_FILE_SIZE":
          friendlyMessage = "File too large. Max size is 10MB.";
          break;
        case "LIMIT_FILE_COUNT":
          friendlyMessage = "Too many files uploaded.";
          break;
        case "LIMIT_UNEXPECTED_FILE":
               friendlyMessage = `Unexpected file field: ${err.field}. Allowed fields are 'file' or 'files'.`;
          break;
        default:
          friendlyMessage = err.message;
      }

      return res.status(400).json({
        success: false,
        message: friendlyMessage,
        errorCode: err.code,
      });
    }

    if (err) {
      logger.error("Unexpected upload error", err);
      return res.status(500).json({
        success: false,
        message: "Internal upload error",
        errorCode: "UNKNOWN_ERROR",
      });
    }

    // Normalize: merge both into req.files array
    req.files = [...(req.files?.file || []),...(req.files?.files || [])];

    next();
  });
}