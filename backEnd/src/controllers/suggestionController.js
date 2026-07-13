import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";
import crypto from "crypto";
import sendMail from "../Configs/emailConfig.js";

/* ── Helpers ────────────────────────────────────────────────────── */

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const emailHtml = ({ title, message, buttonUrl, buttonText }) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
<tr><td style="background-color:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
<h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1e293b;text-align:center;">${title}</h1>
<p style="margin:0 0 24px;font-size:15px;color:#64748b;text-align:center;line-height:1.6;">${message}</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 16px;">
<a href="${buttonUrl}" style="display:inline-block;background-color:#16a34a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:10px;">${buttonText}</a>
</td></tr></table>
<p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">&mdash; CSA Kirinyaga Chapter</p>
</td></tr></table></td></tr></table></body></html>
`;

/* ── Find member_id by role ─────────────────────────────────────── */

const findMemberIdsByRole = async (roleName) => {
  const result = await pool.query(
    `SELECT mr.member_id FROM member_roles mr
     JOIN roles r ON r.role_id = mr.role_id
     WHERE r.role_name = $1 AND mr.status = 'approved'`,
    [roleName]
  );
  return result.rows.map(r => r.member_id);
};

const findEmailByMemberId = async (memberId) => {
  const result = await pool.query("SELECT email FROM members WHERE member_id = $1", [memberId]);
  return result.rows[0]?.email || null;
};

/* ── Role guard for admin-only endpoints ────────────────────────── */

const SUGGESTION_ADMIN_ROLES = [
  "supreme_admin", "admin", "csa_chair", "csa_vice_chair", "csa_secretary",
  "secretary", "liturgist",
];

const rejectIfNotAdmin = (req, res) => {
  const userRoles = req.user?.role;
  const normalized = (Array.isArray(userRoles) ? userRoles : [userRoles])
    .map((r) => String(r).toLowerCase().trim());
  const hasAccess = normalized.some((r) => SUGGESTION_ADMIN_ROLES.includes(r));
  if (!hasAccess) {
    res.status(403).json({ status: false, message: "Access denied: administrative role required" });
    return false;
  }
  return true;
};

/* ── Submit Suggestion ──────────────────────────────────────────── */

export const submitSuggestion = async (req, res) => {
  try {
    const { suggestion, name, email, is_anonymous } = req.body;
    if (!suggestion || !suggestion.trim()) {
      return res.status(400).json({ status: false, message: "Suggestion text is required" });
    }

    const memberId = req.user?.member_id || null;
    const anonymous = is_anonymous !== false;

    const result = await pool.query(
      `INSERT INTO suggestions (suggestion, name, email, member_id, is_anonymous)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [suggestion.trim(), name || null, email || null, memberId, anonymous]
    );

    res.status(201).json({ status: "success", data: result.rows[0] });
  } catch (error) {
    logger.error("submitSuggestion error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};

/* ── Admin List Suggestions ─────────────────────────────────────── */

export const getSuggestions = async (req, res) => {
  if (!rejectIfNotAdmin(req, res)) return;
  try {
    const result = await pool.query(
      `SELECT s.*, m.first_name, m.last_name, sg.name as jumuiya_name, m.phone
       FROM suggestions s
       LEFT JOIN members m ON m.member_id = s.member_id
       LEFT JOIN sub_groups sg ON sg.group_id = m.jumuiya_id
       WHERE s.deleted_at IS NULL
       ORDER BY s.created_at DESC`
    );

    const data = result.rows.map(r => ({
      id: r.id,
      suggestion: r.suggestion,
      name: r.name,
      email: r.email,
      created_at: r.created_at,
      is_anonymous: r.is_anonymous,
      unmask_status: r.unmask_status,
      status: r.status,
      category: r.category,
      admin_response: r.admin_response,
      responded_at: r.responded_at,
      responded_by: r.responded_by,
      member: r.member_id && !r.is_anonymous ? {
        member_id: r.member_id,
        first_name: r.first_name,
        last_name: r.last_name,
        jumuiya: r.jumuiya_name,
        phone: r.phone,
      } : null,
      unmask_chair_responded: r.unmask_chair_responded,
      unmask_liturgist_responded: r.unmask_liturgist_responded,
      unmask_chair_approved: r.unmask_chair_approved,
      unmask_liturgist_approved: r.unmask_liturgist_approved,
    }));

    res.json({ status: "success", data });
  } catch (error) {
    logger.error("getSuggestions error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};

/* ── Request Unmask (VC) ────────────────────────────────────────── */

export const requestUnmask = async (req, res) => {
  if (!rejectIfNotAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const sugg = await pool.query("SELECT * FROM suggestions WHERE id = $1", [id]);
    if (sugg.rows.length === 0) return res.status(404).json({ status: false, message: "Suggestion not found" });
    if (!sugg.rows[0].is_anonymous) return res.status(400).json({ status: false, message: "Suggestion is not anonymous" });
    if (sugg.rows[0].unmask_status !== 'none') return res.status(400).json({ status: false, message: "Unmask already requested" });

    const chairTokens = crypto.randomBytes(32).toString("hex");
    const liturgistTokens = crypto.randomBytes(32).toString("hex");

    await pool.query(
      `UPDATE suggestions SET unmask_status = 'requested', unmask_requested_at = NOW(),
       unmask_chair_token = $1, unmask_liturgist_token = $2 WHERE id = $3`,
      [chairTokens, liturgistTokens, id]
    );

    // Notify chair and liturgist
    const chairIds = await findMemberIdsByRole("csa_chair");
    const liturgistIds = await findMemberIdsByRole("liturgist");

    const approveUrl = (token) => `${FRONTEND_URL}/suggestions/unmask/${token}`;

    for (const mid of chairIds) {
      const email = await findEmailByMemberId(mid);
      if (email) {
        await sendMail(
          "Unmask Request — Suggestion Review",
          `A VC has requested to unmask an anonymous suggestion. Approve or reject at: ${approveUrl(chairTokens)}`,
          email,
          emailHtml({
            title: "Unmask Request",
            message: "The CSA Vice Chair has requested to view the author of an anonymous suggestion. Please review and decide.",
            buttonUrl: approveUrl(chairTokens),
            buttonText: "Review Request",
          })
        ).catch(e => logger.error("Failed to email chair:", e.message));
      }
    }

    for (const mid of liturgistIds) {
      const email = await findEmailByMemberId(mid);
      if (email) {
        await sendMail(
          "Unmask Request — Suggestion Review",
          `A VC has requested to unmask an anonymous suggestion. Approve or reject at: ${approveUrl(liturgistTokens)}`,
          email,
          emailHtml({
            title: "Unmask Request",
            message: "The CSA Vice Chair has requested to view the author of an anonymous suggestion. Please review and decide.",
            buttonUrl: approveUrl(liturgistTokens),
            buttonText: "Review Request",
          })
        ).catch(e => logger.error("Failed to email liturgist:", e.message));
      }
    }

    res.json({ status: "success", message: "Unmask request sent to CSA Chair and Liturgist" });
  } catch (error) {
    logger.error("requestUnmask error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};

/* ── Unmask Page (load suggestion info for approval) ────────────── */

export const getUnmaskRequest = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await pool.query(
      `SELECT id, suggestion, created_at, unmask_status,
              unmask_chair_responded, unmask_liturgist_responded,
              unmask_chair_approved, unmask_liturgist_approved
       FROM suggestions
       WHERE unmask_chair_token = $1 OR unmask_liturgist_token = $1`,
      [token]
    );
    if (result.rows.length === 0) return res.status(404).json({ status: false, message: "Invalid or expired link" });

    const s = result.rows[0];
    const role = s.unmask_chair_token ? "chair" : "liturgist";
    delete s.unmask_chair_token;
    delete s.unmask_liturgist_token;

    res.json({ status: "success", data: { ...s, role } });
  } catch (error) {
    logger.error("getUnmaskRequest error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};

/* ── Approve / Reject Unmask ────────────────────────────────────── */

export const respondUnmask = async (req, res) => {
  try {
    const { token } = req.params;
    const { action } = req.body; // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ status: false, message: "Invalid action" });

    const sugg = await pool.query(
      `SELECT * FROM suggestions WHERE unmask_chair_token = $1 OR unmask_liturgist_token = $1`,
      [token]
    );
    if (sugg.rows.length === 0) return res.status(404).json({ status: false, message: "Invalid or expired link" });

    const s = sugg.rows[0];
    const isChair = s.unmask_chair_token === token;
    const roleCol = isChair ? 'chair' : 'liturgist';
    const respondedCol = isChair ? 'unmask_chair_responded' : 'unmask_liturgist_responded';
    const approvedCol = isChair ? 'unmask_chair_approved' : 'unmask_liturgist_approved';
    const respondedAtCol = isChair ? 'unmask_chair_responded_at' : 'unmask_liturgist_responded_at';

    if (s[respondedCol]) {
      return res.status(400).json({ status: false, message: "You have already responded to this request" });
    }

    await pool.query(
      `UPDATE suggestions SET ${respondedCol} = true, ${approvedCol} = $1, ${respondedAtCol} = NOW() WHERE id = $2`,
      [action === 'approve', s.id]
    );

    // If both approved, update status to unmasked
    const bothApproved = action === 'approve'
      ? (isChair ? s.unmask_liturgist_approved === true : s.unmask_chair_approved === true)
      : false;

    if (bothApproved) {
      await pool.query(
        `UPDATE suggestions SET unmask_status = 'unmasked' WHERE id = $1`,
        [s.id]
      );
    } else if (action === 'reject') {
      await pool.query(
        `UPDATE suggestions SET unmask_status = 'rejected' WHERE id = $1`,
        [s.id]
      );
    }

    res.json({ status: "success", message: `You have ${action === 'approve' ? 'approved' : 'rejected'} the unmask request.` });
  } catch (error) {
    logger.error("respondUnmask error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};

/* ── Respond to Suggestion ──────────────────────────────────────── */

export const respondToSuggestion = async (req, res) => {
  if (!rejectIfNotAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { response } = req.body;
    if (!response || !response.trim()) {
      return res.status(400).json({ status: false, message: "Response text is required" });
    }

    const sugg = await pool.query("SELECT * FROM suggestions WHERE id = $1", [id]);
    if (sugg.rows.length === 0) return res.status(404).json({ status: false, message: "Suggestion not found" });

    const s = sugg.rows[0];
    const responderName = req.user?.name || "Admin";

    await pool.query(
      `UPDATE suggestions SET admin_response = $1, responded_at = NOW(), responded_by = $2 WHERE id = $3`,
      [response.trim(), responderName, id]
    );

    if (s.member_id) {
      const email = await findEmailByMemberId(s.member_id);
      if (email) {
        const safeName = s.is_anonymous ? "Someone" : (s.name || "A member");
        await sendMail(
          `Response to Your Suggestion — CSA Kirinyaga`,
          `${responderName} responded to your suggestion: "${response.trim()}"`,
          email,
          emailHtml({
            title: "Your Suggestion Received a Response",
            message: `${responderName} wrote: "${response.trim()}"`,
            buttonUrl: FRONTEND_URL,
            buttonText: "View on CSA Website",
          })
        ).catch(e => logger.error("Failed to email suggestion response:", e.message));
      }
    }

    res.json({ status: "success", message: "Response submitted" });
  } catch (error) {
    logger.error("respondToSuggestion error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};

/* ── Update Suggestion Status ───────────────────────────────────── */

export const updateSuggestionStatus = async (req, res) => {
  if (!rejectIfNotAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["new", "under_review", "acknowledged", "implemented", "closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ status: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const sugg = await pool.query("SELECT * FROM suggestions WHERE id = $1", [id]);
    if (sugg.rows.length === 0) return res.status(404).json({ status: false, message: "Suggestion not found" });

    await pool.query("UPDATE suggestions SET status = $1 WHERE id = $2", [status, id]);

    const s = sugg.rows[0];
    if (s.member_id && status !== s.status) {
      const email = await findEmailByMemberId(s.member_id);
      if (email) {
        await sendMail(
          `Suggestion Status Update — CSA Kirinyaga`,
          `Your suggestion status has been updated to: ${status.replace("_", " ")}`,
          email,
          emailHtml({
            title: "Suggestion Status Updated",
            message: `Your suggestion "${s.suggestion.substring(0, 80)}..." is now marked as "${status.replace("_", " ")}".`,
            buttonUrl: FRONTEND_URL,
            buttonText: "View on CSA Website",
          })
        ).catch(e => logger.error("Failed to email status update:", e.message));
      }
    }

    res.json({ status: "success", message: "Status updated" });
  } catch (error) {
    logger.error("updateSuggestionStatus error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};

/* ── Set Suggestion Category ────────────────────────────────────── */

export const setSuggestionCategory = async (req, res) => {
  if (!rejectIfNotAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { category } = req.body;
    const validCategories = ["worship", "facilities", "events", "spiritual_growth", "outreach", "other", null];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ status: false, message: `Invalid category. Must be one of: ${validCategories.filter(Boolean).join(", ")}, or null to clear` });
    }

    const sugg = await pool.query("SELECT * FROM suggestions WHERE id = $1", [id]);
    if (sugg.rows.length === 0) return res.status(404).json({ status: false, message: "Suggestion not found" });

    await pool.query("UPDATE suggestions SET category = $1 WHERE id = $2", [category, id]);
    res.json({ status: "success", message: category ? `Category set to "${category}"` : "Category cleared" });
  } catch (error) {
    logger.error("setSuggestionCategory error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};

/* ── Get Current User's Suggestions ─────────────────────────────── */

export const getMySuggestions = async (req, res) => {
  try {
    const memberId = req.user?.member_id;
    if (!memberId) return res.status(401).json({ status: false, message: "Not authenticated" });

    const result = await pool.query(
      `SELECT id, suggestion, status, category, admin_response, responded_at, responded_by, created_at, is_anonymous, unmask_status
       FROM suggestions WHERE member_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [memberId]
    );

    res.json({ status: "success", data: result.rows });
  } catch (error) {
    logger.error("getMySuggestions error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};

/* ── Reveal Author (VC checks after approval) ───────────────────── */

/* ── Role helpers ────────────────────────────────────────────────── */

const userRoles = (req) => {
  const roles = Array.isArray(req.user?.role) ? req.user.role : req.user?.role ? [req.user.role] : [];
  return roles.map(r => String(r).toUpperCase().trim());
};

const isSuperAdmin = (req) => userRoles(req).some(r => r === "CSA_CHAIR" || r.includes("ADMIN") || r.includes("SUPREME"));
const isVC = (req) => userRoles(req).includes("CSA_VICE_CHAIR");

/* ── Delete Suggestion (soft-delete — moves to CSA Chair's bin) ── */

export const deleteSuggestion = async (req, res) => {
  try {
    if (!isVC(req) && !isSuperAdmin(req)) {
      return res.status(403).json({ status: false, message: "Only VC or Chair can delete suggestions" });
    }

    const { id } = req.params;

    const sugg = await pool.query("SELECT * FROM suggestions WHERE id = $1", [id]);
    if (sugg.rows.length === 0) return res.status(404).json({ status: false, message: "Suggestion not found" });
    if (sugg.rows[0].deleted_at) return res.status(400).json({ status: false, message: "Suggestion is already in the bin" });

    await pool.query(
      "UPDATE suggestions SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2",
      [req.user?.name || "Unknown", id]
    );

    res.json({ status: "success", message: "Suggestion moved to bin (CSA Chair can clear permanently)" });
  } catch (error) {
    logger.error("deleteSuggestion error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};

/* ── Get Bin (CSA Chair only — view soft-deleted suggestions) ──── */

export const getBin = async (req, res) => {
  try {
    if (!isSuperAdmin(req)) return res.status(403).json({ status: false, message: "Only CSA Chair can access the bin" });
    const result = await pool.query(
      `SELECT s.*, m.first_name, m.last_name, sg.name as jumuiya_name, m.phone
       FROM suggestions s
       LEFT JOIN members m ON m.member_id = s.member_id
       LEFT JOIN sub_groups sg ON sg.group_id = m.jumuiya_id
       WHERE s.deleted_at IS NOT NULL
       ORDER BY s.deleted_at DESC`
    );

    const data = result.rows.map(r => ({
      id: r.id,
      suggestion: r.suggestion,
      name: r.name,
      email: r.email,
      created_at: r.created_at,
      is_anonymous: r.is_anonymous,
      unmask_status: r.unmask_status,
      status: r.status,
      category: r.category,
      admin_response: r.admin_response,
      responded_at: r.responded_at,
      responded_by: r.responded_by,
      deleted_at: r.deleted_at,
      deleted_by: r.deleted_by,
      member: r.member_id && !r.is_anonymous ? {
        member_id: r.member_id,
        first_name: r.first_name,
        last_name: r.last_name,
        jumuiya: r.jumuiya_name,
        phone: r.phone,
      } : null,
    }));

    res.json({ status: "success", data });
  } catch (error) {
    logger.error("getBin error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};

/* ── Clear Single from Bin (permanent delete) ──────────────────── */

export const clearBinItem = async (req, res) => {
  try {
    if (!isSuperAdmin(req)) return res.status(403).json({ status: false, message: "Only CSA Chair can clear the bin" });
    const { id } = req.params;
    const result = await pool.query("DELETE FROM suggestions WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ status: false, message: "Item not found in bin" });
    res.json({ status: "success", message: "Permanently deleted from bin" });
  } catch (error) {
    logger.error("clearBinItem error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};

/* ── Clear All from Bin (permanent delete) ─────────────────────── */

export const clearAllBin = async (req, res) => {
  try {
    if (!isSuperAdmin(req)) return res.status(403).json({ status: false, message: "Only CSA Chair can clear the bin" });
    const result = await pool.query("DELETE FROM suggestions WHERE deleted_at IS NOT NULL RETURNING id");
    res.json({ status: "success", message: `Cleared ${result.rowCount} items from bin` });
  } catch (error) {
    logger.error("clearAllBin error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};

export const revealAuthor = async (req, res) => {
  if (!rejectIfNotAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT s.id, s.suggestion, s.is_anonymous, s.unmask_status,
              m.member_id, m.first_name, m.last_name, m.phone, sg.name as jumuiya_name
       FROM suggestions s
       LEFT JOIN members m ON m.member_id = s.member_id
       LEFT JOIN sub_groups sg ON sg.group_id = m.jumuiya_id
       WHERE s.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ status: false, message: "Suggestion not found" });

    const s = result.rows[0];
    if (!s.is_anonymous) {
      return res.json({ status: "success", data: { member_id: s.member_id, first_name: s.first_name, last_name: s.last_name, phone: s.phone, jumuiya: s.jumuiya_name } });
    }
    if (s.unmask_status !== 'unmasked') {
      return res.status(403).json({ status: false, message: "Unmask not yet approved by both officials" });
    }

    res.json({ status: "success", data: { member_id: s.member_id, first_name: s.first_name, last_name: s.last_name, phone: s.phone, jumuiya: s.jumuiya_name } });
  } catch (error) {
    logger.error("revealAuthor error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};
