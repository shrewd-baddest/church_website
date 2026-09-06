import { db as pool } from "../Configs/dbConfig.js";
import path from 'path';
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
import { autoAssignRoleForOfficial, removeRoleForOfficial } from '../utils/positionToRole.js';
import { normalizeDancePosition, syncDancerToGroups, syncDancerDeletion } from '../utils/danceSync.js';
import logger from "../logger/winston.js";
import { emitSocketEvent } from "../socket/index.js";
import { isOfficial } from "../middlewares/requireRole.js";

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
        (SELECT COUNT(*) FROM jumuiya_officials jo WHERE jo.election_term_id = et.id AND jo.status = 'archived') as archived_jumuiya_count,
        (SELECT COUNT(*) FROM group_officials go WHERE go.election_term_id = et.id AND go.status = 'archived') as archived_group_count
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
        (SELECT COUNT(*) FROM jumuiya_officials jo WHERE jo.election_term_id = et.id AND jo.status = 'archived') as archived_jumuiya_count,
        (SELECT COUNT(*) FROM group_officials go WHERE go.election_term_id = et.id AND go.status = 'archived') as archived_group_count
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
      SELECT o.*, et.name as term_name, et.year as term_year, et.closing_message
      ${queryBase} 
      ORDER BY ${termId || req.query.only_archived === 'true' ? 'et.year DESC, ' : ''}${CSA_SORT_SQL} 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    const result = await pool.query(dataQuery, [...params, limit, offset]);

    if (!isOfficial(req)) {
      result.rows.forEach(r => delete r.reg_number);
    }

    // Per-term tribute message shown under the cards on the public history page
    let closingMessage = null;
    if (termId) {
      const tRes = await pool.query('SELECT closing_message FROM election_terms WHERE id = $1', [termId]);
      closingMessage = tRes.rows[0]?.closing_message || null;
    }

    res.json({ 
      success: true, 
      data: result.rows,
      closing_message: closingMessage,
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

export const updateTermClosingMessage = async (req, res) => {
  try {
    const { termId } = req.params;
    const { message } = req.body || {};

    if (typeof message !== 'string' || message.trim().length > 1000) {
      return res.status(400).json({ success: false, message: 'Message must be text of at most 1000 characters' });
    }

    const check = await pool.query('SELECT id FROM election_terms WHERE id = $1', [termId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Election term not found' });
    }

    await pool.query(
      'UPDATE election_terms SET closing_message = $1 WHERE id = $2',
      [message.trim() || null, termId]
    );

    res.json({ success: true, message: 'Closing message saved', data: { closing_message: message.trim() || null } });
  } catch (error) {
    logger.error('Error updating term closing message: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to save closing message' });
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

    // 2. Check for contact conflicts — same registered member is allowed
    if (contacts.rows.length > 0) {
      const dup = await pool.query(
        `SELECT dup.id FROM officials target
         JOIN officials dup ON dup.contact = target.contact
           AND (dup.status = 'active' OR dup.status IS NULL)
           AND dup.id <> ALL($2)
           AND (dup.reg_number IS NULL OR dup.reg_number IS DISTINCT FROM target.reg_number)
         WHERE target.id = ANY($1)
           AND target.contact IS NOT NULL AND target.contact != ''
         LIMIT 1`,
        [officialIds, officialIds]
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

    const baseCols = `o.id, o.name, o.category, o.photo, o.position, o.contact, o.term_of_service, o.created_at, o.status,
               et.name as term_name, et.year as term_year`;
    // reg_number links officials to the members table: only expose it to officials
    const regCol = isOfficial(req) ? ", o.reg_number" : "";
    const SELECT_COLS = baseCols + regCol;

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

    const row = result.rows[0];
    if (!isOfficial(req)) delete row.reg_number;

    res.json({ success: true, data: row });
  } catch (error) {
    logger.error('Error fetching official: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch official' });
  }
};

export const createOfficial = async (req, res) => {
  try {
    const { name, category, position, contact, term_of_service, reg_number, historical } = req.body;
    const isHistorical = historical === 'true' || historical === true;

    if (!name || !category) {
        return res.status(400).json({ success: false, message: 'Name and category are required' });
    }

    const effectivePosition = category === 'Liturgical Dancers' && position 
      ? normalizeDancePosition(position) 
      : position;

    const normalizedContact = normalizePhone(contact);
    if (contact && !isValidPhone(contact)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number' });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    let validatedRegNumber = null;

    if (isHistorical) {
      // Historical mode: reg_number optional, skip all active-official checks
      if (reg_number && reg_number.trim()) {
        const memberResult = await pool.query(
          `SELECT member_id FROM members WHERE member_id = $1 OR LOWER(TRIM(member_id)) = LOWER(TRIM($1))
           OR member_id LIKE '%/' || $2 || '/%' OR member_id ILIKE $3
           LIMIT 2`,
          [reg_number.trim(), reg_number.trim(), `%${reg_number.trim()}%`]
        );
        if (memberResult.rows.length === 1) {
          validatedRegNumber = memberResult.rows[0].member_id;
        } else if (memberResult.rows.length > 1) {
          return res.status(400).json({ success: false, message: 'Registration number matches multiple members. Please use the exact member ID.' });
        }
        // If 0 results, just skip — historical mode allows no reg_number
      }

      // Resolve or create election_term for this historical term_of_service
      let termId = null;
      if (term_of_service && term_of_service.trim()) {
        let termResult = await pool.query(
          'SELECT id FROM election_terms WHERE name = $1 LIMIT 1',
          [term_of_service.trim()]
        );
        if (termResult.rows.length === 0) {
          termResult = await pool.query(
            `INSERT INTO election_terms (name, year, start_date, is_current)
             VALUES ($1, $1, CURRENT_DATE, FALSE) RETURNING id`,
            [term_of_service.trim()]
          );
        }
        termId = termResult.rows[0].id;
      }

      let photoUrl = req.file ? formatPhotoUrl(req.file) : null;

      const result = await pool.query(
        `INSERT INTO officials (name, category, position, contact, photo, election_term_id, status, term_of_service, reg_number)
         VALUES ($1, $2, $3, $4, $5, $6, 'archived', $7, $8) RETURNING *`,
        [name, category, effectivePosition || null, normalizedContact || null, photoUrl, termId, term_of_service || null, validatedRegNumber]
      );

      if (category === 'Liturgical Dancers') {
        await syncDancerToGroups(result.rows[0]);
      }

      emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "create", data: result.rows[0] });
      return res.status(201).json({ success: true, data: result.rows[0] });
    }

    // ── Normal (non-historical) path ──

    if (!reg_number || !reg_number.trim()) {
        return res.status(400).json({ success: false, message: 'Registration number is required — the official must be a registered member' });
    }

    // Validate reg_number exists in members table
    const memberResult = await pool.query(
      `SELECT member_id FROM members WHERE member_id = $1 OR LOWER(TRIM(member_id)) = LOWER(TRIM($1))
       OR member_id LIKE '%/' || $2 || '/%' OR member_id ILIKE $3
       LIMIT 2`,
      [reg_number.trim(), reg_number.trim(), `%${reg_number.trim()}%`]
    );
    if (memberResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: `No member found with registration number matching "${reg_number}". The official must be a registered member.` });
    }
    if (memberResult.rows.length > 1) {
      return res.status(400).json({ success: false, message: 'Registration number matches multiple members. Please use the exact member ID.' });
    }
    validatedRegNumber = memberResult.rows[0].member_id;

    // Build checking promises to run in parallel
    const promises = [
      pool.query("SELECT id, year, name FROM election_terms WHERE is_current = TRUE"),
      pool.query("SELECT COUNT(*) FROM officials WHERE category = $1 AND (status = 'active' OR status IS NULL)", [category])
    ];

    let contactQueryIndex = -1;
    if (normalizedContact) {
      // Same registered member may hold multiple records (e.g. current chairperson
      // also added under a previous position) — only block DIFFERENT people sharing a phone.
      promises.push(
        pool.query(
          "SELECT id FROM officials WHERE contact = $1 AND (status = 'active' OR status IS NULL) AND (reg_number IS NULL OR reg_number != $2)",
          [normalizedContact, validatedRegNumber || '']
        )
      );
      contactQueryIndex = promises.length - 1;
    }

    let positionQueryIndex = -1;
    if (effectivePosition && effectivePosition.trim() !== '') {
      promises.push(
        pool.query("SELECT name FROM officials WHERE LOWER(position) = LOWER($1) AND (status = 'active' OR status IS NULL)", [effectivePosition.trim()])
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
          message: `The position '${effectivePosition}' is already occupied by ${posDup.rows[0].name}`
        });
      }
    }

    let photoUrl = req.file ? formatPhotoUrl(req.file) : null;
    const termId = currentTermResult.rows.length > 0 ? currentTermResult.rows[0].id : null;

    const result = await pool.query(
      `INSERT INTO officials (name, category, position, contact, photo, election_term_id, status, term_of_service, reg_number) 
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8) RETURNING *`,
      [name, category, effectivePosition || null, normalizedContact || null, photoUrl, termId, term_of_service || null, validatedRegNumber]
    );

    let roleWarning = null;
    if (validatedRegNumber && effectivePosition) {
      const roleResult = await autoAssignRoleForOfficial(
        validatedRegNumber, effectivePosition, false, category, req.user?.member_id || null
      );
      if (roleResult?.status === 'conflict') {
        roleWarning = roleResult.message;
        logger.warn(`Role not assigned for official ${name}: ${roleResult.message}`);
      } else if (roleResult) {
        logger.info(`Auto-assigned role for official ${name}: ${JSON.stringify(roleResult)}`);
      }
    }

    if (category === 'Liturgical Dancers') {
      await syncDancerToGroups(result.rows[0]);
    }

    await syncCurrentTerm(term_of_service);

    emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "create", data: result.rows[0] });

    res.status(201).json({ success: true, data: result.rows[0], ...(roleWarning ? { warning: roleWarning } : {}) });
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

    // Validate reg_number if provided (must run before contact dup check below)
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

    if (normalizedContact) {
      const effectiveReg = validatedRegNumber || existing.rows[0].reg_number || '';
      const dup = await pool.query(
        "SELECT id FROM officials WHERE contact = $1 AND id != $2 AND (status = 'active' OR status IS NULL) AND (reg_number IS NULL OR reg_number != $3)",
        [normalizedContact, id, effectiveReg]
      );
      if (dup.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Contact already in use' });
      }
    }

    // Position uniqueness check — skip for archived officials (historical data)
    const isArchivedUpdate = existing.rows[0].status === 'archived';

    if (!isArchivedUpdate && position && position.trim() !== '') {
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

    // Keep election_term_id (source of truth for term grouping) in sync with the
    // edited term_of_service label. Resolve or create the matching election_terms row.
    let resolvedTermId = undefined;
    if (term_of_service !== undefined) {
      const trimmedTerm = (term_of_service || '').trim();
      if (trimmedTerm) {
        let termResult = await pool.query(
          'SELECT id FROM election_terms WHERE name = $1 LIMIT 1',
          [trimmedTerm]
        );
        if (termResult.rows.length === 0) {
          termResult = await pool.query(
            `INSERT INTO election_terms (name, year, start_date, is_current)
             VALUES ($1, $1, CURRENT_DATE, FALSE) RETURNING id`,
            [trimmedTerm]
          );
        }
        resolvedTermId = termResult.rows[0].id;
      } else {
        resolvedTermId = null;
      }
    }

    const effectiveCategory = category || existing.rows[0].category;
    let effectivePosition = position;
    if (effectiveCategory === 'Liturgical Dancers' && (position || !existing.rows[0].position?.startsWith('Dance'))) {
      effectivePosition = normalizeDancePosition(position || existing.rows[0].position);
    }

    const setParts = [
      'name = COALESCE($1, name)',
      'category = COALESCE($2, category)',
      'position = COALESCE($3, position)',
      'contact = COALESCE($4, contact)',
      'photo = COALESCE($5, photo)',
      'term_of_service = COALESCE($6, term_of_service)',
      'reg_number = COALESCE($7, reg_number)',
    ];
    const values = [name, category, effectivePosition !== undefined ? effectivePosition : position, normalizedContact, photoUrl, term_of_service || null, validatedRegNumber];
    if (resolvedTermId !== undefined) {
      setParts.push(`election_term_id = $${values.length + 1}`);
      values.push(resolvedTermId);
    }
    setParts.push('updated_at = CURRENT_TIMESTAMP');

    const result = await pool.query(
      `UPDATE officials SET ${setParts.join(', ')} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, id]
    );

    // Role assignment — skip for archived officials
    let roleWarning = null;
    if (!isArchivedUpdate) {
      const oldPosition = existing.rows[0].position;
      const oldRegNumber = existing.rows[0].reg_number;
      const newPosition = effectivePosition || oldPosition;
      const newRegNumber = validatedRegNumber || oldRegNumber;

      if (oldPosition !== newPosition || oldRegNumber !== newRegNumber) {
        if (oldPosition && oldRegNumber) {
          await removeRoleForOfficial(oldRegNumber, oldPosition, false);
        }
        if (newRegNumber && newPosition) {
          const roleResult = await autoAssignRoleForOfficial(
            newRegNumber, newPosition, false, result.rows[0].category, req.user?.member_id || null
          );
          if (roleResult?.status === 'conflict') {
            roleWarning = roleResult.message;
            logger.warn(`Role not assigned on update: ${roleResult.message}`);
          } else if (roleResult) {
            logger.info(`Auto-assigned role for updated official: ${JSON.stringify(roleResult)}`);
          }
        }
      } else if (validatedRegNumber && (effectivePosition || position) && oldPosition === (effectivePosition || position)) {
        const roleResult = await autoAssignRoleForOfficial(
          validatedRegNumber, effectivePosition || position, false, result.rows[0].category, req.user?.member_id || null
        );
        if (roleResult?.status === 'conflict') {
          roleWarning = roleResult.message;
          logger.warn(`Role not assigned on update: ${roleResult.message}`);
        } else if (roleResult) {
          logger.info(`Re-assigned role for official: ${JSON.stringify(roleResult)}`);
        }
      }

      if (term_of_service) {
        await syncCurrentTerm(term_of_service);
      }
    }

    if (result.rows[0].category === 'Liturgical Dancers') {
      await syncDancerToGroups(result.rows[0]);
    } else if (existing.rows[0].category === 'Liturgical Dancers') {
      await syncDancerDeletion('officials', existing.rows[0]);
    }

    emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "update", id, data: result.rows[0] });

    res.json({ success: true, data: result.rows[0], ...(roleWarning ? { warning: roleWarning } : {}) });
  } catch (error) {
    logger.error('Error updating official: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to update official' });
  }
};

export const deleteOfficial = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM officials WHERE id = $1', [id]);
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

    await pool.query('DELETE FROM officials WHERE id = $1', [id]);
    if (official.category === 'Liturgical Dancers') {
      await syncDancerDeletion('officials', official);
    }
    emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "delete", id });
    res.json({ success: true, message: 'Official deleted successfully' });
  } catch (error) {
    logger.error('Error deleting official: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to delete official' });
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
    if (official.category === 'Liturgical Dancers') {
      await syncDancerDeletion('officials', official);
    }
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

    const toDelete = await pool.query('SELECT * FROM officials WHERE id = ANY($1)', [officialIds]);
    await pool.query('DELETE FROM officials WHERE id = ANY($1)', [officialIds]);
    for (const off of toDelete.rows) {
      if (off.category === 'Liturgical Dancers') {
        await syncDancerDeletion('officials', off);
      }
    }
    emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "bulk_delete_archived", ids: officialIds });
    res.json({ success: true, message: `Successfully deleted ${officialIds.length} archived officials` });
  } catch (error) {
    logger.error('Error bulk deleting archived officials: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to perform bulk delete' });
  }
};

/**
 * GET /officials/lookup-member/:regNumber
 * Lightweight member lookup for handover form — returns name only.
 */
export const lookupMember = async (req, res) => {
  try {
    const { regNumber } = req.params;
    if (!regNumber || !regNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Reg number is required' });
    }
    const trimmed = regNumber.trim();
    const result = await pool.query(
      `SELECT member_id, first_name, last_name FROM members
       WHERE member_id LIKE '%/' || $1 || '/%'
          OR LOWER(TRIM(member_id)) = LOWER(TRIM($2))
          OR member_id ILIKE $3
       ORDER BY CASE WHEN LOWER(TRIM(member_id)) = LOWER(TRIM($2)) THEN 1 ELSE 2 END
       LIMIT 1`,
      [trimmed, trimmed, `%${trimmed}%`]
    );
    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    const m = result.rows[0];
    res.json({
      success: true,
      data: {
        member_id: m.member_id,
        name: `${m.first_name || ''} ${m.last_name || ''}`.trim(),
      },
    });
  } catch (error) {
    logger.error('Error looking up member: ' + error.message);
    res.status(500).json({ success: false, message: 'Failed to look up member' });
  }
};

/**
 * Handover — archive ALL active officials across CSA, Jumuiya & Group tables
 * in a single transaction, then create / promote the next election term.
 *
 * Also performs the leadership transition:
 *  - Revokes every term-scoped system role (CSA exec, jumuiya & group roles)
 *  - Grants `csa_chair` (auto-approved) to the nominated successor, who must
 *    be a registered member. They gain admin access on their next login.
 *
 * Body: { successor_reg_number, name, year, start_date, end_date?, description? }
 */

const HANDOVER_REVOCABLE_ROLES = [
  // CSA executive + coordinator
  'csa_chair', 'csa_vice_chair', 'csa_secretary', 'jumuiya_coordinator',
  'project_manager', 'instrument_manager', 'os', 'treasurer', 'liturgist',
  // Jumuiya
  'jumuiya_chairperson', 'jumuiya_vice_chairperson', 'jumuiya_os', 'jumuiya_secretary',
  // Groups
  'choir_chairperson', 'choir_vice_chair', 'choir_vice_secretary', 'choir_secretary', 'choir_treasurer',
  'choir_project_coordinator', 'choir_male_representative', 'choir_female_representative',
  'dance_chair', 'dance_vice_chair',
  'charismatic_chair', 'charismatic_vice_chair',
  'st_francis_chair', 'st_francis_vice_chair', 'st_francis_secretary', 'st_francis_treasurer',
  'mentorship_chair', 'mentorship_vice_chair'
];

export const handoverOfficials = async (req, res) => {
  const client = await pool.connect();
  try {
    const { election_term_id, name, year, start_date, end_date, description } = req.body;
    const successorReg = req.body.successor_reg_number?.toString().trim() || '';
    const actorMemberId = req.user?.member_id || null;

    if (!successorReg) {
      return res.status(400).json({
        success: false,
        message: 'successor_reg_number is required — the outgoing Chairperson must nominate the incoming CSA Chairperson before handing over.'
      });
    }

    // ── 0. Resolve the successor — must be a registered member ────
    let successor = null;
    const sExact = await pool.query(
      'SELECT member_id, first_name, last_name FROM members WHERE member_id = $1 LIMIT 1',
      [successorReg]
    );
    if (sExact.rows.length > 0) {
      successor = sExact.rows[0];
    } else {
      const sLoose = await pool.query(
        `SELECT member_id, first_name, last_name FROM members
         WHERE LOWER(TRIM(member_id)) = LOWER(TRIM($1))
            OR member_id ILIKE $2
         ORDER BY CASE WHEN LOWER(TRIM(member_id)) = LOWER(TRIM($1)) THEN 1 ELSE 2 END
         LIMIT 1`,
        [successorReg, `%${successorReg}%`]
      );
      if (sLoose.rows.length > 0) successor = sLoose.rows[0];
    }

    if (!successor) {
      return res.status(404).json({
        success: false,
        message: `No registered member found with reg number "${successorReg}". The new CSA Chairperson must be a registered member.`
      });
    }

    await client.query('BEGIN');

    // ── 1. Resolve or create the new term ──────────────────────────
    let termId = election_term_id;

    if (!termId) {
      if (!name || !year) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Term name and year are required'
        });
      }

      // Demote every existing term
      await client.query('UPDATE election_terms SET is_current = FALSE');

      const termStartDate = start_date || new Date().toISOString().split('T')[0];
      const termResult = await client.query(
        `INSERT INTO election_terms (name, year, start_date, end_date, description, is_current)
         VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
        [name, year, termStartDate, end_date || null, description || null]
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

    // ── 2. Archive CSA officials ──────────────────────────────────
    const csaCount = await client.query(
      `UPDATE officials
       SET status = 'archived', election_term_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE status = 'active' OR status IS NULL`,
      [termId]
    );

    // ── 3. Archive Jumuiya officials ──────────────────────────────
    const jumuiyaCount = await client.query(
      `UPDATE jumuiya_officials
       SET status = 'archived', election_term_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE status = 'active' OR status IS NULL`,
      [termId]
    );

    // ── 4. Archive Group officials ────────────────────────────────
    const groupCount = await client.query(
      `UPDATE group_officials
       SET status = 'archived', election_term_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE status = 'active' OR status IS NULL`,
      [termId]
    );

    // ── 5. Revoke all term-scoped system roles ────────────────────
    // Outgoing executive loses dashboard access; pending auto-assignments
    // tied to now-archived officials are cleared too. Fresh roles are
    // requested after the new officials are added.
    const revokedRoles = await client.query(
      `UPDATE member_roles mr
       SET status = 'revoked', updated_at = NOW()
       FROM roles r
       WHERE mr.role_id = r.role_id
         AND r.role_name = ANY($1)
         AND mr.status IN ('approved', 'pending')`,
      [HANDOVER_REVOCABLE_ROLES]
    );

    // ── 6. Grant csa_chair to the successor (auto-approved) ───────
    let roleRes = await client.query("SELECT role_id FROM roles WHERE role_name = 'csa_chair'");
    if (roleRes.rows.length === 0) {
      roleRes = await client.query(
        `INSERT INTO roles (role_name, description, status)
         VALUES ('csa_chair', 'CSA Chairperson', 'active') RETURNING role_id`
      );
    }
    const chairRoleId = roleRes.rows[0].role_id;

    const existingRow = await client.query(
      `SELECT id FROM member_roles WHERE member_id = $1 AND role_id = $2 ORDER BY id DESC LIMIT 1`,
      [successor.member_id, chairRoleId]
    );

    if (existingRow.rows.length > 0) {
      await client.query(
        `UPDATE member_roles
         SET status = 'approved', assigned_by = $3, approved_by = $3,
             approved_at = NOW(), updated_at = NOW()
         WHERE id = $4`,
        [successor.member_id, chairRoleId, actorMemberId, existingRow.rows[0].id]
      );
    } else {
      await client.query(
        `INSERT INTO member_roles (member_id, role_id, assigned_by, approved_by, approved_at, status)
         VALUES ($1, $2, $3, $3, NOW(), 'approved')`,
        [successor.member_id, chairRoleId, actorMemberId]
      );
    }

    const termInfo = await client.query('SELECT * FROM election_terms WHERE id = $1', [termId]);

    await client.query('COMMIT');

    const totalArchived = csaCount.rowCount + jumuiyaCount.rowCount + groupCount.rowCount;

    emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action: "handover" });

    res.json({
      success: true,
      message: `Handover complete — archived ${csaCount.rowCount} CSA, ${jumuiyaCount.rowCount} Jumuiya and ${groupCount.rowCount} Group officials under "${termInfo.rows[0].name}". ${successor.first_name} ${successor.last_name} is now the CSA Chairperson.`,
      data: {
        archived: {
          csa: csaCount.rowCount,
          jumuiya: jumuiyaCount.rowCount,
          groups: groupCount.rowCount,
          total: totalArchived
        },
        revoked_roles: revokedRoles.rowCount,
        successor: {
          member_id: successor.member_id,
          name: `${successor.first_name} ${successor.last_name}`.trim(),
          role: 'csa_chair'
        },
        election_term: termInfo.rows[0]
      }
    });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) { /* tx may not be open */ }
    logger.error('Error during handover: ' + error.message);
    res.status(500).json({ success: false, message: `Handover failed: ${error.message}` });
  } finally {
    client.release();
  }
};
