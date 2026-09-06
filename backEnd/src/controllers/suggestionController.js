import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";
import crypto from "crypto";
import { sendMail } from "../Configs/emailConfig.js";

// Secret per-role unmask tokens must never leave the server in API responses.
const SUGGESTION_TOKEN_COLUMNS = [
  "chair_unmask_token",
  "liturgist_unmask_token",
  "jumuiya_chair_token",
  "jumuiya_secretary_token",
];

const sanitizeSuggestion = (row) => {
  if (!row) return row;
  const safe = { ...row };
  for (const col of SUGGESTION_TOKEN_COLUMNS) delete safe[col];
  return safe;
};

// Explicit column list — never `SELECT s.*` — so the per-role unmask tokens and
// raw user_id never leak into responses. member identity fields stay gated on
// the author having signed with a name or the request being fully approved.
const SUGGESTION_WITH_MEMBER = `
  SELECT
    s.id, s.suggestion, s.category, s.scope, s.jumuiya_id, s.status,
    s.name, s.email, s.reply, s.replied_by, s.replied_at,
    s.created_at, s.deleted_at,
    COALESCE(NULLIF(TRIM(CONCAT(dm.first_name, ' ', dm.last_name)), ''), s.deleted_by) AS deleted_by,
    s.unmask_requested_at,
    CASE WHEN s.name IS NOT NULL OR s.status = 'approved' THEN s.user_id END AS user_id,
    CASE WHEN s.name IS NOT NULL OR s.status = 'approved' THEN m.first_name END AS member_first_name,
    CASE WHEN s.name IS NOT NULL OR s.status = 'approved' THEN m.last_name END AS member_last_name,
    CASE WHEN s.name IS NOT NULL OR s.status = 'approved' THEN m.year_of_study END AS member_year_of_study,
    CASE WHEN s.name IS NOT NULL OR s.status = 'approved' THEN sg.name END AS member_jumuiya
  FROM suggestions s
  LEFT JOIN members m ON s.user_id = m.member_id
  LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
  LEFT JOIN members dm ON LOWER(TRIM(s.deleted_by)) = LOWER(TRIM(dm.member_id))
`;

const getUserRoles = (req) => {
  if (!req.user) return [];
  return Array.isArray(req.user.role)
    ? req.user.role
    : req.user.role ? [req.user.role] : [];
};

// Community (hub module) official roles → the jumuiya_id value that member
// suggestions from that community page are stored under (scope 'community').
const COMMUNITY_ROLE_SCOPES = {
  choir_chairperson: 'choir',
  choir_secretary: 'choir',
  choir_project_coordinator: 'choir',
  dance_chair: 'dancers',
  charismatic_chair: 'charismatic',
  st_francis_chair: 'st-francis',
  mentorship_chair: 'mentorship',
};

const GLOBAL_SUGGESTION_ROLES = ['admin', 'csa_chair', 'csa_vice_chair', 'csa_secretary', 'jumuiya_coordinator'];

const COMMUNITY_OFFICIAL_ROLES = Object.keys(COMMUNITY_ROLE_SCOPES);

// Returns { isGlobal, scopedIds } — scopedIds are jumuiya_id values this
// official may access (their own jumuiya plus any community module they lead).
const getSuggestionAccess = (req) => {
  const roles = getUserRoles(req);
  const isGlobal = roles.some(r => GLOBAL_SUGGESTION_ROLES.includes(r));
  const scopedIds = new Set();
  if (!isGlobal) {
    if (req.user?.jumuiya_id) scopedIds.add(String(req.user.jumuiya_id));
    for (const r of roles) {
      if (COMMUNITY_ROLE_SCOPES[r]) scopedIds.add(COMMUNITY_ROLE_SCOPES[r]);
    }
  }
  return { isGlobal, scopedIds: [...scopedIds] };
};

// Builds "(s.jumuiya_id = $n OR s.jumuiya_id IN (...))" for each scoped id.
const buildScopeClause = (scopedIds, startIndex) => {
  const clauses = scopedIds.map((_, i) => {
    const p = startIndex + i;
    return `(s.jumuiya_id = $${p} OR s.jumuiya_id IN (SELECT slug FROM sub_groups WHERE group_id::text = $${p}))`;
  });
  return { clause: `(${clauses.join(' OR ')})`, params: scopedIds };
};

export const listSuggestions = async (req, res) => {
  try {
    const { isGlobal, scopedIds } = getSuggestionAccess(req);
    const { jumuiya_id } = req.query;
    const roles = getUserRoles(req);
    const isCSAViceChairOnly = roles.includes('csa_vice_chair') && !roles.includes('csa_chair') && !roles.includes('admin') && !roles.includes('developer');

    let whereClause = `WHERE s.deleted_at IS NULL`;
    let params = [];

    if (isCSAViceChairOnly || jumuiya_id === 'csa') {
      whereClause += ` AND s.scope = 'csa'`;
    } else if (!isGlobal) {
      if (scopedIds.length === 0) {
        return res.json({ status: "success", data: [] });
      }
      const scope = buildScopeClause(scopedIds, params.length + 1);
      whereClause += ` AND ${scope.clause}`;
      params = [...params, ...scope.params];
    } else if (jumuiya_id && jumuiya_id !== 'all') {
      const scope = buildScopeClause([jumuiya_id], params.length + 1);
      whereClause += ` AND ${scope.clause}`;
      params = [...params, ...scope.params];
    }

    const result = await pool.query(
      `${SUGGESTION_WITH_MEMBER} ${whereClause} ORDER BY s.created_at DESC`,
      params
    );
    res.json({ status: "success", data: result.rows });
  } catch (error) {
    logger.error("listSuggestions error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getBin = async (req, res) => {
  try {
    const { isGlobal, scopedIds } = getSuggestionAccess(req);
    const { jumuiya_id } = req.query;
    const roles = getUserRoles(req);
    const isCSAViceChairOnly = roles.includes('csa_vice_chair') && !roles.includes('csa_chair') && !roles.includes('admin') && !roles.includes('developer');

    let whereClause = `WHERE s.deleted_at IS NOT NULL`;
    let params = [];

    if (isCSAViceChairOnly || jumuiya_id === 'csa') {
      whereClause += ` AND s.scope = 'csa'`;
    } else if (!isGlobal) {
      if (scopedIds.length === 0) {
        return res.json({ status: "success", data: [] });
      }
      const scope = buildScopeClause(scopedIds, params.length + 1);
      whereClause += ` AND ${scope.clause}`;
      params = [...params, ...scope.params];
    } else if (jumuiya_id && jumuiya_id !== 'all') {
      const scope = buildScopeClause([jumuiya_id], params.length + 1);
      whereClause += ` AND ${scope.clause}`;
      params = [...params, ...scope.params];
    }

    const result = await pool.query(
      `${SUGGESTION_WITH_MEMBER} ${whereClause} ORDER BY s.deleted_at DESC`,
      params
    );
    res.json({ status: "success", data: result.rows });
  } catch (error) {
    logger.error("getBin error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const requireVcRole = (req, res) => {
  const roles = getUserRoles(req);
  if (!roles.some(r => [...GLOBAL_SUGGESTION_ROLES, 'csa_vice_chair', 'jumuiya_vice_chairperson', 'jumuiya_chairperson', ...COMMUNITY_OFFICIAL_ROLES].includes(r))) {
    res.status(404).json({ success: false, message: "Resource not found" });
    return false;
  }
  return true;
};

export const softDelete = async (req, res) => {
  if (!requireVcRole(req, res)) return;
  try {
    const { id } = req.params;
    const { isGlobal, scopedIds } = getSuggestionAccess(req);
    const roles = getUserRoles(req);
    const isDevOrAdmin = roles.some(r => ['admin', 'developer'].includes(r));
    const isCSAViceChair = roles.includes('csa_vice_chair');
    const isJumuiyaViceChair = roles.includes('jumuiya_vice_chairperson');

    // Fetch the target suggestion first to verify scope
    const targetCheck = await pool.query(
      `SELECT id, scope, jumuiya_id FROM suggestions WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (!targetCheck.rows.length) {
      return res.status(404).json({ error: "Suggestion not found or already deleted" });
    }
    const target = targetCheck.rows[0];

    // Only CSA Vice Chairperson (or admin/developer) can soft-delete CSA suggestions
    if (target.scope === 'csa') {
      if (!isCSAViceChair && !isDevOrAdmin) {
        return res.status(403).json({ error: "Only the CSA Vice Chairperson can delete CSA suggestions" });
      }
    } else if (target.scope === 'jumuiya') {
      if (!isJumuiyaViceChair && !isDevOrAdmin && !roles.includes('jumuiya_coordinator')) {
        return res.status(403).json({ error: "Only the Jumuiya Vice Chairperson can delete this suggestion" });
      }
    }

    // Resolve deleter's full name (prefer first_name + last_name over reg_no)
    let deletedByName = "";
    if (req.user?.firstName || req.user?.lastName) {
      deletedByName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
    }
    if (!deletedByName && req.user?.member_id) {
      const mRes = await pool.query(
        `SELECT first_name, last_name FROM members WHERE member_id = $1 OR LOWER(TRIM(member_id)) = LOWER(TRIM($1)) LIMIT 1`,
        [req.user.member_id]
      );
      if (mRes.rows.length) {
        deletedByName = `${mRes.rows[0].first_name || ''} ${mRes.rows[0].last_name || ''}`.trim();
      }
    }
    const deletedBy = deletedByName || req.body?.deleted_by || req.user?.member_id || "Administrator";

    let query = `UPDATE suggestions SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE id = $2 AND deleted_at IS NULL`;
    let params = [deletedBy, id];

    if (!isGlobal && scopedIds.length > 0 && target.scope !== 'csa') {
      const scope = buildScopeClause(scopedIds, params.length + 1);
      query += ` AND ${scope.clause}`;
      params = [...params, ...scope.params];
    }

    query += ` RETURNING *`;
    const result = await pool.query(query, params);

    if (!result.rows.length) {
      return res.status(404).json({ error: "Suggestion not found or already deleted" });
    }

    res.json({ status: "success", data: sanitizeSuggestion(result.rows[0]) });
  } catch (error) {
    logger.error("softDelete error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const restoreFromBin = async (req, res) => {
  if (!requireVcRole(req, res)) return;
  try {
    const { id } = req.params;
    const { isGlobal, scopedIds } = getSuggestionAccess(req);
    const roles = getUserRoles(req);
    const isCSAOfficial = roles.some(r => ['csa_chair', 'csa_vice_chair', 'admin', 'developer'].includes(r));

    let query = `UPDATE suggestions SET deleted_at = NULL, deleted_by = NULL WHERE id = $1 AND deleted_at IS NOT NULL`;
    let params = [id];

    if (isCSAOfficial) {
      query += ` AND scope = 'csa'`;
    } else if (!isGlobal && scopedIds.length > 0) {
      const scope = buildScopeClause(scopedIds, params.length + 1);
      query += ` AND ${scope.clause}`;
      params = [...params, ...scope.params];
    }

    query += ` RETURNING *`;
    const result = await pool.query(query, params);

    if (!result.rows.length) {
      return res.status(404).json({ error: "Suggestion not found in bin or insufficient permissions" });
    }

    res.json({ status: "success", data: sanitizeSuggestion(result.rows[0]) });
  } catch (error) {
    logger.error("restoreFromBin error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const permanentDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const { isGlobal, scopedIds } = getSuggestionAccess(req);
    const roles = getUserRoles(req);
    const isDevOrAdmin = roles.some(r => ['admin', 'developer'].includes(r));
    const isCSAChair = roles.includes('csa_chair');
    const isJumuiyaChair = roles.includes('jumuiya_chairperson');

    // Fetch the target suggestion in bin to check scope
    const targetCheck = await pool.query(
      `SELECT id, scope, jumuiya_id FROM suggestions WHERE id = $1 AND deleted_at IS NOT NULL`,
      [id]
    );
    if (!targetCheck.rows.length) {
      return res.status(404).json({ error: "Suggestion not found in bin" });
    }
    const target = targetCheck.rows[0];

    // Only CSA Chairperson (or admin/developer) can permanently delete CSA suggestions
    if (target.scope === 'csa') {
      if (!isCSAChair && !isDevOrAdmin) {
        return res.status(403).json({ error: "Only the CSA Chairperson can permanently delete CSA suggestions" });
      }
    } else if (target.scope === 'jumuiya') {
      if (!isJumuiyaChair && !isDevOrAdmin) {
        return res.status(403).json({ error: "Only the Jumuiya Chairperson can permanently delete this suggestion" });
      }
    }

    let query = `DELETE FROM suggestions WHERE id = $1 AND deleted_at IS NOT NULL`;
    let params = [id];

    if (!isGlobal && scopedIds.length > 0 && target.scope !== 'csa') {
      const scope = buildScopeClause(scopedIds, params.length + 1);
      query += ` AND ${scope.clause}`;
      params = [...params, ...scope.params];
    }

    query += ` RETURNING *`;
    const result = await pool.query(query, params);

    if (!result.rows.length) {
      return res.status(404).json({ error: "Suggestion not found in bin or insufficient permissions" });
    }

    res.json({ status: "success", message: "Permanently deleted" });
  } catch (error) {
    logger.error("permanentDelete error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const clearBin = async (req, res) => {
  try {
    const { isGlobal, scopedIds } = getSuggestionAccess(req);
    const roles = getUserRoles(req);
    const isDevOrAdmin = roles.some(r => ['admin', 'developer'].includes(r));
    const isCSAChair = roles.includes('csa_chair');
    const isJumuiyaChair = roles.includes('jumuiya_chairperson');
    const { jumuiya_id } = req.query;

    if (jumuiya_id === 'csa' || (!jumuiya_id && !isJumuiyaChair)) {
      if (!isCSAChair && !isDevOrAdmin) {
        return res.status(403).json({ error: "Only the CSA Chairperson can clear the CSA suggestion bin" });
      }
    } else if (jumuiya_id && jumuiya_id !== 'csa') {
      if (!isJumuiyaChair && !isDevOrAdmin) {
        return res.status(403).json({ error: "Only the Jumuiya Chairperson can clear this suggestion bin" });
      }
    }

    let query = `DELETE FROM suggestions WHERE deleted_at IS NOT NULL`;
    let params = [];

    if (jumuiya_id === 'csa') {
      query += ` AND scope = 'csa'`;
    } else if (!isGlobal && scopedIds.length > 0) {
      const scope = buildScopeClause(scopedIds, params.length + 1);
      query += ` AND ${scope.clause}`;
      params = [...params, ...scope.params];
    } else if (jumuiya_id && jumuiya_id !== 'all') {
      const scope = buildScopeClause([jumuiya_id], params.length + 1);
      query += ` AND ${scope.clause}`;
      params = [...params, ...scope.params];
    }

    const result = await pool.query(query, params);
    res.json({ status: "success", message: `Permanently deleted ${result.rowCount} suggestions` });
  } catch (error) {
    logger.error("clearBin error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const buildUnmaskEmailHtml = ({ roleLabel, requesterTitle, targetName, suggestionId, suggestionContent, category, reviewLink }) => {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; padding: 24px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">Suggestion Box — Identity Unmask Request</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #dbeafe;">Official Action Card (${roleLabel})</p>
      </div>
      <div style="padding: 24px;">
        <p style="margin-top: 0; color: #334155; font-size: 15px; line-height: 1.5;">
          A <strong>${requesterTitle}</strong> has requested to reveal the identity of an anonymous suggestion submitted to <strong>${targetName}</strong>.
        </p>

        <div style="background-color: #ffffff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 16px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px;">
            Suggestion Content (Ref #${suggestionId})
          </div>
          <div style="font-size: 15px; color: #1e293b; font-style: italic; line-height: 1.6;">
            "${suggestionContent || "No message content"}"
          </div>
          <div style="margin-top: 12px; font-size: 12px; color: #64748b;">
            Category: <strong>${category || "General"}</strong> • Target: <strong>${targetName}</strong>
          </div>
        </div>

        <p style="color: #475569; font-size: 14px; line-height: 1.5;">
          To protect member privacy, unmasking strictly requires independent dual approval. Please click below to open your decision card and cast your response.
        </p>

        <div style="margin: 28px 0 16px 0; text-align: center;">
          <a href="${reviewLink}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
            Review & Respond to Request
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          This link is unique to your role and valid for single use only.
        </p>
      </div>
    </div>
  `;
};

export const requestUnmask = async (req, res) => {
  if (!requireVcRole(req, res)) return;
  try {
    const { id } = req.params;

    const findResult = await pool.query(
      `SELECT s.*, sg.name as jumuiya_name FROM suggestions s LEFT JOIN sub_groups sg ON sg.group_id::text = s.jumuiya_id OR sg.slug = s.jumuiya_id WHERE s.id = $1`,
      [id]
    );
    if (!findResult.rows.length) {
      return res.status(404).json({ error: "Suggestion not found" });
    }
    const suggestion = findResult.rows[0];
    const isJumuiyaScope = suggestion.scope === 'jumuiya' || (suggestion.jumuiya_id && suggestion.jumuiya_id !== 'csa');

    const token1 = crypto.randomBytes(32).toString("hex");
    const token2 = crypto.randomBytes(32).toString("hex");

    let roleQuery = "";
    let roleMap = {};

    if (isJumuiyaScope) {
      await pool.query(
        `UPDATE suggestions SET jumuiya_chair_token = $1, jumuiya_secretary_token = $2, unmask_requested_at = CURRENT_TIMESTAMP, status = 'unmask_requested' WHERE id = $3`,
        [token1, token2, id]
      );
      roleQuery = `
        SELECT m.member_id, m.first_name, m.last_name, m.email, r.role_name
        FROM members m
        JOIN member_roles mr ON m.member_id = mr.member_id AND mr.status = 'approved'
        JOIN roles r ON mr.role_id = r.role_id
        WHERE r.role_name IN ('jumuiya_chairperson', 'jumuiya_secretary')
          AND (mr.jumuiya_id::text = $1 OR mr.jumuiya_id IN (SELECT group_id FROM sub_groups WHERE slug = $1 OR name = $1))
      `;
      roleMap = {
        'jumuiya_chairperson': { token: token1, roleParam: 'jumuiya_chair', label: 'Jumuiya Chairperson' },
        'jumuiya_secretary': { token: token2, roleParam: 'jumuiya_secretary', label: 'Jumuiya Secretary' },
      };
    } else {
      await pool.query(
        `UPDATE suggestions SET chair_unmask_token = $1, liturgist_unmask_token = $2, unmask_requested_at = CURRENT_TIMESTAMP, status = 'unmask_requested' WHERE id = $3`,
        [token1, token2, id]
      );
      roleQuery = `
        SELECT m.member_id, m.first_name, m.last_name, m.email, r.role_name
        FROM members m
        JOIN member_roles mr ON m.member_id = mr.member_id AND mr.status = 'approved'
        JOIN roles r ON mr.role_id = r.role_id
        WHERE r.role_name IN ('csa_chair', 'liturgist')
      `;
      roleMap = {
        'csa_chair': { token: token1, roleParam: 'chair', label: 'CSA Chairperson' },
        'liturgist': { token: token2, roleParam: 'liturgist', label: 'CSA Liturgist' },
      };
    }

    const queryArgs = isJumuiyaScope ? [suggestion.jumuiya_id] : [];
    const roleResult = await pool.query(roleQuery, queryArgs);

    // Pin the origin to the configured frontend URL instead of trusting the
    // Host header, so a malicious request can never forge email review links.
    const origin = process.env.FRONTEND_URL || 'https://csakyu.com';
    let sent = 0;
    let failed = 0;

    const requesterTitle = isJumuiyaScope ? 'Jumuiya Vice Chairperson' : 'CSA Vice Chairperson';
    const targetName = suggestion.jumuiya_name || suggestion.jumuiya_id || 'CSA';

    for (const row of roleResult.rows) {
      const config = roleMap[row.role_name];
      if (!config) continue;

      const link = `${origin}/suggestions/unmask/${config.roleParam}/${config.token}`;
      const subject = `Unmask Request Card — ${config.label} Approval Required`;

      const html = buildUnmaskEmailHtml({
        roleLabel: config.label,
        requesterTitle,
        targetName,
        suggestionId: suggestion.id,
        suggestionContent: suggestion.suggestion,
        category: suggestion.category,
        reviewLink: link
      });

      const text = `An unmask request has been submitted for suggestion #${suggestion.id}.\nTo review and respond: ${link}`;

      if (row.email) {
        try {
          await sendMail({ to: row.email, subject, text, html });
          sent++;
        } catch (err) {
          failed++;
          logger.error(`Failed to send unmask email to ${row.email} (${config.label}): ${err.message}`);
        }
      }
    }

    const message = failed > 0
      ? `Unmask request card sent to ${sent} official(s), ${failed} failed — check email setup`
      : `Unmask request card sent to ${sent} official(s)`;

    res.json({ status: "success", message });
  } catch (error) {
    logger.error("requestUnmask error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const resolveRoleColumns = (role) => {
  if (role === "chair" || role === "csa_chair") {
    return { tokenCol: "chair_unmask_token", approvedCol: "chair_approved" };
  }
  if (role === "liturgist") {
    return { tokenCol: "liturgist_unmask_token", approvedCol: "liturgist_approved" };
  }
  if (role === "jumuiya_chair") {
    return { tokenCol: "jumuiya_chair_token", approvedCol: "jumuiya_chair_approved" };
  }
  if (role === "jumuiya_secretary") {
    return { tokenCol: "jumuiya_secretary_token", approvedCol: "jumuiya_secretary_approved" };
  }
  return null;
};

export const getRoleUnmaskRequest = async (req, res) => {
  try {
    const { role, token } = req.params;
    const cols = resolveRoleColumns(role);
    if (!cols) {
      return res.status(400).json({ error: "Invalid role parameter" });
    }

    const result = await pool.query(
      `${SUGGESTION_WITH_MEMBER} WHERE s.${cols.tokenCol} = $1`,
      [token]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Invalid or expired token" });
    }

    res.json({ status: "success", role, data: result.rows[0] });
  } catch (error) {
    logger.error("getRoleUnmaskRequest error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const respondRoleUnmask = async (req, res) => {
  try {
    const { role, token } = req.params;
    const { action } = req.body;

    const cols = resolveRoleColumns(role);
    if (!cols) {
      return res.status(400).json({ error: "Invalid role parameter" });
    }
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "action must be 'approve' or 'reject'" });
    }

    if (action === "reject") {
      const result = await pool.query(
        `UPDATE suggestions SET status = 'rejected',
                chair_unmask_token = NULL, liturgist_unmask_token = NULL, chair_approved = FALSE, liturgist_approved = FALSE,
                jumuiya_chair_token = NULL, jumuiya_secretary_token = NULL, jumuiya_chair_approved = FALSE, jumuiya_secretary_approved = FALSE
         WHERE ${cols.tokenCol} = $1 RETURNING *`,
        [token]
      );
      if (!result.rows.length) return res.status(404).json({ error: "Invalid or expired token" });
      return res.json({ status: "success", message: "Unmask request declined. Your decision has been recorded.", data: sanitizeSuggestion(result.rows[0]) });
    }

    const markResult = await pool.query(
      `UPDATE suggestions SET ${cols.approvedCol} = TRUE WHERE ${cols.tokenCol} = $1 RETURNING *`,
      [token]
    );
    if (!markResult.rows.length) return res.status(404).json({ error: "Invalid or expired token" });

    const row = markResult.rows[0];

    const isCsaBoth = row.chair_approved && row.liturgist_approved;
    const isJumBoth = row.jumuiya_chair_approved && row.jumuiya_secretary_approved;

    if (isCsaBoth || isJumBoth) {
      await pool.query(
        `UPDATE suggestions SET status = 'approved',
                chair_unmask_token = NULL, liturgist_unmask_token = NULL,
                jumuiya_chair_token = NULL, jumuiya_secretary_token = NULL
         WHERE id = $1`,
        [row.id]
      );
      const finalResult = await pool.query(
        `${SUGGESTION_WITH_MEMBER} WHERE s.id = $1`,
        [row.id]
      );
      return res.json({ status: "success", message: "Unmask decision recorded.", data: finalResult.rows[0] });
    }

    res.json({ status: "success", message: "Your decision has been recorded.", data: sanitizeSuggestion(row) });
  } catch (error) {
    logger.error("respondRoleUnmask error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Member-facing: the caller's own suggestions with official replies.
// Scoped strictly to user_id from the verified token — a member can never
// read anyone else's suggestions through this endpoint.
export const getMySuggestions = async (req, res) => {
  try {
    const userId = req.user?.member_id;
    if (!userId) {
      return res.json({ status: "success", data: [] });
    }

    const result = await pool.query(
      `${SUGGESTION_WITH_MEMBER} WHERE s.deleted_at IS NULL AND s.user_id = $1 ORDER BY s.created_at DESC LIMIT 50`,
      [userId]
    );

    res.json({ status: "success", data: result.rows.map(sanitizeSuggestion) });
  } catch (error) {
    logger.error("getMySuggestions error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const replyToSuggestion = async (req, res) => {  if (!requireVcRole(req, res)) return;
  try {
    const { id } = req.params;
    const { reply } = req.body;
    const repliedBy = req.user?.member_id || "admin";

    if (!reply || !reply.trim()) {
      return res.status(400).json({ error: "Reply text is required" });
    }

    const result = await pool.query(
      `UPDATE suggestions SET reply = $1, replied_at = CURRENT_TIMESTAMP, replied_by = $2, status = 'replied' WHERE id = $3 AND deleted_at IS NULL RETURNING *`,
      [reply.trim(), repliedBy, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Suggestion not found" });
    }

    res.json({ status: "success", data: sanitizeSuggestion(result.rows[0]) });
  } catch (error) {
    logger.error("replyToSuggestion error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const VALID_CATEGORIES = [
  'general', 'worship', 'progress', 'feedback', 'other',
  'officials', 'jumuiya', 'members', 'ideas', 'requests', 'events',
];

export const updateSuggestionCategory = async (req, res) => {
  if (!requireVcRole(req, res)) return;
  try {
    const { id } = req.params;
    const { category } = req.body;

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const result = await pool.query(
      `UPDATE suggestions SET category = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
      [category, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Suggestion not found" });
    }

    res.json({ status: "success", data: sanitizeSuggestion(result.rows[0]) });
  } catch (error) {
    logger.error("updateSuggestionCategory error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
