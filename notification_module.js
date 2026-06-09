import express from "express";

const router = express.Router();

/**
 * CREATE NOTIFICATION
 */
router.post("/notify", async (req, res) => {
  const db = req.app.locals.db;

  const { user_id, type, message } = req.body;

  const result = await db.query(
    `INSERT INTO notifications (user_id, type, message)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [user_id, type, message]
  );

  res.json(result.rows[0]);
});

/**
 * GET USER NOTIFICATIONS
 */
router.get("/notifications/:user_id", async (req, res) => {
  const db = req.app.locals.db;

  const result = await db.query(
    `SELECT * FROM notifications
     WHERE user_id=$1
     ORDER BY created_at DESC`,
    [req.params.user_id]
  );

  res.json(result.rows);
});

export default router;