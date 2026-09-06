import { db } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";
import { formatPhotoUrl, deleteFromCloudinary } from "../utils/helpers.js";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import axios from "axios";
import {
  detectHymnLanguage,
  repairMultilingualOcrText,
  applyDynamicCorrections,
  learnOcrCorrections,
} from "../utils/hymnDictionary.js";

/**
 * Advanced Sharp preprocessing for sheet music & handwritten lined paper:
 * - Fixes EXIF phone rotation
 * - Upscales to >= 2400px width
 * - Eliminates blue/red notebook ruled lines that slice through cursive letters
 * - Grayscale contrast stretching + binarization/sharpening
 */
async function preprocessForOcr(inputBuffer) {
  try {
    const meta = await sharp(inputBuffer).metadata();
    let pipeline = sharp(inputBuffer).rotate(); // auto-rotate based on EXIF

    const targetWidth = Math.max(meta.width || 1200, 2400);
    pipeline = pipeline.resize({ width: targetWidth, withoutEnlargement: false });

    // Convert to high-contrast grayscale with notebook line suppression
    pipeline = pipeline
      .grayscale()
      .normalize()
      .sharpen({ sigma: 1.8, m1: 0.8, m2: 3.0 })
      .linear(1.4, -30); // darken pen ink, eliminate paper texture & faint ruled lines

    return await pipeline.png().toBuffer();
  } catch (err) {
    logger.warn("Sharp OCR preprocessing skipped: " + err.message);
    return inputBuffer;
  }
}

function getBufferMimeType(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49) return "image/gif";
  if (buf[0] === 0x52 && buf[4] === 0x57) return "image/webp";
  return "image/jpeg";
}

/**
 * Tier 1: Google Gemini Flash Vision API
 * Supports multi-page continuous sheet music (e.g. Page 1 + Page 2 continuation).
 * Tries multiple Gemini models in sequence, retries once on overload/503.
 */
async function runGeminiVisionOcr(inputBuffers, clientKey = "") {
  const apiKey = (clientKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  if (!apiKey) {
    logger.warn("runGeminiVisionOcr: No Gemini API Key configured in environment or request header.");
    return null;
  }

  const buffers = (Array.isArray(inputBuffers) ? inputBuffers : [inputBuffers]).filter(Boolean);
  if (buffers.length === 0) return null;

  const isMultiPage = buffers.length > 1;

  const prompt = `You are an expert Catholic Church Hymn transcriber based in Kenya.
You have been provided ${buffers.length} photo(s) representing page(s) of a Catholic hymn sheet music.
${isMultiPage ? 'IMPORTANT: The provided images are consecutive pages of the SAME hymn (Page 1 followed by Page 2, Page 3, etc.). Merge and continue all verses/chorus seamlessly in exact sequence from page to page into a single complete hymn.' : ''}

Ignore horizontal ruled lines — they are background noise.
Extract and transcribe ALL visible text from top to bottom completely. Supported languages: Swahili, English, Luo (Dholuo), Kikuyu, Kamba, Latin.

CRITICAL INSTRUCTIONS:
1. MULTI-PAGE CONTINUATION: Merge lyrics across all provided pages in order. If Page 1 has Verses 1-2 and Page 2 has Verses 3-5, combine them into one continuous hymn entry with all verses ([Verse 1] through [Verse 5]).
2. MULTIPLE SONGS ON ONE SHEET: If a page contains separate, distinct songs, extract each song separately as an item inside the "songs" array.
3. TRANSCRIBE ALL VERSES: Scan every page down to the very last line. Include EVERY numbered verse (1, 2, 3, 4, 5, 6, 7, 8...). Do NOT stop after 2 verses. Do NOT truncate, summarize, or omit any verse.
4. CHORUS & STANZAS: Label the chorus/refrain as [Chorus] and each numbered stanza as [Verse 1], [Verse 2], [Verse 3], [Verse 4], etc., separated by blank lines.
5. PRESERVE REPETITION: Keep repetition markers like "x2" or "(x2)" exactly as written.
6. EXACT SPELLING: Transcribe all lyrics accurately in their liturgical language.

Return ONLY a valid JSON object (no markdown code blocks outside JSON) with this exact schema:
{
  "songs": [
    {
      "title": "Clean hymn title",
      "category": "marian",
      "language": "Swahili",
      "composer": "",
      "key_signature": "",
      "time_signature": "4/4",
      "tempo": "Moderate",
      "solfa_notation": "",
      "lyrics_text": "[Chorus]\nChorus lines here...\n\n[Verse 1]\nVerse 1 lines here...\n\n[Verse 2]\nVerse 2 lines here..."
    }
  ]
}

category must be one of: marian, mwanzo, utukufu, sadaka, komunyo, shukrani, kutoka, kwaresma, pasaka, noeli, pentecost, patron, general.
language must be one of: Swahili, English, Luo, Kikuyu, Kamba, Latin, Other.`;

  const parts = [{ text: prompt }];
  for (const buf of buffers) {
    parts.push({
      inlineData: {
        mimeType: getBufferMimeType(buf),
        data: buf.toString("base64"),
      },
    });
  }

  // Active Gemini models for Google AI Studio API keys (ordered by reliability)
  const GEMINI_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.7-flash",
  ];

  for (const model of GEMINI_MODELS) {
    let attempt = 0;
    while (attempt < 2) {
      attempt++;
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await axios.post(
          url,
          {
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.05,
              maxOutputTokens: 4096,
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            timeout: 30000,
          }
        );

        const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) break;

        const jsonStart = rawText.indexOf("{");
        const jsonEnd = rawText.lastIndexOf("}");
        if (jsonStart === -1 || jsonEnd === -1) break;

        const parsed = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));
        
        let songsArray = [];
        if (Array.isArray(parsed.songs) && parsed.songs.length > 0) {
          songsArray = parsed.songs;
        } else if (parsed.lyrics_text) {
          songsArray = [parsed];
        }

        if (songsArray.length === 0) break;

        logger.info(`Gemini [${model}] Vision OCR succeeded across ${buffers.length} page(s): found ${songsArray.length} song(s) ("${songsArray[0].title}")`);
        return {
          songs: songsArray,
          ...songsArray[0],
          confidence: 99,
          engine: `gemini-vision (${model})`
        };

      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.error?.message || err.message || "";
        const isOverloaded = status === 503 || status === 429 || /overloaded|spikes in demand|quota|rate/i.test(msg);

        logger.warn(`Gemini [${model}] attempt ${attempt} failed (${status}): ${msg}`);

        if (isOverloaded && attempt < 2) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        break;
      }
    }
  }

  logger.warn("All Gemini Vision models failed or were unavailable — falling back to local OCR.");
  return null;
}

/**
 * Tier 2: Google Cloud Vision API
 */
async function runGoogleVisionOcr(imageBuffer) {
  const apiKey = (process.env.GOOGLE_VISION_API_KEY || "").trim();
  if (!apiKey) return null;

  try {
    const base64Image = imageBuffer.toString("base64");
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      },
      { timeout: 12000 }
    );

    const fullTextAnnotation = response.data?.responses?.[0]?.fullTextAnnotation;
    if (fullTextAnnotation?.text) {
      logger.info("Google Cloud Vision OCR extraction succeeded.");
      return {
        text: fullTextAnnotation.text,
        confidence: 95,
        engine: "google-cloud-vision",
      };
    }
    return null;
  } catch (err) {
    logger.warn("Google Vision OCR fallback failed: " + err.message);
    return null;
  }
}

/**
 * AI Hymn Reconstructor & Structurer using Groq LLM (openai/gpt-oss-120b)
 * Reconstructs, spell-checks and formats raw or messy OCR into beautiful Catholic hymn stanzas
 */
async function reconstructHymnWithGroq(rawText, detectedLang) {
  if (!process.env.GROQ_API_KEY || !rawText || rawText.trim().length < 10) return null;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: "You are a Catholic Hymn & Liturgy transcription expert for Kenya Catholic Church. You transcribe, format and correct hymns (Swahili, English, Luo, Kikuyu, Kamba, Latin). You must output strict JSON only.",
          },
          {
            role: "user",
            content: `The following raw OCR text was extracted from a Catholic hymn sheet or handwritten lyrics page:

"""
${rawText}
"""

Please identify the hymn, correct any OCR letter misreads or phonetic typos, and structure it cleanly.
Return a STRICT JSON object in this format:
{
  "title": "Clean Song Title",
  "category": "marian" (one of: marian, mwanzo, utukufu, sadaka, komunyo, shukrani, kutoka, kwaresma, pasaka, noeli, pentecost, patron, general),
  "language": "${detectedLang || 'Swahili'}" (one of: Swahili, English, Luo, Kikuyu, Kamba, Latin, Other),
  "composer": "Composer if recognized/stated or empty string",
  "key_signature": "Key signature if stated or empty string",
  "time_signature": "4/4",
  "tempo": "Moderate",
  "solfa_notation": "Tonic solfa notation if present or empty string",
  "lyrics_text": "Clean lyrics formatted with [Chorus], [Verse 1], [Verse 2], etc. Stanzas separated by blank lines."
}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      logger.info(`Groq LLM hymn reconstruction succeeded for: "${parsed.title}"`);
      return parsed;
    }
  } catch (err) {
    logger.warn("Groq LLM hymn reconstruction failed: " + (err.response?.data?.error?.message || err.message));
  }
  return null;
}

function cleanPersonName(name) {
  if (!name) return "";
  return name
    .replace(/[0-9\.:\-_=]+/g, "")
    .replace(/\b(arr|comp|mtunzi|jandiko|muhiki|key|solfa|doh)\b/gi, "")
    .trim();
}

function formatTitle(title) {
  if (!title) return "";
  const cleaned = title.replace(/[0-9\.:\-_=]+/g, " ").trim();
  return cleaned
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function detectCategory(text) {
  const t = text.toLowerCase();
  if (/maria|bikira|ave|mama\s*yetu|malkia|nyota\s*ya\s*bahari|nyota\s*ya\s*asubuhi|mariam/i.test(t)) return "marian";
  if (/mwanzo|twende|nyumbani|ingia|tuingie|mlango|shangwe|donjo|entrance/i.test(t)) return "mwanzo";
  if (/utukufu|glory|gloria|huruma|kyrie|bwana\s*u(?:t)?u?hurumie|duong|ngwono/i.test(t)) return "utukufu";
  if (/sadaka|matoleo|mkate|divai|twakutolea|tolea|toeni|misango|offertory|igongona|nthembo/i.test(t)) return "sadaka";
  if (/komunyo|ekaristi|mwili\s*wangu|damu\s*yangu|karamu|panis|altare|remb|ringo|communion/i.test(t)) return "komunyo";
  if (/shukrani|asante|ahsante|tunamshukuru|mshukuruni|erokamino|thanksgiving|ngatho|muvea/i.test(t)) return "shukrani";
  if (/kutoka|toka|enendeni|mwisho|amani\s*ya\s*bwana|recessional/i.test(t)) return "kutoka";
  if (/kwaresma|kwaresima|mateso|msalaba|tubu|sand|lent/i.test(t)) return "kwaresma";
  if (/pasaka|ufufuko|aleluya|amefufuka|kaburi|chier|easter/i.test(t)) return "pasaka";
  if (/noeli|krismasi|bethlehemu|mtoto\s*yesu|kuzaliwa|christmas/i.test(t)) return "noeli";
  if (/roho\s*mtakatifu|pentekoste|pentecost|parakleto|veva/i.test(t)) return "pentecost";
  if (/thomas|akwino|aquinas|msimamizi|patron/i.test(t)) return "patron";
  return "general";
}

function isTonicSolfaLine(line) {
  const t = line.trim();
  if (!t) return false;
  const solfaNotePattern = /\b[drmfslt1-7][,#']?\s*[:\.\-]/i;
  const solfaMeasurePattern = /[:|]\s*[drmfslt1-7][,#']?/i;
  const hasMultipleSolfa = (t.match(/[drmfslt][,#']?[:\.\-]/gi) || []).length >= 2;
  return hasMultipleSolfa || (t.includes('|') && solfaNotePattern.test(t)) || solfaMeasurePattern.test(t);
}

function extractSongTitle(lines) {
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (/^(key|doh|tempo|moderato|andante|allegro|\d+\/\d+|mtunzi|composer|comp|arr|arranged)/i.test(line)) continue;
    if (isTonicSolfaLine(line)) continue;
    if (/^(chorus|mwitikio|kiitikio|verse|ubeti|stanza|wer|rwimbo)/i.test(line)) break;

    const clean = line
      .replace(/^(?:song\s*\d+|wimbo\s+wa\s+[a-z]+|no\.?\s*\d+|\d+[\.\)\-:]\s*)/i, "")
      .replace(/[_\-*~#=]+/g, "")
      .trim();

    if (clean.length >= 3 && clean.length <= 80) {
      return formatTitle(clean);
    }
  }
  return "";
}

function separateLyricsAndSolfa(lines, songTitle) {
  const lyricsLines = [];
  const solfaLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^(key|doh|tempo|moderato|andante|allegro|\d+\/\d+|mtunzi|composer|comp|arr|arranged)\b/i.test(trimmed)) continue;
    if (songTitle && trimmed.toLowerCase().includes(songTitle.toLowerCase()) && trimmed.length <= songTitle.length + 5) continue;

    if (isTonicSolfaLine(trimmed)) {
      solfaLines.push(trimmed);
    } else {
      lyricsLines.push(trimmed);
    }
  }

  const formattedLyrics = [];
  for (let i = 0; i < lyricsLines.length; i++) {
    const l = lyricsLines[i];
    const isMarker = /^(chorus|kwaya|mwitikio|kiitikio|refrain|verse|ubeti|beti|wer|rwimbo|\d+[\.:\)])/i.test(l);
    if (isMarker && formattedLyrics.length > 0) {
      formattedLyrics.push("");
    }
    formattedLyrics.push(l);
  }

  return {
    lyrics: formattedLyrics.join("\n"),
    solfa: solfaLines.join("\n"),
  };
}

export function splitIntoSongSections(rawText) {
  if (!rawText) return [];

  const dividerRegex = /(?:\n\s*[-=_*]{3,}\s*\n|\n\s*\n\s*(?:song\s*[2-9]|wimbo\s*wa\s*(?:pili|tatu|nne)|\b(?:ii|iii|iv)\b|[2-9]\.\s+[A-Za-z]))/i;
  const rawChunks = rawText.split(dividerRegex).map(c => c.trim()).filter(c => c.length > 20);
  if (rawChunks.length > 1) {
    return rawChunks;
  }

  const keyMatches = [...rawText.matchAll(/(?:key|doh\s*(?:is|ni|ya))\s*[:=]?\s*[A-G]/gi)];
  if (keyMatches.length >= 2) {
    const splitIndex = keyMatches[1].index;
    const part1 = rawText.slice(0, splitIndex).trim();
    const part2 = rawText.slice(splitIndex).trim();
    if (part1.length > 30 && part2.length > 30) {
      return [part1, part2];
    }
  }

  return [rawText.trim()];
}

export function parseSmartSongSheet(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const rawSections = splitIntoSongSections(rawText);
  const parsedSongs = [];

  for (let idx = 0; idx < rawSections.length; idx++) {
    const section = rawSections[idx];
    const lines = section.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // 1. Key Signature
    let keySignature = "";
    const keyMatch = section.match(/(?:key|doh\s*(?:is|ni|ya))\s*[:=]?\s*([A-G][#b]?(?:\s*(?:major|minor|maj|min|m))?)/i);
    if (keyMatch) {
      keySignature = keyMatch[1].trim();
    } else {
      const altKey = section.match(/\b([A-G][#b]?)\s*(?:major|minor|maj|min)\b/i);
      if (altKey) keySignature = altKey[0].trim();
    }

    // 2. Time Signature
    let timeSignature = "";
    const timeMatch = section.match(/\b([2346]\/[248])\b/);
    if (timeMatch) timeSignature = timeMatch[1].trim();

    // 3. Tempo
    let tempo = "";
    const tempoMatch = section.match(/\b(allegro|andante|moderato|largo|vivace|presto|adagio|cantabile|kwa kasi|taratibu|wastani)\b/i);
    if (tempoMatch) {
      tempo = tempoMatch[1].charAt(0).toUpperCase() + tempoMatch[1].slice(1).toLowerCase();
    }

    // 4. Composer
    let composer = "";
    const composerMatch = section.match(/(?:mtunzi|composer|comp|arr|arranged\s+by|words\s*(?:&|and)\s*music\s+by|by|jandiko)\s*[:=]?\s*([^\n\r,;:]{3,45})/i);
    if (composerMatch) {
      composer = cleanPersonName(composerMatch[1]);
    } else {
      const nameMatch = section.match(/\b(Fr\.\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|Rev\.\s+[A-Z][a-z]+|Bernard\s+Mukasa|B\.\s*Mukasa|Jude\s+Njoroge|J\.\s*Njoroge|G\.\s*Ndung'u)\b/i);
      if (nameMatch) composer = nameMatch[0].trim();
    }

    // 5. Title
    let title = extractSongTitle(lines);
    if (!title) {
      title = parsedSongs.length > 0 ? `Song ${idx + 1}` : "";
    }

    // 6. Language & Category
    const language = detectHymnLanguage(section);
    const category = detectCategory(section + " " + title);

    // 7. Lyrics & Solfa separation
    const { lyrics, solfa } = separateLyricsAndSolfa(lines, title);

    parsedSongs.push({
      title: title || (parsedSongs.length === 0 ? "Extracted Song" : `Song ${idx + 1}`),
      category,
      composer,
      key_signature: keySignature,
      time_signature: timeSignature || "4/4",
      tempo: tempo || "Moderate",
      language,
      lyrics_text: lyrics || section.trim(),
      solfa_notation: solfa,
      raw_section: section,
    });
  }

  return parsedSongs;
}

/**
 * GET /choir-songs — Public: Fetch list of choir songs with filtering, search, pagination
 */
export const getSongs = async (req, res) => {
  try {
    const moduleId = (req.query.module_id || "choir").toLowerCase();
    const category = req.query.category || "all";
    const language = req.query.language || "all";
    const keySignature = req.query.key_signature;
    const search = req.query.search ? String(req.query.search).trim() : "";
    const sortBy = req.query.sortBy || "newest";
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const offset = (page - 1) * limit;

    const conditions = ["module_id = $1"];
    const values = [moduleId];
    let paramIndex = 2;

    if (category && category !== "all") {
      conditions.push(`LOWER(category) = $${paramIndex}`);
      values.push(category.toLowerCase());
      paramIndex++;
    }

    if (language && language !== "all") {
      conditions.push(`LOWER(language) = $${paramIndex}`);
      values.push(language.toLowerCase());
      paramIndex++;
    }

    if (keySignature && keySignature !== "all") {
      conditions.push(`LOWER(key_signature) = $${paramIndex}`);
      values.push(keySignature.toLowerCase());
      paramIndex++;
    }

    if (search) {
      conditions.push(`(
        title ILIKE $${paramIndex} OR 
        composer ILIKE $${paramIndex} OR 
        coalesce(lyrics_text, '') ILIKE $${paramIndex} OR
        coalesce(solfa_notation, '') ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    // Sorting
    let orderClause = "created_at DESC";
    if (sortBy === "title_asc") orderClause = "title ASC";
    else if (sortBy === "title_desc") orderClause = "title DESC";
    else if (sortBy === "views") orderClause = "views_count DESC, created_at DESC";
    else if (sortBy === "composer") orderClause = "composer ASC NULLS LAST, title ASC";

    // Count query
    const countQuery = `SELECT COUNT(*) AS total FROM choir_songs WHERE ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    // Data query
    const dataQuery = `
      SELECT 
        id, module_id, title, category, composer, key_signature, time_signature, 
        tempo, solfa_notation, lyrics_text, raw_ocr_text, confidence_score,
        image_url, additional_images, audio_url, language, tags, views_count, 
        created_by, created_at, updated_at
      FROM choir_songs
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataValues = [...values, limit, offset];
    const result = await db.query(dataQuery, dataValues);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching choir songs: " + error.message, { stack: error.stack });
    res.status(500).json({ success: false, error: "Failed to fetch songs" });
  }
};

/**
 * GET /choir-songs/stats — Public: Get category & language breakdown & total stats
 */
export const getCategoriesAndStats = async (req, res) => {
  try {
    const moduleId = (req.query.module_id || "choir").toLowerCase();

    const categoryResult = await db.query(
      `SELECT category, COUNT(*) as count 
       FROM choir_songs 
       WHERE module_id = $1 
       GROUP BY category 
       ORDER BY count DESC`,
      [moduleId]
    );

    const languageResult = await db.query(
      `SELECT language, COUNT(*) as count 
       FROM choir_songs 
       WHERE module_id = $1 
       GROUP BY language 
       ORDER BY count DESC`,
      [moduleId]
    );

    const totalResult = await db.query(
      `SELECT COUNT(*) as total, SUM(views_count) as total_views 
       FROM choir_songs 
       WHERE module_id = $1`,
      [moduleId]
    );

    const popularResult = await db.query(
      `SELECT id, title, category, composer, key_signature, views_count, image_url
       FROM choir_songs 
       WHERE module_id = $1 
       ORDER BY views_count DESC 
       LIMIT 5`,
      [moduleId]
    );

    res.json({
      success: true,
      total: parseInt(totalResult.rows[0]?.total || "0", 10),
      totalViews: parseInt(totalResult.rows[0]?.total_views || "0", 10),
      categories: categoryResult.rows,
      languages: languageResult.rows,
      popularSongs: popularResult.rows,
    });
  } catch (error) {
    logger.error("Error fetching song stats: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch song statistics" });
  }
};

/**
 * GET /choir-songs/:id — Public: Get a single song by ID & increment view count
 */
export const getSongById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT * FROM choir_songs WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Song not found" });
    }

    db.query(`UPDATE choir_songs SET views_count = views_count + 1 WHERE id = $1`, [id]).catch(err =>
      logger.warn("Could not increment song view: " + err.message)
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error("Error fetching song by ID: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch song" });
  }
};

/**
 * GET /choir-songs/check-duplicate — Smart fuzzy duplicate detector against full database
 */
export const checkDuplicateSong = async (req, res) => {
  try {
    const title = (req.query.title || "").trim();
    const moduleId = (req.query.module_id || "choir").toLowerCase();
    const excludeId = req.query.exclude_id ? parseInt(req.query.exclude_id, 10) : null;

    if (!title) {
      return res.json({ success: true, isDuplicate: false, duplicate: null });
    }

    const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");

    let query = `SELECT id, module_id, title, category, composer, key_signature, language, lyrics_text, image_url, created_at FROM choir_songs WHERE module_id = $1`;
    const params = [moduleId];
    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }

    const result = await db.query(query, params);
    
    let match = null;
    for (const song of result.rows) {
      const sNorm = (song.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!sNorm) continue;

      // Exact normalized match
      if (sNorm === normTitle) {
        match = song;
        break;
      }
      // Substring match for titles >= 4 chars
      if (normTitle.length >= 4 && sNorm.length >= 4) {
        if (sNorm.includes(normTitle) || normTitle.includes(sNorm)) {
          match = song;
          break;
        }
      }
    }

    if (match) {
      return res.json({
        success: true,
        isDuplicate: true,
        duplicate: match,
      });
    }

    return res.json({
      success: true,
      isDuplicate: false,
      duplicate: null,
    });
  } catch (error) {
    logger.error("Error checking song duplicate: " + error.message);
    res.status(500).json({ success: false, error: "Failed to check duplicate" });
  }
};

/**
 * POST /choir-songs/batch-create — Admin: Batch save multiple songs extracted from sheet image(s)
 */
export const batchCreateSongs = async (req, res) => {
  try {
    let songsData = [];
    if (req.body.songs) {
      try {
        songsData = typeof req.body.songs === "string" ? JSON.parse(req.body.songs) : req.body.songs;
      } catch (parseErr) {
        logger.error("JSON parse error on req.body.songs: " + parseErr.message);
        return res.status(400).json({ success: false, error: "Invalid songs JSON format" });
      }
    } else if (Array.isArray(req.body)) {
      songsData = req.body;
    }

    if (!Array.isArray(songsData) || songsData.length === 0) {
      return res.status(400).json({ success: false, error: "Songs array is required" });
    }

    const moduleId = (req.body.module_id || "choir").toLowerCase();
    let imageUrl = req.body.image_url || "";
    let cloudinaryPublicId = null;
    let additionalImages = [];

    if (req.files?.sheet_image?.[0]) {
      imageUrl = formatPhotoUrl(req.files.sheet_image[0]);
      cloudinaryPublicId = req.files.sheet_image[0].filename || null;
    } else if (req.file) {
      imageUrl = formatPhotoUrl(req.file);
      cloudinaryPublicId = req.file.filename || null;
    }

    if (req.files?.additional_sheets && Array.isArray(req.files.additional_sheets)) {
      additionalImages = req.files.additional_sheets.map(f => formatPhotoUrl(f)).filter(Boolean);
    } else if (req.body.additional_images) {
      additionalImages = Array.isArray(req.body.additional_images)
        ? req.body.additional_images
        : (typeof req.body.additional_images === 'string' ? JSON.parse(req.body.additional_images) : []);
    }

    if (!imageUrl && songsData[0]?.image_url) {
      imageUrl = songsData[0].image_url;
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, error: "Sheet music photo or song image is required" });
    }

    const createdBy = req.user?.name || req.user?.username || "Admin";
    const createdSongs = [];

    for (const s of songsData) {
      const songTitle = (s.title || "").trim();
      if (!songTitle) continue;

      const songCategory = (s.category || "marian").toLowerCase().trim();
      const songLang = (s.language || "Swahili").trim();
      const confidence = s.confidence_score !== undefined && s.confidence_score !== null && !isNaN(Number(s.confidence_score)) 
        ? Number(s.confidence_score) 
        : null;

      const insertQuery = `
        INSERT INTO choir_songs (
          module_id, title, category, composer, key_signature, time_signature, 
          tempo, solfa_notation, lyrics_text, raw_ocr_text, confidence_score,
          image_url, cloudinary_public_id, additional_images, audio_url, language, tags, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `;

      const values = [
        moduleId,
        songTitle,
        songCategory,
        s.composer ? s.composer.trim() : null,
        s.key_signature ? s.key_signature.trim() : null,
        s.time_signature ? s.time_signature.trim() : null,
        s.tempo ? s.tempo.trim() : null,
        s.solfa_notation ? s.solfa_notation.trim() : null,
        s.lyrics_text ? s.lyrics_text.trim() : null,
        s.raw_ocr_text ? s.raw_ocr_text.trim() : null,
        confidence,
        imageUrl,
        cloudinaryPublicId,
        JSON.stringify(Array.isArray(additionalImages) ? additionalImages : []),
        s.audio_url ? s.audio_url.trim() : null,
        songLang,
        Array.isArray(s.tags) ? s.tags : [],
        createdBy
      ];

      const result = await db.query(insertQuery, values);
      createdSongs.push(result.rows[0]);
    }

    logger.info(`Batch created ${createdSongs.length} songs in repertoire successfully.`);
    res.status(201).json({ success: true, count: createdSongs.length, data: createdSongs });
  } catch (error) {
    logger.error("Error batch creating choir songs: " + error.message, { stack: error.stack });
    res.status(500).json({ success: false, error: error.message || "Failed to batch create songs" });
  }
};

/**
 * POST /choir-songs/ocr-extract — Admin: Multi-Tier Vision & Multilingual OCR extraction
 */
export const extractLyricsOcr = async (req, res) => {
  let worker = null;
  try {
    let imageBuffers = [];
    if (req.files) {
      if (Array.isArray(req.files.images)) {
        imageBuffers.push(...req.files.images.map(f => f.buffer).filter(Boolean));
      }
      if (Array.isArray(req.files.image)) {
        imageBuffers.push(...req.files.image.map(f => f.buffer).filter(Boolean));
      }
    } else if (req.file?.buffer) {
      imageBuffers.push(req.file.buffer);
    }

    if (imageBuffers.length === 0) {
      return res.status(400).json({ success: false, error: "Image file is required for OCR extraction" });
    }

    const clientGeminiKey = (req.headers['x-gemini-api-key'] || req.body.gemini_api_key || "").trim();
    const hasEnvKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    logger.info(`Starting OCR extraction across ${imageBuffers.length} page(s). Gemini Key present: ${Boolean(clientGeminiKey) || hasEnvKey}`);

    // Tier 1: Check Google Gemini Flash Vision (multi-page continuation support)
    const geminiResult = await runGeminiVisionOcr(imageBuffers, clientGeminiKey);
    if (geminiResult) {
      let songList = [];
      if (Array.isArray(geminiResult.songs) && geminiResult.songs.length > 0) {
        songList = geminiResult.songs.map((s, idx) => ({
          title: s.title || `Song ${idx + 1}`,
          category: s.category || detectCategory(s.lyrics_text || ''),
          language: s.language || detectHymnLanguage(s.lyrics_text || ''),
          composer: s.composer || '',
          key_signature: s.key_signature || '',
          time_signature: s.time_signature || '4/4',
          tempo: s.tempo || 'Moderate',
          solfa_notation: s.solfa_notation || '',
          lyrics_text: s.lyrics_text || '',
          raw_section: s.lyrics_text || '',
        }));
      } else if (geminiResult.lyrics_text) {
        songList = [{
          title: geminiResult.title || "Extracted Song",
          category: geminiResult.category || detectCategory(geminiResult.lyrics_text),
          language: geminiResult.language || detectHymnLanguage(geminiResult.lyrics_text),
          composer: geminiResult.composer || "",
          key_signature: geminiResult.key_signature || "",
          time_signature: geminiResult.time_signature || "4/4",
          tempo: geminiResult.tempo || "Moderate",
          solfa_notation: geminiResult.solfa_notation || "",
          lyrics_text: geminiResult.lyrics_text,
          raw_section: geminiResult.lyrics_text,
        }];
      }

      if (songList.length > 0) {
        const firstSong = songList[0];
        return res.json({
          success: true,
          count: songList.length,
          pageCount: imageBuffers.length,
          songs: songList,
          firstSong: firstSong,
          extractedLyrics: firstSong.lyrics_text,
          guessedTitle: firstSong.title,
          language: firstSong.language,
          rawText: songList.map(s => `[${s.title}]\n${s.lyrics_text}`).join('\n\n---\n\n'),
          confidence: geminiResult.confidence || 99,
          engine: geminiResult.engine || "gemini-vision",
          geminiConfigured: true,
        });
      }
    }

    // Tier 2: Check Google Cloud Vision API
    const visionResult = await runGoogleVisionOcr(imageBuffers[0]);
    let rawText = "";
    let confidence = 0;
    let engineUsed = "tesseract";

    if (visionResult && visionResult.text) {
      rawText = visionResult.text;
      confidence = visionResult.confidence;
      engineUsed = visionResult.engine;
    } else {
      // Tier 3: High-clarity Sharp image preprocessing + Tesseract.js
      const preprocessedBuffer = await preprocessForOcr(imageBuffers[0]);

      worker = await createWorker(['eng', 'swa']);
      await worker.setParameters({
        tessedit_pageseg_mode: '3',
      });

      const ret = await worker.recognize(preprocessedBuffer);
      rawText = ret.data?.text || "";
      confidence = ret.data?.confidence || 0;

      if (rawText.trim().length < 20 && imageBuffers[0].length > 0) {
        const fallbackRet = await worker.recognize(imageBuffers[0]);
        if ((fallbackRet.data?.text || "").trim().length > rawText.trim().length) {
          rawText = fallbackRet.data?.text || "";
          confidence = fallbackRet.data?.confidence || confidence;
        }
      }
    }

    // Detect Language & apply language-specific liturgical dictionaries
    const detectedLang = detectHymnLanguage(rawText);
    let cleanedRawText = repairMultilingualOcrText(rawText, detectedLang);

    // Apply dynamic learned corrections from database
    cleanedRawText = await applyDynamicCorrections(cleanedRawText, detectedLang, db);

    // AI Post-Processing
    const aiReconstruction = await reconstructHymnWithGroq(cleanedRawText, detectedLang);

    let parsedSongs = [];
    if (aiReconstruction && aiReconstruction.lyrics_text && aiReconstruction.lyrics_text.length >= 20) {
      parsedSongs = [
        {
          title: aiReconstruction.title || extractSongTitle(cleanedRawText.split(/\n/)) || "Extracted Song",
          category: aiReconstruction.category || detectCategory(aiReconstruction.lyrics_text),
          language: aiReconstruction.language || detectedLang,
          composer: aiReconstruction.composer || "",
          key_signature: aiReconstruction.key_signature || "",
          time_signature: aiReconstruction.time_signature || "4/4",
          tempo: aiReconstruction.tempo || "Moderate",
          solfa_notation: aiReconstruction.solfa_notation || "",
          lyrics_text: aiReconstruction.lyrics_text,
          raw_section: cleanedRawText,
        },
      ];
      engineUsed = engineUsed === "tesseract" ? "tesseract+groq-ai" : engineUsed;
      confidence = Math.max(confidence, 88);
    } else {
      parsedSongs = parseSmartSongSheet(cleanedRawText);
    }

    const firstSong = parsedSongs[0] || null;

    logger.info(`Smart OCR completed via [${engineUsed}]: detected language = ${detectedLang}, songs found = ${parsedSongs.length}, confidence = ${confidence}%`);

    if (parsedSongs.length === 0 && !cleanedRawText.trim()) {
      return res.json({
        success: true,
        count: 0,
        songs: [],
        extractedLyrics: "",
        rawText: "",
        guessedTitle: "",
        confidence: 0,
        language: detectedLang,
        message: "No legible text could be recognized automatically. You can type or paste the lyrics into the editor below."
      });
    }

    res.json({
      success: true,
      count: parsedSongs.length,
      songs: parsedSongs,
      firstSong: firstSong,
      extractedLyrics: firstSong?.lyrics_text || cleanedRawText.trim(),
      guessedTitle: firstSong?.title || "",
      language: detectedLang,
      rawText: cleanedRawText,
      confidence: Math.round(confidence),
      engine: engineUsed
    });
  } catch (error) {
    logger.error("OCR Extraction failed: " + error.message, { stack: error.stack });
    res.status(500).json({ 
      success: false, 
      error: "OCR text extraction could not complete (" + (error.message || "Unknown error") + "). You can type or paste the lyrics manually." 
    });
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
  }
};

/**
 * POST /choir-songs — Admin: Create a new song record & feed correction learner
 */
export const createSong = async (req, res) => {
  try {
    const {
      module_id = "choir",
      title,
      category,
      composer,
      key_signature,
      time_signature,
      tempo,
      solfa_notation,
      lyrics_text,
      raw_ocr_text,
      confidence_score,
      audio_url,
      language = "Swahili",
      tags,
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ success: false, error: "Title and Category are required" });
    }

    let imageUrl = req.body.image_url || "";
    let cloudinaryPublicId = null;
    let additionalImages = [];

    if (req.files?.sheet_image?.[0]) {
      imageUrl = formatPhotoUrl(req.files.sheet_image[0]);
      cloudinaryPublicId = req.files.sheet_image[0].filename || null;
    } else if (req.file) {
      imageUrl = formatPhotoUrl(req.file);
      cloudinaryPublicId = req.file.filename || null;
    }

    if (req.files?.additional_sheets && Array.isArray(req.files.additional_sheets)) {
      additionalImages = req.files.additional_sheets.map(f => formatPhotoUrl(f)).filter(Boolean);
    } else if (req.body.additional_images) {
      additionalImages = Array.isArray(req.body.additional_images)
        ? req.body.additional_images
        : (typeof req.body.additional_images === 'string' ? JSON.parse(req.body.additional_images) : []);
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, error: "Sheet music or song image is required" });
    }

    const tagsArray = Array.isArray(tags) 
      ? tags 
      : (typeof tags === "string" ? tags.split(",").map(t => t.trim()).filter(Boolean) : []);

    const createdBy = req.user?.name || req.user?.username || "Admin";

    const insertQuery = `
      INSERT INTO choir_songs (
        module_id, title, category, composer, key_signature, time_signature, 
        tempo, solfa_notation, lyrics_text, raw_ocr_text, confidence_score,
        image_url, cloudinary_public_id, additional_images, audio_url, language, tags, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const values = [
      module_id.toLowerCase(),
      title.trim(),
      category.toLowerCase().trim(),
      composer ? composer.trim() : null,
      key_signature ? key_signature.trim() : null,
      time_signature ? time_signature.trim() : null,
      tempo ? tempo.trim() : null,
      solfa_notation ? solfa_notation.trim() : null,
      lyrics_text ? lyrics_text.trim() : null,
      raw_ocr_text ? raw_ocr_text.trim() : null,
      confidence_score ? Number(confidence_score) : null,
      imageUrl,
      cloudinaryPublicId,
      JSON.stringify(Array.isArray(additionalImages) ? additionalImages : []),
      audio_url ? audio_url.trim() : null,
      language ? language.trim() : "Swahili",
      tagsArray,
      createdBy
    ];

    const result = await db.query(insertQuery, values);

    if (raw_ocr_text && lyrics_text) {
      learnOcrCorrections(raw_ocr_text, lyrics_text, language || "Swahili", db).catch(err =>
        logger.warn("Correction learning non-fatal error: " + err.message)
      );
    }

    logger.info(`Choir song created: "${title}" (ID: ${result.rows[0].id}) with ${additionalImages.length} continuation page(s)`);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error("Error creating choir song: " + error.message, { stack: error.stack });
    res.status(500).json({ success: false, error: "Failed to create song" });
  }
};

/**
 * PUT /choir-songs/:id — Admin: Update an existing song
 */
export const updateSong = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      composer,
      key_signature,
      time_signature,
      tempo,
      solfa_notation,
      lyrics_text,
      raw_ocr_text,
      confidence_score,
      audio_url,
      language,
      tags,
    } = req.body;

    const existing = await db.query(`SELECT * FROM choir_songs WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Song not found" });
    }

    const song = existing.rows[0];
    let imageUrl = song.image_url;
    let cloudinaryPublicId = song.cloudinary_public_id;
    let additionalImages = song.additional_images || [];

    if (req.files?.sheet_image?.[0]) {
      if (imageUrl && imageUrl.includes("cloudinary.com")) {
        await deleteFromCloudinary(imageUrl);
      }
      imageUrl = formatPhotoUrl(req.files.sheet_image[0]);
      cloudinaryPublicId = req.files.sheet_image[0].filename || null;
    } else if (req.file) {
      if (imageUrl && imageUrl.includes("cloudinary.com")) {
        await deleteFromCloudinary(imageUrl);
      }
      imageUrl = formatPhotoUrl(req.file);
      cloudinaryPublicId = req.file.filename || null;
    } else if (req.body.image_url && req.body.image_url !== song.image_url) {
      imageUrl = req.body.image_url;
    }

    if (req.files?.additional_sheets && Array.isArray(req.files.additional_sheets)) {
      additionalImages = req.files.additional_sheets.map(f => formatPhotoUrl(f)).filter(Boolean);
    } else if (req.body.additional_images) {
      additionalImages = Array.isArray(req.body.additional_images)
        ? req.body.additional_images
        : (typeof req.body.additional_images === 'string' ? JSON.parse(req.body.additional_images) : []);
    }

    const tagsArray = tags !== undefined
      ? (Array.isArray(tags) ? tags : (typeof tags === "string" ? tags.split(",").map(t => t.trim()).filter(Boolean) : []))
      : song.tags;

    const updateQuery = `
      UPDATE choir_songs SET
        title = COALESCE($1, title),
        category = COALESCE($2, category),
        composer = $3,
        key_signature = $4,
        time_signature = $5,
        tempo = $6,
        solfa_notation = $7,
        lyrics_text = $8,
        raw_ocr_text = COALESCE($9, raw_ocr_text),
        confidence_score = COALESCE($10, confidence_score),
        image_url = $11,
        cloudinary_public_id = $12,
        additional_images = $13,
        audio_url = $14,
        language = COALESCE($15, language),
        tags = $16,
        updated_at = NOW()
      WHERE id = $17
      RETURNING *
    `;

    const values = [
      title ? title.trim() : null,
      category ? category.toLowerCase().trim() : null,
      composer !== undefined ? (composer ? composer.trim() : null) : song.composer,
      key_signature !== undefined ? (key_signature ? key_signature.trim() : null) : song.key_signature,
      time_signature !== undefined ? (time_signature ? time_signature.trim() : null) : song.time_signature,
      tempo !== undefined ? (tempo ? tempo.trim() : null) : song.tempo,
      solfa_notation !== undefined ? (solfa_notation ? solfa_notation.trim() : null) : song.solfa_notation,
      lyrics_text !== undefined ? (lyrics_text ? lyrics_text.trim() : null) : song.lyrics_text,
      raw_ocr_text ? raw_ocr_text.trim() : null,
      confidence_score ? Number(confidence_score) : null,
      imageUrl,
      cloudinaryPublicId,
      JSON.stringify(Array.isArray(additionalImages) ? additionalImages : []),
      audio_url !== undefined ? (audio_url ? audio_url.trim() : null) : song.audio_url,
      language ? language.trim() : null,
      tagsArray,
      id
    ];

    const result = await db.query(updateQuery, values);

    if (lyrics_text && (raw_ocr_text || song.raw_ocr_text)) {
      learnOcrCorrections(raw_ocr_text || song.raw_ocr_text, lyrics_text, language || song.language || "Swahili", db).catch(() => {});
    }

    logger.info(`Choir song updated: "${result.rows[0].title}" (ID: ${id})`);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error("Error updating choir song: " + error.message, { stack: error.stack });
    res.status(500).json({ success: false, error: "Failed to update song" });
  }
};

/**
 * DELETE /choir-songs/:id — Admin: Delete a song and its Cloudinary photo
 */
export const deleteSong = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.query(`SELECT * FROM choir_songs WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Song not found" });
    }

    const song = existing.rows[0];

    if (song.image_url && song.image_url.includes("cloudinary.com")) {
      await deleteFromCloudinary(song.image_url);
    }

    await db.query(`DELETE FROM choir_songs WHERE id = $1`, [id]);

    logger.info(`Choir song deleted: "${song.title}" (ID: ${id})`);
    res.json({ success: true, message: "Song deleted successfully" });
  } catch (error) {
    logger.error("Error deleting choir song: " + error.message);
    res.status(500).json({ success: false, error: "Failed to delete song" });
  }
};

/**
 * GET /choir-songs/programmes — Public: Get synced Sunday / Friday / Feasts Mass Programmes
 */
export const getProgrammes = async (req, res) => {
  try {
    const moduleId = (req.query.module_id || "choir").toLowerCase();
    const programType = req.query.program_type;

    let query = `
      SELECT 
        p.id as programme_item_id, p.program_type, p.position, p.service_role, p.notes,
        s.*
      FROM choir_song_programmes p
      JOIN choir_songs s ON p.song_id = s.id
      WHERE p.module_id = $1
    `;
    const params = [moduleId];

    if (programType && programType !== "all") {
      query += ` AND p.program_type = $2`;
      params.push(programType);
    }

    query += ` ORDER BY p.position ASC, p.created_at ASC`;

    const result = await db.query(query, params);

    const programmes = {
      sunday: [],
      friday: [],
      tuesday: [],
      saturday: [],
      special: []
    };

    result.rows.forEach(row => {
      const type = row.program_type || 'sunday';
      if (!programmes[type]) programmes[type] = [];
      programmes[type].push(row);
    });

    res.json({
      success: true,
      data: result.rows,
      programmes,
    });
  } catch (error) {
    logger.error("Error fetching choir programmes: " + error.message);
    res.status(500).json({ success: false, error: "Failed to fetch programmes" });
  }
};

/**
 * POST /choir-songs/programmes/toggle — Toggle song into a Mass programme (Sunday/Friday)
 */
export const toggleSongInProgramme = async (req, res) => {
  try {
    const { module_id = "choir", program_type = "sunday", song_id, service_role, notes } = req.body;

    if (!song_id) {
      return res.status(400).json({ success: false, error: "song_id is required" });
    }

    const addedBy = req.user?.name || req.user?.username || "Chorister";

    const existing = await db.query(
      `SELECT * FROM choir_song_programmes WHERE module_id = $1 AND program_type = $2 AND song_id = $3`,
      [module_id.toLowerCase(), program_type.toLowerCase(), song_id]
    );

    if (existing.rows.length > 0) {
      await db.query(
        `DELETE FROM choir_song_programmes WHERE id = $1`,
        [existing.rows[0].id]
      );
      return res.json({ success: true, action: "removed", message: "Removed from programme" });
    } else {
      const maxPos = await db.query(
        `SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM choir_song_programmes WHERE module_id = $1 AND program_type = $2`,
        [module_id.toLowerCase(), program_type.toLowerCase()]
      );
      const nextPos = maxPos.rows[0]?.next_pos || 1;

      const inserted = await db.query(
        `INSERT INTO choir_song_programmes (module_id, program_type, song_id, position, service_role, notes, added_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [module_id.toLowerCase(), program_type.toLowerCase(), song_id, nextPos, service_role || null, notes || null, addedBy]
      );
      return res.json({ success: true, action: "added", message: "Added to programme", data: inserted.rows[0] });
    }
  } catch (error) {
    logger.error("Error toggling programme song: " + error.message);
    res.status(500).json({ success: false, error: "Failed to update programme" });
  }
};
