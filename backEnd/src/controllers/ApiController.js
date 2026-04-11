import { testDb } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const TABLE_SORT_COLUMNS = {
  events: "event_date",
  contributions: "date",
  gallery: "event_date",
  activities: "activity_date",
  members: "join_date",
  officials: "id",
  projects: "id",
  jumuiya: "id",
  mpesa_request: "created_at",
};

// Get all records from a table
export const getTableData = async (tableName) => {
  const sortCol = TABLE_SORT_COLUMNS[tableName] || 'id';

  try {
    // Attempt query with ordering (using quotes to handle potential reserved words)
    const result = await testDb.query(
      `SELECT * FROM "${tableName}" ORDER BY "${sortCol}" DESC`
    );
    return result.rows;
  } catch (firstError) {
    // Fallback to unordered if ordering column is missing
    if (firstError.code === '42703') {
      logger.warn(`Falling back to unordered SELECT for "${tableName}" - column "${sortCol}" not found`);
      try {
        const fallback = await testDb.query(`SELECT * FROM "${tableName}"`);
        return fallback.rows;
      } catch (fallbackError) {
        console.error(`Fallback SELECT also failed for "${tableName}":`, fallbackError.message);
        return [];
      }
    }
    
    // Check if table exists
    if (firstError.code === '42P01') {
      console.error(`[ApiController] Table "${tableName}" does not exist in DB.`);
      return [];
    }
    
    // Other database errors - log to console for immediate visibility in server logs
    console.error(`[ApiController] Database Error fetching ${tableName}:`, firstError);
    logger.error(`Error fetching ${tableName}: ${firstError.message}`);
    
    // Connection issues fallback (return empty array instead of crashing app)
    if (firstError.message.includes('connection') || firstError.message.includes('queryable')) {
       return [];
    }
    
    throw firstError;
  }
};

// Create a new record in a table
export const createRecord = async (tableName, data) => {
  try {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = columns.join(', ');
    
    const query = `
      INSERT INTO ${tableName} (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await testDb.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error(`Error creating record in ${tableName}: ${error.message}`);
    console.error(`Error creating record in ${tableName}:`, error.message);
    throw error;
  }
};

// Delete a record from a table
export const deleteRecord = async (tableName, id) => {
  try {
    const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
    const result = await testDb.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error deleting record from ${tableName}:`, error.message);
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
  try {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, i) => `"${col}" = $${i + 1}`).join(', ');
    
    const query = `
      UPDATE "${tableName}"
      SET ${setClause}
      WHERE id = $${columns.length + 1}
      RETURNING *
    `;
    
    const result = await testDb.query(query, [...values, id]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error updating record in ${tableName}:`, error.message);
    throw error;
  }
};
