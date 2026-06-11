import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ======================
MIDDLEWARE
====================== */
app.use(cors());
app.use(express.json({ limit: "20mb" })); // prêt pour images base64 futur
app.use(express.static(__dirname));

/* ======================
HEALTH CHECK
====================== */
app.get("/", (req, res) => {
  res.json({
    status: "NIA BACKEND OK 🚀",
    version: "1.0.0"
  });
});

/* ======================
REGISTER
====================== */
app.post("/auth/register", async (req, res) => {
  try {
    const { telephone, password } = req.body;

    if (!telephone || !password) {
      return res.status(400).json({ error: "missing fields" });
    }

    const result = await pool.query(
      `INSERT INTO users (telephone, password)
       VALUES ($1,$2)
       RETURNING id, telephone`,
      [telephone, password]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.status(500).json({ error: "register error" });
  }
});

/* ======================
LOGIN
====================== */
app.post("/auth/login", async (req, res) => {
  try {
    const { telephone, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE telephone=$1",
      [telephone]
    );

    const user = result.rows[0];

    if (!user) return res.status(400).json({ error: "user not found" });
    if (user.password !== password)
      return res.status(400).json({ error: "wrong password" });

    res.json({ id: user.id, telephone: user.telephone });
  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(500).json({ error: "login error" });
  }
});

/* ======================
CREATE ANNONCE (STABLE + FUTURE READY)
====================== */
app.post("/annonces", async (req, res) => {
  try {
    const {
      user_id,
      titre,
      description,
      prix,
      prix_type,
      ville,
      quartier,
      telephone,
      disponibilite
    } = req.body;

    console.log("📦 NEW ANNONCE:", req.body);

    // sécurité minimale obligatoire
    if (!user_id || !titre) {
      return res.status(400).json({
        error: "missing required fields (user_id, titre)"
      });
    }

    const result = await pool.query(
      `INSERT INTO annonces (
        user_id,
        titre,
        description,
        prix,
        prix_type,
        ville,
        quartier,
        telephone,
        disponibilite
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        user_id,
        titre,
        description || "",
        prix || 0,
        prix_type || "vente",
        ville || "",
        quartier || "",
        telephone || "",
        disponibilite || "disponible"
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("CREATE ANNONCE ERROR:", err.message);
    res.status(500).json({
      error: "create error",
      details: err.message
    });
  }
});

/* ======================
FEED
====================== */
app.get("/feed", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM annonces ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (err) {
    console.error("FEED ERROR:", err.message);
    res.json([]);
  }
});

/* ======================
FUTURE FEATURES READY (IMPORTANT)
====================== */

/*
👉 ICI TU AS LA BASE POUR ÉVOLUER :

- /vip (boost annonces)
- /search (recherche intelligente)
- /profile (gestion utilisateur)
- /upload (images réelles plus tard)

On a préparé la structure backend propre pour ça.
*/

/* ======================
START SERVER
====================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("🚀 NIA SERVER RUNNING ON PORT", PORT);
});
