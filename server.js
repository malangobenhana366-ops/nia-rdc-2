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

/* CLOUDINARY CONFIG */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/* ================= UPLOAD IMAGE ================= */
async function uploadImage(base64){
  try {
    const res = await cloudinary.uploader.upload(base64, {
      folder: "nia_rdc"
    });
    return res.secure_url;
  } catch (e) {
    return "";
  }
}

/* ================= REGISTER ================= */
app.post("/auth/register", async (req,res)=>{
  try {
    const { telephone, password } = req.body;

    const result = await pool.query(
      "INSERT INTO users (telephone,password) VALUES ($1,$2) RETURNING id,telephone",
      [telephone,password]
    );

    res.json(result.rows[0]);

  } catch (e) {
    res.status(500).json({error:"register error"});
  }
});

/* ================= LOGIN ================= */
app.post("/auth/login", async (req,res)=>{
  try {
    const { telephone, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE telephone=$1",
      [telephone]
    );

    const user = result.rows[0];

    if(!user) return res.status(400).json({error:"user not found"});
    if(user.password !== password)
      return res.status(400).json({error:"wrong password"});

    res.json({
      id: user.id,
      telephone: user.telephone
    });

  } catch (e) {
    res.status(500).json({error:"login error"});
  }
});

/* ================= CREATE ANNONCE (MULTI IMAGES PRO) ================= */
app.post("/annonces", async (req,res)=>{
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

    if(!user_id || !titre){
      return res.status(400).json({error:"missing title or user"});
    }

    /* upload images */
    let images = [];

    if(Array.isArray(images_base64) && images_base64.length > 0){
      for(const img of images_base64){
        const url = await uploadImage(img);
        if(url) images.push(url);
      }
    }

    const main_image = images[0] || "";

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
        prix_type || "location",
        ville || "",
        quartier || "",
        telephone || "",
        disponibilite || "disponible",
        main_image
      ]
    );

    res.json({
      ...result.rows[0],
      images
    });

  } catch (e) {
    res.status(500).json({error:"create error"});
  }
});

/* ================= FEED ================= */
app.get("/feed", async (req,res)=>{
  try {
    const result = await pool.query(
      "SELECT * FROM annonces ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (e) {
    res.json([]);
  }
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log("🚀 SERVER RUNNING ON", PORT));
