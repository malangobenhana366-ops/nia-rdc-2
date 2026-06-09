import express from "express";

const router = express.Router();

/*
========================================
CREER UNE ANNONCE
========================================
*/

router.post("/annonces", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const {
      user_id,
      titre,
      description,
      categorie,
      prix_jour,
      ville,
      commune,
      quartier,
      conditions_location,
      contact_nom,
      contact_tel,
      image_url,
      statut
    } = req.body;

    const result = await db.query(
      `INSERT INTO annonces (
        user_id,
        titre,
        description,
        categorie,
        prix_jour,
        ville,
        commune,
        quartier,
        conditions_location,
        contact_nom,
        contact_tel,
        image_url,
        statut_dispo,
        nombre_vues,
        created_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0,NOW()
      )
      RETURNING *`,
      [
        user_id,
        titre,
        description,
        categorie,
        prix_jour,
        ville,
        commune,
        quartier,
        conditions_location,
        contact_nom,
        contact_tel,
        image_url,
        statut
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({
      error: "Erreur création annonce"
    });
  }
});

/*
========================================
FEED (HOME PAGE)
========================================
*/

router.get("/feed", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const result = await db.query(
      `SELECT *
       FROM annonces
       ORDER BY created_at DESC
       LIMIT 50`
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({
      error: "Erreur feed"
    });
  }
});

/*
========================================
DETAIL ANNONCE
========================================
*/

router.get("/annonces/:id", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const result = await db.query(
      `SELECT * FROM annonces WHERE id=$1`,
      [req.params.id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({
      error: "Erreur annonce"
    });
  }
});

export default router;