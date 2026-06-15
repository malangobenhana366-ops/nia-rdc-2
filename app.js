const API = "https://nia-rdc-2.onrender.com";

let toutesLesAnnonces = [];
let ONGLE_PROFIL_ACTIF = "standard";
let ACTION_POST_INTERSTITIELLE = null;
let BLOCS_VIP_COUNT = 0;

let adminTimer = null;
let tempsValide = false;
let yStart = 0;

const SYNONYMES = {
  "groupe": ["generator", "generateur", "dynamo", "kilo", "kva", "courant", "electricite", "moteur"],
  "voiture": ["auto", "vehicule", "char", "taxi", "automobile", "jeep", "camionnette", "moteur"],
  "maison": ["appartement", "chambre", "studio", "villa", "salon", "parcelle", "immeuble", "logement"],
  "soudeuse": ["soudure", "poste", "fer", "metal"],
  "pompe": ["eau", "forage", "motopompe", "cuve", "tuyau"]
};

const TEXTES_PUB = [
  "⚡ Louez vos groupes électrogènes chez NIA RDC au meilleur prix !",
  "🏢 VIP : Multipliez vos clients en créant votre catalogue de location !",
  "🚀 Propulsez vos affaires en devenant membre vérifié NIA Premium !",
  "📞 Besoin d'équipements industriels ? Utilisez notre recherche intelligente !"
];
let indexPub = 0;
function lancerBanniereAdsenseRotative() {
  const banner = document.getElementById("adsense-rotative-banner");
  if(banner) banner.textContent = TEXTES_PUB[indexPub];
  setInterval(() => {
    indexPub = (indexPub + 1) % TEXTES_PUB.length;
    if(banner) banner.textContent = TEXTES_PUB[indexPub];
  }, 30000);
}

function declencherPubliciteInterstitielle(actionSuivante, messageSpecifique = "") {
  ACTION_POST_INTERSTITIELLE = actionSuivante;
  document.getElementById("interstitial-body").textContent = messageSpecifique || "Découvrez les meilleures opportunités de la province du Haut-Katanga.";
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

/* --- TOUT LE SYSTÈME DE GESTE ET ACCÈS SÉCURISÉ ADMIN --- */
function startAdminTouch() {
  tempsValide = false;
  adminTimer = setTimeout(() => { tempsValide = true; }, 10000);
}
function stopAdminTouch() { clearTimeout(adminTimer); }

const handleGestureEnd = (yEnd) => {
  if (tempsValide && (yEnd - yStart > 100)) {
    tempsValide = false;
    const code = prompt("Veuillez saisir le code de sécurité Administrateur :");
    if (code === "BEN4002ET4200") {
      ouvrirModal("admin");
      chargerConsoleAdminInventaire();
    } else if (code !== null) { alert("Code incorrect."); }
  }
};
window.addEventListener("touchstart", e => { yStart = e.touches[0].clientY; });
window.addEventListener("touchend", e => { handleGestureEnd(e.changedTouches[0].clientY); });
window.addEventListener("mousedown", e => { yStart = e.clientY; });
window.addEventListener("mouseup", e => { handleGestureEnd(e.clientY); });

/* --- RECHERCHE INTELLIGENTE ET FUZZY --- */
function verifierMatchIntelligent(titreAnnonce, queryRecherche) {
  let t = titreAnnonce.toLowerCase(); let q = queryRecherche.toLowerCase();
  if (t.includes(q)) return true;
  let motsQuery = q.split(" ").filter(m => m.length > 2);
  for (let mot of motsQuery) {
    if (t.includes(mot)) return true;
    for (let cle in SYNONYMES) {
      if (cle.includes(mot) || mot.includes(cle)) {
        for (let syn of SYNONYMES[cle]) { if (t.includes(syn)) return true; }
      }
    }
  }
  return false;
}

function rechercher() {
  const qTitre = val("search-titre"); const qVille = val("search-ville");
  const qCommune = val("search-commune"); const qQuartier = val("search-quartier");

  let resultats = toutesLesAnnonces.filter(a => {
    let matchTitre = qTitre === "" || verifierMatchIntelligent(a.titre, qTitre) || verifierMatchIntelligent(a.description || "", qTitre);
    let matchVille = a.ville.toLowerCase().includes(qVille.toLowerCase());
    let matchCommune = qCommune === "" || a.commune?.toLowerCase().includes(qCommune.toLowerCase());
    let matchQuartier = qQuartier === "" || a.quartier?.toLowerCase().includes(qQuartier.toLowerCase());
    return matchTitre && matchVille && matchCommune && matchQuartier;
  });
  fermerModal("rechercher");
  document.getElementById("feed-title").textContent = `Résultats (${resultats.length})`;
  filtrerEtAfficherFlux(resultats, true);
}

function annulerRecherche() {
  document.getElementById("feed-title").textContent = "Annonces récentes";
  filtrerEtAfficherFlux(toutesLesAnnonces, false);
}

/* --- RECONDUCTION DES ALERTES BANDEAU --- */
async function chargerAlertesAdministratives() {
  try {
    const res = await fetch(`${API}/notifications/globales`);
    const alertes = await res.json();
    const conteneur = document.getElementById("alert-bar-container");
    if(!conteneur) return; conteneur.innerHTML = "";
    alertes.forEach(a => { conteneur.innerHTML += `<div class="admin-global-alert">📢 ALERTE : ${a.message}</div>`; });
  } catch(e) {}
}

async function loadFeed() {
  try {
    const res = await fetch(`${API}/feed`);
    toutesLesAnnonces = await res.json();
    filtrerEtAfficherFlux(toutesLesAnnonces);
    chargerAlertesAdministratives();
  } catch (e) { document.getElementById("feed").innerHTML = "Erreur de connexion serveur."; }
}

function filtrerEtAfficherFlux(listeAnnonces, modeRechercheActive = false) {
  const feed = document.getElementById("feed"); if (!feed) return;
  feed.innerHTML = "";
  document.getElementById("reset-btn").style.display = modeRechercheActive ? "block" : "none";
  if(listeAnnonces.length === 0) { feed.innerHTML = "<p style='text-align:center; color:gray;'>Aucune annonce.</p>"; return; }

  listeAnnonces.forEach(a => {
    let galleryHtml = "";
    if (a.images && a.images.length > 0) {
      galleryHtml = `<div class="gallery">`;
      a.images.forEach(url => { galleryHtml += `<img src="${url}" class="gallery-item">`; });
      galleryHtml += `</div>`;
    }
    let statutHtml = a.statut === "occupe" ? `<span class="badge-status status-occupe">🔴 Occupé</span>` : `<span class="badge-status status-disponible">🟢 Disponible</span>`;
    feed.innerHTML += `
      <div class="${a.is_vip ? 'annonce-card vip-premium' : 'annonce-card'}">
        ${a.is_vip ? `<div class="vip-badge-tag">👑 VIP</div>` : ""}
        <h3>${a.titre}</h3>
        <div class="annonce-price">${a.prix} ${a.devise} / ${a.periode}</div>
        <div class="annonce-meta">📍 ${a.ville} - ${a.commune || ""}, ${a.quartier || ""}</div>
        <div class="annonce-description">${a.description || ""}</div>
        ${galleryHtml}
        <div class="annonce-footer">
          ${statutHtml}
          <button class="btn-contact" onclick="declencherPubliciteInterstitielle(() => { window.location.href='tel:${a.telephone}'; }, 'Ouverture de ligne téléphonique sécurisée...');">📞 Appeler (${a.telephone})</button>
        </div>
      </div>`;
  });
}

async function publier() {
  const files = document.getElementById("image")?.files;
  if (!val("titre") || !val("telephone")) return alert("Champs obligatoires manquants");
  let images_base64 = []; if(files) { for(let f of files) { images_base64.push(await optimiserEtCompresserImage(f)); } }
  localStorage.setItem("nia_standard_telephone", val("telephone"));

  const res = await fetch(`${API}/annonces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titre: val("titre"), prix: val("prix"), devise: val("devise"), periode: val("periode"),
      telephone: val("telephone"), description: val("description"), ville: val("ville"),
      commune: val("commune"), quartier: val("quartier"), statut: val("statut"), is_vip: false, images_base64
    })
  });
  if(res.ok) { fermerModal("publier"); loadFeed(); }
}

/* --- MODULE MULTI-VIP DYNAMIQUE CONSERVÉ --- */
function rafraichirEspaceVip() {
  const body = document.getElementById("vip-form-body"); const nomBoutique = localStorage.getItem("nia_vip_nom");
  if (!nomBoutique) {
    body.innerHTML = `
      <div class="form-group full-width"><label>Nom commercial de la boutique VIP</label><input id="reg-vip-nom" placeholder="Ex: Maison Quincaillerie"></div>
      <div class="form-group full-width"><label>Téléphone Global</label><input id="reg-vip-tel" type="tel" placeholder="Ex: 082..."></div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="creerBoutiqueVIP()">Activer Boutique VIP 👑</button>`;
  } else {
    body.innerHTML = `
      <div style="background:var(--vip-bg); padding:12px; border-radius:10px; margin-bottom:15px; font-weight:bold; color:var(--vip-gold); text-align:center;">👑 VITRINE : ${nomBoutique}</div>
      <div id="conteneur-blocs-annonces-vip"></div>
      <button class="btn-add-block" onclick="ajouterNouveauBlocFormulaireVip()">➕ Ajouter une autre annonce distincte</button>
      <button id="btn-submit-multi-vip" class="modal-submit-btn" style="background:var(--vip-gold);" onclick="soumettreToutesLesAnnoncesVip()">🚀 Diffuser tout le catalogue</button>`;
    BLOCS_VIP_COUNT = 0; ajouterNouveauBlocFormulaireVip();
  }
}

function creerBoutiqueVIP() {
  if(!val("reg-vip-nom") || !val("reg-vip-tel")) return alert("Remplissez tout");
  localStorage.setItem("nia_vip_nom", val("reg-vip-nom")); localStorage.setItem("nia_vip_telephone", val("reg-vip-tel"));
  rafraichirEspaceVip();
}

function ajouterNouveauBlocFormulaireVip() {
  BLOCS_VIP_COUNT++; const conteneur = document.getElementById("conteneur-blocs-annonces-vip"); const idUnique = BLOCS_VIP_COUNT;
  const blocHtml = document.createElement("div"); blocHtml.className = "vip-block-annonce"; blocHtml.id = `vip-block-${idUnique}`;
  blocHtml.innerHTML = `
    <div class="vip-block-header">
      <span style="font-weight:bold; color:var(--primary)">📦 Objet Particulier N°${idUnique}</span>
      ${idUnique > 1 ? `<button style="background:none; border:none; color:var(--danger); font-weight:bold; cursor:pointer;" onclick="document.getElementById('vip-block-${idUnique}').remove()">Supprimer ✕</button>` : ""}
    </div>
    <div class="form-grid">
      <div class="form-group full-width"><label>Nom de l'objet</label><input class="vip-in-titre" required placeholder="Ex: Matériel"></div>
      <div class="form-group"><label>Prix</label><div style="display:flex; gap:6px;"><input class="vip-in-prix" type="number" placeholder="10" style="flex:2;"><select class="vip-in-devise" style="flex:1;"><option value="$">$</option><option value="FC">FC</option></select></div></div>
      <div class="form-group"><label>Période</label><select class="vip-in-periode"><option value="jour">par jour</option><option value="heure">par heure</option></select></div>
      <div class="form-group"><label>Statut</label><select class="vip-in-statut"><option value="disponible">🟢 Disponible</option><option value="occupe">🔴 Occupé</option></select></div>
      <div class="form-group"><label>Téléphone spécifique</label><input class="vip-in-tel" value="${localStorage.getItem("nia_vip_telephone")}"></div>
      <div class="form-group full-width"><label>Description</label><textarea class="vip-in-desc"></textarea></div>
      <div class="form-group"><label>Commune</label><input class="vip-in-commune"></div><div class="form-group"><label>Quartier</label><input class="vip-in-quartier"></div>
      <div class="form-group full-width"><label>Photos</label><input type="file" class="vip-in-photos" multiple accept="image/*"></div>
    </div>`;
  conteneur.appendChild(blocHtml);
}

async function soumettreToutesLesAnnoncesVip() {
  const boutonsubmit = document.getElementById("btn-submit-multi-vip"); const blocs = document.querySelectorAll(".vip-block-annonce");
  if(boutonsubmit) { boutonsubmit.disabled = true; boutonsubmit.textContent = "Téléversement..."; }
  try {
    for (let b of blocs) {
      const titre = b.querySelector(".vip-in-titre").value.trim(); const prix = b.querySelector(".vip-in-prix").value.trim();
      const { value: devise } = b.querySelector(".vip-in-devise"); const { value: periode } = b.querySelector(".vip-in-periode");
      const { value: statut } = b.querySelector(".vip-in-statut"); const telephone = b.querySelector(".vip-in-tel").value.trim();
      const description = b.querySelector(".vip-in-desc").value.trim(); const commune = b.querySelector(".vip-in-commune").value.trim();
      const quartier = b.querySelector(".vip-in-quartier").value.trim(); const fileInput = b.querySelector(".vip-in-photos");
      if (!titre || !telephone) continue;
      let images_base64 = []; if(fileInput && fileInput.files.length > 0) { for(let f of fileInput.files) { images_base64.push(await optimiserEtCompresserImage(f)); } }
      await fetch(`${API}/annonces`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titre, prix, devise, periode, telephone, description, statut, ville: "Lubumbashi", commune, quartier, is_vip: true, images_base64 })
      });
    }
    alert("Catalogue VIP entièrement en ligne ! 👑"); fermerModal("vip"); loadFeed();
  } catch(e) { alert("Erreur."); } finally { if(boutonsubmit) { boutonsubmit.disabled = false; boutonsubmit.textContent = "🚀 Publier le catalogue d'annonces"; } }
}

/* --- ESPACE PRIVE DU PROFIL + BOITE DE MESSAGES CLIENTS --- */
function ouvrirModal(id) {
  const m = document.getElementById(`modal-${id}`);
  if(m) {
    m.style.display = "flex";
    if (id === "vip") rafraichirEspaceVip();
    if (id === "profil") { changerOngletProfil(ONGLE_PROFIL_ACTIF); chargerBoiteMessagesProfil(); }
  }
}

async function chargerBoiteMessagesProfil() {
  const tel = ONGLE_PROFIL_ACTIF === "vip" ? localStorage.getItem("nia_vip_telephone") : localStorage.getItem("nia_standard_telephone");
  const box = document.getElementById("user-mailbox-list");
  if(!tel) { box.innerHTML = "Connectez-vous ou déposez pour activer la messagerie."; return; }
  
  try {
    const res = await fetch(`${API}/messages/boite/${tel}`);
    const msgs = await res.json();
    if(msgs.length === 0) { box.innerHTML = "<p style='color:gray; font-size:0.85rem;'>Aucun message reçu pour le moment.</p>"; return; }
    box.innerHTML = "";
    msgs.forEach(m => {
      let isGlobal = m.receiver_id === 0;
      box.innerHTML += `
        <div class="message-bubble ${isGlobal ? 'global-type' : ''}">
          <div style="font-size:0.75rem; font-weight:bold; color:gray; margin-bottom:3px;">💬 Reçu le : ${new Date(m.created_at).toLocaleString('fr-FR')}</div>
          <div>${m.content}</div>
        </div>`;
    });
  } catch(e) { box.innerHTML = "Échec du rafraîchissement des messages."; }
}

function changerOngletProfil(type) {
  ONGLE_PROFIL_ACTIF = type;
  document.getElementById("tab-standard-btn").style.background = type === "standard" ? "#cbd5e1" : "#f1f5f9";
  document.getElementById("tab-vip-btn").style.background = type === "vip" ? "#fde68a" : "#f1f5f9";
  const tel = type === "vip" ? localStorage.getItem("nia_vip_telephone") : localStorage.getItem("nia_standard_telephone");
  const content = document.getElementById("profil-view-content");
  
  // Met aussi à jour la boîte aux lettres instantanément au clic d'onglet
  chargerBoiteMessagesProfil();

  if(!tel) { content.innerHTML = "<p style='color:gray;text-align:center;'>Aucune annonce.</p>"; return; }
  const mesAnnonces = toutesLesAnnonces.filter(a => a.telephone === tel && a.is_vip === (type === "vip"));
  let html = "";
  mesAnnonces.forEach(a => {
    html += `
      <div style="background:#f8fafc; padding:15px; border-radius:12px; margin-bottom:12px; border:1px solid var(--border)">
        <div style="display:flex; justify-content:between; align-items:center; width:100%;">
          <div style="flex:1;">
            <b style="font-size:1rem; color:var(--text);">${a.titre}</b>
            <div>Statut : <b>${a.statut === 'occupe' ? '🔴 Occupé' : '🟢 Disponible'}</b></div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn-boost" style="padding:6px 10px;" onclick="declencherPubliciteInterstitielle(() => { alert('Annonce boostée !'); }, 'Traitement algorithmique du boost...');">🚀 Booster</button>
            <button class="btn-edit" style="padding:6px 10px;" onclick="ouvrirEditeurAnnonceDirecte(${JSON.stringify(a).replace(/"/g, '&quot;')})">✏️ Modifier</button>
            <button class="btn-delete" style="padding:6px 10px;" onclick="supprimerAnnonce(${a.id})">🗑️</button>
          </div>
        </div>
      </div>`;
  });
  content.innerHTML = html || "<p style='color:gray;text-align:center;'>Aucune annonce active.</p>";
}

function ouvrirEditeurAnnonceDirecte(a) {
  document.getElementById("edit-id").value = a.id; document.getElementById("edit-titre").value = a.titre;
  document.getElementById("edit-prix").value = a.prix; document.getElementById("edit-devise").value = a.devise;
  document.getElementById("edit-periode").value = a.periode; document.getElementById("edit-statut").value = a.statut;
  document.getElementById("edit-description").value = a.description || ""; ouvrirModal("modifier-annonce");
}

async function sauvegarderModificationAnnonce() {
  const id = document.getElementById("edit-id").value;
  const res = await fetch(`${API}/annonces/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titre: val("edit-titre"), prix: val("edit-prix"), devise: val("edit-devise"), periode: val("edit-periode"), description: val("edit-description"), statut: val("edit-statut") })
  });
  if(res.ok) { fermerModal("modifier-annonce"); fermerModal("profil"); loadFeed(); }
}

async function supprimerAnnonce(id) {
  if(confirm("Supprimer l'offre définitivement ?")) {
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    fermerModal("profil"); document.getElementById(`admin-row-${id}`)?.remove(); loadFeed();
  }
}

/* ================= NOUVELLE STRATEGIE INTEGRALE ADMIN CONSOLE ================= */

function toggleAdminTargetPhone() {
  const type = document.getElementById("admin-msg-type").value;
  document.getElementById("admin-msg-phone").style.display = type === "SOLO" ? "block" : "none";
}

async function adminTraiterEnvoiMessage() {
  const type = document.getElementById("admin-msg-type").value;
  const telephone_cible = val("admin-msg-phone");
  const msg = val("admin-text-content");

  if(!msg) return alert("Contenu textuel vide !");
  if(type === "SOLO" && !telephone_cible) return alert("Précisez le téléphone de destination.");

  const res = await fetch(`${API}/admin/envoyer-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, telephone_cible, message: msg })
  });
  
  if(res.ok) {
    alert("Message expédié avec succès !");
    document.getElementById("admin-text-content").value = "";
    chargerAlertesAdministratives();
  }
}

function chargerConsoleAdminInventaire() {
  const list = document.getElementById("admin-total-annonces-list");
  if(!list) return;
  filtrerConsoleAdminAnnonces();
}

function filtrerConsoleAdminAnnonces() {
  const list = document.getElementById("admin-total-annonces-list");
  const fVille = val("adm-flt-ville").toLowerCase();
  const fType = document.getElementById("adm-flt-type").value;

  list.innerHTML = "";
  
  // On filtre le tableau global localement pour être ultra rapide
  let filtre = toutesLesAnnonces.filter(a => {
    let matchV = a.ville.toLowerCase().includes(fVille);
    let matchT = true;
    if(fType === "STANDARD") matchT = (a.is_vip === false);
    if(fType === "VIP") matchT = (a.is_vip === true);
    return matchV && matchT;
  });

  if(filtre.length === 0) { list.innerHTML = "<p style='color:gray; font-size:0.8rem;'>Aucune correspondance.</p>"; return; }

  filtre.forEach(a => {
    list.innerHTML += `
      <div class="admin-item-row" id="admin-row-${a.id}">
        <div>
          <b style="color:white;">${a.titre}</b> [${a.is_vip ? '👑 VIP' : 'STD'}]<br>
          <span style="color:#94a3b8;">📍 ${a.ville} | 📞 Prop: ${a.telephone}</span>
        </div>
        <button onclick="supprimerAnnonce(${a.id})" style="background:var(--danger); border:none; padding:6px 12px; border-radius:6px; color:white; font-weight:bold; cursor:pointer;">Supprimer 🗑️</button>
      </div>`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadFeed();
  lancerBanniereAdsenseRotative();
});
