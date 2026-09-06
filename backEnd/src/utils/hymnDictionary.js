/**
 * Multilingual Catholic Hymn Dictionaries, Typo Repair & Language Intelligence
 * Supports: Swahili, English, Luo (Dholuo), Kamba (Kikamba), Kikuyu (Gikuyu), and Latin
 */

// Core liturgical & hymn vocabulary dictionaries for validation and scoring
export const HYMN_VOCABULARY = {
  Swahili: [
    "bwana", "mungu", "yesu", "kristo", "maria", "bikira", "mwokozi", "mtakatifu",
    "roho", "sadaka", "matoleo", "komunyo", "ekaristi", "mwili", "damu", "mkate",
    "divai", "utukufu", "huruma", "shukrani", "aleluya", "kwaya", "mwitikio",
    "kiitikio", "ubeti", "beti", "amani", "upendo", "neema", "mbinguni", "malaika",
    "msalaba", "mateso", "ufufuko", "kwaresma", "pasaka", "krismasi", "noeli",
    "mwanzo", "kutoka", "altare", "sala", "shangwe", "tumsifu", "tuimbe", "asante"
  ],
  Luo: [
    "nyasaye", "ruoth", "yesu", "kristo", "maria", "mariam", "jawar", "malo",
    "roho", "maler", "chieng", "hono", "kwero", "wer", "wende", "misango",
    "kwayo", "komunyo", "remb", "ringo", "kuon", "divai", "duong", "ngwono",
    "erokamino", "aleluya", "kwaya", "chuny", "hera", "ngima", "polo", "malaika",
    "musalaba", "sand", "chier", "pasaka", "nyathi", "dhi", "donjo", "yie", "pakuru"
  ],
  Kikuyu: [
    "ngai", "mwathani", "jesu", "kristu", "maria", "muthuuri", "muhonokia", "mutheru",
    "roho", "iguru", "maboro", "igongona", "rutha", "uthuuro", "rwimbo", "nyimbo",
    "iria", "maguta", "mugate", "ndibei", "ugwati", "tha", "ngatho", "aleluya",
    "kwaya", "wendo", "muoyo", "matui", "araika", "mutharaba", "kuriuka",
    "krismasi", "guka", "tondu", "mwene", "nyaga", "kinya", "hingo", "kiheo"
  ],
  Kamba: [
    "ngai", "mwathani", "yesu", "klisto", "mbiu", "asa", "mutangi", "mutheu",
    "veva", "itu", "nthembo", "muvango", "muthukumi", "wathi", "wathii",
    "mukate", "ndivai", "nzaiko", "tei", "muvea", "aleluya", "kwaya", "wendo",
    "thayu", "utha", "ngewa", "malaika", "muthalaba", "kuthuka", "kisyoka",
    "kutheka", "ivinda", "kutaa", "nzau", "kuthukumila"
  ],
  Latin: [
    "dominus", "domine", "deus", "iesus", "christus", "maria", "sanctus", "sancta",
    "spiritus", "corpus", "sanguis", "panis", "angelicus", "gloria", "in", "excelsis",
    "kyrie", "eleison", "christe", "agnus", "dei", "tantum", "ergo", "pange", "lingua",
    "salve", "regina", "ave", "credo", "amen", "alleluia", "laudate", "magnificat",
    "ora", "pro", "nobis", "miserere", "requiem", "benedictus", "te", "deum"
  ],
  English: [
    "lord", "god", "jesus", "christ", "mary", "virgin", "savior", "holy", "spirit",
    "offering", "sacrifice", "communion", "eucharist", "body", "blood", "bread", "wine",
    "glory", "mercy", "thanksgiving", "alleluia", "hallelujah", "chorus", "refrain",
    "verse", "peace", "love", "grace", "heaven", "angels", "cross", "resurrection",
    "lent", "easter", "christmas", "entrance", "recessional", "altar", "prayer", "praise"
  ]
};

/**
 * Detect language by checking matches against dictionary tokens and grammatical markers
 */
export function detectHymnLanguage(text) {
  if (!text || !text.trim()) return "Swahili";
  const tokens = text.toLowerCase().match(/\b[a-z']{3,}\b/g) || [];
  if (tokens.length === 0) return "Swahili";

  const scores = {
    Swahili: 0,
    Luo: 0,
    Kikuyu: 0,
    Kamba: 0,
    Latin: 0,
    English: 0
  };

  tokens.forEach(tok => {
    for (const [lang, vocab] of Object.entries(HYMN_VOCABULARY)) {
      if (vocab.includes(tok)) {
        scores[lang] += 2;
      }
    }
  });

  // Phonetic/N-gram clues
  const raw = text.toLowerCase();
  if (/\b(nyasaye|ruoth|jawar|pol|chuny|chier|donjo|ber|kamano)\b/.test(raw)) scores.Luo += 5;
  if (/\b(ngai|mwathani|muhonokia|mutheru|mutharaba|wendo|mwene)\b/.test(raw)) scores.Kikuyu += 5;
  if (/\b(veva|mutangi|mutheu|muthalaba|muvea|nthembo|kuthuka)\b/.test(raw)) scores.Kamba += 5;
  if (/\b(bwana|mungu|mwokozi|utukufu|mwitikio|ubeti|huruma)\b/.test(raw)) scores.Swahili += 4;
  if (/\b(dominus|sanctus|gloria|eleison|agnus|panis|tantum)\b/.test(raw)) scores.Latin += 6;
  if (/\b(the|and|our|lord|praise|we|give|thanks|father)\b/.test(raw)) scores.English += 4;

  let bestLang = "Swahili";
  let maxScore = -1;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore && score > 0) {
      maxScore = score;
      bestLang = lang;
    }
  }

  return bestLang;
}

/**
 * Multilingual typo repair: fixes common OCR character swaps and misread liturgical words
 */
export function repairMultilingualOcrText(text, targetLang = null) {
  if (!text) return "";
  const lang = targetLang || detectHymnLanguage(text);

  let cleaned = text
    // Global OCR cleanup (staff line residues, symbols, misread punctuation)
    .replace(/[~^¢§©®™`´]/g, "")
    .replace(/^[_\-=+*#|]{3,}$/gm, "")
    .replace(/[|]{2,}/g, "|")
    // Fix common number/letter OCR errors in stanza tags
    .replace(/\b(?:mw[i!l1][t!l1][i!l1]k[i!l1]o|mwitiki0|mwltlko)\b/gi, "Mwitikio")
    .replace(/\b(?:ub[e3c]t[i!l1]|u8eti|u8et!)\b/gi, "Ubeti")
    .replace(/\b(?:k[i!l1][i!l1]t[i!l1]k[i!l1]o|kiitiki0)\b/gi, "Kiitikio")
    .replace(/\b(?:ch[o0]ru[s5]|ch0ru5)\b/gi, "Chorus")
    .replace(/\b(?:v[e3]rs[e3]|v3rse)\b/gi, "Verse")
    .replace(/\b(?:r[e3]fra[i!l1]n)\b/gi, "Refrain");

  // Language-specific typo rules
  if (lang === "Swahili") {
    cleaned = cleaned
      .replace(/\b(?:8wana|bw4na|bwan4|bwan|bvvana)\b/gi, "Bwana")
      .replace(/\b(?:mvngu|mungv|munguu|mungu'|mung0)\b/gi, "Mungu")
      .replace(/\b(?:s4daka|sad4ka|sadak4|sada|sdaka)\b/gi, "Sadaka")
      .replace(/\b(?:k0munyo|komuny0|komunio|komvnyo)\b/gi, "Komunyo")
      .replace(/\b(?:[e3]kar[i!l1]st[i!l1]|ekarlstl|ekaristi!)\b/gi, "Ekaristi")
      .replace(/\b(?:mar[i!l1]a|marla|mari4)\b/gi, "Maria")
      .replace(/\b(?:b[i!l1]k[i!l1]ra|blkira|bikir4)\b/gi, "Bikira")
      .replace(/\b(?:al[e3]luy[a4]|alelu!a|a1e1uya|alleluy[a4])\b/gi, "Aleluya")
      .replace(/\b(?:utuk[u0]fu|utukvfu|vtukufu|utukuf)\b/gi, "Utukufu")
      .replace(/\b(?:shukran[i!l1]|shukranl|shukr4ni)\b/gi, "Shukrani")
      .replace(/\b(?:mtakat[i!l1]fu|mtak4tifu|mtakatlfu)\b/gi, "Mtakatifu")
      .replace(/\b(?:mwok[o0]z[i!l1]|mw0kozi|mwokozl)\b/gi, "Mwokozi")
      .replace(/\b(?:yes[uv]|ycsu|yesuu)\b/gi, "Yesu")
      .replace(/\b(?:kr[i!l1]st[o0]|krlsto|krist0)\b/gi, "Kristo")
      .replace(/\b(?:hurum[a4]|hurum4)\b/gi, "Huruma");
  } else if (lang === "Luo") {
    cleaned = cleaned
      .replace(/\b(?:nyas4ye|nyasay[e3]|nyasay)\b/gi, "Nyasaye")
      .replace(/\b(?:ru[o0]th|ru0th|ruoth!)\b/gi, "Ruoth")
      .replace(/\b(?:jaw4r|jaw[a4]r|jawarr)\b/gi, "Jawar")
      .replace(/\b(?:m[a4]l[e3]r|maler!)\b/gi, "Maler")
      .replace(/\b(?:mis4ngo|misang[o0])\b/gi, "Misango")
      .replace(/\b(?:er[o0]kamin[o0]|erokamin)\b/gi, "Erokamino")
      .replace(/\b(?:w[e3]r|w[e3]nd[e3])\b/gi, "Wer")
      .replace(/\b(?:chun[y|i]|chvny)\b/gi, "Chuny")
      .replace(/\b(?:h[o0]n[o0]|hon0)\b/gi, "Hono");
  } else if (lang === "Kikuyu") {
    cleaned = cleaned
      .replace(/\b(?:ng4i|nga[i!l1]|ngal)\b/gi, "Ngai")
      .replace(/\b(?:mwathan[i!l1]|mwathanl)\b/gi, "Mwathani")
      .replace(/\b(?:muh[o0]n[o0]kia|muhonoki4)\b/gi, "Muhonokia")
      .replace(/\b(?:muth[e3]ru|muth3ru)\b/gi, "Mutheru")
      .replace(/\b(?:mutharab[a4]|muthar4ba)\b/gi, "Mutharaba")
      .replace(/\b(?:ngath[o0]|ngath0)\b/gi, "Ngatho")
      .replace(/\b(?:ig[o0]ng[o0]na|igong0na)\b/gi, "Igongona")
      .replace(/\b(?:mwen[e3]\s*nyag[a4])\b/gi, "Mwene Nyaga");
  } else if (lang === "Kamba") {
    cleaned = cleaned
      .replace(/\b(?:ng4i|nga[i!l1]|ngal)\b/gi, "Ngai")
      .replace(/\b(?:mwathan[i!l1]|mwathanl)\b/gi, "Mwathani")
      .replace(/\b(?:mutang[i!l1]|mutangl)\b/gi, "Mutangi")
      .replace(/\b(?:muthe[uv]|muth3u)\b/gi, "Mutheu")
      .replace(/\b(?:vev[a4]|v3va)\b/gi, "Veva")
      .replace(/\b(?:nthemb[o0]|nthemb0)\b/gi, "Nthembo")
      .replace(/\b(?:muve[a4]|muv3a)\b/gi, "Muvea");
  } else if (lang === "Latin") {
    cleaned = cleaned
      .replace(/\b(?:d[o0]min[uv]s|d0minus)\b/gi, "Dominus")
      .replace(/\b(?:sanct[uv]s|sanctvs)\b/gi, "Sanctus")
      .replace(/\b(?:gl[o0]ria|gl0ria)\b/gi, "Gloria")
      .replace(/\b(?:kyr[i!l1][e3]|kyrl3)\b/gi, "Kyrie")
      .replace(/\b(?:[e3]l[e3][i!l1]s[o0]n|elels0n)\b/gi, "eleison")
      .replace(/\b(?:agn[uv]s\s*d[e3][i!l1])\b/gi, "Agnus Dei")
      .replace(/\b(?:tant[uv]m\s*[e3]rg[o0])\b/gi, "Tantum Ergo")
      .replace(/\b(?:pan[i!l1]s\s*ang[e3]l[i!l1]c[uv]s)\b/gi, "Panis Angelicus");
  }

  return cleaned;
}

/**
 * Applies dynamic learned corrections from database to text
 */
export async function applyDynamicCorrections(text, lang, dbPool) {
  if (!text || !dbPool) return text;
  try {
    const res = await dbPool.query(
      `SELECT original_phrase, corrected_phrase FROM choir_ocr_corrections 
       WHERE (language = $1 OR language = 'all') AND frequency >= 1
       ORDER BY LENGTH(original_phrase) DESC LIMIT 200`,
      [lang.toLowerCase()]
    );

    let patched = text;
    for (const row of res.rows) {
      if (!row.original_phrase || !row.corrected_phrase) continue;
      const escaped = row.original_phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      patched = patched.replace(regex, row.corrected_phrase);
    }
    return patched;
  } catch (err) {
    console.warn("Could not apply dynamic corrections:", err.message);
    return text;
  }
}

/**
 * Learns and records word/phrase diffs between raw OCR and user-edited lyrics
 */
export async function learnOcrCorrections(rawOcr, editedText, lang, dbPool) {
  if (!rawOcr || !editedText || !dbPool) return;
  try {
    const rawWords = rawOcr.trim().split(/\s+/).filter(w => w.length >= 3);
    const editedWords = editedText.trim().split(/\s+/).filter(w => w.length >= 3);

    // Track matching pairs where edit distance is 1 or 2 (typo correction)
    for (let i = 0; i < Math.min(rawWords.length, editedWords.length); i++) {
      const rw = rawWords[i].replace(/[^\w]/g, '');
      const ew = editedWords[i].replace(/[^\w]/g, '');

      if (rw && ew && rw.toLowerCase() !== ew.toLowerCase() && rw.length >= 3 && ew.length >= 3) {
        // Only record if similar length (indicating correction of a misread word rather than total rewrite)
        if (Math.abs(rw.length - ew.length) <= 2) {
          await dbPool.query(`
            INSERT INTO choir_ocr_corrections (language, original_phrase, corrected_phrase, frequency, updated_at)
            VALUES ($1, $2, $3, 1, NOW())
            ON CONFLICT (language, original_phrase)
            DO UPDATE SET 
              frequency = choir_ocr_corrections.frequency + 1,
              corrected_phrase = EXCLUDED.corrected_phrase,
              updated_at = NOW()
          `, [lang.toLowerCase(), rw, ew]);
        }
      }
    }
  } catch (err) {
    console.warn("Failed to record OCR corrections:", err.message);
  }
}
