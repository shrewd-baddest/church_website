import { initiateSTK } from "./stkController.js";
import { testDb } from "../../Configs/dbConfig.js";

export const stkCalls = async (req, res) => {
  const { id } = req.user;
  const { amount, phoneNumber } = req.body;

  try {
    const checkoutId = await initiateSTK(id, phoneNumber, amount);
    res.json({
      status: "success",
      message: "STK Push initiated successfully",
      checkoutId
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const stkGuestCalls = async (req, res) => {
  const { amount, phoneNumber } = req.body;

  try {
    const checkoutId = await initiateSTK(null, phoneNumber, amount);
    res.json({
      status: "success",
      message: "STK Push initiated successfully",
      checkoutId
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const checkStatus = async (req, res) => {
  const { checkoutId } = req.params;

  try {
    const result = await testDb.query(
      `SELECT status FROM mpesa_request WHERE checkout_id = $1`,
      [checkoutId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Transaction not found" });
    }

    res.json({ status: result.rows[0].status });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
