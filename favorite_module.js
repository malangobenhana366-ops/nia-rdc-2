import express from "express";

const router = express.Router();

/*
========================================
AJOUTER AUX FAVORIS
========================================
*/

router.post("/favorites", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const {
      user_id,
      annonce_id
    } = req.body;

    const result = await db.query(
      `INSERT INTO favorites (user_id, annonce_id, created_at)
       VALUES ($1,$2,NOW())
       RETURNING *`,
      [user_id, annonce_id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({
      error: "Erreur ajout favoris"
    });
  }
});

/*
========================================
SUPPRIMER FAVORI
========================================
*/

router.delete("/favorites", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const {
      user_id,
      annonce_id
    } = req.body;

    await db.query(
      `DELETE FROM favorites
       WHERE user_id=$1 AND annonce_id=$2`,
      [user_id, annonce_id]
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({
      error: "Erreur suppression favoris"
    });
  }
});

/*
========================================
LISTE DES FAVORIS USER
========================================
*/

router.get("/favorites/:user_id", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const result = await db.query(
      `SELECT f.id, f.created_at, a.*
       FROM favorites f
       JOIN annonces a ON a.id = f.annonce_id
       WHERE f.user_id=$1
       ORDER BY f.created_at DESC`,
      [req.params.user_id]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({
      error: "Erreur récupération favoris"
    });
  }
});

export default router;