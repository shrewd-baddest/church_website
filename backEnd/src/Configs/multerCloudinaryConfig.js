import multer from "multer";
import logger from "../logger/winston.js";
import { UploadError } from "../errorHandler/errorClass.js";



//create a storage function 
// should use local file for other things such as compressin hence we should use denstination to localUploadFolders
//should make sure the folder exist first
// shuold also ensure we create a file extention that is unique 

 const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "localUploadFolders");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});


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
