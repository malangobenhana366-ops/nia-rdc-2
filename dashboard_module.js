import express from "express";

const router = express.Router();

/*
========================================
DASHBOARD UTILISATEUR
========================================
*/

router.get("/dashboard/:user_id", async (req, res) => {
  const db = req.app.locals.db;
  const { user_id } = req.params;

  try {
    // 📢 ANNONCES UTILISATEUR
    const annonces = await db.query(
      `SELECT * FROM annonces
       WHERE user_id=$1
       ORDER BY created_at DESC`,
      [user_id]
    );

    // ❤️ FAVORIS
    const favoris = await db.query(
      `SELECT f.*, a.*
       FROM favoris f
       JOIN annonces a ON a.id = f.annonce_id
       WHERE f.user_id=$1
       ORDER BY f.id DESC`,
      [user_id]
    );

    // 💬 MESSAGES (conversations)
    const messages = await db.query(
      `SELECT * FROM messages
       WHERE sender_id=$1 OR receiver_id=$1
       ORDER BY created_at DESC`,
      [user_id]
    );

    // 📊 STATISTIQUES
    const statsViews = await db.query(
      `SELECT COALESCE(SUM(views),0) AS total_views
       FROM annonces
       WHERE user_id=$1`,
      [user_id]
    );

    const statsCount = await db.query(
      `SELECT COUNT(*) AS total_annonces
       FROM annonces
       WHERE user_id=$1`,
      [user_id]
    );

    res.json({
      annonces: annonces.rows,
      favoris: favoris.rows,
      messages: messages.rows,
      stats: {
        total_views: statsViews.rows[0].total_views,
        total_annonces: statsCount.rows[0].total_annonces
      }
    });

  } catch (err) {
    res.status(500).json({
      error: "Erreur dashboard"
    });
  }
});

export default router;