const API = "https://nia-rdc-2.onrender.com";

/* --- VARIABLES D'ÉTAT GLOBALES --- */
let toutesLesAnnonces = [];
let ID_BOOST_EN_COURS = null;
let COMPTEUR_INTERVAL = null;

/* --- UTILITAIRES --- */
function val(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function setVal(id, valeur) {
  const el = document.getElementById(id);
  if (el) el.value = valeur;
}

/* --- GESTION DES MODALS --- */
function ouvrirModal(id) {
  const modal = document.getElementById(`modal-${id}`);
  if (modal) {
    modal.style.display = "flex";
    // Actions spécifiques lors de l'ouverture
    if (id === "vip") rafraichirEspaceVip();
    if (id === "profil") rafraichirEspaceProfil();
    if (id === "admin-panel") chargerConsoleAdmin();
  }
}

function fermerModal(id) {
  const modal = document.getElementById(`modal-${id}`);
  if (modal) modal.style.display = "none";
  if (id === "boost-pub") clearInterval(COMPTEUR_INTERVAL);
}

/* --- CHARGEMENT & AFFICHAGE DU FLUX PUBLIC --- */
async function loadFeed() {
  try {
    const res = await fetch(`${API}/feed`);
    if (!res.ok) throw new Error("Erreur serveur");
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

  // Affichage du bouton de réinitialisation si un filtre est actif
  if (resetBtn) resetBtn.style.display = modeRechercheActive ? "block" : "none";
  if (feedTitle) feedTitle.textContent = modeRechercheActive ? "Résultats de recherche" : "Annonces récentes";

  if (listeAnnonces.length === 0) {
    feed.innerHTML = `<p style="text-align:center; color:var(--text-light); padding:20px;">Aucune annonce ne correspond à ces critères.</p>`;
    return;
  }

  // Tri automatique : Les VIP en premier, puis par date décroissante (géré côté serveur ou ici par sécurité)
  const annoncesTriees = [...listeAnnonces].sort((a, b) => {
    if (a.statut === "vip" && b.statut !== "vip") return -1;
    if (a.statut !== "vip" && b.statut === "vip") return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  annoncesTriees.forEach(a => {
    const isVip = a.statut === "vip";
    const cardClass = isVip ? "annonce-card vip-premium" : "annonce-card";
    const statusBadge = a.statut === "occupe" ? 
      `<span class="badge-status status-occupe">🔴 Occupé</span>` : 
      `<span class="badge-status status-disponible">🟢 Disponible</span>`;

    // Génération de la galerie d'images
    let galleryHtml = "";
    if (a.images && a.images.length > 0) {
      galleryHtml = `<div class="gallery">`;
      a.images.forEach(imgUrl => {
        galleryHtml += `<img src="${imgUrl}" class="gallery-item" alt="${a.titre || 'Objet'}">`;
      });
      galleryHtml += `</div>`;
    }

    // Détection si l'utilisateur connecté possède cette annonce (Simulé avec le numéro de téléphone local ou ID)
    const telBoutiqueLocal = localStorage.getItem("nia_vip_telephone") || localStorage.getItem("nia_standard_telephone");
    const estProprietaire = telBoutiqueLocal && telBoutiqueLocal === a.telephone;

    let actionsHtml = "";
    if (estProprietaire) {
      actionsHtml = `
        <button class="btn-boost" onclick="ouvrirBoosterAdSense(${a.id})">🚀 Booster</button>
        <button class="btn-edit" onclick="ouvrirModifierAnnonce(${JSON.stringify(a).replace(/"/g, '&quot;')})">📝 Modifier</button>
        <button class="btn-delete" onclick="supprimerAnnonce(${a.id})">🗑️ Supprimer</button>
      `;
    } else {
      actionsHtml = `
        <a href="tel:${a.telephone}" class="btn-contact">📞 Appeler (${a.telephone || ""})</a>
        ${isVip ? `<button class="btn-shop" onclick="voirBoutiqueVip('${a.telephone}')">🏪 Boutique</button>` : ""}
      `;
    }

    feed.innerHTML += `
      <div class="${cardClass}">
        ${isVip ? `<div class="vip-badge-tag">👑 Premium VIP</div>` : ""}
        <h3 style="margin:0 0 8px 0; font-size:1.25rem;">${a.titre || ""}</h3>
        <div class="annonce-price">${a.prix || 0} USD <span style="font-size:0.85rem; font-weight:500; color:var(--text-light)">/ ${a.periode || "jour"}</span></div>
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

/* --- FONCTION DE PUBLICATION STANDARD --- */
async function publier() {
  const files = document.getElementById("image")?.files;
  let images_base64 = [];

  if (files && files.length > 0) {
    for (let file of files) {
      const b64 = await toBase64(file);
      images_base64.push(b64);
    }
  }

  const telephone = val("telephone");
  if (!val("titre") || !telephone) return alert("Le titre et le numéro de téléphone sont obligatoires !");

  // Enregistrement du numéro localement pour reconnaître ses propres annonces
  localStorage.setItem("nia_standard_telephone", telephone);

  const res = await fetch(`${API}/annonces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: 1,
      titre: val("titre"),
      description: val("description"),
      prix: val("prix"),
      periode: val("periode"),
      ville: val("ville"),
      commune: val("commune"),
      quartier: val("quartier"),
      telephone: telephone,
      statut: "disponible",
      images_base64
    })
  });

  if (!res.ok) return alert("Erreur lors de la mise en ligne.");

  alert("Annonce publiée avec succès ! 🚀");
  fermerModal("publier");
  loadFeed();
}

/* --- RECHERCHE ET FILTRAGE UNIVERSEL --- */
function rechercher() {
  const sTitre = val("search-titre").toLowerCase();
  const sVille = val("search-ville").toLowerCase();
  const sCommune = val("search-commune").toLowerCase();
  const sQuartier = val("search-quartier").toLowerCase();

  const resultats = toutesLesAnnonces.filter(a => {
    const matchTitre = !sTitre || (a.titre && a.titre.toLowerCase().includes(sTitre)) || (a.description && a.description.toLowerCase().includes(sTitre));
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
  setVal("search-commune", "");
  setVal("search-quartier", "");
  filtrerEtAfficherFlux(toutesLesAnnonces, false);
}

/* --- ESPACE BOUTIQUE PRO VIP --- */
function rafraichirEspaceVip() {
  const body = document.getElementById("vip-form-body");
  const nomBoutique = localStorage.getItem("nia_vip_nom");
  const telBoutique = localStorage.getItem("nia_vip_telephone");

  if (!nomBoutique) {
    // Écran de création de Boutique VIP
    body.innerHTML = `
      <div class="form-group full-width"><p style="margin:0; color:var(--text-light)">Devenez membre VIP pour obtenir un badge Couronne sur vos annonces et créer votre vitrine pro.</p></div>
      <div class="form-group full-width"><label>Nom commercial de la boutique</label><input id="reg-vip-nom" placeholder="Ex: Élite Électronique"></div>
      <div class="form-group full-width"><label>Numéro de Téléphone Professionnel</label><input id="reg-vip-tel" type="tel" placeholder="Ex: +243..."></div>
      <button class="modal-submit-btn" style="background:linear-gradient(135deg, var(--vip-gold) 0%, #b45309 100%)" onclick="creerBoutiqueVipLocal()">👑 Activer mon Espace VIP Pro</button>
    `;
  } else {
    // Écran de gestion et de publication VIP dédiée
    body.innerHTML = `
      <div class="form-group full-width" style="background:var(--vip-bg); padding:12px; border-radius:10px; border:1px solid var(--vip-gold); text-align:center;">
        <span style="font-weight:800; color:#92400e;">🏪 Boutique Active : ${nomBoutique}</span>
      </div>
      <div class="form-group full-width"><label>Nom de l'article VIP</label><input id="vip-titre"></div>
      <div class="form-group"><label>Prix (USD)</label><input id="vip-prix" type="number"></div>
      <div class="form-group"><label>Période</label><select id="vip-periode"><option value="jour">par jour</option><option value="heure">par heure</option></select></div>
      <div class="form-group full-width"><label>Description VIP</label><textarea id="vip-description"></textarea></div>
      <div class="form-group"><label>Ville</label><input id="vip-ville" value="Lubumbashi"></div>
      <div class="form-group"><label>Commune</label><input id="vip-commune"></div>
      <div class="form-group"><label>Quartier</label><input id="vip-quartier"></div>
      <div class="form-group full-width"><label>Photos du produit</label><input id="vip-image" type="file" multiple></div>
      <button class="modal-submit-btn" style="background:linear-gradient(135deg, var(--vip-gold) 0%, #b45309 100%)" onclick="publierAnnonceVip()">🚀 Publier en Premium VIP</button>
      <button class="modal-submit-btn" style="background:#e2e8f0; color:var(--text); box-shadow:none; margin-top:5px;" onclick="supprimerMaBoutiqueVip()">Quitter le Programme VIP</button>
    `;
  }
}

function creerBoutiqueVipLocal() {
  const nom = val("reg-vip-nom");
  const tel = val("reg-vip-tel");
  if (!nom || !tel) return alert("Veuillez remplir tous les champs !");
  localStorage.setItem("nia_vip_nom", nom);
  localStorage.setItem("nia_vip_telephone", tel);
  rafraichirEspaceVip();
  // Synchronise le bouton profil s'il y a lieu
  const btnProfil = document.getElementById("main-profile-nav-btn");
  if (btnProfil) btnProfil.innerHTML = `<span>🏪</span><span>Ma Boutique</span>`;
}

function supprimerMaBoutiqueVip() {
  if (confirm("Voulez-vous vraiment désactiver votre espace VIP ?")) {
    localStorage.removeItem("nia_vip_nom");
    localStorage.removeItem("nia_vip_telephone");
    const btnProfil = document.getElementById("main-profile-nav-btn");
    if (btnProfil) btnProfil.innerHTML = `<span>👤</span><span>Mon Profil</span>`;
    fermerModal("vip");
  }
}

async function publierAnnonceVip() {
  const files = document.getElementById("vip-image")?.files;
  let images_base64 = [];
  if (files && files.length > 0) {
    for (let file of files) {
      images_base64.push(await toBase64(file));
    }
  }

  if (!val("vip-titre")) return alert("Le titre est requis !");

  const res = await fetch(`${API}/annonces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: 100, // Identifiant arbitraire pour isoler le flux VIP
      titre: val("vip-titre"),
      description: val("vip-description"),
      prix: val("vip-prix"),
      periode: val("vip-periode"),
      ville: val("vip-ville"),
      commune: val("vip-commune"),
      quartier: val("vip-quartier"),
      telephone: localStorage.getItem("nia_vip_telephone"),
      statut: "vip",
      images_base64
    })
  });

  if (!res.ok) return alert("Erreur serveur.");
  alert("Votre offre Pro VIP est en ligne ! 👑");
  fermerModal("vip");
  loadFeed();
}

function voirBoutiqueVip(telBoutique) {
  const offresBoutique = toutesLesAnnonces.filter(a => a.telephone === telBoutique);
  const uneAnnonce = offresBoutique[0];
  const nomVitrine = (uneAnnonce && uneAnnonce.user_id === 100) ? `Vitrine Pro VIP` : `Catalogue`;

  const bannerContainer = document.getElementById("shop-header-container");
  if (bannerContainer) {
    bannerContainer.innerHTML = `
      <div class="shop-banner">
        <h2>👑 ${nomVitrine}</h2>
        <p>Contact direct : 📞 ${telBoutique} — Tous les articles disponibles</p>
      </div>
    `;
  }
  filtrerEtAfficherFlux(offresBoutique, true);
}

/* --- ESPACE PERSONNEL / PROFIL --- */
function rafraichirEspaceProfil() {
  const content = document.getElementById("profil-view-content");
  const title = document.getElementById("profil-modal-title");
  const isVip = !!localStorage.getItem("nia_vip_nom");

  const telVip = localStorage.getItem("nia_vip_telephone");
  const telStandard = localStorage.getItem("nia_standard_telephone");
  const telephoneActif = telVip || telStandard;

  if (isVip) {
    title.innerHTML = `🏪 Espace Boutique Pro`;
  } else {
    title.innerHTML = `👤 Mon Espace Standard`;
  }

  if (!telephoneActif) {
    content.innerHTML = `<p style="text-align:center; color:var(--text-light)">Vous n'avez pas encore publié d'annonces sur cet appareil.</p>`;
    return;
  }

  const mesAnnonces = toutesLesAnnonces.filter(a => a.telephone === telephoneActif);
  
  let listHtml = `<p style="font-weight:bold; margin-bottom:10px;">Vos offres enregistrées (${mesAnnonces.length}) :</p>`;
  if (mesAnnonces.length === 0) {
    listHtml += `<p style="font-size:0.9rem; color:var(--text-light)">Aucun produit actif détecté.</p>`;
  } else {
    mesAnnonces.forEach(a => {
      listHtml += `
        <div style="background:#f8fafc; border:1px solid var(--border); padding:10px; border-radius:10px; margin-bottom:8px; display:flex; justify-content:between; align-items:center; gap:10px;">
          <div style="flex:1;">
            <div style="font-weight:700; font-size:0.9rem;">${a.titre}</div>
            <div style="font-size:0.8rem; color:var(--primary); font-weight:bold;">${a.prix} USD / ${a.periode}</div>
          </div>
          <div style="display:flex; gap:5px;">
            <button class="btn-boost" style="padding:4px 8px; font-size:0.75rem;" onclick="fermerModal('profil'); ouvrirBoosterAdSense(${a.id});">🚀 Boost</button>
            <button class="btn-delete" style="padding:4px 8px; font-size:0.75rem;" onclick="fermerModal('profil'); supprimerAnnonce(${a.id});">🗑️</button>
          </div>
        </div>
      `;
    });
  }
  content.innerHTML = listHtml;
}

function ouvrirMonProfilOuMaBoutique() {
  if (localStorage.getItem("nia_vip_nom")) {
    ouvrirModal("vip");
  } else {
    ouvrirModal("profil");
  }
}

/* --- AD-BOOSTER ENGINE (REMONTEE EN HAUT DE LISTE) --- */
function ouvrirBoosterAdSense(idAnnonce) {
  ID_BOOST_EN_COURS = idAnnonce;
  ouvrirModal("boost-pub");
  
  let compteALanvers = 15;
  const tplCompteur = document.getElementById("countdown");
  const btnFinal = document.getElementById("btn-finaliser-boost");

  if(tplCompteur) tplCompteur.textContent = compteALanvers;
  if(btnFinal) btnFinal.style.display = "none";

  clearInterval(COMPTEUR_INTERVAL);
  COMPTEUR_INTERVAL = setInterval(() => {
    compteALanvers--;
    if(tplCompteur) tplCompteur.textContent = compteALanvers;
    
    if (compteALanvers <= 0) {
      clearInterval(COMPTEUR_INTERVAL);
      if(btnFinal) btnFinal.style.display = "block";
    }
  }, 1000);
}

async function executerRemonteeBdd() {
  if (!ID_BOOST_EN_COURS) return;
  const res = await fetch(`${API}/annonces/${ID_BOOST_EN_COURS}/boost`, { method: "POST" });
  if (res.ok) {
    alert("Annonce propulsée au sommet de la liste avec succès ! ⚡");
    fermerModal("boost-pub");
    loadFeed();
  } else {
    alert("Erreur lors du traitement du boost.");
  }
}

/* --- EDITION ET MODIFICATION D'UNE ANNONCE --- */
function ouvrirModifierAnnonce(a) {
  ouvrirModal("modifier-annonce");
  setVal("edit-id", a.id);
  setVal("edit-titre", a.titre);
  setVal("edit-prix", a.prix);
  setVal("edit-periode", a.periode);
  setVal("edit-statut", a.statut);
  setVal("edit-description", a.description);
  setVal("edit-ville", a.ville);
  setVal("edit-commune", a.commune);
  setVal("edit-quartier", a.quartier);
  setVal("edit-telephone", a.telephone);
}

async function sauvegarderModificationAnnonce() {
  const id = val("edit-id");
  const res = await fetch(`${API}/annonces/${id}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titre: val("edit-titre"),
      prix: val("edit-prix"),
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
    alert("Modifications enregistrées ! 💾");
    fermerModal("modifier-annonce");
    loadFeed();
  } else {
    alert("Erreur de sauvegarde.");
  }
}

/* --- SUPPRESSION DIRECTE --- */
async function supprimerAnnonce(id) {
  if (confirm("Supprimer définitivement cette publication ?")) {
    const res = await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    if (res.ok) {
      alert("Publication retirée.");
      loadFeed();
    }
  }
}

/* --- 🕶️ MODULE EXCLUSIF CONSOLE ADMIN 🕶️ --- */
async function chargerConsoleAdmin() {
  try {
    const resStats = await fetch(`${API}/admin/stats`);
    const stats = await resStats.json();
    
    document.getElementById("adm-stat-total").textContent = stats.total || 0;
    document.getElementById("adm-stat-vip").textContent = stats.vip || 0;
    document.getElementById("adm-stat-stand").textContent = stats.standard || 0;

    // Remplissage dynamique des villes pour le filtre admin
    const selectVille = document.getElementById("adm-filter-ville");
    if(selectVille) {
      const villesUniques = [...new Set(toutesLesAnnonces.map(a => a.ville || "Sans Ville"))];
      selectVille.innerHTML = `<option value="all">Toutes les Villes</option>`;
      villesUniques.forEach(v => {
        selectVille.innerHTML += `<option value="${v.toLowerCase()}">${v}</option>`;
      });
    }

    filtrerIndexationAnnoncesAdmin();
  } catch (e) { console.error("Erreur console d'administration"); }
}

function filtrerIndexationAnnoncesAdmin() {
  const fVille = val("adm-filter-ville").toLowerCase();
  const fType = val("adm-filter-type");
  const container = document.getElementById("admin-liste-moderat-annonces");

  if (!container) return;
  container.innerHTML = "";

  const filtree = toutesLesAnnonces.filter(a => {
    const matchV = fVille === "all" || (a.ville && a.ville.toLowerCase() === fVille);
    const matchT = fType === "all" || (fType === "vip" && a.statut === "vip") || (fType === "standard" && a.statut !== "vip");
    return matchV && matchT;
  });

  filtree.forEach(a => {
    container.innerHTML += `
      <div class="admin-annonce-item">
        <div>
          <strong style="color:#f8fafc; font-size:0.9rem;">${a.titre}</strong>
          <div style="font-size:0.75rem; color:#94a3b8;">📍 ${a.ville} — Tel: ${a.telephone} (${a.statut})</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn-edit" style="padding:5px 10px; font-size:0.75rem;" onclick="fermerModal('admin-panel'); ouvrirModifierAnnonce(${JSON.stringify(a).replace(/"/g, '&quot;')})">⚙️ Éditer</button>
          <button class="btn-delete" style="padding:5px 10px; font-size:0.75rem;" onclick="adminSupprimerAnnonceDirecte(${a.id})">🔥 Bannir</button>
        </div>
      </div>
    `;
  });
}

async function adminSupprimerAnnonceDirecte(id) {
  if (confirm("ADMIN : Confirmez-vous la modération forcée et la suppression immédiate ?")) {
    const res = await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    if (res.ok) {
      alert("Action modérateur appliquée !");
      loadFeed();
      chargerConsoleAdmin();
    }
  }
}

/* --- DECLENCHEURS TACTILES & CLICS DE L'ENGRENAGE SECRET --- */
function initTriggerAdminSecret() {
  const gearBtn = document.getElementById("gear-admin-trigger");
  if (!gearBtn) return;

  let timerAppui;
  
  // Événements PC / Souris
  gearBtn.addEventListener("mousedown", () => {
    timerAppui = setTimeout(() => ouvrirModal("admin-panel"), 1500); // 1.5 secondes d'appui
  });
  gearBtn.addEventListener("mouseup", () => clearTimeout(timerAppui));
  gearBtn.addEventListener("click", (e) => {
    clearTimeout(timerAppui);
    // Un clic normal rappelle un message discret
    console.log("NIA Engine : Maintenez le clic enfoncé 1.5s pour déverrouiller la console.");
  });

  // Événements Écrans Tactiles / Mobile
  gearBtn.addEventListener("touchstart", (e) => {
    timerAppui = setTimeout(() => ouvrirModal("admin-panel"), 1500);
  }, { passive: true });
  gearBtn.addEventListener("touchend", () => clearTimeout(timerAppui));
}

/* --- CONVERTISSEUR BASE64 --- */
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => resolve(r.result);
    r.onerror = reject;
  });
}

/* --- COMMANDE INITIALE AU DEMARRAGE --- */
document.addEventListener("DOMContentLoaded", () => {
  loadFeed();
  initTriggerAdminSecret();

  // Remet le bouton Pro à jour si la boutique a déjà été créée
  if (localStorage.getItem("nia_vip_nom")) {
    const btnProfil = document.getElementById("main-profile-nav-btn");
    if (btnProfil) btnProfil.innerHTML = `<span>🏪</span><span>Ma Boutique</span>`;
  }
});
