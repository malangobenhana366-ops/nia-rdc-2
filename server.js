import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import { v2 as cloudinary } from "cloudinary";

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));

/* ================= CLOUDINARY ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/* ================= HELPERS ================= */

async function uploadImage(base64) {
  try {
    const res = await cloudinary.uploader.upload(base64, {
      folder: "nia_v2"
    });
    return res.secure_url;
  } catch (e) {
    return null;
  }
}

/* ================= AUTH (SIMPLE MVP) ================= */

app.post("/auth/register", async (req, res) => {
  const { telephone, password } = req.body;

  const r = await pool.query(
    "INSERT INTO users (telephone, password) VALUES ($1,$2) RETURNING id, telephone",
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

  if (!user) return res.status(400).json({ error: "user not found" });
  if (user.password !== password)
    return res.status(400).json({ error: "wrong password" });

  res.json({ id: user.id, telephone: user.telephone });
});

/* ================= CREATE ANNONCE ================= */

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

    let uploadedImages = [];

    if (Array.isArray(images)) {
      for (const img of images) {
        const url = await uploadImage(img);
        if (url) uploadedImages.push(url);
      }
    }

    const mainImage = uploadedImages[0] || "";

    const r = await pool.query(
      `INSERT INTO annonces
      (user_id, titre, description, prix, ville, quartier, telephone, image_url)
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
        mainImage
      ]
    );

    const annonce = r.rows[0];

    /* images secondaires */
    const gallery = uploadedImages;

    res.json({
      ...annonce,
      images: gallery
    });

  } catch (e) {
    res.status(500).json({ error: "create failed" });
  }
});

/* ================= FEED CLEAN ================= */

app.get("/feed", async (req, res) => {
  const r = await pool.query(
    "SELECT * FROM annonces ORDER BY id DESC"
  );

  res.json(r.rows);
});

/* ================= START ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("RUNNING", PORT));
