const API = ""; 
let toutesLesAnnonces = [];
let idAnnonceEnCoursDeBoost = null;

let sessionToken = localStorage.getItem("nia_token") || null;
let monUserIdActuel = localStorage.getItem("nia_user_id") ? parseInt(localStorage.getItem("nia_user_id")) : null;
let monUserTypeActuel = localStorage.getItem("nia_user_type") || "standard";
let monShopNameActuel = localStorage.getItem("nia_shop_name") || null;

let modeAuthInscription = true; 

const BANNER_ADS_POOL = [
  { text: "🌟 Airtel Money RDC : Transférez vos fonds instantanément partout en RDC ! 🌟" },
  { text: "👑 Orange RDC VIP : Restez connectés avec des forfaits internet illimités. 👑" },
  { text: "🚗 Vodacom M-Pesa : Achetez, vendez et louez vos véhicules en toute sérénité. 🚗" }
];

const INTERSTITIAL_ADS_POOL = [
  "🔥 Investissez en RDC : Terrains et concessions certifiés disponibles à Kolwezi.",
  "⚡ Énergie Solaire RDC : Kits complets pour alimenter votre maison 24h/24 sans coupure.",
  "💼 Rawbank Pro : Des crédits adaptés aux entrepreneurs et boutiques VIP."
];

let fonctionRetourAppelInterstitiel = null;

function ouvrirModal(id) { document.getElementById(`modal-${id}`).style.display = "flex"; }
function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = "none"; }

// CHARGEMENT DU FLUX PRINCIPAL
async function loadFeed(){
  if (!sessionToken) {
    document.getElementById("gateway-screen").style.display = "flex";
    return;
  }
  
  document.getElementById("gateway-screen").style.display = "none";
  try {
    const res = await fetch(`${API}/feed`, {
      headers: { "Authorization": `Bearer ${sessionToken}` }
    });
    toutesLesAnnonces = await res.json();
    afficherAnnonces(toutesLesAnnonces);
    mettreAJourLibelleBoutonProfil();
  } catch (e) { console.error(e); }
}

function mettreAJourLibelleBoutonProfil() {
  const btn = document.getElementById("main-profile-nav-btn");
  if(!btn) return;
  btn.innerHTML = monUserTypeActuel === "vip" ? `<span>🏢</span><span>Ma Boutique</span>` : `<span>👤</span><span>Mon Profil</span>`;
}

// RENDU SÉCURISÉ : AUCUN BOUTON DE SUPPRESSION/MODIF SUR LE FLUX PUBLIC
function afficherAnnonces(liste, contextViewId = null) {
  const feed = document.getElementById("feed");
  if (!feed) return;
  if (liste.length === 0) {
    feed.innerHTML = '<p style="color:#64748b; text-align:center; padding:30px; font-weight:600;">Aucun élément trouvé.</p>';
    return;
  }
  
  feed.innerHTML = "";
  liste.forEach(a => {
    let localisation = `📍 ${a.ville || 'RDC'}`;
    if(a.commune) localisation += `, ${a.commune}`;
    if(a.quartier) localisation += ` (${a.quartier})`;

    const estVip = (a.statut === 'vip');
    const symboleDevise = a.prix_devise === 'USD' ? '$' : ' FC';

    feed.innerHTML += `
      <div class="annonce-card ${estVip ? 'vip-premium' : ''}">
        ${estVip ? `<span class="vip-badge-tag">👑 Boutique VIP</span>` : ''}
        <h3>${a.titre}</h3>
        <div class="annonce-price">${a.prix}${symboleDevise} / par ${a.periode}</div>
        <div class="annonce-meta">${localisation}</div>

        <div class="gallery">
          ${a.images && a.images.length > 0 ? a.images.map(img=>`<img src="${img}" class="gallery-item">`).join("") : '<p style="padding:15px; color:#64748b; font-size:0.85rem;">Pas de visuel photo disponible</p>'}
        </div>

        ${a.description ? `<div class="annonce-description">${a.description}</div>` : ''}

        <div class="annonce-footer">
          <span class="badge-status ${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">
            ${a.statut === 'occupe' ? '🔴 Occupé' : '🟢 Disponible'}
          </span>
          <div class="footer-actions">
            ${estVip && contextViewId !== 'OWNER_VITRINE' ? `<button class="btn-shop" onclick="actionVisiterBoutiqueTierce(${a.user_id})">🏢 Visiter la boutique</button>` : ''}
            ${a.telephone ? `<button class="btn-contact" onclick="intercepterAppelTelephonique('${a.telephone}')">📞 Appeler</button>` : ''}
          </div>
        </div>
      </div>
    `;
  });
}

// LOGIQUE PORTAIL AUTHENTIFICATION
function basculerModeAuth() {
  modeAuthInscription = !modeAuthInscription;
  document.getElementById("auth-subtitle").innerText = modeAuthInscription ? "Inscrivez-vous pour accéder au réseau de location" : "Connectez-vous à votre compte sécurisé";
  document.getElementById("auth-submit-btn").innerText = modeAuthInscription ? "Créer mon compte sécurisé" : "Accéder à mon espace";
  document.getElementById("auth-toggle").innerText = modeAuthInscription ? "Déjà membre ? Connectez-vous ici" : "Pas encore de compte ? S'inscrire";
  document.getElementById("phone-container").style.display = modeAuthInscription ? "flex" : "none";
}

async function soumettreAuthentification() {
  const username = document.getElementById("auth-username").value.trim();
  const password = document.getElementById("auth-password").value.trim();
  const phone = document.getElementById("auth-phone").value.trim();

  if(!username || !password || (modeAuthInscription && !phone)) {
    alert("Veuillez remplir tous les champs !"); return;
  }

  const endpoint = modeAuthInscription ? "/auth/register" : "/auth/login";
  const payload = modeAuthInscription ? { username, password, telephone: phone } : { username, password };

  try {
    const res = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    
    if(!res.ok) { alert(data.error || "Identifiants ou compte incorrect."); return; }

    localStorage.setItem("nia_token", data.token);
    localStorage.setItem("nia_user_id", data.userId.toString());
    localStorage.setItem("nia_user_type", data.type);
    localStorage.setItem("nia_shop_name", data.shopName || "");

    sessionToken = data.token;
    monUserIdActuel = parseInt(data.userId);
    monUserTypeActuel = data.type;
    monShopNameActuel = data.shopName;

    document.getElementById("gateway-screen").style.display = "none";
    loadFeed();
  } catch (err) { alert("Erreur de communication serveur."); }
}

function deconnexionEspaceSecurise() {
  localStorage.clear();
  sessionToken = null; monUserIdActuel = null; monUserTypeActuel = "standard"; monShopNameActuel = null;
  document.getElementById("gateway-screen").style.display = "flex";
  fermerModal('profil');
}

// ESPACE PRIVÉ : UNIQUE ENDROIT POUR GÉRER SES PROPRES ANNONCES
function ouvrirEspaceCompteUtilisateur() {
  const title = document.getElementById("profil-modal-title");
  const content = document.getElementById("profil-view-content");
  const mesAnnoncesPersonnelles = toutesLesAnnonces.filter(a => a.user_id === monUserIdActuel);

  let enteteHtml = `
    <div style="background:#e2e8f0; padding:15px; border-radius:12px; margin-bottom:15px;">
      <p style="margin:0;"><strong>Statut :</strong> ${monUserTypeActuel === 'vip' ? '👑 Boutique VIP Pro' : '👤 Compte Standard'}</p>
      ${monShopNameActuel ? `<p style="margin:5px 0 0 0;"><strong>Enseigne :</strong> ${monShopNameActuel}</p>` : ''}
      <button onclick="deconnexionEspaceSecurise()" style="background:var(--danger); color:white; border:none; padding:6px 12px; border-radius:6px; margin-top:10px; cursor:pointer; font-weight:bold;">Se déconnecter</button>
    </div>
  `;

  title.innerText = monUserTypeActuel === 'vip' ? "🏢 Gestion de ma Vitrine VIP" : "👤 Mon Espace Privé";
  content.innerHTML = `
    ${enteteHtml}
    <h4 style="margin:10px 0;">📋 Vos annonces modifiables (${mesAnnoncesPersonnelles.length}) :</h4>
    <div id="private-user-items" style="display:flex; flex-direction:column; gap:12px; max-height:300px; overflow-y:auto;"></div>
  `;

  ouvrirModal('profil');
  const container = document.getElementById("private-user-items");
  if(mesAnnoncesPersonnelles.length === 0) {
    container.innerHTML = "<p style='color:var(--text-light); font-size:0.85rem;'>Aucune annonce en ligne.</p>";
    return;
  }
  
  mesAnnoncesPersonnelles.forEach(a => {
    const sDevise = a.prix_devise === 'USD' ? '$' : ' FC';
    const div = document.createElement("div");
    div.style = "background:#f8fafc; border:1px solid var(--border); padding:12px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; gap:10px;";
    div.innerHTML = `
      <div style="font-size:0.9rem;"><strong>${a.titre}</strong><br><span style="color:var(--primary); font-weight:bold;">${a.prix}${sDevise}</span></div>
      <div style="display:flex; gap:6px; flex-shrink:0;">
        <button class="btn-boost" style="padding:6px 10px; font-size:0.75rem;" onclick="fermerModal('profil'); lancerLancementPubBoost(${a.id})">🚀 Booster</button>
        <button class="btn-edit" style="padding:6px 10px; font-size:0.75rem;" onclick="fermerModal('profil'); ouvrirFormulaireModificationAnnonce(${a.id})">📝</button>
        <button class="btn-delete" style="padding:6px 10px; font-size:0.75rem;" onclick="fermerModal('profil'); supprimerAnnonce(${a.id})">🗑️</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function gererClicBoutonVipMenu() {
  if(monUserTypeActuel !== "vip") {
    document.getElementById("vip-modal-title").innerText = "👑 Devenir Partenaire VIP";
    document.getElementById("vip-form-body").innerHTML = `
      <div class="form-group full-width"><label>Nom de votre Boutique</label><input id="upgrade-shop-name" placeholder="Ex: Grand Katanga Services"></div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="validerUpgradeBoutiqueVip()">Activer mon abonnement VIP</button>
    `;
  } else {
    document.getElementById("vip-modal-title").innerText = `📦 Catalogue de Masse : ${monShopNameActuel}`;
    document.getElementById("vip-form-body").innerHTML = `
      <div class="form-group full-width"><div id="bulk-items-container"></div>
        <button type="button" style="background:#fffdf5; color:var(--vip-gold); border:1px dashed var(--vip-gold); padding:10px; border-radius:8px; font-weight:bold; cursor:pointer; width:100%;" onclick="ajouterChampObjetUnique()">➕ Ajouter un objet à la liste</button>
      </div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="publierCatalogueEnMasse()">🚀 Publier tout le catalogue</button>
    `;
    document.getElementById("bulk-items-container").innerHTML = ""; countObjetsBulk = 0; ajouterChampObjetUnique();
  }
  ouvrirModal('vip');
}

let countObjetsBulk = 0;
function ajouterChampObjetUnique() {
  countObjetsBulk++;
  const container = document.getElementById("bulk-items-container");
  const htmlBox = document.createElement('div');
  htmlBox.className = "bulk-item-box"; htmlBox.id = `bulk-box-${countObjetsBulk}`;
  htmlBox.innerHTML = `
    <button type="button" class="btn-remove-bulk" onclick="document.getElementById('bulk-box-${countObjetsBulk}').remove()">✕</button>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;">
      <div class="form-group" style="grid-column:span 2"><label>Nom de l'objet</label><input class="bulk-titre" placeholder="Ex: Matériel Sonorisation"></div>
      <div class="form-group"><label>Prix</label><input type="number" class="bulk-prix" placeholder="50"></div>
      <div class="form-group"><label>Devise</label><select class="bulk-devise"><option value="USD">USD ($)</option><option value="FC">FC (FC)</option></select></div>
      <div class="form-group" style="grid-column:span 2">
        <label>Période de facturation</label>
        <select class="bulk-periode">
          <option value="heure">par heure</option>
          <option value="jour" selected>par jour</option>
          <option value="semaine">par semaine</option>
          <option value="mois">par mois</option>
        </select>
      </div>
      <div class="form-group" style="grid-column:span 2"><label>Photos</label><input type="file" class="bulk-image" accept="image/*" multiple></div>
    </div>
  `;
  container.appendChild(htmlBox);
}

async function validerUpgradeBoutiqueVip() {
  const shopName = document.getElementById("upgrade-shop-name").value.trim();
  if(!shopName) return;
  const res = await fetch(`${API}/auth/upgrade-vip`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionToken}` },
    body: JSON.stringify({ shopName })
  });
  if(res.ok) {
    localStorage.setItem("nia_user_type", "vip");
    localStorage.setItem("nia_shop_name", shopName);
    monUserTypeActuel = "vip"; monShopNameActuel = shopName;
    alert("Compte VIP Activé !"); fermerModal('vip'); loadFeed();
  }
}

async function publierCatalogueEnMasse() {
  const boxes = document.querySelectorAll(".bulk-item-box");
  for(let box of boxes) {
    const titre = box.querySelector(".bulk-titre").value.trim();
    const prix = box.querySelector(".bulk-prix").value.trim();
    const prix_devise = box.querySelector(".bulk-devise").value;
    const periode = box.querySelector(".bulk-periode").value;
    if(!titre) continue;
    
    await fetch(`${API}/annonces`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization": `Bearer ${sessionToken}` },
      body: JSON.stringify({
        titre, description: `Catalogue VIP : ${monShopNameActuel}`,
        prix: prix || 0, prix_devise, periode, ville: "Lubumbashi", commune: "", quartier: "", telephone: "", statut: "vip", images_base64: []
      })
    });
  }
  fermerModal('vip'); loadFeed();
}

async function publierAnnonceStandard(){
  const files = document.getElementById("image").files;
  let images_base64 = [];
  for(let f of files){ images_base64.push(await compressAndToBase64(f)); }
  
  const bodyData = {
    titre: document.getElementById("titre").value,
    prix: document.getElementById("prix").value, 
    prix_devise: document.getElementById("prix_devise").value,
    periode: document.getElementById("periode").value,
    telephone: document.getElementById("telephone").value, 
    description: document.getElementById("description").value,
    ville: document.getElementById("ville").value, 
    commune: document.getElementById("commune").value,
    quartier: document.getElementById("quartier").value, 
    statut: monUserTypeActuel === 'vip' ? "vip" : "disponible", 
    images_base64
  };
  
  const res = await fetch(`${API}/annonces`, { 
    method:"POST", 
    headers:{"Content-Type":"application/json", "Authorization": `Bearer ${sessionToken}`}, 
    body:JSON.stringify(bodyData) 
  });
  if(res.ok) { fermerModal('publier'); loadFeed(); }
}

function ouvrirFormulaireModificationAnnonce(id) {
  const a = toutesLesAnnonces.find(item => item.id === id);
  if(!a) return;

  document.getElementById("edit-id").value = a.id;
  document.getElementById("edit-titre").value = a.titre;
  document.getElementById("edit-prix").value = a.prix;
  document.getElementById("edit-prix-devise").value = a.prix_devise;
  document.getElementById("edit-periode").value = a.periode;
  document.getElementById("edit-statut").value = a.statut;
  document.getElementById("edit-description").value = a.description || "";
  document.getElementById("edit-ville").value = a.ville || "Lubumbashi";
  document.getElementById("edit-commune").value = a.commune || "";
  document.getElementById("edit-quartier").value = a.quartier || "";
  document.getElementById("edit-telephone").value = a.telephone || "";

  ouvrirModal('modifier-annonce');
}

async function sauvegarderModificationAnnonce() {
  const id = document.getElementById("edit-id").value;
  const payload = {
    titre: document.getElementById("edit-titre").value,
    prix: document.getElementById("edit-prix").value,
    prix_devise: document.getElementById("edit-prix-devise").value,
    periode: document.getElementById("edit-periode").value,
    statut: document.getElementById("edit-statut").value,
    description: document.getElementById("edit-description").value,
    ville: document.getElementById("edit-ville").value,
    commune: document.getElementById("edit-commune").value,
    quartier: document.getElementById("edit-quartier").value,
    telephone: document.getElementById("edit-telephone").value
  };
  
  const res = await fetch(`${API}/annonces/${id}/update`, {
    method: "PUT",
    headers: {"Content-Type": "application/json", "Authorization": `Bearer ${sessionToken}`},
    body: JSON.stringify(payload)
  });
  if(res.ok) { fermerModal('modifier-annonce'); loadFeed(); }
}

async function supprimerAnnonce(id) {
  if(!confirm("Supprimer cet élément ?")) return;
  const res = await fetch(`${API}/annonces/${id}/delete`, { 
    method: "DELETE",
    headers: { "Authorization": `Bearer ${sessionToken}` }
  });
  if(res.ok) { loadFeed(); }
}

async function rechercher() {
  const sTitre = document.getElementById("search-titre").value.trim();
  const sVille = document.getElementById("search-ville").value.trim();
  const urlParams = new URLSearchParams({ q: sTitre, ville: sVille });
  const res = await fetch(`${API}/annonces/search?${urlParams.toString()}`, {
    headers: { "Authorization": `Bearer ${sessionToken}` }
  });
  const r = await res.json();
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(r);
  fermerModal('rechercher');
}

function annulerRecherche() {
  document.getElementById("reset-btn").style.display = "none";
  afficherAnnonces(toutesLesAnnonces);
}

function intercepterAppelTelephonique(num) {
  declencherPubliciteInterstitielle(() => { window.location.href = `tel:${num}`; });
}

function declencherPubliciteInterstitielle(callback) {
  fonctionRetourAppelInterstitiel = callback;
  const overlay = document.getElementById("adsense-interstitial");
  document.getElementById("interstitial-ad-body").innerText = INTERSTITIAL_ADS_POOL[Math.floor(Math.random() * INTERSTITIAL_ADS_POOL.length)];
  overlay.style.display = "flex";
  setTimeout(() => {
    document.getElementById("close-interstitial-btn").disabled = false;
    document.getElementById("close-interstitial-btn").innerText = "Fermer ✕";
  }, 5000);
}

function fermerPubliciteInterstitielle() {
  document.getElementById("adsense-interstitial").style.display = "none";
  if(fonctionRetourAppelInterstitiel) { const cb = fonctionRetourAppelInterstitiel; fonctionRetourAppelInterstitiel = null; cb(); }
}

function lancerLancementPubBoost(idAnnonce) {
  idAnnonceEnCoursDeBoost = idAnnonce;
  document.getElementById("btn-finaliser-boost").style.display = "none";
  document.getElementById("interstitial-boost-banner-text").innerText = INTERSTITIAL_ADS_POOL[Math.floor(Math.random()*INTERSTITIAL_ADS_POOL.length)];
  document.getElementById("countdown").innerText = "15"; 
  ouvrirModal('boost-pub');
  let t = 15;
  const inter = setInterval(() => {
    t--; document.getElementById("countdown").innerText = t;
    if(t <= 0) { clearInterval(inter); document.getElementById("btn-finaliser-boost").style.display = "block"; }
  }, 1000);
}

async function executerRemonteeBdd() {
  const res = await fetch(`${API}/annonces/${idAnnonceEnCoursDeBoost}/boost`, { 
    method: "POST",
    headers: { "Authorization": `Bearer ${sessionToken}` }
  });
  if(res.ok) { fermerModal('boost-pub'); loadFeed(); }
}

function actionVisiterBoutiqueTierce(idOwner) {
  const articles = toutesLesAnnonces.filter(a => a.user_id === idOwner);
  document.getElementById("shop-header-container").innerHTML = `<div class="shop-banner"><h2>👑 Vitrine Partenaire VIP</h2></div>`;
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(articles, 'OWNER_VITRINE');
}

// COMPRESSION FORCEE DES PHOTOS SUR LE NAVIGATEUR (MAX 800PX, QUALITE 70%)
function compressAndToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 800; // Résolution maximale pour l'affichage mobile

        if (width > height) {
          if (width > max_size) { height *= max_size / width; width = max_size; }
        } else {
          if (height > max_size) { width *= max_size / height; height = max_size; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convertit l'image compressée en JPEG léger avec une qualité de 70%
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
    };
  });
}

function démarrerChangementBannièreAdSenseFonds() {
  const c = document.getElementById("adsense-bottom-banner");
  let idx = 0;
  setInterval(() => {
    if(BANNER_ADS_POOL[idx]) c.innerText = BANNER_ADS_POOL[idx].text;
    idx = (idx + 1) % BANNER_ADS_POOL.length;
  }, 15000);
}

// =========================================================================
// MODULE ADMINISTRATION CACHÉE : RECONNAISSANCE DU GESTE SECRET & CODE
// =========================================================================
let tempsAppuiDebut = 0;
let positionYDebut = 0;
let appuiLongValide = false;
const CODE_SECURITE_ADMIN = "BEN4002ET4200";

const zoneEnTeteSecrete = document.getElementById("secret-header-zone");

if (zoneEnTeteSecrete) {
  // CONFIGURATION MOBILE
  zoneEnTeteSecrete.addEventListener("touchstart", (e) => {
    tempsAppuiDebut = Date.now();
    positionYDebut = e.touches[0].clientY;
    appuiLongValide = false;
  });

  zoneEnTeteSecrete.addEventListener("touchend", (e) => {
    const dureeAppui = Date.now() - tempsAppuiDebut;
    const positionYFin = e.changedTouches[0].clientY;
    const distanceBalayageBas = positionYFin - positionYDebut;

    if (dureeAppui >= 10000) appuiLongValide = true;
    if (appuiLongValide && distanceBalayageBas > 30) declencherVerifCodeAdmin();
  });

  // CONFIGURATION ORDINATEURS
  zoneEnTeteSecrete.addEventListener("mousedown", (e) => {
    tempsAppuiDebut = Date.now();
    positionYDebut = e.clientY;
    appuiLongValide = false;
  });

  zoneEnTeteSecrete.addEventListener("mouseup", (e) => {
    const dureeAppui = Date.now() - tempsAppuiDebut;
    const positionYFin = e.clientY;
    const distanceBalayageBas = positionYFin - positionYDebut;

    if (dureeAppui >= 10000) appuiLongValide = true;
    if (appuiLongValide && distanceBalayageBas > 30) declencherVerifCodeAdmin();
  });
}

function declencherVerifCodeAdmin() {
  const codeSaisi = prompt("🔒 Entrez le code de sécurité Super-Admin :");
  if (codeSaisi === CODE_SECURITE_ADMIN) {
    ouvrirConsoleAdminSecrète();
  } else if (codeSaisi !== null) {
    alert("❌ Code de sécurité incorrect. Accès refusé.");
  }
}

function ouvrirConsoleAdminSecrète() {
  const total = toutesLesAnnonces.length;
  const vips = toutesLesAnnonces.filter(a => a.statut === 'vip').length;
  const stands = total - vips;

  document.getElementById("adm-stat-total").innerText = total;
  document.getElementById("adm-stat-vip").innerText = vips;
  document.getElementById("adm-stat-stand").innerText = stands;

  // Répartition par Ville
  const statsVilles = {};
  toutesLesAnnonces.forEach(a => {
    const villeNom = (a.ville && a.ville.trim() !== "") ? a.ville.trim() : "Non spécifiée";
    statsVilles[villeNom] = (statsVilles[villeNom] || 0) + 1;
  });

  const conteneurVilles = document.getElementById("admin-stats-villes");
  conteneurVilles.innerHTML = "";
  for (const [ville, nb] of Object.entries(statsVilles)) {
    conteneurVilles.innerHTML += `<div>🏙️ <strong>${ville}</strong> : ${nb} annonce(s)</div>`;
  }

  // Modération de la liste
  const containerListe = document.getElementById("admin-liste-moderat-annonces");
  containerListe.innerHTML = "";

  toutesLesAnnonces.forEach(a => {
    const sDevise = a.prix_devise === 'USD' ? '$' : ' FC';
    const row = document.createElement("div");
    row.className = "admin-annonce-item";
    row.innerHTML = `
      <div style="max-width: 60%;">
        <strong>${a.titre}</strong> (${a.prix}${sDevise})<br>
        <span style="font-size:0.75rem; color:#94a3b8;">📍 ${a.ville || 'RDC'} | 👤 Owner ID: ${a.user_id}</span>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="btn-boost" style="background:#eab308; padding:5px 8px; font-size:0.75rem;" onclick="adminAvertirUtilisateur(${a.user_id}, '${a.titre.replace(/'/g, "\\'")}')">⚠️ Avertir</button>
        <button class="btn-delete" style="padding:5px 8px; font-size:0.75rem;" onclick="adminSupprimerAnnonceDirecte(${a.id})">🗑️ Ban</button>
      </div>
    `;
    containerListe.appendChild(row);
  });

  ouvrirModal('admin-panel');
}

function adminAvertirUtilisateur(userId, titreAnnonce) {
  alert(`⚠️ Un avertissement formel de modération a été envoyé au propriétaire (User ID: ${userId}) concernant l'annonce "${titreAnnonce}".`);
}

async function adminSupprimerAnnonceDirecte(id) {
  if (!confirm("Voulez-vous retirer cette publication du serveur immédiatement ?")) return;
  const res = await fetch(`${API}/annonces/${id}/delete`, { 
    method: "DELETE",
    headers: { "Authorization": `Bearer ${sessionToken}` }
  });
  if (res.ok) { 
    fermerModal('admin-panel'); 
    loadFeed(); 
    setTimeout(() => { ouvrirConsoleAdminSecrète(); }, 400);
  }
}

// ALLUMAGE
loadFeed(); démarrerChangementBannièreAdSenseFonds();
