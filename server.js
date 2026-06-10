import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* HOME CHECK */
app.get("/", (req, res) => {
  res.json({ status: "NIA BACKEND OK 🚀" });
});

/* REGISTER */
app.post("/auth/register", async (req, res) => {
  try {
    const { telephone, password } = req.body;

    if (!telephone || !password)
      return res.status(400).json({ error: "missing fields" });

    const result = await pool.query(
      `INSERT INTO users (telephone,password)
       VALUES ($1,$2)
       RETURNING id,telephone`,
      [telephone, password]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "register error" });
  }
});

/* LOGIN */
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
  } catch {
    res.status(500).json({ error: "login error" });
  }
});

/* CREATE POST */
app.post("/annonces", async (req, res) => {
  try {
    const { titre, description, ville, categorie, image_url, user_id } = req.body;

    const result = await pool.query(
      `INSERT INTO annonces (titre,description,ville,categorie,image_url,user_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [titre, description, ville, categorie, image_url, user_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "create error" });
  }
});

/* FEED */
app.get("/feed", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM annonces ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch {
    res.json([]);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("RUNNING", PORT));
