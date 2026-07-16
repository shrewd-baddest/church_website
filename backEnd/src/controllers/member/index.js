import { getMemberProgress as fetchProgress, getMemberSummary as fetchSummary } from "../../model/attemptSchema.js";

export const getMemberProgress = async (req, res) => {
  try {
    const memberId = req.user.memberId;
    const result = await fetchProgress(memberId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching member progress");
  }
};

export const getMemberSummary = async (req, res) => {
  try {
    const memberId = req.user.memberId;
    const result = await fetchSummary(memberId);
    res.json(result);
  } catch (err) {
    res.status(500).send("Error fetching summary");
  }
};