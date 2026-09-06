import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";
import { getRoleNameForPosition, getGroupRoleName, checkExecutiveExclusivity } from "../utils/positionToRole.js";
import { syncDancerToGroups, syncDancerToCsa } from "../utils/danceSync.js";

const ADMIN_ROLES = ["csa_chair", "jumuiya_coordinator"];

const rejectIfNotAdmin = (req, res) => {
  const userRoles = req.user?.role;
  const normalized = (Array.isArray(userRoles) ? userRoles : [userRoles])
    .map((r) => String(r).toLowerCase().trim());
  const hasAccess = normalized.some((r) => ADMIN_ROLES.includes(r));
  if (!hasAccess) {
    res.status(404).json({
      success: false,
      message: "Resource not found",
    });
    return false;
  }
  return true;
};

let _lastSyncTimestamp = 0;
const SYNC_COOLDOWN_MS = 60_000;

export const syncPendingOfficialsToRoles = async () => {
  try {
    const now = Date.now();
    if (now - _lastSyncTimestamp < SYNC_COOLDOWN_MS) return;
    _lastSyncTimestamp = now;

    const officials = await pool.query(`
      SELECT jo.id, jo.name, jo.category, jo.position, jo.contact, jo.reg_number
      FROM jumuiya_officials jo
      WHERE (jo.status = 'active' OR jo.status IS NULL)
    `);

    for (const off of officials.rows) {
      const roleName = getRoleNameForPosition(off.position, true);
      if (!roleName) continue;

      // Ensure role exists
      let roleRes = await pool.query("SELECT role_id FROM roles WHERE role_name = $1", [roleName]);
      if (roleRes.rows.length === 0) {
        roleRes = await pool.query(
          "INSERT INTO roles (role_name, description, status) VALUES ($1, $2, 'active') RETURNING role_id",
          [roleName, roleName.replace(/_/g, ' ')]
        );
      }
      const roleId = roleRes.rows[0].role_id;

      // Resolve memberId
      let memberId = off.reg_number?.trim() || null;

      // Resolve effectiveJumuiyaId
      let effectiveJumuiyaId = null;
      if (off.category) {
        const catRes = await pool.query(
          `SELECT group_id FROM sub_groups 
           WHERE name = $1 
              OR LOWER(TRIM(name)) = LOWER(TRIM($1))
              OR LOWER(REPLACE(REPLACE(name, '.', ''), ' ', '-')) = LOWER(REPLACE(REPLACE($1, '.', ''), ' ', '-'))
              OR LOWER(slug) = LOWER(REPLACE(REPLACE($1, '.', ''), ' ', '-'))
           LIMIT 1`,
          [off.category.trim()]
        );
        if (catRes.rows.length > 0) effectiveJumuiyaId = catRes.rows[0].group_id;
      }

      if (memberId) {
        const mCheck = await pool.query("SELECT member_id FROM members WHERE member_id = $1", [memberId]);
        if (mCheck.rows.length === 0) memberId = null;
      }

      if (!memberId && off.contact) {
        const cleanPhone = off.contact.replace(/[^0-9]/g, '');
        if (cleanPhone.length >= 8) {
          const pMatch = await pool.query("SELECT member_id FROM members WHERE phone LIKE '%' || $1 || '%' LIMIT 1", [cleanPhone.slice(-8)]);
          if (pMatch.rows.length > 0) memberId = pMatch.rows[0].member_id;
        }
      }

      if (!memberId && off.name) {
        const nMatch = await pool.query("SELECT member_id FROM members WHERE (first_name || ' ' || last_name) ILIKE $1 LIMIT 1", [`%${off.name.trim()}%`]);
        if (nMatch.rows.length > 0) memberId = nMatch.rows[0].member_id;
      }

      if (!memberId) {
        const nameParts = (off.name || 'Official').trim().split(/\s+/);
        const fName = nameParts[0] || 'Official';
        const lName = nameParts.slice(1).join(' ') || '';
        const pDigits = off.contact ? off.contact.replace(/[^0-9]/g, '').slice(-5) : Math.floor(10000 + Math.random() * 90000);
        memberId = `OFF/${pDigits}/${new Date().getFullYear().toString().slice(-2)}`;

        await pool.query(
          `INSERT INTO members (member_id, first_name, last_name, phone, jumuiya_id, join_date, status)
           VALUES ($1, $2, $3, $4, $5, NOW(), 'active')
           ON CONFLICT (member_id) DO NOTHING`,
          [memberId, fName, lName, off.contact || null, effectiveJumuiyaId || null]
        );
      }

      if (off.reg_number !== memberId) {
        await pool.query("UPDATE jumuiya_officials SET reg_number = $1 WHERE id = $2", [memberId, off.id]);
      }

      const existing = await pool.query(
        "SELECT id, status FROM member_roles WHERE member_id = $1 AND role_id = $2 ORDER BY id DESC LIMIT 1",
        [memberId, roleId]
      );

      if (existing.rows.length === 0) {
        // Respect executive exclusivity — never create a pending that can't be approved
        const exclusivity = await checkExecutiveExclusivity(memberId, roleName);
        if (exclusivity) {
          logger.warn(`syncPendingOfficialsToRoles: skipped ${roleName} for ${off.name} — ${exclusivity.message}`);
          continue;
        }
        await pool.query(
          `INSERT INTO member_roles (member_id, role_id, jumuiya_id, status, created_at)
           VALUES ($1, $2, $3, 'pending', NOW())`,
          [memberId, roleId, effectiveJumuiyaId || null]
        );
        logger.info(`syncPendingOfficialsToRoles: Auto-created pending role ${roleName} for official ${off.name} (${off.category})`);
      }
    }

    const groupOfficials = await pool.query(`
      SELECT go.id, go.name, go.category, go.position, go.contact, go.photo, go.election_term_id, go.status, go.term_of_service, go.reg_number
      FROM group_officials go
      WHERE (go.status = 'active' OR go.status IS NULL)
    `);

    for (const off of groupOfficials.rows) {
      if (off.category === 'Dancers') {
        await syncDancerToCsa(off);
      }

      const roleName = getGroupRoleName(off.category, off.position);
      if (!roleName) continue;

      let roleRes = await pool.query("SELECT role_id FROM roles WHERE role_name = $1", [roleName]);
      if (roleRes.rows.length === 0) {
        roleRes = await pool.query(
          "INSERT INTO roles (role_name, description, status) VALUES ($1, $2, 'active') RETURNING role_id",
          [roleName, roleName.replace(/_/g, ' ')]
        );
      }
      const roleId = roleRes.rows[0].role_id;

      let memberId = off.reg_number?.trim() || null;

      if (memberId) {
        const mCheck = await pool.query("SELECT member_id FROM members WHERE member_id = $1", [memberId]);
        if (mCheck.rows.length === 0) memberId = null;
      }

      if (!memberId && off.contact) {
        const cleanPhone = off.contact.replace(/[^0-9]/g, '');
        if (cleanPhone.length >= 8) {
          const pMatch = await pool.query("SELECT member_id FROM members WHERE phone LIKE '%' || $1 || '%' LIMIT 1", [cleanPhone.slice(-8)]);
          if (pMatch.rows.length > 0) memberId = pMatch.rows[0].member_id;
        }
      }

      if (!memberId && off.name) {
        const nMatch = await pool.query("SELECT member_id FROM members WHERE (first_name || ' ' || last_name) ILIKE $1 LIMIT 1", [`%${off.name.trim()}%`]);
        if (nMatch.rows.length > 0) memberId = nMatch.rows[0].member_id;
      }

      if (!memberId) {
        const nameParts = (off.name || 'Official').trim().split(/\s+/);
        const fName = nameParts[0] || 'Official';
        const lName = nameParts.slice(1).join(' ') || '';
        const pDigits = off.contact ? off.contact.replace(/[^0-9]/g, '').slice(-5) : Math.floor(10000 + Math.random() * 90000);
        memberId = `OFF/${pDigits}/${new Date().getFullYear().toString().slice(-2)}`;

        await pool.query(
          `INSERT INTO members (member_id, first_name, last_name, phone, join_date, status)
           VALUES ($1, $2, $3, $4, NOW(), 'active')
           ON CONFLICT (member_id) DO NOTHING`,
          [memberId, fName, lName, off.contact || null]
        );
      }

      if (off.reg_number !== memberId) {
        await pool.query("UPDATE group_officials SET reg_number = $1 WHERE id = $2", [memberId, off.id]);
      }

      const existing = await pool.query(
        "SELECT id, status FROM member_roles WHERE member_id = $1 AND role_id = $2",
        [memberId, roleId]
      );

      if (existing.rows.length === 0) {
        // Respect executive exclusivity — never create a pending that can't be approved
        const exclusivity = await checkExecutiveExclusivity(memberId, roleName);
        if (exclusivity) {
          logger.warn(`syncPendingOfficialsToRoles: skipped ${roleName} for group official ${off.name} — ${exclusivity.message}`);
          continue;
        }
        await pool.query(
          `INSERT INTO member_roles (member_id, role_id, status, created_at)
           VALUES ($1, $2, 'pending', NOW())`,
          [memberId, roleId]
        );
        logger.info(`syncPendingOfficialsToRoles: Auto-created pending role ${roleName} for group official ${off.name} (${off.category})`);
      } else if (['rejected', 'revoked'].includes(existing.rows[0].status)) {
        await pool.query(
          `UPDATE member_roles
           SET status = 'pending', assigned_by = NULL, approved_by = NULL, approved_at = NULL, created_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [existing.rows[0].id]
        );
        logger.info(`syncPendingOfficialsToRoles: Reopened ${existing.rows[0].status} role ${roleName} for group official ${off.name}`);
      }
    }

    // Sync CSA officials (including Liturgical Dancers and executive/liaison roles)
    const csaOfficials = await pool.query(`
      SELECT o.id, o.name, o.category, o.position, o.contact, o.photo, o.election_term_id, o.status, o.term_of_service, o.reg_number
      FROM officials o
      WHERE (o.status = 'active' OR o.status IS NULL)
    `);

    for (const off of csaOfficials.rows) {
      if (off.category === 'Liturgical Dancers') {
        await syncDancerToGroups(off);
      }

      const roleName = getRoleNameForPosition(off.position, false);
      if (!roleName) continue;

      let roleRes = await pool.query("SELECT role_id FROM roles WHERE role_name = $1", [roleName]);
      if (roleRes.rows.length === 0) {
        roleRes = await pool.query(
          "INSERT INTO roles (role_name, description, status) VALUES ($1, $2, 'active') RETURNING role_id",
          [roleName, roleName.replace(/_/g, ' ')]
        );
      }
      const roleId = roleRes.rows[0].role_id;

      let memberId = off.reg_number?.trim() || null;
      if (memberId) {
        const mCheck = await pool.query("SELECT member_id FROM members WHERE member_id = $1", [memberId]);
        if (mCheck.rows.length === 0) memberId = null;
      }
      if (!memberId && off.contact) {
        const cleanPhone = off.contact.replace(/[^0-9]/g, '');
        if (cleanPhone.length >= 8) {
          const pMatch = await pool.query("SELECT member_id FROM members WHERE phone LIKE '%' || $1 || '%' LIMIT 1", [cleanPhone.slice(-8)]);
          if (pMatch.rows.length > 0) memberId = pMatch.rows[0].member_id;
        }
      }
      if (!memberId && off.name) {
        const nMatch = await pool.query("SELECT member_id FROM members WHERE (first_name || ' ' || last_name) ILIKE $1 LIMIT 1", [`%${off.name.trim()}%`]);
        if (nMatch.rows.length > 0) memberId = nMatch.rows[0].member_id;
      }
      if (!memberId) continue;

      const existing = await pool.query(
        "SELECT id, status FROM member_roles WHERE member_id = $1 AND role_id = $2",
        [memberId, roleId]
      );

      if (existing.rows.length === 0) {
        const exclusivity = await checkExecutiveExclusivity(memberId, roleName);
        if (exclusivity) {
          logger.warn(`syncPendingOfficialsToRoles: skipped ${roleName} for csa official ${off.name} — ${exclusivity.message}`);
          continue;
        }
        const status = roleName === 'csa_chair' ? 'approved' : 'pending';
        await pool.query(
          `INSERT INTO member_roles (member_id, role_id, status, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [memberId, roleId, status]
        );
        logger.info(`syncPendingOfficialsToRoles: Auto-created ${status} role ${roleName} for csa official ${off.name} (${off.category})`);
      } else if (['rejected', 'revoked'].includes(existing.rows[0].status) && roleName !== 'csa_chair') {
        await pool.query(
          `UPDATE member_roles
           SET status = 'pending', assigned_by = NULL, approved_by = NULL, approved_at = NULL, created_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [existing.rows[0].id]
        );
      }
    }
  } catch (err) {
    logger.error("syncPendingOfficialsToRoles error: " + err.message);
  }
};

export const listRoles = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT role_id, role_name, description FROM roles WHERE status = 'active' ORDER BY role_name"
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error("listRoles error:", error.message);
    res.status(500).json({ success: false, message: "Failed to list roles" });
  }
};

export const listAssignments = async (req, res) => {
  try {
    await syncPendingOfficialsToRoles();

    const { status, jumuiya_id } = req.query;
    let query = `
      SELECT mr.id, mr.member_id, mr.role_id, mr.status, mr.assigned_by, mr.approved_by,
             mr.approved_at, mr.jumuiya_id, mr.created_at,
             COALESCE(r.role_name, 'unknown') as role_name, 
             COALESCE(r.description, 'Role assignment') as role_description,
             CASE
               WHEN r.role_name IN ('csa_chair', 'jumuiya_coordinator', 'csa_vice_chair', 'csa_secretary', 'os', 'project_manager', 'instrument_manager', 'treasurer', 'liturgist')
                 THEN COALESCE(o.position, go.position, jo.position)
               WHEN r.role_name LIKE 'jumuiya_%'
                 THEN COALESCE(jo.position, o.position, go.position)
               ELSE
                 COALESCE(go.position, o.position, jo.position)
             END as source_position,
             COALESCE(m.first_name, jo.name, o.name, go.name, mr.member_id) as first_name,
             COALESCE(m.last_name, '') as last_name,
             CASE
               WHEN r.role_name LIKE 'dance_%' THEN 'Dancers'
               WHEN r.role_name LIKE 'choir_%' THEN 'Choir'
               WHEN r.role_name LIKE 'charismatic_%' THEN 'Charismatic'
               WHEN r.role_name LIKE 'st_francis_%' THEN 'St. Francis'
               WHEN r.role_name LIKE 'mentorship_%' THEN 'Mentorship'
               WHEN r.role_name IN ('csa_chair', 'csa_vice_chair', 'csa_secretary', 'jumuiya_coordinator', 'os', 'project_manager', 'instrument_manager', 'treasurer', 'liturgist')
                 THEN 'CSA Executive'
               ELSE COALESCE(sg.name, msg.name, jo.category, go.category, o.category)
             END as jumuiya_name,
             ab.first_name as assigned_by_first, ab.last_name as assigned_by_last,
             apb.first_name as approved_by_first, apb.last_name as approved_by_last
      FROM member_roles mr
      LEFT JOIN roles r ON mr.role_id = r.role_id
      LEFT JOIN members m ON LOWER(TRIM(mr.member_id)) = LOWER(TRIM(m.member_id))
      LEFT JOIN LATERAL (
        SELECT jo.position, jo.name, jo.category
        FROM jumuiya_officials jo
        WHERE LOWER(TRIM(jo.reg_number)) = LOWER(TRIM(mr.member_id))
        ORDER BY CASE WHEN jo.status = 'active' THEN 0 ELSE 1 END, jo.id DESC
        LIMIT 1
      ) jo ON true
      LEFT JOIN LATERAL (
        SELECT o.position, o.name, o.category
        FROM officials o
        WHERE LOWER(TRIM(o.reg_number)) = LOWER(TRIM(mr.member_id))
        ORDER BY CASE WHEN o.status = 'active' THEN 0 ELSE 1 END, o.id DESC
        LIMIT 1
      ) o ON true
      LEFT JOIN LATERAL (
        SELECT go.position, go.name, go.category
        FROM group_officials go
        WHERE LOWER(TRIM(go.reg_number)) = LOWER(TRIM(mr.member_id))
        ORDER BY CASE WHEN go.status = 'active' THEN 0 ELSE 1 END, go.id DESC
        LIMIT 1
      ) go ON true
      LEFT JOIN sub_groups sg ON mr.jumuiya_id::text = sg.group_id::text
      LEFT JOIN sub_groups msg ON (
        m.jumuiya_id::text = msg.group_id::text 
        OR LOWER(m.jumuiya_id::text) = LOWER(msg.slug) 
        OR LOWER(m.jumuiya_id::text) = LOWER(msg.name)
      )
      LEFT JOIN members ab ON LOWER(TRIM(mr.assigned_by)) = LOWER(TRIM(ab.member_id))
      LEFT JOIN members apb ON LOWER(TRIM(mr.approved_by)) = LOWER(TRIM(apb.member_id))
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      params.push(status.trim().toLowerCase());
      query += ` AND LOWER(mr.status) = $${params.length}`;
    }
    if (jumuiya_id) {
      params.push(jumuiya_id);
      query += ` AND mr.jumuiya_id = $${params.length}`;
    }
    query += " ORDER BY mr.created_at DESC";

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error("listAssignments error:", error.message);
    res.status(500).json({ success: false, message: "Failed to list assignments" });
  }
};

export const assignRole = async (req, res) => {
  if (!rejectIfNotAdmin(req, res)) return;
  try {
    const { member_id, role_id, jumuiya_id } = req.body;
    const assignedBy = req.user?.member_id;

    if (!member_id || !role_id) {
      return res.status(400).json({ success: false, message: "member_id and role_id are required" });
    }

    // Verify member exists
    const member = await pool.query("SELECT member_id, jumuiya_id FROM members WHERE member_id = $1", [member_id]);
    if (member.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    // Verify role exists
    const role = await pool.query("SELECT role_id, role_name FROM roles WHERE role_id = $1 AND status = 'active'", [role_id]);
    if (role.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    const roleName = role.rows[0].role_name;

    // One-role rule: a CSA executive holds exactly one system role
    const exclusivity = await checkExecutiveExclusivity(member_id, roleName);
    if (exclusivity) {
      return res.status(409).json({ success: false, message: exclusivity.message });
    }

    // If jumuiya-scoped role and no jumuiya_id provided, derive from member
    const effectiveJumuiyaId = jumuiya_id || (roleName.includes("jumuiya") ? member.rows[0].jumuiya_id : null);

    // Check if there's already an approved assignment for this member+role+scope
    const existingApproved = await pool.query(
      `SELECT id FROM member_roles
       WHERE member_id = $1 AND role_id = $2
         AND COALESCE(jumuiya_id, '00000000-0000-0000-0000-000000000000')
             = COALESCE($3, '00000000-0000-0000-0000-000000000000')
         AND status = 'approved'`,
      [member_id, role_id, effectiveJumuiyaId]
    );
    if (existingApproved.rows.length > 0) {
      return res.status(409).json({ success: false, message: "Member already has this role assigned" });
    }

    // If there's a pending assignment, update it instead of creating new
    const existingPending = await pool.query(
      `SELECT id FROM member_roles
       WHERE member_id = $1 AND role_id = $2
         AND COALESCE(jumuiya_id, '00000000-0000-0000-0000-000000000000')
             = COALESCE($3, '00000000-0000-0000-0000-000000000000')
         AND status = 'pending'`,
      [member_id, role_id, effectiveJumuiyaId]
    );

    // csa_chair is auto-approved for immediate access
    const status = roleName === "csa_chair" ? "approved" : "pending";

    let result;
    if (existingPending.rows.length > 0) {
      result = await pool.query(
        `UPDATE member_roles SET assigned_by = $1, status = $2, created_at = NOW(), updated_at = NOW()
          WHERE id = $3 RETURNING id`,
        [assignedBy, status, existingPending.rows[0].id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO member_roles (member_id, role_id, assigned_by, jumuiya_id, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [member_id, role_id, assignedBy, effectiveJumuiyaId, status]
      );
    }

    const msg = status === "approved" ? "Role assigned and active." : "Role assigned. Pending approval.";
    res.status(201).json({
      success: true,
      data: { id: result.rows[0].id, status },
      message: msg
    });
  } catch (error) {
    logger.error("assignRole error:", error.message);
    if (error.code === "23505") {
      return res.status(409).json({ success: false, message: "Role assignment already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to assign role" });
  }
};

export const approveAssignment = async (req, res) => {
  if (!rejectIfNotAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const approvedBy = req.user?.member_id;

    const assignment = await pool.query(
      "SELECT id, status FROM member_roles WHERE id = $1",
      [id]
    );
    if (assignment.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }
    if (assignment.rows[0].status !== "pending") {
      return res.status(400).json({ success: false, message: `Assignment is already ${assignment.rows[0].status}` });
    }

    // One-role rule for CSA executives, enforced on approval
    const roleRow = await pool.query(
      `SELECT mr.member_id, r.role_name FROM member_roles mr
       JOIN roles r ON mr.role_id = r.role_id
       WHERE mr.id = $1`,
      [id]
    );
    if (roleRow.rows.length > 0) {
      const exclusivity = await checkExecutiveExclusivity(roleRow.rows[0].member_id, roleRow.rows[0].role_name);
      if (exclusivity) {
        return res.status(409).json({
          success: false,
          message: `Cannot approve — ${exclusivity.message}`
        });
      }
    }

    await pool.query(
      `UPDATE member_roles SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [approvedBy, id]
    );

    res.json({ success: true, message: "Role approved" });
  } catch (error) {
    logger.error("approveAssignment error:", error.message);
    res.status(500).json({ success: false, message: "Failed to approve assignment" });
  }
};

export const rejectAssignment = async (req, res) => {
  if (!rejectIfNotAdmin(req, res)) return;
  try {
    const { id } = req.params;

    const assignment = await pool.query(
      "SELECT id, status FROM member_roles WHERE id = $1",
      [id]
    );
    if (assignment.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }
    if (assignment.rows[0].status !== "pending") {
      return res.status(400).json({ success: false, message: `Assignment is already ${assignment.rows[0].status}` });
    }

    await pool.query(
      "UPDATE member_roles SET status = 'rejected', updated_at = NOW() WHERE id = $1",
      [id]
    );

    res.json({ success: true, message: "Role rejected" });
  } catch (error) {
    logger.error("rejectAssignment error:", error.message);
    res.status(500).json({ success: false, message: "Failed to reject assignment" });
  }
};

export const revokeAssignment = async (req, res) => {
  if (!rejectIfNotAdmin(req, res)) return;
  try {
    const { id } = req.params;

    const assignment = await pool.query(
      "SELECT id, status FROM member_roles WHERE id = $1",
      [id]
    );
    if (assignment.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }
    if (assignment.rows[0].status !== "approved") {
      return res.status(400).json({ success: false, message: `Cannot revoke — assignment is ${assignment.rows[0].status}` });
    }

    await pool.query(
      "UPDATE member_roles SET status = 'revoked', updated_at = NOW() WHERE id = $1",
      [id]
    );

    res.json({ success: true, message: "Access revoked" });
  } catch (error) {
    logger.error("revokeAssignment error:", error.message);
    res.status(500).json({ success: false, message: "Failed to revoke assignment" });
  }
};

export const activateAssignment = async (req, res) => {
  if (!rejectIfNotAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const approvedBy = req.user?.member_id;

    const assignment = await pool.query(
      "SELECT id, status FROM member_roles WHERE id = $1",
      [id]
    );
    if (assignment.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }
    if (assignment.rows[0].status !== "revoked") {
      return res.status(400).json({ success: false, message: `Cannot activate — assignment is ${assignment.rows[0].status}` });
    }

    // One-role rule for CSA executives, enforced on reactivation
    const roleRow = await pool.query(
      `SELECT mr.member_id, r.role_name FROM member_roles mr
       JOIN roles r ON mr.role_id = r.role_id
       WHERE mr.id = $1`,
      [id]
    );
    if (roleRow.rows.length > 0) {
      const exclusivity = await checkExecutiveExclusivity(roleRow.rows[0].member_id, roleRow.rows[0].role_name);
      if (exclusivity) {
        return res.status(409).json({
          success: false,
          message: `Cannot reactivate — ${exclusivity.message}`
        });
      }
    }

    await pool.query(
      `UPDATE member_roles SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [approvedBy, id]
    );

    res.json({ success: true, message: "Role reactivated" });
  } catch (error) {
    logger.error("activateAssignment error:", error.message);
    res.status(500).json({ success: false, message: "Failed to activate assignment" });
  }
};

export const removeAssignment = async (req, res) => {
  if (!rejectIfNotAdmin(req, res)) return;
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM member_roles WHERE id = $1", [id]);
    res.json({ success: true, message: "Assignment removed" });
  } catch (error) {
    logger.error("removeAssignment error:", error.message);
    res.status(500).json({ success: false, message: "Failed to remove assignment" });
  }
};
