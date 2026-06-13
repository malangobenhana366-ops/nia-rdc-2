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

// INITIALISATION DU SUPPORT DE LA RECHERCHE INTELLIGENTE ET DE LA COLONNE DE DEVISE SOUVENIR
async function preparerBaseDeDonnees() {
  try {
    // 1. Activer l'extension de calcul textuel flou (Trigrammes) tolérante aux fautes
    await pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
    
    // 2. Injecter de manière transparente la colonne de gestion de devise si elle manque
    await pool.query(`
      ALTER TABLE annonces 
      ADD COLUMN IF NOT EXISTS prix_devise TEXT DEFAULT 'USD';
    `);
    
    // 3. Poser un index d'optimisation Trigramme GIST pour l'exécution ultra-rapide des requêtes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_annonces_trgm_titre 
      ON annonces USING gist (titre gist_trgm_ops);
    `);
    console.log("BASE DE DONNÉES SYNCHRONISÉE AVEC RECHERCHE FLOU ET DEVISE.");
  } catch (err) {
    console.error("Note d'initialisation DB :", err.message);
  }
}
preparerBaseDeDonnees();

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

// RECHERCHE INTELLIGENTE : RECONNAÎT LES FAUTES DE FRAPPE ET LES MOTS ASSIMILÉS VIA INDICES DE SIMILITUDE
app.get("/annonces/search", async (req, res) => {
  const { q, ville, commune, quartier } = req.query;
  try {
    let queryConditions = [];
    let queryArgs = [];
    let indexArg = 1;

    if (q && q.trim() !== "") {
      // Évaluation floue : accepte toute correspondance dont la similarité textuelle dépasse 25% (gère fautes et synonymes structurels)
      queryConditions.push(`(similarity(titre, $${indexArg}) > 0.25 OR similarity(description, $${indexArg}) > 0.25 OR titre ILIKE $${indexArg} OR description ILIKE $${indexArg})`);
      queryArgs.push(`%${q.trim()}%`);
      indexArg++;
    }
    if (ville && ville.trim() !== "") {
      queryConditions.push(`ville ILIKE $${indexArg}`);
      queryArgs.push(`%${ville.trim()}%`);
      indexArg++;
    }
    if (commune && commune.trim() !== "") {
      queryConditions.push(`commune ILIKE $${indexArg}`);
      queryArgs.push(`%${commune.trim()}%`);
      indexArg++;
    }
    if (quartier && quartier.trim() !== "") {
      queryConditions.push(`quartier ILIKE $${indexArg}`);
      queryArgs.push(`%${quartier.trim()}%`);
      indexArg++;
    }

    let rawSqlQuery = "SELECT * FROM annonces";
    if (queryConditions.length > 0) {
      rawSqlQuery += " WHERE " + queryConditions.join(" AND ");
    }
    rawSqlQuery += " ORDER BY created_at DESC";

    const results = await pool.query(rawSqlQuery, queryArgs);
    const data = [];
    for(let a of results.rows){
      const imgs = await pool.query("SELECT image_url FROM annonce_images WHERE annonce_id=$1", [a.id]);
      data.push({ ...a, images: imgs.rows.map(i=>i.image_url) });
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
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

// CREATION DIRECTE ET GRATUITE (AVEC DEVISE PRÉSERVÉE)
app.post("/annonces", async (req,res)=>{
  try {
    let { user_id, titre, description, prix, prix_devise, periode, ville, commune, quartier, telephone, statut, images_base64 } = req.body;
    const fields = await pool.query(
      `INSERT INTO annonces (user_id, titre, description, prix, prix_devise, periode, ville, commune, quartier, telephone, statut, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING id`,
      [user_id || 1, titre, description, prix || 0, prix_devise || 'USD', periode, ville, commune, quartier, telephone, statut]
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

// ENREGISTREMENT DES MODIFICATIONS (PROPRIÉTAIRE ET ADMIN)
app.put("/annonces/:id/update", async (req, res) => {
  const { id } = req.params;
  const { titre, prix, prix_devise, periode, statut, description, ville, commune, quartier, telephone } = req.body;
  try {
    await pool.query(
      `UPDATE annonces SET titre=$1, prix=$2, prix_devise=$3, periode=$4, statut=$5, description=$6, ville=$7, commune=$8, quartier=$9, telephone=$10 WHERE id=$11`,
      [titre, prix, prix_devise || 'USD', periode, statut, description, ville, commune, quartier, telephone, id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "err" }); }
});

// SUPPRESSION DIRECTE (PROPRIÉTAIRE ET MODÉRATION FORCÉE ADMIN)
app.delete("/annonces/:id/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM annonce_images WHERE annonce_id = $1", [req.params.id]);
    await pool.query("DELETE FROM annonces WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "err" }); }
});

// BOOSTER ADSENSE (REMONTER AU TOP)
app.post("/annonces/:id/boost", async (req, res) => {
  try {
    await pool.query("UPDATE annonces SET created_at = NOW() WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "err" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log("NIA RDC ENGINE ONLINE WITH ADSENSE & INTELLIGENT SEARCH EXTENSIONS"));
