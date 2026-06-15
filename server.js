import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcrypt";

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
    console.error("Erreur Cloudinary:", e);
    return ""; 
  }
}

// ROUTE : INSCRIPTION AVEC HACHAGE ET CHARTE ACCEPTEE
app.post("/auth/register", async (req, res) => {
  try {
    const { telephone, password, acceptedTerms } = req.body;
    if (!telephone || !password) {
      return res.status(400).json({ error: "Téléphone et mot de passe requis." });
    }
    if (!acceptedTerms) {
      return res.status(400).json({ error: "Vous devez accepter les conditions d'utilisation." });
    }

    const userExist = await pool.query("SELECT id FROM users WHERE telephone = $1", [telephone]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: "Ce numéro de téléphone est déjà enregistré." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users (telephone, password, accepted_terms) VALUES ($1, $2, TRUE) RETURNING id, telephone",
      [telephone, hashedPassword]
    );

    res.json({ success: true, user: newUser.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ROUTE : CONNEXION SÉCURISÉE CONTRE LES ROBOTS BRUTE-FORCE
app.post("/auth/login", async (req, res) => {
  try {
    const { telephone, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE telephone = $1", [telephone]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Utilisateur introuvable." });
    }

    const user = result.rows[0];

    // Vérification blocage temporel automatique
    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      return res.status(403).json({ error: "Compte temporairement bloqué suite à de trop nombreuses tentatives (robots détectés). Réessayez plus tard." });
    }

    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      // Incrémentation des erreurs pour bloquer les robots hacker
      await pool.query("UPDATE users SET login_attempts = login_attempts + 1 WHERE id = $1", [user.id]);
      if (user.login_attempts + 1 >= 5) {
        await pool.query("UPDATE users SET lock_until = NOW() + INTERVAL '15 minutes', login_attempts = 0 WHERE id = $1", [user.id]);
      }
      return res.status(400).json({ error: "Mot de passe incorrect." });
    }

    // Reset des tentatives si connexion réussie
    await pool.query("UPDATE users SET login_attempts = 0, lock_until = NULL WHERE id = $1", [user.id]);

    res.json({ success: true, user: { id: user.id, telephone: user.telephone } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ROUTE : SUPPRESSION DÉFINITIVE DE COMPTE
app.delete("/auth/delete-account", async (req, res) => {
  try {
    const { user_id } = req.body;
    if(!user_id) return res.status(400).json({ error: "ID Utilisateur requis." });

    // La suppression se fait en cascade automatiquement sur la base de données
    await pool.query("DELETE FROM users WHERE id = $1", [user_id]);
    res.json({ success: true, message: "Compte et données supprimés définitivement." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// FLUX D'ANNONCES OPTIMISÉ POUR DES MILLIERS D'UTILISATEURS EN SIMULTANÉ (HAUTE CHARGE)
app.get("/feed", async (req, res) => {
  try {
    const query = `
      SELECT a.*, COALESCE(JSON_AGG(ai.image_url) FILTER (WHERE ai.image_url IS NOT NULL), '[]') as images
      FROM annonces a
      LEFT JOIN annonce_images ai ON a.id = ai.annonce_id
      GROUP BY a.id
      ORDER BY a.is_vip DESC, a.created_at DESC, a.id DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (e) { 
    console.error(e);
    res.json([]); 
  }
});

// PUBLICATION
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
    console.error("Crash Insertion:", e);
    res.status(500).json({ error: e.message }); 
  }
});

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

app.delete("/annonces/:id/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM annonce_images WHERE annonce_id = $1", [req.params.id]);
    await pool.query("DELETE FROM annonces WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.post("/admin/alerte", async (req, res) => {
  try {
    const { message } = req.body;
    await pool.query("INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, FALSE)", ["ALERTE_ADMIN", message]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/notifications/globales", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM notifications WHERE type='ALERTE_ADMIN' ORDER BY created_at DESC LIMIT 3");
    res.json(result.rows);
  } catch (e) { res.json([]); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`NIA ENGINE OPERATIONAL ON PORT ${PORT}`));
