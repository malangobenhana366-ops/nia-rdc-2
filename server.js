import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* =====================
   TEST SERVER
===================== */
app.get("/", (req, res) => {
  res.json({ status: "NIA BACKEND OK 🚀" });
});

/* =====================
   REGISTER
===================== */
app.post("/auth/register", async (req, res) => {
  try {
    const { telephone, password } = req.body;

    const result = await pool.query(
      `INSERT INTO users (telephone, password)
       VALUES ($1, $2)
       RETURNING id, telephone`,
      [telephone, password]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "register error" });
  }
});

/* =====================
   LOGIN
===================== */
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

    res.json({
      id: user.id,
      telephone: user.telephone
    });

  } catch (err) {
    res.status(500).json({ error: "login error" });
  }
});

/* =====================
   FEED (TEST)
===================== */
app.get("/feed", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM annonces ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

/* =====================
   START
===================== */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("SERVER RUNNING ON", PORT);
});