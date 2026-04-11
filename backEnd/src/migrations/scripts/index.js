import { fileURLToPath } from "url";
import { testDb } from "../../Configs/dbConfig.js";
import logger from "../../logger/winston.js";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const runMigration = async () => {
    try {
        // Load migration SQL file
        const migrationPath = path.join(__dirname, "../", "permissions_update.sql");
        logger.info(`Loading migration from ${migrationPath}`);
        const migrationSQL = fs.readFileSync(migrationPath, "utf8");
        logger.info("Starting migration...");

        // Run inside transaction
        await testDb.query(migrationSQL);



        logger.info("Migration applied successfully.");
    } catch (error) {
        logger.error("Migration failed, rolling back:", error, { stack: error.stack });
        try {
            await testDb.query("ROLLBACK");
        } catch (rollbackError) {
            logger.error("Rollback failed:", rollbackError.message, { stack: rollbackError.stack });
        }
        process.exit(1); // exit if migration fails
    }
};
