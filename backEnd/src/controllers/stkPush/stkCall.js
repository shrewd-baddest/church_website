import { payAndWait } from "./stkHelper.js";
export const stkCalls = async (req, res) => {
  const { id } = req.user;
  const { amount, phoneNumber } = req.body;
  try {
    const result = await payAndWait(id, phoneNumber, amount);
    res.json(result);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
