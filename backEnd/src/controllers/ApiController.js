import { db as pool, withTransaction } from "../Configs/dbConfig.js";
import { cascadeDeleteRow } from "../utils/cascadeDelete.js";
import logger from "../logger/winston.js";
import { parsePagination } from "../utils/pagination.js";

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

// Unmask tokens on suggestions are single-use secrets that must never be
// returned to any client through the generic API.
const SUGGESTION_TOKEN_COLUMNS = [
  "chair_unmask_token",
  "liturgist_unmask_token",
  "jumuiya_chair_token",
  "jumuiya_secretary_token",
];

const sanitizeSuggestionRows = (rows) =>
  rows.map((row) => {
    const safe = { ...row };
    for (const col of SUGGESTION_TOKEN_COLUMNS) delete safe[col];
    return safe;
  });

const maybeSanitize = (tableName, rows) =>
  tableName === 'suggestions' ? sanitizeSuggestionRows(rows) : rows;

// Sensitive columns can NEVER be set through the generic create/update API,
// regardless of table. These are only ever written by dedicated controllers
// (auth, password policy, role management), so blocking them here cannot
// break legitimate generic-write features.
const BLOCKED_WRITE_COLUMNS = new Set([
  "password",
  "password_hash",
  "role",
  "email_verified",
  "failed_login_attempts",
  "locked_until",
  "email_verification_token",
  "email_verification_expires",
  "refresh_token",
  "refresh_tokens",
  "chair_unmask_token",
  "liturgist_unmask_token",
  "jumuiya_chair_token",
  "jumuiya_secretary_token",
]);

// Tables whose rows contain identity / payment / credential data. Generic
// writes to them are denied entirely; use the dedicated controllers instead.
const READ_ONLY_TABLES = new Set([
  "members",
  "users",
  "mpesa_request",
  "contributions",
  "orders",
  "hire_requests",
]);

// Per-table column allowlists for generic writes. Keys outside the allowlist
// are dropped from create/update payloads. Tables not listed here accept any
// column except the BLOCKED_WRITE_COLUMNS.
const WRITE_COLUMN_ALLOWLISTS = {
  enrollments: ["module_id", "class_id", "full_name", "name", "email", "phone", "voice_type", "music_level", "status", "source"],
  hub_modules: ["title", "description", "story", "theme_color", "icon_class", "schedule_label", "training_time", "location", "registration_fee", "subscription_fee", "uniform_info", "saint_image_url", "history_pdf_url"],
  hub_activities: ["module_id", "title", "description", "activity_date", "location", "status"],
  hub_announcements: ["module_id", "title", "content", "announcement_date", "status"],
  hub_gallery: ["module_id", "image_url", "title", "caption", "category", "status"],
  hub_officials: ["module_id", "name", "role", "photo_url", "phone", "email", "bio", "order", "status"],
  products: ["name", "description", "price", "category", "image", "stock", "status", "is_featured"],
  categories: ["name", "description", "order", "status"],
  testimonials: ["name", "message", "rating", "status"],
  suggestions: ["suggestion", "category", "scope", "jumuiya_id", "name", "email", "user_id", "status", "reply", "replied_at", "replied_by", "approved", "is_approved", "requested_unmask", "unmask_response"],
  finance_ledger: ["entry_type", "title", "amount", "category", "payment_method", "receipt_url", "notes", "entry_date", "recorded_by"],
  finance_budgets: ["event_name", "target_amount", "collected_amount", "spent_amount", "status", "notes"],
};

const sanitizeWritePayload = (tableName, data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const allowlist = WRITE_COLUMN_ALLOWLISTS[tableName];
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (BLOCKED_WRITE_COLUMNS.has(key)) continue;
    if (allowlist && !allowlist.includes(key)) continue;
    sanitized[key] = value;
  }
  return sanitized;
};

// Get all records from a table.
// Supports optional ?page= & ?limit= (see utils/pagination.js). When pagination
// params are present it returns { data, pagination }, otherwise it returns the
// plain row array exactly as before (backward compatible).
export const getTableData = async (tableName, queryParams = {}) => {
  const dbTableName = tableName === 'jumuiya' ? 'sub_groups' : tableName;
  const sortCol = TABLE_SORT_COLUMNS[tableName] || (dbTableName === 'sub_groups' ? 'group_id' : 'id');
  const SAFE_IDENTIFIER = /^[a-zA-Z0-9_]+$/;
  const { isPaginated, page, limit, offset } = parsePagination(queryParams);
  const filterKeys = Object.keys(queryParams)
    .filter((key) => queryParams[key] !== undefined && queryParams[key] !== '')
    .filter((key) => key !== 'page' && key !== 'limit')
    .filter((key) => SAFE_IDENTIFIER.test(key));

  try {
    const values = [];

    let whereClause = '';
    if (filterKeys.length > 0) {
      const filters = filterKeys.map((key, index) => {
        values.push(queryParams[key]);
        return `"${key}" = $${index + 1}`;
      });
      whereClause = ` WHERE ${filters.join(' AND ')}`;
    }

    let countTotal = null;
    if (isPaginated) {
      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM "${dbTableName}"${whereClause}`,
        values
      );
      countTotal = countResult.rows[0]?.total ?? 0;
    }

    let query = `SELECT * FROM "${dbTableName}"${whereClause}`;

    if (!SAFE_IDENTIFIER.test(sortCol)) {
      throw new Error('Invalid sort column');
    }

    query += ` ORDER BY "${sortCol}" DESC`;
    if (isPaginated) {
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const result = await pool.query(query, values);
    const rows = maybeSanitize(tableName, result.rows);

    if (isPaginated) {
      return {
        data: rows,
        pagination: {
          page,
          limit,
          total: countTotal,
          totalPages: countTotal > 0 ? Math.ceil(countTotal / limit) : 1,
        },
      };
    }

    return rows;
  } catch (firstError) {
    // Fallback to unordered if ordering column is missing
    if (firstError.code === '42703') {
      logger.warn(`Falling back to unordered SELECT for "${dbTableName}" - column "${sortCol}" not found`);
      try {
        const fallback = await pool.query(`SELECT * FROM "${dbTableName}"`);
        const rows = maybeSanitize(tableName, fallback.rows);
        if (isPaginated) {
          return {
            data: rows,
            pagination: { page, limit, total: rows.length, totalPages: 1 },
          };
        }
        return rows;
      } catch (fallbackError) {
        console.error(`Fallback SELECT also failed for "${dbTableName}":`, fallbackError.message);
        return isPaginated
          ? { data: [], pagination: { page, limit, total: 0, totalPages: 1 } }
          : [];
      }
    }
    
    // Check if table exists
    if (firstError.code === '42P01') {
      console.error(`[ApiController] Table "${dbTableName}" does not exist in DB.`);
      return isPaginated
        ? { data: [], pagination: { page, limit, total: 0, totalPages: 1 } }
        : [];
    }
    
    // Other database errors - log to console for immediate visibility in server logs
    console.error(`[ApiController] Database Error fetching ${dbTableName}:`, firstError);
    logger.error(`Error fetching ${dbTableName}: ${firstError.message}`);
    
    // Connection issues fallback (return empty array instead of crashing app)
    if (firstError.message.includes('connection') || firstError.message.includes('queryable')) {
       return isPaginated
         ? { data: [], pagination: { page, limit, total: 0, totalPages: 1 } }
         : [];
    }
    
    throw firstError;
  }
};

export const createRecord = async (tableName, data) => {
  const dbTableName = tableName === 'jumuiya' ? 'sub_groups' : tableName;
  try {
    if (READ_ONLY_TABLES.has(dbTableName)) {
      const err = new Error(`Writes to table "${dbTableName}" via the generic API are not allowed`);
      err.status = 403;
      throw err;
    }
    data = sanitizeWritePayload(dbTableName, data);
    const columns = Object.keys(data);
    const values = Object.values(data);
    if (columns.length === 0) {
      const err = new Error('No allowed columns provided for create');
      err.status = 400;
      throw err;
    }
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = columns.map(col => `"${col}"`).join(', ');
    
    const query = `
      INSERT INTO "${dbTableName}" (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return maybeSanitize(tableName, result.rows)[0];
  } catch (error) {
    logger.error(`Error creating record in ${dbTableName}: ${error.message}`);
    console.error(`Error creating record in ${dbTableName}:`, error.message);
    throw error;
  }
};

export const deleteRecord = async (tableName, id) => {
  const dbTableName = tableName === 'jumuiya' ? 'sub_groups' : tableName;
  const pkName = TABLE_PRIMARY_KEYS[dbTableName] || 'id';
  try {
    // Members can be referenced by other tables whose foreign keys are defined
    // WITHOUT ON DELETE CASCADE (e.g. pending_payments, member_roles,
    // notifications). A bare DELETE FROM members would then fail with a
    // foreign-key constraint for any member referenced elsewhere. Clear every
    // referencing table first so the delete always succeeds.
    if (dbTableName === 'members') {
      await withTransaction(async (client) => {
        // Members can be referenced through foreign keys that are NOT defined
        // with ON DELETE CASCADE (e.g. pending_payments, member_roles,
        // notifications) and those tables can in turn reference others. Delete
        // the member by recursively clearing the entire FK dependency tree so
        // the final DELETE FROM members never hits a constraint violation.
        await cascadeDeleteRow(client, 'members', 'member_id', id);
      });
      return { id, deleted: true };
    }

    const query = `DELETE FROM "${dbTableName}" WHERE "${pkName}" = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return maybeSanitize(tableName, result.rows)[0];
  } catch (error) {
    console.error(`Error deleting record from ${dbTableName}:`, error.message);
    throw error;
  }
};

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
export const updateRecord = async (tableName, id, data) => {
  const dbTableName = tableName === 'jumuiya' ? 'sub_groups' : tableName;
  const pkName = TABLE_PRIMARY_KEYS[dbTableName] || 'id';
  try {
    if (READ_ONLY_TABLES.has(dbTableName)) {
      const err = new Error(`Writes to table "${dbTableName}" via the generic API are not allowed`);
      err.status = 403;
      throw err;
    }
    data = sanitizeWritePayload(dbTableName, data);
    const columns = Object.keys(data);
    const values = Object.values(data);
    if (columns.length === 0) {
      const err = new Error('No allowed columns provided for update');
      err.status = 400;
      throw err;
    }
    const setClause = columns.map((col, i) => `"${col}" = $${i + 1}`).join(', ');
    
    const query = `
      UPDATE "${dbTableName}"
      SET ${setClause}
      WHERE "${pkName}" = $${columns.length + 1}
      RETURNING *
    `;
    
    let result = await pool.query(query, [...values, id]);
    if (result.rows.length === 0 && dbTableName === 'hub_modules') {
      const altId = id === 'mentorship' ? 'youth' : id === 'youth' ? 'mentorship' : null;
      if (altId) {
        result = await pool.query(query, [...values, altId]);
      }
    }
    return maybeSanitize(tableName, result.rows)[0];
  } catch (error) {
    console.error(`Error updating record in ${dbTableName}:`, error.message);
    throw error;
  }
};
