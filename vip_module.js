import express from "express";

const router = express.Router();

/*
========================================
DEMANDER PASSAGE VIP
========================================
*/

router.post("/vip/request", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const {
      user_id,
      type // "user" ou "annonce"
    } = req.body;

    const result = await db.query(
      `INSERT INTO vip_requests (user_id, type, status, created_at)
       VALUES ($1,$2,'pending',NOW())
       RETURNING *`,
      [user_id, type]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({
      error: "Erreur demande VIP"
    });
  }
});

/*
========================================
ACTIVER VIP USER
========================================
*/

router.post("/vip/activate-user", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const { user_id } = req.body;

    await db.query(
      `UPDATE users
       SET is_vip = true
       WHERE id = $1`,
      [user_id]
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({
      error: "Erreur activation VIP user"
    });
  }
});

/*
========================================
BOOST ANNONCE VIP
========================================
*/

router.post("/vip/boost-annonce", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const { annonce_id } = req.body;

    await db.query(
      `UPDATE annonces
       SET boosted = true
       WHERE id = $1`,
      [annonce_id]
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({
      error: "Erreur boost annonce"
    });
  }
});

/*
========================================
LISTE VIP REQUESTS (ADMIN FUTUR)
========================================
*/

router.get("/vip/requests", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const result = await db.query(
      `SELECT * FROM vip_requests
       ORDER BY created_at DESC`
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({
      error: "Erreur liste VIP"
    });
  }
});

export default router;