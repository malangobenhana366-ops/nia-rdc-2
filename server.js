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
    return ""; 
  }
}

// FLUX GÉNÉRAL DES OFFRES
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

// ENREGISTRER UNE ANNONCE (STANDARD OU COMPILATION VIP)
app.post("/annonces", async (req,res)=>{
  try {
    let { user_id, titre, description, prix, devise, periode, ville, commune, quartier, telephone, statut, is_vip, images_base64 } = req.body;
    
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
          if(url) await pool.query("INSERT INTO annonce_images (annonce_id,image_url) VALUES ($1,$2)", [id,url]);
        }
      }
    }
    res.json({ success: true, id });
  } catch(e) { 
    res.status(500).json({ error: e.message }); 
  }
});

// ÉDITER UN CHAMP DIRECT DEPUIS LE PROFIL PRIVÉ
app.put("/annonces/:id", async (req, res) => {
  try {
    const { titre, prix, devise, periode, description, statut } = req.body;
    await pool.query(
      `UPDATE annonces SET titre=$1, prix=$2, devise=$3, periode=$4, description=$5, statut=$6 WHERE id=$7`,
      [titre, prix, devise, periode, description, statut, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// SUPPRESSION COMMUNE (UTILISATEUR OU ADMINISTRATEUR)
app.delete("/annonces/:id/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM annonce_images WHERE annonce_id = $1", [req.params.id]);
    await pool.query("DELETE FROM annonces WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

/* ================= EXTENSION DE LA STRATÉGIE MESSAGERIE ADMIN ================= */

// ADMIN ENVOIE MESSAGE : GLOBAL OU CIBLÉ SUR UN TÉLÉPHONE UNIQUE
app.post("/admin/envoyer-message", async (req, res) => {
  try {
    const { type, telephone_cible, message } = req.body;
    
    if (type === "ALL") {
      // 1. Crée la notification d'alerte bandeau globale
      await pool.query("INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, FALSE)", ["ALERTE_ADMIN", message]);
      // 2. Stocke aussi dans la table messages avec un flag spécial 'ALL' pour la boîte de réception
      await pool.query("INSERT INTO messages (content, sender_id, receiver_id) VALUES ($1, 1, 0)", [`[Alerte Générale] ${message}`]);
    } else {
      // Message privé à une personne spécifique via son téléphone (utilisé comme clé de profil)
      // On cherche si un user existe avec ce téléphone pour lier l'ID, sinon on met 0 (profil invité temporaire)
      const userReq = await pool.query("SELECT id FROM users WHERE telephone = $1", [telephone_cible]);
      const receiver_id = userReq.rows.length > 0 ? userReq.rows[0].id : 0;
      
      // Stocke dans messages en mettant le numéro de téléphone cible dans une note ou structure
      await pool.query(
        "INSERT INTO messages (content, sender_id, receiver_id) VALUES ($1, 1, $2)",
        [`[Message Privé Admin destiné à ${telephone_cible}] : ${message}`, receiver_id]
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// RÉCUPÉRER LA BOITE DE RÉCEPTION LIÉE À UN PROFIL (MESSAGES PRIVÉS + ALERTES TOTALES)
app.get("/messages/boite/:telephone", async (req, res) => {
  try {
    const tel = req.params.telephone;
    // On prend les messages globaux (receiver_id = 0) ET les messages qui mentionnent le numéro ou liés à l'user ID
    const query = await pool.query(
      `SELECT * FROM messages 
       WHERE receiver_id = 0 
       OR content LIKE $1 
       ORDER BY created_at DESC`,
      [`%${tel}%`]
    );
    res.json(query.rows);
  } catch (e) { res.json([]); }
});

// ANCIENNE ROUTE BANDEAU ALERTE CONSERVÉE POUR LE HAUT DE L'APP
app.get("/notifications/globales", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM notifications WHERE type='ALERTE_ADMIN' ORDER BY created_at DESC LIMIT 3");
    res.json(result.rows);
  } catch (e) { res.json([]); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`NIA ENGINE OPERATIONAL ON PORT ${PORT}`));
