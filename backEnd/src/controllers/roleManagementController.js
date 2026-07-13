import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

/** Roles that are allowed to manage role assignments */
const ADMIN_ROLES = ["supreme_admin", "admin", "csa_chair", "csa_secretary"];

/**
 * Returns a 403 response if the requesting user does not hold
 * at least one administrative role. Returns null on success.
 */
const rejectIfNotAdmin = (req, res) => {
  const userRoles = req.user?.role;
  const normalized = (Array.isArray(userRoles) ? userRoles : [userRoles])
    .map((r) => String(r).toLowerCase().trim());
  const hasAccess = normalized.some((r) => ADMIN_ROLES.includes(r));
  if (!hasAccess) {
    res.status(403).json({
      success: false,
      message: "Access denied: administrative role required",
    });
    return false;
  }
  return true;
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
    const { status, jumuiya_id } = req.query;
    let query = `
      SELECT mr.id, mr.member_id, mr.role_id, mr.status, mr.assigned_by, mr.approved_by,
             mr.approved_at, mr.jumuiya_id, mr.created_at,
             r.role_name, r.description as role_description,
             m.first_name, m.last_name,
             sg.name as jumuiya_name,
             ab.first_name as assigned_by_first, ab.last_name as assigned_by_last,
             apb.first_name as approved_by_first, apb.last_name as approved_by_last
      FROM member_roles mr
      JOIN roles r ON mr.role_id = r.role_id
      JOIN members m ON mr.member_id = m.member_id
      LEFT JOIN sub_groups sg ON mr.jumuiya_id = sg.group_id
      LEFT JOIN members ab ON mr.assigned_by = ab.member_id
      LEFT JOIN members apb ON mr.approved_by = apb.member_id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      params.push(status);
      query += ` AND mr.status = $${params.length}`;
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

    // If jumuiya-scoped role and no jumuiya_id provided, derive from member
    const roleName = role.rows[0].role_name;
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

    let result;
    if (existingPending.rows.length > 0) {
      result = await pool.query(
        `UPDATE member_roles SET assigned_by = $1, created_at = NOW(), updated_at = NOW()
          WHERE id = $2 RETURNING id`,
        [assignedBy, existingPending.rows[0].id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO member_roles (member_id, role_id, assigned_by, jumuiya_id, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING id`,
        [member_id, role_id, assignedBy, effectiveJumuiyaId]
      );
    }

    res.status(201).json({
      success: true,
      data: { id: result.rows[0].id, status: "pending" },
      message: "Role assigned. Pending approval."
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
