


import Question from "../../model/question.js";

// GET /questions?limit=10
export const getDailyQuestions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Fetch random questions using MongoDB aggregation
    const questions = await Question.aggregate([
      { $sample: { size: limit } },
      {
        $project: {
          _id: 0,
          questionText: 1,
          answers: 1,
          correctAnswer: 1,
          createdAt: 1,
        },
      },
    ]);

    return res.json(questions);
  } catch (err) {
    console.error("Error fetching questions:", err);
    return res.status(500).json({ message: "Failed to fetch questions" });
  }
};