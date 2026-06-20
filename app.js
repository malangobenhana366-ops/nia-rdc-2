const API = "https://nia-rdc-2.onrender.com";

let toutesLesAnnonces = [];
let ONGLE_PROFIL_ACTIF = "standard";
let ACTION_POST_INTERSTITIELLE = null;
let BLOCS_VIP_COUNT = 0;

let adminTimer = null;
let tempsValide = false;
let yStart = 0;

const TEXTE_APROPOS = `À propos de NIA RDC

Bienvenue sur NIA RDC.

NIA RDC est une plateforme numérique conçue pour faciliter la mise en relation entre les personnes souhaitant louer, proposer ou rechercher des biens et des services en République Démocratique du Congo.

Notre objectif est de rendre les échanges plus simples, rapides et accessibles grâce à une plateforme facile à utiliser, adaptée aussi bien aux particuliers qu'aux professionnels.

Notre mission
Notre mission est de permettre à chacun de trouver ou de proposer des objets, équipements et services en toute simplicité, tout en favorisant les opportunités économiques locales.

Ce que propose NIA RDC
Les utilisateurs peuvent notamment :
- publier des annonces ;
- consulter les annonces disponibles ;
- contacter les annonceurs ;
- rechercher des biens et services selon leurs besoins.

Nos valeurs
NIA RDC s'appuie sur plusieurs principes : simplicité, accessibilité, respect des utilisateurs, innovation et amélioration continue.`;

const TEXTE_PRIVACY = `Politique de confidentialité de NIA RDC

Dernière mise à jour : Juin 2026.

La protection des informations personnelles de nos utilisateurs est importante. Cette politique explique quelles informations sont collectées, pourquoi elles sont utilisées et les droits des utilisateurs.

1. Informations collectées
Lors de l'utilisation de NIA RDC, certaines informations peuvent être collectées, notamment : le numéro de téléphone fourni lors de l'inscription, le mot de passe, les annonces publiées, les photos et informations techniques de la plateforme.

2. Utilisation des informations
Les informations collectées servent à gérer les comptes, afficher les annonces, améliorer les services et prévenir la fraude.

3. Partage des informations
NIA RDC ne vend pas les informations personnelles des utilisateurs.`;

// INITIALISATION DU FLUX
document.addEventListener("DOMContentLoaded", () => {
  loadFeed();
  lancerBanniereAdsenseRotative();
  setInterval(loadFeed, 20000); // Auto-refresh toutes les 20 secondes en arrière-plan
});

async function loadFeed() {
  try {
    const res = await fetch(`${API}/feed`);
    toutesLesAnnonces = await res.json();
    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn && resetBtn.style.display !== "block") {
      afficherFluxAnnonces(toutesLesAnnonces);
    }
    chargerAlertesAdministrativesGlobales();
    if(localStorage.getItem("nia_user_id")) chargerBoiteReceptionAdministrative();
  } catch (e) {
    document.getElementById("feed").innerHTML = "<p style='text-align:center; color:red;'>Serveur hors ligne.</p>";
  }
}

// RENDU COMPLET ET SÉCURISÉ DU FLUX
function afficherFluxAnnonces(liste) {
  const feed = document.getElementById("feed");
  if (!feed) return;
  feed.innerHTML = "";

  if(liste.length === 0) {
    feed.innerHTML = "<p style='text-align:center; color:gray;'>Aucune offre active.</p>";
    return;
  }

  const isAdmin = localStorage.getItem("nia_is_admin") === "true";

  liste.forEach(a => {
    let galleryHtml = "";
    if (a.images && a.images.length > 0) {
      galleryHtml = `<div class="gallery">`;
      a.images.forEach(url => { galleryHtml += `<img src="${url}" class="gallery-item">`; });
      galleryHtml += `</div>`;
    }

    let statutHtml = a.statut === "occupe" 
      ? `<span class="badge-status status-occupe">🔴 Occupé</span>` 
      : `<span class="badge-status status-disponible">🟢 Disponible</span>`;

    // Bouton de modération administrative
    let adminButtons = isAdmin ? `
      <div style="background:#fee2e2; padding:8px; border-radius:8px; margin-top:8px; display:flex; gap:6px; width:100%;">
        <button class="btn-delete" style="padding:4px 8px; font-size:0.75rem;" onclick="supprimerAnnonceDirect(${a.id})">Supprimer l'annonce (Admin)</button>
        <button class="btn-edit" style="padding:4px 8px; font-size:0.75rem;" onclick="ouvrirModificationAnnonce(${a.id}, '${a.titre.replace(/'/g, "\\'")}', ${a.prix}, '${a.devise}', '${a.periode}', '${a.description ? a.description.replace(/'/g, "\\'") : ""}', '${a.statut}')">Modifier (Admin)</button>
      </div>
    ` : "";

    feed.innerHTML += `
      <div class="${a.is_vip ? 'annonce-card vip-premium' : 'annonce-card'}">
        ${a.is_vip ? `<div class="vip-badge-tag">👑 VIP</div>` : ""}
        <h3>${a.titre}</h3>
        <div class="annonce-price">${a.prix} ${a.devise} / ${a.periode}</div>
        <div class="annonce-meta">📍 ${a.ville} - ${a.commune || ""}, ${a.quartier || ""}</div>
        
        <div class="annonce-description-trigger" onclick="toggleDescriptionDisplay(this)">Lire la description 📋</div>
        <div class="annonce-description">${a.description || "Aucun détail fourni."}</div>
        
        ${galleryHtml}
        <div class="annonce-footer">
          ${statutHtml}
          <div style="display:flex; gap:6px;">
            <button class="btn-report" onclick="signalerAnnonce(${a.id})">⚠️ Signaler</button>
            <button class="btn-contact" onclick="declencherPubliciteInterstitielle(() => { window.location.href='tel:${a.telephone}'; }, 'Mise en relation directe.');">📞 Appeler (${a.telephone})</button>
          </div>
        </div>
        ${adminButtons}
      </div>
    `;
  });
}

function toggleDescriptionDisplay(element) {
  const descBlock = element.nextElementSibling;
  if(descBlock.style.display === "block") {
    descBlock.style.display = "none";
    element.textContent = "Lire la description 📋";
  } else {
    descBlock.style.display = "block";
    element.textContent = "Masquer la description ✕";
  }
}

// RESTRICTION POUR PUBLICATION : VISITEURS AUTORISÉS À RECHERCHER ET VOIR UNIQUEMENT
function ouvrirModalAvecSecurite(id) {
  if(!localStorage.getItem("nia_user_id")) {
    alert("Accès Privé : Veuillez d'abord vous connecter ou créer un compte.");
    ouvrirModal("auth");
  } else {
    ouvrirModal(id);
  }
}

function ouvrirModal(id) {
  const m = document.getElementById(`modal-${id}`);
  if(m) {
    m.style.display = "flex";
    if (id === "vip") rafraichirEspaceVip();
    if (id === "profil") changerOngletProfil(ONGLE_PROFIL_ACTIF);
  }
}

function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = "none"; }

function ouvrirModalLegal(type) {
  const body = document.getElementById("legal-body-display");
  const title = document.getElementById("legal-title-display");
  if(type === 'apropos') { title.textContent = "À propos de NIA RDC"; body.textContent = TEXTE_APROPOS; }
  if(type === 'confidentialite') { title.textContent = "Politique de Confidentialité"; body.textContent = TEXTE_PRIVACY; }
  ouvrirModal("legal");
}

function val(id) { return document.getElementById(id)?.value?.trim() || ""; }

// INSCRIPTION & CONNEXION
async function executerInscription() {
  const telephone = val("auth-tel");
  const password = val("auth-pass");
  if (!telephone || !password) return alert("Complétez tous les champs.");
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telephone, password, acceptedTerms: true })
  });
  const data = await res.json();
  if(data.success) {
    localStorage.setItem("nia_user_id", data.user.id);
    localStorage.setItem("nia_standard_telephone", data.user.telephone);
    fermerModal("auth");
    loadFeed();
  } else { alert(data.error); }
}

async function executerConnexion() {
  const telephone = val("login-tel");
  const password = val("login-pass");
  if (!telephone || !password) return alert("Complétez les champs.");
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telephone, password })
  });
  const data = await res.json();
  if(data.success) {
    localStorage.setItem("nia_user_id", data.user.id);
    localStorage.setItem("nia_standard_telephone", data.user.telephone);
    localStorage.setItem("nia_is_admin", data.user.is_admin ? "true" : "false");
    fermerModal("auth");
    loadFeed();
  } else { alert(data.error); }
}

function basculerModeAuth(inscription) {
  document.getElementById("auth-form-register").style.display = inscription ? "grid" : "none";
  document.getElementById("auth-form-login").style.display = inscription ? "none" : "grid";
}

function deconnecterUtilisateur() {
  localStorage.clear();
  window.location.reload();
}

async function supprimerCompteUtilisateur() {
  if(confirm("Confirmez-vous la suppression définitive de votre compte ?")) {
    await fetch(`${API}/auth/delete-account`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: localStorage.getItem("nia_user_id") })
    });
    deconnecterUtilisateur();
  }
}

// INVITATION SYSTÈME SUR WHATSAPP
function inviterViaWhatsApp() {
  const lienApplication = "https://nia-rdc.example.com"; // Remplacez par le lien réel de votre site/app
  const texteMessage = encodeURIComponent(`Bonjour ! Rejoins-moi sur NIA RDC pour louer, proposer et rechercher facilement tes biens et services en République Démocratique du Congo. Clique ici : ${lienApplication}`);
  window.open(`https://api.whatsapp.com/send?text=${texteMessage}`, "_blank");
}

// SIGNALER UNE ANNONCE MALVEILLANTE
async function signalerAnnonce(id) {
  const raison = prompt("Pourquoi signalez-vous cette annonce ? (Contenu inapproprié, fraude, indisponibilité...) :");
  if(!raison) return;
  await fetch(`${API}/annonces/${id}/signaler`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: localStorage.getItem("nia_user_id"), raison })
  });
  alert("Merci pour votre signalement, l'administration va analyser l'offre.");
}

// GESTION ET MODIFICATION DE L'ANNONCE PAR L'UTILISATEUR
function changerOngletProfil(type) {
  ONGLE_PROFIL_ACTIF = type;
  document.getElementById("tab-standard-btn").style.background = type === "standard" ? "#cbd5e1" : "#f1f5f9";
  document.getElementById("tab-vip-btn").style.background = type === "vip" ? "#fde68a" : "#f1f5f9";

  const tel = localStorage.getItem("nia_standard_telephone");
  const content = document.getElementById("profil-view-content");
  if(!tel) { content.innerHTML = "<p>Aucune donnée.</p>"; return; }

  const mesAnnonces = toutesLesAnnonces.filter(a => a.telephone === tel && a.is_vip === (type === "vip"));
  let html = "";
  mesAnnonces.forEach(a => {
    html += `
      <div style="background:#f8fafc; padding:12px; border-radius:12px; margin-bottom:8px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
        <div>
          <b>${a.titre}</b>
          <div style="font-size:0.8rem; color:gray;">${a.prix} ${a.devise}</div>
        </div>
        <div style="display:flex; gap:4px;">
          <button class="btn-edit" style="padding:6px 10px;" onclick="ouvrirModificationAnnonce(${a.id}, '${a.titre.replace(/'/g, "\\'")}', ${a.prix}, '${a.devise}', '${a.periode}', '${a.description ? a.description.replace(/'/g, "\\'") : ""}', '${a.statut}')">✏️ Modifier</button>
          <button class="btn-delete" style="padding:6px;" onclick="supprimerAnnonceDirect(${a.id})">🗑️</button>
        </div>
      </div>`;
  });
  content.innerHTML = html || "<p style='color:gray;text-align:center;'>Aucune annonce dans cette catégorie.</p>";
}

function ouvrirModificationAnnonce(id, titre, prix, devise, periode, description, statut) {
  document.getElementById("edit-id").value = id;
  document.getElementById("edit-titre").value = titre;
  document.getElementById("edit-prix").value = prix;
  document.getElementById("edit-devise").value = devise;
  document.getElementById("edit-periode").value = periode;
  document.getElementById("edit-description").value = description;
  document.getElementById("edit-statut").value = statut;
  ouvrirModal("modifier-annonce");
}

async function sauvegarderModificationAnnonce() {
  const id = document.getElementById("edit-id").value;
  const res = await fetch(`${API}/annonces/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: localStorage.getItem("nia_user_id"),
      titre: val("edit-titre"), prix: val("edit-prix"), devise: val("edit-devise"),
      periode: val("edit-periode"), description: val("edit-description"), statut: val("edit-statut")
    })
  });
  if(res.ok) { fermerModal("modifier-annonce"); fermerModal("profil"); loadFeed(); }
}

async function supprimerAnnonceDirect(id) {
  if(confirm("Confirmez-vous la suppression ?")) {
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    loadFeed();
  }
}

// RECUPERER LES MESSAGES PERSONNELS ENVOYES PAR L'ADMINISTRATION
async function chargerBoiteReceptionAdministrative() {
  try {
    const res = await fetch(`${API}/notifications/user/${localStorage.getItem("nia_user_id")}`);
    const data = await res.json();
    const box = document.getElementById("admin-messages-box");
    if(data.length === 0) { box.innerHTML = "Aucun message reçu."; return; }
    box.innerHTML = "";
    data.forEach(m => {
      box.innerHTML += `<div class="msg-admin-item"><b>[${m.type}]</b> : ${m.message}</div>`;
    });
  } catch(e) {}
}

// RECHERCHE MULTI-CRITÈRES
function rechercher() {
  const qTitre = val("search-titre");
  const qVille = val("search-ville");
  const qCommune = val("search-commune");
  const qQuartier = val("search-quartier");

  let res = toutesLesAnnonces.filter(a => {
    let mT = qTitre === "" || a.titre.toLowerCase().includes(qTitre.toLowerCase()) || (a.description && a.description.toLowerCase().includes(qTitre.toLowerCase()));
    let mV = a.ville.toLowerCase().includes(qVille.toLowerCase());
    let mC = qCommune === "" || (a.commune && a.commune.toLowerCase().includes(qCommune.toLowerCase()));
    let mQ = qQuartier === "" || (a.quartier && a.quartier.toLowerCase().includes(qQuartier.toLowerCase()));
    return mT && mV && mC && mQ;
  });
  fermerModal("rechercher");
  document.getElementById("feed-title").textContent = `Résultats (${res.length})`;
  document.getElementById("reset-btn").style.display = "block";
  afficherFluxAnnonces(res);
}

function annulerRecherche() {
  document.getElementById("feed-title").textContent = "Annonces récentes";
  document.getElementById("reset-btn").style.display = "none";
  afficherFluxAnnonces(toutesLesAnnonces);
}

// CONSOLE ADMINISTRATIVE AVANCÉE : FILTRES PAR VILLE/VIP/STANDARD
function filtrerAdminParType(type) {
  let listeFiltree = toutesLesAnnonces;
  if(type === 'standard') listeFiltree = toutesLesAnnonces.filter(a => !a.is_vip);
  if(type === 'vip') listeFiltree = toutesLesAnnonces.filter(a => a.is_vip);
  afficherFluxAnnonces(listeFiltree);
  fermerModal("admin");
}

function ouvrirSelectionParVilleAdmin() {
  const ville = prompt("Saisissez le nom de la ville à auditer (Ex: Lubumbashi, Kinshasa) :");
  if(!ville) return;
  let res = toutesLesAnnonces.filter(a => a.ville.toLowerCase().includes(ville.toLowerCase()));
  afficherFluxAnnonces(res);
  fermerModal("admin");
}

async function envoyerMessageDepuisAdmin() {
  const text = val("admin-msg-texte");
  if(!text) return alert("Message vide.");
  const res = await fetch(`${API}/admin/send-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      admin_id: localStorage.getItem("nia_user_id"),
      cible: document.getElementById("admin-msg-cible").value,
      telephone_cible: val("admin-msg-tel-cible"),
      message: text, type: "AVERTISSEMENT_ADMIN"
    })
  });
  if(res.ok) { alert("Message diffusé."); fermerModal("admin"); loadFeed(); } else { alert("Erreur."); }
}

// SÉCURITÉ DE LA CONSOLE ADMIN (GESTES & APPUI LONG)
function startAdminTouch() { tempsValide = false; adminTimer = setTimeout(() => { tempsValide = true; }, 4000); }
function stopAdminTouch() { clearTimeout(adminTimer); }
window.addEventListener("touchstart", e => { yStart = e.touches[0].clientY; });
window.addEventListener("touchend", e => {
  if (tempsValide && (yStart - e.changedTouches[0].clientY > 60)) {
    tempsValide = false;
    if(prompt("Code Secret d'accès :") === "BEN4002ET4200") ouvrirModal("admin");
  }
});

function toggleLeftDropdown() {
  const d = document.getElementById("left-dropdown");
  d.style.display = d.style.display === "block" ? "none" : "block";
}

const PUBLICITES = [
  "⚡ Besoin de visibilité ? Passez votre boutique en mode VIP dès aujourd'hui !",
  "🏢 Entreprises : Augmentez votre chiffre d'affaires grâce à NIA RDC Premium.",
  "🚕 Louez et réservez des véhicules utilitaires de confiance partout en RDC."
];
let idx = 0;
function lancerBanniereAdsenseRotative() {
  setInterval(() => {
    idx = (idx + 1) % PUBLICITES.length;
    document.getElementById("adsense-rotative-banner").textContent = PUBLICITES[idx];
  }, 15000);
}

function declencherPubliciteInterstitielle(callback, message = "") {
  ACTION_POST_INTERSTITIELLE = callback;
  document.getElementById("interstitial-body").textContent = message || "Sponsor Officiel de l'économie numérique en RDC.";
  document.getElementById("interstitial-ad").style.display = "flex";
  setTimeout(fermerPubliciteInterstitielle, 3500); // Fermeture automatique après 3.5 sec
}
function fermerPubliciteInterstitielle() {
  document.getElementById("interstitial-ad").style.display = "none";
  if(ACTION_POST_INTERSTITIELLE) { ACTION_POST_INTERSTITIELLE(); ACTION_POST_INTERSTITIELLE = null; }
}

async function publierAnnonceStandard() {
  const res = await fetch(`${API}/annonces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: localStorage.getItem("nia_user_id"),
      titre: val("titre"), prix: val("prix"), devise: val("devise"),
      periode: val("periode"), telephone: val("telephone"), description: val("description"),
      ville: val("ville"), commune: val("commune"), quartier: val("quartier"), statut: val("statut"), is_vip: false
    })
  });
  if(res.ok) { fermerModal("publier"); loadFeed(); }
}
