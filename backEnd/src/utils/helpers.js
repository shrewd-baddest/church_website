 import fs from 'fs';
 import { parsePhoneNumberFromString } from 'libphonenumber-js';
 import { testDb as pool } from '../Configs/dbConfig.js';
 import cloudinary from '../Configs/cloudinaryConfigs.js';
 import logger from '../logger/winston.js';



/**
 * Normalizes a phone number to E.164 format.
 * Defaults to Kenya (KE) if no country code is provided.
 */
export const normalizePhone = (phone) => {
  if (!phone) return null;
  const s = String(phone).trim();
  let pn = parsePhoneNumberFromString(s);
  if (!pn) pn = parsePhoneNumberFromString(s, 'KE');
  if (!pn || !pn.isValid()) return null;
  return pn.number;
};

/**
 * Validates a phone number.
 */
export const isValidPhone = (phone) => {
  if (!phone) return true;
  const pn = parsePhoneNumberFromString(String(phone));
  if (pn) return pn.isValid();
  const pn2 = parsePhoneNumberFromString(String(phone), 'KE');
  return pn2 ? pn2.isValid() : false;
};

/**
 * Deletes a file from the filesystem safely.
 */
export const deleteFile = (filePath) => {
  if (filePath && typeof filePath === 'string' && !filePath.startsWith('http')) {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete local file: ${err.message}`);
      }
    }
  }
};


/**
 * Deletes a file from Cloudinary using its public ID.
 */
export const deleteFromCloudinary = async (photoUrl) => {
  if (!photoUrl || !photoUrl.includes('cloudinary.com')) return;
  
  try {
    // Extract public_id from URL: .../upload/v1234567/folder/public_id.jpg
    const parts = photoUrl.split('/');
    const lastPart = parts[parts.length - 1];
    const publicIdWithFolder = parts.slice(parts.indexOf('upload') + 2).join('/').split('.')[0];
    
    // publicIdWithFolder usually looks like "church_officials/filename"
    const result = await cloudinary.uploader.destroy(publicIdWithFolder);
    if (result.result !== 'ok') {
      logger.warn(`Cloudinary delete result for ${publicIdWithFolder}: ${result.result}`);
    } else {
      logger.info(`Successfully deleted ${publicIdWithFolder} from Cloudinary`);
    }
  } catch (err) {
    logger.error(`Failed to delete from Cloudinary: ${err.message}`);
  }
};


/**
 * Formats a filesystem path into a browser-friendly URL.
 */
export const formatPhotoUrl = (reqFile) => {
  if (reqFile) {
    // If uploaded to Cloudinary, reqFile.path will be the secure_url
    if (reqFile.path && reqFile.path.startsWith('http')) {
      return reqFile.path;
    }
    // Fallback for local uploads (if any still use this)
    return `uploads/${reqFile.filename}`;
  }
  return null;
};


/**
 * Synchronizes the global "Active Term" in the DB based on the most recently added official's term.
 * This ensures the dashboard always displays the currently relevant term of service.
 */
export const syncCurrentTerm = async (termOfService) => {
  if (!termOfService) return;
  try {
    const current = await pool.query('SELECT * FROM election_terms WHERE is_current = TRUE');
    if (current.rows.length > 0) {
      const term = current.rows[0];
      if (term.year !== termOfService) {
        await pool.query(
          'UPDATE election_terms SET year = $1, name = $2 WHERE id = $3',
          [termOfService, `${termOfService} Committee`, term.id]
        );
      }
    }
  } catch (err) {
    console.error('Error syncing current term:', err);
  }
};

/**
 * Formats a phone number for Excel export (ensuring consistent e.g. 07... format).
 */
export const formatPhoneForExcel = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length > 9) {
    return '0' + digits.slice(-9);
  }
  return phone;
};
