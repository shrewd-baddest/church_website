import { db } from "../Configs/dbConfig.js";
import { sendMail, isConfigured } from "../Configs/emailConfig.js";
import logger from "../logger/winston.js";

// Public: submit a community enrollment
export const createEnrollment = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { fullName, name, phone, email, gender, course, yearOfStudy, voiceType, wantsMusicClass } = req.body;

    const displayName = fullName || name;
    if (!displayName || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }

    const phoneClean = phone.replace(/\s+/g, '').trim();

    // If logged-in user, get their member_id and phone from the members table
    let memberId = req.body.memberId || req.body.regNumber || req.body.reg_number || null;
    let userPhone = phoneClean;
    if (req.user?.id || req.user?.member_id) {
      const mid = req.user.id || req.user.member_id;
      const memberRes = await db.query(
        `SELECT member_id, phone, first_name, last_name, email FROM members WHERE member_id = $1`,
        [mid]
      );
      if (memberRes.rows.length > 0) {
        const m = memberRes.rows[0];
        memberId = m.member_id;
        // Use the member's actual phone if available, otherwise use what they typed
        if (m.phone) {
          userPhone = m.phone.replace(/\s+/g, '').trim();
        }
      }
    }

    // If still no memberId (e.g. public enrollment form), attempt to auto-match against existing members
    if (!memberId) {
      try {
        const matchRes = await db.query(
          `SELECT member_id FROM members
           WHERE (phone IS NOT NULL AND phone != '' AND RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 9) = RIGHT(REGEXP_REPLACE($1, '[^0-9]', '', 'g'), 9))
              OR ($2 != '' AND email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(TRIM($2)))
              OR ($3 != '' AND (
                   LOWER(TRIM(CONCAT(first_name, ' ', last_name))) = LOWER(TRIM($3))
                   OR LOWER(TRIM(CONCAT(last_name, ' ', first_name))) = LOWER(TRIM($3))
                 ))
           ORDER BY 
             CASE WHEN phone IS NOT NULL AND phone != '' AND RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 9) = RIGHT(REGEXP_REPLACE($1, '[^0-9]', '', 'g'), 9) THEN 1
                  WHEN $2 != '' AND email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(TRIM($2)) THEN 2
                  ELSE 3 END
           LIMIT 1`,
          [userPhone, email || '', displayName.trim()]
        );
        if (matchRes.rows.length > 0) {
          memberId = matchRes.rows[0].member_id;
        }
      } catch (matchErr) {
        logger.warn("Auto-match member_id failed:", matchErr.message);
      }
    }

    const existing = await db.query(
      `SELECT id, status FROM enrollments WHERE module_id = $1 AND phone = $2`,
      [moduleId, userPhone]
    );
    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      return res.status(409).json({
        error: `You have already enrolled in this community`,
        status: row.status,
        enrollmentId: row.id,
      });
    }

    const baseParams = [moduleId, displayName.trim(), userPhone, email || '', gender || null, course || null, yearOfStudy || null, voiceType || null];
    let result;
    try {
      result = await db.query(
        `INSERT INTO enrollments (module_id, full_name, phone, email, gender, course, year_of_study, voice_type, wants_music_class, member_id, status, joined_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending', NOW())
         RETURNING *`,
        [...baseParams, wantsMusicClass === true, memberId]
      );
    } catch (insertErr) {
      // Self-heal: if the wants_music_class column is missing (migration not
      // applied yet), fall back to the legacy insert so members aren't blocked.
      if (insertErr?.code === '42703') {
        logger.warn("createEnrollment: wants_music_class column missing — falling back to legacy insert");
        result = await db.query(
          `INSERT INTO enrollments (module_id, full_name, phone, email, gender, course, year_of_study, voice_type, member_id, status, joined_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending', NOW())
           RETURNING *`,
          [...baseParams, memberId]
        );
      } else {
        throw insertErr;
      }
    }

    logger.info(`New enrollment: ${displayName} -> ${moduleId} (member_id: ${memberId || 'none'})`);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    // Winston printf only prints info.message — second arg is silently dropped
    const detail = {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint,
      stack: error?.stack ? String(error.stack).split("\n").slice(0, 5) : undefined,
    };
    logger.error(`createEnrollment error: ${JSON.stringify(detail)}`);
    // Also return the detail in dev so frontend can surface it
    return res.status(500).json({ error: "Failed to submit enrollment", detail: process.env.NODE_ENV !== "production" ? detail : undefined });
  }
};

// Public: check if phone already enrolled
export const checkDuplicate = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { phone } = req.query;
    if (!phone) return res.json({ exists: false });

    const phoneClean = phone.replace(/\s+/g, '').trim();
    const result = await db.query(
      `SELECT id, status, full_name FROM enrollments WHERE module_id = $1 AND phone = $2`,
      [moduleId, phoneClean]
    );

    return res.json({
      exists: result.rows.length > 0,
      enrollment: result.rows[0] || null,
    });
  } catch (error) {
    logger.error("checkDuplicate error:", error.message);
    return res.status(500).json({ error: "Check failed" });
  }
};

// Admin: get all enrollments for a module with stats
export const getModuleEnrollments = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { status, search } = req.query;

    let query = `
      SELECT e.*,
             COALESCE(
               NULLIF(TRIM(e.member_id), ''),
               m_id.member_id,
               m_phone.member_id,
               m_email.member_id,
               m_name.member_id
             ) AS resolved_reg_no
      FROM enrollments e
      LEFT JOIN members m_id ON (
        e.member_id IS NOT NULL AND e.member_id != '' AND m_id.member_id = e.member_id
      )
      LEFT JOIN members m_phone ON (
        e.phone IS NOT NULL AND e.phone != '' AND m_phone.phone IS NOT NULL AND
        RIGHT(REGEXP_REPLACE(e.phone, '[^0-9]', '', 'g'), 9) = RIGHT(REGEXP_REPLACE(m_phone.phone, '[^0-9]', '', 'g'), 9)
      )
      LEFT JOIN members m_email ON (
        e.email IS NOT NULL AND e.email != '' AND m_email.email IS NOT NULL AND
        LOWER(TRIM(e.email)) = LOWER(TRIM(m_email.email))
      )
      LEFT JOIN members m_name ON (
        e.full_name IS NOT NULL AND e.full_name != '' AND (
          LOWER(TRIM(e.full_name)) = LOWER(TRIM(CONCAT(m_name.first_name, ' ', m_name.last_name)))
          OR LOWER(TRIM(e.full_name)) = LOWER(TRIM(CONCAT(m_name.last_name, ' ', m_name.first_name)))
        )
      )
      WHERE e.module_id = $1
    `;
    const params = [moduleId];
    let paramIdx = 2;

    if (status && status !== 'all') {
      query += ` AND LOWER(e.status) = LOWER($${paramIdx})`;
      params.push(status);
      paramIdx++;
    }

    if (search) {
      query += ` AND (
        LOWER(e.full_name) LIKE LOWER($${paramIdx})
        OR LOWER(e.phone) LIKE LOWER($${paramIdx})
        OR LOWER(COALESCE(e.email, '')) LIKE LOWER($${paramIdx})
        OR LOWER(COALESCE(e.member_id, '')) LIKE LOWER($${paramIdx})
        OR LOWER(COALESCE(m_phone.member_id, '')) LIKE LOWER($${paramIdx})
      )`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    query += ` ORDER BY e.joined_at DESC NULLS LAST, e.enrolled_at DESC NULLS LAST`;

    const result = await db.query(query, params);

    const stats = await db.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE LOWER(status) = 'approved') as approved,
        COUNT(*) FILTER (WHERE LOWER(status) = 'pending') as pending,
        COUNT(*) FILTER (WHERE LOWER(status) = 'rejected') as rejected
       FROM enrollments WHERE module_id = $1`,
      [moduleId]
    );

    const mappedEnrollments = result.rows.map((row) => {
      const regNo = row.resolved_reg_no || row.member_id || null;
      return {
        ...row,
        member_id: regNo,
        reg_number: regNo,
        regNumber: regNo,
        memberId: regNo,
      };
    });

    return res.json({
      enrollments: mappedEnrollments,
      stats: stats.rows[0],
    });
  } catch (error) {
    logger.error("getModuleEnrollments error:", error.message);
    return res.status(500).json({ error: "Failed to fetch enrollments" });
  }
};

// Admin: update enrollment status
export const updateEnrollmentStatus = async (req, res) => {
  try {
    const { moduleId, id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await db.query(
      `UPDATE enrollments SET status = $1, rejection_reason = $2, joined_at = CASE WHEN $1 = 'Approved' THEN NOW() ELSE joined_at END WHERE id = $3 AND module_id = $4 RETURNING *`,
      [status, rejectionReason || null, id, moduleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const enrollment = result.rows[0];

    // Send email notification to the member if email is available
    if (enrollment.email && isConfigured()) {
      try {
        // Look up the community/module name
        const moduleResult = await db.query(
          `SELECT title FROM hub_modules WHERE id = $1`,
          [moduleId]
        );
        const moduleName = moduleResult.rows[0]?.title || moduleId;

        const subject = status === 'Approved'
          ? `🎉 Your ${moduleName} Application Has Been Approved!`
          : `📋 Update on Your ${moduleName} Application`;

        const html = status === 'Approved'
          ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🎉 Application Approved!</h1>
              </div>
              <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="font-size: 16px; color: #334155;">Dear <strong>${enrollment.full_name}</strong>,</p>
                <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                  We are pleased to inform you that your application to join <strong>${moduleName}</strong> has been <span style="color: #059669; font-weight: bold;">approved</span>!
                </p>
                <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                  Welcome to the community! You are now an official member. Please reach out to your community leaders for next steps, meeting schedules, and how to get involved.
                </p>
                <div style="background: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Status:</strong> <span style="color: #059669;">Approved</span></p>
                  <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;"><strong>Community:</strong> ${moduleName}</p>
                </div>
                <p style="font-size: 14px; color: #94a3b8; margin-top: 30px; text-align: center;">
                  God bless you — CSA Kirinyaga
                </p>
              </div>
            </div>
          `
          : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">📋 Application Update</h1>
              </div>
              <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="font-size: 16px; color: #334155;">Dear <strong>${enrollment.full_name}</strong>,</p>
                <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                  Thank you for your interest in joining <strong>${moduleName}</strong>. After careful review, we regret to inform you that your application has been <span style="color: #dc2626; font-weight: bold;">not approved</span> at this time.
                </p>
                ${rejectionReason ? `
                <div style="background: white; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Reason:</strong></p>
                  <p style="margin: 5px 0 0; font-size: 14px; color: #475569;">${rejectionReason}</p>
                </div>
                ` : ''}
                <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                  If you believe this was an error or would like to reapply, please contact the community admin or try again later.
                </p>
                <p style="font-size: 14px; color: #94a3b8; margin-top: 30px; text-align: center;">
                  God bless you — CSA Kirinyaga
                </p>
              </div>
            </div>
          `;

        const text = status === 'Approved'
          ? `Dear ${enrollment.full_name}, your application to join ${moduleName} has been approved! Welcome to the community.`
          : `Dear ${enrollment.full_name}, your application to join ${moduleName} has not been approved.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`;

        // Fire-and-forget: don't block the response if email fails
        sendMail({ to: enrollment.email, subject, html, text }).catch((err) => {
          logger.error("Failed to send enrollment status email:", err.message);
        });
      } catch (emailErr) {
        logger.error("Error preparing enrollment email:", emailErr.message);
      }
    }

    return res.json(enrollment);
  } catch (error) {
    logger.error("updateEnrollmentStatus error:", error.message);
    return res.status(500).json({ error: "Failed to update status" });
  }
};

// Admin: delete enrollment
export const deleteEnrollment = async (req, res) => {
  try {
    const { moduleId, id } = req.params;
    const result = await db.query(
      `DELETE FROM enrollments WHERE id = $1 AND module_id = $2 RETURNING id`,
      [id, moduleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    return res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    logger.error("deleteEnrollment error:", error.message);
    return res.status(500).json({ error: "Failed to delete enrollment" });
  }
};

// Auth: withdraw (delete) your own rejected enrollment so you can re-apply
export const withdrawEnrollment = async (req, res) => {
  try {
    const { moduleId, id } = req.params;
    const userId = req.user?.id || req.user?.member_id;
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    // Look up phone from members table
    const memberRes = await db.query(
      `SELECT phone FROM members WHERE member_id = $1`,
      [userId]
    );
    const phone = memberRes.rows[0]?.phone;
    if (!phone) return res.status(400).json({ error: "No phone on file" });

    const phoneClean = phone.replace(/\s+/g, '').trim();
    const result = await db.query(
      `DELETE FROM enrollments WHERE id = $1 AND module_id = $2 AND phone = $3 AND LOWER(status) = 'rejected' RETURNING id`,
      [id, moduleId, phoneClean]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No rejected enrollment found to withdraw" });
    }

    logger.info(`Enrollment withdrawn: id=${id} module=${moduleId} phone=${phoneClean}`);
    return res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    logger.error(`withdrawEnrollment error: ${error.message}`);
    return res.status(500).json({ error: "Failed to withdraw enrollment" });
  }
};

// Auth: get communities the logged-in user has joined
// Matches by member_id first, then falls back to phone lookup from members table
export const getMyCommunities = async (req, res) => {
  try {
    const memberId = req.user?.member_id || req.user?.id;
    if (!memberId) {
      return res.json({ communities: [] });
    }

    // Primary match: by member_id
    const byMemberId = await db.query(
      `SELECT e.*, m.title as module_title, m.theme_color, m.icon_class
       FROM enrollments e
       JOIN hub_modules m ON e.module_id = m.id
       WHERE e.member_id = $1
       ORDER BY e.joined_at DESC NULLS LAST, e.enrolled_at DESC`,
      [memberId]
    );

    if (byMemberId.rows.length > 0) {
      return res.json({ communities: byMemberId.rows });
    }

    // Fallback: look up member's phone from the members table, match by phone
    const memberRes = await db.query(
      `SELECT phone FROM members WHERE member_id = $1`,
      [memberId]
    );
    const phone = memberRes.rows[0]?.phone;
    if (!phone) {
      return res.json({ communities: [] });
    }

    const phoneClean = phone.replace(/\s+/g, '').trim();
    const byPhone = await db.query(
      `SELECT e.*, m.title as module_title, m.theme_color, m.icon_class
       FROM enrollments e
       JOIN hub_modules m ON e.module_id = m.id
       WHERE e.phone = $1
       ORDER BY e.joined_at DESC NULLS LAST, e.enrolled_at DESC`,
      [phoneClean]
    );

    // Backfill member_id on any phone-matched records for future lookups
    if (byPhone.rows.length > 0) {
      await db.query(
        `UPDATE enrollments SET member_id = $1 WHERE member_id IS NULL AND phone = $2`,
        [memberId, phoneClean]
      ).catch(err => logger.warn("member_id backfill failed:", err.message));
    }

    return res.json({ communities: byPhone.rows });
  } catch (error) {
    logger.error("getMyCommunities error:", error.message);
    return res.status(500).json({ error: "Failed to fetch communities" });
  }
};

/**
 * Admin: members who opted into music classes on the choir join form.
 * Returns only name + phone (nothing more), any enrollment status.
 */
export const getMusicClassSignups = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const result = await db.query(
      `SELECT full_name, phone
       FROM enrollments
       WHERE module_id = $1 AND wants_music_class = TRUE
       ORDER BY joined_at DESC`,
      [moduleId]
    );
    return res.json({ status: "success", data: result.rows });
  } catch (error) {
    logger.error("getMusicClassSignups error:", error.message);
    return res.status(500).json({ error: "Failed to fetch music class signups" });
  }
};
