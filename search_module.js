import express from "express";

const router = express.Router();

/**
 * SEARCH ANNONCES (ENGINE PRINCIPAL)
 * - recherche texte
 * - filtre ville
 * - filtre catégorie
 * - boost VIP prioritaire
 */
router.get("/search", async (req, res) => {
  const db = req.app.locals.db;

  const q = req.query.q || "";
  const ville = req.query.ville || "";
  const categorie = req.query.categorie || "";

  const result = await db.query(
    `
    SELECT * FROM annonces
    WHERE
      titre ILIKE $1
      AND ($2 = '' OR ville ILIKE $2)
      AND ($3 = '' OR categorie ILIKE $3)
    ORDER BY
      boosted DESC,
      created_at DESC
    `,
    [`%${q}%`, `%${ville}%`, `%${categorie}%`]
  );

  res.json(result.rows);
});

export default router;