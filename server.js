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
  } catch (e) { return ""; }
}

// SYSTEME D'AUTHENTIFICATION SÉCURISÉ
app.post("/auth/register", async (req, res) => {
  try {
    const { telephone, password } = req.body;
    if (!telephone || !password) return res.status(400).json({ error: "Champs manquants." });
    const userExist = await pool.query("SELECT id FROM users WHERE telephone = $1", [telephone]);
    if (userExist.rows.length > 0) return res.status(400).json({ error: "Ce numéro est déjà utilisé." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users (telephone, password, accepted_terms) VALUES ($1, $2, TRUE) RETURNING id, telephone",
      [telephone, hashedPassword]
    );
    res.json({ success: true, user: newUser.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { telephone, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE telephone = $1", [telephone]);
    if (result.rows.length === 0) return res.status(400).json({ error: "Utilisateur introuvable." });

    const match = await bcrypt.compare(password, result.rows[0].password);
    if (!match) return res.status(400).json({ error: "Mot de passe incorrect." });

    res.json({ success: true, user: { id: result.rows[0].id, telephone: result.rows[0].telephone, is_admin: result.rows[0].is_admin } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/auth/delete-account", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.body.user_id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// FLUX D'ANNONCES COMPLET
app.get("/feed", async (req, res) => {
  try {
    const query = `
      SELECT a.*, COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', ai.id, 'url', ai.image_url)) FILTER (WHERE ai.id IS NOT NULL), '[]') as images
      FROM annonces a
      LEFT JOIN annonce_images ai ON a.id = ai.annonce_id
      GROUP BY a.id
      ORDER BY a.is_vip DESC, a.created_at DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (e) { res.json([]); }
});

// CRÉATION STANDARD ET VIP
app.post("/annonces", async (req,res)=>{
  try {
    let { user_id, titre, description, prix, devise, periode, ville, commune, quartier, telephone, statut, is_vip, images_base64 } = req.body;
    const fields = await pool.query(
      `INSERT INTO annonces (user_id, titre, description, prix, devise, periode, ville, commune, quartier, telephone, statut, is_vip, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()) RETURNING id`,
      [user_id || null, titre, description, prix || 0, devise || '$', periode || 'jour', ville || 'Lubumbashi', commune || '', quartier || '', telephone, statut || 'disponible', is_vip || false]
    );
    const id = fields.rows[0].id;
    if(images_base64 && Array.isArray(images_base64)){
      for(let b64 of images_base64){
        const url = await uploadImage(b64);
        if(url) await pool.query("INSERT INTO annonce_images (annonce_id, image_url) VALUES ($1, $2)", [id, url]);
      }
    }
    res.json({ success: true, id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// MODIFICATION COMPLÈTE AVEC RECEPTION OPTIONNELLE DE NOUVELLES IMAGES
app.put("/annonces/:id", async (req, res) => {
  try {
    const { titre, prix, devise, periode, description, statut, ville, commune, telephone, nouvelles_images_base64 } = req.body;
    await pool.query(
      `UPDATE annonces SET titre=$1, prix=$2, devise=$3, periode=$4, description=$5, statut=$6, ville=$7, commune=$8, telephone=$9 WHERE id=$10`,
      [titre, prix, devise, periode, description, statut, ville, commune, telephone, req.params.id]
    );
    if(nouvelles_images_base64 && Array.isArray(nouvelles_images_base64)){
      for(let b64 of nouvelles_images_base64){
        const url = await uploadImage(b64);
        if(url) await pool.query("INSERT INTO annonce_images (annonce_id, image_url) VALUES ($1, $2)", [req.params.id, url]);
      }
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// SUPPRESSION D'UNE IMAGE UNIQUE PAR ID LORS DE L'EDITION
app.delete("/images/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM annonce_images WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/annonces/:id/boost", async (req, res) => {
  try {
    await pool.query("UPDATE annonces SET created_at = NOW() WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/annonces/:id/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM annonces WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/annonces/:id/signaler", async (req, res) => {
  try {
    await pool.query("INSERT INTO annonce_reports (annonce_id, raison) VALUES ($1, $2)", [req.params.id, req.body.raison || "Non spécifié"]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ROUTES DE MODÉRATION ET D'ALERTES ADMIN
app.post("/admin/message", async (req, res) => {
  try {
    const { target_tel, message, is_global, provenance_contexte } = req.body;
    if (is_global) {
      await pool.query("INSERT INTO messages_admin (user_id, message, is_global, provenance_contexte) VALUES (NULL, $1, TRUE, 'normal')", [message]);
    } else {
      const userRes = await pool.query("SELECT id FROM users WHERE telephone = $1", [target_tel]);
      let uid = userRes.rows.length > 0 ? userRes.rows[0].id : null;
      await pool.query(
        "INSERT INTO messages_admin (user_id, message, is_global, provenance_contexte) VALUES ($1, $2, FALSE, $3)", 
        [uid, message, false, provenance_contexte || 'normal']
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/user/reply-message/:id", async (req, res) => {
  try {
    await pool.query("UPDATE messages_admin SET reponse_utilisateur = $1 WHERE id = $2", [req.body.reponse, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/user/:id/messages", async (req, res) => {
  try {
    const userRes = await pool.query("SELECT telephone FROM users WHERE id = $1", [req.params.id]);
    let tel = userRes.rows.length > 0 ? userRes.rows[0].telephone : '';
    const result = await pool.query(
      `SELECT * FROM messages_admin WHERE user_id = $1 OR is_global = TRUE ORDER BY created_at DESC`, 
      [req.params.id]
    );
    res.json(result.rows);
  } catch (e) { res.json([]); }
});

app.get("/admin/replied-messages/:context", async (req, res) => {
  try {
    const result = await pool.query("SELECT m.*, u.telephone as user_tel FROM messages_admin m LEFT JOIN users u ON m.user_id = u.id WHERE m.provenance_contexte = $1 AND m.reponse_utilisateur IS NOT NULL ORDER BY m.created_at DESC", [req.params.context]);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/admin/reports", async (req, res) => {
  try {
    const query = `
      SELECT r.id as report_id, r.raison, r.created_at as reported_at, a.*,
             COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', ai.id, 'url', ai.image_url)) FILTER (WHERE ai.id IS NOT NULL), '[]') as images
      FROM annonce_reports r
      JOIN annonces a ON r.annonce_id = a.id
      LEFT JOIN annonce_images ai ON a.id = ai.annonce_id
      GROUP BY r.id, a.id ORDER BY r.created_at DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// MESSAGERIE PRIVÉE SÉCURISÉE (STYLE 2EMEMAIN INTER-UTILISATEURS)
app.post("/chat/send", async (req, res) => {
  try {
    const { annonce_id, expediteur_id, contenu } = req.body;
    const ownerRes = await pool.query("SELECT user_id FROM annonces WHERE id = $1", [annonce_id]);
    if(ownerRes.rows.length === 0) return res.status(404).json({ error: "Annonce introuvable." });
    
    const destinataire_id = ownerRes.rows[0].user_id;
    if(!destinataire_id) return res.status(400).json({ error: "Le propriétaire de l'annonce n'a pas de compte utilisateur lié." });
    
    await pool.query(
      "INSERT INTO messages_priveis (annonce_id, expediteur_id, destinataire_id, contenu) VALUES ($1, $2, $3, $4)",
      [annonce_id, expediteur_id, destinataire_id, contenu]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/chat/conversations/:user_id", async (req, res) => {
  try {
    const uid = req.params.user_id;
    const query = `
      SELECT m.*, a.titre as annonce_titre,
             u1.telephone as expediteur_tel, u2.telephone as destinataire_tel
      FROM messages_priveis m
      JOIN annonces a ON m.annonce_id = a.id
      JOIN users u1 ON m.expediteur_id = u1.id
      JOIN users u2 ON m.destinataire_id = u2.id
      WHERE m.expediteur_id = $1 OR m.destinataire_id = $1
      ORDER BY m.created_at DESC;
    `;
    const result = await pool.query(query, [uid]);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur opérationnel sur le port ${PORT}`));
