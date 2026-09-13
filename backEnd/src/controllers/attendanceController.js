// src/controllers/attendanceController.js
// Attendance Tally & Analytics (Jumuiya Coordinator role)
import { testDb as pool, withTransaction } from "../Configs/dbConfig.js";
import ExcelJS from "exceljs";
import { getCurrentSemester, isDateInSemester } from "../utils/semesterConfig.js";

// Tally days: Monday (rosary), Wednesday (bible study), Thursday (rosary).
// JS getUTCDay(): 0=Sun ... 6=Sat
const TALLY_DAYS = {
  1: { type: "rosary", label: "Monday Rosary" },
  3: { type: "bible_study", label: "Wednesday Bible Study" },
  4: { type: "rosary", label: "Thursday Rosary" },
};
const NOVENA_DAYS = 9;
const MS_PER_DAY = 86400000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// The tally module tracks the 7 SCC jumuiyas only. St. Thomas Aquinas is the 8th
// sub_group but is intentionally excluded from tallies, analytics, and history.
const EXCLUDED_JUMUIYA_SLUGS = ["st-thomas"];
const RECORDED_ROLES = new Set(["coordinator", "assistant"]);

// Year-of-study tallies (alternative to per-jumuiya tallies).
const YEARS = ["1", "2", "3", "4"];
const YEAR_COLORS = { 1: "#0ea5e9", 2: "#10b981", 3: "#f59e0b", 4: "#8b5cf6" };
const YEAR_WORDS = { one: 1, two: 2, three: 3, four: 4, first: 1, second: 2, third: 3, fourth: 4 };
const DIMENSIONS = new Set(["jumuiya", "year"]);
const yearLabel = (y) => `Year ${y}`;

// Normalize an incoming year-of-study value to "1".."4" (or null).
const normalizeYear = (v) => {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (/^[1-4]$/.test(s)) return s;
  if (YEAR_WORDS[s]) return String(YEAR_WORDS[s]);
  return null;
};

// Current academic start year (August-based: the first-year intake arrives at
// the end of August, so cohorts roll up from month >= 8).
const academicStartYear = () => {
  const now = new Date();
  return now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;
};

// Bucket a member into Year 1-4 using their stored year_of_study
// (number, word, or "YYYY-YYYY" admission range) or, as a fallback, the
// admission year embedded in their registration number.
const deriveYearOfStudy = (memberId, stored) => {
  const fromAdmission = (admission) => {
    const n = academicStartYear() - admission + 1;
    return n >= 1 ? (n > 4 ? "4" : String(n)) : null;
  };
  if (stored != null) {
    const s = String(stored).trim().toLowerCase();
    if (/^[1-4]$/.test(s)) return s;
    if (YEAR_WORDS[s]) return String(YEAR_WORDS[s]);
    const range = s.match(/^(\d{4})\s*-\s*(\d{4})$/);
    if (range) {
      const n = fromAdmission(parseInt(range[1], 10));
      if (n) return n;
    }
  }
  const rm = String(memberId || "").match(/(\d{2})\s*$/);
  if (rm) {
    const admission = 2000 + parseInt(rm[1], 10);
    const n = fromAdmission(admission);
    if (n) return n;
  }
  return null;
};

// Local server date (not UTC) so late-evening/early-morning saves aren't misjudged.
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const normalizeDate = (str) => {
  if (typeof str !== "string" || !DATE_RE.test(str)) return null;
  const [y, m, d] = str.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return str;
};

const daysBetween = (from, to) =>
  Math.round((new Date(to + "T00:00:00Z") - new Date(from + "T00:00:00Z")) / MS_PER_DAY);

const addDays = (dateStr, days) => {
  const dt = new Date(dateStr + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
};

// Resolve what the tally activity is for a given date (single source of truth).
const getActivityForDate = async (date) => {
  // Past dates keep their novena tally status even after the novena window closes,
  // so missed novena days can be backfilled. Today/future only counts running novenas.
  const isPast = date < todayStr();
  const novenaRes = await pool.query(
    `SELECT id, to_char(start_date, 'YYYY-MM-DD') AS start_date,
            to_char(end_date, 'YYYY-MM-DD') AS end_date
     FROM novena_schedules
     WHERE ${isPast ? "" : "is_active = true AND "} $1 BETWEEN start_date AND end_date
     ORDER BY start_date DESC
     LIMIT 1`,
    [date]
  );

  if (novenaRes.rows.length > 0) {
    const novena = novenaRes.rows[0];
    const dayIndex = Math.max(
      1,
      Math.min(NOVENA_DAYS, daysBetween(novena.start_date, date) + 1)
    );
    return {
      isTallyDay: true,
      activityType: "novena",
      activityLabel: `Novena Day ${dayIndex} of ${NOVENA_DAYS}`,
      novena: {
        id: novena.id,
        start_date: novena.start_date,
        end_date: novena.end_date,
        day: dayIndex,
        total_days: NOVENA_DAYS,
      },
    };
  }

  const dow = new Date(date + "T00:00:00Z").getUTCDay();
  const entry = TALLY_DAYS[dow];
  if (!entry) {
    return { isTallyDay: false, activityType: null, activityLabel: null, novena: null };
  }
  return { isTallyDay: true, activityType: entry.type, activityLabel: entry.label, novena: null };
};

const getMemberCounts = async () => {
  const result = await pool.query(
    `SELECT jumuiya_id,
            COUNT(*)::int AS total_members,
            COUNT(*) FILTER (WHERE (flagged_inactive IS NULL OR flagged_inactive = false))::int AS active_members
     FROM members
     WHERE jumuiya_id IS NOT NULL
       AND (migrated_to_associates IS NULL OR migrated_to_associates = false)
     GROUP BY jumuiya_id`
  );
  const map = {};
  for (const row of result.rows) {
    map[row.jumuiya_id] = {
      total_members: row.total_members,
      active_members: row.active_members,
    };
  }
  return map;
};

// Active/total members per Year of Study (1-4), restricted to the 7 SCC
// jumuiyas (same universe as the tally module).
const getYearCounts = async () => {
  const result = await pool.query(
    `SELECT m.member_id, m.year_of_study, m.flagged_inactive
     FROM members m
     WHERE m.jumuiya_id IN (SELECT group_id FROM sub_groups WHERE slug <> ALL($1))
       AND (m.migrated_to_associates IS NULL OR m.migrated_to_associates = false)`,
    [EXCLUDED_JUMUIYA_SLUGS]
  );
  const map = { 1: { total_members: 0, active_members: 0 }, 2: { total_members: 0, active_members: 0 }, 3: { total_members: 0, active_members: 0 }, 4: { total_members: 0, active_members: 0 } };
  for (const row of result.rows) {
    const y = deriveYearOfStudy(row.member_id, row.year_of_study);
    if (y && map[y]) {
      map[y].total_members += 1;
      if (row.flagged_inactive == null || row.flagged_inactive === false) {
        map[y].active_members += 1;
      }
    }
  }
  return map;
};

// Secretary register is the authoritative per-member source: present count per jumuiya for a date.
const getRegisterPresentMap = async (date) => {
  const result = await pool.query(
    `SELECT jumuiya_id, COUNT(*) FILTER (WHERE present)::int AS present_count
     FROM jumuiya_attendance
     WHERE attendance_date = $1
     GROUP BY jumuiya_id`,
    [date]
  );
  const map = {};
  for (const row of result.rows) map[row.jumuiya_id] = row.present_count;
  return map;
};

const safeRate = (attendance, members, tallyDays) => {
  const denom = members * tallyDays;
  return denom > 0 ? attendance / denom : 0;
};

export const getTallyContext = async (req, res) => {
  try {
    const date = normalizeDate(req.query.date) || todayStr();
    const ctx = await getActivityForDate(date);

    const [sgResult, memberCounts, yearCounts, registerMap, activeNovenas, semester] = await Promise.all([
      pool.query(
        `SELECT group_id, name, slug, color FROM sub_groups
         WHERE slug <> ALL($1)
         ORDER BY name`,
        [EXCLUDED_JUMUIYA_SLUGS]
      ),
      getMemberCounts(),
      getYearCounts(),
      getRegisterPresentMap(date),
      pool.query(
        `SELECT id, to_char(start_date, 'YYYY-MM-DD') AS start_date,
                to_char(end_date, 'YYYY-MM-DD') AS end_date
         FROM novena_schedules
         WHERE is_active = true
         ORDER BY start_date ASC
         LIMIT 20`
      ),
      getCurrentSemester(),
    ]);

    const inSemester = isDateInSemester(date, semester);
    const hasExisting = ctx.isTallyDay ? await pool.query(
      `SELECT 1 FROM attendance_tallies WHERE tally_date = $1 LIMIT 1`, [date]
    ) : { rows: [] };
    const canSave = ctx.isTallyDay && (inSemester || hasExisting.rows.length > 0);

    const jumuiyas = sgResult.rows.map((row) => {
      const counts = memberCounts[row.group_id] || { total_members: 0, active_members: 0 };
      const registerCount = registerMap[row.group_id];
      return {
        ...row,
        ...counts,
        register_status: registerCount == null ? "missing" : "recorded",
        register_count: registerCount == null ? null : registerCount,
      };
    });

    const years = YEARS.map((y) => {
      const counts = yearCounts[y] || { total_members: 0, active_members: 0 };
      return { year: y, label: yearLabel(y), color: YEAR_COLORS[y], ...counts };
    });

    res.json({
      success: true,
      data: {
        date, ...ctx, active_novenas: activeNovenas.rows, jumuiyas, years,
        canSave,
        semester: semester ? { start_date: semester.start_date, end_date: semester.end_date } : null,
      },
    });
  } catch (error) {
    console.error("getTallyContext error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listNovenas = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, to_char(start_date, 'YYYY-MM-DD') AS start_date,
              to_char(end_date, 'YYYY-MM-DD') AS end_date, is_active,
              to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created_at
       FROM novena_schedules
       ORDER BY start_date DESC, id DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("listNovenas error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createNovena = async (req, res) => {
  const { start_date, end_date, is_active } = req.body || {};
  if (!normalizeDate(start_date) || !normalizeDate(end_date)) {
    return res.status(400).json({ success: false, error: "Valid start_date and end_date (YYYY-MM-DD) are required" });
  }
  if (start_date > end_date) {
    return res.status(400).json({ success: false, error: "start_date must be on or before end_date" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO novena_schedules (start_date, end_date, is_active)
       VALUES ($1, $2, $3)
       RETURNING id, to_char(start_date, 'YYYY-MM-DD') AS start_date,
                 to_char(end_date, 'YYYY-MM-DD') AS end_date, is_active`,
      [start_date, end_date, is_active == null ? true : Boolean(is_active)]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("createNovena error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateNovena = async (req, res) => {
  const { id } = req.params;
  const { start_date, end_date, is_active } = req.body || {};
  if (!normalizeDate(start_date) || !normalizeDate(end_date)) {
    return res.status(400).json({ success: false, error: "Valid start_date and end_date (YYYY-MM-DD) are required" });
  }
  if (start_date > end_date) {
    return res.status(400).json({ success: false, error: "start_date must be on or before end_date" });
  }
  try {
    const result = await pool.query(
      `UPDATE novena_schedules
       SET start_date = $1, end_date = $2, is_active = $3
       WHERE id = $4
       RETURNING id, to_char(start_date, 'YYYY-MM-DD') AS start_date,
                 to_char(end_date, 'YYYY-MM-DD') AS end_date, is_active`,
      [start_date, end_date, is_active == null ? true : Boolean(is_active), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Novena not found" });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("updateNovena error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteNovena = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM novena_schedules WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Novena not found" });
    }
    res.json({ success: true, data: { id, deleted: true } });
  } catch (error) {
    console.error("deleteNovena error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSession = async (req, res) => {
  try {
    const date = normalizeDate(req.query.date) || todayStr();
    const result = await pool.query(
      `SELECT tally_id, to_char(tally_date, 'YYYY-MM-DD') AS tally_date, activity_type, activity_label, jumuiya_id,
              year_of_study, dimension, count,
              recorded_by, recorded_by_name, recorded_role, source, created_at, updated_at
       FROM attendance_tallies
       WHERE tally_date = $1
       ORDER BY dimension, jumuiya_id NULLS LAST, year_of_study`,
      [date]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("getSession error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getRecentStatus = async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 31);
    const today = todayStr();
    const start = addDays(today, -(days - 1));

    const recordedRes = await pool.query(
      `SELECT DISTINCT to_char(tally_date, 'YYYY-MM-DD') AS tally_date
       FROM attendance_tallies
       WHERE tally_date BETWEEN $1 AND $2`,
      [start, today]
    );
    const recordedSet = new Set(recordedRes.rows.map((r) => r.tally_date));

    const tallyDays = [];
    for (let i = 0; i < days; i++) {
      const d = addDays(start, i);
      const ctx = await getActivityForDate(d);
      if (ctx.isTallyDay) {
        tallyDays.push({
          date: d,
          activityType: ctx.activityType,
          activityLabel: ctx.activityLabel,
          recorded: recordedSet.has(d),
        });
      }
    }

    res.json({ success: true, data: { today, tally_days: tallyDays } });
  } catch (error) {
    console.error("getRecentStatus error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveSession = async (req, res) => {
  const { date, counts, recordedBy, dimension = "jumuiya" } = req.body || {};
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return res.status(400).json({ success: false, error: "A valid date (YYYY-MM-DD) is required" });
  }
  if (normalizedDate > todayStr()) {
    return res.status(400).json({ success: false, error: "Cannot record attendance for a future date" });
  }
  const dim = DIMENSIONS.has(String(dimension)) ? String(dimension) : "jumuiya";
  const recordedRole = RECORDED_ROLES.has(String(recordedBy || "coordinator"))
    ? String(recordedBy)
    : "coordinator";
  if (!Array.isArray(counts) || counts.length > 20) {
    return res.status(400).json({ success: false, error: "counts array is required (max 20 entries)" });
  }
  const yearEntries = dim === "year" ? [] : null;
  for (const c of counts) {
    if (dim === "year") {
      const y = normalizeYear(c?.year);
      if (!y) {
        return res.status(400).json({ success: false, error: "Each count must include a valid year of study (1-4)" });
      }
      if (yearEntries.some((e) => e.year === y)) {
        return res.status(400).json({ success: false, error: `Duplicate count for ${yearLabel(y)}` });
      }
      yearEntries.push({ year: y });
    } else if (!c || typeof c.jumuiya_id !== "string" || !UUID_RE.test(c.jumuiya_id)) {
      return res.status(400).json({ success: false, error: "Each count must include a valid jumuiya_id" });
    }
    const n = Number(c.count);
    if (!Number.isInteger(n) || n < 0 || n > 1000) {
      return res.status(400).json({ success: false, error: "Each count must be an integer between 0 and 1000" });
    }
  }

  try {
    const ctx = await getActivityForDate(normalizedDate);
    if (!ctx.isTallyDay) {
      console.warn(`saveSession REJECTED: ${normalizedDate} is not a tally day (user: ${req.user?.id})`);
      return res.status(400).json({
        success: false,
        error: `${normalizedDate} is not a tally day. Tally days are Monday (Rosary), Wednesday (Bible Study), Thursday (Rosary), or any day of an active novena.`,
      });
    }

    // Tallies may only be recorded within the current semester window.
    // A tally already recorded for this date (during the semester) may still be
    // edited during the break — only brand-new tallies are blocked.
    const semester = await getCurrentSemester();
    if (!isDateInSemester(normalizedDate, semester)) {
      const existing = await pool.query(
        `SELECT 1 FROM attendance_tallies WHERE tally_date = $1 LIMIT 1`,
        [normalizedDate]
      );
      if (existing.rows.length === 0) {
        const window = semester
          ? ` (${semester.start_date} → ${semester.end_date})`
          : " (no semester configured)";
        console.warn(`saveSession REJECTED: ${normalizedDate} outside semester${window} (user: ${req.user?.id})`);
        return res.status(400).json({
          success: false,
          error: `Attendance tallies are closed for the semester break. New tallies can only be recorded within the current semester${window}.`,
        });
      }
    }

    const recordedBy = req.user?.id || req.user?.member_id || "";
    const recordedByName =
      [req.user?.firstName, req.user?.lastName].filter(Boolean).join(" ") ||
      String(recordedBy || "");
    const registerMap = dim === "jumuiya" ? await getRegisterPresentMap(normalizedDate) : {};
    let registerSourced = 0;

    await withTransaction(async (client) => {
      await client.query(`DELETE FROM attendance_tallies WHERE tally_date = $1`, [normalizedDate]);
      for (const c of counts) {
        if (dim === "year") {
          const y = normalizeYear(c.year);
          await client.query(
            `INSERT INTO attendance_tallies
               (tally_date, activity_type, activity_label, jumuiya_id, year_of_study, dimension, count,
                recorded_by, recorded_by_name, recorded_role, source)
             VALUES ($1, $2, $3, NULL, $4, 'year', $5, $6, $7, $8, 'manual')`,
            [normalizedDate, ctx.activityType, ctx.activityLabel, y, Number(c.count), recordedBy, recordedByName, recordedRole]
          );
        } else {
          const registerCount = registerMap[c.jumuiya_id];
          // The secretary register is authoritative when it exists for this jumuiya + date.
          const count = registerCount != null ? registerCount : Number(c.count);
          const source = registerCount != null ? "register" : "manual";
          if (source === "register") registerSourced += 1;
          await client.query(
            `INSERT INTO attendance_tallies
               (tally_date, activity_type, activity_label, jumuiya_id, year_of_study, dimension, count,
                recorded_by, recorded_by_name, recorded_role, source)
             VALUES ($1, $2, $3, $4, NULL, 'jumuiya', $5, $6, $7, $8, $9)`,
            [normalizedDate, ctx.activityType, ctx.activityLabel, c.jumuiya_id, count, recordedBy, recordedByName, recordedRole, source]
          );
        }
      }
    });

    res.json({
      success: true,
      data: {
        date: normalizedDate,
        activityType: ctx.activityType,
        activityLabel: ctx.activityLabel,
        dimension: dim,
        recorded_by: recordedRole,
        saved: counts.length,
        register_sourced: registerSourced,
      },
    });
  } catch (error) {
    if (error?.code === "23503") {
      return res.status(400).json({ success: false, error: "One or more jumuiya_id values do not exist" });
    }
    console.error("saveSession error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const date = normalizeDate(req.params.date);
    if (!date) {
      return res.status(400).json({ success: false, error: "A valid date (YYYY-MM-DD) is required" });
    }
    const result = await pool.query(`DELETE FROM attendance_tallies WHERE tally_date = $1 RETURNING tally_id`, [date]);
    res.json({ success: true, data: { date, deleted: result.rows.length } });
  } catch (error) {
    console.error("deleteSession error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const computeAnalytics = async (from, to, dimension = "jumuiya") => {
  const span = daysBetween(from, to);
  const prevFrom = addDays(from, -(span + 1));
  const prevTo = addDays(from, -1);
  const isYear = dimension === "year";

  const currentGroupSql = isYear
    ? `SELECT year_of_study AS group_key,
              COUNT(DISTINCT tally_date)::int AS tally_days,
              COALESCE(SUM(count), 0)::int AS attendance_count,
              COALESCE(AVG(count), 0)::numeric AS avg_per_session
       FROM attendance_tallies
       WHERE tally_date BETWEEN $1 AND $2 AND dimension = 'year' AND year_of_study IS NOT NULL
       GROUP BY year_of_study`
    : `SELECT jumuiya_id AS group_key,
              COUNT(DISTINCT tally_date)::int AS tally_days,
              COALESCE(SUM(count), 0)::int AS attendance_count,
              COALESCE(AVG(count), 0)::numeric AS avg_per_session,
              COUNT(*) FILTER (WHERE source = 'register')::int AS register_days
       FROM attendance_tallies
       WHERE tally_date BETWEEN $1 AND $2 AND dimension = 'jumuiya'
       GROUP BY jumuiya_id`;
  const prevGroupSql = currentGroupSql;

  const [
    sgResult,
    memberCounts,
    currentResult,
    prevResult,
    currentDays,
    prevDays,
    timelineRes,
    registerResult,
  ] = await Promise.all([
    pool.query(
      `SELECT group_id, name, slug, color FROM sub_groups
       WHERE slug <> ALL($1)
       ORDER BY name`,
      [EXCLUDED_JUMUIYA_SLUGS]
    ),
    isYear ? getYearCounts() : getMemberCounts(),
    pool.query(currentGroupSql, [from, to]),
    pool.query(prevGroupSql, [prevFrom, prevTo]),
    pool.query(
      `SELECT COUNT(DISTINCT tally_date)::int AS days FROM attendance_tallies
       WHERE tally_date BETWEEN $1 AND $2 AND dimension = $3`,
      [from, to, dimension]
    ),
    pool.query(
      `SELECT COUNT(DISTINCT tally_date)::int AS days FROM attendance_tallies
       WHERE tally_date BETWEEN $1 AND $2 AND dimension = $3`,
      [prevFrom, prevTo, dimension]
    ),
    pool.query(
      `SELECT to_char(tally_date, 'YYYY-MM-DD') AS tally_date,
              COALESCE(SUM(count), 0)::int AS attendance,
              MAX(activity_label) AS activity_label
       FROM attendance_tallies
       WHERE tally_date BETWEEN $1 AND $2 AND dimension = $3
       GROUP BY tally_date
       ORDER BY tally_date`,
      [from, to, dimension]
    ),
    isYear
      ? Promise.resolve(null)
      : pool.query(
          `SELECT group_key,
                  COUNT(*)::int AS register_sessions,
                  COALESCE(SUM(present_count), 0)::int AS register_attendance,
                  COALESCE(MAX(present_count), 0)::int AS register_peak,
                  COALESCE((
                    SELECT COUNT(DISTINCT a.member_id)
                    FROM jumuiya_attendance a
                    WHERE a.jumuiya_id = daily.group_key
                      AND a.present
                      AND a.attendance_date BETWEEN $1 AND $2
                  ), 0)::int AS register_attendees
           FROM (
             SELECT jumuiya_id AS group_key,
                    attendance_date,
                    COUNT(*) FILTER (WHERE present)::int AS present_count
             FROM jumuiya_attendance
             WHERE attendance_date BETWEEN $1 AND $2
             GROUP BY jumuiya_id, attendance_date
           ) daily
           GROUP BY group_key`,
          [from, to]
        ),
  ]);

  const buildMap = (rows) => {
    const map = {};
    for (const row of rows) {
      map[row.group_key] = {
        tally_days: row.tally_days,
        attendance_count: row.attendance_count,
        avg_per_session: Number(row.avg_per_session),
        register_days: row.register_days || 0,
      };
    }
    return map;
  };

  const currentMap = buildMap(currentResult.rows);
  const prevMap = buildMap(prevResult.rows);
  const tallyDays = currentDays.rows[0]?.days || 0;
  const prevTallyDays = prevDays.rows[0]?.days || 0;

  const registerMap = {};
  for (const row of registerResult?.rows || []) {
    registerMap[row.group_key] = {
      register_sessions: row.register_sessions,
      register_attendees: row.register_attendees,
      register_attendance: row.register_attendance,
      register_peak: row.register_peak,
    };
  }

  const groupList = isYear
    ? YEARS.map((y) => ({
        group_key: y,
        name: yearLabel(y),
        color: YEAR_COLORS[y],
        memberCounts: memberCounts[y] || { total_members: 0, active_members: 0 },
      }))
    : sgResult.rows.map((sg) => ({
        group_key: sg.group_id,
        name: sg.name,
        color: sg.color || "#64748b",
        memberCounts: memberCounts[sg.group_id] || { total_members: 0, active_members: 0 },
      }));

  const rows = groupList.map((g) => {
    const counts = g.memberCounts;
    const cur = currentMap[g.group_key] || { tally_days: 0, attendance_count: 0, avg_per_session: 0, register_days: 0 };
    const prev = prevMap[g.group_key] || { tally_days: 0, attendance_count: 0, avg_per_session: 0 };
    const reg = registerMap[g.group_key] || { register_sessions: 0, register_attendees: 0, register_attendance: 0, register_peak: 0 };

    const rate_vs_total = safeRate(cur.attendance_count, counts.total_members, cur.tally_days);
    const rate_vs_active = safeRate(cur.attendance_count, counts.active_members, cur.tally_days);
    const prev_rate_vs_total = safeRate(prev.attendance_count, counts.total_members, prev.tally_days);
    const prev_rate_vs_active = safeRate(prev.attendance_count, counts.active_members, prev.tally_days);

    return {
      group_key: g.group_key,
      name: g.name,
      color: g.color,
      total_members: counts.total_members,
      active_members: counts.active_members,
      tally_days: cur.tally_days,
      attendance_count: cur.attendance_count,
      avg_per_session: Math.round(cur.avg_per_session * 10) / 10,
      register_days: cur.register_days,
      manual_days: Math.max(0, cur.tally_days - cur.register_days),
      register_coverage: cur.tally_days > 0 ? Math.round((cur.register_days / cur.tally_days) * 10000) / 10000 : 0,
      register_sessions: reg.register_sessions,
      register_attendance: reg.register_attendance,
      register_avg: reg.register_sessions > 0 ? Math.round((reg.register_attendance / reg.register_sessions) * 10) / 10 : 0,
      register_attendees: reg.register_attendees,
      register_peak: reg.register_peak,
      rate_vs_total: Math.round(rate_vs_total * 10000) / 10000,
      rate_vs_active: Math.round(rate_vs_active * 10000) / 10000,
      trend: {
        prev_attendance_count: prev.attendance_count,
        prev_tally_days: prev.tally_days,
        prev_rate_vs_total: Math.round(prev_rate_vs_total * 10000) / 10000,
        prev_rate_vs_active: Math.round(prev_rate_vs_active * 10000) / 10000,
        delta_vs_total: Math.round((rate_vs_total - prev_rate_vs_total) * 10000) / 10000,
        delta_vs_active: Math.round((rate_vs_active - prev_rate_vs_active) * 10000) / 10000,
      },
    };
  });

  rows.sort((a, b) => {
    const rateDiff = b.rate_vs_total - a.rate_vs_total;
    if (rateDiff !== 0) return rateDiff;
    return b.attendance_count - a.attendance_count;
  });
  rows.forEach((j, i) => { j.rank = i + 1; });

  let totalMembers = 0;
  let activeMembers = 0;
  let attendanceCount = 0;
  let registerSessionsTotal = 0;
  let registerAttendanceTotal = 0;
  let registerPeakMax = 0;
  for (const j of rows) {
    totalMembers += j.total_members;
    activeMembers += j.active_members;
    attendanceCount += j.attendance_count;
    registerSessionsTotal += j.register_sessions;
    registerAttendanceTotal += j.register_attendance;
    registerPeakMax = Math.max(registerPeakMax, j.register_peak);
  }

  const cumulativeRateTotal = safeRate(attendanceCount, totalMembers, tallyDays);
  const cumulativeRateActive = safeRate(attendanceCount, activeMembers, tallyDays);

  const prevTallyTotal = Object.values(prevMap).reduce((s, p) => s + p.attendance_count, 0);
  const prevRateTotal = safeRate(prevTallyTotal, totalMembers, prevTallyDays);
  const prevRateActive = safeRate(prevTallyTotal, activeMembers, prevTallyDays);

  const base = {
    period: { from, to, calendar_days: span + 1, prev_from: prevFrom, prev_to: prevTo },
    tally_days: tallyDays,
    timeline: timelineRes.rows.map((r) => ({
      date: r.tally_date,
      attendance: r.attendance,
      activity_label: r.activity_label,
    })),
    cumulative: {
      total_members: totalMembers,
      active_members: activeMembers,
      attendance_count: attendanceCount,
      tally_days: tallyDays,
      avg_per_session: tallyDays > 0 ? Math.round((attendanceCount / tallyDays) * 10) / 10 : 0,
      rate_vs_total: Math.round(cumulativeRateTotal * 10000) / 10000,
      rate_vs_active: Math.round(cumulativeRateActive * 10000) / 10000,
      register_sessions: registerSessionsTotal,
      register_attendance: registerAttendanceTotal,
      register_avg: registerSessionsTotal > 0 ? Math.round((registerAttendanceTotal / registerSessionsTotal) * 10) / 10 : 0,
      register_peak: registerPeakMax,
      trend: {
        prev_attendance_count: prevTallyTotal,
        prev_tally_days: prevTallyDays,
        prev_rate_vs_total: Math.round(prevRateTotal * 10000) / 10000,
        prev_rate_vs_active: Math.round(prevRateActive * 10000) / 10000,
        delta_vs_total: Math.round((cumulativeRateTotal - prevRateTotal) * 10000) / 10000,
        delta_vs_active: Math.round((cumulativeRateActive - prevRateActive) * 10000) / 10000,
      },
    },
  };

  if (isYear) {
    return {
      ...base,
      dimension: "year",
      by_jumuiya: [],
      by_year: rows,
    };
  }
  return {
    ...base,
    dimension: "jumuiya",
    by_jumuiya: rows,
    by_year: [],
  };
};

export const getAnalytics = async (req, res) => {
  const from = normalizeDate(req.query.from);
  const to = normalizeDate(req.query.to);
  if (!from || !to) {
    return res.status(400).json({ success: false, error: "Both from and to dates (YYYY-MM-DD) are required" });
  }
  if (from > to) {
    return res.status(400).json({ success: false, error: "from date must be on or before to date" });
  }
  const dimension = DIMENSIONS.has(String(req.query.dimension)) ? String(req.query.dimension) : "jumuiya";
  try {
    const data = await computeAnalytics(from, to, dimension);
    res.json({ success: true, data });
  } catch (error) {
    console.error("getAnalytics error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const exportAnalyticsExcel = async (req, res) => {
  const from = normalizeDate(req.query.from);
  const to = normalizeDate(req.query.to);
  if (!from || !to) {
    return res.status(400).json({ success: false, error: "Both from and to dates (YYYY-MM-DD) are required" });
  }
  if (from > to) {
    return res.status(400).json({ success: false, error: "from date must be on or before to date" });
  }
  const dimension = DIMENSIONS.has(String(req.query.dimension)) ? String(req.query.dimension) : "jumuiya";
  try {
    const data = await computeAnalytics(from, to, dimension);

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet(dimension === "year" ? "Year Analytics" : "Attendance Analytics");

    const title = ws.addRow([dimension === "year" ? "Year of Study Attendance Report" : "Attendance Analytics Report"]);
    title.font = { bold: true, size: 15, color: { argb: "FF1E293B" } };
    const meta = [
      `Period: ${data.period.from} → ${data.period.to}`,
      `Previous period: ${data.period.prev_from} → ${data.period.prev_to}`,
      `Tally sessions: ${data.tally_days}`,
      `Generated: ${new Date().toLocaleString()}`,
    ];
    meta.forEach((m) => { ws.addRow([m]).font = { color: { argb: "FF64748B" } }; });
    ws.addRow([]);

    const sum = data.cumulative;
    const summary = `Overall summary: ${sum.attendance_count} attendance across ${sum.tally_days} session(s), avg ${sum.avg_per_session}/session, rate vs active ${(sum.rate_vs_active * 100).toFixed(1)}% (${(sum.trend.delta_vs_active * 100).toFixed(1)} pts vs previous period)`;
    ws.addRow([summary]).font = { bold: true, color: { argb: "FF1E293B" } };
    ws.addRow([]);

    const groupHeader = dimension === "year" ? "Year of Study" : "Jumuiya";
    const headers = [
      "#", groupHeader, "Total Members", "Active Members", "Tally Days", "Attendance",
      "Avg/Session", "Rate vs Total", "Rate vs Active", "Prev Rate vs Active", "Delta (pts)",
    ];
    if (dimension !== "year") {
      headers.push("Register Meetings", "Avg Active (Reg.)", "Peak Active (Reg.)", "Distinct Attendees");
    }
    const headerRow = ws.addRow(headers);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: "FF4F46E5" } },
        left: { style: "thin", color: { argb: "FF4F46E5" } },
        bottom: { style: "thin", color: { argb: "FF4F46E5" } },
        right: { style: "thin", color: { argb: "FF4F46E5" } },
      };
    });

    const pct = (n) => `${(n * 100).toFixed(1)}%`;
    const rowValues = (j) => {
      const values = [
        j.rank, j.name, j.total_members, j.active_members, j.tally_days, j.attendance_count,
        j.avg_per_session, pct(j.rate_vs_total),
        pct(j.rate_vs_active), pct(j.trend.prev_rate_vs_active), pct(j.trend.delta_vs_active),
      ];
      if (dimension !== "year") {
        values.push(j.register_sessions || 0, j.register_avg || 0, j.register_peak || 0, j.register_attendees || 0);
      }
      return values;
    };
    const dimRows = dimension === "year" ? data.by_year : data.by_jumuiya;
    dimRows.forEach((j, i) => {
      const row = ws.addRow(rowValues(j));
      if (i % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
        });
      }
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    });

    ws.columns.forEach((column, idx) => {
      const headerLength = headers[idx].length;
      const maxContent = Math.max(
        ...dimRows.map((j) => String(rowValues(j)[idx] ?? "").length),
        headerLength
      );
      column.width = Math.min(Math.max(maxContent + 3, 12), 40);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="attendance-analytics-${dimension}_${from}_${to}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("exportAnalyticsExcel error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// One row per date with all 7 jumuiya counts together (St. Thomas is excluded).
export const getHistory = async (req, res) => {
  try {
    const where = [];
    const params = [];
    const push = (clause, value) => {
      params.push(value);
      where.push(clause.replace("?", `$${params.length}`));
    };
    const from = normalizeDate(req.query.from);
    const to = normalizeDate(req.query.to);
    if (from) push(`t.tally_date >= ?`, from);
    if (to) push(`t.tally_date <= ?`, to);
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT t.tally_id, to_char(t.tally_date, 'YYYY-MM-DD') AS tally_date, t.activity_type,
              t.activity_label, t.jumuiya_id, t.year_of_study, t.dimension,
              sg.name AS jumuiya_name, sg.color AS jumuiya_color,
              sg.slug AS jumuiya_slug, t.count, t.source, t.recorded_by, t.recorded_by_name,
              t.recorded_role, t.updated_at
       FROM attendance_tallies t
       LEFT JOIN sub_groups sg ON sg.group_id = t.jumuiya_id
       ${whereSql}
       ORDER BY t.tally_date DESC, sg.name ASC NULLS LAST, t.year_of_study ASC
       LIMIT 2000`,
      params
    );

    const groups = new Map();
    for (const r of result.rows) {
      const isYearRow = r.dimension === "year";
      if (!isYearRow && EXCLUDED_JUMUIYA_SLUGS.includes(r.jumuiya_slug)) continue;
      let g = groups.get(r.tally_date);
      if (!g) {
        g = {
          date: r.tally_date,
          activity_type: r.activity_type,
          activity_label: r.activity_label,
          dimension: isYearRow ? "year" : "jumuiya",
          recorded_role: r.recorded_role || "coordinator",
          recorded_by_name: r.recorded_by_name,
          updated_at: r.updated_at,
          counts: [],
        };
        groups.set(r.tally_date, g);
      }
      if (isYearRow) {
        g.counts.push({
          kind: "year",
          tally_id: r.tally_id,
          year: r.year_of_study,
          label: yearLabel(r.year_of_study),
          color: YEAR_COLORS[r.year_of_study],
          source: r.source,
          count: r.count,
        });
      } else {
        g.counts.push({
          kind: "jumuiya",
          tally_id: r.tally_id,
          jumuiya_id: r.jumuiya_id,
          jumuiya_name: r.jumuiya_name,
          jumuiya_color: r.jumuiya_color,
          source: r.source,
          count: r.count,
        });
      }
    }

    res.json({ success: true, data: Array.from(groups.values()) });
  } catch (error) {
    console.error("getHistory error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Body: { counts: [{jumuiya_id, count}], recordedBy: 'coordinator'|'assistant' }.
// Register-sourced counts are skipped (they are corrected in the secretary register).
export const updateTally = async (req, res) => {
  const date = normalizeDate(req.params.date);
  if (!date) {
    return res.status(400).json({ success: false, error: "A valid date (YYYY-MM-DD) is required" });
  }
  const { counts, recordedBy } = req.body || {};
  if (!Array.isArray(counts)) {
    return res.status(400).json({ success: false, error: "counts array is required" });
  }
  const recordedRole = RECORDED_ROLES.has(String(recordedBy || "coordinator"))
    ? String(recordedBy)
    : "coordinator";

  try {
    const existing = await pool.query(
      `SELECT dimension, jumuiya_id, year_of_study, source FROM attendance_tallies WHERE tally_date = $1`,
      [date]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: "No tally recorded for this date" });
    }
    const isYear = existing.rows[0].dimension === "year";
    const keyOf = (row) => (isYear ? row.year_of_study : row.jumuiya_id);
    const sourceByKey = new Map();
    for (const row of existing.rows) sourceByKey.set(keyOf(row), row.source);

    for (const c of counts) {
      if (isYear) {
        if (!normalizeYear(c?.year)) {
          return res.status(400).json({ success: false, error: "Each count must include a valid year of study (1-4)" });
        }
      } else if (!c || typeof c.jumuiya_id !== "string" || !UUID_RE.test(c.jumuiya_id)) {
        return res.status(400).json({ success: false, error: "Each count must include a valid jumuiya_id" });
      }
      const n = Number(c.count);
      if (!Number.isInteger(n) || n < 0 || n > 1000) {
        return res.status(400).json({ success: false, error: "Each count must be an integer between 0 and 1000" });
      }
    }

    const locked = [];
    const updates = [];
    for (const c of counts) {
      const key = isYear ? normalizeYear(c.year) : c.jumuiya_id;
      if (sourceByKey.get(key) === "register") {
        locked.push(key);
        continue;
      }
      updates.push({ key, count: Number(c.count) });
    }

    const recordedByName =
      [req.user?.firstName, req.user?.lastName].filter(Boolean).join(" ") ||
      String(req.user?.id || "");

    await withTransaction(async (client) => {
      for (const u of updates) {
        if (isYear) {
          await client.query(
            `UPDATE attendance_tallies
             SET count = $1, recorded_by = $2, recorded_by_name = $3, updated_at = CURRENT_TIMESTAMP
             WHERE tally_date = $4 AND year_of_study = $5`,
            [u.count, req.user?.id || "", recordedByName, date, u.key]
          );
        } else {
          await client.query(
            `UPDATE attendance_tallies
             SET count = $1, recorded_by = $2, recorded_by_name = $3, updated_at = CURRENT_TIMESTAMP
             WHERE tally_date = $4 AND jumuiya_id = $5`,
            [u.count, req.user?.id || "", recordedByName, date, u.key]
          );
        }
      }
      // The role applies to the whole day's tally (both coordinator & assistant share one login).
      await client.query(
        `UPDATE attendance_tallies
         SET recorded_role = $1, updated_at = CURRENT_TIMESTAMP
         WHERE tally_date = $2 AND source <> 'register'`,
        [recordedRole, date]
      );
    });

    res.json({
      success: true,
      data: { date, dimension: isYear ? "year" : "jumuiya", updated: updates.length, locked: locked.length, recorded_by: recordedRole },
    });
  } catch (error) {
    console.error("updateTally error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
