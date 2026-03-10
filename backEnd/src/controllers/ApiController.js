import { testDb } from "../Configs/dbConfig.js";

// Get all records from a table
export const getTableData = async (tableName) => {
  try {
    const result = await testDb.query(`SELECT * FROM ${tableName} ORDER BY id DESC`);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error.message);
    logger.error(`Error fetching ${tableName}: ${error.message}`);
    // Return empty array if table doesn't exist (PostgreSQL error code 42P01)
    if (error.code === '42P01') {
      logger.warn(`Table ${tableName} with error.code ${error.code} does not exist. Returning empty array.`);
      return [];
    }
    throw error;
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
  const tables = ['members', 'events', 'contributions', 'officials', 'projects', 'activities', 'gallery', 'jumuiya'];
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

