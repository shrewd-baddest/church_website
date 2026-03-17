// multerConfig.js
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure destination folder exists
function ensureUploadsFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

// Multer disk storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "localFielUploads/";
    ensureUploadsFolder(uploadPath);
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },

});

// File type validation
function fileFilter(req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|pdf|avi/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
}

// Multer instance
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 100 MB limit
  fileFilter,
});

export default upload;