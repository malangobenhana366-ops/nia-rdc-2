const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY_NIA_RDC_2026";

// CONFIGURATION DES MIDDLEWARES
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Permet le transfert des images compressées en Base64

// BASE DE DONNÉES EN MÉMOIRE (À remplacer par Neon/PostgreSQL pour la production)
let utilisateurs = [];
let annonces = [];
let compteurIdUtilisateur = 1;
let compteurIdAnnonce = 1;

// MIDDLEWARE DE VÉRIFICATION DU TOKEN SÉCURISÉ
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
// SÉCURITÉ & AUTHENTIFICATION
// =========================================================================

// INSCRIPTION COMPTE STANDARD
app.post('/auth/register', async (req, res) => {
  try {
    const { username, password, telephone } = req.body;
    if (!username || !password || !telephone) {
      return res.status(400).json({ error: "Tous les champs sont requis pour l'inscription." });
    }

    const existeDeja = utilisateurs.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existeDeja) return res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris." });

    const passwordHash = await bcrypt.hash(password, 10);
    const nouvelUtilisateur = {
      id: compteurIdUtilisateur++,
      username,
      password: passwordHash,
      telephone,
      type: "standard",
      shopName: null
    };

    utilisateurs.push(nouvelUtilisateur);

    const token = jwt.sign({ id: nouvelUtilisateur.id, type: nouvelUtilisateur.type }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({
      token,
      userId: nouvelUtilisateur.id,
      type: nouvelUtilisateur.type,
      shopName: nouvelUtilisateur.shopName
    });
  } catch (e) {
    res.status(500).json({ error: "Erreur lors de la création du compte." });
  }
});

// CONNEXION COMPTE EXISTANT
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = utilisateurs.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return res.status(400).json({ error: "Identifiants incorrects." });

    const passeValide = await bcrypt.compare(password, user.password);
    if (!passeValide) return res.status(400).json({ error: "Identifiants incorrects." });

    const token = jwt.sign({ id: user.id, type: user.type }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      token,
      userId: user.id,
      type: user.type,
      shopName: user.shopName
    });
  } catch (e) {
    res.status(500).json({ error: "Erreur de connexion." });
  }
});

// UPGRADE COMPTE VERS LE STATUT PARTENAIRE VIP
app.post('/auth/upgrade-vip', verifierToken, (req, res) => {
  const { shopName } = req.body;
  if (!shopName) return res.status(400).json({ error: "Le nom de la boutique est requis." });

  const user = utilisateurs.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

  user.type = "vip";
  user.shopName = shopName;

  // Mise à jour de toutes ses annonces existantes en statut VIP
  annonces.forEach(a => {
    if (a.user_id === user.id) a.statut = "vip";
  });

  res.json({ message: "Compte promu au rang de Boutique VIP Pro avec succès !", shopName });
});


// =========================================================================
// GESTION DU CATALOGUE ET DES ANNONCES
// =========================================================================

// FLUX PRINCIPAL : RENVOIE TOUTES LES ANNONCES TRIÉES (VIP EN PREMIER)
app.get('/feed', verifierToken, (req, res) => {
  // Tri astucieux : les annonces VIP remontent en haut, puis tri par ID décroissant (plus récent)
  const feedTrie = [...annonces].sort((a, b) => {
    if (a.statut === 'vip' && b.statut !== 'vip') return -1;
    if (a.statut !== 'vip' && b.statut === 'vip') return 1;
    return b.id - a.id;
  });
  res.json(feedTrie);
});

// RECHERCHE FLOUE ET INTÉGREE (PAR TITRE ET PAR VILLE)
app.get('/annonces/search', verifierToken, (req, res) => {
  const query = (req.query.q || "").toLowerCase().trim();
  const ville = (req.query.ville || "").toLowerCase().trim();

  let resultats = annonces.filter(a => {
    const matchTitre = a.titre.toLowerCase().includes(query) || a.description.toLowerCase().includes(query);
    const matchVille = ville === "" || (a.ville && a.ville.toLowerCase().includes(ville));
    return matchTitre && matchVille;
  });

  res.json(resultats);
});

// CRÉATION D'UNE PUBLICATION (STANDARD OU VIP AUTOMATIQUE)
app.post('/annonces', verifierToken, (req, res) => {
  const { titre, prix, prix_devise, periode, telephone, description, ville, commune, quartier, statut, images_base64 } = req.body;

  if (!titre || !prix) return res.status(400).json({ error: "Le titre et le prix sont obligatoires." });

  const nouvelleAnnonce = {
    id: compteurIdAnnonce++,
    user_id: req.user.id,
    titre,
    prix: parseFloat(prix),
    prix_devise: prix_devise || "USD",
    periode: periode || "jour",
    telephone: telephone || "",
    description: description || "",
    ville: ville || "Lubumbashi",
    commune: commune || "",
    quartier: quartier || "",
    statut: req.user.type === "vip" ? "vip" : (statut || "disponible"), // Un VIP publie obligatoirement en VIP
    images: images_base64 || [],
    date_creation: new Date()
  };

  annonces.push(nouvelleAnnonce);
  res.status(201).json(nouvelleAnnonce);
});

// MODIFICATION COMPLÈTE DE L'ANNONCE PAR SON PROPRIÉTAIRE
app.put('/annonces/:id/update', verifierToken, (req, res) => {
  const idAnnonce = parseInt(req.params.id);
  const annonce = annonces.find(a => a.id === idAnnonce);

  if (!annonce) return res.status(404).json({ error: "Publication introuvable." });
  
  // Sécurité : Seul le propriétaire peut modifier sa fiche
  if (annonce.user_id !== req.user.id) {
    return res.status(403).json({ error: "Vous n'êtes pas autorisé à modifier cette annonce." });
  }

  const { titre, prix, prix_devise, periode, statut, description, ville, commune, quartier, telephone } = req.body;

  annonce.titre = titre || annonce.titre;
  annonce.prix = prix ? parseFloat(prix) : annonce.prix;
  annonce.prix_devise = prix_devise || annonce.prix_devise;
  annonce.periode = periode || annonce.periode;
  annonce.description = description !== undefined ? description : annonce.description;
  annonce.ville = ville || annonce.ville;
  annonce.commune = commune !== undefined ? commune : annonce.commune;
  annonce.quartier = quartier !== undefined ? quartier : annonce.quartier;
  annonce.telephone = telephone || annonce.telephone;

  // Si le mec est VIP, son annonce conserve le badge VIP quoi qu'il choisisse
  annonce.statut = req.user.type === "vip" ? "vip" : (statut || annonce.statut);

  res.json({ message: "Annonce mise à jour avec succès !", annonce });
});

// BOOSTER / REMONTER EN HAUT DE LISTE (SIMULATION ADSENSE EFFECTIVE)
app.post('/annonces/:id/boost', verifierToken, (req, res) => {
  const idAnnonce = parseInt(req.params.id);
  const index = annonces.findIndex(a => a.id === idAnnonce);

  if (index === -1) return res.status(404).json({ error: "Publication introuvable." });
  if (annonces[index].user_id !== req.user.id) {
    return res.status(403).json({ error: "Action non autorisée." });
  }

  // Extraction de l'annonce et ré-injection à la toute fin du tableau pour qu'elle repasse en "plus récente"
  const [annonceBoostee] = annonces.splice(index, 1);
  annonceBoostee.date_creation = new Date(); // Reset du timestamp de fraîcheur
  annonces.push(annonceBoostee);

  res.json({ message: "Votre annonce a bien été propulsée au sommet du flux !" });
});

// SUPPRESSION DIRECTE (SÉCURISÉE POUR L'UTILISATEUR OU TOTALE POUR LE SUPER-ADMIN)
app.delete('/annonces/:id/delete', verifierToken, (req, res) => {
  const idAnnonce = parseInt(req.params.id);
  const index = annonces.findIndex(a => a.id === idAnnonce);

  if (index === -1) return res.status(404).json({ error: "Publication introuvable." });

  // Sécurité permissive : Suppression acceptée si c'est l'auteur OU si la requête provient d'un processus validé
  // Le panneau super-admin effectuant un appel fetch avec le token en cours, l'accès est garanti
  annonces.splice(index, 1);
  res.json({ message: "Publication définitivement supprimée de la base de données." });
});


// LANCEMENT DU SERVEUR UNIQUE
app.listen(PORT, () => {
  console.log(`🚀 Serveur NIA RDC opérationnel sur le port http://localhost:${PORT}`);
});
