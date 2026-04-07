import multer from "multer";
import { storage } from "./cloudinaryConfigs.js";
import logger from "../logger/winston.js";
import { UploadError } from "../errorHandler/errorClass.js";

// File type validation (reusing logic from multerStorageConfig.js)
function fileFilter(req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
  const ext = file.originalname.split('.').pop().toLowerCase();

  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    logger.warn(`Unsupported file type attempted: ${ext}`);
    cb(new UploadError("Unsupported file type", "UNSUPPORTED_TYPE"), false);
  }
}

// Multer instance for Cloudinary
const uploadCloudinary = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter,
});

export default uploadCloudinary;
