import { db as pool } from "../Configs/dbConfig.js";
import path from 'path';
import crypto from 'crypto';
import ExcelJS from 'exceljs';
import { 
  normalizePhone, 
  isValidPhone, 
  deleteFile, 
  deleteFromCloudinary,
  formatPhotoUrl, 
  syncCurrentTerm,
  formatPhoneForExcel 
} from '../utils/helpers.js';
import { autoAssignRoleForOfficial, removeRoleForOfficial, getRoleNameForPosition } from '../utils/positionToRole.js';
import logger from "../logger/winston.js";
import { emitSocketEvent } from "../socket/index.js";
import sendEmail from "../Configs/emailConfig.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const HIGH_PRIVILEGE_POSITIONS = ["Chairperson", "Secretary", "Jumuiya Coordinator"];
const APPROVER_POSITIONS = ["Chairperson", "Secretary", "Jumuiya Coordinator"];

const approvalEmailHtml = ({ official, initiator, token, role }) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;"><tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
<tr><td style="background:#fff;border-radius:16px;padding:40px 32px;">
<h1 style="margin:0 0 16px;font-size:20px;color:#1e293b;text-align:center;">Deletion Approval Request</h1>
<p style="margin:0 0 8px;font-size:15px;color:#64748b;text-align:center;line-height:1.6;">
  <strong>${initiator}</strong> wants to delete <strong>${official}</strong> from the officials list.
</p>
<p style="margin:0 0 24px;font-size:14px;color:#94a3b8;text-align:center;">
  Position: ${role}<br>
  You are one of three approvers. Two approvals are required.
</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 12px;">
<a href="${FRONTEND_URL}/officials/deletion-approval/${token}?action=approve" style="display:inline-block;background:#16a34a;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:10px;margin:0 6px;">✓ Approve</a>
<a href="${FRONTEND_URL}/officials/deletion-approval/${token}?action=reject" style="display:inline-block;background:#fff;color:#dc2626;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:10px;border:2px solid #fecaca;margin:0 6px;">✗ Reject</a>
</td></tr></table>
<p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">&mdash; CSA Kirinyaga Chapter</p>
</td></tr></table></td></tr></table></body></html>
`;

const findApproversByPosition = async (position, excludeOfficialId) => {
  const result = await pool.query(
    `SELECT o.id, o.name, o.reg_number, m.email
     FROM officials o
     LEFT JOIN members m ON m.member_id = o.reg_number
     WHERE o.position = $1
       AND o.id != $2
       AND m.email IS NOT NULL
     ORDER BY o.created_at ASC`,
    [position, excludeOfficialId]
  );
  return result.rows;
};

export const CATEGORY_LIMITS = {
  'Executive': 6,
  'Jumuiya Coordinators': 2,
  'Bible Coordinators': 2,
  'Rosary': 2,
  'Pamphlet Managers': 2,
  'Project Managers': 2,
  'Liturgist': 2,
  'Choir Officials': 2,
  'Instrument Managers': 2,
  'Liturgical Dancers': 2,
  'Catechist': 1
};

export const VALID_CATEGORIES = Object.keys(CATEGORY_LIMITS);

export const CSA_SORT_SQL = `
  CASE o.category
    WHEN 'Executive' THEN 1
    WHEN 'Jumuiya Coordinators' THEN 2
    WHEN 'Bible Coordinators' THEN 3
    WHEN 'Rosary' THEN 4
    WHEN 'Pamphlet Managers' THEN 5
    WHEN 'Project Managers' THEN 6
    WHEN 'Liturgist' THEN 7
    WHEN 'Instrument Managers' THEN 8
    WHEN 'Choir Officials' THEN 9
    WHEN 'Liturgical Dancers' THEN 10
    WHEN 'Catechist' THEN 11
    ELSE 100
  END ASC,
  CASE
    WHEN LOWER(o.position) LIKE '%chairperson%' OR LOWER(o.position) LIKE '%chairman%' THEN
      CASE WHEN LOWER(o.position) LIKE '%vice%' THEN 2 ELSE 1 END
    WHEN LOWER(o.position) LIKE '%secretary%' THEN
      CASE 
        WHEN LOWER(o.position) LIKE '%organizing%' OR LOWER(o.position) LIKE '%organising%' THEN 3
        WHEN LOWER(o.position) LIKE '%assistant%' OR LOWER(o.position) LIKE '%vice%' THEN 5
        ELSE 4
      END
    WHEN LOWER(o.position) LIKE '%treasurer%' THEN 6
    WHEN LOWER(o.position) LIKE '%coordinator%' OR LOWER(o.position) LIKE '%manager%' OR LOWER(o.position) LIKE '%liturgist%' OR LOWER(o.position) LIKE '%catechist%' THEN
      CASE WHEN LOWER(o.position) LIKE '%assistant%' OR LOWER(o.position) LIKE '%vice%' THEN 12 ELSE 11 END
    ELSE 100
  END ASC,
  o.name ASC
`;

// =============================================================================
// ELECTION TERM MANAGEMENT
// =============================================================================

export const getAllElectionTerms = async (req, res) => {
  try {
    const query = `
      SELECT et.*, 
        (SELECT COUNT(*) FROM officials o WHERE o.election_term_id = et.id AND o.status = 'archived') as archived_csa_count,
        (SELECT COUNT(*) FROM jumuiya_officials jo WHERE jo.election_term_id = et.id AND jo.status = 'archived') as archived_jumuiya_count
      FROM election_terms et 
      ORDER BY et.is_current DESC, et.year DESC, et.created_at DESC
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Error fetching election terms: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch election terms' });
  }
};

export const getCurrentElectionTerm = async (req, res) => {
  try {
    const query = `
      SELECT et.*, 
        (SELECT COUNT(*) FROM officials o WHERE o.election_term_id = et.id AND o.status = 'archived') as archived_csa_count,
        (SELECT COUNT(*) FROM jumuiya_officials jo WHERE jo.election_term_id = et.id AND jo.status = 'archived') as archived_jumuiya_count
      FROM election_terms et 
      WHERE et.is_current = TRUE
    `;
    const result = await pool.query(query);
    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching current election term: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch current election term' });
  }
};

export const createElectionTerm = async (req, res) => {
  try {
    const { name, year, start_date, end_date, description, set_as_current } = req.body;

    if (!name || !year || !start_date) {
        return res.status(400).json({ success: false, message: 'Name, year, and start date are required' });
    }

    if (set_as_current) {
      await pool.query('UPDATE election_terms SET is_current = FALSE');
    }

    const result = await pool.query(
      `INSERT INTO election_terms (name, year, start_date, end_date, description, is_current)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, year, start_date, end_date || null, description || null, set_as_current || false]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error creating election term: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to create election term' });
  }
};

export const updateElectionTerm = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, year, start_date, end_date, description, is_current } = req.body;

    const existing = await pool.query('SELECT * FROM election_terms WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Election term not found' });
    }

    if (is_current) {
      await pool.query('UPDATE election_terms SET is_current = FALSE');
    }

    const result = await pool.query(
      `UPDATE election_terms 
       SET name = COALESCE($1, name), year = COALESCE($2, year),
           start_date = COALESCE($3, start_date), end_date = COALESCE($4, end_date),
           description = COALESCE($5, description), is_current = COALESCE($6, is_current)
       WHERE id = $7 RETURNING *`,
      [name, year, start_date, end_date, description, is_current, id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error updating election term: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to update election term' });
  }
};

export const deleteElectionTerm = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const existing = await client.query('SELECT * FROM election_terms WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Election term not found' });
    }

    const term = existing.rows[0];

    if (term.is_current) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the current election term. Set another term as current first.'
      });
    }

    // First, get all archived officials for this term to delete their photos
    const archivedOfficials = await client.query(
      'SELECT photo FROM officials WHERE election_term_id = $1 AND status = $2',
      [id, 'archived']
    );

    // Delete photo files
    for (const official of archivedOfficials.rows) {
      if (official.photo) {
        if (official.photo.startsWith('http')) {
          await deleteFromCloudinary(official.photo);
        } else {
          const filePath = path.join(process.cwd(), 'localFileUploads', path.basename(official.photo));
          deleteFile(filePath);
        }
      }
    }


    // Delete all archived officials for this term
    await client.query(
      'DELETE FROM officials WHERE election_term_id = $1 AND status = $2',
      [id, 'archived']
    );

    // Delete the election term
    await client.query('DELETE FROM election_terms WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Election term and all archived officials deleted successfully' });
  } catch (error) {
    logger.error('Error deleting election term: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to delete election term' });
  } finally {
    client.release();
  }
};

export const archiveCurrentOfficials = async (req, res) => {
  const client = await pool.connect();
  try {
    const { election_term_id, name, year, start_date, end_date, description } = req.body;

    await client.query('BEGIN');

    let termId = election_term_id;

    if (!termId) {
      if (!name || !year || !start_date) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Election term details required when no term_id provided'
        });
      }

      await client.query('UPDATE election_terms SET is_current = FALSE');

      const termResult = await client.query(
        `INSERT INTO election_terms (name, year, start_date, end_date, description, is_current)
         VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
        [name, year, start_date, end_date || null, description || null]
      );
      termId = termResult.rows[0].id;
    } else {
      const termCheck = await client.query('SELECT * FROM election_terms WHERE id = $1', [termId]);
      if (termCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Election term not found' });
      }

      await client.query('UPDATE election_terms SET is_current = FALSE');
      await client.query('UPDATE election_terms SET is_current = TRUE WHERE id = $1', [termId]);
    }

    const currentOfficials = await client.query(
      "SELECT * FROM officials WHERE status = 'active' OR status IS NULL"
    );

    if (currentOfficials.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No active officials to archive'
      });
    }

    // 3. Archive all current officials in one bulk operation
    await client.query(
      `UPDATE officials 
       SET status = 'archived', 
           election_term_id = $1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE (status = 'active' OR status IS NULL)`,
      [termId]
    );

    const termInfo = await client.query('SELECT * FROM election_terms WHERE id = $1', [termId]);

    await client.query('COMMIT');

    emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "archive" });

    res.json({
      success: true,
      message: `Successfully archived ${currentOfficials.rows.length} officials to "${termInfo.rows[0].name}"`,
      data: { archived_count: currentOfficials.rows.length, election_term: termInfo.rows[0] }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error archiving officials: ' + error.message);
    res.status(500).json({ success: false, message: `Failed to archive officials: ${error.message}` });
  } finally {
    client.release();
  }
};

/**
 * Fetches officials filtered by term, status, or term of service.
 * Supports pagination for history views.
 */
export const getOfficialsByTerm = async (req, res) => {
  try {
    const { termId } = req.params;
    const includeArchived = req.query.include_archived === 'true';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let queryBase;
    let params = [];

    if (termId) {
      queryBase = `
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE o.election_term_id = $1 AND o.status = 'archived'`;
      params = [termId];
    } else if (req.query.only_archived === 'true') {
      queryBase = `
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE o.status = 'archived'`;
      params = [];
    } else if (includeArchived) {
      queryBase = `
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id`;
      params = [];
    } else {
      queryBase = `
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE o.status = 'active' OR o.status IS NULL`;
      params = [];
    }

    const countQuery = `SELECT COUNT(*) ${queryBase}`;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].count);

    const dataQuery = `
      SELECT o.*, et.name as term_name, et.year as term_year 
      ${queryBase} 
      ORDER BY ${termId || req.query.only_archived === 'true' ? 'et.year DESC, ' : ''}${CSA_SORT_SQL} 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    const result = await pool.query(dataQuery, [...params, limit, offset]);

    res.json({ 
      success: true, 
      data: result.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching officials by term: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch officials' });
  }
};

export const restoreArchivedOfficials = async (req, res) => {
  try {
    const { officialIds } = req.body;

    if (!officialIds || !Array.isArray(officialIds) || officialIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Official IDs array is required'
      });
    }

    const contacts = await pool.query(
      `SELECT contact FROM officials WHERE id = ANY($1) AND contact IS NOT NULL AND contact != ''`,
      [officialIds]
    );

    // 2. Check for contact conflicts
    if (contacts.rows.length > 0) {
      const dup = await pool.query(
        `SELECT id FROM officials WHERE contact = ANY($1) AND status = 'active' AND NOT (id = ANY($2))`,
        [contacts.rows.map(c => c.contact), officialIds]
      );
      if (dup.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Cannot restore: contact numbers already in use by active officials'
        });
      }
    }

    // 3. New Requirement: Check for position conflicts
    const officialsToRestore = await pool.query(
      `SELECT name, position FROM officials WHERE id = ANY($1) AND position IS NOT NULL AND position != ''`,
      [officialIds]
    );

    if (officialsToRestore.rows.length > 0) {
      const positions = officialsToRestore.rows.map(o => o.position);
      
      // Check for internal conflicts in the restoration set itself
      const seen = new Set();
      for (const o of officialsToRestore.rows) {
        if (seen.has(o.position)) {
          return res.status(409).json({
            success: false,
            message: `Multiple officials in the selection have the same position: ${o.position}`
          });
        }
        seen.add(o.position);
      }

      // Check against active officials
      const dupPos = await pool.query(
        `SELECT name, position FROM officials WHERE position = ANY($1) AND status = 'active' AND NOT (id = ANY($2))`,
        [positions, officialIds]
      );

      if (dupPos.rows.length > 0) {
        const conflict = dupPos.rows[0];
        return res.status(409).json({
          success: false,
          message: `Cannot restore: Position '${conflict.position}' is already occupied by ${conflict.name} in the active list.`
        });
      }
    }

    const result = await pool.query(
      `UPDATE officials SET status = 'active', election_term_id = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1) RETURNING *`,
      [officialIds]
    );

    emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "restore", ids: officialIds });

    res.json({
      success: true,
      message: `Successfully restored ${result.rows.length} officials`,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error restoring officials: ' + error.message);
    res.status(500).json({ success: false, message: error.message || 'Failed to restore officials' });
  }
};

// =============================================================================
// OFFICIALS MANAGEMENT (CSA)
// =============================================================================

export const getAllOfficials = async (req, res) => {
  try {
    const termId = req.query.term_id;
    const includeArchived = req.query.include_archived === 'true';
    const termOfService = req.query.term_of_service;
    
    let query;
    let params = [];

    const SELECT_COLS = `o.id, o.name, o.category, o.photo, o.position, o.contact, o.term_of_service, o.created_at, o.status,
               o.reg_number,
               et.name as term_name, et.year as term_year`;

    if (termId) {
      query = `
        SELECT ${SELECT_COLS}
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE (o.election_term_id = $1 OR o.status = 'active' OR o.status IS NULL)
        AND (o.status = 'active' OR o.status IS NULL)`;
      params.push(termId);
      if (termOfService) {
        query += ` AND o.term_of_service = $2`;
        params.push(termOfService);
      }
      query += ` ORDER BY ${CSA_SORT_SQL}`;
    } else if (includeArchived) {
      query = `
        SELECT ${SELECT_COLS}
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id`;
      if (termOfService) {
        query += ` WHERE o.term_of_service = $1`;
        params.push(termOfService);
      }
      query += ` ORDER BY o.status, et.year DESC, ${CSA_SORT_SQL}`;
    } else {
      query = `
        SELECT ${SELECT_COLS}
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE (o.status = 'active' OR o.status IS NULL)`;
      if (termOfService) {
        query += ` AND o.term_of_service = $1`;
        params.push(termOfService);
      }
      query += ` ORDER BY ${CSA_SORT_SQL}`;
    }

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Error fetching officials: ' + error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch officials' });
  }
};

export const getOfficialById = async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const result = await pool.query('SELECT * FROM officials WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Official not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching official: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch official' });
  }
};

export const createOfficial = async (req, res) => {
  try {
    const { name, category, position, contact, term_of_service, reg_number } = req.body;

    if (!name || !category) {
        return res.status(400).json({ success: false, message: 'Name and category are required' });
    }

    const normalizedContact = normalizePhone(contact);
    if (contact && !isValidPhone(contact)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number' });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    // Validate reg_number if provided
    let validatedRegNumber = null;
    if (reg_number && reg_number.trim()) {
      const memberResult = await pool.query(
        `SELECT member_id FROM members WHERE member_id LIKE '%/' || $1 || '/%' OR member_id = $2
         LIMIT 1`,
        [reg_number.trim(), reg_number.trim().toUpperCase()]
      );
      if (memberResult.rows.length === 0) {
        return res.status(400).json({ success: false, message: `No member found with registration number matching "${reg_number}"` });
      }
      validatedRegNumber = memberResult.rows[0].member_id;
    }

    // Build checking promises to run in parallel
    const promises = [
      pool.query("SELECT id, year, name FROM election_terms WHERE is_current = TRUE"),
      pool.query("SELECT COUNT(*) FROM officials WHERE category = $1 AND (status = 'active' OR status IS NULL)", [category])
    ];

    let contactQueryIndex = -1;
    if (normalizedContact) {
      promises.push(
        pool.query("SELECT id FROM officials WHERE contact = $1 AND (status = 'active' OR status IS NULL)", [normalizedContact])
      );
      contactQueryIndex = promises.length - 1;
    }

    let positionQueryIndex = -1;
    if (position && position.trim() !== '') {
      promises.push(
        pool.query("SELECT name FROM officials WHERE LOWER(position) = LOWER($1) AND (status = 'active' OR status IS NULL)", [position.trim()])
      );
      positionQueryIndex = promises.length - 1;
    }

    const results = await Promise.all(promises);
    const currentTermResult = results[0];
    const countResult = results[1];

    if (contactQueryIndex !== -1) {
      const dup = results[contactQueryIndex];
      if (dup.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Contact already in use by another official' });
      }
    }

    const currentCount = parseInt(countResult.rows[0].count);
    if (currentCount >= CATEGORY_LIMITS[category]) {
      return res.status(400).json({
        success: false,
        message: `Category ${category} has reached maximum limit of ${CATEGORY_LIMITS[category]} officials`
      });
    }

    if (positionQueryIndex !== -1) {
      const posDup = results[positionQueryIndex];
      if (posDup.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `The position '${position}' is already occupied by ${posDup.rows[0].name}`
        });
      }
    }

    let photoUrl = req.file ? formatPhotoUrl(req.file) : null;
    const termId = currentTermResult.rows.length > 0 ? currentTermResult.rows[0].id : null;

    const result = await pool.query(
      `INSERT INTO officials (name, category, position, contact, photo, election_term_id, status, term_of_service, reg_number) 
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8) RETURNING *`,
      [name, category, position || null, normalizedContact || null, photoUrl, termId, term_of_service || null, validatedRegNumber]
    );

    if (validatedRegNumber && position) {
      const roleResult = await autoAssignRoleForOfficial(
        validatedRegNumber, position, false, category, req.user?.member_id || null
      );
      if (roleResult) {
        logger.info(`Auto-assigned role for official ${name}: ${JSON.stringify(roleResult)}`);
      }
    }

    await syncCurrentTerm(term_of_service);

    emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "create", data: result.rows[0] });

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error creating official: ' + error.message);
    if (error && error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Contact already in use' });
    }
    res.status(500).json({ success: false, message: 'Failed to create official' });
  }
};

export const updateOfficial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, position, contact, term_of_service, reg_number } = req.body;

    const existing = await pool.query('SELECT * FROM officials WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Official not found' });
    }

    const normalizedContact = contact ? normalizePhone(contact) : null;
    if (contact && !isValidPhone(contact)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    if (normalizedContact) {
      const dup = await pool.query(
        "SELECT id FROM officials WHERE contact = $1 AND id != $2 AND (status = 'active' OR status IS NULL)",
        [normalizedContact, id]
      );
      if (dup.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Contact already in use' });
      }
    }

    // Validate reg_number if provided
    let validatedRegNumber = existing.rows[0].reg_number;
    if (reg_number && reg_number.trim()) {
      const memberResult = await pool.query(
        `SELECT member_id FROM members WHERE member_id LIKE '%/' || $1 || '/%' OR member_id = $2
         LIMIT 1`,
        [reg_number.trim(), reg_number.trim().toUpperCase()]
      );
      if (memberResult.rows.length === 0) {
        return res.status(400).json({ success: false, message: `No member found with registration number matching "${reg_number}"` });
      }
      validatedRegNumber = memberResult.rows[0].member_id;
    }

    // New Requirement: Check for position uniqueness (if changed or newly provided)
    if (position && position.trim() !== '') {
      const posDup = await pool.query(
        "SELECT name FROM officials WHERE LOWER(position) = LOWER($1) AND id != $2 AND (status = 'active' OR status IS NULL)",
        [position.trim(), id]
      );
      if (posDup.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `The position '${position}' is already occupied by ${posDup.rows[0].name}`
        });
      }
    }

    let photoUrl = existing.rows[0].photo;
    if (req.file) {
      if (existing.rows[0].photo) {
        if (existing.rows[0].photo.startsWith('http')) {
          await deleteFromCloudinary(existing.rows[0].photo);
        } else {
          const oldFilePath = path.join(process.cwd(), 'localFileUploads', path.basename(existing.rows[0].photo));
          deleteFile(oldFilePath);
        }
      }
      photoUrl = formatPhotoUrl(req.file);
    }


    const result = await pool.query(
      `UPDATE officials SET name = COALESCE($1, name), category = COALESCE($2, category),
       position = COALESCE($3, position), contact = COALESCE($4, contact),
       photo = COALESCE($5, photo), term_of_service = COALESCE($6, term_of_service),
       reg_number = COALESCE($7, reg_number),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [name, category, position, normalizedContact, photoUrl, term_of_service || null, validatedRegNumber, id]
    );

    const oldPosition = existing.rows[0].position;
    const oldRegNumber = existing.rows[0].reg_number;
    const newPosition = position || oldPosition;
    const newRegNumber = validatedRegNumber || oldRegNumber;

    let inheritedStatus = 'pending';
    if (oldPosition !== newPosition || oldRegNumber !== newRegNumber) {
      if (oldPosition && oldRegNumber) {
        const oldRoleName = getRoleNameForPosition(oldPosition, false);
        if (oldRoleName) {
          const oldRole = await pool.query(
            `SELECT mr.status FROM member_roles mr
             JOIN roles r ON r.role_id = mr.role_id
             WHERE mr.member_id = $1 AND r.role_name = $2 AND mr.status = 'approved'`,
            [oldRegNumber, oldRoleName]
          );
          if (oldRole.rows.length > 0) inheritedStatus = 'approved';
        }
        await removeRoleForOfficial(oldRegNumber, oldPosition, false);
      }
      if (newRegNumber && newPosition) {
        const roleResult = await autoAssignRoleForOfficial(
          newRegNumber, newPosition, false, result.rows[0].category, req.user?.member_id || null, inheritedStatus
        );
        if (roleResult) {
          logger.info(`Auto-assigned role for updated official: ${JSON.stringify(roleResult)}`);
        }
      }
    } else if (validatedRegNumber && position && oldPosition === position) {
      // Position unchanged — if the member changed, preserve the old role status
      let reassignStatus = 'pending';
      if (oldRegNumber !== newRegNumber) {
        const oldRoleName = getRoleNameForPosition(position, false);
        if (oldRoleName) {
          const oldRole = await pool.query(
            `SELECT mr.status FROM member_roles mr
             JOIN roles r ON r.role_id = mr.role_id
             WHERE mr.member_id = $1 AND r.role_name = $2 AND mr.status = 'approved'`,
            [oldRegNumber, oldRoleName]
          );
          if (oldRole.rows.length > 0) reassignStatus = 'approved';
        }
      }
      const roleResult = await autoAssignRoleForOfficial(
        validatedRegNumber, position, false, result.rows[0].category, req.user?.member_id || null, reassignStatus
      );
      if (roleResult) {
        logger.info(`Re-assigned role for official: ${JSON.stringify(roleResult)}`);
      }
    }

    if (term_of_service) {
      await syncCurrentTerm(term_of_service);
    }

    emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "update", id, data: result.rows[0] });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error updating official: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to update official' });
  }
};

const executeDeletion = async (official, res) => {
  if (official.photo) {
    if (official.photo.startsWith('http')) {
      await deleteFromCloudinary(official.photo);
    } else {
      const filePath = path.join(process.cwd(), 'localFileUploads', path.basename(official.photo));
      deleteFile(filePath);
    }
  }
  if (official.reg_number && official.position) {
    await removeRoleForOfficial(official.reg_number, official.position, false);
  }
  await pool.query('DELETE FROM officials WHERE id = $1', [official.id]);
};

export const deleteOfficial = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM officials WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Official not found' });
    }

    const official = result.rows[0];

    const isHighPrivilege = HIGH_PRIVILEGE_POSITIONS.includes(official.position);
    if (!isHighPrivilege) {
      await executeDeletion(official);
      emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "delete", id });
      return res.json({ success: true, message: 'Official deleted successfully' });
    }

    const approverEmailPromises = APPROVER_POSITIONS.map(async (pos) => {
      const approvers = (await findApproversByPosition(pos, parseInt(id))).slice(0, 1);
      return { position: pos, approvers };
    });
    const approverGroups = await Promise.all(approverEmailPromises);

    const allEmails = [];
    const tokenMap = {};
    for (const group of approverGroups) {
      for (const approver of group.approvers) {
        const token = crypto.randomBytes(32).toString('hex');
        tokenMap[group.position] = token;

        const existing = await pool.query(
          `SELECT id FROM deletion_approvals WHERE official_id = $1 AND status = 'pending' AND chair_responded = false AND secretary_responded = false AND coordinator_responded = false`,
          [id]
        );

        if (existing.rows.length > 0) {
          return res.status(409).json({ success: false, message: 'A pending deletion approval already exists for this official' });
        }

        allEmails.push({
          email: approver.email,
          token,
          position: group.position,
          name: approver.name,
        });
      }
    }

    if (allEmails.length === 0) {
      await executeDeletion(official);
      emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "delete", id });
      return res.json({ success: true, message: 'No approvers configured; official deleted directly' });
    }

    await pool.query(
      `INSERT INTO deletion_approvals (
        official_id, official_name, official_position, initiator_id, initiator_name,
        chair_token, secretary_token, coordinator_token
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id, official.name, official.position,
        req.user?.member_id || 'unknown', req.user?.name || 'Unknown',
        tokenMap['Chairperson'] || null,
        tokenMap['Secretary'] || null,
        tokenMap['Jumuiya Coordinator'] || null,
      ]
    );

    const emailPromises = allEmails.map(({ email, token, position, name }) => {
      const html = approvalEmailHtml({
        official: `${official.name} (${official.position})`,
        initiator: req.user?.name || 'A user',
        token,
        role: position,
      });
      return sendEmail(
        email,
        `Deletion Approval Required: ${official.name}`,
        `A deletion approval request has been initiated. Use the following link to approve or reject: ${FRONTEND_URL}/officials/deletion-approval/${token}`,
        html
      );
    });

    await Promise.all(emailPromises);

    res.json({
      success: true,
      message: 'Approval request sent to Chairperson, Secretary, and Jumuiya Coordinator. Deletion will proceed once two approvals are received.',
      requiresApproval: true,
    });
  } catch (error) {
    logger.error('Error deleting official: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to delete official' });
  }
};

export const respondDeletionApproval = async (req, res) => {
  try {
    const { token } = req.params;
    const { action } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Use "approve" or "reject".' });
    }

    const columnMap = { chair_token: 'chair', secretary_token: 'secretary', coordinator_token: 'coordinator' };
    let foundColumn = null;
    let foundPrefix = null;
    for (const [col, prefix] of Object.entries(columnMap)) {
      const check = await pool.query(`SELECT id, status FROM deletion_approvals WHERE ${col} = $1`, [token]);
      if (check.rows.length > 0) {
        foundColumn = col;
        foundPrefix = prefix;
        break;
      }
    }

    if (!foundColumn) {
      return res.status(404).json({ success: false, message: 'Invalid or expired approval token' });
    }

    const approval = (await pool.query(`SELECT * FROM deletion_approvals WHERE ${foundColumn} = $1`, [token])).rows[0];

    if (approval.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: approval.status === 'approved' ? 'This deletion has already been approved and executed.' : 'This deletion request has already been rejected.'
      });
    }

    const respondedCol = `${foundPrefix}_responded`;
    const approvedCol = `${foundPrefix}_approved`;
    const respondedAtCol = `${foundPrefix}_responded_at`;

    if (approval[respondedCol]) {
      return res.status(409).json({ success: false, message: 'You have already responded to this request' });
    }

    const now = new Date();
    await pool.query(
      `UPDATE deletion_approvals SET ${respondedCol} = true, ${approvedCol} = $1, ${respondedAtCol} = $2, updated_at = $2 WHERE id = $3`,
      [action === 'approve', now, approval.id]
    );

    if (action === 'reject') {
      return res.json({ success: true, message: 'You have rejected the deletion request.' });
    }

    const updated = (await pool.query('SELECT * FROM deletion_approvals WHERE id = $1', [approval.id])).rows[0];
    const approvals = ['chair_approved', 'secretary_approved', 'coordinator_approved']
      .map(col => updated[col])
      .filter(v => v === true).length;

    if (approvals >= 2) {
      const official = (await pool.query('SELECT * FROM officials WHERE id = $1', [approval.official_id])).rows[0];
      if (official) {
        await executeDeletion(official);
        await pool.query("UPDATE deletion_approvals SET status = 'approved', updated_at = NOW() WHERE id = $1", [approval.id]);
        emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "delete", id: approval.official_id });
        return res.json({ success: true, message: 'Approval threshold reached. Official has been deleted.', deleted: true });
      }
      await pool.query("UPDATE deletion_approvals SET status = 'approved', updated_at = NOW() WHERE id = $1", [approval.id]);
    }

    res.json({ success: true, message: 'Your approval has been recorded. Waiting for additional approvals.' });
  } catch (error) {
    logger.error('Error responding to deletion approval: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to process approval' });
  }
};

export const getDeletionApprovalInfo = async (req, res) => {
  try {
    const { token } = req.params;

    const columnMap = { chair_token: 'Chairperson', secretary_token: 'Secretary', coordinator_token: 'Jumuiya Coordinator' };
    let foundColumn = null;
    let yourRole = null;
    for (const [col, role] of Object.entries(columnMap)) {
      const check = await pool.query(`SELECT id FROM deletion_approvals WHERE ${col} = $1`, [token]);
      if (check.rows.length > 0) {
        foundColumn = col;
        yourRole = role;
        break;
      }
    }

    if (!foundColumn) {
      return res.status(404).json({ success: false, message: 'Invalid or expired approval token' });
    }

    const approval = (await pool.query(`SELECT * FROM deletion_approvals WHERE ${foundColumn} = $1`, [token])).rows[0];

    const approvalCount = ['chair_approved', 'secretary_approved', 'coordinator_approved']
      .map(col => approval[col])
      .filter(v => v === true).length;

    res.json({
      success: true,
      data: {
        official_name: approval.official_name,
        official_position: approval.official_position,
        initiator_name: approval.initiator_name,
        status: approval.status,
        your_role: yourRole,
        approvals_received: approvalCount,
        approvals_required: 2,
        chair_approved: approval.chair_approved,
        secretary_approved: approval.secretary_approved,
        coordinator_approved: approval.coordinator_approved,
        has_responded: approval[`${yourRole?.toLowerCase().startsWith('chair') ? 'chair' : yourRole?.toLowerCase().startsWith('sec') ? 'secretary' : 'coordinator'}_responded`] === true || false,
      }
    });
  } catch (error) {
    logger.error('Error fetching deletion approval info: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch approval info' });
  }
};

export const exportOfficials = async (req, res) => {
  try {
    const { fields, term_of_service: termOfService } = req.query;
    const selectedFields = fields ? fields.split(',') : ['name', 'category', 'position', 'contact'];

    let query = `
        SELECT o.id, o.name, o.category, o.position, o.contact, o.created_at, et.name as term_name, et.year as term_year
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE (o.status = 'active' OR o.status IS NULL)`;
    let params = [];
    if (termOfService) {
      query += ` AND o.term_of_service = $1`;
      params.push(termOfService);
    }
    query += ` ORDER BY o.category, o.position`;

    const result = await pool.query(query, params);

    const headers = selectedFields.map(f => f.charAt(0).toUpperCase() + f.slice(1));
    const data = result.rows.map(row => {
      const obj = {};
      selectedFields.forEach(field => {
        let value = row[field] || '';
        if (field === 'contact' && value) {
          value = formatPhoneForExcel(value);
        }
        obj[field] = value;
      });
      return obj;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Officials');

    worksheet.columns = selectedFields.map((field, idx) => ({
      header: headers[idx],
      key: field
    }));

    data.forEach(row => {
      worksheet.addRow(row);
    });

    worksheet.columns.forEach((column, idx) => {
      const field = selectedFields[idx];
      const headerLength = headers[idx].length;
      const maxContentLength = Math.max(...data.map(row => String(row[field] || '').length), headerLength);
      column.width = Math.max(maxContentLength + 2, 15);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="officials.xlsx"');
    
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (error) {
    logger.error('Error exporting officials: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to export officials' });
  }
};

export const exportArchivedOfficials = async (req, res) => {
  try {
    const { termId } = req.params;
    const { fields, term_of_service: termOfService } = req.query;
    const selectedFields = fields ? fields.split(',') : ['name', 'category', 'position', 'contact'];

    let query = `
        SELECT o.id, o.name, o.category, o.position, o.contact, o.created_at, o.status, et.name as term_name, et.year as term_year, o.term_of_service
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE o.status = 'archived'`;
    let params = [];
    if (termId) {
      query += ` AND o.election_term_id = $1`;
      params.push(termId);
    }
    if (termOfService) {
      query += (termId ? ` AND` : ` AND`) + ` (o.term_of_service = $${params.length + 1} OR et.name = $${params.length + 1})`;
      params.push(termOfService);
    }
    query += ` ORDER BY o.category, o.position`;

    const result = await pool.query(query, params);

    const headers = selectedFields.map(f => f.charAt(0).toUpperCase() + f.slice(1));
    const data = result.rows.map(row => {
      const obj = {};
      selectedFields.forEach(field => {
        let value = row[field] || '';
        if (field === 'contact' && value) {
          value = formatPhoneForExcel(value);
        }
        obj[field] = value;
      });
      return obj;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Archived Officials');

    worksheet.columns = selectedFields.map((field, idx) => ({
      header: headers[idx],
      key: field
    }));

    data.forEach(row => {
      worksheet.addRow(row);
    });

    worksheet.columns.forEach((column, idx) => {
      const field = selectedFields[idx];
      const headerLength = headers[idx].length;
      const maxContentLength = Math.max(...data.map(row => String(row[field] || '').length), headerLength);
      column.width = Math.max(maxContentLength + 2, 15);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="archived_officials.xlsx"');
    
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (error) {
    logger.error('Error exporting archived officials: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to export archived officials' });
  }
};

export const deleteArchivedOfficial = async (req, res) => {
  try {
    const { officialId } = req.params;

    const result = await pool.query('SELECT * FROM officials WHERE id = $1', [officialId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Official not found' });
    }

    const official = result.rows[0];

    if (official.photo) {
      if (official.photo.startsWith('http')) {
        await deleteFromCloudinary(official.photo);
      } else {
        const filePath = path.join(process.cwd(), 'localFileUploads', path.basename(official.photo));
        deleteFile(filePath);
      }
    }


    await pool.query('DELETE FROM officials WHERE id = $1', [officialId]);
    emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "delete_archived", id: officialId });
    res.json({ success: true, message: 'Archived official deleted successfully' });
  } catch (error) {
    logger.error('Error deleting archived official: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to delete archived official' });
  }
};

export const clearAllOfficials = async (req, res) => {
  try {
    const snapshot = await pool.query(
      `SELECT photo FROM officials WHERE photo IS NOT NULL`
    );

    const result = await pool.query(`DELETE FROM officials`);

    for (const row of snapshot.rows) {
      if (row.photo) {
        if (row.photo.startsWith('http')) {
          await deleteFromCloudinary(row.photo);
        } else {
          const filePath = path.join(process.cwd(), 'localFileUploads', path.basename(row.photo));
          deleteFile(filePath);
        }
      }
    }

    emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "clear_all" });
    res.json({ success: true, message: `All officials cleared (${result.rowCount} deleted)` });
  } catch (error) {
    logger.error('Error clearing all officials: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to clear officials' });
  }
};

export const bulkDeleteArchivedOfficials = async (req, res) => {
  try {
    const { officialIds } = req.body;
    if (!officialIds || !Array.isArray(officialIds) || officialIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Official IDs are required' });
    }

    await pool.query('DELETE FROM officials WHERE id = ANY($1)', [officialIds]);
    emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "bulk_delete_archived", ids: officialIds });
    res.json({ success: true, message: `Successfully deleted ${officialIds.length} archived officials` });
  } catch (error) {
    logger.error('Error bulk deleting archived officials: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to perform bulk delete' });
  }
};
