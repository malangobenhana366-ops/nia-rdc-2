import express from "express";

const router = express.Router();

/**
 * ACTIVER VIP
 * (simulation logique, pas paiement)
 */
router.post("/vip/activate", async (req, res) => {
  const { user_id } = req.body;

  await req.app.locals.db.query(
    "UPDATE users SET is_vip=true WHERE id=$1",
    [user_id]
  );

  res.json({ ok: true, message: "VIP ACTIVÉ" });
});

/**
 * BOOST ANNONCE VIP
 * augmente visibilité
 */
router.post("/vip/boost/:id", async (req, res) => {
  const { id } = req.params;

  await req.app.locals.db.query(
    "UPDATE annonces SET boosted=true WHERE id=$1",
    [id]
  );

  res.json({ ok: true, message: "ANNONCE BOOSTÉE" });
});

/**
 * LISTE VIP PRIORISÉE
 */
router.get("/vip/annonces", async (req, res) => {
  const result = await req.app.locals.db.query(`
    SELECT * FROM annonces
    ORDER BY boosted DESC, created_at DESC
  `);

  res.json(result.rows);
});

export default router;