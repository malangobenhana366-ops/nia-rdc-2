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
    const res = await cloudinary.uploader.upload(base64, { folder: "nia_rdc" });
    return res.secure_url;
  } catch { return ""; }
}

/* FLUX GLOBAL */
app.get("/feed", async (req,res)=>{
  try {
    const queryStr = "SELECT a.*, u.is_vip FROM annonces a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC, a.id DESC";
    const annonces = await pool.query(queryStr);
    const data = [];
    for(let a of annonces.rows){
      const imgs = await pool.query("SELECT image_url FROM annonce_images WHERE annonce_id=$1", [a.id]);
      data.push({ ...a, images: imgs.rows.map(i=>i.image_url) });
    }
    res.json(data);
  } catch (e) { res.json([]); }
});

/* RECEPTION PUBLICATION */
app.post("/annonces", async (req,res)=>{
  try {
    let { user_id, titre, description, prix, periode, ville, commune, quartier, telephone, statut, images_base64 } = req.body;
    const annonce = await pool.query(
      `INSERT INTO annonces (user_id, titre, description, prix, periode, ville, commune, quartier, telephone, statut, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING id`,
      [user_id || 1, titre, description, prix || 0, periode, ville, commune, quartier, telephone, statut]
    );
    const annonceId = annonce.rows[0].id;
    if(images_base64 && images_base64.length > 0){
      for(let img of images_base64){
        const url = await uploadImage(img);
        if(url) await pool.query("INSERT INTO annonce_images (annonce_id,image_url) VALUES ($1,$2)", [annonceId,url]);
      }
    }
    res.json({success: true});
  } catch(e){ res.status(500).json({error:"error"}); }
});

/* 🔄 ROUTE : MISE À JOUR COMPLÈTE DE TOUS LES CHAMPS */
app.put("/annonces/:id/update", async (req, res) => {
  const { id } = req.params;
  const { titre, prix, periode, statut, description, ville, commune, quartier, telephone } = req.body;
  try {
    await pool.query(
      `UPDATE annonces 
       SET titre=$1, prix=$2, periode=$3, statut=$4, description=$5, ville=$6, commune=$7, quartier=$8, telephone=$9 
       WHERE id=$10`,
      [titre, prix, periode, statut, description, ville, commune, quartier, telephone, id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "update error" }); }
});

/* 🗑️ ROUTE : SUPPRESSION DÉFINITIVE */
app.delete("/annonces/:id/delete", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM annonces WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "delete error" }); }
});

/* ADSENSE REFRESH BOOST */
app.post("/annonces/:id/boost", async (req, res) => {
  try {
    await pool.query("UPDATE annonces SET created_at = NOW() WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "boost error" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log("NIA RDC ONLINE"));
  
