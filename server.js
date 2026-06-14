require('dotenv').config(); // Utile pour le développement local, ignoré sur Render
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY_NIA_RDC_2026";

// 1. CONFIGURATION DE LA BASE DE DONNÉES POSTGRESQL (NEON)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requis pour les connexions sécurisées Neon
  }
});

// Test de connexion immédiat au démarrage
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erreur de connexion à PostgreSQL Neon :', err.stack);
  } else {
    console.log('✅ Connexion réussie à la base de données PostgreSQL Neon !');
  }
});

// 2. CONFIGURATION DE CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// MIDDLEWARES
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large limite pour recevoir les images en Base64 du mobile

// MIDDLEWARE DE VÉRIFICATION DU TOKEN JWT
function verifierToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Accès refusé. Token manquant." });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Session expirée ou token invalide." });
    req.user = decoded;
    next();
  });
}

// =========================================================================
// SÉCURITÉ & AUTHENTIFICATION (POSTGRESQL REQUÊTES)
// =========================================================================

// INSCRIPTION COMPTE STANDARD
app.post('/auth/register', async (req, res) => {
  try {
    const { username, password, telephone } = req.body;
    if (!username || !password || !telephone) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    // Vérifier si l'utilisateur existe déjà
    const userCheck = await pool.query('SELECT * FROM utilisateurs WHERE LOWER(username) = LOWER($1)', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insertion en BDD
    const query = `
      INSERT INTO utilisateurs (username, password, telephone, type, shop_name)
      VALUES ($1, $2, $3, 'standard', NULL)
      RETURNING id, username, type, shop_name
    `;
    const result = await pool.query(query, [username, passwordHash, telephone]);
    const nouvelUser = result.rows[0];

    const token = jwt.sign({ id: nouvelUser.id, type: nouvelUser.type }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({
      token,
      userId: nouvelUser.id,
      type: nouvelUser.type,
      shopName: nouvelUser.shop_name
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur lors de la création du compte." });
  }
});

// CONNEXION COMPTE EXISTANT
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM utilisateurs WHERE LOWER(username) = LOWER($1)', [username]);
    
    if (result.rows.length === 0) return res.status(400).json({ error: "Identifiants incorrects." });
    const user = result.rows[0];

    const passeValide = await bcrypt.compare(password, user.password);
    if (!passeValide) return res.status(400).json({ error: "Identifiants incorrects." });

    const token = jwt.sign({ id: user.id, type: user.type }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      token,
      userId: user.id,
      type: user.type,
      shopName: user.shop_name
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur de connexion." });
  }
});

// UPGRADE COMPTE VERS LE STATUT PARTENAIRE VIP
app.post('/auth/upgrade-vip', verifierToken, async (req, res) => {
  try {
    const { shopName } = req.body;
    if (!shopName) return res.status(400).json({ error: "Le nom de la boutique est requis." });

    // Passer le profil en VIP
    await pool.query('UPDATE utilisateurs SET type = \'vip\', shop_name = $1 WHERE id = $2', [shopName, req.user.id]);
    // Mettre à jour automatiquement le statut de ses annonces en 'vip'
    await pool.query('UPDATE annonces SET statut = \'vip\' WHERE user_id = $1', [req.user.id]);

    res.json({ message: "Compte promu au rang de Boutique VIP Pro !", shopName });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur lors du passage au statut VIP." });
  }
});


// =========================================================================
// GESTION DES ANNONCES (POSTGRESQL + STORAGE CLOUDINARY)
// =========================================================================

// FLUX PRINCIPAL : TRICHE EN METTANT LES BOUTIQUES VIP TOUJOURS AU SOMMET
app.get('/feed', verifierToken, async (req, res) => {
  try {
    // Tri : statut VIP d'abord, puis par date de mise à jour/création décroissante
    const query = `
      SELECT * FROM annonces 
      ORDER BY CASE WHEN statut = 'vip' THEN 0 ELSE 1 END ASC, date_creation DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur lors de la récupération du flux." });
  }
});

// RECHERCHE MULTI-CRITÈRES INTÉGRÉE
app.get('/annonces/search', verifierToken, async (req, res) => {
  try {
    const queryTerm = `%${(req.query.q || "").toLowerCase().trim()}%`;
    const villeTerm = `%${(req.query.ville || "").toLowerCase().trim()}%`;

    const sql = `
      SELECT * FROM annonces 
      WHERE (LOWER(titre) LIKE $1 OR LOWER(description) LIKE $1)
        AND LOWER(ville) LIKE $2
      ORDER BY CASE WHEN statut = 'vip' THEN 0 ELSE 1 END ASC, date_creation DESC
    `;
    const result = await pool.query(sql, [queryTerm, villeTerm]);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur lors de la recherche." });
  }
});

// CRÉATION D'UNE PUBLICATION AVEC STOCKAGE IMAGE CLOUDINARY EN SÉRIE
app.post('/annonces', verifierToken, async (req, res) => {
  try {
    const { titre, prix, prix_devise, periode, telephone, description, ville, commune, quartier, statut, images_base64 } = req.body;
    if (!titre || !prix) return res.status(400).json({ error: "Le titre et le prix sont obligatoires." });

    // Traitement des images vers Cloudinary
    let urlsImagesCloudinary = [];
    if (images_base64 && images_base64.length > 0) {
      for (const base64Str of images_base64) {
        try {
          const uploadRes = await cloudinary.uploader.upload(base64Str, {
            folder: "nia_rdc_annonces"
          });
          urlsImagesCloudinary.push(uploadRes.secure_url);
        } catch (imgErr) {
          console.error("Erreur d'envoi d'un fichier sur Cloudinary :", imgErr);
        }
      }
    }

    // Détermination du statut réel (Un compte VIP publie forcément des offres labellisées VIP)
    const statutReel = req.user.type === "vip" ? "vip" : (statut || "disponible");

    const query = `
      INSERT INTO annonces (user_id, titre, prix, prix_devise, periode, telephone, description, ville, commune, quartier, statut, images, date_creation)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *
    `;
    const values = [
      req.user.id, titre, parseFloat(prix), prix_devise || "USD", periode || "jour",
      telephone || "", description || "", ville || "Lubumbashi", commune || "",
      quartier || "", statutReel, JSON.stringify(urlsImagesCloudinary)
    ];

    const result = await pool.query(query, values);
    
    // Adaptation pour le front (on repasse l'objet images en tableau propre si nécessaire)
    const annonceCreee = result.rows[0];
    if (typeof annonceCreee.images === 'string') {
      annonceCreee.images = JSON.parse(annonceCreee.images);
    }

    res.status(201).json(annonceCreee);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible d'enregistrer la publication." });
  }
});

// MODIFICATION DE L'ANNONCE
app.put('/annonces/:id/update', verifierToken, async (req, res) => {
  try {
    const idAnnonce = parseInt(req.params.id);
    
    // Vérifier d'abord la propriété
    const check = await pool.query('SELECT * FROM annonces WHERE id = $1', [idAnnonce]);
    if (check.rows.length === 0) return res.status(404).json({ error: "Publication introuvable." });
    
    const annonceActuelle = check.rows[0];
    if (annonceActuelle.user_id !== req.user.id) {
      return res.status(403).json({ error: "Modification interdite sur ce profil." });
    }

    const { titre, prix, prix_devise, periode, statut, description, ville, commune, quartier, telephone } = req.body;
    const statutFinal = req.user.type === "vip" ? "vip" : (statut || annonceActuelle.statut);

    const query = `
      UPDATE annonces 
      SET titre = $1, prix = $2, prix_devise = $3, periode = $4, statut = $5, 
          description = $6, ville = $7, commune = $8, quartier = $9, telephone = $10
      WHERE id = $11
      RETURNING *
    `;
    const values = [
      titre || annonceActuelle.titre,
      prix ? parseFloat(prix) : annonceActuelle.prix,
      prix_devise || annonceActuelle.prix_devise,
      periode || annonceActuelle.periode,
      statutFinal,
      description !== undefined ? description : annonceActuelle.description,
      ville || annonceActuelle.ville,
      commune !== undefined ? commune : annonceActuelle.commune,
      quartier !== undefined ? quartier : annonceActuelle.quartier,
      telephone || annonceActuelle.telephone,
      idAnnonce
    ];

    const result = await pool.query(query, values);
    res.json({ message: "Annonce mise à jour !", annonce: result.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur lors de la mise à jour." });
  }
});

// BOOSTER (FORCER LE TIMESTAMPS DE REMONTÉE EN TÊTE DE LISTE)
app.post('/annonces/:id/boost', verifierToken, async (req, res) => {
  try {
    const idAnnonce = parseInt(req.params.id);
    const result = await pool.query('UPDATE annonces SET date_creation = NOW() WHERE id = $1 AND user_id = $2 RETURNING *', [idAnnonce, req.user.id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Impossible de propulser cette annonce." });
    res.json({ message: "Annonce propulsée au sommet du flux !" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur pendant le boost." });
  }
});

// SUPPRESSION (ACCÈS TOTAL POUR LE DESIGNATEUR DE L'ANNONCE OU ACTION ADMIN)
app.delete('/annonces/:id/delete', verifierToken, async (req, res) => {
  try {
    const idAnnonce = parseInt(req.params.id);
    // On retire l'annonce directement de la base (la console admin et l'auteur y ont accès)
    await pool.query('DELETE FROM annonces WHERE id = $1', [idAnnonce]);
    res.json({ message: "Publication retirée définitivement." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur NIA RDC connecté à Neon et Cloudinary sur le port ${PORT}`);
});
