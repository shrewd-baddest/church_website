import logger from "../logger/winston.js";
import { testDb } from "../Configs/dbConfig.js";
import cloudinary from "../Configs/cloudinaryConfigs.js"
import { uploadOneFile, uploadManyFiles } from "../utils/index.js";

// Upload one or many files

export async function createFile(req, res) {
  try {
    // Always expect an array of files (middleware normalizes this)
    const files = req.files || [];


     if (files.length === 0) {
        logger.warn("No files uploaded");
        return res.status(400).json({
          success: false,
          message: "No file(s) uploaded",
          data: [],
        });
      }

    // Handle single file upload
    if (files.length === 1) {
      try {
        const result = await uploadOneFile(files[0]);
        return res.status(201).json({
          success: true,
          message: "File uploaded successfully",
          data: [result],
          failures: [],
        });
      } catch (err) {
        logger.error(`Single file upload failed: ${err.message}`);
        return res.status(502).json({
          success: false,
          message: "File upload failed",
          error: err.message,
        });
      }
    }

    // Handle multiple file uploads
    const result = await uploadManyFiles(files);

    
    if (result.data.length === 0) {
      // All uploads failed
      logger.error("All file uploads failed");
      return res.status(502).json({
        success: false,
        message: "All file uploads failed",
        data: [],
        failures,
      });
    }

    if (result.failures.length > 0) {
      // Partial success
      logger.warn("Some files failed to upload");
      return res.status(207).json({
        success: true,
        message: "Some files uploaded successfully",
        data: successes,
        failures,
      });
    }

    // All succeeded
    return res.status(201).json(result);
    // Catch unexpected errors
  } catch (error) {
    logger.error(error.message, "CreateFile");
    return res.status(500).json({
      success: false,
      message: "Internal server error yyyy",
      error: error.message,
      errorStack : error.stack
    });
  }
}

// Delete one or many files
export async function deleteFile(req, res) {
  try {
    const { publicIds } = req.body; // expects array
    const ids = Array.isArray(publicIds) ? publicIds : [publicIds]; // normalize

    if (!ids || ids.length === 0) {
      return res.status(400).json({ error: "No publicId(s) provided" });
    }

    const results = [];

    for (const publicId of ids) {
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result !== "ok" && result.result !== "not found") {
         logger.warn("No publicId(s) provided");
      return res.status(400).json({ error: "No publicId(s) provided" });

      }

      const deleteQuery = "DELETE FROM uploads WHERE public_id=$1 RETURNING *";
      const dbResult = await testDb.query(deleteQuery, [publicId]);

      results.push(dbResult.rows[0] || { message: `No record found for ${publicId}` });
    }

    return res.json(results.length === 1 ? results[0] : results);
  } catch (error) {
    logger.error(error, "DeleteFile");
    return res.status(500).json({ error: error.message });
  }
}

export async function getAllfiles(req , res){
  try {
    // Query only the required columns
    const getallQuery = " SELECT url, format, resource_type, created_at ,  public_id FROM uploads  ORDER BY created_at DESC"
   const dbResult = await testDb.query(getallQuery);

    // Handle case where no files exist
    if (!dbResult.rows || dbResult.rows.length === 0) {
      logger.warn("No files found in uploads table");
      return res.status(404).json({
        success: false,
        message: "No files found",
        data: [],
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: "Files retrieved successfully",
      data: dbResult.rows,
    });
  } catch (error) {
    // Catch unexpected errors
    logger.error(`Error retrieving files: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching files",
      error: error.message,
    });
  }
}