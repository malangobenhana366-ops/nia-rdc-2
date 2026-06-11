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
app.use(express.json({ limit: "10mb" }));
app.use(express.static(__dirname));

/* ======================
HEALTH CHECK
====================== */
app.get("/", (req, res) => {
  res.json({ status: "NIA BACKEND OK 🚀" });
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

    if (!user) {
      return res.status(400).json({ error: "user not found" });
    }

    if (user.password !== password) {
      return res.status(400).json({ error: "wrong password" });
    }

    res.json({
      id: user.id,
      telephone: user.telephone
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(500).json({ error: "login error" });
  }
});

/* ======================
CREATE ANNONCE (FIX FINAL STABLE)
====================== */
app.post("/annonces", async (req, res) => {
  try {
    const {
      user_id,
      titre,
      description,
      ville,
      quartier,
      categorie,
      image_url,
      price,
      price_type,
      telephone,
      disponibilite
    } = req.body;

    console.log("📦 ANNONCE RECEIVED:", req.body);

    if (!user_id || !titre) {
      return res.status(400).json({ error: "missing fields" });
    }

    const result = await pool.query(
      `INSERT INTO annonces (
        user_id,
        titre,
        description,
        ville,
        quartier,
        categorie,
        image_url,
        price,
        price_type,
        telephone,
        disponibilite
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        user_id,
        titre,
        description || "",
        ville || "",
        quartier || "",
        categorie || "general",
        image_url || "",
        price || 0,
        price_type || "vente",
        telephone || "",
        disponibilite || "disponible"
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("🔥 CREATE ERROR:", err.message);
    res.status(500).json({ error: err.message });
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
START SERVER
====================== */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 NIA RDC RUNNING ON PORT", PORT);
});
