import { testDb as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const migration = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        answers JSONB NOT NULL,
        correct_answer JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    logger.info("questions table created or already exists");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attempts (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES questions(id),
        member_id VARCHAR NOT NULL,
        jumuiya_id VARCHAR NOT NULL,
        selected_option VARCHAR NOT NULL,
        is_correct BOOLEAN NOT NULL,
        attempted_at TIMESTAMP DEFAULT NOW()
      );
    `);
    logger.info("attempts table created or already exists");

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_attempts_jumuiya ON attempts(jumuiya_id, question_id);
    `);
    logger.info("index on attempts created or already exists");
  } catch (err) {
    logger.error("questionsMigration failed:", err.message);
    throw err;
  }
};

export default migration;
