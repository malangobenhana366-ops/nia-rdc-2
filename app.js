const API = "https://nia-rdc-2.onrender.com";

/* --- VARIABLES D'ÉTAT GLOBALES --- */
let toutesLesAnnonces = [];
let ID_BOOST_EN_COURS = null;
let COMPTEUR_INTERVAL = null;
let ONGLE_PROFIL_ACTIF = "standard";
let ACTION_POST_INTERSTITIELLE = null;

/* --- DICTIONNAIRE DE SYNONYMES POUR RECHERCHE INTELLIGENTE --- */
const DICT_SYNONYMES = {
  "groupe": ["generateur", "moteur", "electro", "dynamo", "5kva", "electrogene"],
  "electrogene": ["generateur", "moteur", "electro", "groupe"],
  "generateur": ["groupe", "electrogene", "moteur"],
  "maison": ["appartement", "chambre", "salon", "parcelle", "studio", "villa", "mezon"],
  "appartement": ["maison", "studio", "chambre"],
  "robe": ["habit", "vetement", "pagne", "costume"],
  "camion": ["vehicule", "voiture", "transport", "canter", "benne"]
};

/* --- ALGORITHME DE LEVENSHTEIN (CORRECTION FAUTES DE FRAPPE) --- */
function distanceLevenshtein(a, b) {
  const tmp = [];
  let i, j, alen = a.length, blen = b.length;
  if (alen === 0) return blen;
  if (blen === 0) return alen;
  for (i = 0; i <= alen; i++) tmp[i] = [i];
  for (j = 0; j <= blen; j++) tmp[0][j] = j;
  for (i = 1; i <= alen; i++) {
    for (j = 1; j <= blen; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[alen][blen];
}

function correspondRechercheIntelligente(champ, recherche) {
  if (!champ) return false;
  const motsChamp = champ.toLowerCase().split(/\s+/);
  const motsRecherche = recherche.toLowerCase().split(/\s+/);

  return motsRecherche.every(mr => {
    if (champ.toLowerCase().includes(mr)) return true;

    for (let cle in DICT_SYNONYMES) {
      if (cle === mr || DICT_SYNONYMES[cle].includes(mr)) {
        if (motsChamp.some(mc => mc === cle || DICT_SYNONYMES[cle].includes(mc))) {
          return true;
        }
      }
    }

    if (mr.length > 3) {
      return motsChamp.some(mc => distanceLevenshtein(mc, mr) <= 2);
    }
    return false;
  });
}

/* --- UTILITAIRES DE FORMULAIRE --- */
function val(id) { return document.getElementById(id)?.value?.trim() || ""; }
function setVal(id, valeur) { const el = document.getElementById(id); if (el) el.value = valeur; }

/* --- COMPRESSEUR D'IMAGE ULTRA-PUISSANT CÔTÉ CLIENT (RÉPARE LE BUG DE MISE EN LIGNE) --- */
function optimiserEtCompresserImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        } else {
          if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
    };
  });
}

/* --- SYSTEME DE PUBLICITÉ INTERSTITIELLE ET BANNIÈRE ROTATIVE --- */
const BANNER_ADS = [
  "⚡ AdSense : Louez vos équipements au meilleur prix partout à Lubumbashi ! ⚡",
  "👑 Devenez membre Pro VIP pour multiplier vos revenus locatifs par 5 ! 👑",
  "🚗 Sponsorisé : Solutions de transport express NIA RDC — Fiable & Sécurisé 🚗",
  "📱 Promo AdSense : Vos vitrines commerciales indexées en temps réel sur l'application 📱"
];
let INDEX_PUB_ROTATIVE = 0;

function initialiserPubliciteBanniereRotative() {
  setInterval(() => {
    INDEX_PUB_ROTATIVE = (INDEX_PUB_ROTATIVE + 1) % BANNER_ADS.length;
    const placeholder = document.getElementById("adsense-rotative-banner");
    if (placeholder) placeholder.innerHTML = BANNER_ADS[INDEX_PUB_ROTATIVE];
  }, 30000);
}

function declencherPubliciteInterstitielle(actionSuivante, titreText = "Publicité Interstitielle AdSense", corpsText = "Votre application se charge automatiquement...") {
  ACTION_POST_INTERSTITIELLE = actionSuivante;
  document.getElementById("interstitial-title").textContent = titreText;
  document.getElementById("interstitial-body").textContent = corpsText;
  
  const modal = document.getElementById("interstitial-ad");
  const closeBtn = document.getElementById("interstitial-close-btn");
  
  modal.style.display = "flex";
  closeBtn.style.display = "none";

  setTimeout(() => { closeBtn.style.display = "block"; }, 3000);
}

function fermerPubliciteInterstitielle() {
  document.getElementById("interstitial-ad").style.display = "none";
  if (typeof ACTION_POST_INTERSTITIELLE === "function") {
    ACTION_POST_INTERSTITIELLE();
    ACTION_POST_INTERSTITIELLE = null;
  }
}

/* --- GESTION DES MODALS --- */
function ouvrirModal(id) {
  const modal = document.getElementById(`modal-${id}`);
  if (modal) {
    modal.style.display = "flex";
    if (id === "vip") rafraichirEspaceVip();
    if (id === "profil") changerOngletProfil(ONGLE_PROFIL_ACTIF);
    if (id === "admin-panel") chargerConsoleAdmin();
  }
}

function fermerModal(id) {
  const modal = document.getElementById(`modal-${id}`);
  if (modal) modal.style.display = "none";
  if (id === "boost-pub") clearInterval(COMPTEUR_INTERVAL);
}

/* --- FLUX PUBLIC --- */
async function loadFeed() {
  try {
    const res = await fetch(`${API}/feed`);
    if (!res.ok) throw new Error("Erreur");
    toutesLesAnnonces = await res.json();
    filtrerEtAfficherFlux(toutesLesAnnonces);
  } catch (e) {
    document.getElementById("feed").innerHTML = `<p style="text-align:center; color:var(--danger);">Impossible de charger le flux.</p>`;
  }
}

function filtrerEtAfficherFlux(listeAnnonces, modeRechercheActive = false) {
  const feed = document.getElementById("feed");
  const resetBtn = document.getElementById("reset-btn");
  const feedTitle = document.getElementById("feed-title");

  if (!feed) return;
  feed.innerHTML = "";

  if (resetBtn) resetBtn.style.display = modeRechercheActive ? "block" : "none";
  if (feedTitle) feedTitle.textContent = modeRechercheActive ? "Résultats de recherche" : "Annonces récentes";

  if (listeAnnonces.length === 0) {
    feed.innerHTML = `<p style="text-align:center; color:var(--text-light); padding:20px;">Aucune annonce trouvée.</p>`;
    return;
  }

  listeAnnonces.forEach(a => {
    const cardClass = a.is_vip ? "annonce-card vip-premium" : "annonce-card";
    const statusBadge = a.statut === "occupe" ? 
      `<span class="badge-status status-occupe">🔴 Occupé</span>` : 
      `<span class="badge-status status-disponible">🟢 Disponible</span>`;

    let galleryHtml = "";
    if (a.images && a.images.length > 0) {
      galleryHtml = `<div class="gallery">`;
      a.images.forEach(url => { galleryHtml += `<img src="${url}" class="gallery-item">`; });
      galleryHtml += `</div>`;
    }

    const actionsHtml = `
      <button class="btn-contact" onclick="intercepterAppel('${a.telephone}')">📞 Appeler (${a.telephone || ""})</button>
      ${a.is_vip ? `<button class="btn-shop" onclick="voirBoutiqueVip('${a.telephone}')">🏪 Vitrine Pro</button>` : ""}
    `;

    feed.innerHTML += `
      <div class="${cardClass}">
        ${a.is_vip ? `<div class="vip-badge-tag">👑 Premium VIP</div>` : ""}
        <h3 style="margin:0 0 8px 0; font-size:1.25rem;">${a.titre || ""}</h3>
        <div class="annonce-price">${a.prix || 0} ${a.devise || '$'} <span style="font-size:0.85rem; font-weight:500; color:var(--text-light)">/ ${a.periode || "jour"}</span></div>
        <div class="annonce-meta">📍 ${a.ville || ""} - ${a.commune || ""}, ${a.quartier || ""}</div>
        ${a.description ? `<div class="annonce-description">${a.description}</div>` : ""}
        ${galleryHtml}
        <div class="annonce-footer">
          <div>${statusBadge}</div>
          <div class="footer-actions">${actionsHtml}</div>
        </div>
      </div>
    `;
  });
}

function intercepterAppel(tel) {
  declencherPubliciteInterstitielle(() => {
    window.location.href = `tel:${tel}`;
  }, "Appel Direct Sécurisé", "Connexion avec le loueur après cette annonce AdSense...");
}

function preparerModification(idAnnonce) {
  const a = toutesLesAnnonces.find(item => item.id === idAnnonce);
  if (!a) return;
  
  ouvrirModal("modifier-annonce");
  setVal("edit-id", a.id);
  setVal("edit-titre", a.titre);
  setVal("edit-prix", a.prix);
  setVal("edit-devise", a.devise || "$");
  setVal("edit-periode", a.periode);
  setVal("edit-statut", a.statut);
  setVal("edit-description", a.description);
  setVal("edit-ville", a.ville);
  setVal("edit-commune", a.commune);
  setVal("edit-quartier", a.quartier);
  setVal("edit-telephone", a.telephone);
}

/* --- ACTION PUBLIER SÉCURISÉE PAR COMPRESSION --- */
async function publier() {
  const btnSubmit = document.getElementById("btn-submit-standard");
  const files = document.getElementById("image")?.files;
  const telephone = val("telephone");

  if (!val("titre") || !telephone) return alert("Le titre et le téléphone sont obligatoires !");

  if(btnSubmit) { btnSubmit.disabled = true; btnSubmit.textContent = "Traitement et compression..."; }

  let images_base64 = [];
  if (files && files.length > 0) {
    for (let f of files) { 
      const compressed = await optimiserEtCompresserImage(f);
      images_base64.push(compressed); 
    }
  }

  localStorage.setItem("nia_standard_telephone", telephone);

  try {
    const res = await fetch(`${API}/annonces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: 1,
        titre: val("titre"),
        description: val("description"),
        prix: val("prix"),
        devise: val("devise"),
        periode: val("periode"),
        ville: val("ville"),
        commune: val("commune"),
        quartier: val("quartier"),
        telephone: telephone,
        statut: "disponible",
        is_vip: false,
        images_base64
      })
    });

    if (res.ok) {
      alert("Annonce publiée avec succès ! 🚀");
      fermerModal("publier");
      loadFeed();
    } else {
      alert("Erreur de sauvegarde serveur.");
    }
  } catch(e) {
    alert("Erreur lors de la mise en ligne.");
  } finally {
    if(btnSubmit) { btnSubmit.disabled = false; btnSubmit.textContent = "Mettre en ligne"; }
  }
}

/* --- RECHERCHE INTELLIGENTE --- */
function rechercher() {
  const sTitre = val("search-titre");
  const sVille = val("search-ville").toLowerCase();
  const sCommune = val("search-commune").toLowerCase();
  const sQuartier = val("search-quartier").toLowerCase();

  const resultats = toutesLesAnnonces.filter(a => {
    const matchTitre = !sTitre || correspondRechercheIntelligente(a.titre, sTitre) || correspondRechercheIntelligente(a.description, sTitre);
    const matchVille = !sVille || (a.ville && a.ville.toLowerCase().includes(sVille));
    const matchCommune = !sCommune || (a.commune && a.commune.toLowerCase().includes(sCommune));
    const matchQuartier = !sQuartier || (a.quartier && a.quartier.toLowerCase().includes(sQuartier));
    return matchTitre && matchVille && matchCommune && matchQuartier;
  });

  fermerModal("rechercher");
  filtrerEtAfficherFlux(resultats, true);
}

function annulerRecherche() {
  document.getElementById("shop-header-container").innerHTML = "";
  setVal("search-titre", "");
  filtrerEtAfficherFlux(toutesLesAnnonces, false);
}

/* --- ESPACE VIP --- */
function rafraichirEspaceVip() {
  const body = document.getElementById("vip-form-body");
  const nomBoutique = localStorage.getItem("nia_vip_nom");

  if (!nomBoutique) {
    body.innerHTML = `
      <div class="form-group full-width"><p style="margin:0; color:var(--text-light)">Devenez membre VIP pour obtenir la couronne sur vos offres et posséder votre propre vitrine commerciale.</p></div>
      <div class="form-group full-width"><label>Nom commercial de la boutique</label><input id="reg-vip-nom" placeholder="Ex: Élite Électronique"></div>
      <div class="form-group full-width"><label>Téléphone Professionnel VIP</label><input id="reg-vip-tel" type="tel" placeholder="Ex: 083..."></div>
      <button class="modal-submit-btn" style="background:linear-gradient(135deg, var(--vip-gold) 0%, #b45309 100%)" onclick="creerBoutiqueVipLocal()">👑 Activer mon Profil VIP</button>
    `;
  } else {
    body.innerHTML = `
      <div class="form-group full-width" style="background:var(--vip-bg); padding:12px; border-radius:10px; border:1px solid var(--vip-gold); text-align:center;">
        <span style="font-weight:800; color:#92400e;">🏪 Boutique VIP : ${nomBoutique}</span>
      </div>
      <div class="form-group full-width"><label>Nom de l'article VIP</label><input id="vip-titre"></div>
      <div class="form-group"><label>Prix</label>
        <div class="price-container">
          <input id="vip-prix" type="number" style="flex:2;">
          <select id="vip-devise" style="flex:1;"><option value="$">$</option><option value="FC">FC</option></select>
        </div>
      </div>
      <div class="form-group"><label>Période</label><select id="vip-periode"><option value="jour">par jour</option><option value="heure">par heure</option></select></div>
      <div class="form-group full-width"><label>Description VIP</label><textarea id="vip-description"></textarea></div>
      <div class="form-group"><label>Ville</label><input id="vip-ville" value="Lubumbashi"></div>
      <div class="form-group"><label>Commune</label><input id="vip-commune"></div>
      <div class="form-group"><label>Quartier</label><input id="vip-quartier"></div>
      <div class="form-group full-width"><label>Photos du produit</label><input id="vip-image" type="file" multiple accept="image/*"></div>
      <button id="btn-submit-vip" class="modal-submit-btn" style="background:linear-gradient(135deg, var(--vip-gold) 0%, #b45309 100%)" onclick="publierAnnonceVip()">🚀 Publier en Premium VIP</button>
      <button class="modal-submit-btn" style="background:#e2e8f0; color:var(--text); box-shadow:none; margin-top:5px;" onclick="supprimerMaBoutiqueVip()">Quitter le Programme VIP</button>
    `;
  }
}

function creerBoutiqueVipLocal() {
  const nom = val("reg-vip-nom");
  const tel = val("reg-vip-tel");
  if (!nom || !tel) return alert("Champs obligatoires !");
  localStorage.setItem("nia_vip_nom", nom);
  localStorage.setItem("nia_vip_telephone", tel);
  rafraichirEspaceVip();
}

function supprimerMaBoutiqueVip() {
  if (confirm("Désactiver votre espace VIP ?")) {
    localStorage.removeItem("nia_vip_nom");
    localStorage.removeItem("nia_vip_telephone");
    fermerModal("vip");
  }
}

async function publierAnnonceVip() {
  const btnSubmit = document.getElementById("btn-submit-vip");
  const files = document.getElementById("vip-image")?.files;
  if (!val("vip-titre")) return alert("Le titre est requis !");

  if(btnSubmit) { btnSubmit.disabled = true; btnSubmit.textContent = "Compression des photos..."; }

  let images_base64 = [];
  if (files && files.length > 0) {
    for (let file of files) { 
      const compressed = await optimiserEtCompresserImage(file);
      images_base64.push(compressed); 
    }
  }

  try {
    const res = await fetch(`${API}/annonces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: 100,
        titre: val("vip-titre"),
        description: val("vip-description"),
        prix: val("vip-prix"),
        devise: val("vip-devise"),
        periode: val("vip-periode"),
        ville: val("vip-ville"),
        commune: val("vip-commune"),
        quartier: val("vip-quartier"),
        telephone: localStorage.getItem("nia_vip_telephone"),
        statut: "disponible",
        is_vip: true,
        images_base64
      })
    });

    if (res.ok) {
      alert("Offre VIP en ligne ! 👑");
      fermerModal("vip");
      loadFeed();
    }
  } catch(e) {
    alert("Erreur d'envoi VIP");
  } finally {
    if(btnSubmit) { btnSubmit.disabled = false; btnSubmit.textContent = "Publier en Premium VIP"; }
  }
}

function voirBoutiqueVip(telBoutique) {
  const offresBoutique = toutesLesAnnonces.filter(a => a.telephone === telBoutique);
  const bannerContainer = document.getElementById("shop-header-container");
  if (bannerContainer) {
    bannerContainer.innerHTML = `
      <div class="shop-banner">
        <h2>👑 Vitrine Commerciale Premium VIP</h2>
        <p>Contact direct : 📞 ${telBoutique} — Articles vérifiés en stock</p>
      </div>
    `;
  }
  filtrerEtAfficherFlux(offresBoutique, true);
}

/* --- PROFIL SÉPARÉ --- */
function ouvrirEspaceProfilGeneral() { ouvrirModal("profil"); }

function changerOngletProfil(type) {
  ONGLE_PROFIL_ACTIF = type;
  document.getElementById("tab-standard-btn").style.background = type === "standard" ? "var(--primary)" : "#e2e8f0";
  document.getElementById("tab-standard-btn").style.color = type === "standard" ? "white" : "var(--text)";
  document.getElementById("tab-vip-btn").style.background = type === "vip" ? "var(--vip-gold)" : "#e2e8f0";
  document.getElementById("tab-vip-btn").style.color = type === "vip" ? "white" : "var(--text)";

  const content = document.getElementById("profil-view-content");
  const telephoneActif = type === "vip" ? localStorage.getItem("nia_vip_telephone") : localStorage.getItem("nia_standard_telephone");

  if (!telephoneActif) {
    content.innerHTML = `<p style="text-align:center; padding:20px; color:var(--text-light)">Aucune publication enregistrée.</p>`;
    return;
  }

  const mesAnnonces = toutesLesAnnonces.filter(a => a.telephone === telephoneActif && a.is_vip === (type === "vip"));
  
  let html = `<p style="font-weight:bold;">Vos publications actives (${mesAnnonces.length}) :</p>`;
  if(mesAnnonces.length === 0) {
    html += `<p style="color:var(--text-light); font-size:0.85rem;">Aucune annonce active.</p>`;
  } else {
    mesAnnonces.forEach(a => {
      html += `
        <div style="background:#f1f5f9; padding:12px; border-radius:10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; font-size:0.9rem;">${a.titre}</div>
            <div style="font-size:0.8rem; color:var(--primary); font-weight:bold;">${a.prix} ${a.devise} / ${a.periode}</div>
          </div>
          <div style="display:flex; gap:4px;">
            <button class="btn-boost" style="padding:5px 8px; font-size:0.75rem;" onclick="fermerModal('profil'); intercepterBoosterAdSense(${a.id});">🚀 Booster</button>
            <button class="btn-edit" style="padding:5px 8px; font-size:0.75rem;" onclick="fermerModal('profil'); preparerModification(${a.id});">📝</button>
            <button class="btn-delete" style="padding:5px 8px; font-size:0.75rem;" onclick="fermerModal('profil'); supprimerAnnonce(${a.id});">🗑️</button>
          </div>
        </div>
      `;
    });
  }
  content.innerHTML = html;
}

function intercepterBoosterAdSense(idAnnonce) {
  declencherPubliciteInterstitielle(() => { ouvrirBoosterAdSense(idAnnonce); }, "AdSense Premium Interstitiel", "Votre option de boost se déverrouille immédiatement après ce spot...");
}

function ouvrirBoosterAdSense(idAnnonce) {
  ID_BOOST_EN_COURS = idAnnonce;
  ouvrirModal("boost-pub");
  
  let compte = 15;
  const tplCompteur = document.getElementById("countdown");
  const btnFinal = document.getElementById("btn-finaliser-boost");

  if(tplCompteur) tplCompteur.textContent = compte;
  if(btnFinal) btnFinal.style.display = "none";

  clearInterval(COMPTEUR_INTERVAL);
  COMPTEUR_INTERVAL = setInterval(() => {
    compte--;
    if(tplCompteur) tplCompteur.textContent = compte;
    if (compte <= 0) {
      clearInterval(COMPTEUR_INTERVAL);
      if(btnFinal) btnFinal.style.display = "block";
    }
  }, 1000);
}

async function executerRemonteeBdd() {
  if (!ID_BOOST_EN_COURS) return;
  const res = await fetch(`${API}/annonces/${ID_BOOST_EN_COURS}/boost`, { method: "POST" });
  if (res.ok) {
    alert("Annonce propulsée au sommet ! ⚡");
    fermerModal("boost-pub");
    loadFeed();
  }
}

async function sauvegarderModificationAnnonce() {
  const id = val("edit-id");
  const res = await fetch(`${API}/annonces/${id}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titre: val("edit-titre"),
      prix: val("edit-prix"),
      devise: val("edit-devise"),
      periode: val("edit-periode"),
      statut: val("edit-statut"),
      description: val("edit-description"),
      ville: val("edit-ville"),
      commune: val("edit-commune"),
      quartier: val("edit-quartier"),
      telephone: val("edit-telephone")
    })
  });

  if (res.ok) {
    alert("Sauvegarde validée ! 💾");
    fermerModal("modifier-annonce");
    loadFeed();
  }
}

async function supprimerAnnonce(id) {
  if (confirm("Supprimer définitivement ?")) {
    const res = await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    if (res.ok) loadFeed();
  }
}

/* --- CONSOLE ADMIN --- */
async function chargerConsoleAdmin() {
  try {
    const resStats = await fetch(`${API}/admin/stats`);
    const stats = await resStats.json();
    
    document.getElementById("adm-stat-total").textContent = stats.total || 0;
    document.getElementById("adm-stat-vip").textContent = stats.vip || 0;
    document.getElementById("adm-stat-stand").textContent = stats.standard || 0;

    const selectVille = document.getElementById("adm-filter-ville");
    if(selectVille) {
      const villesUniques = [...new Set(toutesLesAnnonces.map(a => a.ville || "Sans Ville"))];
      selectVille.innerHTML = `<option value="all">Toutes les Villes</option>`;
      villesUniques.forEach(v => {
        selectVille.innerHTML += `<option value="${v.toLowerCase()}">${v}</option>`;
      });
    }
    filtrerIndexationAnnoncesAdmin();
  } catch (e) { console.error("Erreur admin"); }
}

function filtrerIndexationAnnoncesAdmin() {
  const fVille = val("adm-filter-ville").toLowerCase();
  const fType = val("adm-filter-type");
  const container = document.getElementById("admin-liste-moderat-annonces");

  if (!container) return;
  container.innerHTML = "";

  const filtree = toutesLesAnnonces.filter(a => {
    const matchV = fVille === "all" || (a.ville && a.ville.toLowerCase() === fVille);
    const matchT = fType === "all" || (fType === "vip" && a.is_vip) || (fType === "standard" && !a.is_vip);
    return matchV && matchT;
  });

  filtree.forEach(a => {
    container.innerHTML += `
      <div class="admin-annonce-item">
        <div>
          <strong style="color:#f8fafc; font-size:0.9rem;">${a.titre}</strong>
          <div style="font-size:0.75rem; color:#94a3b8;">📍 ${a.ville} — Tel: ${a.telephone} (${a.is_vip ? 'VIP' : 'Standard'})</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn-edit" style="padding:5px 10px; font-size:0.75rem;" onclick="fermerModal('admin-panel'); preparerModification(${a.id})">⚙️ Éditer</button>
          <button class="btn-delete" style="padding:5px 10px; font-size:0.75rem;" onclick="adminSupprimerAnnonceDirecte(${a.id})">🔥 Bannir</button>
        </div>
      </div>
    `;
  });
}

async function adminSupprimerAnnonceDirecte(id) {
  if (confirm("ADMIN : Confirmer le bannissement immédiat ?")) {
    const res = await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    if (res.ok) { loadFeed(); chargerConsoleAdmin(); }
  }
}

function initTriggerAdminSecret() {
  const gearBtn = document.getElementById("gear-admin-trigger");
  if (!gearBtn) return;
  let timerAppui;
  
  gearBtn.addEventListener("mousedown", () => { timerAppui = setTimeout(() => ouvrirModal("admin-panel"), 1500); });
  gearBtn.addEventListener("mouseup", () => clearTimeout(timerAppui));
  gearBtn.addEventListener("touchstart", () => { timerAppui = setTimeout(() => ouvrirModal("admin-panel"), 1500); }, { passive: true });
  gearBtn.addEventListener("touchend", () => clearTimeout(timerAppui));
}

document.addEventListener("DOMContentLoaded", () => {
  loadFeed();
  initTriggerAdminSecret();
  initialiserPubliciteBanniereRotative();
});
