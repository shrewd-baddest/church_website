import { getJumuiComparison as fetchComparison } from "../../model/attemptSchema.js";

export const getJumuiComparison = async (req, res) => {
  try {
    const stats = await fetchComparison();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching jumuiya comparison");
  }
};
