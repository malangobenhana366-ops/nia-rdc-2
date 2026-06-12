import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";
import { v2 as cloudinary } from "cloudinary";

const app = express();

/* ================= PATH ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.static(__dirname));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ================= CLOUDINARY ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadImage(base64) {
  try {
    const r = await cloudinary.uploader.upload(base64, {
      folder: "nia_rdc"
    });
    return r.secure_url;
  } catch (e) {
    return "";
  }
}

/* ================= AUTH (V1 SIMPLE STABLE) ================= */
app.post("/auth/register", async (req, res) => {
  const { telephone, password } = req.body;

  const r = await pool.query(
    "INSERT INTO users (telephone,password) VALUES ($1,$2) RETURNING id,telephone",
    [telephone, password]
  );

  res.json(r.rows[0]);
});

app.post("/auth/login", async (req, res) => {
  const { telephone, password } = req.body;

  const r = await pool.query(
    "SELECT * FROM users WHERE telephone=$1",
    [telephone]
  );

  const user = r.rows[0];

  if (!user) return res.status(400).json({ error: "not found" });
  if (user.password !== password)
    return res.status(400).json({ error: "wrong password" });

  res.json({ id: user.id, telephone: user.telephone });
});

/* ================= CREATE ANNONCE (V1 LOGIC + FIX IMAGES) ================= */
app.post("/annonces", async (req, res) => {
  try {
    const {
      user_id,
      titre,
      description,
      prix,
      ville,
      quartier,
      telephone,
      images
    } = req.body;

    let uploaded = [];

    if (Array.isArray(images)) {
      for (const img of images) {
        const url = await uploadImage(img);
        if (url) uploaded.push(url);
      }
    }

    const main = uploaded.length > 0 ? uploaded[0] : "";

    const r = await pool.query(
      `INSERT INTO annonces (
        user_id,
        titre,
        description,
        prix,
        ville,
        quartier,
        telephone,
        image_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        user_id,
        titre,
        description || "",
        prix || 0,
        ville || "",
        quartier || "",
        telephone || "",
        main
      ]
    );

    res.json({
      ...r.rows[0],
      images: uploaded   // 🔥 IMPORTANT: galerie complète
    });

  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "create error" });
  }
});

/* ================= FEED (V1 SIMPLE + STABLE) ================= */
app.get("/feed", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM annonces ORDER BY id DESC"
    );

    res.json(r.rows);
  } catch (e) {
    res.status(500).json([]);
  }
});

/* ================= START ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("🚀 RUNNING", PORT));
