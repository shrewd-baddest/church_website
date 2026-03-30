
import { ChatEventEnum } from "../../constant.js";
import Attempt from "../../model/attemptSchema.js";

// "/attempts",
export const recordAtempts = async (req, res) => {
  const { questionId, memberId, jumuiyaId, selectedOption, isCorrect } = req.body;
  try {
    const attempt = await Attempt.create({
      questionId,
      memberId,
      jumuiyaId,
      selectedOption,
      isCorrect,
    });
    // Broadcast attempt to jumuiya room for real-time updates
    io.to(jumuiyaId).emit(ChatEventEnum.QUESTION_ATTEMPT_EVENT , attempt);

    res.json(attempt);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error recording attempt");
  }
};

// "/attempts/jumuiya/:jumuiyaId"
export const getAttemptsForAJumuiya =  async (req, res) => {
  try {
    const { jumuiyaId } = req.params;
    const stats = await Attempt.aggregate([
      { $match: { jumuiyaId } },
      {
        $group: {
          _id: "$jumuiyaId",
          totalAttempts: { $sum: 1 },
          correctAttempts: { $sum: { $cond: ["$isCorrect", 1, 0] } },
        },
      },
    ]);
    res.json(stats[0] || { jumuiyaId, totalAttempts: 0, correctAttempts: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching jumuiya stats");
  }
};

// "/attempts/csa",
export const csaLevelComparison =  async (req, res) => {
  try {
    const stats = await Attempt.aggregate([
      {
        $group: {
          _id: "$jumuiyaId",
          totalAttempts: { $sum: 1 },
          correctAttempts: { $sum: { $cond: ["$isCorrect", 1, 0] } },
        },
      },
    ]);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching CSA stats");
  }
};


