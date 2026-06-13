const API = ""; // METTRE ICI L'URL DE TON SERVEUR RENDER
let toutesLesAnnonces = [];
let utilisateurConnecte = null; 

let actionAExecuterApresAd = null;
const BANNER_ADS = [
  "Vodacom Congo : Restez connectés au réseau 4G le plus rapide de la RDC ! 🌐",
  "Airtel Money : Envoyez et retirez votre argent instantanément à taux réduit 💸",
  "Orange RDC : Vos forfaits internet préférés sont à portée de clic. Profitez-en ! 📱",
  "Rawbank : Épargnez et financez vos projets immobiliers en toute confiance 🏦",
  "Trust Merchant Bank (TMB) : Notre banque, votre force partout au Congo 🤝"
];
let currentAdIndex = 0;

const DICTIONNAIRE_SYNONYMES = {
  "maison": ["villa", "parcelle", "flat", "appartement", "chambre", "studio", "maizn"],
  "flat": ["appartement", "maison", "chambre", "studio", "logement"],
  "appartement": ["flat", "maison", "chambre", "studio", "villa"],
  "robe": ["habit", "vetement", "pagne", "veste", "chemise", "costume"],
  "habit": ["robe", "vetement", "pagne", "veste", "chemise", "tissu"],
  "auto": ["voiture", "vehicule", "jeep", "camion", "bus", "moto"],
  "voiture": ["auto", "vehicule", "jeep", "camion", "bus", "moto"]
};

function calculerDistanceLevenshtein(a, b) {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) { tmp[i] = [i]; }
  for (let j = 0; j <= b.length; j++) { tmp[0][j] = j; }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

function verifierCorrespondanceIntelligente(motSaisi, motBase) {
  const s = motSaisi.toLowerCase().trim();
  const b = motBase.toLowerCase().trim();
  if (b.includes(s) || s.includes(b)) return true;

  for (let cle in DICTIONNAIRE_SYNONYMES) {
    if (s === cle || DICTIONNAIRE_SYNONYMES[cle].includes(s)) {
      if (b.includes(cle) || DICTIONNAIRE_SYNONYMES[cle].some(syn => b.includes(syn))) {
        return true;
      }
    }
  }

  const distance = calculerDistanceLevenshtein(s, b);
  if (s.length > 4 && distance <= 2) return true;
  if (s.length <= 4 && distance <= 1) return true;

  return false;
}

function declencherPubliciteInterstitielle(actionSuivante) {
  actionAExecuterApresAd = actionSuivante;
  const modalAd = document.getElementById("interstitial-ad");
  const closeBtn = document.getElementById("interstitial-close-btn");
  
  closeBtn.disabled = true;
  closeBtn.innerText = "Patientez (5s)...";
  modalAd.classList.remove("hidden");

  let tempsRestant = 5;
  const compteARebours = setInterval(() => {
    tempsRestant--;
    if (tempsRestant > 0) {
      closeBtn.innerText = `Patientez (${tempsRestant}s)...`;
    } else {
      clearInterval(compteARebours);
      closeBtn.disabled = false;
      closeBtn.innerText = "Fermer l'annonce ✕";
    }
  }, 1000);
}

function fermerPubliciteInterstitielle() {
  document.getElementById("interstitial-ad").classList.add("hidden");
  if (actionAExecuterApresAd) {
    actionAExecuterApresAd();
    actionAExecuterApresAd = null;
  }
}

function initialiserBanniereAdSenseRotative() {
  const adText = document.getElementById("adsense-text-rotation");
  if (!adText) return;
  setInterval(() => {
    currentAdIndex = (currentAdIndex + 1) % BANNER_ADS.length;
    adText.innerText = BANNER_ADS[currentAdIndex];
  }, 30000);
}

function ouvrirModal(id) { document.getElementById(`modal-${id}`).classList.remove("hidden"); }
function fermerModal(id) { document.getElementById(`modal-${id}`).classList.add("hidden"); }

function verifierSession() {
  const session = localStorage.getItem("nia_user_session");
  if (session) {
    utilisateurConnecte = JSON.parse(session);
    masquerEcranAuth();
    loadFeed();
  }
}

function basculerAuth(versInscription) {
  if (versInscription) {
    document.getElementById("form-connexion").classList.add("hidden");
    document.getElementById("form-inscription").classList.remove("hidden");
  } else {
    document.getElementById("form-inscription").classList.add("hidden");
    document.getElementById("form-connexion").classList.remove("hidden");
  }
}

function masquerEcranAuth() {
  document.getElementById("auth-screen").classList.add("hidden");
  const navBtnLabel = document.getElementById("main-profile-nav-btn");
  if (utilisateurConnecte && utilisateurConnecte.is_vip && navBtnLabel) {
    navBtnLabel.innerHTML = `<span>🏢</span><span>Ma Boutique</span>`;
  }
}

async function executerInscription() {
  const tel = document.getElementById("auth-reg-phone").value.trim();
  const pass = document.getElementById("auth-reg-pass").value.trim();
  if(!tel || !pass) return alert("Champs requis !");
  const res = await fetch(`${API}/auth/inscription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telephone: tel, password: pass })
  });
  const data = await res.json();
  if(data.success) { alert("Compte créé ! Connectez-vous."); basculerAuth(false); } else { alert(data.error); }
}

async function executerConnexion() {
  const tel = document.getElementById("auth-login-phone").value.trim();
  const pass = document.getElementById("auth-login-pass").value.trim();
  if(!tel || !pass) return alert("Identifiants requis !");
  const res = await fetch(`${API}/auth/connexion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telephone: tel, password: pass })
  });
  const data = await res.json();
  if(data.success) {
    utilisateurConnecte = data.user;
    localStorage.setItem("nia_user_session", JSON.stringify(data.user));
    masquerEcranAuth();
    loadFeed();
  } else { alert(data.error); }
}

async function loadFeed(){
  try {
    const res = await fetch(`${API}/feed`);
    toutesLesAnnonces = await res.json();
    afficherAnnonces(toutesLesAnnonces);
  } catch (e) { console.error(e); }
}

function afficherAnnonces(liste, context = null) {
  const feed = document.getElementById("feed");
  if (!feed) return;
  if (!liste || liste.length === 0) {
    feed.innerHTML = '<p style="color:#64748b; text-align:center; padding:30px; font-weight:600;">Aucun résultat disponible.</p>';
    return;
  }
  
  feed.innerHTML = "";
  liste.forEach(a => {
    let loc = `📍 ${a.ville || 'RDC'}`;
    if(a.commune) loc += `, ${a.commune}`;
    if(a.quartier) loc += ` (${a.quartier})`;

    const estVip = (a.statut === 'vip');

    feed.innerHTML += `
      <div class="annonce-card ${estVip ? 'vip-premium' : ''}">
        ${estVip ? `<span class="vip-badge-tag">👑 Boutique Pro</span>` : ''}
        <h3 style="margin:0 0 5px 0;">${a.titre}</h3>
        <div class="annonce-price">${a.prix} ${a.devise || '$'} / par ${a.periode || 'jour'}</div>
        <div class="annonce-meta">${loc}</div>

        <div class="gallery">
          ${a.images && a.images.length > 0 ? a.images.map(img=>`<img src="${img}" class="gallery-item">`).join("") : '<p style="padding:10px; color:#64748b; font-size:0.8rem;">Aucune photo</p>'}
        </div>

        ${a.description ? `<div class="annonce-description">${a.description}</div>` : ''}

        <div class="annonce-footer">
          <span class="badge-status ${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">
            ${a.statut === 'occupe' ? '🔴 Occupé' : '🟢 Disponible'}
          </span>
          <div class="footer-actions">
            ${estVip && context !== 'OWNER_VIEW' ? `<button class="btn-shop" onclick="visiterBoutique(${a.user_id}, \`${a.description || ''}\`)">🏢 Vitrine</button>` : ''}
            
            ${utilisateurConnecte && a.user_id === utilisateurConnecte.id ? `
              <button class="btn-boost" onclick="declencherPubliciteInterstitielle(() => executerRemonteeBdd(${a.id}))">🚀 Booster</button>
              <button class="btn-edit" onclick="ouvrirFormulaireModificationAnnonce(${a.id})">📝 Éditer</button>
              <button class="btn-delete" onclick="supprimerAnnonce(${a.id})">🗑️ Retirer</button>
            ` : ''}
            
            ${a.telephone ? `<button class="btn-contact" onclick="declencherPubliciteInterstitielle(() => window.location.href='tel:${a.telephone}')">📞 Appeler</button>` : ''}
          </div>
        </div>
      </div>
    `;
  });
}

function rechercher() {
  const sTitre = document.getElementById("search-titre").value.toLowerCase().trim();
  const sVille = document.getElementById("search-ville").value.toLowerCase().trim();
  const sCommune = document.getElementById("search-commune").value.toLowerCase().trim();
  const sQuartier = document.getElementById("search-quartier").value.toLowerCase().trim();

  const filtre = toutesLesAnnonces.filter(a => {
    let matchTitre = true;
    if (sTitre) {
      const contenuAnnonce = `${a.titre} ${a.description || ''}`;
      matchTitre = verifierCorrespondanceIntelligente(sTitre, contenuAnnonce);
    }
    const matchVille = !sVille || (a.ville && a.ville.toLowerCase().includes(sVille));
    const matchCommune = !sCommune || (a.commune && a.commune.toLowerCase().includes(sCommune));
    const matchQuartier = !sQuartier || (a.quartier && a.quartier.toLowerCase().includes(sQuartier));
    return matchTitre && matchVille && matchCommune && matchQuartier;
  });

  document.getElementById("shop-header-container").innerHTML = "";
  document.getElementById("feed-title").innerText = "Résultats Intelligents 🔍";
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(filtre, 'PUBLIC_SEARCH');
  fermerModal('rechercher');
}

function annulerRecherche() {
  document.getElementById("shop-header-container").innerHTML = "";
  document.getElementById("feed-title").innerText = "Annonces récentes";
  document.getElementById("reset-btn").style.display = "none";
  afficherAnnonces(toutesLesAnnonces);
}

function visiterBoutique(boutiqueUserId, desc) {
  let nom = "Boutique Exclusive";
  if(desc && desc.includes("VIP :")) { nom = desc.split("VIP :")[1].trim(); }
  const net = toutesLesAnnonces.filter(a => a.user_id === boutiqueUserId);
  document.getElementById("shop-header-container").innerHTML = `
    <div class="shop-banner"><h2>👑 Boutique ${nom}</h2><p style="margin:4px 0 0 0; font-size:0.85rem; color:#78350f;">Partenaire Pro NIA RDC</p></div>
  `;
  document.getElementById("feed-title").innerText = "Articles de l'établissement";
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(net, 'VISITOR_MODE');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function ouvrirFormulaireModificationAnnonce(id) {
  const a = toutesLesAnnonces.find(o => o.id === id);
  if(!a) return;
  fermerModal('profil');
  document.getElementById("edit-id").value = a.id;
  document.getElementById("edit-titre").value = a.titre;
  document.getElementById("edit-prix").value = a.prix;
  document.getElementById("edit-devise").value = a.devise || "$";
  document.getElementById("edit-periode").value = a.periode || "jour";
  document.getElementById("edit-statut").value = a.statut;
  document.getElementById("edit-description").value = a.description || "";
  document.getElementById("edit-ville").value = a.ville || "Lubumbashi";
  document.getElementById("edit-commune").value = a.commune || "";
  document.getElementById("edit-quartier").value = a.quartier || "";
  document.getElementById("edit-telephone").value = a.telephone || "";
  ouvrirModal('modifier-annonce');
}

function ouvrirMonProfilOuMaBoutique() {
  const title = document.getElementById("profil-modal-title");
  const content = document.getElementById("profil-view-content");
  if(!utilisateurConnecte) return;

  const mesAnnonces = toutesLesAnnonces.filter(a => a.user_id === utilisateurConnecte.id);

  if(!utilisateurConnecte.is_vip) {
    title.innerText = "👤 Profil Personnel (Standard)";
    content.innerHTML = `
      <p><strong>Statut :</strong> Utilisateur Standard</p>
      <p><strong>Téléphone :</strong> ${utilisateurConnecte.telephone}</p>
      <h4 style="margin-top:15px;">📋 Mes fiches (${mesAnnonces.length}) :</h4>
      <div id="sub-list" style="display:flex; flex-direction:column; gap:8px;"></div>
    `;
    const subList = content.querySelector("#sub-list");
    if(mesAnnonces.length === 0) { subList.innerHTML = "<p style='color:#64748b; font-size:0.85rem;'>Aucune annonce en ligne.</p>"; }
    else {
      mesAnnonces.forEach(o => {
        subList.innerHTML += `
          <div style="background:#f1f5f9; padding:12px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
            <div><strong>${o.titre}</strong><br><span style="font-size:0.75rem; color:#64748b;">${o.prix} ${o.devise || '$'} / par ${o.periode || 'jour'}</span></div>
            <div style="display:flex; gap:4px;">
              <button class="btn-boost" style="padding:4px 8px; font-size:0.75rem;" onclick="declencherPubliciteInterstitielle(() => executerRemonteeBdd(${o.id}))">🚀 Booster</button>
              <button class="btn-edit" style="padding:4px 8px; font-size:0.75rem;" onclick="ouvrirFormulaireModificationAnnonce(${o.id})">Gérer</button>
            </div>
          </div>`;
      });
    }
  } else {
    title.innerText = `🏢 Vitrine : ${utilisateurConnecte.shop_name}`;
    content.innerHTML = `
      <p style="color:#d97706; font-weight:bold; margin-bottom:4px;">👑 Établissement Professionnel VIP</p>
      <p style="font-size:0.85rem; color:#64748b; margin:0 0 15px 0;">Ligne pro : ${utilisateurConnecte.telephone}</p>
      <h4>📦 Gestion du catalogue exclusif (${mesAnnonces.length}) :</h4>
      <div id="sub-list-vip" style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto;"></div>
    `;
    const subListVip = content.querySelector("#sub-list-vip");
    if(mesAnnonces.length === 0) { subListVip.innerHTML = "<p style='color:#64748b;'>Vitrine vide.</p>"; }
    else {
      mesAnnonces.forEach(o => {
        subListVip.innerHTML += `
          <div style="background:#fffdf5; border:1px solid #fde68a; padding:12px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
            <div><strong style="color:#d97706;">${o.titre}</strong><br><span style="font-size:0.75rem;">${o.prix} ${o.devise || '$'} / par ${o.periode || 'jour'}</span></div>
            <div style="display:flex; gap:4px;">
              <button class="btn-boost" style="padding:4px 8px; font-size:0.75rem;" onclick="declencherPubliciteInterstitielle(() => executerRemonteeBdd(${o.id}))">🚀 Booster</button>
              <button class="btn-edit" style="padding:4px 8px; font-size:0.75rem; background:#d97706;" onclick="ouvrirFormulaireModificationAnnonce(${o.id})">Gérer</button>
            </div>
          </div>`;
      });
    }
  }
  content.innerHTML += `<button class="big-btn secondary" style="margin-top:20px; padding:10px;" onclick="localStorage.clear(); location.reload();">Me déconnecter 🚪</button>`;
  ouvrirModal('profil');
}

let countObjetsBulk = 0;
function ajouterChampObjetUnique() {
  countObjetsBulk++; 
  const container = document.getElementById("bulk-items-container");
  const d = document.createElement('div'); 
  d.id = `bulk-box-${countObjetsBulk}`;
  d.style = "background:#f8fafc; padding:12px; border-radius:10px; margin-bottom:12px; position:relative; border:1px solid #e2e8f0;";
  d.innerHTML = `
    <span style="position:absolute; right:10px; top:5px; cursor:pointer; font-weight:bold; color:red;" onclick="document.getElementById('bulk-box-${countObjetsBulk}').remove()">✕</span>
    <input class="bulk-titre" placeholder="Nom de l'objet (Ex: Villa Moderne)" style="padding:8px; margin:4px 0;">
    <div style="display:flex; gap:5px; margin:4px 0;">
      <input type="number" class="bulk-prix" placeholder="Prix" style="padding:8px; margin:0;">
      <select class="bulk-devise" style="width:70px; margin:0;"><option value="$">$</option><option value="FC">FC</option></select>
      <select class="bulk-periode" style="margin:0;">
        <option value="heure">par heure</option>
        <option value="jour" selected>par jour</option>
        <option value="semaine">par semaine</option>
        <option value="mois">par mois</option>
      </select>
    </div>
    <textarea class="bulk-description" placeholder="Description de l'annonce..." style="padding:8px; margin:4px 0; height:60px; font-size:0.85rem;"></textarea>
    <input type="file" class="bulk-image" accept="image/*" multiple style="padding:5px;">
  `;
  container.appendChild(d);
}

function gererClicBoutonVipMenu() {
  const container = document.getElementById("vip-form-body");
  if(!utilisateurConnecte.is_vip) {
    document.getElementById("vip-modal-title").innerText = "👑 Devenir Boutique VIP Pro";
    container.innerHTML = `
      <div class="form-group full-width"><label>Nom Commercial de votre Entreprise</label><input id="vip-shop-name" placeholder="Ex: Katanga Rental Service"></div>
      <div class="form-group full-width"><label>Ville Principale</label><input id="vip-ville" value="Lubumbashi"></div>
      <button class="modal-submit-btn" style="background:#d97706;" onclick="validerInscriptionBoutiqueLocale()">Convertir mon compte en VIP 👑</button>
    `;
  } else {
    document.getElementById("vip-modal-title").innerText = `📦 Dépôt Multi-Fiches VIP`;
    container.innerHTML = `
      <div class="form-group full-width">
        <div id="bulk-items-container"></div>
        <button type="button" style="background:#fffdf5; color:#d97706; border:1px dashed #d97706; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer;" onclick="ajouterChampObjetUnique()">➕ Insérer une ligne d'objet</button>
      </div>
      <button class="modal-submit-btn" style="background:#d97706;" onclick="publierCatalogueEnMasse()">Lancer la publication groupée</button>
    `;
    document.getElementById("bulk-items-container").innerHTML = ""; 
    countObjetsBulk = 0; 
    ajouterChampObjetUnique();
  }
  ouvrirModal('vip');
}

async function validerInscriptionBoutiqueLocale() {
  const sName = document.getElementById("vip-shop-name").value.trim();
  if(!sName) return alert("Nom de commerce requis !");
  const res = await fetch(`${API}/users/${utilisateurConnecte.id}/upgrade-vip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shop_name: sName })
  });
  if(res.ok) {
    utilisateurConnecte.is_vip = true; utilisateurConnecte.shop_name = sName;
    localStorage.setItem("nia_user_session", JSON.stringify(utilisateurConnecte));
    alert("Compte promu VIP !"); fermerModal('vip'); location.reload();
  }
}

// 🔐 CONSOLE ADMIN PARÉ ET COMPATIBLE SMARTPHONE
let adminTimer = null; 
let aVibreEtValideTemps = false; 
let touchStartY = 0;
const gearBtn = document.getElementById("gear-admin-trigger");

gearBtn.addEventListener("mousedown", startAdminTimer); 
gearBtn.addEventListener("touchstart", startAdminTimer);
gearBtn.addEventListener("mouseup", stopAdminTimer); 
gearBtn.addEventListener("touchend", stopAdminTimer);

function startAdminTimer(e) {
  aVibreEtValideTemps = false; 
  if(e.touches) touchStartY = e.touches[0].clientY;
  adminTimer = setTimeout(() => { aVibreEtValideTemps = true; if (navigator.vibrate) navigator.vibrate(150); }, 10000);
}
function stopAdminTimer() { clearTimeout(adminTimer); }

gearBtn.addEventListener("touchmove", (e) => {
  if(!aVibreEtValideTemps) return;
  if(e.touches[0].clientY - touchStartY > 45) {
    aVibreEtValideTemps = false; 
    clearTimeout(adminTimer);
    const code = prompt("🔒 ACCÈS ADMINE : CODE SECRET DE SÉCURITÉ :");
    if(code === "BEN4002ET4200") initialiserEtOuvrirEspaceAdmin();
  }
});

// Forcer l'accès sur PC via clic droit caché au cas où
gearBtn.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const code = prompt("🔒 ACCÈS ADMINE (PC) : CODE SECRET :");
  if(code === "BEN4002ET4200") initialiserEtOuvrirEspaceAdmin();
});

async function initialiserEtOuvrirEspaceAdmin() {
  const res = await fetch(`${API}/admin/stats`); 
  const stats = await res.json();
  document.getElementById("adm-stat-total").innerText = stats.total;
  document.getElementById("adm-stat-vip").innerText = stats.vip;
  document.getElementById("adm-stat-stand").innerText = stats.standard;
  
  const selectVille = document.getElementById("adm-filter-ville");
  const villes = [...new Set(toutesLesAnnonces.map(a => a.ville || "Lubumbashi"))];
  selectVille.innerHTML = `<option value="all">Toutes les villes</option>`;
  villes.forEach(v => { selectVille.innerHTML += `<option value="${v.toLowerCase()}">${v}</option>`; });
  
  filtrerIndexationAnnoncesAdmin(); 
  ouvrirModal('admin-panel');
}

function filtrerIndexationAnnoncesAdmin() {
  const fVille = document.getElementById("adm-filter-ville").value;
  const fType = document.getElementById("adm-filter-type").value;
  const list = document.getElementById("admin-liste-moderat-annonces");
  
  const filtres = toutesLesAnnonces.filter(a => {
    const matchV = (fVille === "all" || (a.ville && a.ville.toLowerCase() === fVille));
    let matchT = true; 
    if (fType === "vip") matchT = (a.statut === 'vip'); 
    if (fType === "standard") matchT = (a.statut !== 'vip');
    return matchV && matchT;
  });
  
  list.innerHTML = "";
  if(filtres.length === 0) { list.innerHTML = `<p style="color:#64748b; text-align:center; padding:10px;">Aucun élément.</p>`; return; }
  filtres.forEach(a => {
    list.innerHTML += `
      <div class="admin-annonce-item">
        <div style="max-width:70%;"><strong>${a.titre}</strong><div style="font-size:0.7rem; color:#94a3b8;">📍 ${a.ville} | ${a.telephone}</div></div>
        <button class="btn-delete" style="padding:4px 8px; font-size:0.75rem;" onclick="supprimerForceParAdmin(${a.id})">Purger</button>
      </div>`;
  });
}

async function supprimerForceParAdmin(id) {
  if(!confirm("Supprimer définitivement cette annonce ?")) return;
  const res = await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
  if(res.ok) { alert("Annonce purgée."); loadFeed().then(() => initialiserEtOuvrirEspaceAdmin()); }
}

async function sauvegarderModificationAnnonce() {
  const id = document.getElementById("edit-id").value;
  const payload = {
    titre: document.getElementById("edit-titre").value,
    prix: document.getElementById("edit-prix").value,
    devise: document.getElementById("edit-devise").value,
    periode: document.getElementById("edit-periode").value,
    statut: document.getElementById("edit-statut").value,
    description: document.getElementById("edit-description").value,
    ville: document.getElementById("edit-ville").value,
    commune: document.getElementById("edit-commune").value,
    quartier: document.getElementById("edit-quartier").value,
    telephone: document.getElementById("edit-telephone").value
  };
  const res = await fetch(`${API}/annonces/${id}/update`, {
    method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload)
  });
  if(res.ok) { alert("Modifications enregistrées !"); fermerModal('modifier-annonce'); loadFeed(); }
}

async function supprimerAnnonce(id) {
  if(!confirm("Retirer cette fiche ?")) return;
  const res = await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
  if(res.ok) { alert("Fiche retirée."); fermerModal('modifier-annonce'); loadFeed(); }
}

function compressAndToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image(); img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas'); let w = img.width, h = img.height;
        if (w > 800) { h = Math.round((h * 800) / w); w = 800; } canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h); resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
}

async function publierCatalogueEnMasse() {
  const boxes = document.querySelectorAll("#bulk-items-container > div"); 
  if(boxes.length === 0) return;
  
  for(let box of boxes) {
    const titre = box.querySelector(".bulk-titre").value.trim();
    const prix = box.querySelector(".bulk-prix").value.trim();
    const dev = box.querySelector(".bulk-devise").value;
    const per = box.querySelector(".bulk-periode").value;
    const desc = box.querySelector(".bulk-description").value.trim();
    const files = box.querySelector(".bulk-image").files;
    
    if(!titre) continue;
    let images_base64 = []; 
    if(files) { for(let f of files) { images_base64.push(await compressAndToBase64(f)); } }
    
    await fetch(`${API}/annonces`, {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        user_id: utilisateurConnecte.id, 
        titre: titre, 
        description: desc ? `VIP : ${utilisateurConnecte.shop_name}\n${desc}` : `VIP : ${utilisateurConnecte.shop_name}`,
        prix: prix || 0, 
        devise: dev, 
        periode: per, 
        ville: utilisateurConnecte.ville || "Lubumbashi",
        commune: "", quartier: "", telephone: utilisateurConnecte.telephone, statut: "vip", images_base64
      })
    });
  }
  alert("Catalogue enregistré avec succès !"); 
  fermerModal('vip'); 
  loadFeed();
}

async function publier(){
  try {
    const files = document.getElementById("image").files; 
    let images_base64 = [];
    for(let f of files){ images_base64.push(await compressAndToBase64(f)); }
    
    const bodyData = {
      user_id: utilisateurConnecte.id, 
      titre: document.getElementById("titre").value,
      prix: document.getElementById("prix").value, 
      devise: document.getElementById("devise").value,
      periode: document.getElementById("periode").value, 
      telephone: document.getElementById("telephone").value,
      description: document.getElementById("description").value, 
      ville: document.getElementById("ville").value,
      commune: document.getElementById("commune").value, 
      quartier: document.getElementById("quartier").value,
      statut: "disponible", images_base64
    };
    
    const res = await fetch(`${API}/annonces`, { 
      method:"POST", 
      headers:{"Content-Type":"application/json"}, 
      body:JSON.stringify(bodyData) 
    });
    
    if(res.ok) {
      alert("Votre annonce a été publiée !");
      fermerModal('publier'); 
      loadFeed();
    }
  } catch (e) { alert("Erreur lors du dépôt de l'annonce"); }
}

async function executerRemonteeBdd(idAnnonce) {
  const res = await fetch(`${API}/annonces/${idAnnonce}/boost`, { method: "POST" });
  if(res.ok) { 
    alert("Fiche remontée au sommet du flux !"); 
    loadFeed(); 
    if(!document.getElementById("modal-profil").classList.contains("hidden")) ouvrirMonProfilOuMaBoutique(); 
  }
}

// DÉMARRAGE AUTOMATIQUE DES ÉCOUTEURS
verifierSession();
initialiserBanniereAdSenseRotative();
