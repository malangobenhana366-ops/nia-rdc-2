import express from "express";

const router = express.Router();

/**
 * FEED PRINCIPAL
 * Mélange intelligent :
 * 1. VIP / boosted en haut
 * 2. récents ensuite
 */
router.get("/feed", async (req, res) => {
  const db = req.app.locals.db;

  const result = await db.query(`
    SELECT * FROM annonces
    ORDER BY
      boosted DESC,
      created_at DESC
    LIMIT 50
  `);

  res.json(result.rows);
});

export default router;