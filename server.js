import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ========================
// HEALTH CHECK
// ========================
app.get("/", (req, res) => {
  res.json({
    status: "NIA RDC API ONLINE 🚀"
  });
});

// ========================
// GET ALL ANNONCES
// ========================
app.get("/annonces", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM annonces ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// CREATE ANNONCE
// ========================
app.post("/annonces", async (req, res) => {
  try {
    const {
      titre,
      description,
      prix_jour,
      ville,
      categorie,
      conditions_location,
      contact_phone,
      contact_name,
      status
    } = req.body;

    const result = await pool.query(
      `INSERT INTO annonces
      (titre, description, prix_jour, ville, categorie, conditions_location, contact_phone, contact_name, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        titre,
        description,
        prix_jour,
        ville,
        categorie,
        conditions_location,
        contact_phone,
        contact_name,
        status || "disponible"
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// START SERVER
// ========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});