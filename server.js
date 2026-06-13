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

// FLUX PUBLIC & ADMIN (RÉCUPÉRATION GÉNÉRALE)
app.get("/feed", async (req,res)=>{
  try {
    const annonces = await pool.query("SELECT * FROM annonces ORDER BY created_at DESC, id DESC");
    const data = [];
    for(let a of annonces.rows){
      const imgs = await pool.query("SELECT image_url FROM annonce_images WHERE annonce_id=$1", [a.id]);
      data.push({ ...a, images: imgs.rows.map(i=>i.image_url) });
    }
    res.json(data);
  } catch (e) { res.json([]); }
});

// ROUTE REQUÉRANTE POUR LE TABLEAU DE BORD ADMIN
app.get("/admin/stats", async (req, res) => {
  try {
    const totalReq = await pool.query("SELECT COUNT(*) FROM annonces");
    const vipReq = await pool.query("SELECT COUNT(*) FROM annonces WHERE statut = 'vip' OR user_id = 100");
    
    const total = parseInt(totalReq.rows[0].count) || 0;
    const vip = parseInt(vipReq.rows[0].count) || 0;
    const standard = total - vip;

    res.json({ total, vip, standard });
  } catch (e) {
    res.status(500).json({ error: "Erreur lors du calcul des statistiques" });
  }
});

// CREATION AVEC ENREGISTREMENT DE LA DEVISE ($ / FC)
app.post("/annonces", async (req,res)=>{
  try {
    let { user_id, titre, description, prix, devise, periode, ville, commune, quartier, telephone, statut, images_base64 } = req.body;
    const fields = await pool.query(
      `INSERT INTO annonces (user_id, titre, description, prix, devise, periode, ville, commune, quartier, telephone, statut, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING id`,
      [user_id || 1, titre, description, prix || 0, devise || "$", periode, ville, commune, quartier, telephone, statut]
    );
    const id = fields.rows[0].id;
    if(images_base64){
      for(let b64 of images_base64){
        const url = await uploadImage(b64);
        if(url) await pool.query("INSERT INTO annonce_images (annonce_id,image_url) VALUES ($1,$2)", [id,url]);
      }
    }
    res.json({success:true});
  } catch(e) { res.status(500).json({error:"err"}); }
});

// ENREGISTREMENT DES MODIFICATIONS AVEC DEVISE COMPLÈTE
app.put("/annonces/:id/update", async (req, res) => {
  const { id } = req.params;
  const { titre, prix, devise, periode, statut, description, ville, commune, quartier, telephone } = req.body;
  try {
    await pool.query(
      `UPDATE annonces SET titre=$1, prix=$2, devise=$3, periode=$4, statut=$5, description=$6, ville=$7, commune=$8, quartier=$9, telephone=$10 WHERE id=$11`,
      [titre, prix, devise, periode, statut, description, ville, commune, quartier, telephone, id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "err" }); }
});

// SUPPRESSION DIRECTE
app.delete("/annonces/:id/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM annonce_images WHERE annonce_id = $1", [req.params.id]);
    await pool.query("DELETE FROM annonces WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "err" }); }
});

// BOOSTER (REMONTER AU TOP EN METTANT À JOUR LE TIMESTAMPS)
app.post("/annonces/:id/boost", async (req, res) => {
  try {
    await pool.query("UPDATE annonces SET created_at = NOW() WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "err" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log("NIA RDC ENGINE ONLINE WITH ADSENSE AND INTELLIGENT SEARCH"));
