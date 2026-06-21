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

// AUTHENTIFICATION APIS
app.post("/auth/register", async (req, res) => {
  try {
    const { telephone, password, acceptedTerms } = req.body;
    if (!telephone || !password) return res.status(400).json({ error: "Champs incomplets." });
    
    const userExist = await pool.query("SELECT id FROM users WHERE telephone = $1", [telephone]);
    if (userExist.rows.length > 0) return res.status(400).json({ error: "Ce numéro possède déjà un compte." });

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
    if (result.rows.length === 0) return res.status(400).json({ error: "Identifiants inconnus." });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Mot de passe erroné." });

    res.json({ success: true, user: { id: user.id, telephone: user.telephone, is_admin: user.is_admin } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/auth/delete-account", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.body.user_id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// FLUX PRINCIPAL DES ANNONCES
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
  } catch (e) { res.json([]); }
});

app.post("/annonces", async (req,res)=>{
  try {
    let { user_id, titre, description, prix, devise, periode, ville, commune, quartier, telephone, statut, is_vip, images_base64 } = req.body;
    const fields = await pool.query(
      `INSERT INTO annonces (user_id, titre, description, prix, devise, periode, ville, commune, quartier, telephone, statut, is_vip, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()) RETURNING id`,
      [user_id || null, titre, description, prix || 0, devise || '$', periode || 'jour', ville || 'Lubumbashi', commune, quartier, telephone, statut || 'disponible', is_vip || false]
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
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put("/annonces/:id", async (req, res) => {
  try {
    const { titre, prix, devise, periode, description, statut, ville, commune, quartier, telephone } = req.body;
    await pool.query(
      `UPDATE annonces SET titre=$1, prix=$2, devise=$3, periode=$4, description=$5, statut=$6, ville=$7, commune=$8, quartier=$9, telephone=$10 WHERE id=$11`,
      [titre, prix, devise, periode, description, statut, ville, commune, quartier, telephone, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ACTION DE BOOST (REMONTER LA DATE DE CRÉATION DE L'ANNONCE)
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
    await pool.query("UPDATE annonces SET signaux_count = signaux_count + 1 WHERE id = $1", [req.params.id]);
    await pool.query("INSERT INTO annonce_reports (annonce_id, raison) VALUES ($1, $2)", [req.params.id, req.body.raison || "Sans motif"]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ENVOI DE MESSAGES ADMIN CIBLÉS OU GLOBAUX
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
        [uid, `[Destinataire Tel: ${target_tel}] - ` + message, false, provenance_contexte || 'normal']
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ENREGISTRER LA RÉPONSE À UN MESSAGE DE L'ADMINISTRATION
app.post("/user/reply-message/:id", async (req, res) => {
  try {
    const { reponse } = req.body;
    await pool.query("UPDATE messages_admin SET reponse_utilisateur = $1 WHERE id = $2 AND is_global = FALSE", [reponse, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// MESSAGES DE L'ESPACE PRIVÉ UTILISATEUR
app.get("/user/:id/messages", async (req, res) => {
  try {
    const userRes = await pool.query("SELECT telephone FROM users WHERE id = $1", [req.params.id]);
    let tel = userRes.rows.length > 0 ? userRes.rows[0].telephone : '';
    const result = await pool.query(
      `SELECT * FROM messages_admin 
       WHERE user_id = $1 OR is_global = TRUE OR message LIKE $2 
       ORDER BY created_at DESC`, 
      [req.params.id, `%[Destinataire Tel: ${tel}]%`]
    );
    res.json(result.rows);
  } catch (e) { res.json([]); }
});

// ROUTES DES NOUVEAUX BOUTONS ADMIN : TRAITEMENT FILTRÉ DES RÉPONSES ET JUSTIFICATIONS
app.get("/admin/replied-messages/:context", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM messages_admin WHERE provenance_contexte = $1 AND reponse_utilisateur IS NOT NULL ORDER BY created_at DESC",
      [req.params.context]
    );
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/admin/reports", async (req, res) => {
  try {
    const query = `
      SELECT r.id as report_id, r.raison, r.created_at as reported_at, a.*,
             COALESCE(JSON_AGG(ai.image_url) FILTER (WHERE ai.image_url IS NOT NULL), '[]') as images
      FROM annonce_reports r
      JOIN annonces a ON r.annonce_id = a.id
      LEFT JOIN annonce_images ai ON a.id = ai.annonce_id
      GROUP BY r.id, a.id ORDER BY r.created_at DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`OPERATIONAL ON PORT ${PORT}`));
