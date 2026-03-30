 import {tesxtDb as pool} from "../../Configs/dbConfig.js"
import { ChatEventEnum } from "../../constant.js";


// "/notifications", 
export const createNotification = async ( req , res ) => {
  const { title, message, posted_by, posted_to, member_id, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO notifications (title, message, posted_by, posted_to, member_id, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, message, posted_by, posted_to, member_id, status]
    );
    const notif = result.rows[0];

    // Broadcast to CSA or specific jumuiya
    if (posted_to === "csa") {
      io.to("csaRoom").emit(ChatEventEnum.NOTIFY_CSA_ON_NEW_NOTIFICATION_EVENT, notif);
    } else {
      io.to(posted_to).emit(ChatEventEnum.NOTIFY_SPECIFIC_JUMUIA_ON_NEW_NOTIFICATION_EVENT, notif);
    }

  return  res.json(notif);
  } catch (err) {
    console.error(err);
   return  res.status(500).send("Error creating notification");
  }
};

// "/notifications/:id"
export const updateNotification = async (req, res) => {
  const { id } = req.params;
  const { title, message, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE notifications SET title=$1, message=$2, status=$3 WHERE id=$4 RETURNING *`,
      [title, message, status, id]
    );
    const updated = result.rows[0];

    io.emit(ChatEventEnum.NOTIFICATION_UPDATED_EVENT, updated);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating notification");
  }
};

// "/notifications/:id"

 export const deleteNotification = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM notifications WHERE id=$1`, [id]);

    io.emit(ChatEventEnum.NOTIFICATION_DELETE_EVENT, id);

    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting notification");
  }
};

