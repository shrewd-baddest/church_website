import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";
import { emitSocketEvent } from "../socket/index.js";

/**
 * Normalizes any variation of liturgical dancers position title
 * to the canonical "Dance Chairperson" or "Dance Vice Chairperson".
 */
export const normalizeDancePosition = (pos) => {
  if (!pos) return 'Dance Chairperson';
  const lower = String(pos).toLowerCase();
  if (lower.includes('vice') || lower.includes('ass') || lower.includes('deputy')) {
    return 'Dance Vice Chairperson';
  }
  return 'Dance Chairperson';
};

/**
 * Synchronizes an official from `officials` (category 'Liturgical Dancers')
 * to `group_officials` (category 'Dancers').
 */
export const syncDancerToGroups = async (csaOfficial) => {
  if (!csaOfficial || csaOfficial.category !== 'Liturgical Dancers') return null;

  try {
    const normPosition = normalizeDancePosition(csaOfficial.position);
    const regNum = csaOfficial.reg_number ? csaOfficial.reg_number.trim() : null;
    const termId = csaOfficial.election_term_id || null;
    const termOfService = csaOfficial.term_of_service || null;
    const officialName = (csaOfficial.name || '').trim();
    const status = csaOfficial.status || 'active';
    const contact = csaOfficial.contact || null;
    const photo = csaOfficial.photo || null;

    // Check for existing in group_officials
    const existing = await pool.query(
      `SELECT id, photo FROM group_officials
       WHERE category = 'Dancers'
         AND (
           ($1::text IS NOT NULL AND reg_number = $1)
           OR (
             LOWER(position) = LOWER($2)
             AND (
               ($3::int IS NOT NULL AND election_term_id = $3)
               OR ($4::text IS NOT NULL AND term_of_service = $4)
             )
           )
           OR (
             LOWER(TRIM(name)) = LOWER(TRIM($5))
             AND (
               ($3::int IS NOT NULL AND election_term_id = $3)
               OR ($4::text IS NOT NULL AND term_of_service = $4)
             )
           )
         )
       ORDER BY CASE WHEN $1::text IS NOT NULL AND reg_number = $1 THEN 0 ELSE 1 END
       LIMIT 1`,
      [regNum, normPosition, termId, termOfService, officialName]
    );

    if (existing.rows.length > 0) {
      const updateResult = await pool.query(
        `UPDATE group_officials
         SET name = $1,
             position = $2,
             contact = $3,
             photo = COALESCE($4, photo),
             election_term_id = $5,
             status = $6,
             term_of_service = $7,
             reg_number = $8,
             updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [officialName, normPosition, contact, photo, termId, status, termOfService, regNum, existing.rows[0].id]
      );
      emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", {
        action: "update_group",
        id: existing.rows[0].id,
        data: updateResult.rows[0],
      });
      logger.info(`syncDancerToGroups: updated group_official id ${existing.rows[0].id} for ${officialName}`);
      return updateResult.rows[0];
    } else {
      const insertResult = await pool.query(
        `INSERT INTO group_officials (
           name, category, position, contact, photo,
           election_term_id, status, term_of_service, reg_number
         ) VALUES ($1, 'Dancers', $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [officialName, normPosition, contact, photo, termId, status, termOfService, regNum]
      );
      emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", {
        action: "create_group",
        data: insertResult.rows[0],
      });
      logger.info(`syncDancerToGroups: created group_official for ${officialName} (${normPosition})`);
      return insertResult.rows[0];
    }
  } catch (err) {
    logger.error(`syncDancerToGroups error: ${err.message}`);
    return null;
  }
};

/**
 * Synchronizes an official from `group_officials` (category 'Dancers')
 * to `officials` (category 'Liturgical Dancers').
 */
export const syncDancerToCsa = async (groupOfficial) => {
  if (!groupOfficial || groupOfficial.category !== 'Dancers') return null;

  try {
    const normPosition = normalizeDancePosition(groupOfficial.position);
    const regNum = groupOfficial.reg_number ? groupOfficial.reg_number.trim() : null;
    const termId = groupOfficial.election_term_id || null;
    const termOfService = groupOfficial.term_of_service || null;
    const officialName = (groupOfficial.name || '').trim();
    const status = groupOfficial.status || 'active';
    const contact = groupOfficial.contact || null;
    const photo = groupOfficial.photo || null;

    // Check for existing in officials
    const existing = await pool.query(
      `SELECT id, photo FROM officials
       WHERE category = 'Liturgical Dancers'
         AND (
           ($1::text IS NOT NULL AND reg_number = $1)
           OR (
             LOWER(position) = LOWER($2)
             AND (
               ($3::int IS NOT NULL AND election_term_id = $3)
               OR ($4::text IS NOT NULL AND term_of_service = $4)
             )
           )
           OR (
             LOWER(TRIM(name)) = LOWER(TRIM($5))
             AND (
               ($3::int IS NOT NULL AND election_term_id = $3)
               OR ($4::text IS NOT NULL AND term_of_service = $4)
             )
           )
         )
       ORDER BY CASE WHEN $1::text IS NOT NULL AND reg_number = $1 THEN 0 ELSE 1 END
       LIMIT 1`,
      [regNum, normPosition, termId, termOfService, officialName]
    );

    if (existing.rows.length > 0) {
      const updateResult = await pool.query(
        `UPDATE officials
         SET name = $1,
             position = $2,
             contact = $3,
             photo = COALESCE($4, photo),
             election_term_id = $5,
             status = $6,
             term_of_service = $7,
             reg_number = $8,
             updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [officialName, normPosition, contact, photo, termId, status, termOfService, regNum, existing.rows[0].id]
      );
      emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", {
        action: "update",
        id: existing.rows[0].id,
        data: updateResult.rows[0],
      });
      logger.info(`syncDancerToCsa: updated official id ${existing.rows[0].id} for ${officialName}`);
      return updateResult.rows[0];
    } else {
      const insertResult = await pool.query(
        `INSERT INTO officials (
           name, category, position, contact, photo,
           election_term_id, status, term_of_service, reg_number
         ) VALUES ($1, 'Liturgical Dancers', $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [officialName, normPosition, contact, photo, termId, status, termOfService, regNum]
      );
      emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", {
        action: "create",
        data: insertResult.rows[0],
      });
      logger.info(`syncDancerToCsa: created csa official for ${officialName} (${normPosition})`);
      return insertResult.rows[0];
    }
  } catch (err) {
    logger.error(`syncDancerToCsa error: ${err.message}`);
    return null;
  }
};

/**
 * Synchronizes dancer deletion across tables.
 * When a dancer is deleted from officials, also delete from group_officials, and vice versa.
 */
export const syncDancerDeletion = async (sourceTable, official) => {
  if (!official) return;
  const isDancer = official.category === 'Liturgical Dancers' || official.category === 'Dancers';
  if (!isDancer) return;

  try {
    const targetTable = sourceTable === 'officials' ? 'group_officials' : 'officials';
    const targetCategory = sourceTable === 'officials' ? 'Dancers' : 'Liturgical Dancers';
    const normPosition = normalizeDancePosition(official.position);
    const regNum = official.reg_number ? official.reg_number.trim() : null;
    const termId = official.election_term_id || null;
    const termOfService = official.term_of_service || null;
    const officialName = (official.name || '').trim();

    const deleteRes = await pool.query(
      `DELETE FROM ${targetTable}
       WHERE category = $1
         AND (
           ($2::text IS NOT NULL AND reg_number = $2)
           OR (
             LOWER(position) = LOWER($3)
             AND (
               ($4::int IS NOT NULL AND election_term_id = $4)
               OR ($5::text IS NOT NULL AND term_of_service = $5)
             )
           )
           OR (
             LOWER(TRIM(name)) = LOWER(TRIM($6))
             AND (
               ($4::int IS NOT NULL AND election_term_id = $4)
               OR ($5::text IS NOT NULL AND term_of_service = $5)
             )
           )
         )
       RETURNING id`,
      [targetCategory, regNum, normPosition, termId, termOfService, officialName]
    );

    if (deleteRes.rows.length > 0) {
      deleteRes.rows.forEach(r => {
        const action = targetTable === 'group_officials' ? 'delete_group' : 'delete';
        emitSocketEvent("CSA_NOTIFICATIONS", "officialsUpdated", { action, id: r.id });
      });
      logger.info(`syncDancerDeletion: deleted matching record(s) from ${targetTable}`);
    }
  } catch (err) {
    logger.error(`syncDancerDeletion error: ${err.message}`);
  }
};
