import express from "express";

const router = express.Router();

/* ======================
   ENVOYER MESSAGE
====================== */
router.post("/chat/send", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const {
      sender_id,
      receiver_id,
      annonce_id,
      message
    } = req.body;

    if (!sender_id || !receiver_id || !message) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    const result = await db.query(
      `INSERT INTO messages
      (sender_id, receiver_id, annonce_id, message, created_at)
      VALUES ($1,$2,$3,$4,NOW())
      RETURNING *`,
      [sender_id, receiver_id, annonce_id, message]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur envoi message" });
  }
});

/* ======================
   CONVERSATION
====================== */
router.get("/chat/:annonce_id/:user1/:user2", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const { annonce_id, user1, user2 } = req.params;

    const result = await db.query(
      `SELECT *
       FROM messages
       WHERE annonce_id = $1
       AND (
         (sender_id=$2 AND receiver_id=$3)
         OR
         (sender_id=$3 AND receiver_id=$2)
       )
       ORDER BY created_at ASC`,
      [annonce_id, user1, user2]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur chat" });
  }
});

export default router;