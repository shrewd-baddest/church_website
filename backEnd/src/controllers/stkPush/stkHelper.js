import { initiateSTK, waitForPaymentResult } from "./stkController.js";

export const payAndWait = async (userId, phoneNumber, amount) => {
  try {
    // 1️⃣ Send STK Push
    console.log(
      `Initiating STK Push for userId: ${userId}, phoneNumber: ${phoneNumber}, amount: ${amount}`,
    );
    const checkoutId = await initiateSTK(userId, phoneNumber, amount);

    // 2️⃣ Wait for result (polling)
    console.log(`Waiting for payment result for checkoutId: ${checkoutId}`);
    const result = await waitForPaymentResult(checkoutId);
    return result;
  } catch (error) {
    return {
      status: "error",
      message: error.message,
    };
  }
};
