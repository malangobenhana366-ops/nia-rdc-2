import express from "express";

const router = express.Router();

/*
========================================
LOGIN ADMIN SIMPLE (CODE SECRET)
========================================
*/

router.post("/admin/login", async (req, res) => {
  const { code } = req.body;

  const ADMIN_CODE = "BEN4002ET4200";

  if (code !== ADMIN_CODE) {
    return res.status(403).json({ error: "Code invalide" });
  }

  res.json({
    success: true,
    role: "admin"
  });
});

/*
========================================
STATS GLOBAL PLATFORM
========================================
*/

router.get("/admin/stats", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const users = await db.query("SELECT COUNT(*) FROM users");
    const annonces = await db.query("SELECT COUNT(*) FROM annonces");
    const vip = await db.query("SELECT COUNT(*) FROM users WHERE is_vip=true");

    const views = await db.query("SELECT SUM(nombre_vues) FROM annonces");

    res.json({
      users: users.rows[0].count,
      annonces: annonces.rows[0].count,
      vip: vip.rows[0].count,
      views: views.rows[0].sum || 0
    });

  } catch (err) {
    res.status(500).json({
      error: "Erreur stats admin"
    });
  }
});

/*
========================================
SUPPRIMER ANNONCE
========================================
*/

router.delete("/admin/annonce/:id", async (req, res) => {
  const db = req.app.locals.db;

  try {
    await db.query(
      "DELETE FROM annonces WHERE id=$1",
      [req.params.id]
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({
      error: "Erreur suppression annonce"
    });
  }
});

/*
========================================
LISTE USERS
========================================
*/

router.get("/admin/users", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const result = await db.query(
      "SELECT id, telephone, is_vip, is_admin FROM users ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({
      error: "Erreur users"
    });
  }
});

/*
========================================
LISTE ANNONCES
========================================
*/

router.get("/admin/annonces", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const result = await db.query(
      "SELECT * FROM annonces ORDER BY created_at DESC"
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({
      error: "Erreur annonces admin"
    });
  }
});

export default router;