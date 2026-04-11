import Attempt from "../../model/attemptSchema.js";

export const getMemberProgress = async (req, res) => {
  try {
    const memberId = req.user.memberId; // from auth middleware

    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    const stats = await Attempt.aggregate([
      {
        $match: {
          memberId,
          attemptedAt: { $gte: threeWeeksAgo },
        },
      },
      {
        $addFields: {
          week: {
            $ceil: {
              $divide: [
                { $subtract: ["$attemptedAt", threeWeeksAgo] },
                1000 * 60 * 60 * 24 * 7,
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: "$week",
          totalAttempts: { $sum: 1 },
          correctAttempts: {
            $sum: { $cond: ["$isCorrect", 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Fill missing weeks (important)
    const result = [1, 2, 3].map((week) => {
      const found = stats.find((s) => s._id === week);
      return (
        found || {
          _id: week,
          totalAttempts: 0,
          correctAttempts: 0,
        }
      );
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching member progress");
  }
};


export const getMemberSummary = async (req, res) => {
  try {
    const memberId = req.user.memberId;

    const stats = await Attempt.aggregate([
      { $match: { memberId } },
      {
        $group: {
          _id: "$memberId",
          totalAttempts: { $sum: 1 },
          correctAttempts: {
            $sum: { $cond: ["$isCorrect", 1, 0] },
          },
        },
      },
    ]);

    res.json(
      stats[0] || {
        totalAttempts: 0,
        correctAttempts: 0,
      }
    );
  } catch (err) {
    res.status(500).send("Error fetching summary");
  }
};