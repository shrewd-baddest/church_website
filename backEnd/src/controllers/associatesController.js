import { testDb as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

function deriveAdmissionYear(memberId) {
  if (!memberId) return null;
  const match = memberId.match(/(\d{2})\s*$/);
  if (!match) return null;
  return 2000 + parseInt(match[1]);
}

function calcGraduationYear(admissionYear) {
  if (!admissionYear) return null;
  return admissionYear + 4;
}

function getCurrentAcaStart() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const cy = now.getFullYear();
  return month >= 8 ? cy : cy - 1;
}

function getRawYearOfStudy(memberId) {
  const admissionYear = deriveAdmissionYear(memberId);
  if (!admissionYear) return 0;
  return getCurrentAcaStart() - admissionYear + 1;
}

function isGraduated(memberId) {
  return getRawYearOfStudy(memberId) > 4;
}

const slugToJumuiyaName = {
  "st-anthony": "St. Anthony", "st-augustine": "St. Augustine",
  "st-catherine": "St. Catherine", "st-dominic": "St. Dominic",
  "st-elizabeth": "St. Elizabeth", "st-maria-goretti": "St. Maria Goretti",
  "st-monica": "St. Monica",
};

export const getPendingMigrationMembers = async (req, res) => {
  try {
    const { jumuiya_id } = req.query;
    const jumuiyaName = slugToJumuiyaName[jumuiya_id] || jumuiya_id;

    let members = [];

    if (jumuiya_id) {
      const sgResult = await pool.query(
        `SELECT group_id FROM sub_groups WHERE name = $1 OR full_name = $1`, [jumuiyaName]
      );
      const jumuiyaUUID = sgResult.rows.length ? sgResult.rows[0].group_id : null;

      if (jumuiyaUUID) {
        const result = await pool.query(
          `SELECT m.member_id, m.first_name, m.last_name, m.gender, m.email, m.phone,
                  m.year_of_study, m.join_date, m.source
           FROM members m
           WHERE m.jumuiya_id = $1
             AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)`,
          [jumuiyaUUID]
        );
        members = result.rows.map(r => ({
          member_id: r.member_id,
          name: [r.first_name, r.last_name].filter(Boolean).join(" "),
          gender: r.gender || "",
          email: r.email || "",
          phone: r.phone || "",
          year: r.year_of_study || "",
          source: r.source,
          jumuiya_name: jumuiyaName,
        }));
      }
    } else {
      const result = await pool.query(
        `SELECT m.member_id, m.first_name, m.last_name, m.gender, m.email, m.phone,
                m.year_of_study, m.join_date, m.source,
                sg.name as jumuiya_name
         FROM members m
         LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
         WHERE m.migrated_to_associates IS NULL OR m.migrated_to_associates = false`
      );
      members = result.rows.map(r => ({
        member_id: r.member_id,
        name: [r.first_name, r.last_name].filter(Boolean).join(" "),
        gender: r.gender || "",
        email: r.email || "",
        phone: r.phone || "",
        year: r.year_of_study || "",
        source: r.source,
        jumuiya_name: r.jumuiya_name || "",
      }));
    }

    const seen = new Set();
    const pending = members.filter(m => {
      const key = m.member_id ? m.member_id.toLowerCase() : m.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return isGraduated(m.member_id);
    });

    res.json({ success: true, data: pending, count: pending.length });
  } catch (error) {
    logger.error("getPendingMigrationMembers error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const migrateToAssociates = async (req, res) => {
  try {
    const { member_ids, migrated_by } = req.body;
    if (!member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
      return res.status(400).json({ success: false, error: "member_ids array required" });
    }

    const results = [];
    for (const memberId of member_ids) {
      const admissionYear = deriveAdmissionYear(memberId);
      const graduationYear = calcGraduationYear(admissionYear);

      const member = await pool.query(
        `SELECT m.*, sg.name as jumuiya_name
         FROM members m
         LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
         WHERE m.member_id = $1`,
        [memberId]
      );

      if (member.rows.length > 0) {
        const m = member.rows[0];
        const name = [m.first_name, m.last_name].filter(Boolean).join(" ");
        await pool.query(
          `INSERT INTO associates (member_id, name, gender, email, phone, jumuiya_name, jumuiya_id, year_of_study, admission_year, graduation_year, source, migrated_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT (member_id) DO NOTHING`,
          [memberId, name, m.gender, m.email, m.phone, m.jumuiya_name, m.jumuiya_id, m.year_of_study, admissionYear, graduationYear, m.source, migrated_by || null]
        );
        await pool.query(`UPDATE members SET migrated_to_associates = true WHERE member_id = $1`, [memberId]);
        await pool.query(`UPDATE import_records SET migrated_to_associates = true WHERE cleaned_reg_number = $1`, [memberId]);
        results.push({ member_id: memberId, status: "migrated", source: m.source });
      } else {
        results.push({ member_id: memberId, status: "not_found" });
      }
    }

    res.json({ success: true, data: results, migrated: results.filter(r => r.status === "migrated").length });
  } catch (error) {
    logger.error("migrateToAssociates error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAssociatesList = async (req, res) => {
  try {
    const { jumuiya_id, graduation_year, module_id } = req.query;
    let query = `
      SELECT 
        a.*,
        COALESCE(m.course, '') as course
      FROM associates a
      LEFT JOIN members m ON a.member_id = m.member_id
      LEFT JOIN sub_groups sg ON (a.jumuiya_id = sg.group_id::varchar)
    `;
    const params = [];
    const conditions = [];

    if (module_id) {
      conditions.push(`a.module_id = $${params.length + 1}`);
      params.push(module_id);
    }

    if (jumuiya_id) {
      const resolvedName = slugToJumuiyaName[jumuiya_id] || jumuiya_id;
      conditions.push(`(
        a.jumuiya_id = $${params.length + 1}
        OR a.jumuiya_name = $${params.length + 1}
        OR a.jumuiya_id = $${params.length + 2}
        OR a.jumuiya_name = $${params.length + 2}
        OR sg.slug = $${params.length + 1}
        OR sg.slug = $${params.length + 2}
        OR sg.group_id::varchar = $${params.length + 1}
        OR sg.group_id::varchar = $${params.length + 2}
        OR LOWER(sg.name) = LOWER($${params.length + 1})
        OR LOWER(sg.name) = LOWER($${params.length + 2})
      )`);
      params.push(jumuiya_id);
      params.push(resolvedName);
    }

    if (graduation_year) {
      conditions.push(`a.graduation_year = $${params.length + 1}`);
      params.push(parseInt(graduation_year));
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY a.graduation_year DESC, a.name ASC`;

    const result = await pool.query(query, params);

    const rows = result.rows.map(r => {
      const admissionYear = r.admission_year || deriveAdmissionYear(r.member_id);
      const graduationYear = r.graduation_year || calcGraduationYear(admissionYear);
      return {
        ...r,
        id: r.member_id || String(r.id),
        name: r.name,
        course: r.course || '',
        admission_year: admissionYear,
        graduation_year: graduationYear,
        class_of: graduationYear ? `Class of ${graduationYear}` : null,
        is_associate: true,
      };
    });

    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    logger.error("getAssociatesList error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const exportAssociates = async (req, res) => {
  try {
    const { graduation_year, jumuiya_id } = req.query;
    let query = `SELECT member_id, name, gender, email, phone, jumuiya_name,
                        admission_year, graduation_year, source, migrated_at
                 FROM associates`;
    const params = [];
    const conditions = [];

    if (graduation_year) {
      conditions.push(`graduation_year = $${params.length + 1}`);
      params.push(parseInt(graduation_year));
    }
    if (jumuiya_id) {
      conditions.push(`(jumuiya_id = $${params.length + 1} OR jumuiya_name = $${params.length + 1})`);
      params.push(slugToJumuiyaName[jumuiya_id] || jumuiya_id);
    }

    if (conditions.length > 0) query += ` WHERE ${conditions.join(" AND ")}`;
    query += ` ORDER BY graduation_year DESC, name ASC`;

    const result = await pool.query(query, params);
    const rows = result.rows.map(r => ({
      RegNo: r.member_id,
      Name: r.name,
      Gender: r.gender || "",
      Email: r.email || "",
      Phone: r.phone || "",
      Jumuiya: r.jumuiya_name || "",
      AdmissionYear: r.admission_year || "",
      GraduationYear: r.graduation_year || "",
      Source: r.source || "",
      MigratedAt: r.migrated_at ? r.migrated_at.toISOString().slice(0, 10) : "",
    }));
    res.json({ status: "success", data: rows });
  } catch (error) {
    logger.error("exportAssociates error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const undoMigration = async (req, res) => {
  try {
    const { member_id } = req.body;
    if (!member_id) {
      return res.status(400).json({ success: false, error: "member_id is required" });
    }
    await pool.query(`DELETE FROM associates WHERE member_id = $1`, [member_id]);
    await pool.query(`UPDATE members SET migrated_to_associates = false WHERE member_id = $1`, [member_id]);
    await pool.query(`UPDATE import_records SET migrated_to_associates = false WHERE cleaned_reg_number = $1`, [member_id]);
    res.json({ success: true, message: "Migration reverted" });
  } catch (error) {
    logger.error("undoMigration error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
