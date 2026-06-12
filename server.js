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

/* UPLOAD TO CLOUDINARY */
async function uploadImage(base64){
  try {
    const res = await cloudinary.uploader.upload(base64, {
      folder: "nia_rdc"
    });
    return res.secure_url;
  } catch {
    return "";
  }
}

/* REGISTER */
app.post("/auth/register", async (req,res)=>{
  const {telephone,password} = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO users (telephone,password) VALUES ($1,$2) RETURNING *",
      [telephone,password]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({error:"register error"});
  }
});

/* LOGIN */
app.post("/auth/login", async (req,res)=>{
  const {telephone,password} = req.body;
  const result = await pool.query(
    "SELECT * FROM users WHERE telephone=$1",
    [telephone]
  );
  const user = result.rows[0];

  if(!user) return res.status(400).json({error:"user not found"});
  if(user.password !== password)
    return res.status(400).json({error:"wrong password"});

  res.json({id:user.id,telephone:user.telephone});
});

/* CREATE ANNONCE + MULTI IMAGES */
app.post("/annonces", async (req,res)=>{
  try {
    let {
      user_id,
      titre,
      description,
      prix,
      periode,
      ville,
      commune,
      quartier,
      telephone,
      statut,
      images_base64
    } = req.body;

    if(!titre){
      return res.status(400).json({error:"missing fields"});
    }

    // Sécurité : ID 1 par défaut si non connecté lors des phases de tests
    if(!user_id) user_id = 1;

    // Insertion alignée avec le schéma SQL de NIA RDC
    const annonce = await pool.query(
      `INSERT INTO annonces (user_id, titre, description, prix, periode, ville, commune, quartier, telephone, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [user_id, titre, description, prix ? prix : 0, periode, ville, commune, quartier, telephone, statut]
    );

    const annonceId = annonce.rows[0].id;

    let images = [];
    if(images_base64 && images_base64.length > 0){
      for(let img of images_base64){
        const url = await uploadImage(img);
        if(url) images.push(url);
      }
    }

    for(let url of images){
      await pool.query(
        "INSERT INTO annonce_images (annonce_id,image_url) VALUES ($1,$2)",
        [annonceId,url]
      );
    }

    res.json({id:annonceId,images});

  } catch(e){
    console.error(e);
    res.status(500).json({error:"create error"});
  }
});

/* FEED + IMAGES */
app.get("/feed", async (req,res)=>{
  try {
    const annonces = await pool.query(
      "SELECT * FROM annonces ORDER BY id DESC"
    );
    const data = [];

    for(let a of annonces.rows){
      const imgs = await pool.query(
        "SELECT image_url FROM annonce_images WHERE annonce_id=$1",
        [a.id]
      );
      data.push({
        ...a,
        images: imgs.rows.map(i=>i.image_url)
      });
    }
    res.json(data);
  } catch {
    res.json([]);
  }
});

/* OBTENIR UNE SEULE ANNONCE POUR LA PAGE DÉTAILS */
app.get("/annonces/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM annonces WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Annonce introuvable" });
    }

    const annonce = result.rows[0];
    const imgs = await pool.query(
      "SELECT image_url FROM annonce_images WHERE annonce_id = $1",
      [id]
    );

    res.json({
      ...annonce,
      images: imgs.rows.map(i => i.image_url)
    });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur détails" });
  }
});

/* FORCE LE SERVEUR À TROUVER ET DISTRIBUER LA PAGE DETAILS */
app.get("/details.html", (req, res) => {
  res.sendFile(path.join(__dirname, "details.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log("RUNNING",PORT));
  
