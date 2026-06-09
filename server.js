import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =====================
// DB
// =====================
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// =====================
// INIT TABLES AUTO
// =====================
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telephone TEXT UNIQUE,
      password TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS annonces (
      id SERIAL PRIMARY KEY,
      user_id INT,
      titre TEXT,
      description TEXT,
      prix_jour NUMERIC,
      ville TEXT,
      categorie TEXT,
      conditions_location TEXT,
      contact_phone TEXT,
      contact_name TEXT,
      status TEXT DEFAULT 'disponible',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}
initDB();

// =====================
// AUTH
// =====================
app.post("/auth/register", async (req, res) => {
  try {
    const { telephone, password } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (telephone, password) VALUES ($1,$2) RETURNING id, telephone",
      [telephone, hash]
    );

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { telephone, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE telephone=$1",
      [telephone]
    );

    if (!result.rows[0]) return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Wrong password" });

    res.json({ id: user.id, telephone: user.telephone });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =====================
// ANNONCES
// =====================
app.get("/annonces", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM annonces ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

app.post("/annonces", async (req, res) => {
  try {
    const {
      user_id,
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
      (user_id, titre, description, prix_jour, ville, categorie,
       conditions_location, contact_phone, contact_name, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        user_id,
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =====================
// START
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("NIA RDC API RUNNING ON " + PORT);
});