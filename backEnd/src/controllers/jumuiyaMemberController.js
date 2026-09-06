import { db as pool, withTransaction } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";
import { validateMemberRow, parseExcelRow } from "../utils/memberValidation.js";
import { distributeMembers } from "../utils/distributionAlgorithm.js";
import { syncNewImportRecords } from "../services/importSyncJob.js";
import bcrypt from "bcrypt";

/**
 * Check for duplicate registration numbers, phones, and emails
 * across both the legacy members table and import_records (valid/warning).
 * Also catches duplicates within the current batch.
 */
const checkExistingDuplicates = async (members) => {
  const results = {}; // rowIndex -> string[]

  // --- Within-batch duplicates ---
  const seenReg = new Map();
  const seenPhone = new Map();
  const seenEmail = new Map();

  members.forEach((m, i) => {
    const reg = (m.regNumber || "").trim().toUpperCase();
    const phone = (m.phone || "").trim();
    const email = (m.email || "").trim().toLowerCase();

    if (reg) {
      if (seenReg.has(reg)) results[i] = [...(results[i] || []), `Duplicate registration number within file: "${reg}" (row ${seenReg.get(reg) + 1})`];
      else seenReg.set(reg, i);
    }
    if (phone) {
      if (seenPhone.has(phone)) results[i] = [...(results[i] || []), `Duplicate phone within file: "${phone}" (row ${seenPhone.get(phone) + 1})`];
      else seenPhone.set(phone, i);
    }
    if (email) {
      if (seenEmail.has(email)) results[i] = [...(results[i] || []), `Duplicate email within file: "${email}" (row ${seenEmail.get(email) + 1})`];
      else seenEmail.set(email, i);
    }
  });

  // --- Against database ---
  const allRegs = members.map(m => (m.regNumber || "").trim().toUpperCase()).filter(Boolean);
  const allPhones = members.map(m => (m.phone || "").trim()).filter(Boolean);
  const allEmails = members.map(m => (m.email || "").trim().toLowerCase()).filter(Boolean);

  const queries = [];

  if (allRegs.length > 0) {
    queries.push(
      pool.query(
        `SELECT DISTINCT 'members' as source, member_id as val FROM members WHERE member_id = ANY($1)
         UNION ALL
         SELECT DISTINCT 'import' as source, cleaned_reg_number as val FROM import_records WHERE cleaned_reg_number = ANY($1) AND status IN ('valid', 'warning')`,
        [allRegs]
      ).then(r => ({ field: "regNumber", rows: r.rows }))
    );
  }
  if (allPhones.length > 0) {
    queries.push(
      pool.query(
        `SELECT 'members' as source, phone as val FROM members WHERE phone = ANY($1)
         UNION ALL
         SELECT 'import' as source, cleaned_phone as val FROM import_records WHERE cleaned_phone = ANY($1) AND status IN ('valid', 'warning')`,
        [allPhones]
      ).then(r => ({ field: "phone", rows: r.rows }))
    );
  }
  if (allEmails.length > 0) {
    queries.push(
      pool.query(
        `SELECT 'members' as source, email as val FROM members WHERE email = ANY($1)
         UNION ALL
         SELECT 'import' as source, cleaned_email as val FROM import_records WHERE cleaned_email = ANY($1) AND status IN ('valid', 'warning')`,
        [allEmails]
      ).then(r => ({ field: "email", rows: r.rows }))
    );
  }

  const dbResults = await Promise.all(queries);

  for (const { field, rows } of dbResults) {
    if (rows.length === 0) continue;
    const existingVals = new Set(rows.map(r => r.val));
    members.forEach((m, i) => {
      let val = "";
      if (field === "regNumber") val = (m.regNumber || "").trim().toUpperCase();
      else if (field === "phone") val = (m.phone || "").trim();
      else if (field === "email") val = (m.email || "").trim().toLowerCase();
      if (val && existingVals.has(val)) {
        results[i] = [...(results[i] || []), `${field === "regNumber" ? "Registration number" : field === "phone" ? "Phone" : "Email"} already exists in the system: "${val}"`];
      }
    });
  }

  return results;
};

/**
 * Resolve a jumuiya identifier (UUID or slug) to { slug, name }.
 * Accepts a UUID (from sub_groups.group_id) or a slug like "st-monica".
 * Returns null if unresolvable.
 */
const resolveJumuiyaInput = async (input) => {
  if (!input) return null;
  const slugToName = {
    "st-anthony": "St. Anthony", "st-augustine": "St. Augustine",
    "st-catherine": "St. Catherine", "st-dominic": "St. Dominic",
    "st-elizabeth": "St. Elizabeth", "st-maria-goretti": "St. Maria Goretti",
    "st-monica": "St. Monica",
  };
  if (slugToName[input]) return { slug: input, name: slugToName[input] };
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
  if (isUuid) {
    const result = await pool.query(
      `SELECT slug, name FROM sub_groups WHERE group_id = $1`, [input]
    );
    if (result.rows.length) {
      const row = result.rows[0];
      return { slug: row.slug || input, name: row.name };
    }
  }
  const nameResult = await pool.query(
    `SELECT slug, name FROM sub_groups WHERE LOWER(name) = LOWER($1)`, [input]
  );
  if (nameResult.rows.length) {
    const row = nameResult.rows[0];
    return { slug: row.slug || input, name: row.name };
  }
  return null;
};

export const createSeason = async (req, res) => {
  try {
    const { jumuiya_id, season_name, start_date, end_date, status } = req.body;
    if (!jumuiya_id || !season_name || !start_date || !end_date) {
      return res.status(400).json({ error: "jumuiya_id, season_name, start_date, end_date are required" });
    }
    const result = await pool.query(
      `INSERT INTO registration_seasons (jumuiya_id, season_name, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [jumuiya_id, season_name, start_date, end_date, status || "planning"]
    );
    res.status(201).json({ status: "success", data: result.rows[0] });
  } catch (error) {
    logger.error("createSeason error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getSeasons = async (req, res) => {
  try {
    let { jumuiya_id } = req.params;
    const resolved = await resolveJumuiyaInput(jumuiya_id);
    if (!resolved) return res.status(400).json({ error: "Invalid jumuiya_id" });
    const result = await pool.query(
      `SELECT * FROM registration_seasons WHERE jumuiya_id = $1 ORDER BY start_date DESC`,
      [resolved.slug]
    );
    res.json({ status: "success", data: result.rows, jumuiyaName: resolved.name });
  } catch (error) {
    logger.error("getSeasons error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateSeason = async (req, res) => {
  try {
    const { id } = req.params;
    const { season_name, start_date, end_date, status } = req.body;
    const result = await pool.query(
      `UPDATE registration_seasons SET
        season_name = COALESCE($1, season_name),
        start_date = COALESCE($2, start_date),
        end_date = COALESCE($3, end_date),
        status = COALESCE($4, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [season_name, start_date, end_date, status, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Season not found" });
    res.json({ status: "success", data: result.rows[0] });
  } catch (error) {
    logger.error("updateSeason error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const deleteSeason = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM registration_seasons WHERE id = $1", [id]);
    res.json({ status: "success", message: "Season deleted" });
  } catch (error) {
    logger.error("deleteSeason error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const importMembers = async (req, res) => {
  try {
    const { jumuiya_id } = req.params;
    const { members, season_id, file_name, coordinator_id, academic_year } = req.body;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "members array is required" });
    }

    let targetJumuiyaName = null;
    let targetJumuiyaUuid = null;
    if (jumuiya_id && jumuiya_id !== 'csa') {
      const resolved = await resolveJumuiyaInput(jumuiya_id);
      if (resolved) {
        targetJumuiyaName = resolved.name;
        const sgRes = await pool.query(`SELECT group_id FROM sub_groups WHERE name = $1 OR full_name = $1`, [resolved.name]);
        if (sgRes.rows.length) targetJumuiyaUuid = sgRes.rows[0].group_id;
      }
    }

    const nonEmpty = members.filter(m => m.regNumber?.trim() || m.name?.trim() || m.gender?.trim());
    if (nonEmpty.length === 0) {
      return res.status(400).json({ error: "No valid data rows found — all rows were empty" });
    }

    const dupErrors = await checkExistingDuplicates(nonEmpty);

    const importResult = await pool.query(
      `INSERT INTO member_imports (jumuiya_id, coordinator_id, season_id, file_name, total_records, academic_year, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
      [jumuiya_id, coordinator_id || null, season_id || null, file_name || null, nonEmpty.length, academic_year || null]
    );

    const importId = importResult.rows[0].id;
    let validCount = 0;
    let errorCount = 0;
    const results = [];

    for (let i = 0; i < nonEmpty.length; i++) {
      const member = nonEmpty[i];
      const validated = validateMemberRow(member, targetJumuiyaName);
      const dupes = dupErrors[i] || [];
      const allErrors = [...validated.errors, ...dupes];
      let status = validated.status;
      if (dupes.length > 0 && status !== "error") status = "warning";

      const recordResult = await pool.query(
        `INSERT INTO import_records
         (import_id, raw_name, raw_reg_number, raw_gender, raw_course, raw_jumuiya, raw_phone, raw_email,
          cleaned_name, cleaned_reg_number, cleaned_gender, cleaned_course, cleaned_jumuiya, cleaned_phone, cleaned_email,
          status, validation_errors, validation_warnings)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
        [
          importId,
          validated.raw.name, validated.raw.regNumber, validated.raw.gender, validated.raw.course, validated.raw.jumuiya, validated.raw.phone, validated.raw.email,
          validated.cleaned.name, validated.cleaned.regNumber, validated.cleaned.gender, validated.cleaned.course, validated.cleaned.jumuiya, validated.cleaned.phone, validated.cleaned.email,
          status, JSON.stringify(allErrors), JSON.stringify(validated.warnings),
        ]
      );
      if (status === "error") errorCount++;
      else validCount++;
      results.push(recordResult.rows[0]);

      // Direct synchronous insert into members table (0ms delay - immediate appearance)
      if (validated.cleaned.regNumber && (status === "valid" || status === "warning")) {
        const fullName = validated.cleaned.name || "";
        const firstName = fullName.split(" ")[0] || "";
        const lastName = fullName.substring(firstName.length).trim() || "";

        let memberJumuiyaUuid = targetJumuiyaUuid;
        if (!memberJumuiyaUuid && validated.cleaned.jumuiya) {
          const sgMatch = await pool.query(`SELECT group_id FROM sub_groups WHERE LOWER(name) = LOWER($1)`, [validated.cleaned.jumuiya]);
          if (sgMatch.rows.length) memberJumuiyaUuid = sgMatch.rows[0].group_id;
        }

        // DO NOTHING on conflict: an existing member's live data (names, phone,
        // email, password, jumuiya) must never be overwritten by an import.
        // Duplicates are already recorded as 'warning' import_records above.
        // Passwords are hashed asynchronously by syncNewImportRecords' backfill,
        // so we never block the request with per-row bcrypt.
        await pool.query(
          `INSERT INTO members (
             member_id, first_name, last_name, phone, gender, course, email,
             source, status, import_batch_id, join_date, jumuiya_id
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
           ON CONFLICT (member_id) DO NOTHING`,
          [
            validated.cleaned.regNumber,
            firstName,
            lastName,
            validated.cleaned.phone || null,
            validated.cleaned.gender ? validated.cleaned.gender.toLowerCase() : null,
            validated.cleaned.course || null,
            validated.cleaned.email || null,
            jumuiya_id === 'csa' ? 'csa' : 'jum',
            status,
            importId,
            memberJumuiyaUuid || null
          ]
        );
      }
    }

    await pool.query(
      `UPDATE member_imports SET valid_records = $1, error_records = $2 WHERE id = $3`,
      [validCount, errorCount, importId]
    );

    // Create valid/warning members immediately so they appear in the members
    // table and can log in right away (no 5-minute sync job wait).
    await syncNewImportRecords();

    // Clean up original pending WhatsApp self-registration records for this
    // jumuiya whose cleaned_reg_number now exists in the members table.
    // This prevents them from continuing to appear in the pending queue.
    if (jumuiya_id && jumuiya_id !== 'csa') {
      await pool.query(
        `UPDATE import_records ir SET status = 'processed'
         FROM member_imports mi
         WHERE ir.import_id = mi.id
           AND mi.jumuiya_id = $1
           AND mi.file_name = 'whatsapp-self-registration'
           AND ir.status = 'pending'
           AND EXISTS (
             SELECT 1 FROM members m WHERE m.member_id = ir.cleaned_reg_number
           )`,
        [jumuiya_id]
      );
    }

    res.status(201).json({
      status: "success",
      data: {
        import: importResult.rows[0],
        records: results,
        summary: { total: nonEmpty.length, valid: validCount, errors: errorCount },
      },
    });
  } catch (error) {
    logger.error("importMembers error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getImportStatus = async (req, res) => {
  try {
    const { importId } = req.params;
    const result = await pool.query(
      `SELECT mi.*,
        (SELECT json_agg(json_build_object(
          'id', ir.id, 'raw_name', ir.raw_name, 'cleaned_name', ir.cleaned_name,
          'raw_reg_number', ir.raw_reg_number, 'raw_gender', ir.raw_gender,
          'raw_phone', ir.raw_phone, 'raw_email', ir.raw_email,
          'status', ir.status, 'validation_errors', ir.validation_errors, 'validation_warnings', ir.validation_warnings
        )) FROM import_records ir WHERE ir.import_id = mi.id) as records
       FROM member_imports mi WHERE mi.id = $1`,
      [importId]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Import not found" });
    res.json({ status: "success", data: result.rows[0] });
  } catch (error) {
    logger.error("getImportStatus error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getImports = async (req, res) => {
  try {
    const { jumuiya_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM member_imports WHERE jumuiya_id = $1 ORDER BY import_date DESC`,
      [jumuiya_id]
    );
    res.json({ status: "success", data: result.rows });
  } catch (error) {
    logger.error("getImports error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /api/v1/jumuiya-members/:jumuiya_id/import-records/:recordId
 * Update an individual import record (e.g. to fix validation errors).
 * Re-validates the row and updates status accordingly.
 */
export const updateImportRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { name, regNumber, gender, jumuiya, phone, email } = req.body;

    const existing = await pool.query(
      `SELECT ir.*, mi.jumuiya_id FROM import_records ir
       JOIN member_imports mi ON mi.id = ir.import_id WHERE ir.id = $1`,
      [recordId]
    );
    if (!existing.rows.length) return res.status(404).json({ error: "Record not found" });

    const memberRow = { name, regNumber, gender, jumuiya, phone, email };
    const validated = validateMemberRow(memberRow);

    // For CSA records, cleaned_jumuiya should stay null
    const cleanedJumuiya = existing.rows[0].jumuiya_id === "csa" ? null : validated.cleaned.jumuiya;

    const result = await pool.query(
      `UPDATE import_records SET
        raw_name = $1, raw_reg_number = $2, raw_gender = $3, raw_jumuiya = $4, raw_phone = $5, raw_email = $6,
        cleaned_name = $7, cleaned_reg_number = $8, cleaned_gender = $9, cleaned_jumuiya = $10,
        cleaned_phone = $11, cleaned_email = $12,
        status = $13, validation_errors = $14, validation_warnings = $15
       WHERE id = $16 RETURNING *`,
      [
        validated.raw.name, validated.raw.regNumber, validated.raw.gender, validated.raw.jumuiya,
        validated.raw.phone, validated.raw.email,
        validated.cleaned.name, validated.cleaned.regNumber, validated.cleaned.gender,
        cleanedJumuiya, validated.cleaned.phone, validated.cleaned.email,
        validated.status, JSON.stringify(validated.errors), JSON.stringify(validated.warnings),
        recordId,
      ]
    );

    // Recompute import-level counts
    const importId = existing.rows[0].import_id;
    const counts = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status IN ('valid','warning')) as valid_count,
              COUNT(*) FILTER (WHERE status = 'error') as error_count
       FROM import_records WHERE import_id = $1`,
      [importId]
    );
    await pool.query(
      `UPDATE member_imports SET valid_records = $1, error_records = $2 WHERE id = $3`,
      [parseInt(counts.rows[0].valid_count), parseInt(counts.rows[0].error_count), importId]
    );

    res.json({ status: "success", data: result.rows[0] });
  } catch (error) {
    logger.error("updateImportRecord error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const deleteImportRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const existing = await pool.query(
      `SELECT ir.*, mi.jumuiya_id, mi.status as import_status FROM import_records ir
       JOIN member_imports mi ON mi.id = ir.import_id WHERE ir.id = $1`,
      [recordId]
    );
    if (!existing.rows.length) return res.status(404).json({ error: "Record not found" });
    if (existing.rows[0].import_status === "processed") {
      return res.status(400).json({ error: "Cannot delete records from a processed import" });
    }
    await pool.query("DELETE FROM import_records WHERE id = $1", [recordId]);
    // Recompute import-level counts
    const importId = existing.rows[0].import_id;
    const counts = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status IN ('valid','warning')) as valid_count,
              COUNT(*) FILTER (WHERE status = 'error') as error_count
       FROM import_records WHERE import_id = $1`,
      [importId]
    );
    await pool.query(
      `UPDATE member_imports SET total_records = total_records - 1,
               valid_records = $1, error_records = $2 WHERE id = $3`,
      [parseInt(counts.rows[0].valid_count), parseInt(counts.rows[0].error_count), importId]
    );
    res.json({ status: "success", message: "Record deleted" });
  } catch (error) {
    logger.error("deleteImportRecord error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateImportStatus = async (req, res) => {
  try {
    const { importId } = req.params;
    const { status, notes } = req.body;
    if (!["pending", "reviewed", "processed", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    let createdMembers = [];
    if (status === "processed") {
      // Fetch import details
      const impResult = await pool.query(
        `SELECT * FROM member_imports WHERE id = $1`, [importId]
      );
      if (!impResult.rows.length) return res.status(404).json({ error: "Import not found" });
      const imp = impResult.rows[0];

      // Resolve sub_groups UUID: import stores slug ("st-anthony"), sub_groups stores display name ("St. Anthony")
      const slugToName = {
        "st-anthony": "St. Anthony", "st-augustine": "St. Augustine",
        "st-catherine": "St. Catherine", "st-dominic": "St. Dominic",
        "st-elizabeth": "St. Elizabeth", "st-maria-goretti": "St. Maria Goretti",
        "st-monica": "St. Monica",
      };
      const jumuiyaName = slugToName[imp.jumuiya_id] || imp.jumuiya_id;
      let sgResult = await pool.query(
        `SELECT group_id FROM sub_groups WHERE name = $1 OR full_name = $1`, [jumuiyaName]
      );
      if (!sgResult.rows.length) {
        sgResult = await pool.query(
          `SELECT group_id FROM sub_groups WHERE name = $1 OR full_name = $1`, [imp.jumuiya_id]
        );
      }
      if (!sgResult.rows.length) {
        return res.status(400).json({ error: `Could not resolve jumuiya: ${imp.jumuiya_id}` });
      }
      const jumuiyaUUID = sgResult.rows[0].group_id;

      // Get valid/warning records
      const recordsResult = await pool.query(
        `SELECT * FROM import_records WHERE import_id = $1 AND status IN ('valid', 'warning')`, [importId]
      );

      for (const rec of recordsResult.rows) {
        const nameParts = (rec.cleaned_name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || firstName;

        if (!rec.cleaned_reg_number) continue;

        // Skip if member_id or email already exists
        const dupCheck = await pool.query(
          `SELECT member_id FROM members WHERE member_id = $1${rec.cleaned_email ? " OR email = $2" : ""}`,
          rec.cleaned_email ? [rec.cleaned_reg_number, rec.cleaned_email] : [rec.cleaned_reg_number]
        );
        if (dupCheck.rows.length > 0) continue;

        const defaultPassword = await bcrypt.hash(rec.cleaned_reg_number, 10);
        const genderValue = rec.cleaned_gender ? rec.cleaned_gender.toLowerCase() : null;
        const insertResult = await pool.query(
          `INSERT INTO members
             (member_id, jumuiya_id, first_name, last_name, gender, email, phone, year_of_study, course, password, join_date, source, import_batch_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, 'jum', $11)
           RETURNING member_id, first_name, last_name, gender, email, phone`,
          [
            rec.cleaned_reg_number,
            jumuiyaUUID,
            firstName,
            lastName,
            genderValue,
            rec.cleaned_email || null,
            rec.cleaned_phone || null,
            imp.academic_year || null,
            rec.cleaned_course || null,
            defaultPassword,
            importId,
          ]
        );
        createdMembers.push(insertResult.rows[0]);
      }

      // Mark all valid/warning import_records in this batch as 'processed'
      // so they no longer appear in the pending self-registrations list.
      await pool.query(
        `UPDATE import_records SET status = 'processed'
         WHERE import_id = $1 AND status IN ('valid', 'warning')`,
        [importId]
      );
    }

    const result = await pool.query(
      `UPDATE member_imports SET status = $1, notes = COALESCE($2, notes) WHERE id = $3 RETURNING *`,
      [status, notes, importId]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Import not found" });

    res.json({
      status: "success",
      data: {
        import: result.rows[0],
        createdMembers: status === "processed" ? createdMembers : undefined,
      }
    });
  } catch (error) {
    logger.error("updateImportStatus error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const validateImportData = async (req, res) => {
  try {
    const { members } = req.body;
    if (!members || !Array.isArray(members)) {
      return res.status(400).json({ error: "members array is required" });
    }

    const dupErrors = await checkExistingDuplicates(members);

    const results = members.map((m, i) => {
      const parsed = parseExcelRow(m);
      const validated = validateMemberRow(parsed);
      const dupes = dupErrors[i] || [];
      const allErrors = [...(validated.errors || []), ...dupes];
      let status = validated.status;
      if (dupes.length > 0 && status !== "error") status = "warning";
      return {
        row: i + 1,
        raw: validated.raw,
        cleaned: validated.cleaned,
        status,
        errors: allErrors,
        warnings: validated.warnings || [],
      };
    });

    const summary = {
      total: results.length,
      valid: results.filter(r => r.status === "valid").length,
      warning: results.filter(r => r.status === "warning").length,
      error: results.filter(r => r.status === "error").length,
    };

    res.json({ status: "success", data: { results, summary } });
  } catch (error) {
    logger.error("validateImportData error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const createGroups = async (req, res) => {
  try {
    const { jumuiya_id } = req.params;
    const { groups, season_id } = req.body;

    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return res.status(400).json({ error: "groups array is required" });
    }

    const created = [];
    for (const g of groups) {
      const result = await pool.query(
        `INSERT INTO member_groups (jumuiya_id, group_name, season_id, capacity, description, group_type)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [jumuiya_id, g.group_name, season_id || null, g.capacity || 0, g.description || null, g.group_type || "mixed"]
      );
      created.push(result.rows[0]);
    }

    res.status(201).json({ status: "success", data: created });
  } catch (error) {
    logger.error("createGroups error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getGroups = async (req, res) => {
  try {
    const { jumuiya_id } = req.params;
    const { season_id } = req.query;
    let query = `SELECT mg.*,
      (SELECT COUNT(*) FROM group_assignments ga WHERE ga.group_id = mg.id AND ga.status = 'active') as member_count
      FROM member_groups mg WHERE mg.jumuiya_id = $1`;
    const params = [jumuiya_id];

    if (season_id) {
      query += ` AND mg.season_id = $2`;
      params.push(season_id);
    }

    query += ` ORDER BY mg.group_name`;
    const result = await pool.query(query, params);
    res.json({ status: "success", data: result.rows });
  } catch (error) {
    logger.error("getGroups error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { group_name, capacity, description, group_type } = req.body;
    const result = await pool.query(
      `UPDATE member_groups SET
        group_name = COALESCE($1, group_name),
        capacity = COALESCE($2, capacity),
        description = COALESCE($3, description),
        group_type = COALESCE($4, group_type),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [group_name, capacity, description, group_type, groupId]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Group not found" });
    res.json({ status: "success", data: result.rows[0] });
  } catch (error) {
    logger.error("updateGroup error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    await pool.query("DELETE FROM member_groups WHERE id = $1", [groupId]);
    res.json({ status: "success", message: "Group deleted" });
  } catch (error) {
    logger.error("deleteGroup error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const autoDistribute = async (req, res) => {
  try {
    const { jumuiya_id } = req.params;
    const { season_id, strategy, import_id } = req.body;

    const groupsResult = await pool.query(
      `SELECT * FROM member_groups WHERE jumuiya_id = $1 ${season_id ? "AND season_id = $2" : ""}`,
      season_id ? [jumuiya_id, season_id] : [jumuiya_id]
    );

    if (!groupsResult.rows.length) {
      return res.status(400).json({ error: "No groups found. Create groups first." });
    }

    let members;
    if (import_id) {
      const recordsResult = await pool.query(
        `SELECT COALESCE(m.member_id, ir.cleaned_reg_number) as member_id,
                CONCAT_WS(' ', m.first_name, m.last_name) as name,
                COALESCE(m.gender, ir.cleaned_gender) as gender
         FROM import_records ir
         LEFT JOIN members m ON m.member_id = ir.cleaned_reg_number
         WHERE ir.import_id = $1 AND ir.status IN ('valid', 'warning')`,
        [import_id]
      );
      members = recordsResult.rows.map(r => ({ id: r.member_id, name: r.name, gender: r.gender }));
    } else {
      const importResult = await pool.query(
        `SELECT COALESCE(m.member_id, ir.cleaned_reg_number) as member_id,
                CONCAT_WS(' ', m.first_name, m.last_name) as name,
                COALESCE(m.gender, ir.cleaned_gender) as gender
         FROM import_records ir
         LEFT JOIN members m ON m.member_id = ir.cleaned_reg_number
         JOIN member_imports mi ON mi.id = ir.import_id
         WHERE mi.jumuiya_id = $1 AND mi.status = 'processed' AND ir.status IN ('valid', 'warning')`,
        [jumuiya_id]
      );
      members = importResult.rows.map(r => ({ id: r.member_id, name: r.name, gender: r.gender }));
    }

    if (!members.length) {
      return res.status(400).json({ error: "No valid members found to distribute" });
    }

    const result = distributeMembers({
      members,
      groups: groupsResult.rows,
      strategy: strategy || "balanced-mixed",
    });

    for (const assignment of result.assignments) {
      await pool.query(
        `INSERT INTO group_assignments (member_id, group_id, assigned_by, status)
         VALUES ($1, $2, $3, 'active')
         ON CONFLICT (member_id, group_id) DO NOTHING`,
        [assignment.member_id, assignment.group_id, req.user?.id || null]
      );
    }

    await pool.query(
      `INSERT INTO distribution_history (season_id, jumuiya_id, algorithm_used, stats, distributed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [season_id || null, jumuiya_id, strategy || "balanced-mixed", JSON.stringify(result.stats), req.user?.id || null]
    );

    res.status(201).json({
      status: "success",
      data: {
        assignments: result.assignments,
        stats: result.stats,
      },
    });
  } catch (error) {
    logger.error("autoDistribute error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const reassignMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { member_id } = req.body;

    await pool.query(
      `UPDATE group_assignments SET status = 'inactive' WHERE member_id = $1 AND status = 'active'`,
      [member_id]
    );

    const result = await pool.query(
      `INSERT INTO group_assignments (member_id, group_id, assigned_by, status)
       VALUES ($1, $2, $3, 'active') RETURNING *`,
      [member_id, groupId, req.user?.id || null]
    );

    res.json({ status: "success", data: result.rows[0] });
  } catch (error) {
    logger.error("reassignMember error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await pool.query(
      `SELECT ga.*,
              CONCAT_WS(' ', m.first_name, m.last_name) as member_name,
              m.gender as member_gender,
              m.member_id as reg_number,
              m.phone, m.email
       FROM group_assignments ga
       LEFT JOIN members m ON m.member_id = ga.member_id
       WHERE ga.group_id = $1 AND ga.status = 'active'
       ORDER BY member_name`,
      [groupId]
    );
    res.json({ status: "success", data: result.rows });
  } catch (error) {
    logger.error("getGroupMembers error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getStatistics = async (req, res) => {
  try {
    let { jumuiya_id } = req.params;
    const resolved = await resolveJumuiyaInput(jumuiya_id);
    if (!resolved) return res.status(400).json({ error: "Invalid jumuiya_id" });

    const sgResult = await pool.query(
      `SELECT group_id FROM sub_groups WHERE name = $1 OR slug = $1`, [resolved.name]
    );
    const jumuiyaUUID = sgResult.rows.length ? sgResult.rows[0].group_id : null;

    const [jumMembers, csaMembers, genderBrkdwn, totalMembersRow, groupStats, activeSeason, subGroupRow] = await Promise.all([
      jumuiyaUUID
        ? pool.query(
            `SELECT COUNT(*)::int as total,
                    COALESCE(SUM(CASE WHEN LOWER(gender) = 'male' THEN 1 ELSE 0 END), 0)::int as male_count,
                    COALESCE(SUM(CASE WHEN LOWER(gender) = 'female' THEN 1 ELSE 0 END), 0)::int as female_count
             FROM members WHERE jumuiya_id = $1 AND source = 'jum'
               AND (flagged_inactive IS NULL OR flagged_inactive = false)`,
            [jumuiyaUUID]
          )
        : Promise.resolve({ rows: [{ total: 0, male_count: 0, female_count: 0 }] }),

      jumuiyaUUID
        ? pool.query(
            `SELECT COUNT(*)::int as total,
                    COALESCE(SUM(CASE WHEN LOWER(gender) = 'male' THEN 1 ELSE 0 END), 0)::int as male_count,
                    COALESCE(SUM(CASE WHEN LOWER(gender) = 'female' THEN 1 ELSE 0 END), 0)::int as female_count
             FROM members WHERE jumuiya_id = $1 AND source = 'csa'
               AND (flagged_inactive IS NULL OR flagged_inactive = false)`,
            [jumuiyaUUID]
          )
        : Promise.resolve({ rows: [{ total: 0, male_count: 0, female_count: 0 }] }),

      jumuiyaUUID
        ? pool.query(
            `SELECT LOWER(gender) as gender, COUNT(*)::int as count
             FROM members WHERE jumuiya_id = $1
               AND (flagged_inactive IS NULL OR flagged_inactive = false)
               AND (migrated_to_associates IS NULL OR migrated_to_associates = false)
             GROUP BY LOWER(gender)`,
            [jumuiyaUUID]
          )
        : Promise.resolve({ rows: [] }),

      jumuiyaUUID
        ? pool.query(
            `SELECT COUNT(*)::int as total
             FROM members WHERE jumuiya_id = $1
               AND (flagged_inactive IS NULL OR flagged_inactive = false)
               AND (migrated_to_associates IS NULL OR migrated_to_associates = false)`,
            [jumuiyaUUID]
          )
        : Promise.resolve({ rows: [{ total: 0 }] }),

      pool.query(
        `SELECT mg.id, mg.group_name, mg.group_type, mg.capacity,
                COUNT(ga.id)::int as assigned_count
         FROM member_groups mg
         LEFT JOIN group_assignments ga ON ga.group_id = mg.id AND ga.status = 'active'
         WHERE mg.jumuiya_id = $1
         GROUP BY mg.id, mg.group_name, mg.group_type, mg.capacity
         ORDER BY mg.group_name`,
         [resolved.slug]
      ),

      pool.query(
        `SELECT * FROM registration_seasons
         WHERE jumuiya_id = $1 AND status = 'active'
         LIMIT 1`,
        [resolved.slug]
      ),

      jumuiyaUUID
        ? pool.query(
            `SELECT saint_image FROM sub_groups WHERE group_id = $1`,
            [jumuiyaUUID]
          )
        : Promise.resolve({ rows: [] }),
    ]);

    const jumRow = jumMembers.rows[0] || { total: 0, male_count: 0, female_count: 0 };
    const csaRow = csaMembers.rows[0] || { total: 0, male_count: 0, female_count: 0 };
    const totalRow = totalMembersRow.rows[0] || { total: 0 };

    res.json({
      status: "success",
      data: {
        jum: jumRow,
        csa: csaRow,
        totalMembers: totalRow.total,
        genderBreakdown: genderBrkdwn.rows,
        groups: groupStats.rows,
        activeSeason: activeSeason.rows[0] || null,
        jumuiyaName: resolved.name,
        saintImage: subGroupRow.rows[0]?.saint_image || null,
      },
    });
  } catch (error) {
    logger.error("getStatistics error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const slugToName = {
  "st-anthony": "St. Anthony", "st-augustine": "St. Augustine",
  "st-catherine": "St. Catherine", "st-dominic": "St. Dominic",
  "st-elizabeth": "St. Elizabeth", "st-maria-goretti": "St. Maria Goretti",
  "st-monica": "St. Monica",
};
const BATCH_SLUGS = Object.keys(slugToName);

export const getBatchStatistics = async (req, res) => {
  try {
    const results = await Promise.all(BATCH_SLUGS.map(async (slug) => {
      const jumuiyaName = slugToName[slug];
      const sgResult = await pool.query(
        `SELECT group_id FROM sub_groups WHERE name = $1 OR slug = $1`, [jumuiyaName]
      );
      const uuid = sgResult.rows.length ? sgResult.rows[0].group_id : null;

      const [jumMembers, csaMembers, groupStats, activeSeason] = await Promise.all([
        uuid
          ? pool.query(`SELECT COUNT(*)::int as total,
                               COALESCE(SUM(CASE WHEN LOWER(gender)='male' THEN 1 ELSE 0 END),0)::int as male_count,
                               COALESCE(SUM(CASE WHEN LOWER(gender)='female' THEN 1 ELSE 0 END),0)::int as female_count
                        FROM members WHERE jumuiya_id = $1 AND source = 'jum'
                        AND (migrated_to_associates IS NULL OR migrated_to_associates = false)
                        AND (flagged_inactive IS NULL OR flagged_inactive = false)`, [uuid])
          : Promise.resolve({ rows: [{ total: 0, male_count: 0, female_count: 0 }] }),

        uuid
          ? pool.query(`SELECT COUNT(*)::int as total,
                               COALESCE(SUM(CASE WHEN LOWER(gender)='male' THEN 1 ELSE 0 END),0)::int as male_count,
                               COALESCE(SUM(CASE WHEN LOWER(gender)='female' THEN 1 ELSE 0 END),0)::int as female_count
                        FROM members WHERE jumuiya_id = $1 AND source = 'csa'
                        AND (migrated_to_associates IS NULL OR migrated_to_associates = false)
                        AND (flagged_inactive IS NULL OR flagged_inactive = false)`, [uuid])
          : Promise.resolve({ rows: [{ total: 0, male_count: 0, female_count: 0 }] }),

        pool.query(`SELECT mg.id, mg.group_name, mg.group_type, mg.capacity,
                           COUNT(ga.id)::int as assigned_count
                    FROM member_groups mg LEFT JOIN group_assignments ga ON ga.group_id=mg.id AND ga.status='active'
                    WHERE mg.jumuiya_id=$1 GROUP BY mg.id,mg.group_name,mg.group_type,mg.capacity ORDER BY mg.group_name`, [slug]),

        pool.query(`SELECT * FROM registration_seasons WHERE jumuiya_id=$1 AND status='active' LIMIT 1`, [slug]),
      ]);

      const j = jumMembers.rows[0] || { total: 0, male_count: 0, female_count: 0 };
      const c = csaMembers.rows[0] || { total: 0, male_count: 0, female_count: 0 };
      const totalMembers = (j.total || 0) + (c.total || 0);

      return {
        [slug]: {
          totalMembers,
          jum: j,
          csa: c,
          groups: groupStats.rows,
          activeSeason: activeSeason.rows[0] || null,
          genderBreakdown: [
            ...((j.male_count || c.male_count) ? [{ gender: "Male", count: (j.male_count || 0) + (c.male_count || 0) }] : []),
            ...((j.female_count || c.female_count) ? [{ gender: "Female", count: (j.female_count || 0) + (c.female_count || 0) }] : []),
          ],
        },
      };
    }));

    const combined = Object.assign({}, ...results);
    res.json({ status: "success", data: combined });
  } catch (error) {
    logger.error("getBatchStatistics error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getDistributionHistory = async (req, res) => {
  try {
    const { jumuiya_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM distribution_history WHERE jumuiya_id = $1 ORDER BY distribution_date DESC`,
      [jumuiya_id]
    );
    res.json({ status: "success", data: result.rows });
  } catch (error) {
    logger.error("getDistributionHistory error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

function deriveYearFromReg(memberId) {
  if (!memberId) return null;
  const match = String(memberId).match(/(\d{2})$/);
  if (!match) return null;
  const lastTwo = parseInt(match[1], 10);
  const year = lastTwo <= 50 ? 2000 + lastTwo : 1900 + lastTwo;
  return `${year}-${year + 1}`;
}

export const getMembers = async (req, res) => {
  try {
    let { jumuiya_id } = req.params;
    const resolved = await resolveJumuiyaInput(jumuiya_id);
    if (!resolved) return res.json({ status: "success", data: [] });

    const sgResult = await pool.query(
      `SELECT group_id FROM sub_groups WHERE name = $1 OR full_name = $1`, [resolved.name]
    );
    const jumuiyaUUID = sgResult.rows.length ? sgResult.rows[0].group_id : null;

    if (!jumuiyaUUID) {
      return res.json({ status: "success", data: [] });
    }

    const result = await pool.query(
      `SELECT m.member_id, m.first_name, m.last_name, m.gender, m.course, m.email, m.phone, m.year_of_study, m.join_date, m.source, m.flagged_inactive,
              m.sem_1_reg, m.sem_2_reg, m.sem_3_reg, m.sem_4_reg, m.sem_5_reg, m.sem_6_reg, m.sem_7_reg, m.sem_8_reg
       FROM members m
       LEFT JOIN registered r ON r.member_id = m.member_id AND r.status = 'active'
       WHERE m.jumuiya_id = $1 AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)
       ORDER BY m.first_name`,
      [jumuiyaUUID]
    );

    const data = result.rows.map(r => ({
      member_id: r.member_id,
      first_name: r.first_name || "",
      last_name: r.last_name || "",
      gender: r.gender || null,
      email: r.email || null,
      phone: r.phone || null,
      year_of_study: r.year_of_study || deriveYearFromReg(r.member_id),
      join_date: r.join_date || null,
      source: r.source,
      flagged_inactive: r.flagged_inactive || false,
      sem_1_reg: r.sem_1_reg,
      sem_2_reg: r.sem_2_reg,
      sem_3_reg: r.sem_3_reg,
      sem_4_reg: r.sem_4_reg,
      sem_5_reg: r.sem_5_reg,
      sem_6_reg: r.sem_6_reg,
      sem_7_reg: r.sem_7_reg,
      sem_8_reg: r.sem_8_reg,
    }));

    const seen = new Set();
    const deduped = data.filter(m => {
      if (!m.member_id) return false;
      const key = m.member_id.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    deduped.sort((a, b) => {
      if (!a.first_name) return 1;
      if (!b.first_name) return -1;
      return a.first_name.localeCompare(b.first_name);
    });

    res.json({ status: "success", data: deduped });
  } catch (error) {
    logger.error("getMembers error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const exportMembers = async (req, res) => {
  try {
    let { jumuiya_id } = req.params;
    const resolved = await resolveJumuiyaInput(jumuiya_id);
    if (!resolved) return res.json({ status: "success", data: [] });

    const sgResult = await pool.query(
      `SELECT group_id FROM sub_groups WHERE name = $1 OR full_name = $1`, [resolved.name]
    );
    const jumuiyaUUID = sgResult.rows.length ? sgResult.rows[0].group_id : null;

    if (!jumuiyaUUID) {
      return res.json({ status: "success", data: [] });
    }

    const result = await pool.query(
      `SELECT member_id, first_name, last_name, gender, email, phone, year_of_study, join_date, source
       FROM members
       WHERE jumuiya_id = $1 AND (migrated_to_associates IS NULL OR migrated_to_associates = false)
       ORDER BY first_name`,
      [jumuiyaUUID]
    );

    const combined = [];
    const seen = new Set();

    for (const r of result.rows) {
      const key = r.member_id ? r.member_id.toLowerCase() : r.member_id;
      if (seen.has(key)) continue;
      seen.add(key);
      combined.push({
        RegNo: r.member_id,
        Name: [r.first_name, r.last_name].filter(Boolean).join(" "),
        Gender: r.gender || "",
        Email: r.email || "",
        Phone: r.phone || "",
        Year: r.year_of_study || "",
        Joined: r.join_date ? r.join_date.toISOString().slice(0, 10) : "",
        Source: r.source,
      });
    }

    res.json({ status: "success", data: combined });
  } catch (error) {
    logger.error("exportMembers error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const exportAssignments = async (req, res) => {
  try {
    const { jumuiya_id } = req.params;
    const result = await pool.query(
      `SELECT mg.group_name,
              CONCAT_WS(' ', m.first_name, m.last_name) as member_name,
              m.gender, m.member_id as reg_number
       FROM group_assignments ga
       JOIN member_groups mg ON mg.id = ga.group_id
       LEFT JOIN members m ON m.member_id = ga.member_id
       WHERE mg.jumuiya_id = $1 AND ga.status = 'active'
       ORDER BY mg.group_name, member_name`,
      [jumuiya_id]
    );
    res.json({ status: "success", data: result.rows });
  } catch (error) {
    logger.error("exportAssignments error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const JUMUIYA_NAMES = [
  "St. Anthony", "St. Augustine", "St. Catherine",
  "St. Dominic", "St. Elizabeth", "St. Maria Goretti", "St. Monica",
];

const JUMUIYA_SLUG_MAP = {
  "St. Anthony": "st-anthony",
  "St. Augustine": "st-augustine",
  "St. Catherine": "st-catherine",
  "St. Dominic": "st-dominic",
  "St. Elizabeth": "st-elizabeth",
  "St. Maria Goretti": "st-maria-goretti",
  "St. Monica": "st-monica",
};

/**
 * POST /api/v1/jumuiya-members/csa/import-members
 * Import new members at CSA level (not yet assigned to any Jumuiya).
 */
export const csaImportMembers = async (req, res) => {
  try {
    const { members, season_id, file_name, academic_year } = req.body;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "members array is required" });
    }

    const nonEmpty = members.filter(m => m.regNumber?.trim() || m.name?.trim() || m.gender?.trim());
    if (nonEmpty.length === 0) {
      return res.status(400).json({ error: "No valid data rows found — all rows were empty" });
    }

    const dupErrors = await checkExistingDuplicates(nonEmpty);

    const importResult = await pool.query(
      `INSERT INTO member_imports (jumuiya_id, season_id, file_name, total_records, academic_year, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      ["csa", season_id || null, file_name || null, nonEmpty.length, academic_year || null]
    );

    const importId = importResult.rows[0].id;
    let validCount = 0;
    let errorCount = 0;
    const results = [];

    for (let i = 0; i < nonEmpty.length; i++) {
      const member = nonEmpty[i];
      const validated = validateMemberRow(member);
      const dupes = dupErrors[i] || [];
      const allErrors = [...validated.errors, ...dupes];
      let status = validated.status;
      if (dupes.length > 0 && status !== "error") status = "warning";

      const recordResult = await pool.query(
        `INSERT INTO import_records
         (import_id, raw_name, raw_reg_number, raw_gender, raw_course, raw_jumuiya, raw_phone, raw_email,
          cleaned_name, cleaned_reg_number, cleaned_gender, cleaned_course, cleaned_jumuiya, cleaned_phone, cleaned_email,
          status, validation_errors, validation_warnings)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
        [
          importId,
          validated.raw.name, validated.raw.regNumber, validated.raw.gender, validated.raw.course, validated.raw.jumuiya, validated.raw.phone, validated.raw.email,
          validated.cleaned.name, validated.cleaned.regNumber, validated.cleaned.gender, validated.cleaned.course, validated.cleaned.jumuiya, validated.cleaned.phone, validated.cleaned.email,
          status, JSON.stringify(allErrors), JSON.stringify(validated.warnings),
        ]
      );
      if (status === "error") errorCount++;
      else validCount++;
      results.push(recordResult.rows[0]);
    }

    await pool.query(
      `UPDATE member_imports SET valid_records = $1, error_records = $2 WHERE id = $3`,
      [validCount, errorCount, importId]
    );

    // Create valid/warning members immediately so they appear in the members
    // table and can log in right away (no 5-minute sync job wait).
    await syncNewImportRecords();

    res.status(201).json({
      status: "success",
      data: {
        import: importResult.rows[0],
        records: results,
        summary: { total: nonEmpty.length, valid: validCount, errors: errorCount },
      },
    });
  } catch (error) {
    logger.error("csaImportMembers error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/jumuiya-members/csa/pending-members
 * Returns all import_records that haven't been assigned to a Jumuiya yet.
 */
export const csaGetPendingMembers = async (req, res) => {
  try {
    const { academic_year, gender } = req.query;
    const conditions = [
      `m.source = 'csa'`,
      `m.jumuiya_id IS NULL`,
    ];
    const params = [];

    if (academic_year) {
      params.push(academic_year);
      conditions.push(`mi.academic_year = $${params.length}`);
    }
    if (gender) {
      params.push(gender);
      conditions.push(`LOWER(m.gender) = LOWER($${params.length})`);
    }

    const result = await pool.query(
      `SELECT m.member_id, 
              CONCAT_WS(' ', m.first_name, m.last_name) as name,
              m.member_id as reg_number,
              m.gender, m.phone, m.email,
              m.status, m.import_batch_id as import_id,
              mi.import_date, mi.file_name, mi.academic_year
       FROM members m
       LEFT JOIN member_imports mi ON mi.id = m.import_batch_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY mi.import_date DESC, m.first_name`,
      params
    );

    res.json({ status: "success", data: result.rows });
  } catch (error) {
    logger.error("csaGetPendingMembers error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/jumuiya-members/csa/jumuiya-stats
 * Returns current member counts per Jumuiya (both legacy + new system)
 * for use by the distribution algorithm.
 */
export const csaGetJumuiyaStats = async (req, res) => {
  try {
    const { academic_year } = req.query;
    const yearFilter = academic_year ? `AND mi.academic_year = '${academic_year.replace(/'/g, "''")}'` : "";
    const jumuiyaStats = [];

    for (const name of JUMUIYA_NAMES) {
      const slug = JUMUIYA_SLUG_MAP[name];

      const totalResult = await pool.query(
        `SELECT COUNT(*)::int as total,
                SUM(CASE WHEN LOWER(m.gender) = 'male' THEN 1 ELSE 0 END)::int as male_count,
                SUM(CASE WHEN LOWER(m.gender) = 'female' THEN 1 ELSE 0 END)::int as female_count
         FROM members m
         LEFT JOIN sub_groups sg ON sg.name = $1
         WHERE m.jumuiya_id = sg.group_id
           AND (m.flagged_inactive IS NULL OR m.flagged_inactive = false)`,
        [name]
      );

      const csaResult = await pool.query(
        `SELECT COUNT(*)::int as total,
                SUM(CASE WHEN LOWER(m.gender) = 'male' THEN 1 ELSE 0 END)::int as male_count,
                SUM(CASE WHEN LOWER(m.gender) = 'female' THEN 1 ELSE 0 END)::int as female_count
         FROM members m
         LEFT JOIN sub_groups sg ON sg.name = $1
         LEFT JOIN member_imports mi ON mi.id = m.import_batch_id
         WHERE m.jumuiya_id = sg.group_id AND m.source = 'csa' ${yearFilter}
           AND (m.flagged_inactive IS NULL OR m.flagged_inactive = false)`,
        [name]
      );

      const tRow = totalResult.rows[0] || { total: 0, male_count: 0, female_count: 0 };
      const cRow = csaResult.rows[0] || { total: 0, male_count: 0, female_count: 0 };
      jumuiyaStats.push({
        slug,
        name,
        total: tRow.total,
        male_count: tRow.male_count,
        female_count: tRow.female_count,
        csa: cRow,
      });
    }

    const pendingResult = await pool.query(
      `SELECT COUNT(*)::int as total,
              SUM(CASE WHEN LOWER(m.gender) = 'male' THEN 1 ELSE 0 END)::int as male_count,
              SUM(CASE WHEN LOWER(m.gender) = 'female' THEN 1 ELSE 0 END)::int as female_count
       FROM members m
       LEFT JOIN member_imports mi ON mi.id = m.import_batch_id
       WHERE m.source = 'csa' AND m.jumuiya_id IS NULL ${yearFilter}`
    );

    res.json({
      status: "success",
      data: {
        jumuiyas: jumuiyaStats,
        pending: pendingResult.rows[0] || { total: 0, male_count: 0, female_count: 0 },
      },
    });
  } catch (error) {
    logger.error("csaGetJumuiyaStats error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/v1/jumuiya-members/csa/validate-members
 * Validate an array of members without saving to DB (client-side validation).
 */
export const csaValidateMembers = async (req, res) => {
  try {
    const { members } = req.body;
    if (!members || !Array.isArray(members)) {
      return res.status(400).json({ error: "members array is required" });
    }

    const dupErrors = await checkExistingDuplicates(members);

    const results = members.map((m, i) => {
      const validated = validateMemberRow(m);
      const dupes = dupErrors[i] || [];
      const allErrors = [...validated.errors, ...dupes];
      let status = validated.status;
      if (dupes.length > 0 && status !== "error") status = "warning";
      return {
        row: i,
        raw: validated.raw,
        cleaned: validated.cleaned,
        status,
        errors: allErrors,
        warnings: validated.warnings,
      };
    });

    const summary = {
      total: results.length,
      valid: results.filter(r => r.status === "valid").length,
      warning: results.filter(r => r.status === "warning").length,
      error: results.filter(r => r.status === "error").length,
    };

    res.json({ status: "success", data: { results, summary } });
  } catch (error) {
    logger.error("csaValidateMembers error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Per-jumuiya baseline counts used by the distribution algorithm.
 *
 *  - default ("jumuiya-balanced"): ALL active members count, so new members
 *    are spread to level total membership.
 *  - "equal-split": only already-placed CSA first-years count (source='csa').
 *    Existing / WhatsApp-registered members are ignored so an incomplete
 *    senior registration cannot skew the intake split. Multiple runs during
 *    the same admission week stay consistent because earlier CSA placements
 *    remain part of the baseline.
 */
const fetchDistributionBaselines = async (strategy, yearFilter) => {
  const isEqualSplit = strategy === "equal-split";
  const cohortWhere = isEqualSplit ? `AND m.source = 'csa'` : "";
  const cohortYearFilter = isEqualSplit ? yearFilter : "";

  const rows = [];
  for (const name of JUMUIYA_NAMES) {
    const totalResult = await pool.query(
      `SELECT COUNT(*)::int as total,
              SUM(CASE WHEN LOWER(m.gender) = 'male' THEN 1 ELSE 0 END)::int as male_count,
              SUM(CASE WHEN LOWER(m.gender) = 'female' THEN 1 ELSE 0 END)::int as female_count
       FROM members m
       LEFT JOIN sub_groups sg ON sg.name = $1
       LEFT JOIN member_imports mi ON mi.id = m.import_batch_id
       WHERE m.jumuiya_id = sg.group_id
         AND (m.flagged_inactive IS NULL OR m.flagged_inactive = false)
         ${cohortWhere}
         ${cohortYearFilter}`,
      [name]
    );
    rows.push({
      slug: JUMUIYA_SLUG_MAP[name],
      name,
      existing: {
        total: totalResult.rows[0]?.total || 0,
        male_count: totalResult.rows[0]?.male_count || 0,
        female_count: totalResult.rows[0]?.female_count || 0,
      },
      imported: { total: 0 },
    });
  }
  return rows;
};

/**
 * Gender-balanced distribution: distributes each gender independently
 * in two passes. Males are placed first (round-robin by lowest total,
 * tiebreak by lowest male count), then females are placed the same way.
 * This prevents the "all males first, then females" skew that causes
 * unequal gender distribution across jumuiyas.
 */
const distributeGenderBalanced = (members, jumuiyaSlots) => {
  const males = members.filter(m => m.gender === "Male");
  const females = members.filter(m => m.gender !== "Male");
  const assignments = [];

  const placeGroup = (group, isMale) => {
    for (const member of group) {
      const target = jumuiyaSlots
        .sort((a, b) => {
          const aScore = a.currentTotal + a.newCount;
          const bScore = b.currentTotal + b.newCount;
          if (aScore !== bScore) return aScore - bScore;
          const aGender = isMale ? a.maleCount : a.femaleCount;
          const bGender = isMale ? b.maleCount : b.femaleCount;
          return aGender - bGender;
        })[0];

      if (isMale) target.maleCount++;
      else target.femaleCount++;
      target.newCount++;

      assignments.push({
        member_id: member.id,
        member_name: member.name,
        member_gender: member.gender,
        target_slug: target.slug,
        target_name: target.name,
      });
    }
  };

  placeGroup(males, true);
  placeGroup(females, false);

  return assignments;
};

/**
 * POST /api/v1/jumuiya-members/csa/distribute-preview
 * Run the distribution algorithm and return preview (no DB writes).
 */
export const csaDistributePreview = async (req, res) => {
  try {
    const { academic_year, strategy } = req.body || {};
    const yearFilter = academic_year ? `AND mi.academic_year = '${academic_year.replace(/'/g, "''")}'` : "";

    const pendingResult = await pool.query(
      `SELECT m.member_id as id,
              CONCAT_WS(' ', m.first_name, m.last_name) as name,
              m.gender
       FROM members m
       LEFT JOIN member_imports mi ON mi.id = m.import_batch_id
       WHERE m.source = 'csa' AND m.jumuiya_id IS NULL ${yearFilter}
       ORDER BY m.first_name`
    );

    if (!pendingResult.rows.length) {
      return res.status(400).json({ error: "No pending members to distribute" });
    }

    const jumuiyaRows = await fetchDistributionBaselines(strategy, yearFilter);

    const members = pendingResult.rows;
    const jumuiyaSlots = jumuiyaRows.map(j => ({
      ...j,
      currentTotal: j.existing.total,
      maleCount: j.existing.male_count,
      femaleCount: j.existing.female_count,
      newCount: 0,
    }));

    const assignments = distributeGenderBalanced(members, jumuiyaSlots);

    const summary = {
      totalMembers: members.length,
      maleCount: members.filter(m => m.gender === "Male").length,
      femaleCount: members.filter(m => m.gender === "Female").length,
      perJumuiya: jumuiyaSlots.map(j => ({
        slug: j.slug,
        name: j.name,
        existingTotal: j.existing.total,
        newMembers: j.newCount,
        newTotal: j.existing.total + j.newCount,
      })),
    };

    res.json({ status: "success", data: { assignments, summary, strategy: strategy === "equal-split" ? "equal-split" : "jumuiya-balanced" } });
  } catch (error) {
    logger.error("csaDistributePreview error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/v1/jumuiya-members/csa/distribute
 * Execute distribution: assign pending members to Jumuiyas.
 */
export const csaDistributeMembers = async (req, res) => {
  try {
    const { strategy, academic_year } = req.body;
    const yearFilter = academic_year ? `AND mi.academic_year = '${academic_year.replace(/'/g, "''")}'` : "";

    const pendingResult = await pool.query(
      `SELECT m.member_id as id,
              CONCAT_WS(' ', m.first_name, m.last_name) as name,
              m.gender
       FROM members m
       LEFT JOIN member_imports mi ON mi.id = m.import_batch_id
       WHERE m.source = 'csa' AND m.jumuiya_id IS NULL ${yearFilter}
       ORDER BY m.first_name`
    );

    if (!pendingResult.rows.length) {
      return res.status(400).json({ error: "No pending members to distribute" });
    }

    const jumuiyaRows = await fetchDistributionBaselines(strategy, yearFilter);

    const members = pendingResult.rows;
    const jumuiyaSlots = jumuiyaRows.map(j => ({
      slug: j.slug,
      name: j.name,
      currentTotal: j.existing?.total || 0,
      maleCount: j.existing?.male_count || 0,
      femaleCount: j.existing?.female_count || 0,
      newCount: 0,
    }));

    const assignments = distributeGenderBalanced(members, jumuiyaSlots);

    for (const a of assignments) {
      await pool.query(
        `UPDATE import_records SET cleaned_jumuiya = $1 WHERE cleaned_reg_number = $2`,
        [a.target_name, a.member_id]
      );
      await pool.query(
        `UPDATE members SET jumuiya_id = sg.group_id
         FROM sub_groups sg
         WHERE members.member_id = $1 AND sg.name = $2`,
        [a.member_id, a.target_name]
      );
    }

    const summary = {
      totalMembers: members.length,
      maleCount: members.filter(m => m.gender === "Male").length,
      femaleCount: members.filter(m => m.gender === "Female").length,
      perJumuiya: jumuiyaSlots.map(j => ({
        slug: j.slug,
        name: j.name,
        existingTotal: j.currentTotal - j.newCount,
        newMembers: j.newCount,
        newTotal: j.currentTotal,
      })),
    };

    await pool.query(
      `INSERT INTO distribution_history (jumuiya_id, algorithm_used, stats)
       VALUES ($1, $2, $3)`,
      ["csa", strategy || "jumuiya-balanced", JSON.stringify(summary)]
    );

    res.status(200).json({
      status: "success",
      data: {
        assignments,
        summary,
        message: `Distributed ${assignments.length} members across 7 Jumuiyas`,
      },
    });
  } catch (error) {
    logger.error("csaDistributeMembers error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Compute a balanced distribution for pending CSA members.
 * (Reuses the same algorithm as csaDistributePreview.)
 */
const computeDistributionPlan = async (academicYear, strategy) => {
  const yearFilter = academicYear ? `AND mi.academic_year = '${academicYear.replace(/'/g, "''")}'` : "";

  const pendingResult = await pool.query(
    `SELECT m.member_id as id,
            CONCAT_WS(' ', m.first_name, m.last_name) as name,
            m.gender
     FROM members m
     LEFT JOIN member_imports mi ON mi.id = m.import_batch_id
     WHERE m.source = 'csa' AND m.jumuiya_id IS NULL ${yearFilter}
     ORDER BY m.first_name`
  );

  if (!pendingResult.rows.length) return null;

  const jumuiyaRows = await fetchDistributionBaselines(strategy, yearFilter);

  const members = pendingResult.rows;
  const slots = jumuiyaRows.map(j => ({
    slug: j.slug, name: j.name,
    currentTotal: j.existing?.total || 0,
    maleCount: j.existing?.male_count || 0,
    femaleCount: j.existing?.female_count || 0,
    newCount: 0,
  }));

  const assignments = distributeGenderBalanced(members, slots);

  const perJumuiya = slots.map(s => ({
    slug: s.slug, name: s.name,
    existingTotal: s.currentTotal,
    newMembers: s.newCount,
    newTotal: s.currentTotal + s.newCount,
  }));

  return { assignments, perJumuiya, members, slots };
};

/**
 * POST /api/v1/jumuiya-members/csa/submit-for-approval
 * Create a distribution batch with pending allocations for coordinator approval.
 */
export const csaSubmitForApproval = async (req, res) => {
  try {
    const { academic_year, strategy } = req.body || {};
    const plan = await computeDistributionPlan(academic_year, strategy);
    if (!plan) return res.status(400).json({ error: "No pending members to distribute" });

    const batchResult = await pool.query(
      `INSERT INTO distribution_batches (academic_year, created_by, status)
       VALUES ($1, $2, 'pending_approval') RETURNING *`,
      [academic_year || null, req.user?.id || null]
    );
    const batchId = batchResult.rows[0].id;

    for (const a of plan.assignments) {
      await pool.query(
        `INSERT INTO allocation_approvals (distribution_batch_id, member_id, target_jumuiya, status)
         VALUES ($1, $2, $3, 'pending')`,
        [batchId, a.member_id, a.target_name]
      );
    }

    const summary = {
      totalMembers: plan.members.length,
      maleCount: plan.members.filter(m => m.gender === "Male").length,
      femaleCount: plan.members.filter(m => m.gender === "Female").length,
      perJumuiya: plan.perJumuiya,
    };

    res.status(201).json({
      status: "success",
      data: { batch: batchResult.rows[0], assignments: plan.assignments, summary },
    });
  } catch (error) {
    logger.error("csaSubmitForApproval error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/jumuiya-members/csa/approvals/:jumuiya_id
 * Get pending/approved/rejected allocations for a specific jumuiya (coordinator view).
 */
export const csaGetApprovals = async (req, res) => {
  try {
    const { jumuiya_id } = req.params;
    const slugToName = {
      "st-anthony": "St. Anthony", "st-augustine": "St. Augustine",
      "st-catherine": "St. Catherine", "st-dominic": "St. Dominic",
      "st-elizabeth": "St. Elizabeth", "st-maria-goretti": "St. Maria Goretti",
      "st-monica": "St. Monica",
    };
    const jumuiyaName = slugToName[jumuiya_id];
    if (!jumuiyaName) return res.status(400).json({ error: "Invalid jumuiya_id" });

    const result = await pool.query(
      `SELECT aa.id, aa.status, aa.rejection_reason, aa.reviewed_at,
              aa.distribution_batch_id,
              aa.member_id as import_record_id,
              CONCAT_WS(' ', m.first_name, m.last_name) as name,
              m.member_id as reg_number,
              m.gender, m.phone, m.email,
              mi.academic_year
       FROM allocation_approvals aa
       LEFT JOIN members m ON m.member_id = aa.member_id
       LEFT JOIN member_imports mi ON mi.id = m.import_batch_id
       JOIN distribution_batches db ON db.id = aa.distribution_batch_id
       WHERE aa.target_jumuiya = $1 AND db.status IN ('pending_approval', 'partially_approved')
       ORDER BY aa.created_at DESC`,
      [jumuiyaName]
    );

    res.json({
      status: "success",
      data: { jumuiya: jumuiyaName, approvals: result.rows, total: result.rows.length },
    });
  } catch (error) {
    logger.error("csaGetApprovals error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /api/v1/jumuiya-members/csa/approvals/:id/review
 * Approve or reject a single allocation.
 */
export const csaReviewApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
    }

    const existing = await pool.query(
      `SELECT aa.*, db.status as batch_status FROM allocation_approvals aa
       JOIN distribution_batches db ON db.id = aa.distribution_batch_id
       WHERE aa.id = $1`,
      [id]
    );
    if (!existing.rows.length) return res.status(404).json({ error: "Allocation not found" });
    if (existing.rows[0].batch_status === "finalized") {
      return res.status(400).json({ error: "This distribution batch has already been finalized" });
    }

    await pool.query(
      `UPDATE allocation_approvals SET status = $1, reviewed_by = $2, reviewed_at = NOW(),
              rejection_reason = $3 WHERE id = $4`,
      [status, req.user?.id || null, rejection_reason || null, id]
    );

    // Update batch status if needed
    const batchId = existing.rows[0].distribution_batch_id;
    const counts = await pool.query(
      `SELECT COUNT(*)::int as total,
              COUNT(*) FILTER (WHERE status = 'approved')::int as approved,
              COUNT(*) FILTER (WHERE status = 'rejected')::int as rejected,
              COUNT(*) FILTER (WHERE status = 'pending')::int as pending
       FROM allocation_approvals WHERE distribution_batch_id = $1`,
      [batchId]
    );
    const c = counts.rows[0];
    let newBatchStatus = "pending_approval";
    if (c.pending === 0 && c.rejected > 0) newBatchStatus = "partially_approved";
    if (c.pending === 0 && c.rejected === 0) newBatchStatus = "all_approved";
    if (c.pending === 0 && c.rejected > 0) newBatchStatus = "partially_approved";
    if (c.pending === 0) newBatchStatus = c.rejected > 0 ? "partially_approved" : "all_approved";

    await pool.query(`UPDATE distribution_batches SET status = $1 WHERE id = $2`, [newBatchStatus, batchId]);

    res.json({ status: "success", data: { id: parseInt(id), status, batch_status: newBatchStatus } });
  } catch (error) {
    logger.error("csaReviewApproval error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/v1/jumuiya-members/csa/approvals/:jumuiya_id/batch-review
 * Approve or reject all pending allocations for a jumuiya at once.
 */
export const csaBatchReviewApprovals = async (req, res) => {
  try {
    const { jumuiya_id } = req.params;
    const { status, rejection_reason } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
    }

    const slugToName = {
      "st-anthony": "St. Anthony", "st-augustine": "St. Augustine",
      "st-catherine": "St. Catherine", "st-dominic": "St. Dominic",
      "st-elizabeth": "St. Elizabeth", "st-maria-goretti": "St. Maria Goretti",
      "st-monica": "St. Monica",
    };
    const jumuiyaName = slugToName[jumuiya_id];
    if (!jumuiyaName) return res.status(400).json({ error: "Invalid jumuiya_id" });

    const result = await pool.query(
      `UPDATE allocation_approvals aa
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), rejection_reason = $3
       FROM distribution_batches db
       WHERE aa.distribution_batch_id = db.id
         AND aa.target_jumuiya = $4
         AND aa.status = 'pending'
         AND db.status IN ('pending_approval', 'partially_approved')
       RETURNING aa.distribution_batch_id`,
      [status, req.user?.id || null, rejection_reason || null, jumuiyaName]
    );

    // Update batch statuses
    const updatedBatchIds = [...new Set(result.rows.map(r => r.distribution_batch_id))];
    for (const batchId of updatedBatchIds) {
      const counts = await pool.query(
        `SELECT COUNT(*)::int as total,
                COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
                COUNT(*) FILTER (WHERE status = 'rejected')::int as rejected
         FROM allocation_approvals WHERE distribution_batch_id = $1`,
        [batchId]
      );
      const c = counts.rows[0];
      let newStatus = "pending_approval";
      if (c.pending === 0) newStatus = c.rejected > 0 ? "partially_approved" : "all_approved";
      await pool.query(`UPDATE distribution_batches SET status = $1 WHERE id = $2`, [newStatus, batchId]);
    }

    res.json({
      status: "success",
      data: { updated: result.rowCount, jumuiya: jumuiyaName, batch_status: result.rowCount > 0 ? "reviewed" : "none_pending" },
    });
  } catch (error) {
    logger.error("csaBatchReviewApprovals error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/jumuiya-members/csa/approval-status/:batchId
 * Get approval status across all jumuiyas for a distribution batch (admin view).
 */
export const csaGetApprovalStatus = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await pool.query(`SELECT * FROM distribution_batches WHERE id = $1`, [batchId]);
    if (!batch.rows.length) return res.status(404).json({ error: "Batch not found" });

    const jumuiyaStatus = await pool.query(
      `SELECT aa.target_jumuiya as name,
              COUNT(*)::int as total,
              COUNT(*) FILTER (WHERE aa.status = 'pending')::int as pending,
              COUNT(*) FILTER (WHERE aa.status = 'approved')::int as approved,
              COUNT(*) FILTER (WHERE aa.status = 'rejected')::int as rejected
       FROM allocation_approvals aa
       WHERE aa.distribution_batch_id = $1
       GROUP BY aa.target_jumuiya
       ORDER BY aa.target_jumuiya`,
      [batchId]
    );

    const summary = {
      total: jumuiyaStatus.rows.reduce((s, r) => s + parseInt(r.total), 0),
      approved: jumuiyaStatus.rows.reduce((s, r) => s + parseInt(r.approved), 0),
      rejected: jumuiyaStatus.rows.reduce((s, r) => s + parseInt(r.rejected), 0),
      pending: jumuiyaStatus.rows.reduce((s, r) => s + parseInt(r.pending), 0),
    };

    res.json({
      status: "success",
      data: { batch: batch.rows[0], jumuiyas: jumuiyaStatus.rows, summary },
    });
  } catch (error) {
    logger.error("csaGetApprovalStatus error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/jumuiya-members/csa/approval-status/active
 * Return all non-finalized distribution batches.
 */
export const csaGetActiveBatches = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT db.*,
        (SELECT COUNT(*) FROM allocation_approvals aa WHERE aa.distribution_batch_id = db.id) as total_allocations,
        (SELECT COUNT(*) FROM allocation_approvals aa WHERE aa.distribution_batch_id = db.id AND aa.status = 'approved') as approved_count,
        (SELECT COUNT(*) FROM allocation_approvals aa WHERE aa.distribution_batch_id = db.id AND aa.status = 'pending') as pending_count,
        (SELECT COUNT(*) FROM allocation_approvals aa WHERE aa.distribution_batch_id = db.id AND aa.status = 'rejected') as rejected_count
       FROM distribution_batches db
       WHERE db.status IN ('pending_approval', 'partially_approved', 'all_approved')
       ORDER BY db.created_at DESC`
    );
    res.json({ status: "success", data: { batches: result.rows } });
  } catch (error) {
    logger.error("csaGetActiveBatches error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/v1/jumuiya-members/csa/finalize/:batchId
 * Finalize a distribution batch: commit approved allocations to import_records.
 */
export const csaFinalizeDistribution = async (req, res) => {
  try {
    const { batchId } = req.params;

    const finalized = await withTransaction(async (tx) => {
      const batch = await tx.query(`SELECT * FROM distribution_batches WHERE id = $1`, [batchId]);
      if (!batch.rows.length) throw Object.assign(new Error("Batch not found"), { statusCode: 404 });
      if (batch.rows[0].status === "finalized") throw Object.assign(new Error("Already finalized"), { statusCode: 400 });

      // Auto-approve any remaining pending allocations so admin can finalize in one click
      await tx.query(
        `UPDATE allocation_approvals SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
         WHERE distribution_batch_id = $2 AND status = 'pending'`,
        [req.user?.id || null, batchId]
      );

      // Get all approved allocations in this batch
      const approved = await tx.query(
        `SELECT aa.member_id, aa.target_jumuiya
         FROM allocation_approvals aa
         WHERE aa.distribution_batch_id = $1 AND aa.status = 'approved'`,
        [batchId]
      );

      const approvedRows = approved.rows;

      // Sequential awaits on the SAME transaction client (Promise.all would
      // interleave statements on a single connection and break atomicity).
      for (const a of approvedRows) {
        await tx.query(
          `UPDATE import_records SET cleaned_jumuiya = $1 WHERE cleaned_reg_number = $2`,
          [a.target_jumuiya, a.member_id]
        );
        await tx.query(
          `UPDATE members SET jumuiya_id = sg.group_id
           FROM sub_groups sg
           WHERE members.member_id = $1 AND sg.name = $2`,
          [a.member_id, a.target_jumuiya]
        );
      }

      await tx.query(
        `UPDATE distribution_batches SET status = 'finalized', finalized_at = NOW() WHERE id = $1`,
        [batchId]
      );

      // Record distribution history
      const summary = {
        totalMembers: approvedRows.length,
        finalizedAt: new Date().toISOString(),
      };
      await tx.query(
        `INSERT INTO distribution_history (jumuiya_id, algorithm_used, stats)
         VALUES ($1, $2, $3)`,
        ["csa", "coordinator-approval", JSON.stringify(summary)]
      );

      return approvedRows.length;
    });

    res.json({
      status: "success",
      data: {
        finalized,
        batch_id: parseInt(batchId),
        message: finalized > 0
          ? `Finalized ${finalized} member(s) across Jumuiyas`
          : "No approved allocations — batch finalized with 0 members",
      },
    });
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 400) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    logger.error("csaFinalizeDistribution error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/jumuiya-members/csa/jumuiya-list/:jumuiya_id
 * Get the list of members allocated (and approved) to a specific jumuiya, for printing.
 */
export const csaGetJumuiyaMemberList = async (req, res) => {
  try {
    let { jumuiya_id } = req.params;
    const { batch_id, academic_year } = req.query;

    const resolved = await resolveJumuiyaInput(jumuiya_id);
    if (!resolved) return res.status(400).json({ error: "Invalid jumuiya_id" });

    let query = `
      SELECT CONCAT_WS(' ', m.first_name, m.last_name) as name,
             m.member_id as reg_number,
             m.gender, m.phone, m.email,
             mi.academic_year,
             aa.status as allocation_status
      FROM allocation_approvals aa
      LEFT JOIN members m ON m.member_id = aa.member_id
      LEFT JOIN member_imports mi ON mi.id = m.import_batch_id
      JOIN distribution_batches db ON db.id = aa.distribution_batch_id
      WHERE aa.target_jumuiya = $1 AND aa.status = 'approved'
        AND db.status = 'finalized'
    `;
    const params = [resolved.name];
    let paramIdx = 2;

    if (batch_id) {
      query += ` AND aa.distribution_batch_id = $${paramIdx++}`;
      params.push(batch_id);
    }
    if (academic_year) {
      query += ` AND mi.academic_year = $${paramIdx++}`;
      params.push(academic_year);
    }

    query += ` ORDER BY m.first_name`;

    const result = await pool.query(query, params);

    res.json({
      status: "success",
      data: { jumuiya: resolved.name, members: result.rows, total: result.rows.length },
    });
  } catch (error) {
    logger.error("csaGetJumuiyaMemberList error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/jumuiya-members/:jumuiya_id/csa-allocations
 * Returns import_records assigned to this jumuiya via CSA distribution.
 */
export const getCsaAllocations = async (req, res) => {
  try {
    let { jumuiya_id } = req.params;
    const { academic_year } = req.query;

    const resolved = await resolveJumuiyaInput(jumuiya_id);
    if (!resolved) return res.status(400).json({ error: "Invalid jumuiya_id" });

    const yearFilter = academic_year ? `AND mi.academic_year = '${academic_year.replace(/'/g, "''")}'` : "";

    const result = await pool.query(
      `SELECT m.member_id as id,
              CONCAT_WS(' ', m.first_name, m.last_name) as name,
              m.member_id as reg_number,
              m.gender, m.phone, m.email,
              m.status,
              mi.academic_year, mi.import_date
       FROM members m
       LEFT JOIN member_imports mi ON mi.id = m.import_batch_id
       LEFT JOIN sub_groups sg ON sg.name = $1
       WHERE m.source = 'csa'
         AND m.jumuiya_id = sg.group_id
         ${yearFilter}
       ORDER BY m.first_name`,
      [resolved.name]
    );

    res.json({
      status: "success",
      data: {
        jumuiya: resolved.name,
        members: result.rows,
        total: result.rows.length,
      },
    });
  } catch (error) {
    logger.error("getCsaAllocations error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/jumuiya-members/csa/rejected-members
 * Return all members that were rejected during coordinator approval in finalized batches.
 */
export const csaGetRejectedMembers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.member_id as id, m.import_batch_id as import_id,
              CONCAT_WS(' ', m.first_name, m.last_name) as name,
              m.member_id as reg_number,
              m.gender, m.phone, m.email,
              m.status,
              aa.rejection_reason, aa.reviewed_at,
              aa.distribution_batch_id as batch_id,
              mi.academic_year
       FROM allocation_approvals aa
       LEFT JOIN members m ON m.member_id = aa.member_id
       LEFT JOIN member_imports mi ON mi.id = m.import_batch_id
       WHERE aa.status = 'rejected'
         AND aa.distribution_batch_id IN (SELECT id FROM distribution_batches WHERE status = 'finalized')
         AND m.jumuiya_id IS NULL
       ORDER BY aa.reviewed_at DESC`
    );
    res.json({ status: "success", data: result.rows });
  } catch (error) {
    logger.error("csaGetRejectedMembers error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /api/v1/jumuiya-members/csa/rejected-members/:id
 * Edit a rejected member's data and/or assign them to a jumuiya directly.
 */
export const csaUpdateRejectedMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, reg_number, gender, phone, email, assign_jumuiya } = req.body;

    const existing = await pool.query(
      `SELECT aa.member_id, m.member_id, m.import_batch_id
       FROM allocation_approvals aa
       LEFT JOIN members m ON m.member_id = aa.member_id
       WHERE aa.member_id = $1 AND aa.status = 'rejected'
         AND aa.distribution_batch_id IN (SELECT id FROM distribution_batches WHERE status = 'finalized')`,
      [id]
    );
    if (!existing.rows.length) return res.status(404).json({ error: "Rejected member not found" });

    const memUpdates = [];
    const irUpdates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      const parts = name.split(" ");
      memUpdates.push(`first_name = $${idx++}`); values.push(parts[0] || "");
      memUpdates.push(`last_name = $${idx++}`); values.push(parts.slice(1).join(" ") || parts[0] || "");
      irUpdates.push(`cleaned_name = $${idx++}`); values.push(name);
    }
    if (reg_number !== undefined) { memUpdates.push(`member_id = $${idx++}`); values.push(reg_number); }
    if (gender !== undefined) { memUpdates.push(`gender = $${idx++}`); values.push(gender); irUpdates.push(`cleaned_gender = $${idx++}`); values.push(gender); }
    if (phone !== undefined) { memUpdates.push(`phone = $${idx++}`); values.push(phone); irUpdates.push(`cleaned_phone = $${idx++}`); values.push(phone); }
    if (email !== undefined) { memUpdates.push(`email = $${idx++}`); values.push(email); irUpdates.push(`cleaned_email = $${idx++}`); values.push(email); }

    if (assign_jumuiya !== undefined) {
      const nameGuess = assign_jumuiya.split("-").map(w => {
        if (w.toLowerCase() === "st") return "St.";
        return w.charAt(0).toUpperCase() + w.slice(1);
      }).join(" ");
      const sgRes = await pool.query(`SELECT group_id FROM sub_groups WHERE LOWER(name) = LOWER($1)`, [nameGuess]);
      if (sgRes.rows.length) {
        memUpdates.push(`jumuiya_id = $${idx++}`); values.push(sgRes.rows[0].group_id);
        irUpdates.push(`cleaned_jumuiya = $${idx++}`); values.push(nameGuess);
      }
    }

    if (!memUpdates.length) return res.status(400).json({ error: "No fields to update" });

    values.push(id);
    await pool.query(`UPDATE members SET ${memUpdates.join(", ")} WHERE member_id = $${idx}`, values);

    if (irUpdates.length > 0) {
      const irVals = values.slice(0, -1);
      irVals.push(id);
      await pool.query(`UPDATE import_records SET ${irUpdates.join(", ")} WHERE cleaned_reg_number = $${irVals.length}`, irVals);
    }

    if (reg_number !== undefined && reg_number !== id) {
      await pool.query(`UPDATE allocation_approvals SET member_id = $1 WHERE member_id = $2`, [reg_number, id]);
      await pool.query(`UPDATE import_records SET cleaned_reg_number = $1 WHERE cleaned_reg_number = $2`, [reg_number, id]);
    }

    res.json({ status: "success", message: "Rejected member updated" });
  } catch (error) {
    logger.error("csaUpdateRejectedMember error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/v1/jumuiya-members/csa/rejected-members/:id
 * Permanently delete a rejected member from the system.
 */
export const csaDeleteRejectedMember = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      `SELECT aa.member_id FROM allocation_approvals aa
       WHERE aa.member_id = $1 AND aa.status = 'rejected'
         AND aa.distribution_batch_id IN (SELECT id FROM distribution_batches WHERE status = 'finalized')`,
      [id]
    );
    if (!existing.rows.length) return res.status(404).json({ error: "Rejected member not found" });

    await pool.query(`DELETE FROM allocation_approvals WHERE member_id = $1`, [id]);
    await pool.query(`DELETE FROM import_records WHERE cleaned_reg_number = $1`, [id]);
    await pool.query(`DELETE FROM members WHERE member_id = $1`, [id]);

    res.json({ status: "success", data: { message: "Member deleted permanently" } });
  } catch (error) {
    logger.error("csaDeleteRejectedMember error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/jumuiya-members/lookup/reg-number/:search
 * Search members by middle digits or partial registration number.
 */
export const lookupMemberByRegNumber = async (req, res) => {
  try {
    const search = req.query.search || req.params.search;
    if (!search || search.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Search must be at least 2 characters" });
    }

    const s = search.trim();
    const result = await pool.query(
      `SELECT m.member_id, m.first_name, m.last_name, m.gender, m.phone, m.email,
              m.year_of_study, m.course,
              m.sem_1_reg, m.sem_2_reg, m.sem_3_reg, m.sem_4_reg,
              m.sem_5_reg, m.sem_6_reg, m.sem_7_reg, m.sem_8_reg,
              sg.group_id::text as jumuiya_id, sg.name as jumuiya_name,
              LOWER(REPLACE(REPLACE(sg.name, '.', ''), ' ', '-')) as jumuiya_slug
       FROM members m
       LEFT JOIN sub_groups sg ON m.jumuiya_id = sg.group_id
       WHERE m.member_id LIKE '%/' || $1 || '/%'
          OR m.member_id ILIKE $2
          OR m.first_name ILIKE $2
          OR m.last_name ILIKE $2
       ORDER BY m.member_id
       LIMIT 10`,
      [s, `%${s}%`]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error("lookupMemberByRegNumber error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/v1/jumuiya-members/:member_id
 * Update a single member's fields.
 */
export const updateMember = async (req, res) => {
  try {
    const { member_id } = req.params;
    const allowed = ["first_name", "last_name", "gender", "course", "phone", "year_of_study"];
    const updates = [];
    const values = [];
    let idx = 1;

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        values.push(req.body[field]);
      }
    }

    if (!updates.length) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    values.push(member_id);
    const result = await pool.query(
      `UPDATE members SET ${updates.join(", ")} WHERE member_id = $${idx} RETURNING member_id, first_name, last_name, gender, course, phone, year_of_study`,
      values
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.json({ status: "success", data: result.rows[0] });
  } catch (error) {
    logger.error("updateMember error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /api/v1/jumuiya-members/:member_id/flag
 * Toggle the flagged_inactive status of a member.
 */
export const flagMember = async (req, res) => {
  try {
    const member_id = req.query.member_id || req.params.member_id;
    const { flagged } = req.body;

    if (typeof flagged !== "boolean") {
      return res.status(400).json({ error: "flagged must be a boolean" });
    }

    const result = await pool.query(
      `UPDATE members SET flagged_inactive = $1 WHERE member_id = $2 RETURNING member_id, flagged_inactive`,
      [flagged, member_id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.json({ status: "success", data: result.rows[0] });
  } catch (error) {
    logger.error("flagMember error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
