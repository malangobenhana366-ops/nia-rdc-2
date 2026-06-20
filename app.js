const API = "https://nia-rdc-2.onrender.com";

let toutesLesAnnonces = [];
let adminAnnoncesCache = [];
let ONGLE_PROFIL_ACTIF = "standard";
let ACTION_POST_INTERSTITIELLE = null;
let BLOCS_VIP_COUNT = 0;

let adminTimer = null;
let tempsValide = false;
let yStart = 0;

/* --- CONTENUS JURIDIQUES NIA RDC (JUIN 2026) --- */
const CHARTE_CONDITIONS = `Conditions de sécurité et d'utilisation de NIA RDC

Bienvenue sur NIA RDC.
En utilisant la plateforme, vous acceptez pleinement les règles suivantes :
1. Utilisation loyale des services de mise en relation en République Démocratique du Congo.
2. Responsabilité pleine de l'annonceur sur l'exactitude de ses descriptions.
3. Interdiction absolue de publier des contenus trompeurs ou frauduleux. NIA RDC supprimera immédiatement les comptes en infraction.`;

const CHARTE_APROPOS = `À propos de NIA RDC

Bienvenue sur NIA RDC.

NIA RDC est une plateforme numérique conçue pour faciliter la mise en relation entre les personnes souhaitant louer, proposer ou rechercher des biens et des services en République Démocratique du Congo.

Notre objectif est de rendre les échanges plus simples, rapides et accessibles grâce à une plateforme facile à utiliser, adaptée aussi bien aux particuliers qu'aux professionnels.

Notre mission
Permettre à chacun de trouver ou de proposer des objets, équipements et services en toute simplicité, tout en favorisant les opportunités économiques locales.`;

const CHARTE_PRIVACY = `Politique de confidentialité de NIA RDC
Dernière mise à jour : Juin 2026.

La protection des informations personnelles de nos utilisateurs est importante. 

1. Informations collectées :
- le numéro de téléphone fourni lors de l'inscription ;
- le mot de passe du compte protégé ;
- les annonces publiées et les photos associées.

2. Partage des informations :
NIA RDC ne vend pas les informations personnelles des utilisateurs. Certaines données comme votre téléphone sont visibles publiquement sur vos annonces pour permettre le contact direct.`;

function initialiserMiseAJourAutomatique() {
  setInterval(async () => {
    try {
      const res = await fetch(`${API}/feed`);
      if (res.ok) {
        const nouvellesAnnonces = await res.json();
        if (JSON.stringify(nouvellesAnnonces) !== JSON.stringify(toutesLesAnnonces)) {
          toutesLesAnnonces = nouvellesAnnonces;
          const resetBtn = document.getElementById("reset-btn");
          if (resetBtn && resetBtn.style.display !== "block") {
            filtrerEtAfficherFlux(toutesLesAnnonces, false);
          }
        }
      }
    } catch (e) {
      console.log("Auto-refresh déconnecté.");
    }
  }, 15000);
}

// PROTECTION DES ROUTES PRIVEES
function exigerConnexionPourAction(callbackAction) {
  const userId = localStorage.getItem("nia_user_id");
  if (!userId) {
    basculerModeAuth(VersInscription = false);
    document.getElementById("modal-auth").style.display = "flex";
  } else {
    callbackAction();
  }
}

function verifierMenuOptionsVisibles() {
  const userId = localStorage.getItem("nia_user_id");
  document.getElementById("logout-btn-menu").style.display = userId ? "block" : "none";
  document.getElementById("delete-btn-menu").style.display = userId ? "block" : "none";
}

function deconnecterUtilisateur() {
  localStorage.clear();
  alert("Déconnexion réussie.");
  window.location.reload();
}

async function supprimerCompteUtilisateur() {
  const userId = localStorage.getItem("nia_user_id");
  if(!userId) return;
  if (confirm("⚠️ Voulez-vous vraiment supprimer définitivement votre compte ainsi que TOUTES vos annonces associées ?")) {
    try {
      const res = await fetch(`${API}/auth/delete-account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      if(res.ok) {
        localStorage.clear();
        window.location.reload();
      }
    } catch(e) { alert("Erreur réseau."); }
  }
}

function basculerModeAuth(versInscription) {
  if (versInscription) {
    document.getElementById("auth-title").textContent = "Créer un compte NIA RDC";
    document.getElementById("auth-form-register").style.display = "grid";
    document.getElementById("auth-form-login").style.display = "none";
  } else {
    document.getElementById("auth-title").textContent = "Connexion à votre espace";
    document.getElementById("auth-form-register").style.display = "none";
    document.getElementById("auth-form-login").style.display = "grid";
  }
}

async function executerInscription() {
  if (!document.getElementById("auth-accept-rules")?.checked) {
    return alert("Veuillez accepter les conditions de sécurité pour continuer.");
  }
  const telephone = val("auth-tel");
  const password = val("auth-pass");
  if (!telephone || !password) return alert("Veuillez remplir les champs.");

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telephone, password, acceptedTerms: true })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem("nia_user_id", data.user.id);
      localStorage.setItem("nia_standard_telephone", data.user.telephone);
      fermerModal('auth');
      verifierMenuOptionsVisibles();
      loadFeed();
    } else { alert(data.error); }
  } catch (e) { alert("Erreur réseau."); }
}

async function executerConnexion() {
  const telephone = val("login-tel");
  const password = val("login-pass");
  if (!telephone || !password) return alert("Champs vides.");

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telephone, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem("nia_user_id", data.user.id);
      localStorage.setItem("nia_standard_telephone", data.user.telephone);
      if (data.user.is_admin) localStorage.setItem("nia_is_admin", "true");
      fermerModal('auth');
      verifierMenuOptionsVisibles();
      loadFeed();
    } else { alert(data.error); }
  } catch (e) { alert("Erreur serveur."); }
}

function toggleLeftDropdown() {
  const dropdown = document.getElementById("left-dropdown");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function ouvrirModalLegal(charteType) {
  const modal = document.getElementById("modal-legal");
  const title = document.getElementById("legal-title-display");
  const body = document.getElementById("legal-body-display");
  const closeBtn = document.getElementById("legal-close-btn");
  const actionBtn = document.getElementById("legal-action-btn");

  closeBtn.style.display = "block";
  actionBtn.style.display = "none";

  if (charteType === 'conditions') {
    title.textContent = "Conditions d'utilisation de NIA RDC";
    body.textContent = CHARTE_CONDITIONS;
  } else if (charteType === 'apropos') {
    title.textContent = "À propos de NIA RDC";
    body.textContent = CHARTE_APROPOS;
  } else if (charteType === 'confidentialite') {
    title.textContent = "Politique de confidentialité";
    body.textContent = CHARTE_PRIVACY;
  } else if (charteType === 'conditions-forced') {
    title.textContent = "Conditions Obligatoires de Sécurité";
    body.textContent = CHARTE_CONDITIONS;
    closeBtn.style.display = "none";
    actionBtn.style.display = "block";
    actionBtn.onclick = () => {
      if(document.getElementById("auth-accept-rules")) document.getElementById("auth-accept-rules").checked = true;
      fermerModal('legal');
    };
  }
  modal.style.display = "flex";
}

// PARRAINAGE / INVITATION WHATSAPP
function partagerApplicationWhatsApp() {
  const lienApp = "https://nia-rdc.vercel.app"; 
  const texteMessage = encodeURIComponent(`Bonjour ! Je t'invite à me rejoindre sur NIA RDC pour louer, proposer ou rechercher rapidement des appartements, véhicules et services en RDC. Clique ici : ${lienApp}`);
  window.open(`https://api.whatsapp.com/send?text=${texteMessage}`, '_blank');
}

// DESCRIPTIONS CLICK UNIQUE MODALE
function afficherFenetreDescriptionComplete(titre, texte) {
  document.getElementById("desc-modal-title").textContent = titre;
  document.getElementById("desc-modal-body").textContent = texte;
  document.getElementById("modal-description").style.display = "flex";
}

// BANNÈRE ADSENSE ROTATIVE SPONSORISÉE
const TEXTES_PUB = [
  "⚡ Louez vos appartements et entrepôts chez NIA RDC au meilleur prix !",
  "🏢 VIP : Multipliez vos clients en créant votre vitrine de location !",
  "🚀 Propulsez vos affaires en devenant membre vérifié NIA Premium !",
  "📞 Besoin d'équipements ? Utilisez notre recherche intelligente !"
];
let indexPub = 0;
function lancerBanniereAdsenseRotative() {
  const banner = document.getElementById("adsense-rotative-banner");
  if(banner) banner.textContent = TEXTES_PUB[indexPub];
  setInterval(() => {
    indexPub = (indexPub + 1) % TEXTES_PUB.length;
    if(banner) banner.textContent = TEXTES_PUB[indexPub];
  }, 10000);
}

function declencherPubliciteInterstitielle(actionSuivante, messageSpecifique = "") {
  ACTION_POST_INTERSTITIELLE = actionSuivante;
  document.getElementById("interstitial-body").textContent = messageSpecifique || "Mise en relation immédiate sécurisée.";
  document.getElementById("interstitial-ad").style.display = "flex";
}
function fermerPubliciteInterstitielle() {
  document.getElementById("interstitial-ad").style.display = "none";
  if (ACTION_POST_INTERSTITIELLE) { ACTION_POST_INTERSTITIELLE(); ACTION_POST_INTERSTITIELLE = null; }
}

function val(id) { return document.getElementById(id)?.value?.trim() || ""; }

function optimiserEtCompresserImage(file, maxWidth = 800, maxHeight = 800, quality = 0.65) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width; let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        } else {
          if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
    };
  });
}

// DETECTEUR GESTE SECRET ADMIN
function startAdminTouch() { tempsValide = false; adminTimer = setTimeout(() => { tempsValide = true; }, 10000); }
function stopAdminTouch() { clearTimeout(adminTimer); }
window.addEventListener("touchstart", e => { yStart = e.touches[0].clientY; });
window.addEventListener("touchend", e => {
  let yEnd = e.changedTouches[0].clientY;
  if (tempsValide && (yStart - yEnd > 80)) {
    tempsValide = false;
    const code = prompt("Code secret Superviseur Admin :");
    if (code === "BEN4002ET4200") ouvrirModal("admin");
  }
});

// RECHERCHE ALGORITHMIQUE
function rechercher() {
  const qTitre = val("search-titre");
  const qVille = val("search-ville");
  const qCommune = val("search-commune");
  const qQuartier = val("search-quartier");

  let resultats = toutesLesAnnonces.filter(a => {
    let matchTitre = qTitre === "" || a.titre.toLowerCase().includes(qTitre.toLowerCase()) || (a.description && a.description.toLowerCase().includes(qTitre.toLowerCase()));
    let matchVille = a.ville.toLowerCase().includes(qVille.toLowerCase());
    let matchCommune = qCommune === "" || a.commune?.toLowerCase().includes(qCommune.toLowerCase());
    let matchQuartier = qQuartier === "" || a.quartier?.toLowerCase().includes(qQuartier.toLowerCase());
    return matchTitre && matchVille && matchCommune && matchQuartier;
  });

  fermerModal("rechercher");
  document.getElementById("feed-title").textContent = `Filtre (${resultats.length})`;
  filtrerEtAfficherFlux(resultats, true);
}

function annulerRecherche() {
  document.getElementById("feed-title").textContent = "Annonces récentes";
  filtrerEtAfficherFlux(toutesLesAnnonces, false);
}

// DISPATCH SIGNALEMENT
function ouvrirBoiteSignalement(annonceId) {
  const uid = localStorage.getItem("nia_user_id");
  if(!uid) return alert("Vous devez vous connecter pour signaler une annonce.");
  document.getElementById("report-annonce-id").value = annonceId;
  document.getElementById("modal-report").style.display = "flex";
}

async function soumettreSignalement() {
  const aid = document.getElementById("report-annonce-id").value;
  const raison = document.getElementById("report-reason").value;
  const uid = localStorage.getItem("nia_user_id");

  const res = await fetch(`${API}/annonces/${aid}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: uid, raison })
  });
  if(res.ok) {
    alert("Merci, le signalement a été transmis à l'administration.");
    fermerModal("report");
  }
}

async function loadFeed() {
  try {
    const res = await fetch(`${API}/feed`);
    toutesLesAnnonces = await res.json();
    filtrerEtAfficherFlux(toutesLesAnnonces);
    chargerAlertesAdministratives();
  } catch (e) {
    document.getElementById("feed").innerHTML = "Erreur de chargement du flux.";
  }
}

function filtrerEtAfficherFlux(listeAnnonces, modeRechercheActive = false) {
  const feed = document.getElementById("feed");
  if (!feed) return;
  feed.innerHTML = "";
  document.getElementById("reset-btn").style.display = modeRechercheActive ? "block" : "none";

  if(listeAnnonces.length === 0) {
    feed.innerHTML = "<p style='text-align:center; color:gray; font-size:0.9rem; padding:20px;'>Aucune offre trouvée pour cette recherche.</p>";
    return;
  }

  listeAnnonces.forEach(a => {
    let galleryHtml = "";
    if (a.images && a.images.length > 0) {
      galleryHtml = `<div class="gallery">`;
      a.images.forEach(url => { galleryHtml += `<img src="${url}" class="gallery-item">`; });
      galleryHtml += `</div>`;
    }
    let statutHtml = a.statut === "occupe" 
      ? `<span class="badge-status status-occupe">🔴 Occupé</span>` 
      : `<span class="badge-status status-disponible">🟢 Disponible</span>`;

    // Échappement des descriptions pour injection modale sécurisée
    const descSecurisee = (a.description || "Aucune description.").replace(/['"`]/g, " ");

    feed.innerHTML += `
      <div class="${a.is_vip ? 'annonce-card vip-premium' : 'annonce-card'}">
        ${a.is_vip ? `<div class="vip-badge-tag">👑 VIP</div>` : ""}
        <h3 style="margin:0 0 5px 0; font-size:1.1rem;">${a.titre}</h3>
        <div class="annonce-price">${a.prix} ${a.devise} / ${a.periode}</div>
        <div class="annonce-meta">📍 ${a.ville} - ${a.commune || ""}, ${a.quartier || ""}</div>
        <div class="annonce-desc-trigger" onclick="afficherFenetreDescriptionComplete('${a.titre.replace(/['"`]/g, " ")}', '${descSecurisee}')">
          ${a.description || "Cliquez pour lire la description..."}
        </div>
        ${galleryHtml}
        <div class="annonce-footer">
          ${statutHtml}
          <div style="display:flex; gap:6px;">
            <button class="btn-report" onclick="ouvrirBoiteSignalement(${a.id})">⚠️ Signaler</button>
            <button class="btn-contact" onclick="declencherPubliciteInterstitielle(() => { window.location.href='tel:${a.telephone}'; }, 'Contact direct.');">📞 Appeler</button>
          </div>
        </div>
      </div>
    `;
  });
}

async function publierAnnonceStandard() {
  const files = document.getElementById("image")?.files;
  if (!val("titre") || !val("telephone")) return alert("Veuillez remplir le titre et le téléphone.");

  let images_base64 = [];
  if(files) { for(let f of files) { images_base64.push(await optimiserEtCompresserImage(f)); } }
  localStorage.setItem("nia_standard_telephone", val("telephone"));

  const res = await fetch(`${API}/annonces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: localStorage.getItem("nia_user_id"),
      titre: val("titre"), prix: val("prix"), devise: val("devise"),
      periode: val("periode"), telephone: val("telephone"), description: val("description"),
      ville: val("ville"), commune: val("commune"), quartier: val("quartier"),
      statut: val("statut"), is_vip: false, images_base64
    })
  });
  if(res.ok) { fermerModal("publier"); loadFeed(); }
}

function rafraichirEspaceVip() {
  const body = document.getElementById("vip-form-body");
  const nomBoutique = localStorage.getItem("nia_vip_nom");

  if (!nomBoutique) {
    body.innerHTML = `
      <div class="form-group full-width"><label>Nom de votre vitrine commerciale VIP</label><input id="reg-vip-nom" placeholder="Ex: Agence Express Immo"></div>
      <div class="form-group full-width"><label>Téléphone par défaut</label><input id="reg-vip-tel" type="tel" placeholder="Ex: 0820000000"></div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="creerBoutiqueVIP()">Générer ma vitrine Premium 👑</button>
    `;
  } else {
    body.innerHTML = `
      <div style="background:var(--vip-bg); padding:10px; border-radius:8px; margin-bottom:12px; font-weight:bold; color:var(--vip-gold); text-align:center; font-size:0.85rem;">
        👑 CATALOGUE EN LIGNE : ${nomBoutique}
      </div>
      <div id="conteneur-blocs-annonces-vip"></div>
      <button class="btn-add-block" style="width:100%; padding:10px; margin-bottom:10px; border-radius:8px; cursor:pointer;" onclick="ajouterNouveauBlocFormulaireVip()">➕ Ajouter une autre annonce distincte</button>
      <button id="btn-submit-multi-vip" class="modal-submit-btn" style="background:var(--vip-gold);" onclick="soumettreToutesLesAnnoncesVip()">🚀 Diffuser tout le catalogue</button>
    `;
    BLOCS_VIP_COUNT = 0;
    ajouterNouveauBlocFormulaireVip();
  }
}

function creerBoutiqueVIP() {
  if(!val("reg-vip-nom") || !val("reg-vip-tel")) return alert("Veuillez remplir les cases.");
  localStorage.setItem("nia_vip_nom", val("reg-vip-nom"));
  localStorage.setItem("nia_vip_telephone", val("reg-vip-tel"));
  rafraichirEspaceVip();
}

function ajouterNouveauBlocFormulaireVip() {
  BLOCS_VIP_COUNT++;
  const conteneur = document.getElementById("conteneur-blocs-annonces-vip");
  const idUnique = BLOCS_VIP_COUNT;

  const blocHtml = document.createElement("div");
  blocHtml.className = "vip-block-annonce";
  blocHtml.id = `vip-block-${idUnique}`;
  blocHtml.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.8rem; font-weight:bold;">
      <span>📦 Bien VIP N°${idUnique}</span>
      ${idUnique > 1 ? `<button style="background:none; border:none; color:var(--danger); cursor:pointer;" onclick="document.getElementById('vip-block-${idUnique}').remove()">Supprimer ✕</button>` : ""}
    </div>
    <div class="form-grid">
      <div class="form-group full-width"><label>Nom du bien</label><input class="vip-in-titre" placeholder="Ex: Villa duplex"></div>
      <div class="form-group"><label>Prix</label>
        <div style="display:flex; gap:4px;">
          <input class="vip-in-prix" type="number" placeholder="500" style="flex:2;">
          <select class="vip-in-devise" style="flex:1;"><option value="$">$</option><option value="FC">FC</option></select>
        </div>
      </div>
      <div class="form-group"><label>Période</label><select class="vip-in-periode"><option value="mois">par mois</option><option value="jour">par jour</option></select></div>
      <div class="form-group"><label>Statut</label><select class="vip-in-statut"><option value="disponible">🟢 Disponible</option><option value="occupe">🔴 Occupé</option></select></div>
      <div class="form-group"><label>Téléphone</label><input class="vip-in-tel" value="${localStorage.getItem("nia_vip_telephone")}"></div>
      <div class="form-group full-width"><label>Description</label><textarea class="vip-in-desc" placeholder="Détails du bien..."></textarea></div>
      <div class="form-group"><label>Commune</label><input class="vip-in-commune" placeholder="Ex: Lubumbashi"></div>
      <div class="form-group"><label>Quartier</label><input class="vip-in-quartier" placeholder="Ex: Golf"></div>
      <div class="form-group full-width"><label>Photos</label><input type="file" class="vip-in-photos" multiple accept="image/*"></div>
    </div>
  `;
  conteneur.appendChild(blocHtml);
}

async function soumettreToutesLesAnnoncesVip() {
  const blocs = document.querySelectorAll(".vip-block-annonce");
  for (let b of blocs) {
    const titre = b.querySelector(".vip-in-titre").value;
    const telephone = b.querySelector(".vip-in-tel").value;
    if (!titre || !telephone) continue;

    await fetch(`${API}/annonces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: localStorage.getItem("nia_user_id"),
        titre, prix: b.querySelector(".vip-in-prix").value, devise: b.querySelector(".vip-in-devise").value,
        periode: b.querySelector(".vip-in-periode").value, telephone, description: b.querySelector(".vip-in-desc").value,
        ville: "Lubumbashi", commune: b.querySelector(".vip-in-commune").value, quartier: b.querySelector(".vip-in-quartier").value,
        statut: b.querySelector(".vip-in-statut").value, is_vip: true, images_base64: []
      })
    });
  }
  alert("Catalogue VIP publié avec succès !");
  fermerModal("vip");
  loadFeed();
}

// MESSAGES DE L'ADMINISTRATION & GESTION PROFIL UTILISATEUR
async function chargerMessagesBoiteProfil() {
  const uid = localStorage.getItem("nia_user_id");
  if(!uid) return;
  try {
    const res = await fetch(`${API}/users/${uid}/messages`);
    const msgs = await res.json();
    const conteneur = document.getElementById("admin-messages-box-container");
    if(msgs.length > 0) {
      conteneur.innerHTML = "";
      msgs.forEach(m => {
        conteneur.innerHTML += `<div class="message-box-admin"><b>📩 Service Modération NIA :</b> ${m.message}</div>`;
      });
    }
  } catch(e) {}
}

function changerOngletProfil(type) {
  ONGLE_PROFIL_ACTIF = type;
  document.getElementById("tab-standard-btn").style.background = type === "standard" ? "#cbd5e1" : "#f1f5f9";
  document.getElementById("tab-vip-btn").style.background = type === "vip" ? "#fde68a" : "#f1f5f9";

  const tel = type === "vip" ? localStorage.getItem("nia_vip_telephone") : localStorage.getItem("nia_standard_telephone");
  const content = document.getElementById("profil-view-content");
  if(!tel) { content.innerHTML = "<p style='color:gray;text-align:center;font-size:0.8rem;'>Aucune offre active.</p>"; return; }

  const mesAnnonces = toutesLesAnnonces.filter(a => a.telephone === tel && a.is_vip === (type === "vip"));
  let html = "";
  
  mesAnnonces.forEach(a => {
    html += `
      <div style="background:#f8fafc; padding:10px; border-radius:8px; margin-bottom:8px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
        <div>
          <b style="font-size:0.85rem;">${a.titre}</b>
          <div style="font-size:0.75rem; color:var(--text-light);">${a.prix} ${a.devise} / ${a.periode}</div>
        </div>
        <div style="display:flex; gap:4px;">
          <button style="background:#475569; color:white; border:none; padding:5px 8px; font-size:0.75rem; border-radius:4px; cursor:pointer;" onclick="ouvrirModificationFormulaireAnnonce(${JSON.stringify(a).replace(/'/g, "&apos;")})">✏️ Modifier</button>
          <button style="background:var(--danger); color:white; border:none; padding:5px 8px; font-size:0.75rem; border-radius:4px; cursor:pointer;" onclick="supprimerAnnonce(${a.id})">🗑️</button>
        </div>
      </div>`;
  });
  content.innerHTML = html || "<p style='color:gray;text-align:center;font-size:0.8rem;'>Aucune annonce trouvée.</p>";
}

function ouvrirModificationFormulaireAnnonce(annonceObj) {
  document.getElementById("edit-id").value = annonceObj.id;
  document.getElementById("edit-titre").value = annonceObj.titre;
  document.getElementById("edit-prix").value = annonceObj.prix;
  document.getElementById("edit-devise").value = annonceObj.devise;
  document.getElementById("edit-periode").value = annonceObj.periode;
  document.getElementById("edit-statut").value = annonceObj.statut;
  document.getElementById("edit-description").value = annonceObj.description || "";
  document.getElementById("modal-modifier-annonce").style.display = "flex";
}

async function sauvegarderModificationAnnonce() {
  const id = document.getElementById("edit-id").value;
  const res = await fetch(`${API}/annonces/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titre: val("edit-titre"), prix: val("edit-prix"), devise: val("edit-devise"),
      periode: val("edit-periode"), description: val("edit-description"), statut: val("edit-statut")
    })
  });
  if(res.ok) {
    alert("Modification enregistrée !");
    fermerModal("modifier-annonce");
    loadFeed();
    changerOngletProfil(ONGLE_PROFIL_ACTIF);
  }
}

async function supprimerAnnonce(id) {
  if(confirm("Confirmez-vous la suppression définitive ?")) {
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    loadFeed();
    changerOngletProfil(ONGLE_PROFIL_ACTIF);
  }
}

/* ================= ACTIONS CONSOLE LOGS ADMINISTRATION ================= */

async function chargerDonneesConsoleAdmin() {
  try {
    const res = await fetch(`${API}/admin/annonces`);
    adminAnnoncesCache = await res.json();
    filtrerAdminLogs('all');
  } catch(e) {}
}

function filtrerAdminLogs(mode) {
  const conteneur = document.getElementById("admin-listings-view");
  conteneur.innerHTML = "";
  let filtres = adminAnnoncesCache;
  if(mode === 'standard') filtres = adminAnnoncesCache.filter(a => !a.is_vip);
  if(mode === 'vip') filtres = adminAnnoncesCache.filter(a => a.is_vip);

  filtres.forEach(a => {
    conteneur.innerHTML += `
      <div style="padding:6px; border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center;">
        <span>[ID: ${a.id}] [Proprio UID: ${a.user_id || 'N/A'}] ${a.titre} (${a.ville}) - <b>${a.is_vip ? 'VIP':'STD'}</b></span>
        <button style="background:var(--danger); border:none; color:white; font-size:0.7rem; padding:3px 6px; border-radius:3px; cursor:pointer;" onclick="adminSupprimerAnnonceDirect(${a.id})">Supprimer / Avertir</button>
      </div>`;
  });
}

async function adminSupprimerAnnonceDirect(id) {
  if(confirm("Action modérateur : Supprimer cette annonce et avertir l'utilisateur ?")) {
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    alert("Annonce retirée de l'index.");
    chargerDonneesConsoleAdmin();
    loadFeed();
  }
}

async function adminEnvoyerMessageNotification(globalMode) {
  const target = val("admin-msg-target");
  const message = val("admin-msg-text");
  if(!message) return alert("Message vide.");

  const res = await fetch(`${API}/admin/send-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_user_id: target || null, message, is_global: globalMode })
  });
  if(res.ok) {
    alert("Notification transmise à l'utilisateur.");
    document.getElementById("admin-msg-text").value = "";
  }
}

async function envoyerAlerteGlobaleAdmin() {
  const msg = val("admin-alerte-msg");
  if (!msg) return alert("Veuillez saisir un message.");
  const res = await fetch(`${API}/admin/alerte`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: msg })
  });
  if(res.ok) {
    alert("Alerte diffusée !");
    document.getElementById("admin-alerte-msg").value = "";
    chargerAlertesAdministratives();
  }
}

async function chargerAlertesAdministratives() {
  try {
    const res = await fetch(`${API}/notifications/globales`);
    const alertes = await res.json();
    const conteneur = document.getElementById("alert-bar-container");
    if(!conteneur) return;
    conteneur.innerHTML = "";
    alertes.forEach(a => {
      conteneur.innerHTML += `<div class="admin-global-alert">📢 ALERTE : ${a.message}</div>`;
    });
  } catch(e) {}
}

function ouvrirModal(id) {
  const m = document.getElementById(`modal-${id}`);
  if(m) {
    m.style.display = "flex";
    if (id === "vip") rafraichirEspaceVip();
    if (id === "profil") { changerOngletProfil(ONGLE_PROFIL_ACTIF); chargerMessagesBoiteProfil(); }
    if (id === "admin") chargerDonneesConsoleAdmin();
  }
}
function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = "none"; }

document.addEventListener("DOMContentLoaded", () => {
  verifierMenuOptionsVisibles();
  loadFeed();
  lancerBanniereAdsenseRotative();
  initialiserMiseAJourAutomatique();
});
