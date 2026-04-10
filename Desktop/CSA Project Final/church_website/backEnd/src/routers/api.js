import { Router } from "express";
import {
  getTableData,
  createRecord,
  deleteRecord,
  getAllData,
} from "../controllers/ApiController.js";
import logger from "../logger/winston.js";
import { BackendDataService } from "../services/backend-data.js";

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
  "jumuiya",  "users",  "semester",  "weekly",
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

// GET /api/weekly - weekly activities
api.get("/weekly", (req, res) => {
  res.json(BackendDataService.load("weekly.json", []));
});

// GET /api/semester - semester events
api.get("/semester", (req, res) => {
  res.json(BackendDataService.load("semester.json", []));
});

// POST /api/semester
api.post("/semester", async (req, res) => {
  try {
    const { datetime, title, venue, description } = req.body;
    
    // Validate required fields
    if (!title || !venue || !datetime) {
      return res.status(400).json({ error: 'Title, venue, and datetime are required' });
    }
    
    // Validate datetime
    const testDate = new Date(datetime);
    if (isNaN(testDate.getTime())) {
      return res.status(400).json({ error: 'Invalid datetime format. Use ISO format like 2026-01-31T08:00:00' });
    }
    
    const currentData = BackendDataService.load("semester.json", []);
    const maxId = currentData.length > 0 ? Math.max(...currentData.map((d) => d.id)) : 0;
    const newEvent = {
      id: maxId + 1,
      title,
      datetime,
      venue,
      description: description || '',
      imageUrl: req.body.imageUrl || ''
    };
    const updatedData = [...currentData, newEvent];
    BackendDataService.save("semester.json", updatedData);
    res.status(201).json(newEvent);
  } catch (error) {
    logger.error(`Error adding semester event: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/semester/:id
api.delete("/semester/:id", async (req, res) => {
  try {
    let data = BackendDataService.load("semester.json", []);
    const id = parseInt(req.params.id);
    const initialLength = data.length;
    data = data.filter((d) => d.id !== id);
    if (data.length === initialLength) {
      return res.status(404).json({ error: "Event not found" });
    }
    BackendDataService.save("semester.json", data);
    res.json({ success: true });
  } catch (error) {
    logger.error(`Error deleting semester event: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// GET all data from all tables (must be before /:table route)
api.get("/all/data", async (req, res) => {
  try {
    const data = await getAllData();
    logger.debug(`received data ${data} from route '/all/data'`);
    return res.json(data);
  } catch (error) {
    logger.error(`${error.message}  from route '/all/data'`);
    res.status(500).json({ error: error.message });
  }
});

// GET all records from a table
api.get("/:table", validateTable, async (req, res) => {
  try {
    const { table } = req.params;
    const data = await getTableData(table);
    logger.debug(`received data ${data} from route '/:table'`);
    return res.json(data);
  } catch (error) {
    logger.error(`${error.message}  from route '/:table'`);
    return res.status(500).json({ error: error.message });
  }
});

// POST create a new record in a table
api.post("/:table", validateTable, async (req, res) => {
  try {
    const { table } = req.params;
    const newRecord = await createRecord(table, req.body);
    logger.debug(`newRecord created ${newRecord} from route '/:table'`);
    return res.status(201).json(newRecord);
  } catch (error) {
    logger.error(`${error.message}  from route '/:table'`);
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
        `\`Record ${table}, ${id} from route '/:table' method delete failed to resolve\``,
      );
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(deleted);
  } catch (error) {
    logger.error(`${error.message}  from route '/:table' delete table route`);
    res.status(500).json({ error: error.message });
  }
});
