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
       VALUES ($1, $2)
       RETURNING id, telephone`,
      [telephone, password]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("REGISTER ERROR:", err);
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
      "SELECT * FROM users WHERE telephone = $1",
      [telephone]
    );

    const user = result.rows[0];

    if (!user) return res.status(400).json({ error: "user not found" });

    if (user.password !== password) {
      return res.status(400).json({ error: "wrong password" });
    }

    res.json({
      id: user.id,
      telephone: user.telephone
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "login error" });
  }
});

/* ======================
CREATE ANNONCE (ULTRA SAFE)
====================== */
app.post("/annonces", async (req, res) => {
  try {
    const body = req.body || {};

    const user_id = body.user_id;
    const titre = body.titre;
    const description = body.description || "";
    const ville = body.ville || "";
    const quartier = body.quartier || "";
    const categorie = body.categorie || "";
    const image_url = body.image_url || "";
    const price = Number(body.price || 0);
    const price_type = body.price_type || "jour";
    const disponibilite = body.disponibilite || "disponible";
    const telephone = body.telephone || "";

    console.log("ANNONCE RECEIVED:", body);

    if (!user_id || !titre) {
      return res.status(400).json({ error: "missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO annonces (
        user_id,
        titre,
        description,
        ville,
        categorie,
        image_url,
        price
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        user_id,
        titre,
        description,
        ville,
        categorie,
        image_url,
        price
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: "create error" });
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
    console.error("FEED ERROR:", err);
    res.json([]);
  }
});

/* ======================
START
====================== */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 NIA RUNNING ON", PORT);
});
