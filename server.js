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

async function initialiserTablesDb() {
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
    
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS annonces (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        titre TEXT NOT NULL,
        description TEXT,
        prix NUMERIC DEFAULT 0,
        prix_devise TEXT DEFAULT 'USD',
        periode TEXT DEFAULT 'jour',
        ville TEXT DEFAULT 'Lubumbashi',
        commune TEXT,
        quartier TEXT,
        telephone TEXT,
        statut TEXT DEFAULT 'disponible',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS annonce_images (
        id SERIAL PRIMARY KEY,
        annonce_id INTEGER NOT NULL,
        image_url TEXT NOT NULL
      );
    `);
    
    console.log("BASE DE DONNEES INITIALISEE ET SECURISEE.");
  } catch (err) { console.error("Erreur Init DB:", err.message); }
}
initialiserTablesDb();

const verifierJetonSecurise = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) return res.status(401).json({ error: "Non autorisé" });
  
  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) return res.status(403).json({ error: "Session expirée" });
    req.user = decodedUser;
    next();
  });
};

// =================== AUTHENTIFICATION CORRIGÉE ET SECURE ===================

app.post("/auth/register", async (req, res) => {
  const { username, password, telephone } = req.body;
  try {
    if(!username || !password) return res.status(400).json({ error: "Champs requis manquants." });
    
    const salt = await bcrypt.genSalt(10);
    const hashmotdepasse = await bcrypt.hash(password, salt);

    const nouvelUser = await pool.query(
      "INSERT INTO utilisateurs (username, password, telephone, type) VALUES ($1, $2, $3, 'standard') RETURNING id, username, type",
      [username, hashmotdepasse, telephone]
    );

    const user = nouvelUser.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, type: user.type }, JWT_SECRET, { expiresIn: "30d" });

    res.json({ token, userId: user.id, type: user.type, username: user.username, shopName: "" });
  } catch (err) {
    res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris." });
  }
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const r = await pool.query("SELECT * FROM utilisateurs WHERE username = $1", [username]);
    if(r.rows.length === 0) return res.status(400).json({ error: "Compte introuvable." });

    const user = r.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(400).json({ error: "Mot de passe erroné." });

    const token = jwt.sign({ id: user.id, username: user.username, type: user.type }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, userId: user.id, type: user.type, username: user.username, shopName: user.shop_name });
  } catch (err) { res.status(500).json({ error: "Erreur serveur login" }); }
});

app.post("/auth/upgrade-vip", verifierJetonSecurise, async (req, res) => {
  const { shopName } = req.body;
  try {
    await pool.query("UPDATE utilisateurs SET type = 'vip', shop_name = $1 WHERE id = $2", [shopName, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Erreur upgrade" }); }
});

// =================== FLUX LOGIQUE PROTEGE PAR JETON ===================

app.get("/feed", verifierJetonSecurise, async (req,res)=>{
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
      `INSERT INTO annonces (user_id, titre, description, prix, prix_devise, periode, ville, commune, quartier, telephone, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
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
  } catch(e) { res.status(500).json({error:"Erreur publication"}); }
});

app.put("/annonces/:id/update", verifierJetonSecurise, async (req, res) => {
  const { id } = req.params;
  const { titre, prix, prix_devise, periode, statut, description, ville, commune, quartier, telephone } = req.body;
  try {
    await pool.query(
      `UPDATE annonces SET titre=$1, prix=$2, prix_devise=$3, periode=$4, statut=$5, description=$6, ville=$7, commune=$8, quartier=$9, telephone=$10 WHERE id=$11 AND user_id=$12`,
      [titre, prix, prix_devise, periode, statut, description, ville, commune, quartier, telephone, id, req.user.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Erreur modification" }); }
});

app.delete("/annonces/:id/delete", verifierJetonSecurise, async (req, res) => {
  try {
    await pool.query("DELETE FROM annonce_images WHERE annonce_id = $1", [req.params.id]);
    await pool.query("DELETE FROM annonces WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Erreur suppression" }); }
});

app.post("/annonces/:id/boost", verifierJetonSecurise, async (req, res) => {
  try {
    await pool.query("UPDATE annonces SET created_at = NOW() WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Erreur boost" }); }
});

app.get("/annonces/search", verifierJetonSecurise, async (req, res) => {
  const { q, ville } = req.query;
  try {
    const results = await pool.query(
      "SELECT * FROM annonces WHERE titre ILIKE $1 AND ville ILIKE $2 ORDER BY created_at DESC",
      [`%${q}%`, `%${ville}%`]
    );
    const data = [];
    for(let a of results.rows){
      const imgs = await pool.query("SELECT image_url FROM annonce_images WHERE annonce_id=$1", [a.id]);
      data.push({ ...a, images: imgs.rows.map(i=>i.image_url) });
    }
    res.json(data);
  } catch (err) { res.status(500).json([]); }
});

async function uploadImage(base64){
  try {
    const res = await cloudinary.uploader.upload(base64, { folder: "nia_rdc" });
    return res.secure_url;
  } catch { return ""; }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log("SERVER ONLINE. CONTEXTE VERROUILLE."));
