import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ======================
// DATABASE
// ======================
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ======================
// HEALTH CHECK
// ======================
app.get("/", (req, res) => {
  res.json({ status: "NIA RDC API READY 🚀" });
});

// ======================
// AUTH
// ======================

// REGISTER
app.post("/auth/register", async (req, res) => {
  try {
    const { telephone, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (telephone, password) VALUES ($1,$2) RETURNING id, telephone, is_vip",
      [telephone, hash]
    );

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// LOGIN
app.post("/auth/login", async (req, res) => {
  try {
    const { telephone, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE telephone=$1",
      [telephone]
    );

    if (!result.rows[0]) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ error: "Wrong password" });
    }

    res.json({
      id: user.id,
      telephone: user.telephone,
      is_vip: user.is_vip,
      is_admin: user.is_admin
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ======================
// ANNONCES
// ======================

// GET ALL
app.get("/annonces", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM annonces ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

// CREATE (VIP LOGIC INCLUDED)
app.post("/annonces", async (req, res) => {
  try {
    const {
      user_id,
      titre,
      description,
      categorie,
      prix_heure,
      prix_jour,
      prix_semaine,
      prix_mois,
      ville,
      commune,
      quartier,
      conditions_location,
      contact_phone,
      contact_name,
      status
    } = req.body;

    // user check
    const userRes = await pool.query(
      "SELECT * FROM users WHERE id=$1",
      [user_id]
    );

    const user = userRes.rows[0];

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // LIMIT STANDARD
    if (!user.is_vip) {
      const count = await pool.query(
        "SELECT COUNT(*) FROM annonces WHERE user_id=$1",
        [user_id]
      );

      if (parseInt(count.rows[0].count) >= 2) {
        return res.status(403).json({
          error: "Limite atteinte. VIP requis."
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO annonces (
        user_id, titre, description, categorie,
        prix_heure, prix_jour, prix_semaine, prix_mois,
        ville, commune, quartier,
        conditions_location,
        contact_phone, contact_name,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        user_id,
        titre,
        description,
        categorie,
        prix_heure,
        prix_jour,
        prix_semaine,
        prix_mois,
        ville,
        commune,
        quartier,
        conditions_location,
        contact_phone,
        contact_name,
        status || "disponible"
      ]
    );

    res.json(result.rows[0]);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ======================
// VIEWS SYSTEM
// ======================
app.post("/annonces/:id/view", async (req, res) => {
  await pool.query(
    "UPDATE annonces SET views = views + 1 WHERE id=$1",
    [req.params.id]
  );

  res.json({ ok: true });
});

// ======================
// FAVORIS
// ======================
app.post("/favoris", async (req, res) => {
  const { user_id, annonce_id } = req.body;

  const result = await pool.query(
    "INSERT INTO favoris (user_id, annonce_id) VALUES ($1,$2) RETURNING *",
    [user_id, annonce_id]
  );

  res.json(result.rows[0]);
});

// ======================
// CONTACT LOG
// ======================
app.post("/contact", async (req, res) => {
  const { user_id, annonce_id, contact_phone } = req.body;

  const result = await pool.query(
    "INSERT INTO contacts (user_id, annonce_id, contact_phone) VALUES ($1,$2,$3) RETURNING *",
    [user_id, annonce_id, contact_phone]
  );

  res.json(result.rows[0]);
});

// ======================
// REPORT
// ======================
app.post("/report", async (req, res) => {
  const { user_id, annonce_id, reason } = req.body;

  const result = await pool.query(
    "INSERT INTO reports (user_id, annonce_id, reason) VALUES ($1,$2,$3) RETURNING *",
    [user_id, annonce_id, reason]
  );

  res.json(result.rows[0]);
});

// ======================
// START
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("NIA RDC FULL BACKEND RUNNING 🚀 PORT " + PORT);
});