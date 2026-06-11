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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadImage(base64){
  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder: "nia_rdc",
      resource_type: "image"
    });
    return result.secure_url;
  } catch (e) {
    console.log("UPLOAD ERROR:", e.message);
    return "";
  }
}

app.get("/", (req,res)=>{
  res.json({status:"OK"});
});

/* AUTH */
app.post("/auth/register", async (req,res)=>{
  try {
    const { telephone, password } = req.body;

    const r = await pool.query(
      "INSERT INTO users (telephone,password) VALUES ($1,$2) RETURNING id,telephone",
      [telephone,password]
    );

    res.json(r.rows[0]);
  } catch {
    res.status(500).json({error:"register error"});
  }
});

app.post("/auth/login", async (req,res)=>{
  try {
    const { telephone, password } = req.body;

    const r = await pool.query(
      "SELECT * FROM users WHERE telephone=$1",
      [telephone]
    );

    const user = r.rows[0];

    if(!user) return res.status(400).json({error:"user not found"});
    if(user.password !== password)
      return res.status(400).json({error:"wrong password"});

    res.json({id:user.id, telephone:user.telephone});
  } catch {
    res.status(500).json({error:"login error"});
  }
});

/* CREATE ANNONCE (MULTI IMAGES FIX) */
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
      images
    } = req.body;

    if(!user_id || !titre){
      return res.status(400).json({error:"missing fields"});
    }

    let urls = [];

    if(Array.isArray(images)){
      for(let img of images.slice(0,10)){
        const url = await uploadImage(img);
        if(url) urls.push(url);
      }
    }

    const main_image = urls[0] || "";

    const r = await pool.query(
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
        image_url,
        images
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
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
        main_image,
        JSON.stringify(urls)
      ]
    );

    res.json(r.rows[0]);

  } catch (e) {
    console.log(e.message);
    res.status(500).json({error:"create error"});
  }
});

/* FEED */
app.get("/feed", async (req,res)=>{
  try {
    const r = await pool.query(
      "SELECT * FROM annonces ORDER BY id DESC"
    );
    res.json(r.rows);
  } catch {
    res.json([]);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log("RUNNING", PORT));
