import { initiateSTK, handleCallback } from "./stkController.js";
import { testDb } from "../../Configs/dbConfig.js";
import { payAndWait } from "./stkHelper.js";

export const stkCalls = async (req, res) => {
  const { id } = req.user;
  const { amount, phoneNumber } = req.body;

  try {
    const { checkoutId, result } = await payAndWait(id, phoneNumber, amount);
    res.json({
      status: "success",
      message: "STK Push initiated successfully",
      checkoutId,
      result,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const stkGuestCalls = async (req, res) => {
  const { amount, phone: phoneNumber } = req.body;

  try {
    const { checkoutId, result } = await payAndWait(null, phoneNumber, amount);
    res.json({
      status: "success",
      message: "STK Push initiated successfully",
      checkoutId,
      result,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const checkStatus = async (req, res) => {
  const { checkoutId } = req.params;

  try {
    const result = await testDb.query(
      `SELECT status, result_desc FROM mpesa_request WHERE checkout_id = $1`,
      [checkoutId],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Transaction not found" });
    }

    const { status, result_desc } = result.rows[0];

    // If paid, also return the order_id linked to this checkout
    let orderId = null;
    if (status === "paid") {
      const orderResult = await testDb.query(
        `SELECT id FROM orders WHERE checkout_id = $1 LIMIT 1`,
        [checkoutId],
      );
      if (orderResult.rows.length > 0) {
        orderId = orderResult.rows[0].id;
      }
    }

    res.json({ status, result_desc, order_id: orderId });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
