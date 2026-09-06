import multer from "multer";
import path from "path";
import { Readable } from "stream";
import logger from "../logger/winston.js";
import { UploadError } from "../utils/ApiError.js";
import cloudinary from "./cloudinaryConfigs.js";

/**
 * Builds a multer storage engine that uploads files directly to Cloudinary v2
 * under the given folder. Each uploaded file will have `file.path` set to the
 * Cloudinary secure_url and `file.filename` set to the Cloudinary public_id.
 */
const buildCloudinaryStorage = (folder = "church_officials") => ({
  _handleFile(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const publicId = `${folder}/${file.fieldname}-${uniqueSuffix}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${file.fieldname}-${uniqueSuffix}`,
        resource_type: "image",
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          logger.error("Cloudinary upload error: " + error.message);
          return cb(new UploadError("Failed to upload image to Cloudinary", "CLOUDINARY_UPLOAD_ERROR"));
        }
        // Expose result on the file object so downstream code can use it
        cb(null, {
          path: result.secure_url,      // used by formatPhotoUrl()
          filename: result.public_id,   // public_id for later deletion
          size: result.bytes,
          mimetype: file.mimetype,
          cloudinary: result,
        });
      }
    );

    // Pipe the incoming file buffer into Cloudinary's upload stream
    file.stream.pipe(uploadStream);
  },

  _removeFile(req, file, cb) {
    if (file.filename) {
      cloudinary.uploader.destroy(file.filename, (error) => {
        if (error) logger.warn("Failed to remove file from Cloudinary: " + error.message);
        cb(null);
      });
    } else {
      cb(null);
    }
  },
});

// Default storage — church officials photos
const cloudinaryStorage = buildCloudinaryStorage("church_officials");

/**
 * Landscape-optimised storage for card/banner images (Explore Our Community section).
 * Crops to 900 × 500 with smart gravity so the image always fills a wide card header.
 */
const buildLandscapeStorage = (folder = "explore_cards") => ({
  _handleFile(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${file.fieldname}-${uniqueSuffix}`,
        resource_type: "image",
        transformation: [
          { width: 900, height: 500, crop: "fill", gravity: "auto" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          logger.error("Cloudinary landscape upload error: " + error.message);
          return cb(new UploadError("Failed to upload image to Cloudinary", "CLOUDINARY_UPLOAD_ERROR"));
        }
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
          mimetype: file.mimetype,
          cloudinary: result,
        });
      }
    );

    file.stream.pipe(uploadStream);
  },

  _removeFile(req, file, cb) {
    if (file.filename) {
      cloudinary.uploader.destroy(file.filename, (error) => {
        if (error) logger.warn("Failed to remove file from Cloudinary: " + error.message);
        cb(null);
      });
    } else {
      cb(null);
    }
  },
});

// Explore Our Community card images — landscape 900×500 crop
const uploadExploreImage = multer({
  storage: buildLandscapeStorage("explore_cards"),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

// File type validation (checks both the declared mimetype and the extension)
function fileFilter(req, file, cb) {
  const allowedExt = /jpeg|jpg|png|gif|webp/;
  const allowedMime = /^image\/(jpeg|png|gif|webp)$/;
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const mimeOk = allowedMime.test(file.mimetype || "");

  if (allowedExt.test(ext) && mimeOk) {
    cb(null, true);
  } else {
    logger.warn(`Unsupported file type attempted: ext=${ext} mime=${file.mimetype}`);
    cb(new UploadError("Unsupported file type. Only images (jpg, png, gif, webp) are allowed.", "UNSUPPORTED_TYPE"), false);
  }
}

// Multer instance using Cloudinary storage
const upload = multer({
  storage: cloudinaryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter,
});

// Community T-shirt product images
const uploadTshirt = multer({
  storage: buildCloudinaryStorage("community_tshirts"),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

// Jumuiya T-shirt product images
const uploadJumuiyaTshirt = multer({
  storage: buildCloudinaryStorage("jumuiya_tshirts"),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

// Choir song sheet images → dedicated Cloudinary folder with high clarity for sheet music
const uploadChoirSong = multer({
  storage: ({
    _handleFile(req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "choir_songs",
          public_id: `song-${uniqueSuffix}`,
          resource_type: "image",
          transformation: [
            { width: 1800, height: 2400, crop: "limit" },
            { quality: "auto:good" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            logger.error("Cloudinary upload error for choir song: " + error.message);
            return cb(new UploadError("Failed to upload song sheet to Cloudinary", "CLOUDINARY_UPLOAD_ERROR"));
          }
          cb(null, {
            path: result.secure_url,
            filename: result.public_id,
            size: result.bytes,
            mimetype: file.mimetype,
            cloudinary: result,
          });
        }
      );
      file.stream.pipe(uploadStream);
    },
    _removeFile(req, file, cb) {
      if (file.filename) {
        cloudinary.uploader.destroy(file.filename, (error) => {
          if (error) logger.warn("Failed to remove song from Cloudinary: " + error.message);
          cb(null);
        });
      } else {
        cb(null);
      }
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
  fileFilter,
});

// In-memory multer for smart OCR parsing (does not upload to Cloudinary)
const uploadMemoryForOcr = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
  fileFilter,
});

export default upload;
export { uploadTshirt, uploadJumuiyaTshirt, uploadChoirSong, uploadMemoryForOcr, uploadExploreImage };