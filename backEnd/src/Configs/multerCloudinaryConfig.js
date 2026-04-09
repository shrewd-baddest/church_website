import multer from "multer";
import path from "path";
import fs from "fs";
import logger from "../logger/winston.js";

// Ensure upload folder exists
function ensureUploadsFolder(uploadPath) {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
}

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const uploadPath = "localFileUploads/";
      ensureUploadsFolder(uploadPath);
      cb(null, uploadPath);
    } catch (err) {
      logger.error("Failed to set upload destination", err);
      cb(err);
    }
  },

  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    } catch (err) {
      logger.error("Failed to generate filename", err);
      cb(err);
    }
  },
});

// File type validation
function fileFilter(req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    logger.warn(`Unsupported file type attempted: ${ext}`);
    cb(false);
  }
}

// Multer instance
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter,
});



export default upload;