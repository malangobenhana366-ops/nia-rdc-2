import express from "express";

const router = express.Router();

/**
 * ADMIN LOGIN
 */
router.post("/admin/login", async (req, res) => {
  const { telephone, password } = req.body;

  const db = req.app.locals.db;

  const result = await db.query(
    "SELECT * FROM users WHERE telephone=$1",
    [telephone]
  );

  const user = result.rows[0];

  if (!user || !user.is_admin) {
    return res.status(403).json({ error: "Not admin" });
  }

  const ok = password === user.password;

  if (!ok) return res.status(400).json({ error: "Wrong password" });

  res.json({ id: user.id, telephone: user.telephone });
});

/**
 * STATS GLOBAL PLATFORM
 */
router.get("/admin/stats", async (req, res) => {
  const db = req.app.locals.db;

  const users = await db.query("SELECT COUNT(*) FROM users");
  const annonces = await db.query("SELECT COUNT(*) FROM annonces");
  const vip = await db.query("SELECT COUNT(*) FROM users WHERE is_vip=true");

  res.json({
    users: users.rows[0].count,
    annonces: annonces.rows[0].count,
    vip: vip.rows[0].count
  });
});

/**
 * DELETE ANNONCE
 */
router.delete("/admin/annonce/:id", async (req, res) => {
  const db = req.app.locals.db;

  await db.query(
    "DELETE FROM annonces WHERE id=$1",
    [req.params.id]
  );

  res.json({ ok: true });
});

/**
 * LIST USERS
 */
router.get("/admin/users", async (req, res) => {
  const db = req.app.locals.db;

  const result = await db.query(
    "SELECT id, telephone, is_vip, is_admin FROM users"
  );

  res.json(result.rows);
});

export default router;