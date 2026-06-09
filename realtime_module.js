import express from "express";

const router = express.Router();

/*
Dernières activités de la plateforme
*/

router.get("/activity", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const result = await db.query(`
      SELECT
      id,
      titre,
      ville,
      created_at
      FROM annonces
      ORDER BY created_at DESC
      LIMIT 20
    `);

    res.json(result.rows);

  } catch (e) {
    res.status(500).json({
      error: "Erreur serveur"
    });
  }
});

export default router;