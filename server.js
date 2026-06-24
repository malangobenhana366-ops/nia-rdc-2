import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

let users = [];
let annonces = [];
let messages = [];
let signalements = [];

// Générateur NUP simple
function genererNUP() {
  return "NUP-" + Math.floor(100000 + Math.random() * 900000);
}

// AUTHENTIFICATION
app.post("/auth/register", (req, res) => {
  const { telephone, password } = req.body;
  if (!telephone || !password) return res.status(400).json({ success: false, error: "Champs manquants." });
  
  const existe = users.find(u => u.telephone === telephone);
  if (existe) return res.status(400).json({ success: false, error: "Ce numéro possède déjà un compte." });

  const nouveauUser = {
    id: Date.now(),
    telephone,
    password,
    nup: genererNUP()
  };
  users.push(nouveauUser);
  res.json({ success: true, user: nouveauUser });
});

app.post("/auth/login", (req, res) => {
  const { telephone, password } = req.body;
  const user = users.find(u => u.telephone === telephone && u.password === password);
  if (!user) return res.status(400).json({ success: false, error: "Identifiants incorrects." });
  res.json({ success: true, user });
});

app.delete("/auth/delete-account", (req, res) => {
  const { user_id } = req.body;
  users = users.filter(u => u.id != user_id);
  annonces = annonces.filter(a => a.user_id != user_id);
  res.json({ success: true });
});

// ANNONCES
app.post("/annonces", (req, res) => {
  const { user_id, titre, prix, devise, periode, statut, telephone, description, ville, commune, is_vip, images_base64 } = req.body;
  const user = users.find(u => u.id == user_id);
  
  let structureImages = [];
  if (images_base64 && images_base64.length > 0) {
    structureImages = images_base64.map((img, index) => ({ id: Date.now() + index, url: img }));
  }

  const nouvelleAnnonce = {
    id: Date.now(),
    user_id,
    proprietaire_nup: user ? user.nup : "NUP-INCONNU",
    titre, prix, devise, periode, statut, telephone, description, ville, commune,
    is_vip: is_vip || false,
    images: structureImages,
    date: new Date()
  };

  annonces.unshift(nouvelleAnnonce);
  res.json({ success: true, annonce: nouvelleAnnonce });
});

app.get("/feed", (req, res) => {
  res.json(annonces);
});

app.put("/annonces/:id", (req, res) => {
  const { id } = req.params;
  const { titre, prix, devise, periode, statut, telephone, description, nouvelles_images_base64 } = req.body;
  
  const index = annonces.findIndex(a => a.id == id);
  if (index !== -1) {
    annonces[index].titre = titre;
    annonces[index].prix = prix;
    annonces[index].devise = devise;
    annonces[index].periode = periode;
    annonces[index].statut = statut;
    annonces[index].telephone = telephone;
    annonces[index].description = description;

    if (nouvelles_images_base64 && nouvelles_images_base64.length > 0) {
      nouvelles_images_base64.forEach((img, idx) => {
        annonces[index].images.push({ id: Date.now() + idx, url: img });
      });
    }
    res.json({ success: true, annonce: annonces[index] });
  } else {
    res.status(404).json({ error: "Annonce introuvable" });
  }
});

app.delete("/annonces/:id/delete", (req, res) => {
  annonces = annonces.filter(a => a.id != req.params.id);
  res.json({ success: true });
});

app.delete("/images/:photoId", (req, res) => {
  const { photoId } = req.params;
  annonces.forEach(a => {
    if (a.images) {
      a.images = a.images.filter(img => img.id != photoId);
    }
  });
  res.json({ success: true });
});

app.post("/annonces/:id/boost", (req, res) => {
  const { id } = req.params;
  const index = annonces.findIndex(a => a.id == id);
  if (index !== -1) {
    const item = annonces.splice(index, 1)[0];
    item.date = new Date();
    annonces.unshift(item);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Introuvable" });
  }
});

// MESSAGERIE DIRECTE & JUSTIFICATIONS
app.post("/chat/send", (req, res) => {
  const { annonce_id, expediteur_id, contenu } = req.body;
  const exp = users.find(u => u.id == expediteur_id);
  const ann = annonces.find(a => a.id == annonce_id);
  const dest = ann ? users.find(u => u.id == ann.user_id) : null;

  const msg = {
    id: Date.now(),
    annonce_id,
    annonce_titre: ann ? ann.titre : "Général",
    expediteur_id,
    expediteur_nup: exp ? exp.nup : "Visiteur",
    destinataire_id: dest ? dest.id : null,
    destinataire_nup: dest ? dest.nup : "Inconnu",
    contenu,
    provenance_contexte: "user_chat",
    reponse_utilisateur: null
  };
  messages.push(msg);
  res.json({ success: true });
});

app.get("/chat/conversations/:userId", (req, res) => {
  const uid = req.params.userId;
  const user = users.find(u => u.id == uid);
  if (!user) return res.json([]);
  
  const correspondances = messages.filter(m => m.destinataire_id == uid || m.expediteur_id == uid || m.destinataire_nup === "TOUS");
  res.json(correspondances);
});

app.post("/chat/reply-justification/:msgId", (req, res) => {
  const { msgId } = req.params;
  const { reponse } = req.body;
  const msg = messages.find(m => m.id == msgId);
  if (msg) {
    msg.reponse_utilisateur = reponse;
    signalements.push({
      id: Date.now(),
      contenu: msg.contenu,
      user_nup: msg.destinataire_nup,
      reponse_utilisateur: reponse
    });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Introuvable" });
  }
});

app.post("/annonces/:id/signaler", (req, res) => {
  const { id } = req.params;
  const { raison } = req.body;
  const ann = annonces.find(a => a.id == id);
  if(ann) {
    signalements.push({
      id: Date.now(),
      contenu: `Signalement Annonce [${ann.titre}] : ${raison}`,
      user_nup: ann.proprietaire_nup,
      reponse_utilisateur: "En attente de contrôle"
    });
  }
  res.json({ success: true });
});

// ZONE ADMINISTRATION SUPRÊME
app.get("/admin/all-messages", (req, res) => res.json(messages));
app.get("/admin/all-justifications/signale", (req, res) => res.json(signalements));

app.delete("/admin/messages/:msgId/delete", (req, res) => {
  messages = messages.filter(m => m.id != req.params.msgId);
  res.json({ success: true });
});

app.post("/admin/send-global", (req, res) => {
  const { contenu } = req.body;
  const msgGlobal = {
    id: Date.now(),
    annonce_id: null,
    annonce_titre: "ADMINISTRATION GLOBAL",
    expediteur_id: "ADMIN",
    expediteur_nup: "NUP-ADMIN",
    destinataire_id: "TOUS",
    destinataire_nup: "TOUS",
    contenu,
    provenance_contexte: "global_noreply",
    reponse_utilisateur: null
  };
  messages.push(msgGlobal);
  res.json({ success: true });
});

app.post("/admin/send-to-nup", (req, res) => {
  const { annonce_id, contenu, provenance_contexte } = req.body;
  const ann = annonces.find(a => a.id == annonce_id);
  const dest = ann ? users.find(u => u.id == ann.user_id) : null;

  const alerte = {
    id: Date.now(),
    annonce_id,
    annonce_titre: ann ? ann.titre : "Alerte Administration",
    expediteur_id: "ADMIN",
    expediteur_nup: "NUP-ADMIN",
    destinataire_id: dest ? dest.id : null,
    destinataire_nup: dest ? dest.nup : "Inconnu",
    contenu,
    provenance_contexte: provenance_contexte || "admin_alert",
    reponse_utilisateur: null
  };
  messages.push(alerte);
  res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur NIA RDC opérationnel sur le port ${PORT}`));
