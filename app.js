const API = "https://nia-rdc-2.onrender.com"; // Remplacer par l'URL de votre backend final de production

let toutesLesAnnonces = [];
let ONGLE_PROFIL_ACTIF = "standard";
let BLOCS_VIP_COUNT = 0;
let adminTimer = null;
let tempsValide = false;
let yStart = 0;

const CHARTE_APROPOS = `À propos de NIA RDC\n\nWelcome sur NIA RDC. NIA RDC est une plateforme numérique conçue pour faciliter la mise en relation entre les personnes souhaitant louer, proposer ou rechercher des biens et des services en République Démocratique du Congo.`;
const CHARTE_PRIVACY = `Politique de confidentialité de NIA RDC\n\nMise à jour : Juin 2026.\n\nLa protection de vos données privées est assurée selon les standards chiffrés récents de l'application.`;

// GESTION DU CYCLE D'AFFICHAGE AUTH DYNAMIQUE
function verifierStatutAuthentificationHeader() {
  const userId = localStorage.getItem("nia_user_id");
  const anonBlock = document.getElementById("anonymous-header-actions");
  const logoutBtn = document.getElementById("header-logout-btn");
  const deleteBtn = document.getElementById("header-delete-btn");

  if(userId) {
    if(anonBlock) anonBlock.style.display = "none";
    if(logoutBtn) logoutBtn.style.display = "block";
    if(deleteBtn) deleteBtn.style.display = "block";
  } else {
    if(anonBlock) anonBlock.style.display = "flex";
    if(logoutBtn) logoutBtn.style.display = "none";
    if(deleteBtn) deleteBtn.style.display = "none";
  }
}

function declencherAuthentificationDynamique(versInscription = true) {
  basculerModeAuth(versInscription);
  document.getElementById("modal-auth").style.display = "flex";
}

function ouvrirModalSeccurisee(modalId) {
  const userId = localStorage.getItem("nia_user_id");
  if (!userId) {
    declencherAuthentificationDynamique(false);
  } else {
    ouvrirModal(modalId);
  }
}

function deconnecterUtilisateur() {
  localStorage.clear();
  alert("Session fermée.");
  window.location.reload();
}

async function supprimerCompteUtilisateur() {
  const userId = localStorage.getItem("nia_user_id");
  if(!userId) return;
  if (confirm("⚠️ Confirmez-vous la suppression définitive de votre compte ?")) {
    const res = await fetch(`${API}/auth/delete-account`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId })
    });
    if(res.ok) { localStorage.clear(); window.location.reload(); }
  }
}

function basculerModeAuth(versInscription) {
  document.getElementById("auth-title").textContent = versInscription ? "Créer un compte NIA RDC" : "Connexion";
  document.getElementById("auth-form-register").style.display = versInscription ? "grid" : "none";
  document.getElementById("auth-form-login").style.display = versInscription ? "none" : "grid";
}

async function executerInscription() {
  if (!document.getElementById("auth-accept-rules")?.checked) return alert("Veuillez accepter les conditions.");
  const telephone = val("auth-tel");
  const password = val("auth-pass");
  if (!telephone || !password) return alert("Remplissez les cases.");

  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telephone, password, acceptedTerms: true })
  });
  const data = await res.json();
  if (res.ok && data.success) {
    localStorage.setItem("nia_user_id", data.user.id);
    localStorage.setItem("nia_standard_telephone", data.user.telephone);
    document.getElementById("modal-auth").style.display = "none";
    verifierStatutAuthentificationHeader();
    alert("Compte activé !");
  } else { alert(data.error); }
}

async function executerConnexion() {
  const telephone = val("login-tel");
  const password = val("login-pass");
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telephone, password })
  });
  const data = await res.json();
  if (res.ok && data.success) {
    localStorage.setItem("nia_user_id", data.user.id);
    localStorage.setItem("nia_standard_telephone", data.user.telephone);
    document.getElementById("modal-auth").style.display = "none";
    verifierStatutAuthentificationHeader();
    loadFeed();
  } else { alert(data.error); }
}

function toggleLeftDropdown() {
  const dropdown = document.getElementById("left-dropdown");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function ouvrirModalLegal(type) {
  document.getElementById("legal-title-display").textContent = type === 'apropos' ? "À propos de NIA RDC" : "Politique de Confidentialité";
  document.getElementById("legal-body-display").textContent = type === 'apropos' ? CHARTE_APROPOS : CHARTE_PRIVACY;
  document.getElementById("modal-legal").style.display = "flex";
}

const TEXTES_PUB = [
  "⚡ Besoin de matériel ? Effectuez une recherche rapide par commune sur NIA RDC !",
  "🏢 Multipliez vos transactions immobilières en ouvrant votre Boutique VIP !",
  "📢 Passez votre annonce en quelques secondes et touchez des milliers de clients locaux."
];
let indexPub = 0;
function lancerBanniereAdsenseRotative() {
  setInterval(() => {
    indexPub = (indexPub + 1) % TEXTES_PUB.length;
    document.getElementById("adsense-rotative-banner").textContent = TEXTES_PUB[indexPub];
  }, 15000);
}

function val(id) { return document.getElementById(id)?.value?.trim() || ""; }

function optimiserEtCompresserImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > 600) { h = Math.round((h * 600) / w); w = 600; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
    };
  });
}

function startAdminTouch() { tempsValide = false; adminTimer = setTimeout(() => { tempsValide = true; }, 10000); }
function stopAdminTouch() { clearTimeout(adminTimer); }
window.addEventListener("touchstart", e => { yStart = e.touches[0].clientY; });
window.addEventListener("touchend", e => {
  if (tempsValide && (yStart - e.changedTouches[0].clientY > 60)) {
    tempsValide = false;
    if (prompt("Saisir le code d'accès de sécurité Administrateur :") === "BEN4002ET4200") {
      ouvrirModal("admin"); appliquerFiltrageSupervisionAdmin();
    }
  }
});

function inviterUtilisateurWhatsApp() {
  const lienApp = window.location.href;
  const message = encodeURIComponent(`Rejoins-nous sur NIA RDC pour louer en toute simplicité : ${lienApp}`);
  window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
}

async function chargerMessagesAdministratifsPrives() {
  const userId = localStorage.getItem("nia_user_id");
  if(!userId) return;
  try {
    const res = await fetch(`${API}/user/${userId}/messages`);
    const msgs = await res.json();
    const box = document.getElementById("admin-messages-box-container");
    if(msgs.length === 0) { box.innerHTML = "Aucun message reçu."; return; }
    box.innerHTML = msgs.map(m => `<div class="admin-msg-box"><b>[Admin]</b>: ${m.message}</div>`).join("");
  } catch(e){}
}

function rechercher() {
  const qTitre = val("search-titre"), qVille = val("search-ville");
  let res = toutesLesAnnonces.filter(a => {
    let mTitle = qTitre === "" || a.titre.toLowerCase().includes(qTitre.toLowerCase()) || (a.description && a.description.toLowerCase().includes(qTitre.toLowerCase()));
    let mVille = a.ville.toLowerCase().includes(qVille.toLowerCase());
    return mTitle && mVille;
  });
  fermerModal("rechercher");
  document.getElementById("feed-title").textContent = `Résultats (${res.length})`;
  afficherFlux(res, true);
}

function annulerRecherche() {
  document.getElementById("feed-title").textContent = "Annonces récentes";
  afficherFlux(toutesLesAnnonces, false);
}

async function loadFeed() {
  try {
    const res = await fetch(`${API}/feed`);
    toutesLesAnnonces = await res.json();
    afficherFlux(toutesLesAnnonces, false);
  } catch (e) { document.getElementById("feed").innerHTML = "Erreur de chargement du flux."; }
}

function afficherFlux(liste, modeRecherche = false) {
  const feed = document.getElementById("feed");
  if (!feed) return; feed.innerHTML = "";
  document.getElementById("reset-btn").style.display = modeRecherche ? "block" : "none";
  if(liste.length === 0) { feed.innerHTML = "<p style='text-align:center; color:gray;'>Aucune annonce trouvée.</p>"; return; }

  liste.forEach(a => {
    let imagesHtml = "";
    if (a.images && a.images.length > 0) {
      imagesHtml = `<div class="gallery">${a.images.map(u => `<img src="${u}" class="gallery-item">`).join("")}</div>`;
    }
    feed.innerHTML += `
      <div class="${a.is_vip ? 'annonce-card vip-premium' : 'annonce-card'}">
        ${a.is_vip ? `<div class="vip-badge-tag">👑 VIP</div>` : ""}
        <h3 style="margin:0 0 5px 0;">${a.titre}</h3>
        <div class="annonce-price">${a.prix} ${a.devise} / ${a.periode}</div>
        <div class="annonce-meta">📍 ${a.ville} - ${a.commune || ""}, ${a.quartier || ""}</div>
        <div class="annonce-description" onclick="this.classList.toggle('deployee')">${a.description || "Aucun détail complémentaire."}</div>
        ${imagesHtml}
        <div class="annonce-footer">
          ${a.statut === "occupe" ? `<span class="badge-status status-occupe">🔴 Occupé</span>` : `<span class="badge-status status-disponible">🟢 Disponible</span>`}
          <div style="display:flex; gap:6px;">
            <button class="btn-report" onclick="signalerAnnonce(${a.id})">⚠️ Signaler</button>
            <button class="btn-contact" onclick="window.location.href='tel:${a.telephone}'">📞 Appeler</button>
          </div>
        </div>
      </div>`;
  });
}

async function signalerAnnonce(id) {
  await fetch(`${API}/annonces/${id}/signaler`, { method: "POST" });
  alert("Annonce signalée avec succès.");
}

async function publier() {
  if (!val("titre") || !val("telephone")) return alert("Le titre et le téléphone sont obligatoires.");
  const files = document.getElementById("image")?.files;
  let images_base64 = [];
  if(files) { for(let f of files) { images_base64.push(await optimiserEtCompresserImage(f)); } }
  localStorage.setItem("nia_standard_telephone", val("telephone"));

  await fetch(`${API}/annonces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: localStorage.getItem("nia_user_id"),
      titre: val("titre"), prix: val("prix"), devise: val("devise"), periode: val("periode"),
      telephone: val("telephone"), description: val("description"), ville: val("ville"),
      commune: val("commune"), quartier: val("quartier"), statut: val("statut"), is_vip: false, images_base64
    })
  });
  fermerModal("publier"); loadFeed();
}

// MANAGEMENT INTEGRAL DU CATALOGUE MULTI-VIP AVEC EXTRACTION SÉLECTIVE DES SÉLECTEURS DE FICHIERS
function rafraichirEspaceVip() {
  const body = document.getElementById("vip-form-body");
  const nomBoutique = localStorage.getItem("nia_vip_nom");
  if (!nomBoutique) {
    body.innerHTML = `
      <div class="form-group full-width"><label>Nom de l'Espace / Vitrine VIP</label><input id="reg-vip-nom" placeholder="Ex: Maison de Commerce Express"></div>
      <div class="form-group full-width"><label>Téléphone par défaut</label><input id="reg-vip-tel" type="tel" placeholder="Ex: 0820000000"></div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="creerBoutiqueVIP()">Activer mon Espace VIP 👑</button>`;
  } else {
    body.innerHTML = `
      <div style="background:var(--vip-bg); padding:10px; border-radius:8px; margin-bottom:12px; font-weight:bold; color:var(--vip-gold); text-align:center;">👑 CATALOGUE VIP : ${nomBoutique}</div>
      <div id="conteneur-blocs-annonces-vip"></div>
      <button class="modal-submit-btn" style="background:#475569; margin-bottom:8px;" onclick="ajouterNouveauBlocFormulaireVip()">➕ Ajouter un Produit au Catalogue</button>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="soumettreToutesLesAnnoncesVip()">🚀 Publier le Catalogue Actuel</button>`;
    BLOCS_VIP_COUNT = 0; ajouterNouveauBlocFormulaireVip();
  }
}

function creerBoutiqueVIP() {
  if(!val("reg-vip-nom") || !val("reg-vip-tel")) return alert("Veuillez remplir tous les champs.");
  localStorage.setItem("nia_vip_nom", val("reg-vip-nom"));
  localStorage.setItem("nia_vip_telephone", val("reg-vip-tel"));
  rafraichirEspaceVip();
}

function ajouterNouveauBlocFormulaireVip() {
  BLOCS_VIP_COUNT++;
  const conteneur = document.getElementById("conteneur-blocs-annonces-vip");
  const div = document.createElement("div");
  div.className = "vip-block-annonce";
  div.id = `vip-block-${BLOCS_VIP_COUNT}`;
  div.style = "background:#f8fafc; border:1px dashed #cbd5e1; padding:12px; border-radius:8px; margin-bottom:12px;";
  div.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.8rem; font-weight:bold; color:var(--vip-gold)">
      <span>📦 PRODUIT VIP N°${BLOCS_VIP_COUNT}</span>
      <button style="color:red; background:none; border:none; cursor:pointer;" onclick="document.getElementById('${div.id}').remove()">Supprimer</button>
    </div>
    <div class="form-grid">
      <div class="form-group full-width"><label>Nom de l'objet / service</label><input class="vip-in-titre" required></div>
      <div class="form-group"><label>Prix</label>
        <div style="display:flex; gap:4px;"><input class="vip-in-prix" type="number" style="flex:2;"><select class="vip-in-devise" style="flex:1;"><option value="$">$</option><option value="FC">FC</option></select></div>
      </div>
      <div class="form-group"><label>Période</label><select class="vip-in-periode"><option value="jour">par jour</option><option value="heure">par heure</option></select></div>
      <div class="form-group"><label>Téléphone de contact</label><input class="vip-in-tel" value="${localStorage.getItem("nia_vip_telephone")}"></div>
      <div class="form-group"><label>Commune</label><input class="vip-in-commune"></div>
      <div class="form-group full-width"><label>Description</label><textarea class="vip-in-desc"></textarea></div>
      <!-- NOUVEAU SÉLECTEUR DE PHOTOS AJOUTÉ ICI POUR CHAQUE BLOC VIP -->
      <div class="form-group full-width"><label>Sélectionner les Photos de cet article</label><input type="file" class="vip-in-photos" multiple accept="image/*"></div>
    </div>`;
  conteneur.appendChild(div);
}

async function soumettreToutesLesAnnoncesVip() {
  const blocs = document.querySelectorAll(".vip-block-annonce");
  if(blocs.length === 0) return alert("Ajoutez au moins un produit.");

  for (let b of blocs) {
    const titre = b.querySelector(".vip-in-titre").value.trim();
    const prix = b.querySelector(".vip-in-prix").value.trim();
    const devise = b.querySelector(".vip-in-devise").value;
    const periode = b.querySelector(".vip-in-periode").value;
    const telephone = b.querySelector(".vip-in-tel").value.trim();
    const description = b.querySelector(".vip-in-desc").value.trim();
    const commune = b.querySelector(".vip-in-commune").value.trim();
    const photoInput = b.querySelector(".vip-in-photos");

    if (!titre || !telephone) continue;

    // Récupération et conversion asynchrone des photos spécifiques de ce bloc
    let images_base64 = [];
    if(photoInput && photoInput.files.length > 0) {
      for(let f of photoInput.files) {
        images_base64.push(await optimiserEtCompresserImage(f));
      }
    }

    await fetch(`${API}/annonces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: localStorage.getItem("nia_user_id"),
        titre, prix, devise, periode, telephone, description, ville: "Lubumbashi", commune, is_vip: true, images_base64
      })
    });
  }
  alert("Votre catalogue VIP complet a été envoyé avec succès !");
  fermerModal("vip"); loadFeed();
}

function ouvrirModal(id) {
  document.getElementById(`modal-${id}`).style.display = "flex";
  if (id === "vip") rafraichirEspaceVip();
  if (id === "profil") { changerOngletProfil(ONGLE_PROFIL_ACTIF); chargerMessagesAdministratifsPrives(); }
}
function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = "none"; }

function changerOngletProfil(type) {
  ONGLE_PROFIL_ACTIF = type;
  document.getElementById("tab-standard-btn").style.background = type === "standard" ? "#cbd5e1" : "#f1f5f9";
  document.getElementById("tab-vip-btn").style.background = type === "vip" ? "#fde68a" : "#f1f5f9";
  const tel = type === "vip" ? localStorage.getItem("nia_vip_telephone") : localStorage.getItem("nia_standard_telephone");
  const content = document.getElementById("profil-view-content");
  if(!tel) { content.innerHTML = "<p style='color:gray;text-align:center;'>Aucune annonce.</p>"; return; }

  const mesAnnonces = toutesLesAnnonces.filter(a => a.telephone === tel && a.is_vip === (type === "vip"));
  if(mesAnnonces.length === 0) { content.innerHTML = "<p style='color:gray;text-align:center;'>Aucun produit en ligne.</p>"; return; }

  content.innerHTML = mesAnnonces.map(a => `
    <div style="background:#f8fafc; padding:10px; border-radius:8px; margin-bottom:8px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
      <div><b>${a.titre}</b><div style="font-size:0.75rem; color:var(--text-light);">${a.prix} ${a.devise}</div></div>
      <div style="display:flex; gap:4px;">
        <button class="btn-edit" style="padding:4px 8px; font-size:0.75rem;" onclick="ouvrirFormulaireModificationAnnonce(${JSON.stringify(a).replace(/"/g, '&quot;')})">✏️ Modifier</button>
        <button class="btn-delete" style="padding:4px 8px; font-size:0.75rem;" onclick="supprimerAnnonce(${a.id})">🗑️</button>
      </div>
    </div>`).join("");
}

function ouvrirFormulaireModificationAnnonce(annonce) {
  document.getElementById("edit-id").value = annonce.id;
  document.getElementById("edit-titre").value = annonce.titre;
  document.getElementById("edit-prix").value = annonce.prix;
  document.getElementById("edit-devise").value = annonce.devise;
  document.getElementById("edit-periode").value = annonce.periode;
  document.getElementById("edit-statut").value = annonce.statut;
  document.getElementById("edit-telephone").value = annonce.telephone;
  document.getElementById("edit-ville").value = annonce.ville;
  document.getElementById("edit-commune").value = annonce.commune || "";
  document.getElementById("edit-quartier").value = annonce.quartier || "";
  document.getElementById("edit-description").value = annonce.description || "";
  ouvrirModal("modifier-annonce");
}

async function sauvegarderModificationAnnonce() {
  const id = document.getElementById("edit-id").value;
  await fetch(`${API}/annonces/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titre: val("edit-titre"), prix: val("edit-prix"), devise: val("edit-devise"),
      periode: val("edit-periode"), statut: val("edit-statut"), telephone: val("edit-telephone"),
      ville: val("edit-ville"), commune: val("edit-commune"), quartier: val("edit-quartier"), description: val("edit-description")
    })
  });
  fermerModal("modifier-annonce"); fermerModal("profil"); loadFeed();
}

async function supprimerAnnonce(id) {
  if(confirm("Supprimer l'article ?")) {
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    fermerModal("profil"); loadFeed();
  }
}

// FONCTIONS DE SUPERVISION DE L'ADMINISTRATION
async function envoyerMessageAdminDirect() {
  const target_tel = val("admin-msg-target");
  const message = val("admin-msg-text");
  if (!message) return alert("Saisir un texte.");
  const res = await fetch(`${API}/admin/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_tel, message, is_global: target_tel === "" })
  });
  if(res.ok) { alert("Message transmis !"); document.getElementById("admin-msg-text").value = ""; }
}

function appliquerFiltrageSupervisionAdmin() {
  const villeFiltre = val("admin-filter-ville").toLowerCase();
  const typeFiltre = document.getElementById("admin-filter-type").value;
  let filtre = toutesLesAnnonces.filter(a => {
    let mVille = villeFiltre === "" || a.ville.toLowerCase().includes(villeFiltre);
    let mType = typeFiltre === "all" || (typeFiltre === "vip" ? a.is_vip : !a.is_vip);
    return mVille && mType;
  });
  const list = document.getElementById("admin-flux-supervision-list");
  list.innerHTML = filtre.map(a => `
    <div style="background:#1e293b; padding:8px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
      <span><b>[${a.is_vip?'VIP':'STD'}]</b> ${a.titre} - <span style="color:red;">Signaux: ${a.signaux_count || 0}</span></span>
      <button style="background:red; color:white; border:none; padding:3px 6px; border-radius:4px;" onclick="supprimerAnnonceAdmin(${a.id})">Supprimer</button>
    </div>
  `).join("");
}

async function supprimerAnnonceAdmin(id) {
  if (confirm("Supprimer l'offre ?")) {
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    loadFeed(); setTimeout(() => appliquerFiltrageSupervisionAdmin(), 500);
  }
}

setInterval(() => { loadFeed(); }, 15000);

document.addEventListener("DOMContentLoaded", () => {
  verifierStatutAuthentificationHeader();
  loadFeed();
  lancerBanniereAdsenseRotative();
});
