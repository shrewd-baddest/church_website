// src/controllers/activitiesController.js
import { db } from "../Configs/dbConfig.js";

// ─────────────────────────────────────────────
// WEEKLY ACTIVITIES
// ─────────────────────────────────────────────

export const getWeeklyActivities = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM weekly_activities ORDER BY sort_order ASC, id ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching weekly activities:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createWeeklyActivity = async (req, res) => {
  const { day, time, activity, venue, fare } = req.body;

  if (!day || !time || !activity || !venue) {
    return res.status(400).json({
      success: false,
      error: "day, time, activity, and venue are required",
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO weekly_activities (day, time, activity, venue, fare)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [day, time, activity, venue, fare || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error creating weekly activity:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateWeeklyActivity = async (req, res) => {
  const { id } = req.params;
  const { day, time, activity, venue, fare } = req.body;

  try {
    const result = await db.query(
      `UPDATE weekly_activities
       SET day=$1, time=$2, activity=$3, venue=$4, fare=$5
       WHERE id=$6
       RETURNING *`,
      [day, time, activity, venue, fare !== undefined ? fare : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Record not found",
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteWeeklyActivity = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM weekly_activities WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Record not found",
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// WEEKLY ACTIVITIES (ADMIN: activate/deactivate)
export const activateWeeklyActivity = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE weekly_activities SET is_active=true WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deactivateWeeklyActivity = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE weekly_activities SET is_active=false WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// reorder weekly activities safely
export const reorderWeeklyActivities = async (req, res) => {
  const { items } = req.body || {};

  if (!Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      error: "items array is required",
    });
  }

  try {
    await db.query("BEGIN");

    for (const item of items) {
      if (!item?.id) continue;

      const sortOrder = Number(item.sort_order);
      if (!Number.isFinite(sortOrder)) continue;

      await db.query(
        `UPDATE weekly_activities SET sort_order=$1 WHERE id=$2`,
        [sortOrder, item.id]
      );
    }

    await db.query("COMMIT");

    const result = await db.query(
      `SELECT * FROM weekly_activities ORDER BY sort_order ASC, id ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    await db.query("ROLLBACK").catch(() => {});
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────
// SEMESTER ACTIVITIES
// ─────────────────────────────────────────────

export const getSemesterActivities = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM semester_activities ORDER BY date_time ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching semester activities:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createSemesterActivity = async (req, res) => {
  const { title, date_time, venue, description, fare } = req.body;

  if (!title || !date_time || !venue) {
    return res.status(400).json({
      success: false,
      error: "title, date_time, and venue are required",
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO semester_activities (title, date_time, venue, description, fare)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, date_time, venue, description || "", fare || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSemesterActivity = async (req, res) => {
  const { id } = req.params;
  const { title, date_time, venue, description, fare } = req.body;

  try {
    const result = await db.query(
      `UPDATE semester_activities
       SET title=$1, date_time=$2, venue=$3, description=$4, fare=$5
       WHERE id=$6
       RETURNING *`,
      [title, date_time, venue, description, fare !== undefined ? fare : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Record not found",
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteSemesterActivity = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM semester_activities WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Record not found",
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// ─────────────────────────────────────────────
// EFFECTIVE SCHEDULE (AUTO SWITCH)
// ─────────────────────────────────────────────

export const getEffectiveWeeklySchedule = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // 1. check if a novena is active today
    const novena = await db.query(
      `SELECT *
       FROM novena_schedules
       WHERE is_active = true
       AND $1 BETWEEN start_date AND end_date
       ORDER BY start_date DESC
       LIMIT 1`,
      [today]
    );

    // 2. if novena exists → return override schedule
    if (novena.rows.length > 0) {
      const novenaId = novena.rows[0].id;

      const overrides = await db.query(
        `SELECT *
         FROM novena_override_activities
         WHERE novena_id = $1
         ORDER BY sort_order ASC, id ASC`,
        [novenaId]
      );

      return res.json({
        success: true,
        mode: "novena",
        novena: novena.rows[0],
        data: overrides.rows,
      });
    }

    // 3. fallback → weekly schedule
    const weekly = await db.query(
      `SELECT *
       FROM weekly_activities
       ORDER BY sort_order ASC, id ASC`
    );

    return res.json({
      success: true,
      mode: "weekly",
      data: weekly.rows,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
// ─────────────────────────────────────────────
// NOVENA SYSTEM
// ─────────────────────────────────────────────

export const getNovenaSchedules = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM novena_schedules ORDER BY start_date ASC, id ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createNovenaSchedule = async (req, res) => {
  const { start_date, end_date, is_active } = req.body;

  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      error: "start_date and end_date are required",
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO novena_schedules (start_date, end_date, is_active)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [start_date, end_date, is_active ?? true]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateNovenaSchedule = async (req, res) => {
  const { id } = req.params;
  const { start_date, end_date, is_active } = req.body;

  try {
    const result = await db.query(
      `UPDATE novena_schedules
       SET start_date=$1, end_date=$2, is_active=$3
       WHERE id=$4
       RETURNING *`,
      [start_date, end_date, is_active ?? true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteNovenaSchedule = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM novena_schedules WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const activateNovenaSchedule = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE novena_schedules SET is_active=true WHERE id=$1 RETURNING *`,
      [id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deactivateNovenaSchedule = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE novena_schedules SET is_active=false WHERE id=$1 RETURNING *`,
      [id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getNovenaOverrides = async (req, res) => {
  const { novena_id } = req.query;

  try {
    const result = await db.query(
      `SELECT * FROM novena_override_activities
       WHERE novena_id=$1
       ORDER BY sort_order ASC, id ASC`,
      [novena_id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createNovenaOverrideActivity = async (req, res) => {
  const { novena_id, day, time, activity, venue, is_active, sort_order } =
    req.body;

  if (!novena_id || !day || !time || !activity || !venue) {
    return res.status(400).json({
      success: false,
      error: "novena_id, day, time, activity, venue required",
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO novena_override_activities
       (novena_id, day, time, activity, venue, is_active, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        novena_id,
        day,
        time,
        activity,
        venue,
        is_active ?? true,
        sort_order ?? 0,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateNovenaOverrideActivity = async (req, res) => {
  const { id } = req.params;
  const { day, time, activity, venue, is_active } = req.body;

  try {
    const result = await db.query(
      `UPDATE novena_override_activities
       SET day=$1, time=$2, activity=$3, venue=$4, is_active=$5
       WHERE id=$6
       RETURNING *`,
      [day, time, activity, venue, is_active ?? true, id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteNovenaOverrideActivity = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM novena_override_activities WHERE id=$1 RETURNING *`,
      [id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────
// SEMESTER ACTIVITIES (ADMIN: activate/deactivate)
// ─────────────────────────────────────────────

export const activateSemesterActivity = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE semester_activities SET is_active=true WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deactivateSemesterActivity = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE semester_activities SET is_active=false WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────
// NOVENA OVERRIDES (ADMIN: reorder)
// ─────────────────────────────────────────────

export const reorderNovenaOverrides = async (req, res) => {
  const { items } = req.body || {};

  if (!Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      error: "items array is required",
    });
  }

  try {
    await db.query("BEGIN");

    for (const item of items) {
      if (!item?.id) continue;

      const sortOrder = Number(item.sort_order);
      if (!Number.isFinite(sortOrder)) continue;

      await db.query(
        `UPDATE novena_override_activities SET sort_order=$1 WHERE id=$2`,
        [sortOrder, item.id]
      );
    }

    await db.query("COMMIT");

    const result = await db.query(
      `SELECT * FROM novena_override_activities ORDER BY sort_order ASC, id ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    await db.query("ROLLBACK").catch(() => {});
    res.status(500).json({ success: false, error: error.message });
  }
};
