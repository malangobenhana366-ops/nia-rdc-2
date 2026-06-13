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
app.use(express.json({ limit: "35mb" }));
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

// API STATS ADMIN
app.get("/admin/stats", async (req, res) => {
  try {
    const totalReq = await pool.query("SELECT COUNT(*) FROM annonces");
    const vipReq = await pool.query("SELECT COUNT(*) FROM annonces WHERE statut = 'vip'");
    const total = parseInt(totalReq.rows[0].count) || 0;
    const vip = parseInt(vipReq.rows[0].count) || 0;
    res.json({ total, vip, standard: (total - vip) });
  } catch { res.status(500).json({ error: "Err" }); }
});

// AUTHENTIFICATION
app.post("/auth/inscription", async (req, res) => {
  const { telephone, password } = req.body;
  try {
    const exist = await pool.query("SELECT * FROM users WHERE telephone = $1", [telephone]);
    if(exist.rows.length > 0) return res.status(400).json({ error: "Ce numéro détient déjà un compte." });
    await pool.query("INSERT INTO users (telephone, password) VALUES ($1, $2)", [telephone, password]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Err" }); }
});

app.post("/auth/connexion", async (req, res) => {
  const { telephone, password } = req.body;
  try {
    const userReq = await pool.query("SELECT * FROM users WHERE telephone = $1 AND password = $2", [telephone, password]);
    if(userReq.rows.length === 0) return res.status(401).json({ error: "Identifiants invalides." });
    const u = userReq.rows[0];
    res.json({ success: true, user: { id: u.id, telephone: u.telephone, is_vip: u.is_vip, shop_name: u.shop_name } });
  } catch { res.status(500).json({ error: "Err" }); }
});

app.post("/users/:id/upgrade-vip", async (req, res) => {
  try {
    await pool.query("UPDATE users SET is_vip = TRUE, shop_name = $1 WHERE id = $2", [req.body.shop_name, req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Err" }); }
});

// GET FEED - RETOURNE TOUTES LES ANNONCES COUPLÉES À LEURS IMAGES
app.get("/feed", async (req, res) => {
  try {
    const annonces = await pool.query("SELECT * FROM annonces ORDER BY created_at DESC, id DESC");
    const data = [];
    for(let a of annonces.rows){
      const imgs = await pool.query("SELECT image_url FROM annonce_images WHERE annonce_id = $1", [a.id]);
      data.push({ ...a, images: imgs.rows.map(i => i.image_url) });
    }
    res.json(data);
  } catch { res.json([]); }
});

// POST ANNONCE
app.post("/annonces", async (req, res) => {
  try {
    let { user_id, titre, description, prix, devise, periode, ville, commune, quartier, telephone, statut } = req.body;
    const r = await pool.query(
      `INSERT INTO annonces (user_id, titre, description, prix, devise, periode, ville, commune, quartier, telephone, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [user_id, titre, description, prix || 0, devise || '$', periode || 'jour', ville, commune, quartier, telephone, statut]
    );
    const id = r.rows[0].id;
    
    if(req.body.images_base64 && req.body.images_base64.length > 0){
      for(let b64 of req.body.images_base64){
        const url = await uploadImage(b64);
        if(url) await pool.query("INSERT INTO annonce_images (annonce_id, image_url) VALUES ($1,$2)", [id, url]);
      }
    }
    res.json({ success: true });
  } catch { res.status(500).json({ error: "err" }); }
});

app.put("/annonces/:id/update", async (req, res) => {
  const { titre, prix, devise, periode, statut, description, ville, commune, quartier, telephone } = req.body;
  try {
    await pool.query(
      `UPDATE annonces SET titre=$1, prix=$2, devise=$3, periode=$4, statut=$5, description=$6, ville=$7, commune=$8, quartier=$9, telephone=$10 WHERE id=$11`,
      [titre, prix, devise, periode, statut, description, ville, commune, quartier, telephone, req.params.id]
    );
    res.json({ success: true });
  } catch { res.status(500).json({ error: "err" }); }
});

app.delete("/annonces/:id/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM annonce_images WHERE annonce_id = $1", [req.params.id]);
    await pool.query("DELETE FROM annonces WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "err" }); }
});

app.post("/annonces/:id/boost", async (req, res) => {
  try {
    await pool.query("UPDATE annonces SET created_at = NOW() WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "err" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("NIA RDC ENGINE LIVE WITH FIXES"));
