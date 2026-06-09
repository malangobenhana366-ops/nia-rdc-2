import express from "express";

const router = express.Router();

/*
========================================
CREER NOTIFICATION
========================================
*/

router.post("/notifications", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const {
      user_id,
      type,
      message
    } = req.body;

    const result = await db.query(
      `INSERT INTO notifications (user_id, type, message, is_read, created_at)
       VALUES ($1,$2,$3,false,NOW())
       RETURNING *`,
      [user_id, type, message]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({
      error: "Erreur création notification"
    });
  }
});

/*
========================================
LIRE NOTIFICATIONS USER
========================================
*/

router.get("/notifications/:user_id", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const result = await db.query(
      `SELECT *
       FROM notifications
       WHERE user_id=$1
       ORDER BY created_at DESC`,
      [req.params.user_id]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({
      error: "Erreur récupération notifications"
    });
  }
});

/*
========================================
MARQUER COMME LU
========================================
*/

router.put("/notifications/read/:id", async (req, res) => {
  const db = req.app.locals.db;

  try {
    await db.query(
      `UPDATE notifications
       SET is_read=true
       WHERE id=$1`,
      [req.params.id]
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({
      error: "Erreur update notification"
    });
  }
});

export default router;