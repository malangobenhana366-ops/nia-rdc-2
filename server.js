import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";
import { v2 as cloudinary } from "cloudinary";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.static(__dirname));

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
    console.log("upload error:", e);
    return "";
  }
}

/* ================= AUTH ================= */

app.post("/auth/register", async (req, res) => {
  const { telephone, password } = req.body;

  try {
    const r = await pool.query(
      "INSERT INTO users (telephone,password) VALUES ($1,$2) RETURNING id,telephone",
      [telephone, password]
    );

    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "register error" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { telephone, password } = req.body;

  try {
    const r = await pool.query(
      "SELECT * FROM users WHERE telephone=$1",
      [telephone]
    );

    const user = r.rows[0];

    if (!user) return res.status(400).json({ error: "not found" });
    if (user.password !== password)
      return res.status(400).json({ error: "wrong password" });

    res.json({ id: user.id, telephone: user.telephone });
  } catch (e) {
    res.status(500).json({ error: "login error" });
  }
});

/* ================= CREATE ANNONCE ================= */

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
      disponibilite,
      images_base64
    } = req.body;

    let images = [];

    if (Array.isArray(images_base64)) {
      for (const img of images_base64) {
        const url = await uploadImage(img);
        if (url) images.push(url);
      }
    }

    const mainImage = images[0] || "";

    const r = await pool.query(
      `INSERT INTO annonces (
        user_id, titre, description, prix, prix_type,
        ville, quartier, telephone, disponibilite, image_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        user_id,
        titre,
        description || "",
        prix || 0,
        prix_type || "location",
        ville || "",
        quartier || "",
        telephone || "",
        disponibilite || "disponible",
        mainImage
      ]
    );

    const annonceId = r.rows[0].id;

    // 💥 stockage images multiples réel
    for (const img of images) {
      await pool.query(
        "INSERT INTO annonce_images (annonce_id, image_url) VALUES ($1,$2)",
        [annonceId, img]
      );
    }

    res.json({
      ...r.rows[0],
      images
    });

  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "create error" });
  }
});

/* ================= FEED ================= */

app.get("/feed", async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT a.*,
        COALESCE(
          json_agg(ai.image_url) FILTER (WHERE ai.image_url IS NOT NULL),
          '[]'
        ) AS images
      FROM annonces a
      LEFT JOIN annonce_images ai ON a.id = ai.annonce_id
      GROUP BY a.id
      ORDER BY a.id DESC
    `);

    res.json(r.rows);
  } catch (e) {
    console.log(e);
    res.status(500).json([]);
  }
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("RUNNING", PORT));mm
