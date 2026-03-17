

import fs from "fs";
import logger from "../logger/winston.js";
import { testDb } from "../Configs/dbConfig.js";
import cloudinary from "../Configs/cloudinaryConfigs.js"

// Upload one or many files
export async function createFile(req, res) {

  
  try {
    const files = req.files || (req.file ? [req.file] : []); // support single or multiple

    if (!files || files.length === 0) {
      logger.warn("No files uploaded");
      return res.status(400).json({ error: "No file(s) uploaded" });
    }

    const results = [];

    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: "auto",
      });

      if (!result || !result.secure_url) {
       logger.error("Cloudinary upload failed");
       return res.status(502).json({ error: "Cloudinary upload failed" });

      }

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      const insertQuery =
        "INSERT INTO uploads (public_id, url, format, resource_type, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING *";
      const values = [
        result.public_id,
        result.secure_url,
        result.format,
        result.resource_type,
        result.created_at,
      ];

      const dbResult = await testDb.query(insertQuery, values);
      results.push(dbResult.rows[0]);
    }

    logger.info("uploaded a file succesifuly  file url" , + results)
    return res.status(201).json(results.length === 1 ? results[0] : results);
  } catch (error) {
    console.log(error , error.message )
   logger.error(error.message, "CreateFile");
    return res.status(500).json({ error: "Internal server error" });

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
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "auto",
      });

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
