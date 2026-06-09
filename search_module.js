import express from "express";

const router = express.Router();

/*
========================================
RECHERCHE ANNONCES
========================================
*/

router.get("/search", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const {
      q,
      ville,
      categorie
    } = req.query;

    let query = `
      SELECT *
      FROM annonces
      WHERE 1=1
    `;

    const params = [];
    let index = 1;

    // recherche texte
    if (q) {
      query += ` AND (titre ILIKE $${index} OR description ILIKE $${index})`;
      params.push(`%${q}%`);
      index++;
    }

    // filtre ville
    if (ville) {
      query += ` AND ville ILIKE $${index}`;
      params.push(`%${ville}%`);
      index++;
    }

    // filtre catégorie
    if (categorie) {
      query += ` AND categorie ILIKE $${index}`;
      params.push(`%${categorie}%`);
      index++;
    }

    query += ` ORDER BY created_at DESC LIMIT 50`;

    const result = await db.query(query, params);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({
      error: "Erreur recherche"
    });
  }
});

/*
========================================
HISTORIQUE RECHERCHE (OPTIONNEL FUTUR)
========================================
*/

router.post("/search/log", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const {
      user_id,
      query,
      ville
    } = req.body;

    await db.query(
      `INSERT INTO search_history (user_id, query, ville, created_at)
       VALUES ($1,$2,$3,NOW())`,
      [user_id, query, ville]
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({
      error: "Erreur log recherche"
    });
  }
});

export default router;