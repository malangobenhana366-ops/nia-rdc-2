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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static(__dirname));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadImage(base64){
  try {
    if (!base64 || !base64.startsWith("data:image")) return "";
    const res = await cloudinary.uploader.upload(base64, { folder: "nia_rdc" });
    return res.secure_url;
  } catch (e) { 
    console.error("Cloudinary error:", e);
    return ""; 
  }
}

app.get("/feed", async (req,res)=>{
  try {
    const annonces = await pool.query("SELECT * FROM annonces ORDER BY is_vip DESC, created_at DESC, id DESC");
    const data = [];
    for(let a of annonces.rows){
      const imgs = await pool.query("SELECT image_url FROM annonce_images WHERE annonce_id=$1", [a.id]);
      data.push({ ...a, images: imgs.rows.map(i=>i.image_url) });
    }
    res.json(data);
  } catch (e) { res.json([]); }
});

// ROUTE REFAITE POUR LE MULTI-POSTING VIP SÉCURISÉ
app.post("/annonces", async (req,res)=>{
  try {
    let { user_id, titre, description, prix, devise, periode, ville, commune, quartier, telephone, statut, is_vip, images_base64 } = req.body;
    
    if (!titre || !telephone) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    const fields = await pool.query(
      `INSERT INTO annonces (user_id, titre, description, prix, devise, periode, ville, commune, quartier, telephone, statut, is_vip, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()) RETURNING id`,
      [user_id || 1, titre, description, prix || 0, devise || '$', periode || 'jour', ville || 'Lubumbashi', commune, quartier, telephone, statut || 'disponible', is_vip || false]
    );
    
    const id = fields.rows[0].id;
    
    if(images_base64 && Array.isArray(images_base64)){
      for(let b64 of images_base64){
        if (b64) {
          const url = await uploadImage(b64);
          if(url) {
            await pool.query("INSERT INTO annonce_images (annonce_id,image_url) VALUES ($1,$2)", [id,url]);
          }
        }
      }
    }
    res.json({success:true, id: id});
  } catch(e) { 
    console.error("Database Crash Log:", e);
    res.status(500).json({error: e.message || "Erreur interne de base de données."}); 
  }
});

app.delete("/annonces/:id/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM annonce_images WHERE annonce_id = $1", [req.params.id]);
    await pool.query("DELETE FROM annonces WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "err" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`NIA ENGINE OPERATIONAL ON PORT ${PORT}`));
