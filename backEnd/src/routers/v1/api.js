import { Router } from "express";
import {
  getTableData,
  createRecord,
  deleteRecord,
  updateRecord,
  getAllData,
} from "../../controllers/ApiController.js";
import logger from "../../logger/winston.js";

export const api = Router();

// Allowed tables for security
const allowedTables = [
  "members",
  "events",
  "contributions",
  "officials",
  "projects",
  "activities",
  "gallery",
  "jumuiya",
  "users",
  "products",
  "config",
  "mpesa_request",
  "hub_modules",
  "hub_activities",
  "hub_announcements",
  "hub_officials",
  "hub_gallery",
  "enrollments",
  "suggestions",
  "products",
  "orders",
  "hire_requests",
  "product_categories",
];

// Tables that contain sensitive member/financial data — read access is admin-only
const PRIVATE_TABLES = new Set([
  "members", "contributions", "users", "mpesa_request",
  "suggestions", "orders", "hire_requests",
]);

// Roles permitted to read/write private tables or perform any write operation
const API_ADMIN_ROLES = ["supreme_admin", "admin", "csa_chair", "csa_secretary", "csa_vice_chair"];

const isAdminRole = (req) => {
  const userRoles = req.user?.role;
  const normalized = (Array.isArray(userRoles) ? userRoles : [userRoles])
    .map((r) => String(r).toLowerCase().trim());
  return normalized.some((r) => API_ADMIN_ROLES.includes(r));
};

// Middleware to validate table name
const validateTable = (req, res, next) => {
  const tableName = req.params.table;
  if (!allowedTables.includes(tableName)) {
    logger.warn(`Invalid table name: ${tableName}`);
    return res.status(400).json({ error: `Invalid table name: ${tableName}` });
  }
  logger.info(`valid table name: ${tableName}`);
  next();
};

// Middleware to guard private tables and all write operations
const validatePrivateAccess = (req, res, next) => {
  const table = req.params.table;
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (PRIVATE_TABLES.has(table) && !isAdminRole(req)) {
    logger.warn(`Unauthorized access attempt on private table '${table}' by member ${req.user?.member_id}`);
    return res.status(403).json({ error: "Access denied: administrative role required for this table" });
  }
  next();
};

// Middleware that always requires an admin role (for writes)
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (!isAdminRole(req)) {
    return res.status(403).json({ error: "Access denied: administrative role required" });
  }
  next();
};

// GET all data from all tables — admin only
api.get("/all/data", requireAdmin, async (req, res) => {
  try {
    const data = await getAllData();
    logger.debug(`received data from route '/all/data'`);
    return res.json(data);
  } catch (error) {
    logger.error(`Error in '/all/data': ${error.message}\n${error.stack}`);
    res.status(500).json({ error: error.message });
  }
});

// GET all records from a table
api.get("/:table", validateTable, validatePrivateAccess, async (req, res) => {
  try {
    const { table } = req.params;
    let data = await getTableData(table, req.query);
    
    if (table === 'enrollments') {
      data = data.map(item => {
        if (['charismatic', 'dancers', 'youth'].includes(item.module_id) || ['charismatic', 'dancers', 'youth'].includes(item.class_id)) {
          return {
            id: item.id,
            fullName: item.full_name,
            phoneNumber: item.phone,
            email: item.email || 'N/A',
            registrationDate: item.enrolled_at,
            status: item.status,
            module_id: item.module_id,
            class_id: item.class_id
          };
        }
        return item;
      });
    }

    logger.debug(`Success fetching from route '/:table'`);
    return res.json(data);
  } catch (error) {
    logger.error(`Error in '/:table': ${error.message}\n${error.stack}`);

    // If the error looks like a DB connection problem, return 503 Service Unavailable
    const msg = (error && error.message) ? error.message : '';
    if (msg.includes('connect ECONNREFUSED') || msg.includes('getaddrinfo ENOTFOUND') || msg.includes('database') || msg.includes('connection')) {
      return res.status(503).json({ error: 'Database unavailable. Please try again later.' });
    }

    return res.status(500).json({ error: error.message });
  }
});

// POST create a new record in a table
api.post("/:table", validateTable, validatePrivateAccess, requireAdmin, async (req, res) => {
  try {
    const { table } = req.params;
    
    if (table === 'enrollments' && ['charismatic', 'dancers', 'youth'].includes(req.body.community || req.body.module_id)) {
      const targetModule = req.body.community || req.body.module_id;
      const payload = {
        full_name: req.body.fullName || req.body.full_name || req.body.name,
        phone: req.body.phoneNumber || req.body.phone,
        email: req.body.email || '',
        module_id: targetModule,
        class_id: targetModule,
        status: req.body.status || 'Pending'
      };
      req.body = payload;
      logger.info(`Mapping ${targetModule} registration payload: ${JSON.stringify(payload)}`);
    }

    const newRecord = await createRecord(table, req.body);
    logger.debug(`newRecord created from route '/:table'`);

    return res.status(201).json(newRecord);
  } catch (error) {
    logger.error(`Error in POST '/:table': ${error.message}`);

    const msg = (error && error.message) ? error.message : '';
    if (msg.includes('connect ECONNREFUSED') || msg.includes('getaddrinfo ENOTFOUND') || msg.includes('database') || msg.includes('connection')) {
      return res.status(503).json({ error: 'Database unavailable. Please try again later.' });
    }

    return res.status(500).json({ error: error.message });
  }
});

// PATCH update a record in a table
api.patch("/:table/:id", validateTable, validatePrivateAccess, requireAdmin, async (req, res) => {
  try {
    const { table, id } = req.params;
    const updated = await updateRecord(table, id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Record not found" });
    }
    return res.json(updated);
  } catch (error) {
    logger.error(`Error in PATCH '/:table/:id': ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE a record from a table
api.delete("/:table/:id", validateTable, validatePrivateAccess, requireAdmin, async (req, res) => {
  try {
    const { table, id } = req.params;
    const deleted = await deleteRecord(table, id);
    if (!deleted) {
      logger.warn(
        `${(table, id)}  from route '/:table' method delete failed to resolve`,
      );
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(deleted);
  } catch (error) {
    logger.error(`${error.message}  from route '/:table' delete table route`);

    res.status(500).json({ error: error.message });
  }
});
