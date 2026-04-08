import { testDb } from "../../Configs/dbConfig.js";
import axios from "axios";

const db = testDb;

export const initiateSTK = async (userId, phoneNumber, amount) => {
  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;
  const shortcode = process.env.SHORTCODE;
  const passkey = process.env.PASSKEY;

  const formatPhone = (phone) => {
    if (phone.startsWith("0")) {
      return "254" + phone.slice(1);
    }
    if (phone.startsWith("+254")) {
      return phone.slice(1);
    }
    return phone;
  };

  phoneNumber = formatPhone(phoneNumber);

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64",
  );

  const tokenRes = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${credentials}` } },
  );

  const accessToken = tokenRes.data.access_token;

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
    "base64",
  );

  const stkRes = await axios.post(
    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: process.env.CALLBACK_URL,
      AccountReference: "YogurtBlast",
      TransactionDesc: "Payment",
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const checkoutId = stkRes.data.CheckoutRequestID;

  // Save as pending
  await db.query(
    `INSERT INTO mpesa_request (checkout_id, user_id, amount, status)
     VALUES ($1, $2, $3, 'pending')`,
    [checkoutId, userId, amount],
  );

  return checkoutId;
};

export const callback = async (req, res) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    if (req.method === "POST") {
      const { Body } = req.body;

      //  Invalid structure
      if (!Body || !Body.stkCallback) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          status: "error",
          message: "Invalid callback data",
        });
      }

      const stk = Body.stkCallback;
      const CheckoutRequestID = stk.CheckoutRequestID;
      const ResultCode = stk.ResultCode;

      //  Respond FAST (important for Safaricom)
      res.status(200).json({ success: true });

      //  If payment failed
      if (ResultCode !== 0) {
        await client.query(
          `UPDATE mpesa_request SET status='failed' WHERE checkout_id=$1`,
          [CheckoutRequestID],
        );

        await client.query("COMMIT");

        console.log("❌ Payment failed");
        return;
      }

      //  Safe metadata extraction
      const metaData = stk.CallbackMetadata?.Item || [];
      const getValue = (name) =>
        metaData.find((item) => item.Name === name)?.Value || null;

      const paymentDetails = {
        amount: getValue("Amount"),
        mpesaReceiptNumber: getValue("MpesaReceiptNumber"),
        transactionDate: getValue("TransactionDate"),
        phoneNumber: getValue("PhoneNumber"),
      };

      //  Find matching request
      const results = await client.query(
        `SELECT user_id, amount, checkout_id , status FROM mpesa_request WHERE checkout_id = $1`,
        [CheckoutRequestID],
      );

      if (!results.rows.length) {
        await client.query("ROLLBACK");
        console.log("No matching payment request");
        return;
      }

      const { user_id, checkout_id, amount, status } = results.rows[0];
      if (status === "paid" || status === "failed") {
        await client.query("ROLLBACK");
        console.log("⚠️ Already processed");
        return;
      }
      //  Update payment
      await client.query(
        `UPDATE mpesa_request SET status='paid' WHERE checkout_id=$1`,
        [checkout_id],
      );

      await client.query("COMMIT");

      console.log("✅ Payment processed:", paymentDetails);
      return;
    }

    // Fallback
    await client.query("ROLLBACK");
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error(" Error processing callback:", error);

    await client.query("ROLLBACK");
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    client.release();
  }
};

export const waitForPaymentResult = (checkoutId, timeout = 60000) => {
  return new Promise((resolve, reject) => {
    const interval = 3000; // check every 3 sec
    let elapsed = 0;

    const timer = setInterval(async () => {
      elapsed += interval;

      const result = await db.query(
        `SELECT status FROM mpesa_request WHERE checkout_id = $1`,
        [checkoutId],
      );

      const status = result.rows[0]?.status;

      if (status === "paid") {
        clearInterval(timer);
        resolve({ status: "success" });
      }

      if (status === "failed") {
        clearInterval(timer);
        resolve({ status: "failed" });
      }

      if (elapsed >= timeout) {
        clearInterval(timer);
        reject(new Error("Timeout waiting for payment"));
      }
    }, interval);
  });
};
