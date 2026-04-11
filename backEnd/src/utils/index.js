import fs from "fs";
import cloudinary from "../Configs/cloudinaryConfigs.js";
import { testDb } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";
import { ApiError } from "./ApiError.js";

export const parseQuestionBlock = (block) => {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

  // First line must look like "1. **Question...**"
  let questionText = lines[0]?.replace(/^\d+\.\s*/, "");
  questionText = questionText?.replace(/^\*+|\*+$/g, ""); // strip **

  if (!questionText || !/^\d+\./.test(lines[0])) return null;

  // Next 4 lines = options (A) or A.)
  const answers = lines
    .slice(1, 5)
    .map((line) => {
      const match = line.match(/^([A-Da-d])[\.\)]\s*(.*)$/);
      if (!match) return null;
      return { option: `${match[1].toLowerCase()})`, text: match[2] };
    })
    .filter(Boolean);

  if (answers.length !== 4) return null;

  // Find correct answer line
  const answerLine = lines.find((l) => /correct answer:/i.test(l));
  if (!answerLine) return null;

  const match = answerLine.match(
    /correct answer:\s*([A-Da-d])[\.\)]?\s*(.*)?/i,
  );
  if (!match) return null;

  const correctOption = `${match[1].toLowerCase()})`;

  // Explanation line may be separate
  const explanationLine = lines.find((l) => /explanation:/i.test(l));
  const explanation = explanationLine
    ? explanationLine.replace(/^\*?Explanation:\*?\s*/i, "")
    : "No explanation provided";

  const correctAnswerText =
    answers.find((a) => a.option === correctOption)?.text || match[2] || "";

  return {
    questionText,
    answers,
    correctAnswer: {
      option: correctOption,
      text: correctAnswerText,
      explanation,
    },
  };
};

export const sansitiseAndParseQuestionBlock = (content) => {
  const array = content
    .split(/(?:\n\s*\n|---)/) // split on blank lines OR ---
    .map((block, i) => {
      const parsed = parseQuestionBlock(block);
      if (!parsed) {
        logger.warn(`Skipping malformed block #${i}:`, block);
        return null;
      }
      return { ...parsed, createdAt: new Date() };
    })
    .filter(Boolean);

  return array;
};


// Upload a single file to Cloudinary and save its metadata in the database
export async function uploadOneFile(file) {
  const result = await cloudinary.uploader.upload(file.path, {
    resource_type: "auto", // this ensures the resource is directrly detected instead of us saying the resource is either a video or a url
  });

  if (!result || !result.secure_url) {
    throw new ApiError( 502 ,"Cloudinary upload failed")
  }

  // Remove temporary file created by Multer to clean up disk storage , remeber this file "localfileuploads"
  //  is included if you want to perform any kind of operation of the file like compression e.t.c
  // but since we dont have anything to performing then we need to remove the file from the machine storage saving storage
  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  // Insert metadata into database table called upload as indicated in the schema for postgree
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
  return dbResult.rows[0];
}


// Upload multiple files to Cloudinary and save metadata in DB
// Includes one retry attempt for failed uploads, then cleans up failed files
// this function liks to the uploadOnefile as an abstraction for claen code structure as indicated in line 130
export async function uploadManyFiles(files, retry = false) {

  const successesUploadedFiles = []; // store successful uploads
  const faildeToUploadFiles = []; // store failed uploads

  // Try uploading all files in parallel rather than uploading one at a time , we will use promise.allsettled
  // where we could use promise.all but the problem with that is if one file fails the entire continuation is rejected by the promise 
  // we try to avoid looping caues it will inclease the time complexity

  const settledResults = await Promise.allSettled(
    files.map((file) => uploadOneFile(file)),
  );


  console.log(settledResults , "settledResults fromuploadmanyfiles utility folder");
  
  // Collect results though iteration
  //.entries property gives us an array of [key ,  value] pairs
  //where we are interating through each entrie distructuring each key and value pair and there attributes to help us indetify pas or failed uploade file
  for (const [index, result] of settledResults?.entries()) {
    if (result.status === "fulfilled") {
      successesUploadedFiles.push(result.value);
    } else {
      faildeToUploadFiles.push(files[index]);
      logger.warn(
        `Upload failed for ${files[index].originalname}: ${result.reason.error}`,
      );
    }
  }

  // Retry once if there are faildeToUploadFiles and retry flag is false
  // we should also ensure no looping as this might freeze the app if there exist a file that is always failling through a flag [rety]
  if (faildeToUploadFiles.length > 0 && !retry) {
    logger.info(`Retrying ${faildeToUploadFiles.length} failed upload(s)...`);
    const retryResults = await uploadManyFiles(faildeToUploadFiles, true); // retry once to avoid endress looping incase a file never upload successifuly
    successesUploadedFiles.push(...retryResults?.successesUploadedFiles);


    // Clean up any files that still failed after retry
    for (const failedFile of retryResults?.faildeToUploadFiles) {
      if (fs.existsSync(failedFile.path)) {
        fs.unlinkSync(failedFile.path);
        logger.info(
          `Deleted failed file from disk: ${failedFile.originalname}`,
        );
      }
      // also we must enusre to clean up the  faildeToUploadFiles=[] 
      // array after 1 retry to avoid the code going up to this upper if block again 
      //  `if (faildeToUploadFiles.length > 0 && !retry)` since the faildeToUploadFiles will be empty
      retryResults.faildeToUploadFiles=[];
    }

    return {
      success: true,
      message: "Files uploaded with some retries",
      count: successesUploadedFiles.length,
      data: successesUploadedFiles,
      faildeToUploadFiles: retryResults.faildeToUploadFiles.map((f) => f.originalname),
    };
  }

  // Final structured response for client
  return {
    success: true,
    message: faildeToUploadFiles.length === 0 ? "All files uploaded successfully" : "Some files failed to upload",
    count: successesUploadedFiles.length,
    data: successesUploadedFiles,
    faildeToUploadFiles: faildeToUploadFiles.map((f) => f.originalname),
  };
}

//  * * *For example:**
//  * * This can occur when product is created.
//  * * In product creation process the images are getting uploaded before product gets created.
//  * * Once images are uploaded and if there is an error creating a product, the uploaded images are unused.
//  * * In such case, this function will remove those unused images.
//  */
export const removeUnusedMulterImageFilesOnError = (req) => {
  try {
    const multerFile = req.file;
    const multerFiles = req.files;

    if (multerFile) {
      // If there is file uploaded and there is validation error
      // We want to remove that file
      if (fs.existsSync(multerFile.path)) {
        fs.unlinkSync(multerFile.path);
      }
    }

    if (multerFiles) {
      if (Array.isArray(multerFiles)) {
        multerFiles.forEach((fileObject) => {
          if (fs.existsSync(fileObject.path)) {
            fs.unlinkSync(fileObject.path);
          }
        });
      } else {
        /** @type {Express.Multer.File[][]}  */
        const filesValueArray = Object.values(multerFiles);
        // If there are multiple files uploaded for more than one fields
        // We want to remove those files as well
        filesValueArray.forEach((fileFields) => {
          fileFields.forEach((fileObject) => {
            if (fs.existsSync(fileObject.path)) {
              fs.unlinkSync(fileObject.path);
            }
          });
        });
      }
    }
  } catch (error) {
    // fail silently
    logger.error(`Error while removing image files: ${error.message || error}`);
  }
};
