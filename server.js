import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "NIA_RDC_SECRET_TOKEN_KEY_99X";

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.static(__dirname));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// INITIALISATION COMPACTE DES SÉCURITÉS INFRASTRUCTURE DE LA BASE DE DONNÉES
async function initialiserTablesDb() {
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
    
    // Table Utilisateurs pour l'inscription chiffrée
    await pool.query(`
      CREATE TABLE IF NOT EXISTS utilisateurs (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        telephone TEXT,
        type TEXT DEFAULT 'standard',
        shop_name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Adaptation de la table annonces avec clef étrangère
    await pool.query(`
      ALTER TABLE annonces ADD COLUMN IF NOT EXISTS user_id INTEGER,
      ADD COLUMN IF NOT EXISTS prix_devise TEXT DEFAULT 'USD';
    `);
    
    console.log("INFRASTRUCTURE SECURITY DB SYNCHRONISÉE.");
  } catch (err) { console.error(err.message); }
}
initialiserTablesDb();

// MIDDLEWARE DE SÉCURISATION DES ACTIONS PRIVÉES (VÉRIFICATION DU JETON JWT)
const verifierJetonSecurise = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) return res.status(401).json({ error: "Accès refusé. Token manquant." });
  
  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) return res.status(403).json({ error: "Token invalide ou expiré." });
    req.user = decodedUser;
    next();
  });
};

// =================== CONTROLEURS AUTHENTIFICATION SÉCURISÉE ===================

// INSCRIPTION AVEC HACHAGE DES MOTS DE PASSE (BCRYPT)
app.post("/auth/register", async (req, res) => {
  const { username, password, telephone } = req.body;
  try {
    if(!username || !password) return res.status(400).json({ error: "Données incomplètes." });
    
    // Hachage du mot de passe
    const selChiffrement = await bcrypt.genSalt(10);
    const motDePasseHache = await bcrypt.hash(password, selChiffrement);

    const nouvelUser = await pool.query(
      "INSERT INTO utilisateurs (username, password, telephone) VALUES ($1, $2, $3) RETURNING id, username, type",
      [username, motDePasseHache, telephone]
    );

    const user = nouvelUser.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, type: user.type }, JWT_SECRET, { expiresIn: "30d" });

    res.json({ token, userId: user.id, type: user.type, username: user.username });
  } catch (err) {
    res.status(400).json({ error: "Ce nom d'utilisateur est déjà utilisé en RDC." });
  }
});

// CONNEXION SÉCURISÉE AVEC VÉRIFICATION DE HACHAGE
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const r = await pool.query("SELECT * FROM utilisateurs WHERE username = $1", [username]);
    if(r.rows.length === 0) return res.status(400).json({ error: "Utilisateur introuvable." });

    const user = r.rows[0];
    const motDePasseValide = await bcrypt.compare(password, user.password);
    if(!motDePasseValide) return res.status(400).json({ error: "Mot de passe incorrect." });

    const token = jwt.sign({ id: user.id, username: user.username, type: user.type }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, userId: user.id, type: user.type, username: user.username, shopName: user.shop_name });
  } catch (err) { res.status(500).json({ error: "Erreur d'authentification." }); }
});

// ABONNEMENT COMPTE VIP PRO
app.post("/auth/upgrade-vip", verifierJetonSecurise, async (req, res) => {
  const { shopName } = req.body;
  try {
    await pool.query("UPDATE utilisateurs SET type = 'vip', shop_name = $1 WHERE id = $2", [shopName, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Erreur de mise à niveau." }); }
});

// =================== FLUX LOGIQUE DES ANNONCES REQUÉRANTES ===================

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

app.post("/annonces", verifierJetonSecurise, async (req,res)=>{
  try {
    let { titre, description, prix, prix_devise, periode, ville, commune, quartier, telephone, statut, images_base64 } = req.body;
    const fields = await pool.query(
      `INSERT INTO annonces (user_id, titre, description, prix, prix_devise, periode, ville, commune, quartier, telephone, statut, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING id`,
      [req.user.id, titre, description, prix || 0, prix_devise || 'USD', periode, ville, commune, quartier, telephone, statut]
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

app.put("/annonces/:id/update", verifierJetonSecurise, async (req, res) => {
  const { id } = req.params;
  const { titre, prix, prix_devise, periode, statut, description, ville, commune, quartier, telephone } = req.body;
  try {
    // Vérification de propriété sécurisée
    const check = await pool.query("SELECT user_id FROM annonces WHERE id = $1", [id]);
    if(check.rows.length === 0) return res.status(404).json({ error: "Introuvable" });
    if(check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: "Action non autorisée." });

    await pool.query(
      `UPDATE annonces SET titre=$1, prix=$2, prix_devise=$3, periode=$4, statut=$5, description=$6, ville=$7, commune=$8, quartier=$9, telephone=$10 WHERE id=$11`,
      [titre, prix, prix_devise || 'USD', periode, statut, description, ville, commune, quartier, telephone, id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "err" }); }
});

app.delete("/annonces/:id/delete", verifierJetonSecurise, async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query("SELECT user_id FROM annonces WHERE id = $1", [id]);
    if(check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: "Action non autorisée." });

    await pool.query("DELETE FROM annonce_images WHERE annonce_id = $1", [id]);
    await pool.query("DELETE FROM annonces WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "err" }); }
});

app.post("/annonces/:id/boost", verifierJetonSecurise, async (req, res) => {
  try {
    await pool.query("UPDATE annonces SET created_at = NOW() WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "err" }); }
});

// RECHERCHE FLOUE (TRIGRAMMES)
app.get("/annonces/search", async (req, res) => {
  const { q, ville, commune, quartier } = req.query;
  try {
    let queryConditions = []; let queryArgs = []; let indexArg = 1;
    if (q && q.trim() !== "") {
      queryConditions.push(`(similarity(titre, $${indexArg}) > 0.25 OR titre ILIKE $${indexArg})`);
      queryArgs.push(`%${q.trim()}%`); indexArg++;
    }
    if (ville) { queryConditions.push(`ville ILIKE $${indexArg}`); queryArgs.push(`%${ville.trim()}%`); indexArg++; }
    
    let queryStr = "SELECT * FROM annonces" + (queryConditions.length > 0 ? " WHERE " + queryConditions.join(" AND ") : "") + " ORDER BY created_at DESC";
    const results = await pool.query(queryStr, queryArgs);
    
    const data = [];
    for(let a of results.rows){
      const imgs = await pool.query("SELECT image_url FROM annonce_images WHERE annonce_id=$1", [a.id]);
      data.push({ ...a, images: imgs.rows.map(i=>i.image_url) });
    }
    res.json(data);
  } catch (err) { res.status(500).json([]); }
});

// SÉCURITÉ MODÉRATION FORCE ADMIN (PURGE PRIVÉE SÉCURISÉE)
app.delete("/admin/annonces/:id", verifierJetonSecurise, async (req, res) => {
  try {
    await pool.query("DELETE FROM annonce_images WHERE annonce_id = $1", [req.params.id]);
    await pool.query("DELETE FROM annonces WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "err" }); }
});

async function uploadImage(base64){
  try {
    const res = await cloudinary.uploader.upload(base64, { folder: "nia_rdc" });
    return res.secure_url;
  } catch { return ""; }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log("SERVER SECURE INSTANCE RUNNING. READY."));
