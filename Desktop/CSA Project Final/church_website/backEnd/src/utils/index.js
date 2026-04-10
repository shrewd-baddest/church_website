
import fs from "fs";
import  cloudinary  from "../Configs/cloudinaryConfigs.js";
import { testDb } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js"


export const parseQuestionBlock = (block) => {
  const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

  // First line must look like "1. **Question...**"
  let questionText = lines[0]?.replace(/^\d+\.\s*/, "");
  questionText = questionText?.replace(/^\*+|\*+$/g, ""); // strip **

  if (!questionText || !/^\d+\./.test(lines[0])) return null;

  // Next 4 lines = options (A) or A.)
  const answers = lines.slice(1, 5).map(line => {
    const match = line.match(/^([A-Da-d])[\.\)]\s*(.*)$/);
    if (!match) return null;
    return { option: `${match[1].toLowerCase()})`, text: match[2] };
  }).filter(Boolean);

  if (answers.length !== 4) return null;

  // Find correct answer line
  const answerLine = lines.find(l => /correct answer:/i.test(l));
  if (!answerLine) return null;

  const match = answerLine.match(/correct answer:\s*([A-Da-d])[\.\)]?\s*(.*)?/i);
  if (!match) return null;

  const correctOption = `${match[1].toLowerCase()})`;

  // Explanation line may be separate
  const explanationLine = lines.find(l => /explanation:/i.test(l));
  const explanation = explanationLine
    ? explanationLine.replace(/^\*?Explanation:\*?\s*/i, "")
    : "No explanation provided";

  const correctAnswerText = answers.find(a => a.option === correctOption)?.text || match[2] || "";

  return {
    questionText,
    answers,
    correctAnswer: {
      option: correctOption,
      text: correctAnswerText,
      explanation
    }
  };
};


export const sansitiseAndParseQuestionBlock = (content)=>{

   const array =  content.split(/(?:\n\s*\n|---)/) // split on blank lines OR ---
          .map((block, i) => {
            const parsed = parseQuestionBlock(block);
            if (!parsed) {
              logger.warn(`Skipping malformed block #${i}:`, block);
              return null;
            }
            return { ...parsed, createdAt: new Date() };
          })
          .filter(Boolean);

          return array
}


// Upload a single file to Cloudinary and save its metadata in the database
 export async function uploadOneFile(file) {
  const result = await cloudinary.uploader.upload(file.path, {
    resource_type: "auto",
  });

  if (!result || !result.secure_url) {
    throw new Error("Cloudinary upload failed");
  }

  // Remove temporary file created by Multer
  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  // Insert metadata into database
  const insertQuery =
    "INSERT INTO uploads (public_id, url, format, resource_type, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING *";
  const values = [
    result.public_id,
    result.secure_url,
    result.format,
    result.resource_type,
    result.created_at,
  ];

  const dbResult = await testDb.query(insertQuery, values);

  // Return a structured response for the client
  return  dbResult.rows[0]
}


// Upload multiple files to Cloudinary and save metadata in DB
// Includes one retry attempt for failed uploads, then cleans up failed files
export async function uploadManyFiles(files, retry = false) {
  // Try uploading all files in parallel
  const settledResults = await Promise.allSettled(
    files.map((file) => uploadOneFile(file))
  );

  const successes = []; // store successful uploads
  const failures = [];  // store failed uploads

  // Collect results
  for (const [index, result] of settledResults.entries()) {
    if (result.status === "fulfilled") {
      successes.push(result.value);
    } else {
      failures.push(files[index]);
      logger.warn(
        `Upload failed for ${files[index].originalname}: ${result.reason.message}`
      );
    }
  }

  // Retry once if there are failures and retry flag is false
  if (failures.length > 0 && !retry) {
    logger.info(`Retrying ${failures.length} failed upload(s)...`);
    const retryResults = await uploadManyFiles(failures, true); // retry once to avoid endress looping incae a file never upload successifuly
    successes.push(...retryResults.successes);

    // Clean up any files that still failed after retry
    for (const failedFile of retryResults.failures) {
      if (fs.existsSync(failedFile.path)) {
        fs.unlinkSync(failedFile.path);
        logger.info(`Deleted failed file from disk: ${failedFile.originalname}`);
      }
    }

    return {
      success: true,
      message: "Files uploaded with some retries",
      count: successes.length,
      data: successes,
      failures: retryResults.failures.map((f) => f.originalname),
    };
  }

  // Final structured response for client
  return {
    success: true,
    message: failures.length === 0   ? "All files uploaded successfully"  : "Some files failed to upload",
    count: successes.length,
    data: successes,
    failures: failures.map((f) => f.originalname),
  };
}


