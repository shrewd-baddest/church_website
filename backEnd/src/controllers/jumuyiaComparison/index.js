import Attempt from "../../model/attemptSchema.js";

export const getJumuiComparison = async (req, res) => {
  try {

    const threeWeeksAgo = new Date();

    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    const stats = await Attempt.aggregate([
      {
        $match: {
          attemptedAt: { $gte: threeWeeksAgo },
        },
      },
      {
        $group: {
          _id: "$jumuiyaId",
          totalAttempts: { $sum: 1 },
          correctAttempts: {
            $sum: { $cond: ["$isCorrect", 1, 0] },
          },
        },
      },
      {
        $addFields: {
          accuracy: {
            $cond: [
              { $eq: ["$totalAttempts", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$correctAttempts", "$totalAttempts"] },
                  100,
                ],
              },
            ],
          },
        },
      },
      {
        $sort: { accuracy: -1 },
      },
      {
        $limit: 7,
      },
    ]);

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching jumuiya comparison");
  }
};
