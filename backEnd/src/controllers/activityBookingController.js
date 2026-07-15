import { MpesaService } from "../services/mpesa.js";
import { db } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

export const bookActivity = async (req, res) => {
  try {
    const { activity_type, activity_id, phone } = req.body;
    const memberId = req.user.member_id;

    if (!activity_type || !activity_id || !phone) {
      return res.status(400).json({ success: false, error: "activity_type, activity_id, and phone are required" });
    }
    if (!["weekly", "semester"].includes(activity_type)) {
      return res.status(400).json({ success: false, error: "activity_type must be 'weekly' or 'semester'" });
    }

    const table = activity_type === "weekly" ? "weekly_activities" : "semester_activities";
    const act = await db.query(`SELECT id, fare FROM ${table} WHERE id=$1`, [activity_id]);
    if (act.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Activity not found" });
    }

    const fare = act.rows[0].fare;
    if (!fare || Number(fare) <= 0) {
      return res.status(400).json({ success: false, error: "This activity has no fare set" });
    }

    const booking = await db.query(
      `INSERT INTO activity_bookings (member_id, activity_type, activity_id, fare)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [memberId, activity_type, activity_id, fare]
    );
    const bookingId = booking.rows[0].id;

    const callbackUrl = `${BASE_URL}/api/v1/activities/bookings/callback/${bookingId}`;
    const response = await MpesaService.stkPush(phone, fare, callbackUrl);

    await db.query(
      `INSERT INTO activity_payments (booking_id, checkout_id, amount, phone, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [bookingId, response.CheckoutRequestID, fare, phone]
    );

    return res.status(201).json({
      success: true,
      booking: booking.rows[0],
      checkoutId: response.CheckoutRequestID,
      message: "Booking created. STK Push sent to your phone.",
    });
  } catch (error) {
    logger.error("bookActivity error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const payBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, amount } = req.body;
    const memberId = req.user.member_id;

    if (!phone || !amount) {
      return res.status(400).json({ success: false, error: "phone and amount are required" });
    }

    const booking = await db.query(
      `SELECT * FROM activity_bookings WHERE id=$1 AND member_id=$2 AND status IN ('pending','paid')`,
      [id, memberId]
    );
    if (booking.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Booking not found or already cancelled" });
    }

    const b = booking.rows[0];
    const remaining = Number(b.fare) - Number(b.paid_amount);
    if (remaining <= 0) {
      return res.status(400).json({ success: false, error: "Booking is already fully paid" });
    }
    const payAmount = Math.min(Number(amount), remaining);

    const callbackUrl = `${BASE_URL}/api/v1/activities/bookings/callback/${id}`;
    const response = await MpesaService.stkPush(phone, payAmount, callbackUrl);

    await db.query(
      `INSERT INTO activity_payments (booking_id, checkout_id, amount, phone, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [id, response.CheckoutRequestID, payAmount, phone]
    );

    return res.json({
      success: true,
      checkoutId: response.CheckoutRequestID,
      message: "STK Push sent for installment.",
    });
  } catch (error) {
    logger.error("payBooking error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const mpesaCallback = async (req, res) => {
  const bookingId = req.params.id;

  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

  try {
    const stkCallback = req.body?.Body?.stkCallback;
    if (!stkCallback) {
      logger.warn("activity booking callback: missing Body.stkCallback");
      return;
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, MerchantRequestID } = stkCallback;
    logger.info(`Activity booking callback: BookingID=${bookingId}, CheckoutID=${CheckoutRequestID}, ResultCode=${ResultCode}`);

    if (ResultCode === 0) {
      const items = stkCallback.CallbackMetadata?.Item || [];
      const getMeta = (name) => items.find(i => i.Name === name)?.Value ?? null;

      const mpesaReceipt = getMeta("MpesaReceiptNumber");
      const amount = getMeta("Amount");
      const phoneNumber = getMeta("PhoneNumber");

      await db.query(
        `UPDATE activity_payments
         SET status='paid', mpesa_receipt=$1, merchant_request_id=$2, phone=COALESCE(phone,$3),
             result_code=$4, result_desc=$5, updated_at=CURRENT_TIMESTAMP
         WHERE checkout_id=$6 AND status='pending'`,
        [mpesaReceipt, MerchantRequestID, String(phoneNumber), String(ResultCode), ResultDesc, CheckoutRequestID]
      );

      await db.query(
        `UPDATE activity_bookings
         SET paid_amount = paid_amount + $1,
             status = CASE WHEN paid_amount + $1 >= fare THEN 'paid' ELSE 'pending' END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [amount, bookingId]
      );

      logger.info(`Activity booking payment success: BookingID=${bookingId}, Receipt=${mpesaReceipt}, Amount=${amount}`);
    } else {
      await db.query(
        `UPDATE activity_payments
         SET status='failed', result_code=$1, result_desc=$2, merchant_request_id=$3, updated_at=CURRENT_TIMESTAMP
         WHERE checkout_id=$4 AND status='pending'`,
        [String(ResultCode), ResultDesc, MerchantRequestID, CheckoutRequestID]
      );

      logger.warn(`Activity booking payment failed: BookingID=${bookingId}, Reason=${ResultDesc}`);
    }
  } catch (error) {
    logger.error("Activity booking callback error:", { message: error.message, stack: error.stack });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const memberId = req.user.member_id;

    const bookings = await db.query(
      `SELECT ab.*,
              CASE
                WHEN ab.activity_type = 'weekly' THEN wa.activity
                WHEN ab.activity_type = 'semester' THEN sa.title
              END AS activity_name,
              CASE
                WHEN ab.activity_type = 'weekly' THEN wa.day
                ELSE NULL
              END AS activity_day,
              CASE
                WHEN ab.activity_type = 'weekly' THEN wa.time
                WHEN ab.activity_type = 'semester' THEN TO_CHAR(sa.date_time, 'YYYY-MM-DD HH24:MI')
              END AS activity_time,
              CASE
                WHEN ab.activity_type = 'weekly' THEN wa.venue
                WHEN ab.activity_type = 'semester' THEN sa.venue
              END AS activity_venue
       FROM activity_bookings ab
       LEFT JOIN weekly_activities wa ON ab.activity_type = 'weekly' AND ab.activity_id = wa.id
       LEFT JOIN semester_activities sa ON ab.activity_type = 'semester' AND ab.activity_id = sa.id
       WHERE ab.member_id = $1
       ORDER BY ab.created_at DESC`,
      [memberId]
    );

    return res.json({ success: true, data: bookings.rows });
  } catch (error) {
    logger.error("getMyBookings error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await db.query(
      `SELECT ab.*,
              CONCAT(m.first_name, ' ', m.last_name) AS member_name,
              m.email AS member_email,
              CASE
                WHEN ab.activity_type = 'weekly' THEN wa.activity
                WHEN ab.activity_type = 'semester' THEN sa.title
              END AS activity_name,
              CASE
                WHEN ab.activity_type = 'weekly' THEN wa.day
                ELSE NULL
              END AS activity_day,
              CASE
                WHEN ab.activity_type = 'weekly' THEN wa.time
                WHEN ab.activity_type = 'semester' THEN TO_CHAR(sa.date_time, 'YYYY-MM-DD HH24:MI')
              END AS activity_time
       FROM activity_bookings ab
       JOIN members m ON ab.member_id = m.member_id
       LEFT JOIN weekly_activities wa ON ab.activity_type = 'weekly' AND ab.activity_id = wa.id
       LEFT JOIN semester_activities sa ON ab.activity_type = 'semester' AND ab.activity_id = sa.id
       ORDER BY ab.created_at DESC`
    );

    return res.json({ success: true, data: bookings.rows });
  } catch (error) {
    logger.error("getAllBookings error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const exportBookingsCSV = async (req, res) => {
  try {
    const bookings = await db.query(
      `SELECT ab.id, CONCAT(m.first_name, ' ', m.last_name) AS member_name, m.email AS member_email,
              ab.activity_type, ab.activity_id,
              CASE
                WHEN ab.activity_type = 'weekly' THEN wa.activity
                WHEN ab.activity_type = 'semester' THEN sa.title
              END AS activity_name,
              ab.fare, ab.paid_amount, ab.status,
              ab.created_at, ab.updated_at
       FROM activity_bookings ab
       JOIN members m ON ab.member_id = m.member_id
       LEFT JOIN weekly_activities wa ON ab.activity_type = 'weekly' AND ab.activity_id = wa.id
       LEFT JOIN semester_activities sa ON ab.activity_type = 'semester' AND ab.activity_id = sa.id
       ORDER BY ab.created_at DESC`
    );

    const csvHeaders = ["ID","Member Name","Email","Activity Type","Activity Name","Fare","Paid Amount","Status","Created At","Updated At"];
    const csvRows = bookings.rows.map(r => [
      r.id, r.member_name, r.member_email, r.activity_type, r.activity_name,
      r.fare, r.paid_amount, r.status, r.created_at, r.updated_at
    ]);
    const csv = [csvHeaders.join(","), ...csvRows.map(r => r.map(v => `"${String(v ?? "")}"`).join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=activity_bookings.csv");
    return res.send(csv);
  } catch (error) {
    logger.error("exportBookingsCSV error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
