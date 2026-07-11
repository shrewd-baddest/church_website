import { testDb as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

export const createActivityLog = async (memberId, memberName, action, targetType, targetId, details = {}) => {
  try {
    await pool.query(
      `INSERT INTO activity_logs (member_id, member_name, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [memberId, memberName, action, targetType, targetId, JSON.stringify(details)]
    );
  } catch (err) {
    logger.error("Failed to create activity log: " + err.message);
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    const { limit = 50, offset = 0, action, target_type } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (action) {
      conditions.push(`action = $${idx++}`);
      params.push(action);
    }
    if (target_type) {
      conditions.push(`target_type = $${idx++}`);
      params.push(target_type);
    }

    const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const countRes = await pool.query(`SELECT COUNT(*)::int as total FROM activity_logs ${where}`, params);
    const dataRes = await pool.query(
      `SELECT * FROM activity_logs ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      data: dataRes.rows,
      total: countRes.rows[0].total,
    });
  } catch (err) {
    logger.error("getActivityLogs error: " + err.message);
    res.status(500).json({ success: false, error: "Failed to fetch activity logs" });
  }
};
