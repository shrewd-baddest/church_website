import { tesxtDb as pool } from "../../Configs/dbConfig.js";
import { ChatEventEnum } from "../../constant.js";
import logger from "../../logger/winston.js";
import { emitSocketEvent } from "../../socket/index.js";

// "/notifications",
export const createNotification = async (req, res) => {
  const { title, message, posted_by, posted_to, member_id, status } = req.body;

  if (!title || !message || !posted_to) {
    logger.warn("⚠️ Missing required fields", { body: req.body });
    return res.status(400).json({
      error: "title, message and posted_to are required",
    });
  }

  try {
    logger.info("📩 Creating notification", {
      title,
      posted_to,
      member_id,
    });

    const result = await pool.query(
      `INSERT INTO notifications (title, message, posted_by, posted_to, member_id, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, message, posted_by, posted_to, member_id, status],
    );

    const notif = result.rows[0];

    logger.info("✅ Notification created in DB", {
      notificationId: notif.id,
    });

    const payload = {
      id: notif.id,
      title: notif.title,
      message: notif.message,
      posted_by: notif.posted_by,
      posted_to: notif.posted_to,
      created_at: notif.created_at,
    };

    if (posted_to?.toLowerCase() === "csa") {
      emitSocketEvent(
        "CSA_NOTIFICATIONS",
        ChatEventEnum.NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT,
        payload,
      );

      logger.info("📡 Emitted CSA notification", {
        notificationId: notif.id,
      });
    } else {
      emitSocketEvent(
        posted_to,
        ChatEventEnum.NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT,
        payload,
      );

      logger.info("📡 Emitted Jumuia notification", {
        jumuia: posted_to,
        notificationId: notif.id,
      });
    }

    return res.status(201).json(notif);
  } catch (err) {
    logger.error("❌ Error creating notification", {
      message: err.message,
      stack: err.stack,
      body: req.body,
    });

    return res.status(500).json({
      error: "Error creating notification",
    });
  }
};

// "/notifications/:id"
export const updateNotification = async (req, res) => {
  const { id } = req.params;
  const { title, message, status } = req.body;

  if (!id) {
    logger.warn("⚠️ Missing notification ID");
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    logger.info("✏️ Updating notification", {
      notificationId: id,
      updates: { title, message, status },
    });

    const result = await pool.query(
      `UPDATE notifications 
       SET title=$1, message=$2, status=$3 
       WHERE id=$4 
       RETURNING *`,
      [title, message, status, id],
    );

    if (result.rows.length === 0) {
      logger.warn("⚠️ Notification not found", { notificationId: id });

      return res.status(404).json({
        error: "Notification not found",
      });
    }

    const updated = result.rows[0];

    logger.info("✅ Notification updated", {
      notificationId: updated.id,
    });

    // 🔹 5. Prepare payload
    const payload = {
      id: updated.id,
      title: updated.title,
      message: updated.message,
      status: updated.status,
      posted_to: updated.posted_to,
      updated_at: updated.updated_at,
    };

    // 🔹 6. Emit to correct room (NOT global)
    if (updated.posted_to?.toLowerCase() === "csa") {
      emitSocketEvent(
        "CSA_NOTIFICATIONS",
        ChatEventEnum.NOTIFICATION_UPDATED_EVENT,
        payload,
      );

      logger.info("📡 Emitted CSA notification update", {
        notificationId: updated.id,
      });
    } else {
      emitSocketEvent(
        updated.posted_to,
        ChatEventEnum.NOTIFICATION_UPDATED_EVENT,
        payload,
      );

      logger.info("📡 Emitted Jumuia notification update", {
        jumuia: updated.posted_to,
        notificationId: updated.id,
      });
    }
    return res.json(updated);
  } catch (err) {
    logger.error("❌ Error updating notification", {
      message: err.message,
      stack: err.stack,
      notificationId: id,
      body: req.body,
    });

    return res.status(500).json({
      error: "Error updating notification",
    });
  }
};

// "/notifications/:id"

export const deleteNotification = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    logger.warn("⚠️ Missing notification ID");
    return res.status(400).json({
      error: "Notification ID is required",
    });
  }

  try {
    logger.info("🗑️ Deleting notification", {
      notificationId: id,
    });

    const existing = await pool.query(
      "SELECT * FROM notifications WHERE id=$1",
      [id],
    );

    if (existing.rows.length === 0) {
      logger.warn("⚠️ Notification not found", {
        notificationId: id,
      });

      return res.status(404).json({
        error: "Notification not found",
      });
    }

    const notification = existing.rows[0];

    await pool.query("DELETE FROM notifications WHERE id=$1", [id]);

    logger.info("✅ Notification deleted", {
      notificationId: id,
    });

    const payload = {
      id: notification.id,
      posted_to: notification.posted_to,
    };

    // 🔹 5. Emit to correct room (NOT global)
    if (notification.posted_to?.toLowerCase() === "csa") {
      emitSocketEvent(
        "CSA_NOTIFICATIONS",
        ChatEventEnum.NOTIFICATION_DELETE_EVENT,
        payload,
      );

      logger.info("📡 Emitted CSA notification deletion", {
        notificationId: id,
      });
    } else {
      emitSocketEvent(
        notification.posted_to,
        ChatEventEnum.NOTIFICATION_DELETE_EVENT,
        payload,
      );

      logger.info("📡 Emitted Jumuia notification deletion", {
        jumuia: notification.posted_to,
        notificationId: id,
      });
    }
    return res.sendStatus(204);
  } catch (err) {
    logger.error(" Error deleting notification", {
      message: err.message,
      stack: err.stack,
      notificationId: id,
    });

    return res.status(500).json({
      error: "Error deleting notification",
    });
  }
};

