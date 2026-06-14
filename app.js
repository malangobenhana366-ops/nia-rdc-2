const API = ""; 
let toutesLesAnnonces = [];
let idAnnonceEnCoursDeBoost = null;

// GESTION ET PERSISTENCE SÉCURISÉE DES MIGRATIONS DE COMPTE
let sessionToken = localStorage.getItem("nia_token") || null;
let monUserIdActuel = localStorage.getItem("nia_user_id") ? parseInt(localStorage.getItem("nia_user_id")) : null;
let monUserTypeActuel = localStorage.getItem("nia_user_type") || "standard"; // 'standard' ou 'vip'
let monShopNameActuel = localStorage.getItem("nia_shop_name") || null;

let modeAuthInscription = true; // Bascule entre Inscription et Connexion

const BANNER_ADS_POOL = [
  { text: "🌟 Airtel Money RDC : Transférez vos fonds instantanément partout en RDC ! 🌟", link: "#" },
  { text: "👑 Orange RDC VIP : Restez connectés avec des forfaits internet illimités. 👑", link: "#" },
  { text: "🚗 Vodacom M-Pesa : Achetez, vendez et louez vos véhicules en toute sérénité. 🚗", link: "#" },
  { text: "🏢 PropConnect Immobilier : Des appartements de luxe disponibles à Lubumbashi ! 🏢", link: "#" }
];

const INTERSTITIAL_ADS_POOL = [
  "🔥 Investissez en RDC : Terrains et concessions certifiés disponibles à Kolwezi. Contactez l'agence !",
  "⚡ Énergie Solaire RDC : Kits complets pour alimenter votre maison 24h/24 sans coupure.",
  "🚀 Maison Express : Simplifiez vos déménagements avec notre flotte de camions sécurisés.",
  "💼 Rawbank Pro : Des crédits adaptés aux entrepreneurs et boutiques VIP."
];

let fonctionRetourAppelInterstitiel = null;

function ouvrirModal(id) { document.getElementById(`modal-${id}`).style.display = "flex"; }
function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = "none"; }

async function loadFeed(){
  try {
    const res = await fetch(`${API}/feed`);
    toutesLesAnnonces = await res.json();
    afficherAnnonces(toutesLesAnnonces);
    mettreAJourLibelleBoutonProfil();
  } catch (e) { console.error(e); }
}

function mettreAJourLibelleBoutonProfil() {
  const btn = document.getElementById("main-profile-nav-btn");
  if(!btn) return;
  if(!sessionToken) {
    btn.innerHTML = `<span>👤</span><span>Connexion</span>`;
  } else {
    btn.innerHTML = monUserTypeActuel === "vip" ? `<span>🏢</span><span>Ma Boutique</span>` : `<span>👤</span><span>Mon Profil</span>`;
  }
}

// AFFICHAGE DES BOUTONS DE CONTRÔLE SUR LES ANNONCES DE L'ESPACE PRIVÉ ET SUR LE FLUX PUBLIC (SI PROPRIÉTAIRE)
function afficherAnnonces(liste, contextViewId = null) {
  const feed = document.getElementById("feed");
  if (!feed) return;
  if (liste.length === 0) {
    feed.innerHTML = '<p style="color:#64748b; text-align:center; padding:30px; font-weight:600;">Aucun élément trouvé sur le réseau.</p>';
    return;
  }
  
  feed.innerHTML = "";
  liste.forEach(a => {
    let localisation = `📍 ${a.ville || 'RDC'}`;
    if(a.commune) localisation += `, ${a.commune}`;
    if(a.quartier) localisation += ` (Q/ ${a.quartier})`;

    const estVip = (a.statut === 'vip' || a.user_id === 100);
    const deviseAffichage = a.prix_devise || 'USD';
    const symboleDevise = deviseAffichage === 'USD' ? '$' : ' FC';
    
    // Vérification de propriété : est-ce l'annonce de l'utilisateur connecté ?
    const mAppartient = (sessionToken && monUserIdActuel && a.user_id === monUserIdActuel);

    feed.innerHTML += `
      <div class="annonce-card ${estVip ? 'vip-premium' : ''}">
        ${estVip ? `<span class="vip-badge-tag">👑 Boutique VIP</span>` : ''}
        <h3>${a.titre}</h3>
        <div class="annonce-price">${a.prix ? `${a.prix}${symboleDevise} / par ${a.periode}` : 'À négocier'}</div>
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
            ${estVip && contextViewId !== 'OWNER_VITRINE' ? `<button class="btn-shop" onclick="actionVisiterBoutiqueTierce(${a.user_id}, '${a.description}')">🏢 Visiter la boutique</button>` : ''}
            
            ${mAppartient || contextViewId === 'OWNER_VITRINE' ? `
              <button class="btn-boost" onclick="lancerLancementPubBoost(${a.id})">🚀 Booster</button>
              <button class="btn-edit" onclick="ouvrirFormulaireModificationAnnonce(${a.id})">📝 Modifier</button>
              <button class="btn-delete" onclick="supprimerAnnonce(${a.id})">🗑️ Supprimer</button>
            ` : ''}
            
            ${a.telephone ? `<button class="btn-contact" onclick="intercepterAppelTelephonique('${a.telephone}')">📞 Appeler</button>` : ''}
          </div>
        </div>
      </div>
    `;
  });
}

// GESTION DE L'AUTHENTIFICATION SÉCURISÉE (INSCRIPTION / CONNEXION)
function basculerModeAuth() {
  modeAuthInscription = !modeAuthInscription;
  document.getElementById("auth-title").innerText = modeAuthInscription ? "Créer un compte" : "Se connecter";
  document.getElementById("auth-submit-btn").innerText = modeAuthInscription ? "Créer mon compte sécurisé" : "Accéder à mon espace";
  document.getElementById("auth-toggle").innerText = modeAuthInscription ? "Déjà membre ? Connectez-vous ici" : "Pas encore de compte ? S'inscrire";
  
  const phoneGroup = document.getElementById("auth-phone").parentElement;
  phoneGroup.style.display = modeAuthInscription ? "flex" : "none";
}

async function soumettreAuthentification() {
  const username = document.getElementById("auth-username").value.trim();
  const password = document.getElementById("auth-password").value.trim();
  const phone = document.getElementById("auth-phone").value.trim();

  if(!username || !password || (modeAuthInscription && !phone)) {
    alert("Veuillez remplir tous les champs requis !"); return;
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
    
    if(!res.ok) { alert(data.error || "Une erreur est survenue"); return; }

    // Enregistrement de la session sécurisée
    localStorage.setItem("nia_token", data.token);
    localStorage.setItem("nia_user_id", data.userId);
    localStorage.setItem("nia_user_type", data.type);
    localStorage.setItem("nia_shop_name", data.shopName || "");

    sessionToken = data.token;
    monUserIdActuel = data.userId;
    monUserTypeActuel = data.type;
    monShopNameActuel = data.shopName;

    alert(modeAuthInscription ? "Inscription réussie et sécurisée ! 🎉" : "Connexion réussie ! Welcome back.");
    fermerModal('authentification');
    loadFeed();
  } catch (err) {
    alert("Erreur serveur lors de la tentative d'accès.");
  }
}

function deconnexionEspaceSecurise() {
  localStorage.clear();
  sessionToken = null; monUserIdActuel = null; monUserTypeActuel = "standard"; monShopNameActuel = null;
  alert("Vous avez été déconnecté.");
  fermerModal('profil');
  loadFeed();
}

function declencherOuverturePublication() {
  if(!sessionToken) { ouvrirModal('authentification'); return; }
  ouvrirModal('publier');
}

// INTERFACE DU PROFIL PRIVÉ SÉCURISÉ AVEC SES BOUTONS PERSONNELS
function ouvrirEspaceCompteUtilisateur() {
  if(!sessionToken) { ouvrirModal('authentification'); return; }
  
  const title = document.getElementById("profil-modal-title");
  const content = document.getElementById("profil-view-content");
  const mesAnnoncesPersonnelles = toutesLesAnnonces.filter(a => a.user_id === monUserIdActuel);

  let enteteHtml = `
    <div style="background:#e2e8f0; padding:15px; border-radius:12px; margin-bottom:15px;">
      <p style="margin:0;"><strong>Statut du Compte :</strong> ${monUserTypeActuel === 'vip' ? '👑 Professionnel VIP' : '👤 Standard'}</p>
      ${monShopNameActuel ? `<p style="margin:5px 0 0 0;"><strong>Boutique :</strong> ${monShopNameActuel}</p>` : ''}
      <button onclick="deconnexionEspaceSecurise()" style="background:var(--danger); color:white; border:none; padding:6px 12px; border-radius:6px; margin-top:10px; cursor:pointer; font-weight:bold;">Se déconnecter</button>
    </div>
  `;

  title.innerText = monUserTypeActuel === 'vip' ? `🏢 Gestion Boutique : ${monShopNameActuel}` : "👤 Mon Espace Privé";
  
  content.innerHTML = `
    ${enteteHtml}
    <h4 style="margin:10px 0;">📋 Liste de vos publications personnelles (${mesAnnoncesPersonnelles.length}) :</h4>
    <div id="private-user-items" style="display:flex; flex-direction:column; gap:12px; max-height:250px; overflow-y:auto; padding-right:5px;"></div>
  `;

  ouvrirModal('profil');
  
  // Affichage direct des annonces dans le sous-contenu du profil privé avec tous leurs boutons
  afficherAnnoncesDansProfilPrivé(mesAnnoncesPersonnelles);
}

function afficherAnnoncesDansProfilPrivé(liste) {
  const container = document.getElementById("private-user-items");
  if(liste.length === 0) {
    container.innerHTML = "<p style='color:var(--text-light); font-size:0.85rem;'>Vous n'avez pas encore publié d'annonces.</p>";
    return;
  }
  
  liste.forEach(a => {
    const dAffichage = a.prix_devise || 'USD';
    const sDevise = dAffichage === 'USD' ? '$' : ' FC';
    
    const div = document.createElement("div");
    div.style = "background:#f8fafc; border:1px solid var(--border); padding:12px; border-radius:10px;";
    div.innerHTML = `
      <div style="display:flex; justify-content:between; align-items:center; width:100%; justify-content: space-between;">
        <span style="font-weight:700; font-size:0.9rem;">${a.titre}</span>
        <span style="color:var(--primary); font-weight:800; font-size:0.85rem;">${a.prix}${sDevise}</span>
      </div>
      <div style="display:flex; gap:6px; margin-top:10px; justify-content:flex-end;">
        <button class="btn-boost" style="padding:4px 8px; font-size:0.75rem;" onclick="fermerModal('profil'); lancerLancementPubBoost(${a.id})">🚀 Booster</button>
        <button class="btn-edit" style="padding:4px 8px; font-size:0.75rem;" onclick="fermerModal('profil'); ouvrirFormulaireModificationAnnonce(${a.id})">📝 Modifier</button>
        <button class="btn-delete" style="padding:4px 8px; font-size:0.75rem;" onclick="fermerModal('profil'); supprimerAnnonce(${a.id})">🗑️</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// MINI DÉROULANT DES PÉRIODES DE TEMPS ET GESTION DES COMPTES VIP EN LOT
function gererClicBoutonVipMenu() {
  if(!sessionToken) { ouvrirModal('authentification'); return; }
  
  if(monUserTypeActuel !== "vip") {
    // Proposition d'upgrade en boutique VIP
    document.getElementById("vip-modal-title").innerText = "👑 Devenir Partenaire VIP";
    document.getElementById("vip-form-body").innerHTML = `
      <div class="form-group full-width"><label>Nom de votre enseigne commerciale / Boutique</label><input id="upgrade-shop-name" placeholder="Ex: Grand Katanga Services"></div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="validerUpgradeBoutiqueVip()">Activer mon abonnement VIP</button>
    `;
  } else {
    // Si déjà VIP, formulaire de publication de catalogue en masse avec son sélecteur de période
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
      <div class="form-group" style="grid-column:span 2"><label>Nom de l'objet</label><input class="bulk-titre" placeholder="Ex: Robe de mariée"></div>
      <div class="form-group"><label>Prix</label><input type="number" class="bulk-prix" placeholder="10"></div>
      <div class="form-group"><label>Devise</label><select class="bulk-devise"><option value="USD">USD ($)</option><option value="FC">FC (FC)</option></select></div>
      
      <!-- MINI SÉLECTEUR DÉROULANT DES PÉRIODES REQUIS DANS L'ESPACE VIP -->
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
  if(!shopName) { alert("Spécifiez un nom pour votre boutique !"); return; }
  
  try {
    const res = await fetch(`${API}/auth/upgrade-vip`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionToken}` },
      body: JSON.stringify({ shopName })
    });
    if(res.ok) {
      localStorage.setItem("nia_user_type", "vip");
      localStorage.setItem("nia_shop_name", shopName);
      monUserTypeActuel = "vip"; monShopNameActuel = shopName;
      alert(`Votre espace pro VIP "${shopName}" est maintenant opérationnel !`);
      fermerModal('vip');
      loadFeed();
    }
  } catch (e) { alert("Erreur d'upgrade."); }
}

async function publierCatalogueEnMasse() {
  const boxes = document.querySelectorAll(".bulk-item-box");
  if(boxes.length === 0) return;
  
  for(let box of boxes) {
    const titre = box.querySelector(".bulk-titre").value.trim();
    const prix = box.querySelector(".bulk-prix").value.trim();
    const prix_devise = box.querySelector(".bulk-devise").value;
    const periode = box.querySelector(".bulk-periode").value;
    const inputFiles = box.querySelector(".bulk-image").files;
    if(!titre) continue;
    
    let images_base64 = [];
    if(inputFiles) { for(let f of inputFiles) { images_base64.push(await compressAndToBase64(f)); } }

    await fetch(`${API}/annonces`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization": `Bearer ${sessionToken}` },
      body: JSON.stringify({
        titre: titre, description: `Vitrine VIP : ${monShopNameActuel}`,
        prix: prix || 0, prix_devise: prix_devise, periode: periode, ville: "Lubumbashi", commune: "",
        quartier: "", telephone: "", statut: "vip", images_base64
      })
    });
  }
  alert("Catalogue de masse publié avec succès ! 👑"); fermerModal('vip'); loadFeed();
}

async function publierAnnonceStandard(){
  try {
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
  } catch (e) { alert("Erreur lors de la publication"); }
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
  if(res.ok) { alert("Mise à jour enregistrée !"); fermerModal('modifier-annonce'); loadFeed(); }
}

async function supprimerAnnonce(id) {
  if(!confirm("Retirer cet objet de la plateforme de location ?")) return;
  const res = await fetch(`${API}/annonces/${id}/delete`, { 
    method: "DELETE",
    headers: { "Authorization": `Bearer ${sessionToken}` }
  });
  if(res.ok) { alert("Objet supprimé."); loadFeed(); }
}

// RECHERCHE SMART TRIGRAMMES SQL
async function rechercher() {
  const sTitre = document.getElementById("search-titre").value.trim();
  const sVille = document.getElementById("search-ville").value.trim();
  const sCommune = document.getElementById("search-commune").value.trim();
  const sQuartier = document.getElementById("search-quartier").value.trim();

  if(!sTitre && !sVille && !sCommune && !sQuartier) { annulerRecherche(); fermerModal('rechercher'); return; }

  try {
    const urlParams = new URLSearchParams({ q: sTitre, ville: sVille, commune: sCommune, quartier: sQuartier });
    const res = await fetch(`${API}/annonces/search?${urlParams.toString()}`);
    const r = await res.json();
    document.getElementById("shop-header-container").innerHTML = "";
    document.getElementById("feed-title").innerText = "Résultats du filtre unique intelligent 🔍";
    document.getElementById("reset-btn").style.display = "inline-block";
    afficherAnnonces(r);
  } catch (err) { console.error(err); }
  fermerModal('rechercher');
}

function annulerRecherche() {
  document.getElementById("shop-header-container").innerHTML = "";
  document.getElementById("feed-title").innerText = "Annonces récentes";
  document.getElementById("reset-btn").style.display = "none";
  afficherAnnonces(toutesLesAnnonces);
}

function actionVisiterBoutiqueTierce(boutiqueUserId, descriptionAnnonce) {
  const articles = toutesLesAnnonces.filter(a => a.user_id === boutiqueUserId);
  document.getElementById("shop-header-container").innerHTML = `
    <div class="shop-banner"><h2>👑 Espace Vitrine Partenaire</h2><p>Découvrez tout le catalogue de cet annonceur</p></div>
  `;
  document.getElementById("feed-title").innerText = "Vitrine Boutique";
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(articles, 'OWNER_VITRINE');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function intercepterAppelTelephonique(num) {
  declencherPubliciteInterstitielle(() => { window.location.href = `tel:${num}`; });
}

function declencherPubliciteInterstitielle(callback) {
  fonctionRetourAppelInterstitiel = callback;
  const overlay = document.getElementById("adsense-interstitial");
  const closeBtn = document.getElementById("close-interstitial-btn");
  
  document.getElementById("interstitial-ad-body").innerText = INTERSTITIAL_ADS_POOL[Math.floor(Math.random() * INTERSTITIAL_ADS_POOL.length)];
  closeBtn.disabled = true; closeBtn.innerText = "Attendre (5s)"; overlay.style.display = "flex";

  let tempsRestant = 5;
  const chrono = setInterval(() => {
    tempsRestant--;
    if(tempsRestant > 0) { closeBtn.innerText = `Attendre (${tempsRestant}s)`; } 
    else { clearInterval(chrono); closeBtn.disabled = false; closeBtn.innerText = "Fermer l'annonce ✕"; }
  }, 1000);
}

function fermerPubliciteInterstitielle() {
  document.getElementById("adsense-interstitial").style.display = "none";
  if(fonctionRetourAppelInterstitiel) { const cb = fonctionRetourAppelInterstitiel; fonctionRetourAppelInterstitiel = null; cb(); }
}

function lancerLancementPubBoost(idAnnonce) {
  idAnnonceEnCoursDeBoost = idAnnonce;
  document.getElementById("btn-finaliser-boost").style.display = "none";
  document.getElementById("interstitial-boost-banner-text").innerText = `📢 SPONSOR ADSENSE :\n"${INTERSTITIAL_ADS_POOL[Math.floor(Math.random()*INTERSTITIAL_ADS_POOL.length)]}"`;
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
  if(res.ok) { alert("Boost positionnel validé !"); fermerModal('boost-pub'); loadFeed(); }
}

function ouvrirFormulaireModificationAnnonce(id) {
  const a = toutesLesAnnonces.find(o => o.id === id);
  if(!a) return;
  document.getElementById("edit-id").value = a.id;
  document.getElementById("edit-titre").value = a.titre;
  document.getElementById("edit-prix").value = a.prix;
  document.getElementById("edit-prix-devise").value = a.prix_devise || "USD";
  document.getElementById("edit-periode").value = a.periode;
  document.getElementById("edit-statut").value = a.statut;
  document.getElementById("edit-description").value = a.description;
  document.getElementById("edit-ville").value = a.ville || "Lubumbashi";
  document.getElementById("edit-commune").value = a.commune || "";
  document.getElementById("edit-quartier").value = a.quartier || "";
  document.getElementById("edit-telephone").value = a.telephone || "";
  ouvrirModal('modifier-annonce');
}

function démarrerChangementBannièreAdSenseFonds() {
  const c = document.getElementById("adsense-bottom-banner");
  let indexAd = 0;
  setInterval(() => {
    indexAd = (indexAd + 1) % BANNER_ADS_POOL.length;
    c.innerHTML = `<a href="#" class="ad-link-wrapper" onclick="event.preventDefault(); alert('Redirection sponsor')">${BANNER_ADS_POOL[indexAd].text}</a>`;
  }, 30000);
}

function compressAndToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image(); img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > 800) { h = Math.round((h * 800) / w); w = 800; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
}

// COFFRE FORT ACCÈS ADMINISTRATION DIRECTE TACTILE
let adminTimer = null; let aVibreEtValideTemps = false; let touchStartY = 0;
const gearBtn = document.getElementById("gear-admin-trigger");
gearBtn.addEventListener("mousedown", (e) => {
  adminTimer = setTimeout(() => { aVibreEtValideTemps = true; if(navigator.vibrate) navigator.vibrate(150); }, 15000);
});
gearBtn.addEventListener("mouseup", () => clearTimeout(adminTimer));
gearBtn.addEventListener("touchstart", (e) => { touchStartY = e.touches[0].clientY; adminTimer = setTimeout(() => { aVibreEtValideTemps = true; if(navigator.vibrate) navigator.vibrate(150); }, 15000); });
gearBtn.addEventListener("touchmove", (e) => {
  if(!aVibreEtValideTemps) return;
  if(e.touches[0].clientY - touchStartY > 40) { aVibreEtValideTemps = false; clearTimeout(adminTimer); verifierCodeAdmin(); }
});

function verifierCodeAdmin() {
  if(prompt("🔒 ENTRER LE CODE SECRET ADMIN :") === "BEN4002ET4200") { openAdminPanel(); }
}

async function openAdminPanel() {
  const res = await fetch(`${API}/feed`);
  const annonces = await res.json();
  document.getElementById("adm-stat-total").innerText = annonces.length;
  document.getElementById("adm-stat-vip").innerText = annonces.filter(a=>a.statut==='vip').length;
  document.getElementById("adm-stat-stand").innerText = annonces.length - annonces.filter(a=>a.statut==='vip').length;
  
  const conteneur = document.getElementById("admin-liste-moderat-annonces");
  conteneur.innerHTML = "";
  annonces.forEach(a => {
    conteneur.innerHTML += `
      <div class="admin-annonce-item">
        <div><strong>${a.titre}</strong></div>
        <button class="btn-delete" onclick="purgerAnnonceAdmin(${a.id})">Purger de force</button>
      </div>`;
  });
  ouvrirModal('admin-panel');
}

async function purgerAnnonceAdmin(id) {
  if(confirm("Confirmer la suppression administrative ?")) {
    await fetch(`${API}/admin/annonces/${id}`, { method: "DELETE", headers: {"Authorization": `Bearer ${sessionToken}`} });
    openAdminPanel(); loadFeed();
  }
}

loadFeed(); démarrerChangementBannièreAdSenseFonds();
