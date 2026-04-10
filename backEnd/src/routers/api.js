import { Router } from "express";
import {
  getTableData,
  createRecord,
  deleteRecord,
  getAllData,
} from "../controllers/ApiController.js";
import logger from "../logger/winston.js";

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
  "mpesa_request",
  "suggestions",
];

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

// GET all data from all tables (must be before /:table route)
api.get("/all/data", async (req, res) => {
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
api.get("/:table", validateTable, async (req, res) => {
  try {
    const { table } = req.params;
    const data = await getTableData(table);
    logger.debug(`Success fetching from route '/:table'`);
    return res.json(data);
  } catch (error) {
    logger.error(`Error in '/:table': ${error.message}\n${error.stack}`);

    return res.status(500).json({ error: error.message });
  }
});

// POST create a new record in a table
api.post("/:table", validateTable, async (req, res) => {
  try {
    const { table } = req.params;
    const newRecord = await createRecord(table, req.body);
    logger.debug(`newRecord created from route '/:table'`);

    return res.status(201).json(newRecord);
  } catch (error) {
    logger.error(`Error in POST '/:table': ${error.message}`);

    return res.status(500).json({ error: error.message });
  }
});

// DELETE a record from a table
api.delete("/:table/:id", validateTable, async (req, res) => {
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
