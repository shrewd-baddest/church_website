// this is the structure of  a single question based on the model described below 
// {
//   "_id": "65f1c2a9e4b0f123456789ab",
//   "questionText": "What does the parable of the Prodigal Son teach us?",
//   "answers": [
//     { "option": "a)", "text": "God’s unconditional love" },
//     { "option": "b)", "text": "Strict punishment for sin" },
//     { "option": "c)", "text": "Wealth leads to happiness" },
//     { "option": "d)", "text": "Family unity above all" }
//   ],
//   "correctAnswer": {
//     "option": "a)",
//     "text": "God’s unconditional love",
//     "explanation": "The parable emphasizes forgiveness and mercy, showing God’s love for repentant sinners."
//   },
//   "createdAt": "2026-03-12T10:30:00.000Z",
//   "__v": 0
// }

import logger from "../logger/winston.js";
import mongoose from "mongoose";

// Define the Question schema
const QuestionSchema = new mongoose.Schema({
HEAD
  questionText: {
    type: String,
    required: true,
  },
  answers: [
    {
      option: { type: String, required: true },
      text: { type: String, required: true },   
    }
  ],
  correctAnswer: {
    option: { type: String, required: true },  
    text: { type: String, required: true },    
    explanation: { type: String, required: true },
  },
  createdAt: {
    type: Date,
    default: Date.now, // timestamp when the question is created
  }

  questionText: { type: String, required: true },
  answers: [
    {
      option: { type: String, required: true },
      text: { type: String, required: true },
    },
  ],
 correctAnswer: {
  option: { type: String, required: true },
  text: { type: String, required: true, default: "Answer not provided" },
  explanation: { type: String, required: true, default: "Explanation not provided" },
},
  createdAt: { type: Date, default: Date.now },
 
});

// Create the model
const Question = mongoose.model("question", QuestionSchema);

export default Question;

// --- TTL Index Setup ---
// This runs once when the DB connection is open.
// It creates a TTL index on the "createdAt" field that expires documents after 3 days (259200 seconds).
// This means any question document will be automatically deleted 3 days after its creation time, helping to manage storage and ensure questions are fresh for users.
// insteade of directly writing a crone job , the mongodb provide the clone job by default 
mongoose.connection.once("open", async () => {
  try {
      await mongoose.connection.db.collection("questions").createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 259200 } // 3 days
    );
    logger.debug("TTL index created: questions will auto-delete after 3 days")
  } catch (err) {
    logger.error("Error creating TTL index:", err);
  }
});
