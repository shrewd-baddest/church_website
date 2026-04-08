import { initiateSTK, waitForPaymentResult } from "./stkController.js";

export const payAndWait = async (userId, phoneNumber, amount) => {
  try {
    // 1️⃣ Send STK Push
    const checkoutId = await initiateSTK(userId, phoneNumber, amount);

    // 2️⃣ Wait for result (polling)
    const result = await waitForPaymentResult(checkoutId);
    return result;
  } catch (error) {
    return {
      status: "error",
      message: error.message,
    };
  }
};
