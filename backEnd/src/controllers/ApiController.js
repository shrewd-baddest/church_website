import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

/**
 * Validates that a dynamically-provided identifier (column or table name)
 * contains ONLY alphanumeric characters and underscores.
 * This prevents SQL injection through double-quote escaping in identifier strings.
 * Throws a TypeError if the identifier contains any disallowed characters.
 */
const sanitizeIdentifier = (name) => {
  if (typeof name !== "string" || !/^[a-zA-Z0-9_]+$/.test(name)) {
    throw Object.assign(
      new TypeError(`Invalid identifier: "${String(name).substring(0, 50)}"`),
      { statusCode: 400 }
    );
  }
  return name;
};

const TABLE_SORT_COLUMNS = {
  events: "event_date",
  contributions: "date",
  gallery: "event_date",
  activities: "activity_date",
  members: "join_date",
  officials: "id",
  projects: "id",
  jumuiya: "group_id",
  sub_groups: "group_id",
  mpesa_request: "created_at",
};

const TABLE_PRIMARY_KEYS = {
  members: "member_id",
  users: "user_id",
  sub_groups: "group_id",
  jumuiya: "group_id",
};

// Get all records from a table
export const getTableData = async (tableName, queryParams = {}) => {
  const dbTableName = tableName === 'jumuiya' ? 'sub_groups' : tableName;
  const sortCol = TABLE_SORT_COLUMNS[tableName] || (dbTableName === 'sub_groups' ? 'group_id' : 'id');
  const filterKeys = Object.keys(queryParams).filter((key) => queryParams[key] !== undefined && queryParams[key] !== '');

  try {
    let query = `SELECT * FROM "${dbTableName}"`;
    const values = [];

    if (filterKeys.length > 0) {
      const filters = filterKeys.map((key, index) => {
        const safeKey = sanitizeIdentifier(key); // guard against SQL injection via key names
        values.push(queryParams[key]);
        return `"${safeKey}" = $${index + 1}`;
      });
      query += ` WHERE ${filters.join(' AND ')}`;
    }

    query += ` ORDER BY "${sortCol}" DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  } catch (firstError) {
    // Fallback to unordered if ordering column is missing
    if (firstError.code === '42703') {
      logger.warn(`Falling back to unordered SELECT for "${dbTableName}" - column "${sortCol}" not found`);
      try {
        const fallback = await pool.query(`SELECT * FROM "${dbTableName}"`);
        return fallback.rows;
      } catch (fallbackError) {
        console.error(`Fallback SELECT also failed for "${dbTableName}":`, fallbackError.message);
        return [];
      }
    }
    
    // Check if table exists
    if (firstError.code === '42P01') {
      console.error(`[ApiController] Table "${dbTableName}" does not exist in DB.`);
      return [];
    }
    
    // Other database errors - log to console for immediate visibility in server logs
    console.error(`[ApiController] Database Error fetching ${dbTableName}:`, firstError);
    logger.error(`Error fetching ${dbTableName}: ${firstError.message}`);
    
    // Connection issues fallback (return empty array instead of crashing app)
    if (firstError.message.includes('connection') || firstError.message.includes('queryable')) {
       return [];
    }
    
    throw firstError;
  }
};

// Create a new record in a table
export const createRecord = async (tableName, data) => {
  const dbTableName = tableName === 'jumuiya' ? 'sub_groups' : tableName;
  try {
    const columns = Object.keys(data).map(sanitizeIdentifier); // validate all keys
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = columns.map(col => `"${col}"`).join(', ');
    
    const query = `
      INSERT INTO "${dbTableName}" (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error(`Error creating record in ${dbTableName}: ${error.message}`);
    console.error(`Error creating record in ${dbTableName}:`, error.message);
    throw error;
  }
};

// Delete a record from a table
export const deleteRecord = async (tableName, id) => {
  const dbTableName = tableName === 'jumuiya' ? 'sub_groups' : tableName;
  const pkName = TABLE_PRIMARY_KEYS[dbTableName] || 'id';
  try {
    const query = `DELETE FROM "${dbTableName}" WHERE "${pkName}" = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error deleting record from ${dbTableName}:`, error.message);
    throw error;
  }
};

// Get all data from all tables
export const getAllData = async () => {
  const tables = ['members', 'events', 'contributions', 'officials', 'projects', 'activities', 'gallery', 'jumuiya', 'mpesa_request', 'suggestions'];
  const data = {};
  
  for (const table of tables) {
    try {
      data[table] = await getTableData(table);
    } catch (error) {
      console.error(`Error fetching ${table}:`, error.message);
      data[table] = [];
    }
  }
  
  return data;
};
// Update a record in a table
export const updateRecord = async (tableName, id, data) => {
  const dbTableName = tableName === 'jumuiya' ? 'sub_groups' : tableName;
  const pkName = TABLE_PRIMARY_KEYS[dbTableName] || 'id';
  try {
    const columns = Object.keys(data).map(sanitizeIdentifier); // validate all keys
    const values = Object.values(data);
    const setClause = columns.map((col, i) => `"${col}" = $${i + 1}`).join(', ');
    
    const query = `
      UPDATE "${dbTableName}"
      SET ${setClause}
      WHERE "${pkName}" = $${columns.length + 1}
      RETURNING *
    `;
    
    const result = await pool.query(query, [...values, id]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error updating record in ${dbTableName}:`, error.message);
    throw error;
  }
};
