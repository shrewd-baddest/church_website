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
  try {
    const result = await pool.query(
      `SELECT s.*, m.first_name, m.last_name, sg.name as jumuiya_name, m.phone
       FROM suggestions s
       LEFT JOIN members m ON m.member_id = s.member_id
       LEFT JOIN sub_groups sg ON sg.group_id = m.jumuiya_id
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

/* ── Reveal Author (VC checks after approval) ───────────────────── */

/* ── Delete Suggestion ──────────────────────────────────────────── */

export const deleteSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM suggestions WHERE id = $1", [id]);
    res.json({ status: "success", message: "Suggestion deleted" });
  } catch (error) {
    logger.error("deleteSuggestion error:", error.message);
    res.status(500).json({ status: false, message: error.message });
  }
};

export const revealAuthor = async (req, res) => {
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
