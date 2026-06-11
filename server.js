import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";
import { v2 as cloudinary } from "cloudinary";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ======================
MIDDLEWARE
====================== */
app.use(cors());
app.use(express.json({ limit: "20mb" })); // images base64 = gros payload
app.use(express.static(__dirname));

/* ======================
CLOUDINARY CONFIG
====================== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
      "INSERT INTO users (telephone,password) VALUES ($1,$2) RETURNING id,telephone",
      [telephone, password]
    );

    res.json(result.rows[0]);
  } catch (e) {
    console.error("REGISTER ERROR:", e.message);
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
  } catch (e) {
    console.error("LOGIN ERROR:", e.message);
    res.status(500).json({ error: "login error" });
  }
});

/* ======================
CLOUDINARY UPLOAD SAFE
====================== */
async function uploadImage(base64) {
  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder: "nia_rdc",
      resource_type: "image"
    });

    return result.secure_url;
  } catch (err) {
    console.error("CLOUDINARY ERROR:", err.message);
    return "";
  }
}

/* ======================
CREATE ANNONCE (FINAL STABLE)
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
      disponibilite,
      image_base64
    } = req.body;

    console.log("📦 NEW ANNONCE:", {
      user_id,
      titre,
      hasImage: !!image_base64
    });

    if (!user_id || !titre) {
      return res.status(400).json({ error: "missing fields" });
    }

    let image_url = "";

    /* IMAGE UPLOAD (OPTIONAL) */
    if (image_base64) {
      image_url = await uploadImage(image_base64);
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
        disponibilite,
        image_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
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
        disponibilite || "disponible",
        image_url
      ]
    );

    res.json(result.rows[0]);

  } catch (e) {
    console.error("CREATE ERROR:", e.message);
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
  } catch (e) {
    console.error(e.message);
    res.json([]);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("🚀 RUNNING", PORT));
