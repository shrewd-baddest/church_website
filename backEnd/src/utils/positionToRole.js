import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

export const CSA_POSITION_TO_ROLE = {
  'Chairperson': 'csa_chair',
  'Secretary': 'csa_secretary',
  'Jumuiya Coordinator': 'jumuiya_coordinator',
  'Organizing Secretary': 'os',
  'Project Manager': 'project_manager',
  'Assistant Project Manager': 'project_manager',
  'Instrument Manager': 'instrument_manager',
  'Assistant Instrument Manager': 'instrument_manager',
  'Liturgist': 'liturgist',
  'Assistant Liturgist': 'liturgist',
  'Choir Chairperson': 'choir_chairperson',
};

export const JUMUIYA_POSITION_TO_ROLE = {
  'Chairperson': 'jumuiya_chairperson',
  'Organizing Secretary': 'jumuiya_os',
  'Secretary': 'jumuiya_secretary',
};

const ROLE_IS_JUMUIYA_SCOPED = [
  'jumuiya_chairperson',
  'jumuiya_os',
  'jumuiya_secretary',
];

export const getRoleNameForPosition = (position, isJumuiya) => {
  const map = isJumuiya ? JUMUIYA_POSITION_TO_ROLE : CSA_POSITION_TO_ROLE;
  return map[position] || null;
};

export const autoAssignRoleForOfficial = async (regNumber, position, isJumuiya, category, assignedBy, initialStatus = 'pending') => {
  const roleName = getRoleNameForPosition(position, isJumuiya);
  if (!roleName) return null;

  if (!regNumber) return null;

  const memberResult = await pool.query(
    `SELECT member_id, jumuiya_id FROM members WHERE member_id = $1`,
    [regNumber]
  );
  if (memberResult.rows.length === 0) return null;
  const member = memberResult.rows[0];

  const roleResult = await pool.query(
    `SELECT role_id FROM roles WHERE role_name = $1 AND status = 'active'`,
    [roleName]
  );
  if (roleResult.rows.length === 0) {
    logger.warn(`autoAssignRoleForOfficial: role "${roleName}" not found in roles table`);
    return null;
  }
  const roleId = roleResult.rows[0].role_id;

  let effectiveJumuiyaId = null;
  if (ROLE_IS_JUMUIYA_SCOPED.includes(roleName)) {
    if (isJumuiya) {
      const jumuiyaResult = await pool.query(
        `SELECT group_id FROM sub_groups WHERE name = $1`,
        [category]
      );
      if (jumuiyaResult.rows.length > 0) {
        effectiveJumuiyaId = jumuiyaResult.rows[0].group_id;
      }
    } else {
      effectiveJumuiyaId = member.jumuiya_id;
    }
  }

  const existingApproved = await pool.query(
    `SELECT id FROM member_roles
     WHERE member_id = $1 AND role_id = $2
       AND COALESCE(jumuiya_id, '00000000-0000-0000-0000-000000000000'::uuid)
           = COALESCE($3::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
       AND status = 'approved'`,
    [member.member_id, roleId, effectiveJumuiyaId]
  );
  if (existingApproved.rows.length > 0) {
    return { id: existingApproved.rows[0].id, status: 'approved', message: 'Already approved' };
  }

  const existingPending = await pool.query(
    `SELECT id FROM member_roles
     WHERE member_id = $1 AND role_id = $2
       AND COALESCE(jumuiya_id, '00000000-0000-0000-0000-000000000000'::uuid)
           = COALESCE($3::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
       AND status = 'pending'`,
    [member.member_id, roleId, effectiveJumuiyaId]
  );

  let result;
  if (existingPending.rows.length > 0) {
    const statusUpdate = initialStatus !== 'pending' ? `, status = '${initialStatus.replace(/'/g, "''")}'` : '';
    result = await pool.query(
      `UPDATE member_roles SET assigned_by = $1, created_at = NOW()${statusUpdate}
       WHERE id = $2 RETURNING id, status`,
      [assignedBy, existingPending.rows[0].id]
    );
  } else {
    result = await pool.query(
      `INSERT INTO member_roles (member_id, role_id, assigned_by, jumuiya_id, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, status`,
      [member.member_id, roleId, assignedBy, effectiveJumuiyaId, initialStatus]
    );
  }

  const msg = initialStatus === 'approved' ? 'Role assigned and approved.' : 'Role assigned. Pending approval.';
  return { id: result.rows[0].id, status: result.rows[0].status, message: msg };
};

export const removeRoleForOfficial = async (regNumber, position, isJumuiya) => {
  const roleName = getRoleNameForPosition(position, isJumuiya);
  if (!roleName || !regNumber) return;

  const memberResult = await pool.query(
    `SELECT member_id FROM members WHERE member_id = $1`,
    [regNumber]
  );
  if (memberResult.rows.length === 0) return;

  const roleResult = await pool.query(
    `SELECT role_id FROM roles WHERE role_name = $1 AND status = 'active'`,
    [roleName]
  );
  if (roleResult.rows.length === 0) return;

  await pool.query(
    `DELETE FROM member_roles WHERE member_id = $1 AND role_id = $2`,
    [memberResult.rows[0].member_id, roleResult.rows[0].role_id]
  );
};
