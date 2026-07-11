import { testDb as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";
import { payAndWait } from "./stkPush/stkHelper.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createActivityLog } from "./activityLogController.js";
import { generateStampCardPdf } from "../utils/stampCardPdf.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

/**
 * Normalize year_of_study to a numeric year level (1-4).
 * Handles "2024-2025" (academic year range) → computes from current year.
 * Handles "1","2","3","4" → pass-through.
 * Returns null if it can't be determined.
 */
function normalizeYearOfStudy(yos) {
  if (!yos) return null;
  const trimmed = yos.trim();
  if (/^[1-4]$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{4})-\d{4}$/);
  if (match) {
    const startYear = parseInt(match[1], 10);
    const yearLevel = new Date().getFullYear() - startYear + 1;
    if (yearLevel >= 1 && yearLevel <= 4) return String(yearLevel);
  }
  return null;
}

/**
 * Resolve a Jumuiya slug (e.g. "st-anthony") to a UUID from sub_groups.
 * Returns null if no match is found.
 */
const resolveJumuiyaUuid = async (slug) => {
  if (!slug) return null;

  // 1. If the input already looks like a UUID, try direct match
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  if (isUuid) {
    const uuidResult = await pool.query(
      `SELECT group_id FROM sub_groups WHERE group_id = $1`,
      [slug]
    );
    if (uuidResult.rows.length) return uuidResult.rows[0].group_id;
  }

  // 2. Convert slug to title-case name: "st-anthony" → "St. Anthony"
  const nameGuess = slug.split("-").map(w => {
    if (w.toLowerCase() === "st") return "St.";
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(" ");

  const nameResult = await pool.query(
    `SELECT group_id FROM sub_groups WHERE LOWER(name) = LOWER($1) OR LOWER(full_name) = LOWER($1)`,
    [nameGuess]
  );
  if (nameResult.rows.length) return nameResult.rows[0].group_id;

  // 3. Fuzzy match: try substring
  const fuzzyResult = await pool.query(
    `SELECT group_id FROM sub_groups WHERE LOWER(name) LIKE $1 OR LOWER(full_name) LIKE $1`,
    [`%${slug.replace(/-/g, "%")}%`]
  );
  if (fuzzyResult.rows.length) return fuzzyResult.rows[0].group_id;

  return null;
};

/**
 * Internal: fetch members from both sources (jumuiya import, CSA distribution).
 * Used by getAllJumuiyaMembers and getAllMembersAcrossJumuiyas.
 */
function deriveYearFromReg(memberId) {
  if (!memberId) return null;
  const match = memberId.match(/(\d{2})$/);
  if (!match) return null;
  const lastTwo = parseInt(match[1], 10);
  const year = lastTwo <= 50 ? 2000 + lastTwo : 1900 + lastTwo;
  return `${year}-${year + 1}`;
}

async function fetchAllMembers(jumuiya_id) {
  const resolvedUuid = await resolveJumuiyaUuid(jumuiya_id);

  if (jumuiya_id && !resolvedUuid) {
    return [];
  }

  let query = `
    SELECT 
      m.member_id as id,
      m.first_name,
      m.last_name,
      m.course,
      m.email,
      m.phone,
      m.gender,
      m.year_of_study as year,
      m.jumuiya_id as jumuiya_uuid,
      sg.name as jumuiya_name,
      (r.member_id IS NOT NULL) as is_registered,
      m.sem_1_reg, m.sem_2_reg, m.sem_3_reg, m.sem_4_reg,
      m.sem_5_reg, m.sem_6_reg, m.sem_7_reg, m.sem_8_reg,
      m.join_date,
      m.source,
      m.status as import_status,
      m.is_active
    FROM members m
    LEFT JOIN registered r ON m.member_id = r.member_id AND r.jumuiya_id = m.jumuiya_id
    LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
    WHERE (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
  `;

  const params = [];
  if (resolvedUuid) {
    query += ` AND m.jumuiya_id = $1`;
    params.push(resolvedUuid);
  }

  query += ` ORDER BY m.first_name ASC`;

  const result = await pool.query(query, params);

  return result.rows.map(row => {
    const firstName = row.first_name || "";
    const lastName = row.last_name || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || row.id || "Unknown";
    return {
      id: row.id,
      name: fullName,
      member_id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      course: row.course,
      email: row.email,
      phone: row.phone,
      gender: row.gender,
      year: row.year || deriveYearFromReg(row.id),
      jumuiya_uuid: row.jumuiya_uuid,
      jumuiya_name: row.jumuiya_name,
      jumuiya_id: jumuiya_id || row.jumuiya_uuid || row.jumuiya_name,
      is_registered: row.is_registered,
      sem_1_reg: row.sem_1_reg, sem_2_reg: row.sem_2_reg,
      sem_3_reg: row.sem_3_reg, sem_4_reg: row.sem_4_reg,
      sem_5_reg: row.sem_5_reg, sem_6_reg: row.sem_6_reg,
      sem_7_reg: row.sem_7_reg, sem_8_reg: row.sem_8_reg,
      join_date: row.join_date,
      source: row.source,
      import_status: row.import_status,
      is_active: row.is_active,
      is_current_jumuiya: !!(resolvedUuid && row.jumuiya_uuid === resolvedUuid),
    };
  });
}

/**
 * GET /api/jumuiya-members?jumuiya_id=st-anthony
 * Fetch all members from both the legacy members/registered tables and
 * the new import_records table (Jumuiya Member Collection System).
 */
export const getAllJumuiyaMembers = async (req, res) => {
  try {
    const { jumuiya_id } = req.query;
    const merged = await fetchAllMembers(jumuiya_id);
    res.json({ success: true, data: merged });
  } catch (error) {
    logger.error("Error fetching all members: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch members" });
  }
};

/**
 * POST /api/jumuiya-members
 * Register a member to a specific Jumuiya.
 * Updates members table directly.
 */
export const createJumuiyaMember = async (req, res) => {
  try {
    const { member_id, jumuiya_id } = req.body;

    if (!member_id || !jumuiya_id) {
      return res.status(400).json({ success: false, message: "member_id and jumuiya_id are required" });
    }

    // Start Transaction
    await pool.query('BEGIN');

    // 1. Update members table
    await pool.query(
      `UPDATE members SET jumuiya_id = $1 WHERE member_id = $2`,
      [jumuiya_id, member_id]
    );

    // 2. Fetch updated member with jumuiya name via JOIN
    const updateResult = await pool.query(
      `SELECT m.*, sg.name as jumuiya_name
       FROM members m
       LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
       WHERE m.member_id = $1`,
      [member_id]
    );

    if (updateResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    // 3. Insert into registered table
    await pool.query(
      `INSERT INTO registered (member_id, jumuiya_id, registration_date, status) 
       VALUES ($1, $2, CURRENT_TIMESTAMP, 'active')
       ON CONFLICT DO NOTHING`, 
      [member_id, jumuiya_id]
    );

    await pool.query('COMMIT');

    const row = updateResult.rows[0];
    res.status(200).json({ 
      success: true, 
      message: "Successfully joined the community",
      data: {
        ...row,
        id: row.member_id,
        name: `${row.first_name} ${row.last_name || ""}`.trim()
      }
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    logger.error("Error joining jumuiya: " + error.message);
    res.status(500).json({ success: false, message: "Failed to join community" });
  }
};


/**
 * PUT /api/jumuiya-members/:id
 * Update a member's details and jumuiya assignment across ALL related tables.
 * Propagates changes to members, import_records, and registered tables.
 */
export const updateJumuiyaMember = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      member_id, first_name, last_name, year_of_study, email, jumuiya_id,
      phone, gender, course, is_active,
    } = req.body;

    const newMemberId = member_id && member_id.trim() ? member_id.trim() : null;
    const effectiveId = newMemberId || id;
    const memberIdChanged = newMemberId && newMemberId !== id;

    // Resolve jumuiya slug/UUID to UUID + display name (logic before BEGIN)
    let jumuiyaUuid = null;
    let jumuiyaName = null;
    if (jumuiya_id) {
      jumuiyaUuid = await resolveJumuiyaUuid(jumuiya_id);
      if (jumuiyaUuid) {
        const nameRes = await pool.query("SELECT name FROM sub_groups WHERE group_id = $1", [jumuiyaUuid]);
        jumuiyaName = nameRes.rows[0]?.name || null;
      }
    }

    await pool.query('BEGIN');

    // ── Try members table first ──
    const currentRes = await pool.query(
      "SELECT jumuiya_id, first_name, last_name FROM members WHERE member_id = $1",
      [id]
    );

    if (currentRes.rows.length > 0) {
      // ─── Path A: update members table ───
      const oldJumuiyaId = currentRes.rows[0].jumuiya_id;
      const oldFirstName = currentRes.rows[0].first_name;
      const oldLastName = currentRes.rows[0].last_name;

      if (memberIdChanged) {
        await pool.query("UPDATE members SET member_id = $1 WHERE member_id = $2", [newMemberId, id]);
      }

      await pool.query(
        `UPDATE members
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             year_of_study = COALESCE($3, year_of_study),
             email = COALESCE($4, email),
             phone = COALESCE($5, phone),
             gender = COALESCE($6, gender),
             course = COALESCE($7, course),
             jumuiya_id = COALESCE($8, jumuiya_id),
             is_active = COALESCE($10, is_active)
         WHERE member_id = $9`,
        [first_name, last_name, year_of_study, email, phone, gender, course, jumuiyaUuid, effectiveId, is_active !== undefined ? is_active : null]
      );

      // Sync import_records
      const shouldSync = first_name || last_name || email || phone || gender || course || jumuiya_id;
      if (shouldSync || memberIdChanged) {
        const syncSets = [];
        const syncVals = [];
        let sp = 1;
        if (first_name || last_name) {
          const syncName = `${first_name || oldFirstName} ${last_name || oldLastName}`.trim();
          syncSets.push(`cleaned_name = $${sp++}`); syncVals.push(syncName);
        }
        if (email !== undefined) { syncSets.push(`cleaned_email = $${sp++}`); syncVals.push(email); }
        if (course !== undefined) { syncSets.push(`cleaned_course = $${sp++}`); syncVals.push(course); }
        if (phone !== undefined) { syncSets.push(`cleaned_phone = $${sp++}`); syncVals.push(phone); }
        if (gender !== undefined) { syncSets.push(`cleaned_gender = $${sp++}`); syncVals.push(gender); }
        syncSets.push(`cleaned_jumuiya = $${sp++}`); syncVals.push(jumuiyaName);
        syncVals.push(id);
        await pool.query(`UPDATE import_records SET ${syncSets.join(", ")} WHERE cleaned_reg_number = $${sp}`, syncVals);
        if (memberIdChanged) {
          await pool.query("UPDATE import_records SET cleaned_reg_number = $1 WHERE cleaned_reg_number = $2", [newMemberId, id]);
        }
      }

      // Sync associates table
      {
        const aSets = [];
        const aVals = [];
        let ap = 1;
        if (first_name || last_name) {
          aSets.push(`name = $${ap++}`);
          aVals.push(`${first_name || oldFirstName} ${last_name || oldLastName}`.trim());
        }
        if (email !== undefined) { aSets.push(`email = $${ap++}`); aVals.push(email); }
        if (phone !== undefined) { aSets.push(`phone = $${ap++}`); aVals.push(phone); }
        if (gender !== undefined) { aSets.push(`gender = $${ap++}`); aVals.push(gender); }
        if (jumuiyaName) { aSets.push(`jumuiya_name = $${ap++}`); aVals.push(jumuiyaName); }
        if (jumuiyaUuid) { aSets.push(`jumuiya_id = $${ap++}`); aVals.push(jumuiyaUuid); }
        if (aSets.length > 0) {
          aVals.push(id);
          await pool.query(`UPDATE associates SET ${aSets.join(", ")} WHERE member_id = $${ap}`, aVals);
        }
        if (memberIdChanged) {
          await pool.query("UPDATE associates SET member_id = $1 WHERE member_id = $2", [newMemberId, id]);
        }
      }

      // Registration table sync
      if (oldJumuiyaId || jumuiyaUuid) {
        if (jumuiyaUuid !== oldJumuiyaId) {
          if (oldJumuiyaId) {
            await pool.query("DELETE FROM registered WHERE member_id = $1 AND jumuiya_id = $2", [effectiveId, oldJumuiyaId]);
          }
          if (jumuiyaUuid) {
            await pool.query(
              "INSERT INTO registered (member_id, jumuiya_id, registration_date, status) VALUES ($1, $2, CURRENT_TIMESTAMP, 'active') ON CONFLICT DO NOTHING",
              [effectiveId, jumuiyaUuid]
            );
          }
        }
      }

      await pool.query('COMMIT');

      const userId = req.user?.id || req.user?.member_id || 'system';
      const userName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'System' : 'System';

      const targetReg = effectiveId;
      const targetName = [first_name || oldFirstName, last_name || oldLastName].filter(Boolean).join(" ").trim() || targetReg;
      const logJumuiya = jumuiyaName || (oldJumuiyaId ? (await pool.query("SELECT name FROM sub_groups WHERE group_id = $1", [oldJumuiyaId])).rows[0]?.name || null : null);

      if (is_active !== undefined) {
        await createActivityLog(targetReg, targetName, is_active === false ? 'member_flagged_inactive' : 'member_unflagged', 'member', targetReg, { acted_by: userId, acted_by_name: userName, jumuiya: logJumuiya });
      }
      if (memberIdChanged) {
        await createActivityLog(targetReg, targetName, 'member_id_changed', 'member', targetReg, { acted_by: userId, acted_by_name: userName, old_id: id, new_id: newMemberId });
      }

      const result = await pool.query(
        `SELECT m.*, sg.name as jumuiya_name
         FROM members m
         LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
         WHERE m.member_id = $1`,
        [effectiveId]
      );

      const row = result.rows[0];
      return res.json({
        success: true,
        data: {
          ...row,
          id: row.member_id,
          name: `${row.first_name} ${row.last_name || ""}`.trim()
        }
      });
    }

    // ─── Path B: update import_records and sync to members ───
    const syncSets = [];
    const syncVals = [];
    let sp = 1;
    const syncName = [first_name, last_name].filter(Boolean).join(" ").trim();
    if (syncName) { syncSets.push(`cleaned_name = $${sp++}`); syncVals.push(syncName); }
    if (email !== undefined) { syncSets.push(`cleaned_email = $${sp++}`); syncVals.push(email); }
    if (phone !== undefined) { syncSets.push(`cleaned_phone = $${sp++}`); syncVals.push(phone); }
    if (gender !== undefined) { syncSets.push(`cleaned_gender = $${sp++}`); syncVals.push(gender); }
    syncSets.push(`cleaned_jumuiya = $${sp++}`); syncVals.push(jumuiyaName);
    syncVals.push(id);
    await pool.query(`UPDATE import_records SET ${syncSets.join(", ")} WHERE cleaned_reg_number = $${sp}`, syncVals);
    if (memberIdChanged) {
      await pool.query("UPDATE import_records SET cleaned_reg_number = $1 WHERE cleaned_reg_number = $2", [newMemberId, id]);
    }

    // Also upsert into members table
    await pool.query(`
      INSERT INTO members (member_id, first_name, last_name, email, phone, gender, course, jumuiya_id, source, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'jum', 'valid')
      ON CONFLICT (member_id) DO UPDATE SET
        first_name = COALESCE($2, members.first_name),
        last_name = COALESCE($3, members.last_name),
        email = COALESCE($4, members.email),
        phone = COALESCE($5, members.phone),
        gender = COALESCE($6, members.gender),
        course = COALESCE($7, members.course),
        jumuiya_id = COALESCE($8, members.jumuiya_id)
    `, [effectiveId, first_name || null, last_name || null, email || null, phone || null, gender || null, course || null, jumuiyaUuid]);

    // Sync associates table
    {
      const aSets = [];
      const aVals = [];
      let ap = 1;
      if (first_name || last_name) {
        aSets.push(`name = $${ap++}`);
        aVals.push(`${first_name || ''} ${last_name || ''}`.trim());
      }
      if (email !== undefined) { aSets.push(`email = $${ap++}`); aVals.push(email); }
      if (phone !== undefined) { aSets.push(`phone = $${ap++}`); aVals.push(phone); }
      if (gender !== undefined) { aSets.push(`gender = $${ap++}`); aVals.push(gender); }
      if (jumuiyaName) { aSets.push(`jumuiya_name = $${ap++}`); aVals.push(jumuiyaName); }
      if (jumuiyaUuid) { aSets.push(`jumuiya_id = $${ap++}`); aVals.push(jumuiyaUuid); }
      if (aSets.length > 0) {
        aVals.push(id);
        await pool.query(`UPDATE associates SET ${aSets.join(", ")} WHERE member_id = $${ap}`, aVals);
      }
      if (memberIdChanged) {
        await pool.query("UPDATE associates SET member_id = $1 WHERE member_id = $2", [newMemberId, id]);
      }
    }

    await pool.query('COMMIT');

    const userId = req.user?.id || req.user?.member_id || 'system';
    const userName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'System' : 'System';

    const targetReg = effectiveId;
    const targetName = syncName || targetReg;
    const logJumuiya = jumuiyaName || (jumuiyaUuid ? (await pool.query("SELECT name FROM sub_groups WHERE group_id = $1", [jumuiyaUuid])).rows[0]?.name || null : null);

    if (is_active !== undefined) {
      await createActivityLog(targetReg, targetName, is_active === false ? 'member_flagged_inactive' : 'member_unflagged', 'member', targetReg, { acted_by: userId, acted_by_name: userName, jumuiya: logJumuiya });
    }
    if (memberIdChanged) {
      await createActivityLog(targetReg, targetName, 'member_id_changed', 'member', targetReg, { acted_by: userId, acted_by_name: userName, old_id: id, new_id: newMemberId });
    }

    return res.json({
      success: true,
      data: {
        member_id: effectiveId,
        id: effectiveId,
        name: syncName || effectiveId,
        first_name: first_name || null,
        last_name: last_name || null,
        email: email || null,
        course: course || null,
        phone: phone || null,
        gender: gender || null,
        jumuiya_name: jumuiyaName,
        jumuiya_id: jumuiyaUuid,
        source: "jum",
      }
    });

  } catch (error) {
    try { await pool.query('ROLLBACK'); } catch (_) { /* no active txn */ }
    logger.error(`Error updating jumuiya member: ${error.message} | stack: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to update member" });
  }
};


/**
 * DELETE /api/jumuiya-members/:id
 * Permanently delete a member from ALL tables in the system.
 * Cleans up all traces of a member across the entire system.
 */
export const deleteJumuiyaMember = async (req, res) => {
  try {
    const { id } = req.params; // member_id

    await pool.query('BEGIN');

    await pool.query("DELETE FROM registered WHERE member_id = $1", [id]);
    await pool.query("DELETE FROM group_assignments WHERE member_id = $1", [id]);
    await pool.query("DELETE FROM allocation_approvals WHERE member_id = $1", [id]);
    await pool.query("DELETE FROM import_records WHERE cleaned_reg_number = $1", [id]);
    await pool.query("DELETE FROM associates WHERE member_id = $1", [id]);
    await pool.query("DELETE FROM refresh_tokens WHERE member_id = $1", [id]);
    await pool.query("DELETE FROM password_resets WHERE member_id = $1", [id]);
    await pool.query("DELETE FROM mpesa_request WHERE user_id = $1", [id]);
    await pool.query("DELETE FROM member_roles WHERE member_id = $1", [id]);
    await pool.query("DELETE FROM notifications WHERE member_id = $1", [id]);
    await pool.query("DELETE FROM users WHERE username = $1", [id]);
    await pool.query("DELETE FROM officials WHERE reg_number = $1", [id]);
    await pool.query("DELETE FROM jumuiya_officials WHERE reg_number = $1", [id]);

    const result = await pool.query(
      "DELETE FROM members WHERE member_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    await pool.query('COMMIT');

    const deletedMember = result.rows[0];
    const targetReg = deletedMember.member_id;
    const targetName = [deletedMember.first_name, deletedMember.last_name].filter(Boolean).join(" ").trim() || targetReg;
    const userId = req.user?.id || req.user?.member_id || 'system';
    const userName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'System' : 'System';
    await createActivityLog(targetReg, targetName, 'member_deleted', 'member', targetReg, { acted_by: userId, acted_by_name: userName });

    res.json({ success: true, message: "Member permanently removed from the system" });
  } catch (error) {
    await pool.query('ROLLBACK');
    logger.error("Error deleting jumuiya member: " + error.message);
    res.status(500).json({ success: false, message: "Failed to delete member" });
  }
};


/**
 * GET /api/jumuiya-members/unregistered
 */
export const getUnregisteredMembers = async (req, res) => {
  try {
    const { jumuiya_id } = req.query;

    let query = `
      SELECT 
        m.member_id, m.first_name, m.last_name, m.email, m.year_of_study, m.jumuiya_id,
        sg.name as jumuiya_name
      FROM members m
      LEFT JOIN registered r ON m.member_id = r.member_id
      LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
      WHERE r.member_id IS NULL
    `;

    const queryParams = [];
    if (jumuiya_id) {
       // Optional: Filter logic if we specifically want to prioritize some, 
       // but for now, we show everyone requested by the user.
       // However, we'll keep the param for frontend compatibility.
    }

    query += ` ORDER BY m.first_name ASC`;

    const result = await pool.query(query, queryParams);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error("Error fetching unregistered members: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch unregistered members" });
  }
};

/**
 * POST /api/jumuiya-members/bulk-join
 */
export const bulkJoinJumuiya = async (req, res) => {
  try {
    const { member_ids, jumuiya_id } = req.body;

    if (!Array.isArray(member_ids) || member_ids.length === 0 || !jumuiya_id) {
      return res.status(400).json({ success: false, message: "member_ids (array) and jumuiya_id are required" });
    }

    // Start Transaction
    await pool.query('BEGIN');

    // 1. Update members table directly
    const updateResult = await pool.query(
      `UPDATE members 
       SET jumuiya_id = $1 
       WHERE member_id = ANY($2) 
       RETURNING *`,
      [jumuiya_id, member_ids]
    );

    // 2. Insert into registered table
    // This officially registers the members in the community
    await pool.query(
      `INSERT INTO registered (member_id, jumuiya_id, registration_date, status) 
       SELECT unnest($1::text[]), $2, CURRENT_TIMESTAMP, 'active'
       ON CONFLICT DO NOTHING`,
      [member_ids, jumuiya_id]
    );

    await pool.query('COMMIT');

    res.status(200).json({ 
      success: true, 
      message: `Successfully registered ${updateResult.rows.length} members`,
      count: updateResult.rows.length
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    logger.error("Error in bulk join: " + error.message);
    res.status(500).json({ success: false, message: "Failed to register members in bulk" });
  }
};


/**
 * POST /api/jumuiya-members/bulk-register-with-payment
 * Register multiple members after a single STK Push payment for the total amount.
 */
export const bulkRegisterWithPayment = async (req, res) => {
  const { member_ids, jumuiya_id, phoneNumber, amount } = req.body;

  if (!Array.isArray(member_ids) || member_ids.length === 0 || !jumuiya_id || !phoneNumber || !amount) {
    return res.status(400).json({ 
      success: false, 
      message: "member_ids (array), jumuiya_id, phoneNumber, and amount are required" 
    });
  }

  try {
    logger.info(`Initiating bulk registration payment for ${member_ids.length} members to jumuiya ${jumuiya_id}`);

    // 1. Trigger STK Push and wait for result
    // We use the first member_id as the user_id for the mpesa_request record
    const paymentResult = await payAndWait(member_ids[0], phoneNumber, amount);

    if (paymentResult.status !== "success" && paymentResult.status !== "paid") {
      return res.status(402).json({ 
        success: false, 
        message: paymentResult.message || "Payment failed or timed out. Please try again." 
      });
    }

    // 2. If payment success, proceed with bulk registration logic
    // Start Transaction
    await pool.query('BEGIN');

    const isSecondSem = new Date().getMonth() < 4 ? 1 : 0;

    // Update members table — normalize year_of_study and set the correct sem_*_reg
    const updateResult = await pool.query(
      `WITH norm AS (
         SELECT
           member_id,
           CASE
             WHEN year_of_study ~ '^[1-4]$' THEN year_of_study
             WHEN year_of_study ~ '^\\d{4}-\\d{4}$'
               THEN GREATEST(1, LEAST(4,
                 EXTRACT(YEAR FROM CURRENT_DATE)::int - CAST(SPLIT_PART(year_of_study, '-', 1) AS integer) + 1
               ))::text
           END AS norm_yos
         FROM members
         WHERE member_id = ANY($3)
       )
       UPDATE members m
       SET jumuiya_id = $1, migrated_to_associates = NULL,
           year_of_study = COALESCE(norm.norm_yos, m.year_of_study),
           sem_1_reg = CASE WHEN norm.norm_yos = '1' AND $2 = 0 THEN true ELSE m.sem_1_reg END,
           sem_2_reg = CASE WHEN norm.norm_yos = '1' AND $2 = 1 THEN true ELSE m.sem_2_reg END,
           sem_3_reg = CASE WHEN norm.norm_yos = '2' AND $2 = 0 THEN true ELSE m.sem_3_reg END,
           sem_4_reg = CASE WHEN norm.norm_yos = '2' AND $2 = 1 THEN true ELSE m.sem_4_reg END,
           sem_5_reg = CASE WHEN norm.norm_yos = '3' AND $2 = 0 THEN true ELSE m.sem_5_reg END,
           sem_6_reg = CASE WHEN norm.norm_yos = '3' AND $2 = 1 THEN true ELSE m.sem_6_reg END,
           sem_7_reg = CASE WHEN norm.norm_yos = '4' AND $2 = 0 THEN true ELSE m.sem_7_reg END,
           sem_8_reg = CASE WHEN norm.norm_yos = '4' AND $2 = 1 THEN true ELSE m.sem_8_reg END
       FROM norm
       WHERE m.member_id = norm.member_id
       RETURNING m.*`,
      [jumuiya_id, isSecondSem, member_ids]
    );

    // Insert into registered table
    await pool.query(
      `INSERT INTO registered (member_id, jumuiya_id, registration_date, status) 
       SELECT unnest($1::text[]), $2, CURRENT_TIMESTAMP, 'active'
       ON CONFLICT DO NOTHING`,
      [member_ids, jumuiya_id]
    );

    await pool.query('COMMIT');

    res.status(200).json({ 
      success: true, 
      message: `Payment successful and ${updateResult.rows.length} members registered!`,
      count: updateResult.rows.length
    });

  } catch (error) {
    if (pool) await pool.query('ROLLBACK');
    logger.error("Error in bulkRegisterWithPayment: " + error.message);
    res.status(500).json({ success: false, message: "Internal server error during bulk registration" });
  }
};


/**
 * GET /api/jumuiya-members/registered?jumuiya_id=st-anthony
 * Fetch ONLY registered members for a specific jumuiya.
 */
export const getRegisteredJumuiyaMembers = async (req, res) => {
  try {
    const { jumuiya_id } = req.query;

    const resolvedUuid = await resolveJumuiyaUuid(jumuiya_id);

    let query = `
      SELECT 
        r.id as registration_id,
        r.registration_date,
        m.member_id as id,
        m.first_name,
        m.last_name,
        m.course,
        m.year_of_study as year,
        m.jumuiya_id,
        sg.name as jumuiya_name,
        true as is_registered,
        m.source,
        m.status as import_status
      FROM registered r
      JOIN members m ON r.member_id = m.member_id
      LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
      WHERE r.status = 'active'
        AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
    `;

    const queryParams = [];
    if (resolvedUuid) {
      query += ` AND r.jumuiya_id = $1`;
      queryParams.push(resolvedUuid);
    }

    query += ` ORDER BY m.first_name ASC`;

    const result = await pool.query(query, queryParams);

    const formatted = result.rows.map(row => ({
      ...row,
      name: `${row.first_name} ${row.last_name || ""}`.trim(),
      is_current_jumuiya: true,
      jumuiya_id: jumuiya_id || row.jumuiya_id,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    logger.error("Error fetching registered members: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch registered members" });
  }
};

/**
 * GET /api/jumuiya-members/registered/all
 * Fetch all registered members across all Jumuiyas (for CSA Secretary).
 * Only returns members with an active row in the registered table.
 */
export const getAllRegisteredMembers = async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");

    const currentMonth = new Date().getMonth() + 1;
    const isSecondSem = currentMonth <= 4;

    const semesterFilter = [1,2,3,4].map(yos => {
      const colIdx = (yos - 1) * 2 + (isSecondSem ? 2 : 1);
      return `(m.year_of_study = '${yos}' AND m.sem_${colIdx}_reg = true)`;
    }).join(' OR ');

    const currentSemLabel = isSecondSem ? "2nd Semester" : "1st Semester";

    const result = await pool.query(`
      SELECT
        r.id as registration_id,
        r.serial_no,
        r.registration_date,
        m.member_id as id,
        m.member_id as reg_number,
        m.first_name,
        m.last_name,
        m.email,
        m.course,
        m.year_of_study as year,
        m.jumuiya_id,
        sg.name as jumuiya_name,
        LOWER(REPLACE(REPLACE(sg.name, '.', ''), ' ', '-')) as jumuiya_slug,
        m.sem_1_reg, m.sem_2_reg, m.sem_3_reg, m.sem_4_reg,
        m.sem_5_reg, m.sem_6_reg, m.sem_7_reg, m.sem_8_reg
      FROM registered r
      JOIN members m ON r.member_id = m.member_id
      LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
      WHERE (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
        AND r.status = 'active'
        AND (${semesterFilter})
      ORDER BY sg.name, m.first_name ASC
    `);

    const formatted = result.rows.map(row => ({
      ...row,
      name: `${row.first_name} ${row.last_name || ""}`.trim(),
      semester_count: [row.sem_1_reg, row.sem_2_reg, row.sem_3_reg, row.sem_4_reg,
                       row.sem_5_reg, row.sem_6_reg, row.sem_7_reg, row.sem_8_reg]
                       .filter(Boolean).length,
    }));

    res.json({
      success: true,
      data: formatted,
      total: formatted.length,
      current_semester: {
        is_second_sem: isSecondSem,
        label: currentSemLabel,
        sem_col: isSecondSem ? 'sem_even' : 'sem_odd',
      },
    });
  } catch (error) {
    logger.error("Error fetching all registered members: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch all registered members" });
  }
};

/**
 * POST /api/jumuiya-members/registered/manual
 * CSA Secretary manually registers a member (cash/direct registration).
 * Sets jumuiya, semester flags, and creates the registered row.
 */
export const manualRegisterMember = async (req, res) => {
  try {
    const { member_id, jumuiya_id, semesters, serial_no, amount } = req.body;

    logger.info(`manualRegisterMember called: member_id=${member_id}, jumuiya_id=${jumuiya_id}, amount=${amount}, semesters=${JSON.stringify(semesters)}`);

    if (!member_id || !jumuiya_id) {
      return res.status(400).json({ success: false, message: "member_id and jumuiya_id are required" });
    }

    await pool.query("BEGIN");

    // 1. Verify member exists
    const member = await pool.query("SELECT * FROM members WHERE member_id = $1", [member_id]);
    if (member.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    // 2. Update members table — set jumuiya, semester flags, and un-migrate if needed
    const semUpdates = [];
    const semVals = [];
    let idx = 2;
    const SEM_COLS = ["sem_1_reg", "sem_2_reg", "sem_3_reg", "sem_4_reg",
                      "sem_5_reg", "sem_6_reg", "sem_7_reg", "sem_8_reg"];
    for (const col of SEM_COLS) {
      const val = Array.isArray(semesters) ? semesters.includes(col) : false;
      semUpdates.push(`${col} = $${idx++}`);
      semVals.push(val);
    }
    semVals.push(member_id);
    await pool.query(
      `UPDATE members SET jumuiya_id = $1, migrated_to_associates = NULL, ${semUpdates.join(", ")} WHERE member_id = $${idx}`,
      [jumuiya_id, ...semVals]
    );

    // 3. Insert into registered (idempotent)
    await pool.query(
      `INSERT INTO registered (member_id, jumuiya_id, registration_date, status, serial_no)
       VALUES ($1, $2, CURRENT_TIMESTAMP, 'active', $3)
       ON CONFLICT DO NOTHING`,
      [member_id, jumuiya_id, serial_no || null]
    );

    // 4. Record cash payment (best-effort, non-blocking)
    if (amount && parseInt(amount) > 0) {
      try {
        const payAmount = parseInt(amount);
        const cashCheckoutId = `CASH-${member_id}-${Date.now()}`;
        await pool.query(
          `INSERT INTO mpesa_request (user_id, checkout_id, amount, status, mpesa_receipt, created_at)
           VALUES ($1, $2, $3, 'paid', 'CASH', CURRENT_TIMESTAMP)`,
          [member_id, cashCheckoutId, payAmount]
        );
        logger.info(`Cash payment INSERT succeeded for ${member_id}, amount=${payAmount}`);
      } catch (payErr) {
        logger.warn("Cash payment INSERT failed (non-blocking): " + payErr.message);
      }
    } else {
      logger.info(`Cash payment skipped: amount=${amount}`);
    }

    await pool.query("COMMIT");

    // Debug: verify the registered row exists
    const regDebug = await pool.query(
      "SELECT r.id, r.member_id, r.jumuiya_id, r.status, r.serial_no FROM registered r WHERE r.member_id = $1",
      [member_id]
    );
    logger.info(`DEBUG registered rows for ${member_id}: count=${regDebug.rows.length}, rows=${JSON.stringify(regDebug.rows)}`);

    const row = member.rows[0];
    res.status(200).json({
      success: true,
      message: `Member ${member_id} registered successfully`,
      data: { id: row.member_id, name: `${row.first_name} ${row.last_name || ""}`.trim() },
    });

    // Send receipt email with stamp card PDF (non-blocking)
    if (row.email && process.env.MAIL_USER && process.env.MAIL_PASS) {
      (async () => {
        try {
          const pdfBuffer = await generateStampCardPdf({
            memberName: `${row.first_name} ${row.last_name || ""}`.trim(),
            memberId: member_id,
            jumuiyaName: jumuiya_id,
            amount: amount || 0,
            semesterLabel: semesters ? semesters.filter(Boolean).join(", ") : 'Current Semester',
          });
          await mailTransporter.sendMail({
            from: process.env.MAIL_USER,
            to: row.email,
            subject: `Registration Receipt — Payment Received`,
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h2 style="color: #16a34a; margin: 0;">Payment Receipt</h2>
                  <p style="color: #64748b; font-size: 0.9rem;">Cash Registration</p>
                </div>
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                  Hi ${row.first_name || ''}, your cash payment of <strong>KES ${amount || 0}</strong> has been recorded and your registration is confirmed.
                </p>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <p style="margin: 0 0 8px; color: #166534; font-size: 0.85rem;"><strong>Member:</strong> ${row.first_name} ${row.last_name || ""}</p>
                  <p style="margin: 0 0 8px; color: #166534; font-size: 0.85rem;"><strong>Registration ID:</strong> ${member_id}</p>
                  <p style="margin: 0 0 8px; color: #166534; font-size: 0.85rem;"><strong>Amount:</strong> KES ${amount || 0}</p>
                  <p style="margin: 0; color: #166534; font-size: 0.85rem;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <p style="color: #94a3b8; font-size: 0.8rem; text-align: center; margin-top: 32px;">Your Semester Stamp Card is attached.</p>
              </div>
            `,
            attachments: [{
              filename: `stamp-card-${member_id}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            }],
          });
        } catch (err) {
          logger.error("Failed to send receipt email: " + err.message);
        }
      })();
    }
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error("Error in manualRegisterMember: " + error.message);
    res.status(500).json({ success: false, error: "Failed to register member" });
  }
};

/**
 * DELETE /api/jumuiya-members/unregister/:id
 * Remove member from a Jumuiya registration but keep them in the database.
 */
export const unregisterJumuiyaMember = async (req, res) => {
  try {
    const { id } = req.params; // member_id

    // Start Transaction
    await pool.query('BEGIN');

    // 1. Remove from registered table
    await pool.query("DELETE FROM registered WHERE member_id = $1", [id]);

    // 2. Clear jumuiya_id in members table
    const result = await pool.query(
      "UPDATE members SET jumuiya_id = NULL WHERE member_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    await pool.query('COMMIT');

    res.json({ 
      success: true, 
      message: "Member unregistered from Jumuiya successfully",
      data: result.rows[0]
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    logger.error("Error unregistering member: " + error.message);
    res.status(500).json({ success: false, message: "Failed to unregister member" });
  }
};


/**
 * POST /api/jumuiya-members/register-with-payment
 * Register a member after a successful STK Push payment.
 */
export const registerWithPayment = async (req, res) => {
  const { member_id, jumuiya_id, phoneNumber, amount } = req.body;

  if (!member_id || !jumuiya_id || !phoneNumber || !amount) {
    return res.status(400).json({ 
      success: false, 
      message: "member_id, jumuiya_id, phoneNumber, and amount are required" 
    });
  }

  try {
    logger.info(`Initiating registration payment for member ${member_id} to jumuiya ${jumuiya_id}`);

    // 1. Trigger STK Push and wait for result
    const paymentResult = await payAndWait(member_id, phoneNumber, amount);

    if (paymentResult.status !== "success" && paymentResult.status !== "paid") {
      return res.status(402).json({ 
        success: false, 
        message: paymentResult.message || "Payment failed or timed out. Please try again." 
      });
    }

    // 2. If payment success, proceed with registration logic
    // Start Transaction
    await pool.query('BEGIN');

    // Determine which semester column to flag based on year_of_study + current month
    const memberInfo = await pool.query(
      `SELECT year_of_study FROM members WHERE member_id = $1`,
      [member_id]
    );
    let semCol = null;
    let normalizedYos = null;
    if (memberInfo.rows.length > 0) {
      normalizedYos = normalizeYearOfStudy(memberInfo.rows[0].year_of_study);
      if (normalizedYos) {
        const month = new Date().getMonth();
        const isSecondSem = month < 4;
        const semIndex = (parseInt(normalizedYos) - 1) * 2 + (isSecondSem ? 1 : 0);
        semCol = SEMESTER_COLS[semIndex];
      }
    }

    // Update members table — also normalize year_of_study if needed
    const yosUpdate = normalizedYos ? `, year_of_study = '${normalizedYos}'` : '';
    await pool.query(
      `UPDATE members SET jumuiya_id = $1, migrated_to_associates = NULL${yosUpdate}${semCol ? `, ${semCol} = true` : ''} WHERE member_id = $2`,
      [jumuiya_id, member_id]
    );

    // Fetch updated member with jumuiya name via JOIN
    const updateResult = await pool.query(
      `SELECT m.*, sg.name as jumuiya_name
       FROM members m
       LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
       WHERE m.member_id = $1`,
      [member_id]
    );

    if (updateResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    // Insert into registered table
    await pool.query(
      `INSERT INTO registered (member_id, jumuiya_id, registration_date, status) 
       VALUES ($1, $2, CURRENT_TIMESTAMP, 'active')
       ON CONFLICT DO NOTHING`, 
      [member_id, jumuiya_id]
    );

    await pool.query('COMMIT');

    const row = updateResult.rows[0];
    const memberName = `${row.first_name} ${row.last_name || ""}`.trim();
    const jumuiyaName = row.jumuiya_name || 'your community';

    // Send confirmation email with stamp card PDF (non-blocking)
    if (row.email && process.env.MAIL_USER && process.env.MAIL_PASS) {
      (async () => {
        try {
          const pdfBuffer = await generateStampCardPdf({
            memberName,
            memberId: row.member_id,
            jumuiyaName,
            amount,
            semesterLabel: semCol ? `Semester ${semCol.replace('sem_', '').replace('_reg', '')}` : 'Current Semester',
          });
          await mailTransporter.sendMail({
            from: process.env.MAIL_USER,
            to: row.email,
            subject: `Registration Confirmed — ${jumuiyaName}`,
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h2 style="color: #16a34a; margin: 0;">Registration Confirmed</h2>
                  <p style="color: #64748b; font-size: 0.9rem;">${jumuiyaName}</p>
                </div>
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">Hi ${memberName},</p>
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                  Your registration to <strong>${jumuiyaName}</strong> has been confirmed and your payment of <strong>KES ${amount}</strong> has been received.
                </p>
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                  Your Semester Stamp Card is attached to this email. You can also view and download it from the community page.
                </p>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <p style="margin: 0 0 8px; color: #166534; font-size: 0.85rem;"><strong>Member:</strong> ${memberName}</p>
                  <p style="margin: 0 0 8px; color: #166534; font-size: 0.85rem;"><strong>Community:</strong> ${jumuiyaName}</p>
                  <p style="margin: 0 0 8px; color: #166534; font-size: 0.85rem;"><strong>Registration ID:</strong> ${row.member_id}</p>
                  <p style="margin: 0; color: #166534; font-size: 0.85rem;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <p style="color: #94a3b8; font-size: 0.8rem; text-align: center; margin-top: 32px;">
                  This is an automated message from the Campus Catholic Community registration system.
                </p>
              </div>
            `,
            attachments: [{
              filename: `stamp-card-${row.member_id}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            }],
          });
        } catch (err) {
          logger.error("Failed to send registration confirmation email with stamp card: " + err.message);
        }
      })();
    }

    res.status(200).json({ 
      success: true, 
      message: "Payment successful and registration complete!",
      data: {
        ...row,
        id: row.member_id,
        name: memberName
      }
    });

  } catch (error) {
    if (pool) await pool.query('ROLLBACK');
    logger.error("Error in registerWithPayment: " + error.message);
    res.status(500).json({ success: false, message: "Internal server error during registration" });
  }
};

/**
 * GET /api/jumuiya-members/all
 * Returns ALL members across ALL jumuiyas (unfiltered).
 * Combines legacy members, CSA-distributed, and direct processed imports.
 * Used by the "All CSA Members" admin view.
 */
export const getAllMembersAcrossJumuiyas = async (req, res) => {
  try {
    const merged = await fetchAllMembers(null);
    res.json({ success: true, data: merged });
  } catch (error) {
    logger.error("Error fetching all members across jumuiyas: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch members" });
  }
};

/**
 * GET /api/jumuiya-members/lookup
 * Returns a full slug → name mapping for all Jumuiyas.
 * Useful for the frontend to translate IDs to display names.
 */
export const getJumuiyaLookup = async (req, res) => {
  try {
    const result = await pool.query("SELECT group_id, name, full_name FROM sub_groups ORDER BY name ASC");
    const lookup = {};
    result.rows.forEach(row => {
      lookup[row.group_id] = { name: row.name, fullName: row.full_name || row.name };
    });
    res.json({ success: true, data: lookup });
  } catch (error) {
    logger.error("Error fetching jumuiya lookup: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch jumuiya lookup" });
  }
};

/**
 * POST /api/jumuiya-members/send-stamp-card
 * Emails a PDF stamp card to the member's email as an attachment.
 */
export const sendStampCard = async (req, res) => {
  try {
    const { email, pdfBase64, memberName, jumuiyaName } = req.body;
    if (!email || !pdfBase64) {
      return res.status(400).json({ success: false, error: "Email and PDF data are required" });
    }

    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      logger.warn("Email not configured: MAIL_USER / MAIL_PASS missing in .env");
      return res.status(500).json({ success: false, error: "Email service is not configured. Please contact the admin." });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: `Your Semester Stamp Card - ${jumuiyaName || 'Community'}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #1e293b; margin: 0;">Your Semester Stamp Card</h2>
            <p style="color: #64748b; font-size: 0.9rem;">${jumuiyaName || 'Community'} &middot; ${memberName || ''}</p>
          </div>
          <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
            Thank you for registering! Your semester stamp card is attached to this email.
            Please keep it for your records. You will receive a new stamp after each semester registration.
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; color: #64748b; font-size: 0.85rem;"><strong>Member:</strong> ${memberName || '—'}</p>
            <p style="margin: 0 0 8px; color: #64748b; font-size: 0.85rem;"><strong>Community:</strong> ${jumuiyaName || '—'}</p>
            <p style="margin: 0; color: #64748b; font-size: 0.85rem;"><strong>Sent:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <p style="color: #94a3b8; font-size: 0.8rem; text-align: center; margin-top: 32px;">
            This is an automated message from the Campus Catholic Community registration system.
          </p>
        </div>
      `,
      attachments: [{
        filename: `Stamp_Card_${memberName ? memberName.replace(/\s+/g, '_') : 'member'}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    };

    await mailTransporter.sendMail(mailOptions);
    logger.info(`Stamp card emailed to ${email}`);
    res.json({ success: true, message: "Stamp card sent to your email" });
  } catch (error) {
    logger.error("Error sending stamp card email: " + error.message);
    res.status(500).json({ success: false, error: error.message || "Failed to send stamp card email" });
  }
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const getAnalytics = async (req, res) => {
  try {
    const JUMUIYAS = [
      { id: "st-anthony", name: "St. Anthony of Padua" },
      { id: "st-augustine", name: "St. Augustine of Hippo" },
      { id: "st-catherine", name: "St. Catherine of Alexandria" },
      { id: "st-dominic", name: "St. Dominic" },
      { id: "st-elizabeth", name: "St. Elizabeth of Hungary" },
      { id: "st-maria-goretti", name: "St. Maria Goretti" },
      { id: "st-monica", name: "St. Monica" },
    ];

    // Run queries in parallel
    const [
      totalRegistered,
      totalMembers,
      registrationsByMonth,
      registrationsByJumuiya,
      semesterFillRates,
      coursesBreakdown,
      yearBreakdown,
      genderBreakdown,
      recentRegistrations,
      paymentSummary,
    ] = await Promise.all([
      // 1. Total registered
      pool.query(`
        SELECT COUNT(*)::int as count
        FROM registered r
        JOIN members m ON r.member_id = m.member_id
        WHERE r.status = 'active'
          AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
      `),

      // 2. Total members (all)
      pool.query(`
        SELECT COUNT(*)::int as count
        FROM members
        WHERE (migrated_to_associates IS NULL OR migrated_to_associates = false)
      `),

      // 3. Registration trends (by month, last 12 months)
      pool.query(`
        SELECT
          TO_CHAR(r.registration_date, 'YYYY-MM') as month,
          COUNT(*)::int as count
        FROM registered r
        JOIN members m ON r.member_id = m.member_id
        WHERE r.status = 'active'
          AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
          AND r.registration_date >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR(r.registration_date, 'YYYY-MM')
        ORDER BY month ASC
      `),

      // 4. Registrations per jumuiya
      pool.query(`
        SELECT
          sg.name as jumuiya_name,
          LOWER(REPLACE(REPLACE(sg.name, '.', ''), ' ', '-')) as jumuiya_slug,
          COALESCE(sg.color, '#6b7280') as jumuiya_color,
          COUNT(*)::int as count
        FROM registered r
        JOIN members m ON r.member_id = m.member_id
        LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
        WHERE r.status = 'active'
          AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
        GROUP BY sg.name, sg.group_id, sg.color
        ORDER BY count DESC
      `),

      // 5. Semester fill rates (how many registered members have each semester checked)
      pool.query(`
        SELECT
          SUM(CASE WHEN sem_1_reg = true THEN 1 ELSE 0 END)::int as sem_1,
          SUM(CASE WHEN sem_2_reg = true THEN 1 ELSE 0 END)::int as sem_2,
          SUM(CASE WHEN sem_3_reg = true THEN 1 ELSE 0 END)::int as sem_3,
          SUM(CASE WHEN sem_4_reg = true THEN 1 ELSE 0 END)::int as sem_4,
          SUM(CASE WHEN sem_5_reg = true THEN 1 ELSE 0 END)::int as sem_5,
          SUM(CASE WHEN sem_6_reg = true THEN 1 ELSE 0 END)::int as sem_6,
          SUM(CASE WHEN sem_7_reg = true THEN 1 ELSE 0 END)::int as sem_7,
          SUM(CASE WHEN sem_8_reg = true THEN 1 ELSE 0 END)::int as sem_8
        FROM members m
        JOIN registered r ON r.member_id = m.member_id
        WHERE r.status = 'active'
          AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
      `),

      // 6. Course breakdown (top 10 courses)
      pool.query(`
        SELECT
          COALESCE(m.course, 'Unknown') as course,
          COUNT(*)::int as count
        FROM registered r
        JOIN members m ON r.member_id = m.member_id
        WHERE r.status = 'active'
          AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
        GROUP BY m.course
        ORDER BY count DESC
        LIMIT 10
      `),

      // 7. Year of study breakdown
      pool.query(`
        SELECT
          COALESCE(m.year_of_study::text, 'Unknown') as year,
          COUNT(*)::int as count
        FROM registered r
        JOIN members m ON r.member_id = m.member_id
        WHERE r.status = 'active'
          AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
        GROUP BY m.year_of_study
        ORDER BY m.year_of_study ASC
      `),

      // 8. Gender breakdown
      pool.query(`
        SELECT
          COALESCE(m.gender, 'Unknown') as gender,
          COUNT(*)::int as count
        FROM registered r
        JOIN members m ON r.member_id = m.member_id
        WHERE r.status = 'active'
          AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
        GROUP BY m.gender
      `),

      // 9. Recent registrations (last 10)
      pool.query(`
        SELECT
          m.first_name, m.last_name, m.member_id,
          sg.name as jumuiya_name,
          r.registration_date, r.serial_no
        FROM registered r
        JOIN members m ON r.member_id = m.member_id
        LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
        WHERE r.status = 'active'
          AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
        ORDER BY r.registration_date DESC
        LIMIT 10
      `),

      // 10. Payment summary broken down by source (MPesa vs Manual)
      pool.query(`
        SELECT
          COUNT(*)::int as total_transactions,
          COALESCE(SUM(amount), 0)::numeric as total_amount,
          SUM(CASE WHEN status IN ('success', 'paid') THEN 1 ELSE 0 END)::int as successful,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::int as pending,
          SUM(CASE WHEN status IN ('failed', 'cancelled') THEN 1 ELSE 0 END)::int as failed,
          COALESCE(SUM(amount) FILTER (WHERE (mpesa_receipt IS NULL OR mpesa_receipt != 'CASH') AND status IN ('success', 'paid')), 0)::numeric as mpesa_success_amount,
          COALESCE(SUM(amount) FILTER (WHERE mpesa_receipt = 'CASH' AND status = 'paid'), 0)::numeric as manual_success_amount
        FROM mpesa_request
      `),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalRegistered: totalRegistered.rows[0]?.count || 0,
          totalMembers: totalMembers.rows[0]?.count || 0,
          registrationRate: totalMembers.rows[0]?.count
            ? Math.round(((totalRegistered.rows[0]?.count || 0) / totalMembers.rows[0].count) * 100)
            : 0,
        },
        registrationTrends: registrationsByMonth.rows,
        jumuiyaComparison: registrationsByJumuiya.rows,
        semesterFillRates: semesterFillRates.rows[0] || {},
        coursesBreakdown: coursesBreakdown.rows,
        yearBreakdown: yearBreakdown.rows,
        genderBreakdown: genderBreakdown.rows,
        recentRegistrations: recentRegistrations.rows,
        paymentSummary: paymentSummary.rows[0] || {},
      },
    });
  } catch (error) {
    logger.error("Error fetching analytics: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch analytics" });
  }
};

// ─── Update Payment Status ────────────────────────────────────────────────────

export const getPayments = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT
        p.id, p.phone, p.amount, p.status, p.mpesa_receipt, p.user_id, p.payment_source,
        p.created_at, p.updated_at,
        m.first_name, m.last_name, m.member_id as reg_number, m.email,
        sg.name as jumuiya_name
      FROM mpesa_request p
      LEFT JOIN members m ON p.user_id = m.member_id
      LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
    `;
    const params = [];
    if (status) {
      if (status === 'success') {
        query += ` WHERE p.status IN ('success', 'paid')`;
      } else {
        query += ` WHERE p.status = $1`;
        params.push(status);
      }
    }
    query += ` ORDER BY p.created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error("Error fetching payments: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch payments" });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, mpesa_receipt } = req.body;

    const validStatuses = ['pending', 'success', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await pool.query(
      `UPDATE mpesa_request
       SET status = $1,
           mpesa_receipt = COALESCE($2, mpesa_receipt),
           result_code = CASE WHEN $1 = 'success' THEN 0 WHEN $1 = 'failed' THEN 1 ELSE result_code END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, phone, amount, status, mpesa_receipt, created_at, updated_at`,
      [status, mpesa_receipt || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    logger.info(`Payment #${id} status updated to ${status}`);
    res.json({ success: true, data: result.rows[0], message: `Payment status updated to ${status}` });
  } catch (error) {
    logger.error("Error updating payment status: " + error.message);
    res.status(500).json({ success: false, error: "Failed to update payment status" });
  }
};

// ─── Cohort Analytics ─────────────────────────────────────────────────────────
const SEMESTER_COLS = ['sem_1_reg','sem_2_reg','sem_3_reg','sem_4_reg','sem_5_reg','sem_6_reg','sem_7_reg','sem_8_reg'];
const SEMESTER_LABELS = ['1.1','1.2','2.1','2.2','3.1','3.2','4.1','4.2'];

export const getCohortAnalytics = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Normalize year_of_study: "2024-2025" → computed year level, "4" → pass-through
    const yearNorm = `
      CASE
        WHEN m.year_of_study ~ '^[1-4]$' THEN m.year_of_study
        WHEN m.year_of_study ~ '^[0-9]{4}-[0-9]{4}$'
          THEN GREATEST(1, LEAST(4,
            EXTRACT(YEAR FROM CURRENT_DATE)::int - CAST(SPLIT_PART(m.year_of_study, '-', 1) AS integer) + 1
          ))::text
      END
    `;

    // Per-cohort semester registration counts from members table directly
    const cohortResult = await pool.query(`
      SELECT
        ${yearNorm} AS year_of_study,
        COUNT(*)::int as total_members,
        ${SEMESTER_COLS.map((col, i) => `SUM(CASE WHEN m.${col} = true THEN 1 ELSE 0 END)::int as ${col}`).join(',\n        ')}
      FROM members m
      WHERE (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
        AND m.year_of_study IS NOT NULL
        AND (m.year_of_study ~ '^[1-4]$' OR m.year_of_study ~ '^[0-9]{4}-[0-9]{4}$')
      GROUP BY year_of_study
      ORDER BY year_of_study ASC
    `);

    // All members breakdown by year_of_study (for pie chart — raw values as-is)
    const yearCounts = await pool.query(`
      SELECT
        COALESCE(m.year_of_study, 'Unknown') as year,
        COUNT(*)::int as count
      FROM members m
      WHERE (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
      GROUP BY m.year_of_study
      ORDER BY m.year_of_study ASC
    `);

    // Build cohort data
    const cohorts = cohortResult.rows.map(row => {
      const yearLevel = parseInt(row.year_of_study);
      const admissionYear = currentYear - yearLevel + 1;
      const semesters = SEMESTER_COLS.map((col, i) => ({
        sem: SEMESTER_LABELS[i],
        count: row[col] || 0,
        pct: row.total_members > 0 ? Math.round(((row[col] || 0) / row.total_members) * 100) : 0,
      }));

      return {
        label: `${admissionYear} Cohort`,
        currentYear: `Year ${yearLevel}`,
        admissionYear,
        yearLevel,
        total: row.total_members,
        registered: row.total_members,
        semesters,
      };
    }).sort((a, b) => b.admissionYear - a.admissionYear); // newest first

    res.json({
      success: true,
      data: {
        cohorts,
        yearBreakdown: yearCounts.rows,
        semesterLabels: SEMESTER_LABELS,
      },
    });
  } catch (error) {
    logger.error("Error fetching cohort analytics: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch cohort analytics" });
  }
};

export const getJumuiyaProgression = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const fromYear = parseInt(req.query.from) || (currentYear - 3);
    const toYear = parseInt(req.query.to) || currentYear;

    // Compute admission year from year_of_study: currentYear - year_of_study + 1
    const admissionYearExpr = `(${currentYear} - CAST(m.year_of_study AS integer) + 1)`;

    const result = await pool.query(`
      SELECT
        sg.name AS jumuiya_name,
        LOWER(REPLACE(REPLACE(sg.name, '.', ''), ' ', '-')) AS jumuiya_slug,
        sg.color AS jumuiya_color,
        COUNT(DISTINCT m.member_id)::int AS total_members,
        ${SEMESTER_COLS.map((col, i) => `COUNT(DISTINCT CASE WHEN m.${col} = true THEN m.member_id END)::int AS ${col}`).join(',\n        ')}
      FROM members m
      JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
      WHERE (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
        AND m.year_of_study ~ '^[1-4]$'
        AND ${admissionYearExpr} BETWEEN $1 AND $2
      GROUP BY sg.name, sg.slug, sg.color
      ORDER BY sg.name ASC
    `, [fromYear, toYear]);

    const jumuiyas = result.rows.map(row => {
      const semesters = SEMESTER_COLS.map((col, i) => ({
        sem: SEMESTER_LABELS[i],
        count: row[col] || 0,
        pct: row.total_members > 0 ? Math.round(((row[col] || 0) / row.total_members) * 100) : 0,
      }));

      return {
        jumuiyaName: row.jumuiya_name,
        jumuiyaSlug: row.jumuiya_slug,
        jumuiyaColor: row.jumuiya_color || "#6b7280",
        total: row.total_members,
        semesters,
      };
    });

    res.json({
      success: true,
      data: {
        jumuiyas,
        semesterLabels: SEMESTER_LABELS,
        yearRange: { from: fromYear, to: toYear },
      },
    });
  } catch (error) {
    logger.error("Error fetching jumuiya progression: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch jumuiya progression" });
  }
};

export const getYearlyContribution = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const targetYear = parseInt(req.query.year) || currentYear;

    // Admission year = currentYear - CAST(year_of_study AS integer) + 1
    // For target year T, a member is active if admissionYear BETWEEN (T - 3) AND T

    // Per-jumuiya: registered members for the target year
    const regResult = await pool.query(`
      SELECT
        sg.name AS jumuiya_name,
        LOWER(REPLACE(REPLACE(sg.name, '.', ''), ' ', '-')) AS jumuiya_slug,
        sg.color AS jumuiya_color,
        COUNT(DISTINCT m.member_id)::int AS registered_count
      FROM sub_groups sg
      LEFT JOIN members m ON m.jumuiya_id = sg.group_id
        AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
        AND m.year_of_study ~ '^[1-4]$'
        AND CASE $1 - ${currentYear} + CAST(m.year_of_study AS integer) - 1
          WHEN 0 THEN (m.sem_1_reg = true OR m.sem_2_reg = true)
          WHEN 1 THEN (m.sem_3_reg = true OR m.sem_4_reg = true)
          WHEN 2 THEN (m.sem_5_reg = true OR m.sem_6_reg = true)
          WHEN 3 THEN (m.sem_7_reg = true OR m.sem_8_reg = true)
          ELSE false
        END = true
      WHERE sg.slug IN
        ('st-anthony','st-augustine','st-catherine','st-dominic','st-elizabeth','st-maria-goretti','st-monica')
      GROUP BY sg.name, sg.slug, sg.color
      ORDER BY registered_count DESC
    `, [targetYear]);

    // Per-jumuiya: total active members (registered or not) for the target year
    const totalResult = await pool.query(`
      SELECT
        sg.slug AS jumuiya_slug,
        COUNT(DISTINCT m.member_id)::int AS total_members
      FROM sub_groups sg
      LEFT JOIN members m ON m.jumuiya_id = sg.group_id
        AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
        AND m.year_of_study ~ '^[1-4]$'
        AND ${currentYear} - CAST(m.year_of_study AS integer) + 1 BETWEEN ($1 - 3) AND $1
      WHERE sg.slug IN
        ('st-anthony','st-augustine','st-catherine','st-dominic','st-elizabeth','st-maria-goretti','st-monica')
      GROUP BY sg.slug
    `, [targetYear]);

    const totalMap = {};
    totalResult.rows.forEach(r => { totalMap[r.jumuiya_slug] = r.total_members; });

    const jumuiyas = regResult.rows.map(row => ({
      jumuiyaName: row.jumuiya_name,
      jumuiyaSlug: row.jumuiya_slug,
      jumuiyaColor: row.jumuiya_color || "#6b7280",
      registeredCount: row.registered_count,
      totalMembers: totalMap[row.jumuiya_slug] || 0,
    }));

    const totalRegistered = jumuiyas.reduce((sum, j) => sum + j.registeredCount, 0);
    const totalMembers = jumuiyas.reduce((sum, j) => sum + j.totalMembers, 0);
    const top = jumuiyas.length > 0 ? jumuiyas[0] : null;

    // Per-year: registered + total for top years
    const yearsResult = await pool.query(`
      SELECT
        y.year,
        COUNT(DISTINCT m.member_id) FILTER (WHERE
          CASE y.year - ${currentYear} + CAST(m.year_of_study AS integer) - 1
            WHEN 0 THEN (m.sem_1_reg = true OR m.sem_2_reg = true)
            WHEN 1 THEN (m.sem_3_reg = true OR m.sem_4_reg = true)
            WHEN 2 THEN (m.sem_5_reg = true OR m.sem_6_reg = true)
            WHEN 3 THEN (m.sem_7_reg = true OR m.sem_8_reg = true)
            ELSE false
          END = true
        )::int AS registered,
        COUNT(DISTINCT m.member_id)::int AS total
      FROM (VALUES ($1::int), ($2::int), ($3::int), ($4::int)) AS y(year)
      LEFT JOIN members m ON
        (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
        AND m.year_of_study ~ '^[1-4]$'
        AND m.jumuiya_id IN (SELECT group_id FROM sub_groups WHERE slug IN
          ('st-anthony','st-augustine','st-catherine','st-dominic','st-elizabeth','st-maria-goretti','st-monica'))
        AND ${currentYear} - CAST(m.year_of_study AS integer) + 1 BETWEEN (y.year - 3) AND y.year
      GROUP BY y.year
      ORDER BY registered DESC
    `, [currentYear - 3, currentYear - 2, currentYear - 1, currentYear]);

    const topYears = yearsResult.rows.slice(0, 3).map(r => ({
      year: r.year,
      registered: r.registered,
      total: r.total,
    }));

    res.json({
      success: true,
      data: {
        year: targetYear,
        totalRegistered,
        totalMembers,
        topContributor: top,
        jumuiyas,
        topYears,
      },
    });
  } catch (error) {
    logger.error("Error fetching yearly contribution: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch yearly contribution" });
  }
};

/**
 * GET /api/jumuiya-members/semester-history
 * Returns all active members with their semester registration flags in a grid format.
 * Query params: from_year, to_year (admission year range filter)
 */
export const getSemesterHistory = async (req, res) => {
  try {
    const { from_year, to_year } = req.query;
    const currentYear = new Date().getFullYear();

    let query = `
      SELECT
        m.member_id as reg_number,
        m.first_name,
        m.last_name,
        m.course,
        COALESCE(m.year_of_study, '1') as year_of_study,
        m.gender,
        sg.name as jumuiya_name,
        LOWER(REPLACE(REPLACE(sg.name, '.', ''), ' ', '-')) as jumuiya_slug,
        ${currentYear} - CAST(COALESCE(NULLIF(m.year_of_study, ''), '1') AS integer) + 1 AS admission_year,
        m.sem_1_reg, m.sem_2_reg, m.sem_3_reg, m.sem_4_reg,
        m.sem_5_reg, m.sem_6_reg, m.sem_7_reg, m.sem_8_reg
      FROM members m
      LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
      WHERE m.jumuiya_id IS NOT NULL
        AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
    `;

    const params = [];
    let paramIdx = 1;

    if (from_year) {
      query += ` AND ${currentYear} - CAST(m.year_of_study AS integer) + 1 >= $${paramIdx++}`;
      params.push(parseInt(from_year));
    }
    if (to_year) {
      query += ` AND ${currentYear} - CAST(m.year_of_study AS integer) + 1 <= $${paramIdx++}`;
      params.push(parseInt(to_year));
    }

    query += ` ORDER BY admission_year DESC, sg.name, m.first_name ASC`;

    const result = await pool.query(query, params);

    const formatted = result.rows.map(row => ({
      reg_number: row.reg_number,
      first_name: row.first_name,
      last_name: row.last_name,
      name: `${row.first_name} ${row.last_name || ""}`.trim(),
      course: row.course,
      year_of_study: row.year_of_study,
      gender: row.gender,
      jumuiya_name: row.jumuiya_name,
      jumuiya_slug: row.jumuiya_slug,
      admission_year: row.admission_year,
      semesters: {
        sem_1: row.sem_1_reg, sem_2: row.sem_2_reg,
        sem_3: row.sem_3_reg, sem_4: row.sem_4_reg,
        sem_5: row.sem_5_reg, sem_6: row.sem_6_reg,
        sem_7: row.sem_7_reg, sem_8: row.sem_8_reg,
      },
      total_semesters: [row.sem_1_reg, row.sem_2_reg, row.sem_3_reg, row.sem_4_reg,
                        row.sem_5_reg, row.sem_6_reg, row.sem_7_reg, row.sem_8_reg]
                        .filter(Boolean).length,
    }));

    res.json({ success: true, data: formatted, total: formatted.length });
  } catch (error) {
    logger.error("Error fetching semester history: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch semester history" });
  }
};
