// =========================================================================
// SERVEUR BACKEND COMPLET - NIA RDC (CORRIGÉ & COMPATIBLE ES MODULES)
// =========================================================================
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import pg from "pg";

const { Pool } = pg;
const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Configuration de la connexion à la base de données (PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:votre_mot_de_passe@localhost:5432/nia_rdc",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ================= ROUTE D'AUTHENTIFICATION =================

app.post("/auth/register", async (req, res) => {
  const { telephone, password } = req.body;
  try {
    const userExist = await pool.query("SELECT * FROM users WHERE telephone = $1", [telephone]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ success: false, error: "Ce numéro de téléphone est déjà utilisé." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users (telephone, password) VALUES ($1, $2) RETURNING id, telephone, nup",
      [telephone, hashedPassword]
    );
    res.json({ success: true, user: newUser.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: "Erreur serveur lors de l'inscription." });
  }
});

app.post("/auth/login", async (req, res) => {
  const { telephone, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE telephone = $1", [telephone]);
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: "Identifiants incorrects." });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ success: false, error: "Identifiants incorrects." });
    
    res.json({ success: true, user: { id: user.id, telephone: user.telephone, nup: user.nup } });
  } catch (err) {
    res.status(500).json({ success: false, error: "Erreur serveur lors de la connexion." });
  }
});

app.delete("/auth/delete-account", async (req, res) => {
  const { user_id } = req.body;
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: "Erreur lors de la suppression du compte." });
  }
});

// ================= GESTION DES ANNONCES =================

app.get("/feed", async (req, res) => {
  try {
    const queryText = `
      SELECT a.*, u.nup as proprietaire_nup,
             COALESCE(json_agg(json_build_object('id', i.id, 'url', i.url)) FILTER (WHERE i.id IS NOT NULL), '[]') as images
      FROM annonces a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN annonce_images i ON a.id = i.annonce_id
      GROUP BY a.id, u.nup
      ORDER BY a.is_boosted DESC, a.is_vip DESC, a.created_at DESC;
    `;
    const result = await pool.query(queryText);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération du flux." });
  }
});

app.post("/annonces", async (req, res) => {
  const { user_id, titre, prix, devise, periode, statut, telephone, description, ville, commune, is_vip, images_base64 } = req.body;
  try {
    const newAnnonce = await pool.query(
      `INSERT INTO annonces (user_id, titre, prix, devise, periode, statut, telephone, description, ville, commune, is_vip) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [user_id, titre, prix || 0, devise, periode, statut, telephone, description, ville, commune, is_vip || false]
    );
    
    const annonceId = newAnnonce.rows[0].id;
    if (images_base64 && images_base64.length > 0) {
      for (let base64 of images_base64) {
        await pool.query("INSERT INTO annonce_images (annonce_id, url) VALUES ($1, $2)", [annonceId, base64]);
      }
    }
    res.json({ success: true, annonce: newAnnonce.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la création de la publication." });
  }
});

app.put("/annonces/:id", async (req, res) => {
  const { id } = req.params;
  const { titre, prix, devise, periode, statut, telephone, description, nouvelles_images_base64 } = req.body;
  try {
    await pool.query(
      `UPDATE annonces SET titre=$1, prix=$2, devise=$3, periode=$4, statut=$5, telephone=$6, description=$7 
       WHERE id=$8`,
      [titre, prix, devise, periode, statut, telephone, description, id]
    );
    if (nouvelles_images_base64 && nouvelles_images_base64.length > 0) {
      for (let base64 of nouvelles_images_base64) {
        await pool.query("INSERT INTO annonce_images (annonce_id, url) VALUES ($1, $2)", [id, base64]);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la modification." });
  }
});

app.post("/annonces/:id/boost", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE annonces SET is_boosted = true, boosted_at = NOW() WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du traitement du boost." });
  }
});

app.delete("/images/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM annonce_images WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression de l'image." });
  }
});

// ================= MESSAGERIE PRIVÉE ET SIGNALEMENTS =================

app.post("/chat/send", async (req, res) => {
  const { annonce_id, expediteur_id, contenu } = req.body;
  try {
    const targetAnnonce = await pool.query("SELECT user_id FROM annonces WHERE id = $1", [annonce_id]);
    if(targetAnnonce.rows.length === 0) return res.status(404).json({ error: "Annonce introuvable." });
    
    const destinataire_id = targetAnnonce.rows[0].user_id;
    await pool.query(
      "INSERT INTO messages (annonce_id, expediteur_id, destinataire_id, contenu, provenance_contexte) VALUES ($1, $2, $3, $4, 'normal')",
      [annonce_id, expediteur_id, destinataire_id, contenu]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur d'envoi du message." });
  }
});

app.get("/chat/conversations/:uid", async (req, res) => {
  try {
    const queryText = `
      SELECT m.*, a.titre as annonce_titre, u1.nup as expediteur_nup, u2.nup as destinataire_nup, sj.reponse_utilisateur
      FROM messages m
      LEFT JOIN annonces a ON m.annonce_id = a.id
      LEFT JOIN users u1 ON m.expediteur_id = u1.id
      LEFT JOIN users u2 ON m.destinataire_id = u2.id
      LEFT JOIN signalements_justifications sj ON (sj.annonce_id = m.annonce_id AND sj.user_id_concerne = $1)
      WHERE m.destinataire_id = $1 OR m.expediteur_id = $1
      ORDER BY m.created_at DESC;
    `;
    const result = await pool.query(queryText, [req.params.uid]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur de chargement de la messagerie." });
  }
});

app.post("/chat/reply-justification/:msgId", async (req, res) => {
  const { msgId } = req.params;
  const { reponse } = req.body;
  try {
    const msgData = await pool.query("SELECT * FROM messages WHERE id = $1", [msgId]);
    if(msgData.rows.length > 0) {
      const { annonce_id, destinataire_id, contenu } = msgData.rows[0];
      const exist = await pool.query("SELECT * FROM signalements_justifications WHERE annonce_id = $1", [annonce_id]);
      if(exist.rows.length > 0) {
        await pool.query("UPDATE signalements_justifications SET reponse_utilisateur = $1 WHERE annonce_id = $2", [reponse, annonce_id]);
      } else {
        await pool.query(
          "INSERT INTO signalements_justifications (annonce_id, contexte_alerte, user_id_concerne, reponse_utilisateur) VALUES ($1, $2, $3, $4)",
          [annonce_id, contenu, destinataire_id, reponse]
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la transmission de la justification." });
  }
});

app.post("/annonces/:id/signaler", async (req, res) => {
  const { id } = req.params;
  const { raison } = req.body;
  try {
    const annonce = await pool.query("SELECT user_id FROM annonces WHERE id = $1", [id]);
    if(annonce.rows.length > 0) {
      await pool.query(
        "INSERT INTO signalements_justifications (annonce_id, contexte_alerte, user_id_concerne) VALUES ($1, $2, $3)",
        [id, raison, annonce.rows[0].user_id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du signalement." });
  }
});

-- ================= EXCLUSIVITÉS PANEL ADMIN =================

app.delete("/annonces/:id/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM annonces WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

app.get("/admin/all-messages", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, u1.nup as expediteur_nup, u2.nup as destinataire_nup 
      FROM messages m
      JOIN users u1 ON m.expediteur_id = u1.id
      JOIN users u2 ON m.destinataire_id = u2.id
      ORDER BY m.created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur de récupération." });
  }
});

app.delete("/admin/messages/:id/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM messages WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression message." });
  }
});

app.get("/admin/all-justifications/signale", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sj.*, u.nup as user_nup, a.titre as annonce_titre
      FROM signalements_justifications sj
      LEFT JOIN users u ON sj.user_id_concerne = u.id
      LEFT JOIN annonces a ON sj.annonce_id = a.id
      ORDER BY sj.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur de chargement." });
  }
});

app.delete("/admin/justifications/:id/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM signalements_justifications WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

app.post("/admin/send-global", async (req, res) => {
  const { contenu } = req.body;
  try {
    const adminUser = await pool.query("SELECT id FROM users WHERE nup = 'NUP-ADMIN' LIMIT 1");
    let adminId = adminUser.rows.length > 0 ? adminUser.rows[0].id : 1;
    
    const allUsers = await pool.query("SELECT id FROM users WHERE nup != 'NUP-ADMIN'");
    for(let user of allUsers.rows) {
      await pool.query(
        "INSERT INTO messages (annonce_id, expediteur_id, destinataire_id, contenu, provenance_contexte) VALUES ($1, $2, $3, $4, 'global_noreply')",
        [null, adminId, user.id, contenu]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur de diffusion globale." });
  }
});

app.post("/admin/send-to-nup", async (req, res) => {
  const { annonce_id, contenu, provenance_contexte } = req.body;
  try {
    const target = await pool.query("SELECT user_id FROM annonces WHERE id = $1", [annonce_id]);
    if(target.rows.length === 0) return res.status(404).json({ error: "Annonce introuvable." });
    
    let adminId = 1; 
    const destId = target.rows[0].user_id;
    
    const newMsg = await pool.query(
      "INSERT INTO messages (annonce_id, expediteur_id, destinataire_id, contenu, provenance_contexte) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [annonce_id, adminId, destId, contenu, provenance_contexte || 'alerte_admin']
    );
    
    await pool.query(
      "INSERT INTO signalements_justifications (annonce_id, contexte_alerte, user_id_concerne) VALUES ($1, $2, $3)",
      [annonce_id, contenu, destId]
    );

    res.json({ success: true, messageId: newMsg.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: "Erreur d'acheminement." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 NIA RDC Backend actif sur le port ${PORT}`));
