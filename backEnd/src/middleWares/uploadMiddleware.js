
import upload from "../Configs/multerStorageConfig.js"
import logger from "../logger/winston.js";
import ApiError  from "../utils/ApiError.js";


export function uploadMiddleware(req, res, next) {
  upload.fields([{ name: "file", maxCount: 1 },{ name: "files", maxCount: 10 }])(req, res, (err) => {
 
    if (err) {
      logger.error("Unexpected upload error", err);
      throw new ApiError (500, "Internal upload error")
    }

    // Normalize: merge both into req.files array
    req.files = [...(req.files?.file || []),...(req.files?.files || [])];

    next();
  });
}