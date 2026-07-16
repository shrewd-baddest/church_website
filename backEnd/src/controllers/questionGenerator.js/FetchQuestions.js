


import Question from "../../model/question.js";

// GET /questions?limit=10
export const getDailyQuestions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const questions = await Question.aggregateRandom(limit);
    return res.json(questions);
  } catch (err) {
    console.error("Error fetching questions:", err);
    return res.status(500).json({ message: "Failed to fetch questions" });
  }
};