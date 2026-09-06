import { db } from "../src/Configs/dbConfig.js";

async function setupChoirAdvanced() {
  console.log("Starting Choir Advanced DB Migration...");
  try {
    // 1. Ensure choir_songs table has all columns
    await db.query(`
      CREATE TABLE IF NOT EXISTS choir_songs (
        id SERIAL PRIMARY KEY,
        module_id VARCHAR(50) DEFAULT 'choir',
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        composer VARCHAR(255),
        key_signature VARCHAR(50),
        time_signature VARCHAR(50),
        tempo VARCHAR(50),
        solfa_notation TEXT,
        lyrics_text TEXT,
        raw_ocr_text TEXT,
        confidence_score NUMERIC(5,2),
        image_url TEXT NOT NULL,
        cloudinary_public_id TEXT,
        additional_images TEXT[],
        audio_url TEXT,
        language VARCHAR(50) DEFAULT 'Swahili',
        tags TEXT[],
        views_count INT DEFAULT 0,
        created_by VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Add any missing columns to choir_songs if table already existed
    const alterColumns = [
      "ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS key_signature VARCHAR(50);",
      "ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS time_signature VARCHAR(50);",
      "ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS tempo VARCHAR(50);",
      "ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS solfa_notation TEXT;",
      "ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS lyrics_text TEXT;",
      "ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS raw_ocr_text TEXT;",
      "ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,2);",
      "ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS additional_images TEXT[];",
      "ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS audio_url TEXT;",
      "ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'Swahili';",
      "ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS tags TEXT[];",
      "ALTER TABLE choir_songs ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0;",
    ];

    for (const sql of alterColumns) {
      await db.query(sql);
    }

    // 2. Create choir_ocr_corrections table (Self-learning correction dictionary)
    await db.query(`
      CREATE TABLE IF NOT EXISTS choir_ocr_corrections (
        id SERIAL PRIMARY KEY,
        language VARCHAR(50) NOT NULL DEFAULT 'all',
        original_phrase TEXT NOT NULL,
        corrected_phrase TEXT NOT NULL,
        frequency INT DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_correction_per_lang UNIQUE (language, original_phrase)
      );
    `);

    // Index for high-speed word replacement queries
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ocr_corrections_lang ON choir_ocr_corrections (language);
    `);

    // 3. Create choir_song_programmes table (Cloud-persisted Mass Programmes: Sunday / Friday / Feasts)
    await db.query(`
      CREATE TABLE IF NOT EXISTS choir_song_programmes (
        id SERIAL PRIMARY KEY,
        module_id VARCHAR(50) NOT NULL DEFAULT 'choir',
        program_type VARCHAR(50) NOT NULL DEFAULT 'sunday',
        song_id INT NOT NULL REFERENCES choir_songs(id) ON DELETE CASCADE,
        position INT DEFAULT 0,
        service_role VARCHAR(100),
        added_by VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_song_in_program UNIQUE (module_id, program_type, song_id)
      );
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_choir_programmes ON choir_song_programmes (module_id, program_type, position);
    `);

    console.log("Choir Advanced DB Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

setupChoirAdvanced();
