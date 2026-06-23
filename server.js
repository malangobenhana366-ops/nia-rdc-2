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

// INSCRIPTION AVEC SÉCURITÉ ET GÉNÉRATION AUTOMATIQUE DU NUP
app.post("/auth/register", async (req, res) => {
  try {
    const { telephone, password } = req.body;
    if (!telephone || !password) return res.status(400).json({ error: "Champs manquants." });
    
    const userExist = await pool.query("SELECT id FROM users WHERE telephone = $1", [telephone]);
    if (userExist.rows.length > 0) return res.status(400).json({ error: "Ce numéro est déjà utilisé." });

    const nupAleatoire = "NUP-" + Math.floor(1000 + Math.random() * 9000);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await pool.query(
      "INSERT INTO users (telephone, password, nup, accepted_terms) VALUES ($1, $2, $3, TRUE) RETURNING id, telephone, nup",
      [telephone, hashedPassword, nupAleatoire]
    );
    res.json({ success: true, user: newUser.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// CONNEXION SÉCURISÉE BCRYPT
app.post("/auth/login", async (req, res) => {
  try {
    const { telephone, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE telephone = $1", [telephone]);
    if (result.rows.length === 0) return res.status(400).json({ error: "Utilisateur introuvable." });

    const match = await bcrypt.compare(password, result.rows[0].password);
    if (!match) return res.status(400).json({ error: "Mot de passe incorrect." });

    res.json({ success: true, user: { id: result.rows[0].id, telephone: result.rows[0].telephone, nup: result.rows[0].nup, is_admin: result.rows[0].is_admin } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// SUPPRESSION COMPLÈTE DU COMPTE (RGPD / SÉCURITÉ)
app.delete("/auth/delete-account", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.body.user_id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// FLUX GÉNÉRAL AVEC IMAGES ET TRI VIP PRIORITAIRE
app.get("/feed", async (req, res) => {
  try {
    const query = `
      SELECT a.*, u.nup as proprietaire_nup,
             COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', ai.id, 'url', ai.image_url)) FILTER (WHERE ai.id IS NOT NULL), '[]') as images
      FROM annonces a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN annonce_images ai ON a.id = ai.annonce_id
      GROUP BY a.id, u.nup
      ORDER BY a.is_vip DESC, a.created_at DESC;
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

// SIGNALEMENT SÉCURISÉ DES ANNONCES
app.post("/annonces/:id/signaler", async (req, res) => {
  try {
    await pool.query("INSERT INTO annonce_reports (annonce_id, raison) VALUES ($1, $2)", [req.params.id, req.body.raison || "Non spécifié"]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/admin/reports", async (req, res) => {
  try {
    const query = `
      SELECT r.id as report_id, r.raison, r.created_at as reported_at, a.*, u.nup as proprietaire_nup,
             COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', ai.id, 'url', ai.image_url)) FILTER (WHERE ai.id IS NOT NULL), '[]') as images
      FROM annonce_reports r
      JOIN annonces a ON r.annonce_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN annonce_images ai ON a.id = ai.annonce_id
      GROUP BY r.id, a.id, u.nup ORDER BY r.created_at DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// MESSAGERIE CONTEXTUELLE PRIVÉE
app.post("/chat/send", async (req, res) => {
  try {
    const { annonce_id, expediteur_id, contenu, provenance_contexte } = req.body;
    let destinataire_id = null;

    if (annonce_id) {
      const ownerRes = await pool.query("SELECT user_id FROM annonces WHERE id = $1", [annonce_id]);
      if(ownerRes.rows.length > 0) destinataire_id = ownerRes.rows[0].user_id;
    }

    if (!destinataire_id) return res.status(404).json({ error: "Bénéficiaire introuvable." });
    
    await pool.query(
      "INSERT INTO messages_priveis (annonce_id, expediteur_id, destinataire_id, contenu, provenance_contexte) VALUES ($1, $2, $3, $4, $5)",
      [annonce_id || null, expediteur_id, destinataire_id, contenu, provenance_contexte || 'normal']
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ENVOI GLOBAL (MESSAGES IMPOSSIBLES À RÉPONDRE)
app.post("/admin/broadcast", async (req, res) => {
  try {
    const { contenu } = req.body;
    const adminRes = await pool.query("SELECT id FROM users WHERE is_admin = TRUE LIMIT 1");
    if(adminRes.rows.length === 0) return res.status(403).json({ error: "Pas d'admin configuré." });
    const adminId = adminRes.rows[0].id;

    const allUsers = await pool.query("SELECT id FROM users WHERE is_admin = FALSE");
    
    for (let u of allUsers.rows) {
      await pool.query(
        "INSERT INTO messages_priveis (annonce_id, expediteur_id, destinataire_id, contenu, provenance_contexte) VALUES (NULL, $1, $2, $3, 'broadcast')",
        [adminId, u.id, contenu]
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/admin/send-to-nup", async (req, res) => {
  try {
    const { annonce_id, contenu, provenance_contexte } = req.body;
    const adminRes = await pool.query("SELECT id FROM users WHERE is_admin = TRUE LIMIT 1");
    const adminId = adminRes.rows[0].id;

    const ownerRes = await pool.query("SELECT user_id FROM annonces WHERE id = $1", [annonce_id]);
    if (ownerRes.rows.length === 0) return res.status(404).json({ error: "Annonce introuvable." });
    const destinataire_id = ownerRes.rows[0].user_id;

    await pool.query(
      "INSERT INTO messages_priveis (annonce_id, expediteur_id, destinataire_id, contenu, provenance_contexte) VALUES ($1, $2, $3, $4, $5)",
      [annonce_id, adminId, destinataire_id, contenu, provenance_contexte || 'normal']
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/chat/reply-justification/:msg_id", async (req, res) => {
  try {
    const { reponse } = req.body;
    await pool.query("UPDATE messages_priveis SET reponse_utilisateur = $1 WHERE id = $2", [reponse, req.params.msg_id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/chat/conversations/:user_id", async (req, res) => {
  try {
    const uid = req.params.user_id;
    const query = `
      SELECT m.*, a.titre as annonce_titre, u1.nup as expediteur_nup, u2.nup as destinataire_nup
      FROM messages_priveis m
      LEFT JOIN annonces a ON m.annonce_id = a.id
      JOIN users u1 ON m.expediteur_id = u1.id
      JOIN users u2 ON m.destinataire_id = u2.id
      WHERE m.expediteur_id = $1 OR m.destinataire_id = $1
      ORDER BY m.created_at DESC;
    `;
    const result = await pool.query(query, [uid]);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/admin/all-justifications/:context", async (req, res) => {
  try {
    const query = `
      SELECT m.*, a.titre as annonce_titre, u.nup as user_nup
      FROM messages_priveis m
      LEFT JOIN annonces a ON m.annonce_id = a.id
      JOIN users u ON m.expediteur_id = u.id
      WHERE m.provenance_contexte = $1 AND m.reponse_utilisateur IS NOT NULL
      ORDER BY m.created_at DESC;
    `;
    const result = await pool.query(query, [req.params.context]);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur opérationnel v2 sur le port ${PORT}`));
