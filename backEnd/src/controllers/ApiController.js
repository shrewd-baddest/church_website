import { testDb } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

// Get all records from a table
export const getTableData = async (tableName) => {
  const sortCol = TABLE_SORT_COLUMNS[tableName] || 'id';

  try {
    // First attempt: ordered query
    const result = await testDb.query(
      `SELECT * FROM ${tableName} ORDER BY ${sortCol} DESC`
    );
    return result.rows;
  } catch (firstError) {
    // 42703 = column does not exist, 42P01 = table does not exist
    if (firstError.code === '42703' || firstError.code === '42P01') {
      logger.warn(`Falling back to unordered SELECT for "${tableName}" (code: ${firstError.code})`);
      try {
        const fallback = await testDb.query(`SELECT * FROM ${tableName}`);
        return fallback.rows;
      } catch (fallbackError) {
        logger.error(`Fallback SELECT also failed for "${tableName}": ${fallbackError.message}`);
        return [];
      }
    }
    logger.error(`Error fetching ${tableName}: ${firstError.message}`);
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
  const tables = ['members', 'events', 'contributions', 'officials', 'projects', 'activities', 'gallery', 'jumuiya', 'mpesa_request'];
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

