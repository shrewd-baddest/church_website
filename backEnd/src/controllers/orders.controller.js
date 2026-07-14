import { db } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

export const createOrder = async (req, res) => {
  try {
    const {
      user_id, amount, phone, checkout_id, mpesa_receipt, items, status,
      customer_name, customer_email, payment_method, collection_method, delivery_address,
    } = req.body;

    const itemsJson = items ? JSON.stringify(items) : null;

    // Generate reference: CSA-000001 format
    const seqResult = await db.query("SELECT nextval('orders_id_seq') as next_id");
    const nextId = seqResult.rows[0].next_id;
    const year = new Date().getFullYear();
    const reference = `CSA-${year}-${String(nextId).padStart(4, "0")}`;

    const result = await db.query(
      `INSERT INTO orders
       (user_id, amount, phone, checkout_id, mpesa_receipt, status, items,
        order_reference, customer_name, customer_email, payment_method, collection_method, delivery_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        user_id || null, amount, phone || null, checkout_id || null,
        mpesa_receipt || null, status || "pending", itemsJson,
        reference, customer_name || null, customer_email || null,
        payment_method || "mpesa", collection_method || "pickup",
        delivery_address || null,
      ]
    );

    logger.info(`Order created: ${reference}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM orders ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { phone, checkout_id, mpesa_receipt } = req.body;

    if (!mpesa_receipt) {
      return res.status(400).json({ error: "M-Pesa receipt number is required" });
    }
    if (!phone && !checkout_id) {
      return res.status(400).json({ error: "Phone number or checkout ID is required" });
    }

    // Find the order — by checkout_id first, then fallback to phone
    let order;
    if (checkout_id) {
      const result = await db.query(
        `SELECT * FROM orders WHERE checkout_id = $1 AND status = 'pending' LIMIT 1`,
        [checkout_id],
      );
      order = result.rows[0];
    }

    if (!order && phone) {
      const result = await db.query(
        `SELECT * FROM orders WHERE phone = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 1`,
        [phone],
      );
      order = result.rows[0];
    }

    if (!order) {
      return res.status(404).json({ error: "No pending order found for this phone/checkout" });
    }

    // Update the order
    const updated = await db.query(
      `UPDATE orders SET status = 'paid', mpesa_receipt = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [mpesa_receipt, order.id],
    );

    // Also update mpesa_request if checkout_id exists
    if (order.checkout_id) {
      await db.query(
        `UPDATE mpesa_request SET status = 'paid', mpesa_receipt = $1, updated_at = CURRENT_TIMESTAMP WHERE checkout_id = $2`,
        [mpesa_receipt, order.checkout_id],
      );
    }

    logger.info(`Payment manually confirmed: Order ${order.order_reference}, Receipt=${mpesa_receipt}`);
    res.json({ status: "paid", order: updated.rows[0] });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_method, collection_method, delivery_address, customer_name } = req.body;

    const updates = [];
    const values = [];
    let idx = 1;

    if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status); }
    if (payment_method !== undefined) { updates.push(`payment_method = $${idx++}`); values.push(payment_method); }
    if (collection_method !== undefined) { updates.push(`collection_method = $${idx++}`); values.push(collection_method); }
    if (delivery_address !== undefined) { updates.push(`delivery_address = $${idx++}`); values.push(delivery_address); }
    if (customer_name !== undefined) { updates.push(`customer_name = $${idx++}`); values.push(customer_name); }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query(
      `UPDATE orders SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
};
